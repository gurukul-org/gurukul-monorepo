'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { RoleQueryKey } from '../types/RoleQueryKey';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  rank: number;
  isAdmin: boolean;
  isSystemRole: boolean;
  permissions: string[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionItem {
  id: string;
  label: string;
  description: string | null;
  kind: string;
}

export interface FeatureItem {
  key: string;
  title: string;
  iconName: string | null;
  permissions: PermissionItem[];
}

export interface PermissionCategory {
  category: string;
  features: FeatureItem[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  rank: number;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  rank?: number;
  permissions?: string[];
}

export function useRoles() {
  return useQuery({
    queryKey: [RoleQueryKey.List],
    queryFn: async () => {
      const { data } = await axios.get<Role[]>('/roles');
      return data;
    },
  });
}

export function useRole(id: string, enabled = true) {
  return useQuery({
    queryKey: [RoleQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<Role>(`/roles/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useRolePermissionsRegistry() {
  return useQuery({
    queryKey: [RoleQueryKey.Registry],
    queryFn: async () => {
      const { data } = await axios.get<PermissionCategory[]>(
        '/roles/permissions/registry'
      );
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // Registry is highly static
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateRoleDto) => {
      const { data } = await axios.post<Role>('/roles', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RoleQueryKey.List] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateRoleDto }) => {
      const { data } = await axios.patch<Role>(`/roles/${id}`, dto);
      return data;
    },
    onSuccess: (data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [RoleQueryKey.List] });
      void queryClient.invalidateQueries({ queryKey: [RoleQueryKey.Detail, id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(`/roles/${id}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RoleQueryKey.List] });
    },
  });
}
