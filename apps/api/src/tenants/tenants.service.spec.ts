import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { UsersService } from '../users/users.service';
import { TenantsService } from './tenants.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

type PrismaMock = {
  tenant: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    update: jest.Mock;
  };
  tenantMembership: { create: jest.Mock; count: jest.Mock };
  user: { findUnique: jest.Mock; create: jest.Mock };
  role: { create: jest.Mock };
  rolePermission: { createMany: jest.Mock };
  membershipRole: { create: jest.Mock };
  $transaction: jest.Mock;
};

const USER_ID = 'auth-user';

const validDto = {
  subdomain: 'acme',
  name: 'Acme School',
  type: 'SCHOOL' as const,
};

describe('TenantsService — createTenant', () => {
  let service: TenantsService;
  let prisma: PrismaMock;
  let usersService: {
    generateTokens: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      tenantMembership: { create: jest.fn(), count: jest.fn() },
      user: { findUnique: jest.fn(), create: jest.fn() },
      role: { create: jest.fn().mockResolvedValue({ id: 'role-id' }) },
      rolePermission: { createMany: jest.fn() },
      membershipRole: { create: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        Promise.resolve(cb(prisma)),
      ),
    };
    usersService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      }),
    };

    const cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(TenantsService);
  });

  it('rejects invalid subdomain format', async () => {
    await expect(
      service.createTenant({ ...validDto, subdomain: 'AB' }, USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects reserved subdomains', async () => {
    await expect(
      service.createTenant({ ...validDto, subdomain: 'www' }, USER_ID),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects duplicate subdomains', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.createTenant(validDto, USER_ID)).rejects.toThrow(
      /already taken/i,
    );
  });

  it('rejects when the authenticated user no longer exists', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.createTenant(validDto, USER_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('uses the authenticated user as the tenant owner', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      email: 'auth@example.test',
      deletedAt: null,
    });
    prisma.tenant.create.mockResolvedValueOnce({ id: 'new-tenant' });
    prisma.tenantMembership.create.mockResolvedValueOnce({ id: 'm1' });

    await service.createTenant(validDto, USER_ID);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: expect.objectContaining({ id: true, email: true }),
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.tenantMembership.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'new-tenant',
        userId: USER_ID,
        status: 'ACTIVE',
      }),
    });
    expect(usersService.generateTokens).toHaveBeenCalledWith(
      USER_ID,
      'auth@example.test',
      'new-tenant',
      'm1',
      expect.any(Array),
      expect.any(Boolean),
    );
  });

  describe('updateTenant', () => {
    it('renames the workspace, invalidates cache, and logs audit entry', async () => {
      const tenantId = 't1';
      const subdomain = 'acme';
      const actorUserId = 'u1';
      const dto = { name: 'Acme Academy' };

      prisma.tenant.findUniqueOrThrow
        .mockResolvedValueOnce({
          id: tenantId,
          name: 'Old Acme School',
          subdomain,
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: tenantId,
          name: 'Acme Academy',
          subdomain,
          createdAt: new Date(),
        });
      prisma.tenantMembership.count.mockResolvedValueOnce(5);

      const logSpy = jest.spyOn(service['logger'], 'log');
      const cacheDelSpy = jest.spyOn(service, 'invalidateTenantCache');

      const result = await service.updateTenant(
        tenantId,
        subdomain,
        actorUserId,
        dto,
      );

      expect(result.name).toBe('Acme Academy');
      expect(result.memberCount).toBe(5);

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: { name: 'Acme Academy' },
      });
      expect(cacheDelSpy).toHaveBeenCalledWith(subdomain);

      expect(logSpy).toHaveBeenCalled();
      const logMsg = logSpy.mock.calls[0][0];
      expect(logMsg).toContain('RENAME_WORKSPACE');
      expect(logMsg).toContain('Old Acme School');
      expect(logMsg).toContain('Acme Academy');
      expect(logMsg).toContain(actorUserId);
    });
  });
});
