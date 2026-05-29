import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { Request } from 'express';

import { JwtPayload } from '../../users/types';

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    return user.sub;
  },
);
