import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import type { Tenant } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { TenantsMiddleware } from './tenants.middleware';
import { TenantsService } from './tenants.service';

const buildTenant = (subdomain = 'acme'): Tenant => ({
  id: 'tenant-uuid',
  name: 'Acme',
  subdomain,
  type: 'SCHOOL',
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

const fakeReq = (hostname: string | undefined): Request =>
  ({ hostname }) as unknown as Request;
const fakeRes = (): Response => ({}) as Response;

describe('TenantsMiddleware', () => {
  let middleware: TenantsMiddleware;
  let tenantsService: { resolveTenant: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    tenantsService = { resolveTenant: jest.fn() };
    configService = {
      get: jest.fn((key: string) =>
        key === 'APP_DOMAIN' ? 'localhost' : undefined,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TenantsMiddleware,
        { provide: TenantsService, useValue: tenantsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    middleware = moduleRef.get(TenantsMiddleware);
  });

  it('calls next() and sets no tenant when hostname is missing', async () => {
    const req = fakeReq(undefined);
    const next: NextFunction = jest.fn();
    await middleware.use(req, fakeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.tenant).toBeUndefined();
    expect(tenantsService.resolveTenant).not.toHaveBeenCalled();
  });

  it('calls next() and skips resolution on apex domain', async () => {
    const req = fakeReq('localhost');
    const next: NextFunction = jest.fn();
    await middleware.use(req, fakeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.tenant).toBeUndefined();
    expect(tenantsService.resolveTenant).not.toHaveBeenCalled();
  });

  it('skips resolution for hosts that do not belong to APP_DOMAIN', async () => {
    const req = fakeReq('attacker.com');
    const next: NextFunction = jest.fn();
    await middleware.use(req, fakeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.tenant).toBeUndefined();
    expect(tenantsService.resolveTenant).not.toHaveBeenCalled();
  });

  it('resolves and attaches the tenant for a valid subdomain', async () => {
    const tenant = buildTenant();
    tenantsService.resolveTenant.mockResolvedValueOnce(tenant);
    const req = fakeReq('acme.localhost');
    const next: NextFunction = jest.fn();
    await middleware.use(req, fakeRes(), next);
    expect(tenantsService.resolveTenant).toHaveBeenCalledWith('acme');
    expect(req.tenant).toEqual(tenant);
    expect(next).toHaveBeenCalled();
  });

  it('does not attach a tenant when resolveTenant returns null', async () => {
    tenantsService.resolveTenant.mockResolvedValueOnce(null);
    const req = fakeReq('unknown.localhost');
    const next: NextFunction = jest.fn();
    await middleware.use(req, fakeRes(), next);
    expect(req.tenant).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('handles multi-label APP_DOMAIN correctly', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'APP_DOMAIN' ? 'app.gurukul.io' : undefined,
    );
    const tenant = buildTenant('acme');
    tenantsService.resolveTenant.mockResolvedValueOnce(tenant);
    const req = fakeReq('acme.app.gurukul.io');
    const next: NextFunction = jest.fn();
    await middleware.use(req, fakeRes(), next);
    expect(tenantsService.resolveTenant).toHaveBeenCalledWith('acme');
    expect(req.tenant).toEqual(tenant);
  });
});
