'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { ClassQueryKey } from './classes';
import { StudentQueryKey } from './students';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Enrolment {
  id: string;
  status: string; // ACTIVE | WITHDRAWN | COMPLETED
  enrolledAt: string;
  withdrawReason?: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    rollNumber: string;
    studentStatus: string;
    name: string | null;
    email: string | null;
  };
  class: {
    id: string;
    name: string;
    maxCapacity: number;
    classStatus: string;
    program: { id: string; name: string; code: string } | null;
    academicTerm: { id: string; name: string } | null;
  };
}

export interface CreateEnrolmentDto {
  studentProfileId: string;
  classId: string;
  enrolledAt?: string;
}

export interface BulkCreateEnrolmentDto {
  classId: string;
  studentProfileIds: string[];
  enrolledAt?: string;
}

export interface BulkEnrolResult {
  succeeded: { studentProfileId: string; enrolmentId: string }[];
  failed: { studentProfileId: string; reason: string }[];
}

export interface UpdateEnrolmentDto {
  status?: 'ACTIVE' | 'WITHDRAWN' | 'COMPLETED';
  withdrawReason?: string;
}

export enum EnrolmentQueryKey {
  List = 'enrolments:list',
  Detail = 'enrolments:detail',
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useEnrolments(filters?: {
  studentProfileId?: string;
  classId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: [
      EnrolmentQueryKey.List,
      filters?.studentProfileId,
      filters?.classId,
      filters?.status,
    ],
    queryFn: async () => {
      const { data } = await axios.get<Enrolment[]>('/enrolments', {
        params: filters,
      });
      return data;
    },
  });
}

export function useCreateEnrolment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateEnrolmentDto) => {
      const { data } = await axios.post<Enrolment>('/enrolments', dto);
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [EnrolmentQueryKey.List],
      });
      void queryClient.invalidateQueries({
        queryKey: [ClassQueryKey.Detail, variables.classId],
      });
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
      void queryClient.invalidateQueries({
        queryKey: [StudentQueryKey.Detail, variables.studentProfileId],
      });
    },
  });
}

export function useBulkCreateEnrolment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: BulkCreateEnrolmentDto) => {
      const { data } = await axios.post<BulkEnrolResult>(
        '/enrolments/bulk',
        dto,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [EnrolmentQueryKey.List],
      });
      void queryClient.invalidateQueries({
        queryKey: [ClassQueryKey.Detail, variables.classId],
      });
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
      for (const studentId of variables.studentProfileIds) {
        void queryClient.invalidateQueries({
          queryKey: [StudentQueryKey.Detail, studentId],
        });
      }
    },
  });
}

export function useUpdateEnrolmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateEnrolmentDto;
    }) => {
      const { data } = await axios.patch<Enrolment>(`/enrolments/${id}`, dto);
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [EnrolmentQueryKey.List],
      });
      void queryClient.invalidateQueries({
        queryKey: [EnrolmentQueryKey.Detail, data.id],
      });
      void queryClient.invalidateQueries({
        queryKey: [ClassQueryKey.Detail, data.class.id],
      });
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
      void queryClient.invalidateQueries({
        queryKey: [StudentQueryKey.Detail, data.student.id],
      });
    },
  });
}

export function useWithdrawEnrolment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      withdrawReason,
    }: {
      id: string;
      withdrawReason?: string;
    }) => {
      const { data } = await axios.delete<{ message: string }>(
        `/enrolments/${id}`,
        {
          data: { withdrawReason },
        },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [EnrolmentQueryKey.List],
      });
      void queryClient.invalidateQueries({ queryKey: [ClassQueryKey.Detail] });
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
      void queryClient.invalidateQueries({
        queryKey: [StudentQueryKey.Detail],
      });
    },
  });
}
