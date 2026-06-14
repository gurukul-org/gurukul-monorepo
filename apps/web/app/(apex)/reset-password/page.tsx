import { Suspense } from 'react';

import type { Metadata } from 'next';

import ResetPassword from '@/containers/Apex/ResetPassword';

export const metadata: Metadata = {
  title: 'Reset Password | Gurukul',
  description: 'Reset your password securely.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}
