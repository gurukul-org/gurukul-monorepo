'use client';

import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/lib/store/auth';

import { refreshAccessToken } from './use-setup-axios';

export function useBootstrapAuth() {
  const didBootstrap = useRef(false);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    refreshAccessToken()
      .catch(() => {
        // No active session — fine, user remains unauthenticated.
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, [setBootstrapping]);
}
