import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function TenantNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace not found
        </h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a workspace at this address. Check the URL or
          sign in from a different workspace.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/login">Go to sign in</Link>
      </Button>
    </main>
  );
}
