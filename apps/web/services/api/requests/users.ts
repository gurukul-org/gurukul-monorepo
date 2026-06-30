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

export interface TenantUserRole {
  id: string;
  name: string;
  rank: number;
}

export interface MemberActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TenantUser {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  joinedAt: string | null;
  isAdmin: boolean;
  roles: TenantUserRole[];
  invitedBy?: MemberActor | null;
  updatedBy?: MemberActor | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Full member profile returned by GET /users/:membershipId. */
export interface MemberDetail {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  joinedAt: string | null;
  isFounder: boolean;
  isAdmin: boolean;
  roles: TenantUserRole[];
  invitedBy: MemberActor | null;
  createdBy: MemberActor | null;
  updatedBy: MemberActor | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUsersResponse {
  users: TenantUser[];
  nextCursor: string | null;
}

export function useTenantUsers({
  limit = 25,
  cursor,
  status,
}: { limit?: number; cursor?: string; status?: string } = {}) {
  return useQuery({
    queryKey: [UserQueryKey.List, { limit, cursor, status }],
    queryFn: async () => {
      const { data } = await axios.get<TenantUsersResponse>('/users', {
        params: { limit, cursor, status },
      });
      return data;
    },
  });
}

export function useTenantMember(membershipId: string | null, enabled = true) {
  return useQuery({
    queryKey: [UserQueryKey.Detail, membershipId],
    queryFn: async () => {
      const { data } = await axios.get<MemberDetail>(`/users/${membershipId}`);
      return data;
    },
    enabled: enabled && !!membershipId,
  });
}

export function useRevokeUserAccess() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/users/${membershipId}`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      toast.success(data.message || 'User access revoked successfully');
    },
    onError: (err) => showError(err),
  });
}

export function useChangeMemberRoles() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async ({
      membershipId,
      roleIds,
    }: {
      membershipId: string;
      roleIds: string[];
    }) => {
      const { data } = await axios.patch<{ message: string }>(
        `/users/${membershipId}/roles`,
        { roleIds },
      );
      return data;
    },
    onSuccess: (data, { membershipId }) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      queryClient.invalidateQueries({
        queryKey: [UserQueryKey.Detail, membershipId],
      });
      toast.success(data.message || 'Member roles updated successfully');
    },
    onError: (err) => showError(err),
  });
}

export function useSuspendMember() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { data } = await axios.post<{ message: string }>(
        `/users/${membershipId}/suspend`,
      );
      return data;
    },
    onSuccess: (data, membershipId) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      queryClient.invalidateQueries({
        queryKey: [UserQueryKey.Detail, membershipId],
      });
      toast.success(data.message || 'Member suspended successfully');
    },
    onError: (err) => showError(err),
  });
}

export function useReactivateMember() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { data } = await axios.post<{ message: string }>(
        `/users/${membershipId}/reactivate`,
      );
      return data;
    },
    onSuccess: (data, membershipId) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      queryClient.invalidateQueries({
        queryKey: [UserQueryKey.Detail, membershipId],
      });
      toast.success(data.message || 'Member reactivated successfully');
    },
    onError: (err) => showError(err),
  });
}
