import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import {
  ChangeStudentStatusDto,
  CreateStudentDto,
  UpdateStudentDto,
} from './dto';
import {
  STUDENT_STATUS,
  STUDENT_STATUS_TRANSITIONS,
  StudentStatus,
} from './students.constants';

// ---------------------------------------------------------------------------
// Shared user select shape re-used across multiple queries
// ---------------------------------------------------------------------------
const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

// Membership → User select used when resolving the portal account of a student
const MEMBERSHIP_WITH_USER = {
  select: {
    id: true,
    status: true,
    user: { select: USER_SELECT },
  },
} as const;

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // LIST — paginated, searchable, filterable by status
  // ---------------------------------------------------------------------------
  async findAll(
    tenantId: string,
    search?: string,
    status?: string,
    limit = 20,
    cursor?: string,
  ) {
    const take = limit > 0 ? limit : 20;

    // Search filter: name (via linked portal user) OR roll number
    const searchFilter = search
      ? {
          OR: [
            {
              membership: {
                user: {
                  firstName: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
            {
              membership: {
                user: {
                  lastName: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
            {
              rollNumber: { contains: search, mode: 'insensitive' as const },
            },
          ],
        }
      : {};

    const statusFilter =
      status && STUDENT_STATUS[status as StudentStatus] ? { status } : {};

    const students = await this.prisma.studentProfile.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...statusFilter,
        ...searchFilter,
      },
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        membership: MEMBERSHIP_WITH_USER,
        _count: {
          select: {
            enrolments: true,
            parents: true,
          },
        },
      },
    });

    const hasNextPage = students.length > take;
    if (hasNextPage) students.pop();
    const nextCursor = hasNextPage ? students[students.length - 1].id : null;

    return {
      students: students.map((s) => this.formatListItem(s)),
      nextCursor,
    };
  }

  // ---------------------------------------------------------------------------
  // DETAIL — full profile, enrolments, linked parents, audit trail
  // ---------------------------------------------------------------------------
  async findOne(tenantId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId },
      include: {
        membership: MEMBERSHIP_WITH_USER,
        creator: { select: USER_SELECT },
        updater: { select: USER_SELECT },
        enrolments: {
          where: { deletedAt: null },
          include: {
            class: {
              include: {
                program: { select: { id: true, name: true, code: true } },
                academicTerm: {
                  select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true,
                  },
                },
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        parents: {
          include: {
            parent: {
              include: {
                membership: MEMBERSHIP_WITH_USER,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    return this.formatDetail(student);
  }

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------
  async create(tenantId: string, userId: string, dto: CreateStudentDto) {
    // 1. Validate roll number uniqueness within tenant
    const existing = await this.prisma.studentProfile.findFirst({
      where: { tenantId, rollNumber: dto.rollNumber, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        `Roll number "${dto.rollNumber}" is already in use within this tenant.`,
      );
    }

    // 2. Validate the membership link if provided
    if (dto.tenantMembershipId) {
      await this.validateMembershipLink(tenantId, dto.tenantMembershipId);
    }

    const admissionDate = dto.admissionDate
      ? new Date(dto.admissionDate)
      : new Date();

    const student = await this.prisma.studentProfile.create({
      data: {
        tenantId,
        tenantMembershipId: dto.tenantMembershipId ?? null,
        rollNumber: dto.rollNumber,
        admissionDate,
        status: STUDENT_STATUS.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Student created structure: ${JSON.stringify({
        action: 'CREATE_STUDENT',
        studentId: student.id,
        tenantId,
        actorUserId: userId,
        rollNumber: dto.rollNumber,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return this.findOne(tenantId, student.id);
  }

  // ---------------------------------------------------------------------------
  // UPDATE — profile fields only (roll number and status are excluded)
  // ---------------------------------------------------------------------------
  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateStudentDto,
  ) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    // Validate the new membership link if being changed
    if (
      dto.tenantMembershipId !== undefined &&
      dto.tenantMembershipId !== null
    ) {
      await this.validateMembershipLink(tenantId, dto.tenantMembershipId);
    }

    // Roll number edit uniqueness check
    if (dto.rollNumber && dto.rollNumber !== student.rollNumber) {
      const duplicate = await this.prisma.studentProfile.findFirst({
        where: {
          tenantId,
          rollNumber: dto.rollNumber,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `Roll number "${dto.rollNumber}" is already in use within this tenant.`,
        );
      }
    }

    await this.prisma.studentProfile.update({
      where: { id },
      data: {
        ...(dto.tenantMembershipId !== undefined && {
          tenantMembershipId: dto.tenantMembershipId,
        }),
        ...(dto.admissionDate && {
          admissionDate: new Date(dto.admissionDate),
        }),
        ...(dto.rollNumber && {
          rollNumber: dto.rollNumber,
        }),
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Student updated structure: ${JSON.stringify({
        action: 'UPDATE_STUDENT',
        studentId: id,
        tenantId,
        actorUserId: userId,
        changes: {
          ...(dto.rollNumber && { rollNumber: dto.rollNumber }),
          ...(dto.admissionDate && { admissionDate: dto.admissionDate }),
          ...(dto.tenantMembershipId !== undefined && {
            tenantMembershipId: dto.tenantMembershipId,
          }),
        },
        timestamp: new Date().toISOString(),
      })}`,
    );

    return this.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // CHANGE STATUS — with transition guard and active-enrolment warning
  // ---------------------------------------------------------------------------
  async changeStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: ChangeStudentStatusDto,
  ) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    const currentStatus = student.status as StudentStatus;
    const targetStatus = dto.status as StudentStatus;

    // Guard: GRADUATED is terminal
    if (currentStatus === STUDENT_STATUS.GRADUATED) {
      throw new ForbiddenException(
        "A graduated student's status cannot be changed.",
      );
    }

    // Guard: validate transition is allowed
    const allowedTransitions = STUDENT_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${targetStatus}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}.`,
      );
    }

    // Warning: check for active enrolments on terminal/suspension transitions
    const activeEnrolmentCount = await this.prisma.enrolment.count({
      where: {
        studentProfileId: id,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (activeEnrolmentCount > 0 && !dto.ignoreWarnings) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Warning',
        message: 'ACTIVE_ENROLMENTS_WARNING',
        details:
          `This student has ${activeEnrolmentCount} active enrolment(s). ` +
          `Changing status to ${targetStatus} will not automatically modify these enrolments. ` +
          `Set ignoreWarnings: true to proceed.`,
      });
    }

    await this.prisma.studentProfile.update({
      where: { id },
      data: {
        status: targetStatus,
        updatedBy: userId,
        // Soft-delete timestamp is set when moving to INACTIVE
        ...(targetStatus === STUDENT_STATUS.INACTIVE && {
          deletedAt: new Date(),
        }),
        // Clear deletedAt if reinstating from INACTIVE → ACTIVE
        ...(currentStatus === STUDENT_STATUS.INACTIVE &&
          targetStatus === STUDENT_STATUS.ACTIVE && {
            deletedAt: null,
          }),
      },
    });

    this.logger.log(
      `Student status changed structure: ${JSON.stringify({
        action: 'CHANGE_STUDENT_STATUS',
        studentId: id,
        tenantId,
        actorUserId: userId,
        oldStatus: currentStatus,
        newStatus: targetStatus,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return this.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // DELETE — hard-delete only if zero enrolments ever; reject otherwise
  // ---------------------------------------------------------------------------
  async remove(tenantId: string, userId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    const enrolmentCount = await this.prisma.enrolment.count({
      where: { studentProfileId: id },
    });

    if (enrolmentCount > 0) {
      throw new BadRequestException(
        `This student has ${enrolmentCount} enrolment record(s) (active or historical). ` +
          `Hard-delete is not allowed. Set the student's status to INACTIVE instead.`,
      );
    }

    await this.prisma.studentProfile.delete({ where: { id } });

    this.logger.log(
      `Student deleted structure: ${JSON.stringify({
        action: 'DELETE_STUDENT',
        studentId: id,
        tenantId,
        actorUserId: userId,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return { message: 'Student deleted successfully.' };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Validates that a tenantMembershipId belongs to this tenant, is ACTIVE,
   * and is not already linked to another student profile.
   */
  private async validateMembershipLink(
    tenantId: string,
    tenantMembershipId: string,
  ): Promise<void> {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: tenantMembershipId,
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'The specified membership ID does not belong to an active member of this tenant.',
      );
    }

    // Prevent one portal account from being linked to multiple student profiles
    const alreadyLinked = await this.prisma.studentProfile.findFirst({
      where: {
        tenantId,
        tenantMembershipId,
        deletedAt: null,
      },
    });

    if (alreadyLinked) {
      throw new ConflictException(
        'This membership is already linked to another student profile in this tenant.',
      );
    }
  }

  /**
   * Minimal shape returned in list responses.
   */
  private formatListItem(s: any) {
    const user = s.membership?.user ?? null;
    return {
      id: s.id,
      name: user ? `${user.firstName} ${user.lastName}` : null,
      email: user?.email ?? null,
      rollNumber: s.rollNumber,
      admissionDate: s.admissionDate,
      status: s.status,
      enrolmentCount: s._count.enrolments,
      parentCount: s._count.parents,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  /**
   * Full shape returned in detail and mutation responses.
   */
  private formatDetail(s: any) {
    const user = s.membership?.user ?? null;
    return {
      id: s.id,
      name: user ? `${user.firstName} ${user.lastName}` : null,
      email: user?.email ?? null,
      membershipId: s.tenantMembershipId,
      rollNumber: s.rollNumber,
      admissionDate: s.admissionDate,
      status: s.status,
      // Lightweight audit trail using existing columns
      audit: {
        createdBy: s.creator
          ? {
              id: s.creator.id,
              name: `${s.creator.firstName} ${s.creator.lastName}`,
            }
          : null,
        createdAt: s.createdAt,
        updatedBy: s.updater
          ? {
              id: s.updater.id,
              name: `${s.updater.firstName} ${s.updater.lastName}`,
            }
          : null,
        updatedAt: s.updatedAt,
        deletedAt: s.deletedAt,
      },
      enrolments: (s.enrolments ?? []).map((e: any) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        class: {
          id: e.class.id,
          name: e.class.name,
          program: e.class.program,
          academicTerm: e.class.academicTerm,
        },
      })),
      parents: (s.parents ?? []).map((sp: any) => ({
        parentProfileId: sp.parentProfileId,
        relationship: sp.relationship,
        parentName: sp.parent?.membership?.user
          ? `${sp.parent.membership.user.firstName} ${sp.parent.membership.user.lastName}`
          : null,
        parentEmail: sp.parent?.membership?.user?.email ?? null,
        emergencyPhone: sp.parent?.emergencyPhone ?? null,
      })),
    };
  }
}
