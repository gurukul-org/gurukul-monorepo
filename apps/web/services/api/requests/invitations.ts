import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

// DTO Types
export interface InviteUserDto {
  email: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface AcceptInvitationDto {
  token: string;
  password?: string;
}

export interface ValidateInvitationResponseDto {
  tenantName: string;
  email: string;
  roles: string[];
  requiresPasswordSetup: boolean;
}

export const useInviteUser = () => {
  return useMutation({
    mutationFn: async (data: InviteUserDto) => {
      const response = await axios.post('/tenants/invitations', data);
      return response.data;
    },
  });
};

export const useValidateInvitation = (token: string) => {
  return useQuery({
    queryKey: ['validate-invitation', token],
    queryFn: async () => {
      const response = await axios.get<ValidateInvitationResponseDto>(
        `/tenants/invitations/validate?token=${token}`
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: async (data: AcceptInvitationDto) => {
      const response = await axios.post('/tenants/invitations/accept', data);
      return response.data;
    },
  });
};

export const useResendInvitation = () => {
  return useMutation({
    mutationFn: async (membershipId: string) => {
      const response = await axios.post(`/tenants/invitations/${membershipId}/resend`);
      return response.data;
    },
  });
};

export const useCancelInvitation = () => {
  return useMutation({
    mutationFn: async (membershipId: string) => {
      const response = await axios.delete(`/tenants/invitations/${membershipId}`);
      return response.data;
    },
  });
};
