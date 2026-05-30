import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { JwtPayloadWithRt } from '../../users/types';

type RequestWithUser = {
  user: JwtPayloadWithRt;
};

export const GetCurrentUser = createParamDecorator(
  (data: keyof JwtPayloadWithRt | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!data) return request.user;
    return request.user[data];
  },
);
