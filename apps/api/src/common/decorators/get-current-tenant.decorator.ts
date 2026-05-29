import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Tenant } from '@prisma/client';
import type { Request } from 'express';

/**
 * Returns the resolved tenant from the request, or null when none was resolved
 * (apex domain, unknown subdomain). Handlers that require a tenant should pair
 * this with TenantGuard (no SkipTenantCheck) so the request is rejected before
 * the handler runs.
 */
export const GetCurrentTenant = createParamDecorator(
  (
    data: keyof Tenant | undefined,
    context: ExecutionContext,
  ): Tenant | Tenant[keyof Tenant] | null => {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.tenant) return null;
    if (!data) return request.tenant;
    return request.tenant[data];
  },
);
