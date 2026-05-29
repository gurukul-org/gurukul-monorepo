import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'nestjs-prisma';

import { UsersService } from '../users/users.service';
import { TenantsService } from './tenants.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockedBcryptCompare = bcrypt.compare as unknown as jest.Mock;

type PrismaMock = {
  tenant: { findFirst: jest.Mock; create: jest.Mock };
  tenantMembership: { create: jest.Mock };
  user: { findUnique: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};

const validDto = {
  subdomain: 'acme',
  name: 'Acme School',
  type: 'SCHOOL' as const,
  email: 'owner@acme.test',
  password: 'password123',
  firstName: 'Ada',
  lastName: 'Lovelace',
};

describe('TenantsService — createTenant', () => {
  let service: TenantsService;
  let prisma: PrismaMock;
  let usersService: {
    hashPassword: jest.Mock;
    generateTokens: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      tenant: { findFirst: jest.fn(), create: jest.fn() },
      tenantMembership: { create: jest.fn() },
      user: { findUnique: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        Promise.resolve(cb(prisma)),
      ),
    };
    usersService = {
      hashPassword: jest.fn().mockResolvedValue('hashed'),
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
      service.createTenant({ ...validDto, subdomain: 'AB' }, null),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects reserved subdomains', async () => {
    await expect(
      service.createTenant({ ...validDto, subdomain: 'www' }, null),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects duplicate subdomains', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.createTenant(validDto, null)).rejects.toThrow(
      /already taken/i,
    );
  });

  it('creates tenant + user + membership for anonymous caller', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'new-user',
      email: validDto.email,
    });
    prisma.tenant.create.mockResolvedValueOnce({
      id: 'new-tenant',
      subdomain: validDto.subdomain,
    });
    prisma.tenantMembership.create.mockResolvedValueOnce({
      id: 'new-membership',
    });

    await service.createTenant(validDto, null);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: validDto.email,
        passwordHash: 'hashed',
        firstName: validDto.firstName,
        lastName: validDto.lastName,
      }),
    });
    expect(prisma.tenant.create).toHaveBeenCalled();
    expect(prisma.tenantMembership.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'new-tenant',
        userId: 'new-user',
        status: 'ACTIVE',
      }),
    });
    expect(usersService.generateTokens).toHaveBeenCalledWith(
      'new-user',
      validDto.email,
      'new-tenant',
      'new-membership',
    );
  });

  it('attaches existing user when password matches', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: validDto.email,
      passwordHash: 'hash',
      deletedAt: null,
    });
    mockedBcryptCompare.mockResolvedValueOnce(true);
    prisma.tenant.create.mockResolvedValueOnce({ id: 'new-tenant' });
    prisma.tenantMembership.create.mockResolvedValueOnce({ id: 'm1' });

    await service.createTenant(validDto, null);

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(usersService.generateTokens).toHaveBeenCalledWith(
      'existing-user',
      validDto.email,
      'new-tenant',
      'm1',
    );
  });

  it('rejects with uniform message when password mismatches', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: validDto.email,
      passwordHash: 'hash',
      deletedAt: null,
    });
    mockedBcryptCompare.mockResolvedValueOnce(false);

    await expect(service.createTenant(validDto, null)).rejects.toThrow(
      /already in use/i,
    );
    expect(prisma.tenant.create).not.toHaveBeenCalled();
  });

  it('requires owner fields when caller is anonymous', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    const dto = { ...validDto, email: undefined };
    await expect(service.createTenant(dto, null)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('uses authenticated user as owner without requiring credentials', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'auth-user',
      email: 'auth@example.test',
      deletedAt: null,
    });
    prisma.tenant.create.mockResolvedValueOnce({ id: 'new-tenant' });
    prisma.tenantMembership.create.mockResolvedValueOnce({ id: 'm2' });

    const dtoWithoutCreds = {
      subdomain: 'beta',
      name: 'Beta',
      type: 'INSTITUTE' as const,
    };
    await service.createTenant(dtoWithoutCreds, 'auth-user');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'auth-user' },
      select: expect.objectContaining({ id: true, email: true }),
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(usersService.generateTokens).toHaveBeenCalledWith(
      'auth-user',
      'auth@example.test',
      'new-tenant',
      'm2',
    );
  });
});
