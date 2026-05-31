import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { Request } from 'express';

import { JwtPayloadWithRt } from '../../users/types';

export const GetCurrentUser = createParamDecorator(
  (
    data: keyof JwtPayloadWithRt | undefined,
    context: ExecutionContext,
  ):
    | JwtPayloadWithRt
    | JwtPayloadWithRt[keyof JwtPayloadWithRt]
    | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayloadWithRt | undefined;
    if (!user) return undefined;
    if (!data) return user;
    return user[data];
  },
);
