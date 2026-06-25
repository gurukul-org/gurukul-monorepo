'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { AcademicTermQueryKey } from '../types/AcademicTermQueryKey';

export interface AcademicTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  classCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAcademicTermDto {
  name: string;
  startDate: string;
  endDate: string;
  ignoreWarnings?: boolean;
}

export interface UpdateAcademicTermDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  ignoreWarnings?: boolean;
}

export function useAcademicTerms(status?: string) {
  return useQuery({
    queryKey: [AcademicTermQueryKey.List, status],
    queryFn: async () => {
      const { data } = await axios.get<AcademicTerm[]>('/academic-terms', {
        params: status ? { status } : undefined,
      });
      return data;
    },
  });
}

export function useAcademicTerm(id: string, enabled = true) {
  return useQuery({
    queryKey: [AcademicTermQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<AcademicTerm>(`/academic-terms/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateAcademicTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateAcademicTermDto) => {
      const { data } = await axios.post<AcademicTerm>('/academic-terms', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.List],
      });
    },
  });
}

export function useUpdateAcademicTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateAcademicTermDto;
    }) => {
      const { data } = await axios.patch<AcademicTerm>(
        `/academic-terms/${id}`,
        dto,
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.List],
      });
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.Detail, id],
      });
    },
  });
}

export function useActivateAcademicTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<AcademicTerm>(
        `/academic-terms/${id}/activate`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.List],
      });
    },
  });
}

export function useDeactivateAcademicTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<AcademicTerm>(
        `/academic-terms/${id}/deactivate`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.List],
      });
    },
  });
}

export function useArchiveAcademicTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<AcademicTerm>(
        `/academic-terms/${id}/archive`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.List],
      });
    },
  });
}

export function useDeleteAcademicTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/academic-terms/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [AcademicTermQueryKey.List],
      });
    },
  });
}
