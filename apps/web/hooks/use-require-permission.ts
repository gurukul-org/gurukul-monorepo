'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { usePermission } from '@/hooks/use-permission';

import type { PermissionEntry, PermissionId } from '@repo/permissions';

export interface RequirePermissionOptions {
  permission?:
    | PermissionEntry
    | PermissionId
    | (PermissionEntry | PermissionId)[];
  anyOf?: (PermissionEntry | PermissionId)[];
  redirectTo?: string;
}

/**
 * A client-side hook to protect page views from unauthorized access.
 * Automatically checks specified permissions and redirects the user if not allowed.
 *
 * Returns `allowed` boolean. Callers should return `null` (or a skeleton) if `allowed` is false.
 */
export function useRequirePermission({
  permission,
  anyOf,
  redirectTo = '/dashboard',
}: RequirePermissionOptions) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } =
    usePermission();
  const router = useRouter();

  let allowed = true;

  if (permission) {
    if (Array.isArray(permission)) {
      allowed = hasAllPermissions(permission);
    } else {
      allowed = hasPermission(permission);
    }
  }

  if (allowed && anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(anyOf);
  }

  useEffect(() => {
    if (!allowed) {
      router.replace(redirectTo);
    }
  }, [allowed, router, redirectTo]);

  return allowed;
}
