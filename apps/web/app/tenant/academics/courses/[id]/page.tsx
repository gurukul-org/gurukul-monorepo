import type { Metadata } from 'next';

import TenantCourseDetailContainer from '@/containers/Tenant/Courses/detail';

export const metadata: Metadata = {
  title: 'Course Details | Gurukul',
  description:
    'View metadata, credits, program descriptions, and scheduled sections.',
};

interface CourseDetailPageProps {
  params: {
    id: string;
  };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  return <TenantCourseDetailContainer courseId={params.id} />;
}
