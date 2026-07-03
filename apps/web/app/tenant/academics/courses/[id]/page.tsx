import type { Metadata } from 'next';

import TenantCourseDetailContainer from '@/containers/Tenant/Courses/detail';

export const metadata: Metadata = {
  title: 'Course Details | Gurukul',
  description:
    'View metadata, credits, program descriptions, and scheduled sections.',
};

interface CourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;
  return <TenantCourseDetailContainer courseId={id} />;
}
