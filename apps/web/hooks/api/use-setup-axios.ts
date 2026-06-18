'use client';

import { useEffect, useRef, useState } from 'react';

import { getApexUrl, getApiBaseUrl } from '@/lib/env';
import { useAuthStore } from '@/lib/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

const REFRESH_PATH = '/users/refresh';

let inflightRefresh: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!inflightRefresh) {
    inflightRefresh = axios
      .post<{ accessToken: string }>(REFRESH_PATH, null, { _retry: true })
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        inflightRefresh = null;
      });
  }
  return inflightRefresh;
}

export function useSetupAxios(instance: AxiosInstance) {
  const queryClient = useQueryClient();

  // Ref lets interceptors registered synchronously read the latest queryClient
  // without re-registering on every change.
  const hardLogoutRef = useRef<() => void>(() => {});
  hardLogoutRef.current = () => {
    useAuthStore.getState().clearAccessToken();
    queryClient.clear();
    // Always cross to apex — subdomain has no login route.
    window.location.replace(getApexUrl('/login'));
  };

  // Configure axios synchronously on first render. Child components fire
  // queries from effects that run before the parent's useEffect, so doing
  // this in useEffect would send the first request to the current origin
  // (the Next dev server on :3000) instead of the API on :8000, and would
  // omit `withCredentials` so the refresh-token cookie wouldn't be sent.
  const [ejectors] = useState(() => {
    instance.defaults.baseURL = getApiBaseUrl();
    instance.defaults.withCredentials = true;
    instance.defaults.timeout = 15_000;

    const req = instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const url = config.url ?? '';
        const isRefresh = url.startsWith(REFRESH_PATH);
        const { accessToken } = useAuthStore.getState();
        if (accessToken && !isRefresh) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
    );

    const res = instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const original = error.config as InternalAxiosRequestConfig | undefined;
        if (!original) return Promise.reject(error);

        const url = original.url ?? '';
        const isRefresh = url.startsWith(REFRESH_PATH);

        if (status === 401 && isRefresh) {
          hardLogoutRef.current();
          return Promise.reject(error);
        }

        if (status === 401 && !original._retry) {
          try {
            const newToken = await refreshAccessToken();
            original._retry = true;
            original.headers['Authorization'] = `Bearer ${newToken}`;
            return instance(original);
          } catch (refreshErr) {
            hardLogoutRef.current();
            return Promise.reject(refreshErr);
          }
        }

        if (
          status === 403 &&
          !isRefresh &&
          useAuthStore.getState().accessToken
        ) {
          // A 403 Forbidden from /tenants/current means the user is not a member of this tenant.
          // Let the tenant layout redirect them to the apex workspace picker with an access-denied toast.
          // For any other endpoints, the user simply lacks permissions for that action, so do not log them out.
          return Promise.reject(error);
        }

        return Promise.reject(error);
      },
    );

    return { req, res };
  });

  useEffect(() => {
    return () => {
      instance.interceptors.request.eject(ejectors.req);
      instance.interceptors.response.eject(ejectors.res);
    };
  }, [instance, ejectors]);
}
