'use client';

import { useEffect, useState } from 'react';

import { parseHost } from '@/lib/env';

export interface SubdomainState {
  host: string | null;
  subdomain: string | null;
  isApex: boolean | null;
  isReady: boolean;
}

export function useSubdomain(): SubdomainState {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    setHost(window.location.host);
  }, []);

  if (host === null) {
    return { host: null, subdomain: null, isApex: null, isReady: false };
  }

  const { subdomain, isApex } = parseHost(host);
  return { host, subdomain, isApex, isReady: true };
}
