import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

import { JwtPayload } from '../../users/types';

type RequestWithUser = {
  user?: JwtPayload;
};

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return userId;
  },
);
