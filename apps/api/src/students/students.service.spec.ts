import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { StudentsService } from './students.service';

type PrismaMock = {
  studentProfile: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  tenantMembership: {
    findFirst: jest.Mock;
  };
  enrolment: {
    count: jest.Mock;
  };
  parentProfile: {
    findFirst: jest.Mock;
  };
  studentParent: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const USER_ID = 'user-123';
const TENANT_ID = 'tenant-123';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      studentProfile: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tenantMembership: {
        findFirst: jest.fn(),
      },
      enrolment: {
        count: jest.fn(),
      },
      parentProfile: {
        findFirst: jest.fn(),
      },
      studentParent: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(StudentsService);
  });

  describe('create', () => {
    it('creates student profile and logs audit entry', async () => {
      const dto = {
        rollNumber: 'STU-001',
        admissionDate: '2026-07-01',
        tenantMembershipId: 'm-123',
      };

      prisma.studentProfile.findFirst.mockResolvedValueOnce(null); // uniqueness check
      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: 'm-123',
        tenantId: TENANT_ID,
        status: 'ACTIVE',
      });
      prisma.studentProfile.create.mockResolvedValueOnce({
        id: 's-123',
        rollNumber: 'STU-001',
        admissionDate: new Date('2026-07-01'),
        status: 'ACTIVE',
      });

      // Mock findOne (which is called at the end of create)
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 's-123',
        rollNumber: 'STU-001',
        admissionDate: new Date('2026-07-01'),
        status: 'ACTIVE',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.create(TENANT_ID, USER_ID, dto);

      expect(res.rollNumber).toBe('STU-001');
      expect(prisma.studentProfile.create).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT_ID,
          tenantMembershipId: 'm-123',
          rollNumber: 'STU-001',
          admissionDate: new Date('2026-07-01'),
          status: 'ACTIVE',
          createdBy: USER_ID,
          updatedBy: USER_ID,
        },
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('CREATE_STUDENT');
      expect(logVal.rollNumber).toBe('STU-001');
    });

    it('throws ConflictException on duplicate roll number', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.create(TENANT_ID, USER_ID, { rollNumber: 'STU-001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates profile fields and logs audit entry', async () => {
      const student = {
        id: 's-123',
        rollNumber: 'STU-001',
        tenantId: TENANT_ID,
      };
      prisma.studentProfile.findFirst.mockResolvedValueOnce(student); // find in update

      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 's-123',
        rollNumber: 'STU-002',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.update(TENANT_ID, USER_ID, 's-123', {
        rollNumber: 'STU-002',
      });

      expect(res.rollNumber).toBe('STU-002');
      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 's-123' },
        data: expect.objectContaining({
          rollNumber: 'STU-002',
          updatedBy: USER_ID,
        }),
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('UPDATE_STUDENT');
      expect(logVal.changes.rollNumber).toBe('STU-002');
    });

    it('throws ConflictException if updated roll number belongs to another student', async () => {
      prisma.studentProfile.findFirst
        .mockResolvedValueOnce({ id: 's-123', rollNumber: 'STU-001' }) // find current
        .mockResolvedValueOnce({ id: 's-456', rollNumber: 'STU-002' }); // find duplicate

      await expect(
        service.update(TENANT_ID, USER_ID, 's-123', { rollNumber: 'STU-002' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeStatus', () => {
    it('transitions ACTIVE to SUSPENDED and logs audit log', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: 's-123',
        status: 'ACTIVE',
      });
      prisma.enrolment.count.mockResolvedValueOnce(0); // active enrollments
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 's-123',
        status: 'SUSPENDED',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.changeStatus(TENANT_ID, USER_ID, 's-123', {
        status: 'SUSPENDED',
      });

      expect(res.status).toBe('SUSPENDED');
      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 's-123' },
        data: expect.objectContaining({
          status: 'SUSPENDED',
          updatedBy: USER_ID,
        }),
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('CHANGE_STUDENT_STATUS');
      expect(logVal.oldStatus).toBe('ACTIVE');
      expect(logVal.newStatus).toBe('SUSPENDED');
    });

    it('throws BadRequestException on active enrolments warning if not ignored', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: 's-123',
        status: 'ACTIVE',
      });
      prisma.enrolment.count.mockResolvedValueOnce(2);

      await expect(
        service.changeStatus(TENANT_ID, USER_ID, 's-123', {
          status: 'SUSPENDED',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('proceeds if active enrolments warning is explicitly ignored', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: 's-123',
        status: 'ACTIVE',
      });
      prisma.enrolment.count.mockResolvedValueOnce(2);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 's-123',
        status: 'SUSPENDED',
      } as any);

      const res = await service.changeStatus(TENANT_ID, USER_ID, 's-123', {
        status: 'SUSPENDED',
        ignoreWarnings: true,
      });

      expect(res.status).toBe('SUSPENDED');
    });
  });

  describe('remove', () => {
    it('deletes the student and logs audit entry if zero enrolments exist', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({ id: 's-123' });
      prisma.enrolment.count.mockResolvedValueOnce(0);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.remove(TENANT_ID, USER_ID, 's-123');

      expect(res.message).toContain('deleted successfully');
      expect(prisma.studentProfile.delete).toHaveBeenCalledWith({
        where: { id: 's-123' },
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('DELETE_STUDENT');
    });

    it('throws BadRequestException if student has historical or active enrolments', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({ id: 's-123' });
      prisma.enrolment.count.mockResolvedValueOnce(1);

      await expect(service.remove(TENANT_ID, USER_ID, 's-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('linkParent', () => {
    it('successfully links a parent to student', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({ id: 's-123' });
      prisma.parentProfile.findFirst.mockResolvedValueOnce({ id: 'p-123' });
      prisma.studentParent.findUnique.mockResolvedValueOnce(null);
      prisma.studentParent.create.mockResolvedValueOnce({});

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce({ id: 's-123' } as any);
      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.linkParent(TENANT_ID, 's-123', USER_ID, {
        parentProfileId: 'p-123',
        relationship: 'MOTHER',
      });

      expect(res.id).toBe('s-123');
      expect(prisma.studentParent.create).toHaveBeenCalledWith({
        data: {
          studentProfileId: 's-123',
          parentProfileId: 'p-123',
          relationship: 'MOTHER',
          relationshipDescription: null,
        },
      });
      expect(logSpy).toHaveBeenCalled();
    });

    it('rejects OTHER relationship without description', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({ id: 's-123' });
      prisma.parentProfile.findFirst.mockResolvedValueOnce({ id: 'p-123' });

      await expect(
        service.linkParent(TENANT_ID, 's-123', USER_ID, {
          parentProfileId: 'p-123',
          relationship: 'OTHER',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('editParentLink', () => {
    it('successfully updates relationship link info', async () => {
      prisma.studentParent.findUnique.mockResolvedValueOnce({
        studentProfileId: 's-123',
        parentProfileId: 'p-123',
        relationship: 'MOTHER',
        student: { tenantId: TENANT_ID },
      });
      prisma.studentParent.update.mockResolvedValueOnce({});

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce({ id: 's-123' } as any);

      const res = await service.editParentLink(
        TENANT_ID,
        's-123',
        'p-123',
        USER_ID,
        {
          relationship: 'OTHER',
          relationshipDescription: 'Aunt',
        },
      );

      expect(res.id).toBe('s-123');
      expect(prisma.studentParent.update).toHaveBeenCalledWith({
        where: {
          studentProfileId_parentProfileId: {
            studentProfileId: 's-123',
            parentProfileId: 'p-123',
          },
        },
        data: {
          relationship: 'OTHER',
          relationshipDescription: 'Aunt',
        },
      });
    });
  });

  describe('unlinkParent', () => {
    it('deletes relationship link and logs audit entry', async () => {
      prisma.studentParent.findUnique.mockResolvedValueOnce({
        studentProfileId: 's-123',
        parentProfileId: 'p-123',
        student: { tenantId: TENANT_ID },
      });
      prisma.studentParent.delete.mockResolvedValueOnce({});
      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.unlinkParent(
        TENANT_ID,
        's-123',
        'p-123',
        USER_ID,
      );

      expect(res.message).toContain('successfully');
      expect(prisma.studentParent.delete).toHaveBeenCalledWith({
        where: {
          studentProfileId_parentProfileId: {
            studentProfileId: 's-123',
            parentProfileId: 'p-123',
          },
        },
      });
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
