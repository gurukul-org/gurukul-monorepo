import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { JwtPayload } from '../../users/types';

type RequestWithUser = {
  user: JwtPayload;
};

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user.sub;
  },
);
