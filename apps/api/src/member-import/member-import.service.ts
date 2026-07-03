import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Queue } from 'bullmq';
import { PrismaService } from 'nestjs-prisma';

import { parseCsv } from '../common/utils/csv.util';
import {
  ROLL_NUMBER_MAX_LENGTH,
  ROLL_NUMBER_REGEX,
} from '../students/students.constants';
import { InviteUserDto } from '../tenants/invitations/dto';
import { InvitationsService } from '../tenants/invitations/invitations.service';
import {
  ImportRole,
  MEMBER_IMPORT_JOB,
  MEMBER_IMPORT_MAX_ROWS,
  MEMBER_IMPORT_QUEUE,
  MemberImportJobData,
  MemberImportResult,
  MemberImportSkip,
} from './member-import.constants';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NAME_MAX_LENGTH = 100;
const EMERGENCY_PHONE_MAX_LENGTH = 20;

// Row shape after structural parsing, before per-row account creation.
interface ParsedRow {
  line: number;
  email: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  admissionDate?: string;
  emergencyPhone?: string;
}

/**
 * Reusable CSV bulk-import engine shared by students and parents. Both entities
 * are created through the same InvitationsService.inviteUser path (which builds
 * the User + INVITED membership + role + profile); this service only adds
 * CSV parsing, per-row validation, and partial-success reporting on top.
 *
 * Imports run in the background and pre-create accounts (preCreate: true), so
 * each member lands in the PENDING state — details filled, no token, no email.
 * The lifecycle is then PENDING -> INVITED (a later invite) -> ACTIVE (accept).
 */
@Injectable()
export class MemberImportService {
  private readonly logger = new Logger(MemberImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationsService: InvitationsService,
    @InjectQueue(MEMBER_IMPORT_QUEUE)
    private readonly queue: Queue<MemberImportJobData, MemberImportResult>,
  ) {}

  // ---------------------------------------------------------------------------
  // Queue plumbing (called by controllers)
  // ---------------------------------------------------------------------------
  async enqueue(data: MemberImportJobData): Promise<{ jobId: string }> {
    const job = await this.queue.add(MEMBER_IMPORT_JOB, data);
    return { jobId: String(job.id) };
  }

  async getStatus(tenantId: string, jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job || job.data.tenantId !== tenantId) {
      throw new NotFoundException('Import job not found or has expired.');
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;

    return {
      jobId: job.id,
      state,
      progress,
      result: state === 'completed' ? job.returnvalue : undefined,
      error: state === 'failed' ? job.failedReason : undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Job body (called by the processor)
  // ---------------------------------------------------------------------------
  async processImport(data: MemberImportJobData): Promise<MemberImportResult> {
    const { role, tenantId, userId, csvContent, scopes, isAdmin } = data;

    const roleId = await this.resolveRoleId(tenantId, role);

    const { rows, skipped } = this.parseRows(csvContent, role);
    const totalRows = rows.length + skipped.length;

    let created = 0;
    const seenEmails = new Set<string>();

    for (const row of rows) {
      const emailKey = row.email.toLowerCase();
      if (seenEmails.has(emailKey)) {
        skipped.push({
          row: row.line,
          email: row.email,
          reason: 'Duplicate email within the file.',
        });
        continue;
      }
      seenEmails.add(emailKey);

      const dto: InviteUserDto = {
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        roleIds: [roleId],
        ...(role === 'student'
          ? { rollNumber: row.rollNumber, admissionDate: row.admissionDate }
          : { emergencyPhone: row.emergencyPhone }),
      };

      try {
        await this.invitationsService.inviteUser(
          dto,
          tenantId,
          userId,
          scopes,
          isAdmin,
          { preCreate: true },
        );
        created++;
      } catch (err) {
        skipped.push({
          row: row.line,
          email: row.email,
          reason: err instanceof Error ? err.message : 'Failed to import row.',
        });
      }
    }

    skipped.sort((a, b) => a.row - b.row);

    this.logger.log(
      `Member import: ${JSON.stringify({
        action: 'BULK_IMPORT_MEMBERS',
        role,
        tenantId,
        actorUserId: userId,
        totalRows,
        created,
        skipped: skipped.length,
      })}`,
    );

    return { totalRows, created, skipped };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private async resolveRoleId(
    tenantId: string,
    role: ImportRole,
  ): Promise<string> {
    const match = await this.prisma.role.findFirst({
      where: {
        tenantId,
        name: { equals: role, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!match) {
      throw new BadRequestException(
        `No "${role}" role is configured for this tenant.`,
      );
    }
    return match.id;
  }

  /** Parses + validates rows, returning valid rows and structural skips. */
  private parseRows(
    csvContent: string,
    role: ImportRole,
  ): { rows: ParsedRow[]; skipped: MemberImportSkip[] } {
    const matrix = parseCsv(csvContent);
    if (matrix.length === 0) {
      throw new BadRequestException('The CSV file is empty.');
    }

    const header = matrix[0].map((h) => h.trim().toLowerCase());
    const emailIdx = header.indexOf('email');
    const firstNameIdx = header.indexOf('firstname');
    const lastNameIdx = header.indexOf('lastname');
    const rollIdx = header.indexOf('rollnumber');
    const admissionIdx = header.indexOf('admissiondate');
    const emergencyIdx = header.indexOf('emergencyphone');

    if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
      throw new BadRequestException(
        'CSV header must include "email", "firstName", and "lastName" columns.',
      );
    }

    const dataRows = matrix.slice(1);
    if (dataRows.length === 0) {
      throw new BadRequestException('The CSV file has no data rows.');
    }
    if (dataRows.length > MEMBER_IMPORT_MAX_ROWS) {
      throw new BadRequestException(
        `Too many rows (${dataRows.length}). The maximum per import is ${MEMBER_IMPORT_MAX_ROWS}.`,
      );
    }

    const rows: ParsedRow[] = [];
    const skipped: MemberImportSkip[] = [];

    dataRows.forEach((cells, i) => {
      const line = i + 2; // header occupies line 1
      const email = (cells[emailIdx] ?? '').trim();
      const firstName = (cells[firstNameIdx] ?? '').trim();
      const lastName = (cells[lastNameIdx] ?? '').trim();

      const fail = (reason: string) =>
        skipped.push({ row: line, email: email || null, reason });

      if (!email || !EMAIL_REGEX.test(email)) {
        return fail('A valid email is required.');
      }
      if (!firstName || firstName.length > NAME_MAX_LENGTH) {
        return fail('First name is required (max 100 characters).');
      }
      if (!lastName || lastName.length > NAME_MAX_LENGTH) {
        return fail('Last name is required (max 100 characters).');
      }

      const parsed: ParsedRow = { line, email, firstName, lastName };

      if (role === 'student') {
        const rollNumber = rollIdx >= 0 ? (cells[rollIdx] ?? '').trim() : '';
        const admission =
          admissionIdx >= 0 ? (cells[admissionIdx] ?? '').trim() : '';

        if (rollNumber) {
          if (rollNumber.length > ROLL_NUMBER_MAX_LENGTH) {
            return fail(
              `Roll number exceeds ${ROLL_NUMBER_MAX_LENGTH} characters.`,
            );
          }
          if (!ROLL_NUMBER_REGEX.test(rollNumber)) {
            return fail(
              'Roll number may only contain letters, digits, and hyphens.',
            );
          }
          parsed.rollNumber = rollNumber;
        }
        if (admission) {
          if (!ISO_DATE_REGEX.test(admission) || isNaN(Date.parse(admission))) {
            return fail(
              `Invalid admission date "${admission}" (expected YYYY-MM-DD).`,
            );
          }
          parsed.admissionDate = admission;
        }
      } else {
        const emergency =
          emergencyIdx >= 0 ? (cells[emergencyIdx] ?? '').trim() : '';
        if (emergency) {
          if (emergency.length > EMERGENCY_PHONE_MAX_LENGTH) {
            return fail(
              `Emergency phone exceeds ${EMERGENCY_PHONE_MAX_LENGTH} characters.`,
            );
          }
          parsed.emergencyPhone = emergency;
        }
      }

      rows.push(parsed);
    });

    return { rows, skipped };
  }
}
