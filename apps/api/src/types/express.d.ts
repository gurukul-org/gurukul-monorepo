import { Tenant } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }

    interface User {
      sub: string;
      email: string;
      tenantId?: string;
      membershipId?: string;
      scopes: string[];
      isAdmin: boolean;
      refreshToken?: string;
    }
  }
}

export {};
