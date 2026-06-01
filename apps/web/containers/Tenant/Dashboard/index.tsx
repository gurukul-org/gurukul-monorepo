'use client';

import { Button } from '@/components/ui/button';
import { useSubdomain } from '@/hooks/use-subdomain';
import { useAuthUser } from '@/lib/store/auth';
import { useRequestLogout } from '@/services/api/requests/auth';
import { LogOut } from 'lucide-react';

export default function TenantDashboard() {
  const user = useAuthUser();
  const { subdomain } = useSubdomain();
  const logout = useRequestLogout();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {subdomain ?? '—'}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </header>

      <section className="rounded-lg border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Signed in as
        </p>
        <p className="mt-1 text-sm">{user?.email ?? '—'}</p>
        {user?.tenantId && (
          <p className="mt-3 text-xs text-muted-foreground">
            Tenant ID: <code className="font-mono">{user.tenantId}</code>
          </p>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        This is a placeholder dashboard. Real product surfaces land in future
        tickets.
      </p>
    </main>
  );
}
