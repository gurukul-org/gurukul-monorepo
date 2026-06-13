'use client';

import { useAuthStore } from '@/lib/store/auth';
import {
  userHasPermission,
  type PermissionEntry,
  type PermissionId,
} from '@repo/permissions';

/**
 * React hook to check permissions in the frontend UI.
 * Automatically bypasses checks if the user is an admin.
 *
 * Example usage:
 * ```tsx
 * const { hasPermission, isAdmin } = usePermission();
 *
 * if (hasPermission(PERMS.student.create)) {
 *   return <Button>Add Student</Button>;
 * }
 * ```
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (permission: PermissionEntry | PermissionId): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return userHasPermission(user.scopes || [], permission);
  };

  const hasAllPermissions = (
    permissions: (PermissionEntry | PermissionId)[]
  ): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return permissions.every((p) => hasPermission(p));
  };

  const hasAnyPermission = (
    permissions: (PermissionEntry | PermissionId)[]
  ): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return permissions.some((p) => hasPermission(p));
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin: user?.isAdmin ?? false,
    scopes: user?.scopes || [],
  };
}
