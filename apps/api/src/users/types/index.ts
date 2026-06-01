export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  tenantId?: string;
  membershipId?: string;
};

export type JwtPayloadWithRt = JwtPayload & { refreshToken: string };
