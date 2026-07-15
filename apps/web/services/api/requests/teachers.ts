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

export function useTeachers(params?: { search?: string }) {
  return useQuery({
    queryKey: ['teachers', params],
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
    queryKey: ['teachers', id],
    queryFn: async () => {
      const { data } = await axios.get<TeacherDetail>(`/teachers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
