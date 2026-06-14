'use client';

import { useRouter } from 'next/navigation';

import { useShowApiError } from '@/hooks/api/use-show-api-error';
import type {
  ForgotPasswordDto,
  LoginDto,
  LoginResponse,
  MembershipDto,
  MessageResponse,
  OnboardingDto,
  OnboardingResponse,
  RegisterDto,
  ResetPasswordDto,
} from '@/lib/api/types';
import { getApexUrl, getTenantUrl } from '@/lib/env';
import { useAuthStore } from '@/lib/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosResponse } from 'axios';

import { AuthQueryKey } from '../types/AuthQueryKey';

export function useRequestLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: LoginDto) =>
      axios.post<LoginResponse>('/users/login', payload),
    onSuccess: (res: AxiosResponse<LoginResponse>) => {
      setAccessToken(res.data.accessToken);
      // ApexLayout handles post-login routing once memberships refetch.
      queryClient.invalidateQueries();
    },
    onError: (err) => showError(err),
  });
}

export function useRequestRegister() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const queryClient = useQueryClient();
  const router = useRouter();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: RegisterDto) =>
      axios.post<LoginResponse>('/users/register', payload),
    onSuccess: (res: AxiosResponse<LoginResponse>) => {
      setAccessToken(res.data.accessToken);
      queryClient.invalidateQueries();
      router.replace('/onboarding');
    },
    onError: (err) => showError(err),
  });
}

export function useRequestOnboarding() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: OnboardingDto) =>
      axios.post<OnboardingResponse>('/tenants', payload),
    onSuccess: (res: AxiosResponse<OnboardingResponse>, vars) => {
      setAccessToken(res.data.accessToken);
      queryClient.invalidateQueries();
      window.location.assign(getTenantUrl(vars.subdomain, '/dashboard'));
    },
    onError: (err) => showError(err),
  });
}

export function useMemberships(enabled = true) {
  return useQuery({
    queryKey: [AuthQueryKey.Memberships],
    queryFn: async () => {
      const { data } = await axios.get<MembershipDto[]>(
        '/users/me/memberships',
      );
      return data;
    },
    enabled,
    retry: false,
  });
}

export function useRequestLogout() {
  const clearAccessToken = useAuthStore((s) => s.clearAccessToken);
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  const finish = () => {
    clearAccessToken();
    queryClient.clear();
    window.location.replace(getApexUrl('/login'));
  };

  return useMutation({
    mutationFn: () => axios.post('/users/signout'),
    onSuccess: finish,
    onError: (err) => {
      // Server may already have invalidated the session; still drop local state.
      finish();
      showError(err);
    },
  });
}

export function useRequestForgotPassword() {
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: ForgotPasswordDto) =>
      axios.post<MessageResponse>('/users/forgot-password', payload),
    onError: (err) => showError(err),
  });
}

export function useRequestResetPassword() {
  const showError = useShowApiError();

  return useMutation({
    mutationFn: (payload: ResetPasswordDto) =>
      axios.post<MessageResponse>('/users/reset-password', payload),
    onError: (err) => showError(err),
  });
}
