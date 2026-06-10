'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TENANT_TYPES, type TenantType } from '@/lib/api/types';
import { APP_DOMAIN, getTenantUrl } from '@/lib/env';
import { useIsAuthenticated, useIsBootstrapping } from '@/lib/store/auth';
import {
  useMemberships,
  useRequestOnboarding,
} from '@/services/api/requests/auth';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

const SUBDOMAIN_REGEX = /^(?=[a-z0-9-]{3,63}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

const schema = z.object({
  subdomain: z
    .string()
    .min(1, 'Workspace URL is required')
    .regex(
      SUBDOMAIN_REGEX,
      'Use 3-63 lowercase letters, digits, or hyphens (no leading or trailing hyphen).',
    ),
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(255, 'Workspace name is too long'),
  type: z.enum(TENANT_TYPES, { message: 'Pick a workspace type' }),
});

export default function ApexOnboarding() {
  const router = useRouter();
  const isBootstrapping = useIsBootstrapping();
  const isAuthenticated = useIsAuthenticated();
  const didRedirect = useRef(false);

  const membershipsQuery = useMemberships(isAuthenticated && !isBootstrapping);
  const onboarding = useRequestOnboarding();

  // Redirect if not authenticated
  useEffect(() => {
    if (isBootstrapping || didRedirect.current) return;
    if (!isAuthenticated) {
      didRedirect.current = true;
      router.replace('/signup');
    }
  }, [isBootstrapping, isAuthenticated, router]);

  // Redirect if user already has memberships
  useEffect(() => {
    if (didRedirect.current) return;
    if (!membershipsQuery.data) return;
    if (membershipsQuery.data.length > 0) {
      didRedirect.current = true;
      window.location.assign(
        getTenantUrl(membershipsQuery.data[0]!.tenant.subdomain, '/dashboard'),
      );
    }
  }, [membershipsQuery.data]);

  const form = useForm({
    defaultValues: {
      subdomain: '',
      name: '',
      type: 'INSTITUTE' as TenantType,
    },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => {
      onboarding.mutate(value);
    },
  });

  // Show nothing while bootstrapping, redirecting, or loading memberships
  if (isBootstrapping || !isAuthenticated || membershipsQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading…</div>
      </main>
    );
  }

  const isPending = onboarding.isPending || onboarding.isSuccess;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your workspace</CardTitle>
          <CardDescription>
            Create your workspace to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="subdomain">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Workspace URL
                      </FieldLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="acme"
                          autoCapitalize="none"
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <span className="text-xs text-muted-foreground">
                          .{APP_DOMAIN}
                        </span>
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="name">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Workspace name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        placeholder="Acme Institute"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="type">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                      <select
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value as TenantType)
                        }
                        aria-invalid={isInvalid}
                        className="h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                      >
                        <option value="SCHOOL">School</option>
                        <option value="INSTITUTE">Institute</option>
                        <option value="COACHING">Coaching</option>
                      </select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting || isPending}
                  >
                    {isPending || isSubmitting
                      ? 'Creating workspace…'
                      : 'Create workspace'}
                  </Button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
