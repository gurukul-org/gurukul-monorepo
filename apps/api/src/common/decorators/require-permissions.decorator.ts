import { SetMetadata } from '@nestjs/common';

import type { PermissionEntry, PermissionId } from '@repo/permissions';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Declare which permissions a route requires. Accepts PermissionEntry objects
 * from PERMS.* (autocomplete-friendly) or raw PermissionId strings.
 *
 * When multiple permissions are listed they are checked with AND semantics:
 * the user must hold every one. For OR semantics, use a single entry whose
 * feature `all` grants the alternatives.
 */
export const RequirePermissions = (
  ...permissions: (PermissionEntry | PermissionId)[]
) => SetMetadata(PERMISSIONS_KEY, permissions);
