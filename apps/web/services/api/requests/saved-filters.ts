'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface SavedFilter {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  feature: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedFilterDto {
  name: string;
  feature: string;
  filters: Record<string, any>;
}

export enum SavedFilterQueryKey {
  List = 'saved-filters:list',
}

export function useSavedFilters(feature: string) {
  return useQuery({
    queryKey: [SavedFilterQueryKey.List, feature],
    queryFn: async () => {
      const { data } = await axios.get<SavedFilter[]>('/saved-filters', {
        params: { feature },
      });
      return data;
    },
    enabled: !!feature,
  });
}

export function useCreateSavedFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateSavedFilterDto) => {
      const { data } = await axios.post<SavedFilter>('/saved-filters', dto);
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [SavedFilterQueryKey.List, data.feature],
      });
    },
  });
}

export function useDeleteSavedFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, feature }: { id: string; feature: string }) => {
      const { data } = await axios.delete<{ message: string }>(
        `/saved-filters/${id}`,
      );
      return { data, feature };
    },
    onSuccess: ({ feature }) => {
      void queryClient.invalidateQueries({
        queryKey: [SavedFilterQueryKey.List, feature],
      });
    },
  });
}
