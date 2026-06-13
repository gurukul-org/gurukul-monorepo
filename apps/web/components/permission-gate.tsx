'use client';

import React from 'react';

import { usePermission } from '@/hooks/use-permission';
import type { PermissionEntry, PermissionId } from '@repo/permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  /**
   * Required permission(s). If multiple are provided, the user must satisfy ALL.
   */
  permission?: PermissionEntry | PermissionId | (PermissionEntry | PermissionId)[];
  /**
   * Required permission(s) where the user must satisfy AT LEAST ONE.
   */
  anyOf?: (PermissionEntry | PermissionId)[];
  /**
   * Fallback UI to render if the user does not have permission.
   */
  fallback?: React.ReactNode;
}

/**
 * A declarative component to guard parts of the UI based on permissions.
 *
 * Example:
 * ```tsx
 * <PermissionGate permission={PERMS.student.create} fallback={<Alert>Access Denied</Alert>}>
 *   <CreateStudentForm />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permission,
  anyOf,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();

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

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
