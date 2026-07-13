'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  useUpdateTenant,
  useWorkspaceSettings,
} from '@/services/api/requests/tenants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { PERMS } from '@repo/permissions';

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be at most 80 characters'),
});

type NameForm = z.infer<typeof nameSchema>;

function SettingsRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
        >
          <Skeleton className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export default function GeneralContainer() {
  const allowed = useRequirePermission({
    permission: PERMS.tenant.view,
    redirectTo: '/settings/profile',
  });

  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMS.tenant.edit);

  const { data, isLoading, isError, refetch } = useWorkspaceSettings();

  const { mutateAsync, isPending } = useUpdateTenant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (data) {
      reset({ name: data.name });
    }
  }, [data, reset]);

  const onSubmit = async (values: NameForm) => {
    await mutateAsync({ name: values.name });
    toast.success('Workspace name updated');
    reset({ name: values.name });
  };

  if (!allowed) return null;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold tracking-tight">
          General Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage general workspace preferences.
        </p>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-red-200 dark:border-red-900/60 rounded-lg bg-rose-50/50 dark:bg-rose-950/10 text-red-600 dark:text-red-400">
          <p className="text-sm font-semibold">
            Failed to load workspace settings
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {canEdit ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel>Workspace name</FieldLabel>
                  <div className="flex items-start gap-2 mt-1">
                    <div className="flex-1">
                      <Input
                        {...register('name')}
                        disabled={isPending}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <FieldError>{errors.name.message}</FieldError>
                      )}
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isPending || !isDirty || !isValid}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            <SettingsRow label="Workspace name" value={data.name} />
          )}

          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 px-4">
            <SettingsRow label="Subdomain" value={data.subdomain} />
            <SettingsRow
              label="Created"
              value={new Date(data.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
            <SettingsRow
              label="Members"
              value={data.memberCount.toString()}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
