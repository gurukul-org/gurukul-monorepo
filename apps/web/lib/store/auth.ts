import type { JwtPayload } from '@/lib/api/types';
import { decodeJwt } from '@/lib/auth/jwt';
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: JwtPayload | null;
  isBootstrapping: boolean;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
  setBootstrapping: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isBootstrapping: true,
  setAccessToken: (token) =>
    set({ accessToken: token, user: decodeJwt(token) }),
  clearAccessToken: () => set({ accessToken: null, user: null }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));

export const useAccessToken = () => useAuthStore((s) => s.accessToken);
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => !!s.accessToken);
export const useIsBootstrapping = () => useAuthStore((s) => s.isBootstrapping);
