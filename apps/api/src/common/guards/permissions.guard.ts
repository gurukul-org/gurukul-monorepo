import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { userHasPermission } from '@repo/permissions';
import type { PermissionEntry, PermissionId } from '@repo/permissions';

import type { JwtPayload } from '../../users/types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip public routes (they bypass auth entirely)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // No @RequirePermissions() on the handler → allow (auth-only route)
    const required = this.reflector.getAllAndOverride<
      (PermissionEntry | PermissionId)[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException(
        'You do not have the required permissions for this action.',
      );
    }

    // Admin bypass — isAdmin roles skip permission checks
    if (user.isAdmin) return true;

    const userScopes: string[] = user.scopes ?? [];

    // Every listed permission must be satisfied (AND logic)
    for (const perm of required) {
      if (!userHasPermission(userScopes, perm)) {
        throw new ForbiddenException(
          'You do not have the required permissions for this action.',
        );
      }
    }

    return true;
  }
}
