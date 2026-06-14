import { Suspense } from 'react';

import type { Metadata } from 'next';

import ForgotPassword from '@/containers/Apex/ForgotPassword';

export const metadata: Metadata = {
  title: 'Forgot Password | Gurukul',
  description: 'Request a password reset link.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>
  );
}
