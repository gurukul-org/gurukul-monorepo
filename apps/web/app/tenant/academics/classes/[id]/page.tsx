import type { Metadata } from 'next';

import TenantClassDetailContainer from '@/containers/Tenant/Classes/detail';

interface ClassDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Class Details | Gurukul',
  description:
    'View class metadata, schedules, capacity usage, instructors, and enrolled students.',
};

export default async function ClassDetailPage({
  params,
}: ClassDetailPageProps) {
  const { id } = await params;
  return <TenantClassDetailContainer classId={id} />;
}
