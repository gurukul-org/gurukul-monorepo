export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  tenantId?: string;
  membershipId?: string;
  scopes: string[];
  isAdmin: boolean;
};

export type JwtPayloadWithRt = JwtPayload & { refreshToken: string };
