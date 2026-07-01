import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface ParentListItem {
  id: string;
  name: string | null;
  email: string | null;
  emergencyPhone: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ParentDetail {
  id: string;
  name: string | null;
  email: string | null;
  membershipId: string | null;
  emergencyPhone: string;
  audit: {
    createdBy: { id: string; name: string } | null;
    createdAt: string;
    updatedBy: { id: string; name: string } | null;
    updatedAt: string;
    deletedAt: string | null;
  };
  students: Array<{
    studentProfileId: string;
    relationship: string;
    studentName: string | null;
    studentEmail: string | null;
    rollNumber: string | null;
  }>;
}

export interface CreateParentDto {
  tenantMembershipId?: string;
  emergencyPhone: string;
}

export interface UpdateParentDto {
  tenantMembershipId?: string | null;
  emergencyPhone?: string;
}

export function useParents(params?: {
  search?: string;
  filterNoStudents?: boolean;
}) {
  return useQuery({
    queryKey: ['parents', params],
    queryFn: async () => {
      const { data } = await axios.get<{
        parents: ParentListItem[];
        nextCursor: string | null;
      }>('/parents', { params });
      return data;
    },
  });
}

export function useParentDetail(id: string) {
  return useQuery({
    queryKey: ['parents', id],
    queryFn: async () => {
      const { data } = await axios.get<ParentDetail>(`/parents/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateParentDto) => {
      const { data } = await axios.post<ParentDetail>('/parents', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}

export function useUpdateParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateParentDto }) => {
      const { data } = await axios.patch<ParentDetail>(`/parents/${id}`, dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      queryClient.invalidateQueries({ queryKey: ['parents', data.id] });
    },
  });
}

export function useDeleteParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/parents/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}
