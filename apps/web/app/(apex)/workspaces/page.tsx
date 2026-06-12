import { Suspense } from 'react';

import type { Metadata } from 'next';

import ApexWorkspaces from '@/containers/Apex/Workspaces';

export const metadata: Metadata = {
  title: 'Go to workspace | Gurukul',
  description: 'Pick a workspace to continue.',
};

export default function ApexWorkspacesPage() {
  return (
    <Suspense fallback={null}>
      <ApexWorkspaces />
    </Suspense>
  );
}
