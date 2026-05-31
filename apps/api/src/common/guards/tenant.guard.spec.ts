import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Tenant } from '@prisma/client';
import type { Request } from 'express';

import { TenantGuard } from './tenant.guard';

const buildTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 'tenant-acme',
  name: 'Acme',
  subdomain: 'acme',
  type: 'SCHOOL',
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildContext = (request: Partial<Request>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('TenantGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: TenantGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new TenantGuard(reflector as unknown as Reflector);
  });

  it('allows the request when SkipTenantCheck metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const ctx = buildContext({ tenant: buildTenant(), user: undefined });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows the request on apex domain (no tenant resolved)', () => {
    const ctx = buildContext({ tenant: undefined, user: undefined });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when tenant resolved but user is missing', () => {
    const ctx = buildContext({ tenant: buildTenant(), user: undefined });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when user has no tenantId on a tenant-scoped route', () => {
    const ctx = buildContext({
      tenant: buildTenant(),
      user: { sub: 'u1', email: 'x@y.test' } as Express.User,
    });
    expect(() => guard.canActivate(ctx)).toThrow(/no tenant context/i);
  });

  it('rejects when user tenantId mismatches the resolved tenant', () => {
    const ctx = buildContext({
      tenant: buildTenant({ id: 'tenant-acme' }),
      user: {
        sub: 'u1',
        email: 'x@y.test',
        tenantId: 'tenant-beta',
      } as Express.User,
    });
    expect(() => guard.canActivate(ctx)).toThrow(/not valid for this/i);
  });

  it('allows when user tenantId matches the resolved tenant', () => {
    const ctx = buildContext({
      tenant: buildTenant({ id: 'tenant-acme' }),
      user: {
        sub: 'u1',
        email: 'x@y.test',
        tenantId: 'tenant-acme',
      } as Express.User,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
