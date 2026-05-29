import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NextFunction, Request, Response } from 'express';

import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenantService: TenantService,
    private configService: ConfigService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.host;
    const noPortHost = host.split(':')[0];
    const APP_DOMAIN =
      this.configService.get<string>('APP_DOMAIN') || 'localhost';
    const baseParts = APP_DOMAIN.split('.').length;

    const domainArray = noPortHost.split('.');

    if (domainArray.length <= baseParts) {
      return next();
    }

    const subdomain = domainArray.slice(0, -baseParts).join('.');
    const tenant = await this.tenantService.resolveTenant(subdomain);
    req.tenant = tenant;
    next();
  }
}
