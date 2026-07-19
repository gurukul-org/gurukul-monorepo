import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { InstructorsService } from './instructors.service';

type PrismaMock = {
  class: {
    findFirst: jest.Mock;
  };
  tenantMembership: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
  classInstructor: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

const USER_ID = 'user-123';
const TENANT_ID = 'tenant-123';
const CLASS_ID = 'class-123';
const MEMBERSHIP_ID = 'm-123';

describe('InstructorsService', () => {
  let service: InstructorsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      class: {
        findFirst: jest.fn(),
      },
      tenantMembership: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      classInstructor: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(InstructorsService);
  });

  describe('findAllEligible', () => {
    it('returns members with Teacher role or view-own-classes permission', async () => {
      const mockMemberships = [
        {
          id: 'm-1',
          user: {
            id: 'u-1',
            firstName: 'Alice',
            lastName: 'A',
            email: 'alice@example.com',
          },
          roles: [
            { role: { name: 'Teacher', isAdmin: false, permissions: [] } },
          ],
        },
        {
          id: 'm-2',
          user: {
            id: 'u-2',
            firstName: 'Bob',
            lastName: 'B',
            email: 'bob@example.com',
          },
          roles: [
            {
              role: {
                name: 'SomeRole',
                isAdmin: false,
                permissions: [{ permissionId: 'view-own-classes' }],
              },
            },
          ],
        },
        {
          id: 'm-3',
          user: {
            id: 'u-3',
            firstName: 'Charlie',
            lastName: 'C',
            email: 'charlie@example.com',
          },
          roles: [
            {
              role: { name: 'IneligibleRole', isAdmin: false, permissions: [] },
            },
          ],
        },
      ];

      prisma.tenantMembership.findMany.mockResolvedValueOnce(mockMemberships);

      const result = await service.findAllEligible(TENANT_ID);

      expect(result).toHaveLength(2);
      expect(result[0]?.firstName).toBe('Alice');
      expect(result[1]?.firstName).toBe('Bob');
    });
  });

  describe('assignInstructor', () => {
    it('successfully assigns the first instructor as primary', async () => {
      prisma.class.findFirst.mockResolvedValueOnce({ id: CLASS_ID });
      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: MEMBERSHIP_ID,
        roles: [{ role: { name: 'Teacher', isAdmin: false, permissions: [] } }],
      });
      prisma.classInstructor.findFirst.mockResolvedValueOnce(null);
      prisma.classInstructor.findMany.mockResolvedValueOnce([]); // no instructors currently
      prisma.classInstructor.create.mockResolvedValueOnce({
        id: 'ci-123',
        isPrimary: true,
      });

      const result = await service.assignInstructor(
        TENANT_ID,
        CLASS_ID,
        USER_ID,
        {
          tenantMembershipId: MEMBERSHIP_ID,
          isPrimary: false, // gets forced to true since it's the first
        },
      );

      expect(result.isPrimary).toBe(true);
      expect(prisma.classInstructor.create).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT_ID,
          classId: CLASS_ID,
          tenantMembershipId: MEMBERSHIP_ID,
          isPrimary: true,
          assignedById: USER_ID,
        },
      });
    });

    it('rejects duplicate assignment', async () => {
      prisma.class.findFirst.mockResolvedValueOnce({ id: CLASS_ID });
      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: MEMBERSHIP_ID,
        roles: [{ role: { name: 'Teacher', isAdmin: false, permissions: [] } }],
      });
      prisma.classInstructor.findFirst.mockResolvedValueOnce({
        id: 'ci-existing',
      });

      await expect(
        service.assignInstructor(TENANT_ID, CLASS_ID, USER_ID, {
          tenantMembershipId: MEMBERSHIP_ID,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('restores a soft-deleted instructor assignment instead of creating a new one', async () => {
      prisma.class.findFirst.mockResolvedValueOnce({ id: CLASS_ID });
      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: MEMBERSHIP_ID,
        roles: [{ role: { name: 'Teacher', isAdmin: false, permissions: [] } }],
      });
      prisma.classInstructor.findFirst.mockResolvedValueOnce({
        id: 'ci-existing',
        deletedAt: new Date(),
      });
      prisma.classInstructor.findMany.mockResolvedValueOnce([]); // no active instructors

      const mockUpdated = {
        id: 'ci-existing',
        deletedAt: null,
        isPrimary: true,
      };
      prisma.classInstructor.update.mockResolvedValueOnce(mockUpdated);

      const result = await service.assignInstructor(
        TENANT_ID,
        CLASS_ID,
        USER_ID,
        {
          tenantMembershipId: MEMBERSHIP_ID,
          isPrimary: false,
        },
      );

      expect(result.deletedAt).toBeNull();
      expect(prisma.classInstructor.update).toHaveBeenCalledWith({
        where: { id: 'ci-existing' },
        data: {
          deletedAt: null,
          isPrimary: true,
          assignedById: USER_ID,
        },
      });
    });

    it('rejects ineligible member', async () => {
      prisma.class.findFirst.mockResolvedValueOnce({ id: CLASS_ID });
      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: MEMBERSHIP_ID,
        roles: [
          { role: { name: 'Ineligible', isAdmin: false, permissions: [] } },
        ],
      });

      await expect(
        service.assignInstructor(TENANT_ID, CLASS_ID, USER_ID, {
          tenantMembershipId: MEMBERSHIP_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('promoteToPrimary', () => {
    it('demotes old primary and promotes new primary in transaction', async () => {
      prisma.classInstructor.findFirst.mockResolvedValueOnce({
        id: 'ci-secondary',
        classId: CLASS_ID,
        isPrimary: false,
      });

      prisma.classInstructor.update.mockResolvedValueOnce({
        id: 'ci-secondary',
        isPrimary: true,
      });

      const result = await service.promoteToPrimary(
        TENANT_ID,
        CLASS_ID,
        USER_ID,
        'ci-secondary',
      );

      expect(prisma.classInstructor.updateMany).toHaveBeenCalledWith({
        where: { classId: CLASS_ID, isPrimary: true, deletedAt: null },
        data: { isPrimary: false },
      });
      expect(prisma.classInstructor.update).toHaveBeenCalledWith({
        where: { id: 'ci-secondary' },
        data: { isPrimary: true },
      });
    });
  });

  describe('removeInstructor', () => {
    it('blocks removing primary if secondary instructors remain', async () => {
      prisma.classInstructor.findFirst.mockResolvedValueOnce({
        id: 'ci-primary',
        classId: CLASS_ID,
        isPrimary: true,
      });
      prisma.classInstructor.findMany.mockResolvedValueOnce([
        { id: 'ci-secondary' },
      ]);

      await expect(
        service.removeInstructor(TENANT_ID, CLASS_ID, USER_ID, 'ci-primary'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows removing primary if it is the only instructor', async () => {
      prisma.classInstructor.findFirst.mockResolvedValueOnce({
        id: 'ci-only',
        classId: CLASS_ID,
        isPrimary: true,
      });
      prisma.classInstructor.findMany.mockResolvedValueOnce([]); // no other instructors
      prisma.classInstructor.update.mockResolvedValueOnce({
        id: 'ci-only',
        deletedAt: new Date(),
      });

      const result = await service.removeInstructor(
        TENANT_ID,
        CLASS_ID,
        USER_ID,
        'ci-only',
      );

      expect(result.message).toContain('successfully');
      expect(prisma.classInstructor.update).toHaveBeenCalledWith({
        where: { id: 'ci-only' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
