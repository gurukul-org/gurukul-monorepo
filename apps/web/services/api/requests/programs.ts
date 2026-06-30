'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { ProgramQueryKey } from '../types/ProgramQueryKey';

export interface ProgramCourse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: number | null;
  createdAt: string;
  activeEnrollmentCount: number;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description: string | null;
  courseCount: number;
  activeEnrollmentCount: number;
  courses?: ProgramCourse[];
  totalEnrollmentCount?: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateProgramDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateProgramDto {
  name?: string;
  code?: string;
  description?: string;
  ignoreWarnings?: boolean;
}

export function usePrograms(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [ProgramQueryKey.List, params?.search, params?.status],
    queryFn: async () => {
      const { data } = await axios.get<Program[]>('/programs', {
        params,
      });
      return data;
    },
  });
}

export function useProgram(id: string, enabled = true) {
  return useQuery({
    queryKey: [ProgramQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<Program>(`/programs/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProgramDto) => {
      const { data } = await axios.post<Program>('/programs', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [ProgramQueryKey.List],
      });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProgramDto }) => {
      const { data } = await axios.patch<Program>(`/programs/${id}`, dto);
      return data;
    },
    onSuccess: (data, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: [ProgramQueryKey.List],
      });
      void queryClient.invalidateQueries({
        queryKey: [ProgramQueryKey.Detail, id],
      });
    },
  });
}

export function useArchiveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<Program>(`/programs/${id}/archive`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [ProgramQueryKey.List],
      });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/programs/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [ProgramQueryKey.List],
      });
    },
  });
}
