'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useDummyModal } from '@/hooks/use-modal';
import { useDummySidepane } from '@/hooks/use-sidepane';
import { useSubdomain } from '@/hooks/use-subdomain';
import { useCurrentTenant } from '@/services/api/requests/tenants';
import { useCurrentUserProfile } from '@/services/api/requests/users';
import { Sparkles } from 'lucide-react';

export default function TenantDashboard() {
  const { subdomain } = useSubdomain();
  const { data: tenant } = useCurrentTenant();
  const { data: profile } = useCurrentUserProfile();

  const dummyModal = useDummyModal();
  const dummySidepane = useDummySidepane();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back{profile ? `, ${profile.firstName}` : ''}!
          </h1>
          <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Managing workspace:{' '}
          <span className="font-semibold text-primary">
            {tenant?.name || subdomain || 'gurukul'}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() =>
            dummyModal({ message: 'Hello from the type-safe modal!' })
          }
        >
          Open Modal
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            dummySidepane({ message: 'Hello from the type-safe sidepane!' })
          }
        >
          Open Sidepane
        </Button>
      </div>
    </div>
  );
}
