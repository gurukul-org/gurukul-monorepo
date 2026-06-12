export const TENANT_TYPES = ['SCHOOL', 'INSTITUTE', 'COACHING'] as const;
export type TenantType = (typeof TENANT_TYPES)[number];

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface CreateTenantDto {
  subdomain: string;
  name: string;
  type: TenantType;
}

export interface CreateTenantResponse {
  accessToken: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface OnboardingDto {
  subdomain: string;
  name: string;
  type: TenantType;
}

export interface OnboardingResponse {
  accessToken: string;
}

export interface MembershipDto {
  id: string;
  tenantId: string;
  tenant: {
    subdomain: string;
    name: string;
    type: TenantType;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  membershipId?: string;
  iat?: number;
  exp?: number;
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
