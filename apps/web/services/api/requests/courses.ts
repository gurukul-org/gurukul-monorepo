'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface CourseProgram {
  id: string;
  name: string;
  code: string;
  classes?: Array<{
    id: string;
    name: string;
    status: string;
    academicTerm?: {
      name: string;
    };
  }>;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: number | null;
  program: CourseProgram;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; firstName: string; lastName: string } | null;
  updater?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateCourseDto {
  programId: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
}

export interface UpdateCourseDto {
  name?: string;
  code?: string;
  description?: string;
  credits?: number;
}

export enum CourseQueryKey {
  List = 'courses:list',
  Detail = 'courses:detail',
}

export function useCourses(params?: { programId?: string; search?: string }) {
  return useQuery({
    queryKey: [CourseQueryKey.List, params?.programId, params?.search],
    queryFn: async () => {
      const { data } = await axios.get<Course[]>('/courses', { params });
      return data;
    },
  });
}

export function useCourse(id: string, enabled = true) {
  return useQuery({
    queryKey: [CourseQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<Course>(`/courses/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCourseDto) => {
      const { data } = await axios.post<Course>('/courses', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CourseQueryKey.List] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCourseDto }) => {
      const { data } = await axios.patch<Course>(`/courses/${id}`, dto);
      return data;
    },
    onSuccess: (data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [CourseQueryKey.List] });
      void queryClient.invalidateQueries({
        queryKey: [CourseQueryKey.Detail, id],
      });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/courses/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CourseQueryKey.List] });
    },
  });
}
