import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NextFunction, Request, Response } from 'express';

import { TenantsService } from './tenants.service';

@Injectable()
export class TenantsMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const hostname = req.hostname;
    if (!hostname) return next();

    const appDomain =
      this.configService.get<string>('APP_DOMAIN') || 'localhost';

    const isApex = hostname === appDomain;
    const isSubOfApex = hostname.endsWith('.' + appDomain);
    if (!isApex && !isSubOfApex) return next();
    if (isApex) return next();

    const subdomain = hostname.slice(0, -(appDomain.length + 1));
    const tenant = await this.tenantsService.resolveTenant(subdomain);
    if (tenant) req.tenant = tenant;
    return next();
  }
}
