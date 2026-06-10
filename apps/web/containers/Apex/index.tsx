'use client';

import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { getTenantUrl } from '@/lib/env';
import { useIsAuthenticated, useIsBootstrapping } from '@/lib/store/auth';
import { useMemberships } from '@/services/api/requests/auth';

export default function ApexLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const isBootstrapping = useIsBootstrapping();
  const isAuthenticated = useIsAuthenticated();
  const didRedirect = useRef(false);

  const membershipsQuery = useMemberships(isAuthenticated && !isBootstrapping);
  const memberships = membershipsQuery.data;
  const hasMemberships = !!memberships && memberships.length > 0;

  useEffect(() => {
    if (isBootstrapping || didRedirect.current) return;
    if (isAuthenticated && !memberships) return;

    const isSignup = pathname === '/signup';
    const isLogin = pathname === '/login';
    const isOnboarding = pathname === '/onboarding';
    const isWorkspaces = pathname === '/workspaces';

    if (!isAuthenticated) {
      // /onboarding and /workspaces require auth — bounce to /login.
      if (isOnboarding || isWorkspaces) {
        didRedirect.current = true;
        router.replace('/login');
      }
      return;
    }

    // Authenticated, no memberships → /onboarding is the only valid destination.
    if (!hasMemberships) {
      if (isSignup || isLogin || isWorkspaces) {
        didRedirect.current = true;
        router.replace('/onboarding');
      }
      return;
    }

    // Authenticated with memberships.
    if (isSignup || isLogin) {
      didRedirect.current = true;
      router.replace('/workspaces');
      return;
    }

    if (isOnboarding) {
      didRedirect.current = true;
      window.location.assign(
        getTenantUrl(memberships[0]!.tenant.subdomain, '/dashboard'),
      );
      return;
    }
  }, [
    isBootstrapping,
    isAuthenticated,
    memberships,
    hasMemberships,
    pathname,
    router,
  ]);

  return <>{children}</>;
}
