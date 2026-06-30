import type { Metadata } from 'next';

import TenantProgramDetailContainer from '@/containers/Tenant/Programs/detail';

interface ProgramDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Program Details | Gurukul',
  description:
    'View course structure and enrollment details for this academic program.',
};

export default async function ProgramDetailPage({
  params,
}: ProgramDetailPageProps) {
  const { id } = await params;
  return <TenantProgramDetailContainer programId={id} />;
}
