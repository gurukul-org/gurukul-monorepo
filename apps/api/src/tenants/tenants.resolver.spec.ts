import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import type { Tenant } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'nestjs-prisma';

import { UsersService } from '../users/users.service';
import { TenantsService } from './tenants.service';

type PrismaMock = {
  tenant: { findFirst: jest.Mock };
};

const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 'tenant-uuid',
  name: 'Acme School',
  subdomain: 'acme',
  type: 'SCHOOL',
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('TenantsService — subdomain resolution', () => {
  let service: TenantsService;
  let prisma: PrismaMock;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    prisma = { tenant: { findFirst: jest.fn() } };
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: {} },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(TenantsService);
  });

  describe('validateSubdomainFormat', () => {
    it.each([
      ['acme', true],
      ['acme-school', true],
      ['a1b', true],
      ['ab', false],
      ['-acme', false],
      ['acme-', false],
      ['ACME', false],
      ['a'.repeat(64), false],
    ])('returns %s for %p', (subdomain, expected) => {
      expect(service.validateSubdomainFormat(subdomain)).toBe(expected);
    });
  });

  describe('isReservedSubdomain', () => {
    it.each(['www', 'api', 'admin', 'auth'])('flags %s as reserved', (s) => {
      expect(service.isReservedSubdomain(s)).toBe(true);
    });

    it('does not flag a normal subdomain', () => {
      expect(service.isReservedSubdomain('acme')).toBe(false);
    });
  });

  describe('resolveTenant', () => {
    it('returns null for invalid format without hitting DB', async () => {
      const result = await service.resolveTenant('AB');
      expect(result).toBeNull();
      expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
    });

    it('returns null for reserved subdomain without hitting DB', async () => {
      const result = await service.resolveTenant('www');
      expect(result).toBeNull();
      expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
    });

    it('returns null when tenant does not exist', async () => {
      prisma.tenant.findFirst.mockResolvedValueOnce(null);
      const result = await service.resolveTenant('acme');
      expect(result).toBeNull();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('queries DB filtering soft-deleted tenants', async () => {
      prisma.tenant.findFirst.mockResolvedValueOnce(buildTenant());
      await service.resolveTenant('acme');
      expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
        where: { subdomain: 'acme', deletedAt: null },
      });
    });

    it('caches resolved tenant under namespaced key', async () => {
      const tenant = buildTenant();
      prisma.tenant.findFirst.mockResolvedValueOnce(tenant);
      const result = await service.resolveTenant('acme');
      expect(result).toEqual(tenant);
      expect(cache.set).toHaveBeenCalledWith(
        'tenant:acme',
        tenant,
        expect.any(Number),
      );
    });

    it('returns cached tenant on second call without hitting DB', async () => {
      const tenant = buildTenant();
      cache.get.mockResolvedValueOnce(tenant);
      const result = await service.resolveTenant('acme');
      expect(result).toEqual(tenant);
      expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('invalidateTenantCache', () => {
    it('deletes the namespaced cache entry', async () => {
      await service.invalidateTenantCache('acme');
      expect(cache.del).toHaveBeenCalledWith('tenant:acme');
    });
  });
});
