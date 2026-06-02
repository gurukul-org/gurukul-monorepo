'use client';

import { useRouter } from 'next/navigation';

import { useShowApiError } from '@/hooks/api/use-show-api-error';
import type {
  CreateTenantDto,
  CreateTenantResponse,
  LoginDto,
  LoginResponse,
} from '@/lib/api/types';
import { getTenantUrl } from '@/lib/env';
import { useAuthStore } from '@/lib/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosResponse } from 'axios';

export function useRequestLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const router = useRouter();
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: LoginDto) =>
      axios.post<LoginResponse>('/users/login', payload),
    onSuccess: (res: AxiosResponse<LoginResponse>) => {
      setAccessToken(res.data.accessToken);
      queryClient.invalidateQueries();
      router.replace('/dashboard');
    },
    onError: (err) => showError(err),
  });
}

export function useRequestSignup() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: CreateTenantDto) =>
      axios.post<CreateTenantResponse>('/tenants', payload),
    onSuccess: (res: AxiosResponse<CreateTenantResponse>, vars) => {
      setAccessToken(res.data.accessToken);
      queryClient.invalidateQueries();
      // Hard navigate across subdomains so the API sees the new Host header
      // and the cookie-domain RT applies on the next refresh call.
      window.location.assign(getTenantUrl(vars.subdomain, '/dashboard'));
    },
    onError: (err) => showError(err),
  });
}

export function useRequestLogout() {
  const clearAccessToken = useAuthStore((s) => s.clearAccessToken);
  const queryClient = useQueryClient();
  const router = useRouter();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: () => axios.post('/users/signout'),
    onSuccess: () => {
      clearAccessToken();
      queryClient.clear();
      router.replace('/login');
    },
    onError: (err) => {
      // Server may already have invalidated the session; still drop local state.
      clearAccessToken();
      queryClient.clear();
      router.replace('/login');
      showError(err);
    },
  });
}
