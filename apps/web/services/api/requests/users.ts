'use client';

import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

import { UserQueryKey } from '../types/UserQueryKey';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailDto {
  currentPassword: string;
  email: string;
}

export function useCurrentUserProfile(enabled = true) {
  return useQuery({
    queryKey: [UserQueryKey.Me],
    queryFn: async () => {
      const { data } = await axios.get<UserProfile>('/users/me');
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async (payload: UpdateProfileDto) => {
      const { data } = await axios.patch<UserProfile>('/users/me', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([UserQueryKey.Me], data);
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.Me] });
      toast.success('Profile updated successfully');
    },
    onError: (err) => showError(err),
  });
}

export function useChangeUserPassword() {
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async (payload: ChangePasswordDto) => {
      const { data } = await axios.patch<{ message: string }>(
        '/users/me/password',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully');
    },
    onError: (err) => showError(err),
  });
}

export function useChangeUserEmail() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async (payload: ChangeEmailDto) => {
      const { data } = await axios.patch<{ message: string }>(
        '/users/me/email',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.Me] });
      toast.success(data.message || 'Email changed successfully');
    },
    onError: (err) => showError(err),
  });
}
