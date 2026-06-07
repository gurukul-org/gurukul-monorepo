import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { JwtPayloadWithRt } from '../../users/types';

type RequestWithUser = {
  user?: JwtPayloadWithRt;
};

export const GetCurrentUser = createParamDecorator(
  (
    data: keyof JwtPayloadWithRt | undefined,
    context: ExecutionContext,
  ):
    | JwtPayloadWithRt
    | JwtPayloadWithRt[keyof JwtPayloadWithRt]
    | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) return undefined;
    if (!data) return user;
    return user[data];
  },
);
