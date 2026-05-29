import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Tenant } from '@prisma/client';

export const GetCurrentTenant = createParamDecorator(
  (data: keyof Tenant | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (!request.tenant) return null;
    if (!data) return request.tenant;
    return request.tenant[data];
  },
);
