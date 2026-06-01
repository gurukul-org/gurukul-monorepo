import { Suspense } from 'react';

import type { Metadata } from 'next';

import ApexLogin from '@/containers/Apex/Login';

export const metadata: Metadata = {
  title: 'Sign in | Gurukul',
  description: 'Sign in to your Gurukul workspace.',
};

export default function ApexLoginPage() {
  return (
    <Suspense fallback={null}>
      <ApexLogin />
    </Suspense>
  );
}
