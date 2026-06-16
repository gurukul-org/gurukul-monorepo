import type { Metadata } from 'next';

import TenantUsersContainer from '@/containers/Tenant/Users';

export const metadata: Metadata = {
  title: 'User Management | Gurukul',
  description: 'Manage users in your Gurukul workspace.',
};

export default TenantUsersContainer;
