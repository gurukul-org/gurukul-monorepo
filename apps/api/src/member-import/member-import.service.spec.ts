import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { InviteUserDto } from '../tenants/invitations/dto';
import { InvitationsService } from '../tenants/invitations/invitations.service';
import {
  MEMBER_IMPORT_QUEUE,
  MemberImportJobData,
} from './member-import.constants';
import { MemberImportService } from './member-import.service';

// Typed view of a captured inviteUser(...) call: [dto, tenantId, userId, scopes, isAdmin, options].
type InviteCall = [
  InviteUserDto,
  string,
  string,
  string[],
  boolean,
  { sendEmail?: boolean },
];

const TENANT_ID = 'tenant-123';
const USER_ID = 'user-123';

const jobData = (
  role: 'student' | 'parent',
  csvContent: string,
): MemberImportJobData => ({
  role,
  tenantId: TENANT_ID,
  userId: USER_ID,
  csvContent,
  scopes: ['invite-students', 'invite-parents'],
  isAdmin: false,
});

describe('MemberImportService', () => {
  let service: MemberImportService;
  let prisma: { role: { findFirst: jest.Mock } };
  let invitations: { inviteUser: jest.Mock };
  let queue: { add: jest.Mock; getJob: jest.Mock };

  beforeEach(async () => {
    prisma = {
      role: { findFirst: jest.fn().mockResolvedValue({ id: 'role-1' }) },
    };
    invitations = {
      inviteUser: jest.fn().mockResolvedValue({ message: 'ok' }),
    };
    queue = { add: jest.fn(), getJob: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MemberImportService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvitationsService, useValue: invitations },
        { provide: getQueueToken(MEMBER_IMPORT_QUEUE), useValue: queue },
      ],
    }).compile();

    service = moduleRef.get(MemberImportService);
  });

  describe('processImport — students', () => {
    it('creates a student account per valid row (no email sent)', async () => {
      const csv =
        'email,firstName,lastName,rollNumber,admissionDate\n' +
        'a@x.com,Aarav,Sharma,STU-001,2026-07-01\n' +
        'd@x.com,Diya,Patel,,';

      const res = await service.processImport(jobData('student', csv));

      expect(res).toEqual({ totalRows: 2, created: 2, skipped: [] });
      expect(invitations.inviteUser).toHaveBeenCalledTimes(2);

      const [dto, tenantId, userId, scopes, isAdmin, options] = invitations
        .inviteUser.mock.calls[0] as InviteCall;
      expect(dto).toMatchObject({
        email: 'a@x.com',
        firstName: 'Aarav',
        lastName: 'Sharma',
        roleIds: ['role-1'],
        rollNumber: 'STU-001',
        admissionDate: '2026-07-01',
      });
      expect(tenantId).toBe(TENANT_ID);
      expect(userId).toBe(USER_ID);
      expect(scopes).toEqual(['invite-students', 'invite-parents']);
      expect(isAdmin).toBe(false);
      expect(options).toEqual({ preCreate: true });
    });

    it('skips invalid email, missing name, bad roll, bad date, and in-file dupes', async () => {
      const csv = [
        'email,firstName,lastName,rollNumber,admissionDate',
        'a@x.com,Aarav,Sharma,STU-001,2026-07-01', // valid (line 2)
        'not-an-email,Bob,Jones,STU-002,', // bad email (line 3)
        'c@x.com,,Nadal,STU-003,', // missing first name (line 4)
        'd@x.com,Deepa,Rao,BAD ROLL,', // illegal roll (line 5)
        'e@x.com,Esha,Roy,STU-005,07/01/2026', // bad date (line 6)
        'a@x.com,Aarav,Sharma,STU-009,', // dup email of line 2 (line 7)
      ].join('\n');

      const res = await service.processImport(jobData('student', csv));

      expect(res.totalRows).toBe(6);
      expect(res.created).toBe(1);
      expect(res.skipped.map((s) => s.row)).toEqual([3, 4, 5, 6, 7]);
      expect(invitations.inviteUser).toHaveBeenCalledTimes(1);
    });

    it('reports a row when inviteUser throws (e.g. already a member)', async () => {
      invitations.inviteUser
        .mockResolvedValueOnce({ message: 'ok' })
        .mockRejectedValueOnce(
          new Error('User is already a member of this tenant.'),
        );

      const csv =
        'email,firstName,lastName\n' +
        'a@x.com,Aarav,Sharma\n' +
        'b@x.com,Bhavna,Iyer';

      const res = await service.processImport(jobData('student', csv));

      expect(res.created).toBe(1);
      expect(res.skipped).toHaveLength(1);
      expect(res.skipped[0]).toMatchObject({
        row: 3,
        email: 'b@x.com',
        reason: 'User is already a member of this tenant.',
      });
    });
  });

  describe('processImport — parents', () => {
    it('passes emergencyPhone through to the parent invite', async () => {
      const csv =
        'email,firstName,lastName,emergencyPhone\n' +
        'p@x.com,Priya,Menon,+91 99999 11111';

      const res = await service.processImport(jobData('parent', csv));

      expect(res.created).toBe(1);
      const [roleQuery] = prisma.role.findFirst.mock.calls[0] as [
        { where: { name: { equals: string } } },
      ];
      expect(roleQuery.where.name.equals).toBe('parent');
      const [dto] = invitations.inviteUser.mock.calls[0] as InviteCall;
      expect(dto).toMatchObject({
        email: 'p@x.com',
        roleIds: ['role-1'],
        emergencyPhone: '+91 99999 11111',
      });
      expect(dto.rollNumber).toBeUndefined();
    });
  });

  describe('processImport — guards', () => {
    it('fails when the tenant has no matching role', async () => {
      prisma.role.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.processImport(
          jobData('student', 'email,firstName,lastName\na@x.com,A,B'),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('fails when required headers are missing', async () => {
      await expect(
        service.processImport(
          jobData('student', 'name,rollNumber\nJohn,STU-1'),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('fails when there are no data rows', async () => {
      await expect(
        service.processImport(jobData('student', 'email,firstName,lastName')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('queue plumbing', () => {
    it('enqueue adds a job and returns its id', async () => {
      queue.add.mockResolvedValueOnce({ id: 'job-1' });
      const res = await service.enqueue(
        jobData('student', 'email,firstName,lastName\na@x.com,A,B'),
      );
      expect(res).toEqual({ jobId: 'job-1' });
    });

    it('getStatus 404s for a job from another tenant', async () => {
      queue.getJob.mockResolvedValueOnce({ data: { tenantId: 'other' } });
      await expect(service.getStatus(TENANT_ID, 'job-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('getStatus returns state + result for a completed job', async () => {
      queue.getJob.mockResolvedValueOnce({
        id: 'job-1',
        data: { tenantId: TENANT_ID },
        progress: 100,
        returnvalue: { totalRows: 1, created: 1, skipped: [] },
        getState: jest.fn().mockResolvedValue('completed'),
      });
      const res = await service.getStatus(TENANT_ID, 'job-1');
      expect(res).toMatchObject({
        jobId: 'job-1',
        state: 'completed',
        result: { created: 1 },
      });
    });
  });
});
