import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { ParentsService } from './parents.service';

type PrismaMock = {
  parentProfile: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  tenantMembership: {
    findFirst: jest.Mock;
  };
  studentParent: {
    count: jest.Mock;
  };
};

const USER_ID = 'user-123';
const TENANT_ID = 'tenant-123';

describe('ParentsService', () => {
  let service: ParentsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      parentProfile: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tenantMembership: {
        findFirst: jest.fn(),
      },
      studentParent: {
        count: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ParentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ParentsService);
  });

  describe('create', () => {
    it('creates parent profile and logs audit log', async () => {
      const dto = {
        emergencyPhone: '+919999999999',
        tenantMembershipId: 'm-123',
      };

      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: 'm-123',
        tenantId: TENANT_ID,
        status: 'ACTIVE',
      });
      prisma.parentProfile.findFirst.mockResolvedValueOnce(null); // uniqueness check
      prisma.parentProfile.create.mockResolvedValueOnce({
        id: 'p-123',
        emergencyPhone: '+919999999999',
        tenantMembershipId: 'm-123',
      });

      // Mock findOne (which is called at the end of create)
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'p-123',
        emergencyPhone: '+919999999999',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.create(TENANT_ID, USER_ID, dto);

      expect(res.emergencyPhone).toBe('+919999999999');
      expect(prisma.parentProfile.create).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT_ID,
          tenantMembershipId: 'm-123',
          emergencyPhone: '+919999999999',
          createdBy: USER_ID,
          updatedBy: USER_ID,
        },
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('CREATE_PARENT');
      expect(logVal.emergencyPhone).toBe('+919999999999');
    });

    it('throws BadRequestException if member does not exist or inactive', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(TENANT_ID, USER_ID, {
          emergencyPhone: '+919999999999',
          tenantMembershipId: 'invalid-m',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates parent details and logs audit entry', async () => {
      prisma.parentProfile.findFirst.mockResolvedValueOnce({
        id: 'p-123',
        emergencyPhone: '+1234567890',
        tenantMembershipId: 'm-123',
      });

      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'p-123',
        emergencyPhone: '+1999999999',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.update(TENANT_ID, USER_ID, 'p-123', {
        emergencyPhone: '+1999999999',
      });

      expect(res.emergencyPhone).toBe('+1999999999');
      expect(prisma.parentProfile.update).toHaveBeenCalledWith({
        where: { id: 'p-123' },
        data: expect.objectContaining({
          emergencyPhone: '+1999999999',
          updatedBy: USER_ID,
        }),
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('UPDATE_PARENT');
      expect(logVal.changes.emergencyPhone).toBe('+1999999999');
    });
  });

  describe('remove', () => {
    it('hard deletes parent if zero linked students exist', async () => {
      prisma.parentProfile.findFirst.mockResolvedValueOnce({ id: 'p-123' });
      prisma.studentParent.count.mockResolvedValueOnce(0);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.remove(TENANT_ID, USER_ID, 'p-123');

      expect(res.message).toContain('deleted successfully');
      expect(prisma.parentProfile.delete).toHaveBeenCalledWith({
        where: { id: 'p-123' },
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('DELETE_PARENT');
    });

    it('soft deletes parent if linked students exist (>0)', async () => {
      prisma.parentProfile.findFirst.mockResolvedValueOnce({ id: 'p-123' });
      prisma.studentParent.count.mockResolvedValueOnce(3); // 3 linked kids

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.remove(TENANT_ID, USER_ID, 'p-123');

      expect(res.message).toContain('soft-deleted successfully');
      expect(prisma.parentProfile.update).toHaveBeenCalledWith({
        where: { id: 'p-123' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(
        logSpy.mock.calls[0][0].split('structure: ')[1],
      );
      expect(logVal.action).toBe('SOFT_DELETE_PARENT');
    });
  });
});
