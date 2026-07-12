'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import { PermissionGate } from '@/components/permission-gate';
import { ThemePreview } from '@/components/theme/theme-preview';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/hooks/use-permission';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme/theme-config';
import {
  useThemeSettings,
  useUpdateTheme,
} from '@/services/api/requests/tenants';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

function sameTheme(a: ThemeConfig, b: ThemeConfig): boolean {
  return (
    a.preset === b.preset &&
    a.radius === b.radius &&
    a.font === b.font &&
    a.size === b.size
  );
}

export default function AppearanceContainer() {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMS.appearance.edit);

  const { data, isLoading, isError, refetch } = useThemeSettings();
  const { mutateAsync, isPending } = useUpdateTheme();

  const [draft, setDraft] = useState<ThemeConfig>(DEFAULT_THEME);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const isDirty = data ? !sameTheme(draft, data) : false;

  const onSave = async () => {
    await mutateAsync(draft);
    toast.success('Theme updated');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold tracking-tight">Appearance</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose your workspace theme. Changes apply across the entire app for
          everyone in your organization.
        </p>
      </div>

      <PermissionGate
        permission={PERMS.appearance.view}
        fallback={
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Access denied
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You do not have permission to view appearance settings.
            </p>
          </div>
        }
      >
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-red-200 dark:border-red-900/60 rounded-lg bg-rose-50/50 dark:bg-rose-950/10 text-red-600 dark:text-red-400">
            <p className="text-sm font-semibold">Failed to load theme</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls on top (fixed), live preview below. */}
            <div className="rounded-lg border border-border p-4">
              <ThemeSelector
                value={draft}
                onChange={setDraft}
                disabled={!canEdit || isPending}
              />
            </div>
            <ThemePreview value={draft} />

            {canEdit && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isPending || !isDirty}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </PermissionGate>
    </div>
  );
}
