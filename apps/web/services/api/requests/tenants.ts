'use client';

import type { TenantType } from '@/lib/api/types';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export interface WorkspaceSettings {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  memberCount: number;
}

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: [TenantQueryKey.Settings],
    queryFn: async () => {
      const { data } = await axios.get<WorkspaceSettings>(
        '/tenants/current/settings',
      );
      return data;
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await axios.patch<WorkspaceSettings>(
        '/tenants/current',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [TenantQueryKey.Settings],
      });
      void queryClient.invalidateQueries({
        queryKey: [TenantQueryKey.Current],
      });
    },
    onError: (err) => showError(err),
  });
}

export function isWorkspaceNotFound(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}

export function isWorkspaceAccessDenied(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 403;
}

export function isWorkspaceUnreachable(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  if (error.response) return false;
  // No response object → network error, timeout, or DNS failure.
  return true;
}
