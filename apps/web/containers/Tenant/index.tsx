'use client';

import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useSubdomain } from '@/hooks/use-subdomain';
import { getApexUrl } from '@/lib/env';
import { useIsAuthenticated, useIsBootstrapping } from '@/lib/store/auth';
import { buildWorkspaceErrorUrl } from '@/lib/workspace-error';
import {
  isWorkspaceNotFound,
  isWorkspaceUnreachable,
  useCurrentTenant,
} from '@/services/api/requests/tenants';

export default function TenantLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { subdomain } = useSubdomain();
  const isBootstrapping = useIsBootstrapping();
  const isAuthenticated = useIsAuthenticated();
  const tenantQuery = useCurrentTenant();
  const didRedirectMissing = useRef(false);

  const isLoginPath = pathname === '/login';
  const workspaceMissing =
    tenantQuery.isError &&
    (isWorkspaceNotFound(tenantQuery.error) ||
      isWorkspaceUnreachable(tenantQuery.error));
  const ready =
    !isBootstrapping && !tenantQuery.isPending && tenantQuery.isSuccess;

  useEffect(() => {
    if (!workspaceMissing) return;
    if (didRedirectMissing.current) return;
    didRedirectMissing.current = true;
    const reason = isWorkspaceNotFound(tenantQuery.error)
      ? 'workspace-not-found'
      : 'workspace-unreachable';
    window.location.replace(
      buildWorkspaceErrorUrl(getApexUrl('/login'), reason, subdomain ?? null),
    );
  }, [workspaceMissing, subdomain, tenantQuery.error]);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated && isLoginPath) {
      router.replace('/dashboard');
      return;
    }
    if (!isAuthenticated && !isLoginPath) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, isLoginPath, router]);

  if (workspaceMissing || !ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading…</div>
      </main>
    );
  }

  if (isAuthenticated && isLoginPath) return null;
  if (!isAuthenticated && !isLoginPath) return null;

  return <>{children}</>;
}
