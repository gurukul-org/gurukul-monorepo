'use client';

import type { TenantType } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import axios from 'axios';

import { TenantQueryKey } from '../types/TenantQueryKey';

export interface CurrentTenant {
  id: string;
  subdomain: string;
  name: string;
  type: TenantType;
}

export function useCurrentTenant(enabled = true) {
  return useQuery({
    queryKey: [TenantQueryKey.Current],
    queryFn: async () => {
      const { data } = await axios.get<CurrentTenant>('/tenants/current');
      return data;
    },
    enabled,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
}

export function isWorkspaceNotFound(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}

export function isWorkspaceUnreachable(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  if (error.response) return false;
  // No response object → network error, timeout, or DNS failure.
  return true;
}
