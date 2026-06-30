import type { Metadata } from 'next';

import TenantStudentsContainer from '@/containers/Tenant/Students';

export const metadata: Metadata = {
  title: 'Students | Gurukul',
  description: 'Manage student profiles, enrolments, and linked guardians.',
};

export default TenantStudentsContainer;
