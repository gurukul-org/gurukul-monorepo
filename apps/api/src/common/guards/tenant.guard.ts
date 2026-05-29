import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tenant = request.tenant;
    const user = request.user;

    // 1. Ensure tenant was resolved by middleware
    if (!tenant) {
      throw new ForbiddenException(
        'Tenant context is required for this route.',
      );
    }

    // 2. Ensure user is authenticated
    if (!user) {
      throw new ForbiddenException('Authentication context is missing.');
    }

    // 3. Ensure the user's token belongs to the resolved subdomain's tenant
    if (user.tenantId !== tenant.id) {
      throw new ForbiddenException(
        'Access Denied: Token is not valid for this subdomain.',
      );
    }

    return true;
  }
}
