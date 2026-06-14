import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { RolesService } from './roles.service';

type PrismaMock = {
  role: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  rolePermission: { createMany: jest.Mock; deleteMany: jest.Mock };
  membershipRole: { findMany: jest.Mock };
};

describe('RolesService', () => {
  let service: RolesService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      role: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      rolePermission: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      membershipRole: {
        findMany: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(RolesService);
  });

  describe('findAll', () => {
    it('returns roles mapped correctly', async () => {
      prisma.role.findMany.mockResolvedValueOnce([
        {
          id: 'role-1',
          name: 'Teacher',
          description: 'Teaches classes',
          rank: 5,
          isAdmin: false,
          isSystemRole: true,
          permissions: [{ permissionId: 'view-students' }],
          _count: { membershipRoles: 2 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'role-1',
          name: 'Teacher',
          rank: 5,
          permissions: ['view-students'],
          memberCount: 2,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if role does not exist', async () => {
      prisma.role.findFirst.mockResolvedValueOnce(null);
      await expect(service.findOne('tenant-1', 'role-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns role details if found', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-1',
        name: 'Teacher',
        description: 'Teaches classes',
        rank: 5,
        isAdmin: false,
        isSystemRole: true,
        permissions: [{ permissionId: 'view-students' }],
        _count: { membershipRoles: 2 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne('tenant-1', 'role-1');
      expect(result.id).toBe('role-1');
      expect(result.permissions).toEqual(['view-students']);
    });
  });

  describe('create', () => {
    it('throws ForbiddenException if rank is less than or equal to caller rank', async () => {
      await expect(
        service.create(
          'tenant-1',
          { name: 'Test', rank: 3, permissions: [] },
          3,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if permissions are invalid', async () => {
      await expect(
        service.create(
          'tenant-1',
          { name: 'Test', rank: 5, permissions: ['invalid-perm-id'] },
          3,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if role name already exists', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({ id: 'exists' });
      await expect(
        service.create(
          'tenant-1',
          { name: 'Teacher', rank: 5, permissions: [] },
          3,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('throws ForbiddenException if target role rank is higher privilege than caller rank', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({ id: 'role-1', rank: 2 });
      await expect(
        service.update('tenant-1', 'role-1', { name: 'New Name' }, 3),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if modifying name or rank of a system role', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-1',
        rank: 4,
        isSystemRole: true,
      });
      await expect(
        service.update('tenant-1', 'role-1', { name: 'New Name' }, 3),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('throws BadRequestException for system roles', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-1',
        rank: 4,
        isSystemRole: true,
      });
      await expect(service.remove('tenant-1', 'role-1', 3)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if role has active members', async () => {
      prisma.role.findFirst.mockResolvedValueOnce({
        id: 'role-1',
        rank: 4,
        isSystemRole: false,
        _count: { membershipRoles: 1 },
      });
      await expect(service.remove('tenant-1', 'role-1', 3)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
