'use client';

import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useSubdomain } from '@/hooks/use-subdomain';
import { getApexUrl } from '@/lib/env';
import { useIsAuthenticated, useIsBootstrapping } from '@/lib/store/auth';
import { buildWorkspaceErrorUrl } from '@/lib/workspace-error';
import {
  isWorkspaceAccessDenied,
  isWorkspaceNotFound,
  isWorkspaceUnreachable,
  useCurrentTenant,
} from '@/services/api/requests/tenants';

export default function TenantLayout({ children }: PropsWithChildren) {
  const { subdomain } = useSubdomain();
  const isBootstrapping = useIsBootstrapping();
  const isAuthenticated = useIsAuthenticated();
  const tenantQuery = useCurrentTenant(isAuthenticated && !isBootstrapping);
  const didRedirectError = useRef(false);
  const didRedirectAuth = useRef(false);

  const errorReason:
    | 'workspace-not-found'
    | 'workspace-unreachable'
    | 'access-denied'
    | null = tenantQuery.isError
    ? isWorkspaceNotFound(tenantQuery.error)
      ? 'workspace-not-found'
      : isWorkspaceAccessDenied(tenantQuery.error)
        ? 'access-denied'
        : isWorkspaceUnreachable(tenantQuery.error)
          ? 'workspace-unreachable'
          : null
    : null;

  const ready =
    !isBootstrapping && !tenantQuery.isPending && tenantQuery.isSuccess;

  useEffect(() => {
    if (!errorReason) return;
    if (didRedirectError.current) return;
    didRedirectError.current = true;
    // All workspace errors route to the picker so the user sees the toast and
    // can retry. ApexLayout bounces unauthenticated users from /workspaces to
    // /login, so this stays correct regardless of session state.
    window.location.replace(
      buildWorkspaceErrorUrl(
        getApexUrl('/workspaces'),
        errorReason,
        subdomain ?? null,
      ),
    );
  }, [errorReason, subdomain]);

  useEffect(() => {
    if (isBootstrapping || isAuthenticated) return;
    if (didRedirectAuth.current) return;
    didRedirectAuth.current = true;
    window.location.replace(getApexUrl('/login'));
  }, [isBootstrapping, isAuthenticated]);

  if (errorReason || !ready || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading…</div>
      </main>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
