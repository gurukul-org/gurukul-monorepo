import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface TeacherListItem {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
  createdAt: string;
}

export interface TeacherDetail {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
  classes: Array<{
    classId: string;
    className: string;
    isPrimary: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export enum TeacherQueryKey {
  List = 'teachers:list',
  Detail = 'teachers:detail',
}

export function useTeachers(params?: {
  search?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}) {
  return useQuery({
    queryKey: [
      TeacherQueryKey.List,
      params?.search,
      params?.status,
      params?.limit,
      params?.cursor,
    ],
    queryFn: async () => {
      const { data } = await axios.get<{
        teachers: TeacherListItem[];
        nextCursor: string | null;
      }>('/teachers', { params });
      return data;
    },
  });
}

export function useTeacherDetail(id: string) {
  return useQuery({
    queryKey: [TeacherQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<TeacherDetail>(`/teachers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
