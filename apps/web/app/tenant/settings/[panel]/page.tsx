import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import TenantSettings from '@/containers/Tenant/Settings';

export const metadata: Metadata = {
  title: 'Settings | Gurukul',
  description: 'Manage your workspace settings, profile, and permissions.',
};

interface PageProps {
  params: Promise<{ panel: string }>;
}

const VALID_PANELS = ['profile', 'security', 'permissions', 'general'];

export default async function SettingsPanelPage({ params }: PageProps) {
  const { panel } = await params;
  if (!VALID_PANELS.includes(panel)) {
    notFound();
  }
  return <TenantSettings activePanel={panel} />;
}
