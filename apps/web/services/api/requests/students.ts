'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudentEnrolment {
  id: string;
  status: string; // ACTIVE | WITHDRAWN | COMPLETED
  enrolledAt: string;
  class: {
    id: string;
    name: string;
    program: { id: string; name: string; code: string } | null;
    academicTerm: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    } | null;
  };
}

export interface StudentParent {
  parentProfileId: string;
  relationship: string;
  parentName: string | null;
  parentEmail: string | null;
  emergencyPhone: string | null;
}

export interface StudentAudit {
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedBy: { id: string; name: string } | null;
  updatedAt: string;
  deletedAt: string | null;
}

/** Shape returned in the list */
export interface StudentListItem {
  id: string;
  name: string | null;
  email: string | null;
  rollNumber: string;
  admissionDate: string;
  status: string; // ACTIVE | SUSPENDED | GRADUATED | INACTIVE (academic)
  accountStatus: string | null; // PENDING | INVITED | ACTIVE | ... (portal access)
  enrolmentCount: number;
  parentCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned in detail / mutation responses */
export interface Student extends StudentListItem {
  membershipId: string | null;
  audit: StudentAudit;
  enrolments: StudentEnrolment[];
  parents: StudentParent[];
}

export interface StudentListResponse {
  students: StudentListItem[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateStudentDto {
  rollNumber: string;
  admissionDate?: string;
  tenantMembershipId?: string;
}

export interface UpdateStudentDto {
  rollNumber?: string;
  admissionDate?: string;
  tenantMembershipId?: string | null;
}

export interface ChangeStudentStatusDto {
  status: string;
  ignoreWarnings?: boolean;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export enum StudentQueryKey {
  List = 'students:list',
  Detail = 'students:detail',
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useStudents(params?: {
  search?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}) {
  return useQuery({
    queryKey: [
      StudentQueryKey.List,
      params?.search,
      params?.status,
      params?.limit,
      params?.cursor,
    ],
    queryFn: async () => {
      const { data } = await axios.get<StudentListResponse>('/students', {
        params,
      });
      return data;
    },
  });
}

export function useStudent(id: string, enabled = true) {
  return useQuery({
    queryKey: [StudentQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<Student>(`/students/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateStudentDto) => {
      const { data } = await axios.post<Student>('/students', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateStudentDto }) => {
      const { data } = await axios.patch<Student>(`/students/${id}`, dto);
      return data;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
      void queryClient.invalidateQueries({
        queryKey: [StudentQueryKey.Detail, id],
      });
    },
  });
}

export function useChangeStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: ChangeStudentStatusDto;
    }) => {
      const { data } = await axios.patch<Student>(
        `/students/${id}/status`,
        dto,
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
      void queryClient.invalidateQueries({
        queryKey: [StudentQueryKey.Detail, id],
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/students/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [StudentQueryKey.List] });
    },
  });
}
