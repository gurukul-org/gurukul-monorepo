import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Request } from 'express';

import type { JwtPayload } from '../../users/types';
import { SKIP_TENANT_CHECK_KEY } from '../decorators/skip-tenant-check.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const tenant = request.tenant;
    const user = request.user as JwtPayload | undefined;

    // No tenant resolved on this request (apex domain or unknown subdomain).
    // Cross-tenant misuse only matters when there IS a tenant on the request,
    // so allow apex-domain traffic through. Authentication is handled by AtGuard.
    if (!tenant) return true;

    if (!user) {
      throw new ForbiddenException('Authentication context is missing.');
    }

    if (!user.tenantId) {
      throw new ForbiddenException(
        'Token has no tenant context; please sign in on this tenant subdomain.',
      );
    }

    if (user.tenantId !== tenant.id) {
      throw new ForbiddenException(
        'Access Denied: Token is not valid for this subdomain.',
      );
    }

    return true;
  }
}
