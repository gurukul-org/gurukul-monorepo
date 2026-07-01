'use client';

import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

import { UserQueryKey } from '../types/UserQueryKey';

export interface AddRolesPayload {
  membershipId: string;
  roleIds: string[];
}

export interface RemoveRolesPayload {
  membershipId: string;
  roleIds: string[];
}

export interface RoleSwap {
  removeRoleId: string;
  addRoleId: string;
}

export interface ReplaceRolesPayload {
  membershipId: string;
  swaps: RoleSwap[];
}

export function useAddMemberRoles() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async ({ membershipId, roleIds }: AddRolesPayload) => {
      const { data } = await axios.post<{
        message: string;
        roles: { id: string; name: string }[];
      }>(`/members/${membershipId}/roles`, { roleIds });
      return data;
    },
    onSuccess: (data, { membershipId }) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      queryClient.invalidateQueries({
        queryKey: [UserQueryKey.Detail, membershipId],
      });
      toast.success(data.message || 'Roles added successfully.');
    },
    onError: (err) => showError(err),
  });
}

export function useRemoveMemberRoles() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async ({ membershipId, roleIds }: RemoveRolesPayload) => {
      const { data } = await axios.delete<{ message: string }>(
        `/members/${membershipId}/roles`,
        { data: { roleIds } },
      );
      return data;
    },
    onSuccess: (data, { membershipId }) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      queryClient.invalidateQueries({
        queryKey: [UserQueryKey.Detail, membershipId],
      });
      toast.success(data.message || 'Roles removed successfully.');
    },
    onError: (err) => showError(err),
  });
}

export function useReplaceMemberRoles() {
  const queryClient = useQueryClient();
  const showError = useShowApiError();

  return useMutation({
    mutationFn: async ({ membershipId, swaps }: ReplaceRolesPayload) => {
      const { data } = await axios.put<{
        message: string;
        roles: { id: string; name: string }[];
      }>(`/members/${membershipId}/roles`, { swaps });
      return data;
    },
    onSuccess: (data, { membershipId }) => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.List] });
      queryClient.invalidateQueries({
        queryKey: [UserQueryKey.Detail, membershipId],
      });
      toast.success(data.message || 'Roles replaced successfully.');
    },
    onError: (err) => showError(err),
  });
}
