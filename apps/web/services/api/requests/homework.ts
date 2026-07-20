'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface AssignmentQuestion {
  id: string;
  text: string;
  marks: number;
  referenceAnswer?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  marks: number;
  questions: AssignmentQuestion[];
  className: string;
  classId?: string;
  submissionStatus?: 'Not submitted' | 'Submitted' | 'Marked';
  score?: number | null;
  submissionCount?: number;
  submission?: AssignmentSubmission | null;
}

export interface Answer {
  questionIndex: number;
  value: string;
  score?: number;
}

export interface AssignmentSubmission {
  id: string;
  answers: Answer[];
  status: 'SUBMITTED' | 'MARKED';
  score?: number | null;
  remarks?: string | null;
  submittedAt: string;
  markedAt?: string | null;
  markedBy?: { firstName: string; lastName: string } | null;
}

export interface StudentSubmissionListItem {
  studentProfileId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Not submitted' | 'Submitted' | 'Marked';
  submissionDetails: {
    id: string;
    answers: Answer[];
    score: number | null;
    remarks: string | null;
    submittedAt: string;
    markedAt: string | null;
  } | null;
}

export interface CreateAssignmentDto {
  classId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  marks: number;
  questions: AssignmentQuestion[];
}

export interface SubmitAssignmentDto {
  answers: Answer[];
}

export interface MarkSubmissionDto {
  score: number;
  remarks?: string;
  answers?: Answer[];
}

export enum HomeworkQueryKey {
  List = 'homework:list',
  Detail = 'homework:detail',
  Submissions = 'homework:submissions',
}

export function useAssignments() {
  return useQuery({
    queryKey: [HomeworkQueryKey.List],
    queryFn: async () => {
      const { data } = await axios.get<Assignment[]>('/assignments');
      return data;
    },
  });
}

export function useAssignment(id: string, enabled = true) {
  return useQuery({
    queryKey: [HomeworkQueryKey.Detail, id],
    queryFn: async () => {
      const { data } = await axios.get<Assignment>(`/assignments/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateAssignmentDto) => {
      const { data } = await axios.post<Assignment>('/assignments', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [HomeworkQueryKey.List] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete<{ message: string }>(
        `/assignments/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [HomeworkQueryKey.List] });
    },
  });
}

export function useSubmitAssignment(assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: SubmitAssignmentDto) => {
      const { data } = await axios.post<AssignmentSubmission>(
        `/assignments/${assignmentId}/submissions`,
        dto,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [HomeworkQueryKey.Detail, assignmentId],
      });
      void queryClient.invalidateQueries({ queryKey: [HomeworkQueryKey.List] });
    },
  });
}

export function useSubmissions(assignmentId: string, enabled = true) {
  return useQuery({
    queryKey: [HomeworkQueryKey.Submissions, assignmentId],
    queryFn: async () => {
      const { data } = await axios.get<StudentSubmissionListItem[]>(
        `/assignments/${assignmentId}/submissions`,
      );
      return data;
    },
    enabled: enabled && !!assignmentId,
  });
}

export function useMarkSubmission(assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      dto,
    }: {
      submissionId: string;
      dto: MarkSubmissionDto;
    }) => {
      const { data } = await axios.patch<AssignmentSubmission>(
        `/assignments/submissions/${submissionId}/mark`,
        dto,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [HomeworkQueryKey.Submissions, assignmentId],
      });
    },
  });
}
