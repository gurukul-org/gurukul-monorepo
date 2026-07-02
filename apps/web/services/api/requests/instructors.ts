'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { ClassQueryKey } from './classes';

export interface EligibleInstructor {
  membershipId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssignInstructorDto {
  tenantMembershipId: string;
  isPrimary?: boolean;
}

export enum InstructorQueryKey {
  EligibleList = 'instructors:eligible-list',
}

export function useEligibleInstructors() {
  return useQuery({
    queryKey: [InstructorQueryKey.EligibleList],
    queryFn: async () => {
      const { data } = await axios.get<EligibleInstructor[]>('/instructors');
      return data;
    },
  });
}

export function useAssignInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      dto,
    }: {
      classId: string;
      dto: AssignInstructorDto;
    }) => {
      const { data } = await axios.post(`/classes/${classId}/instructors`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [ClassQueryKey.Detail, variables.classId],
      });
    },
  });
}

export function usePromoteInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, id }: { classId: string; id: string }) => {
      const { data } = await axios.patch(
        `/classes/${classId}/instructors/${id}/primary`,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [ClassQueryKey.Detail, variables.classId],
      });
    },
  });
}

export function useRemoveInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, id }: { classId: string; id: string }) => {
      const { data } = await axios.delete(
        `/classes/${classId}/instructors/${id}`,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [ClassQueryKey.Detail, variables.classId],
      });
    },
  });
}
