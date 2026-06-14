'use client';

import { useEffect, useRef } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
import { APP_DOMAIN, getTenantUrl } from '@/lib/env';
import {
  WORKSPACE_ERROR_PARAM,
  WORKSPACE_SUBDOMAIN_PARAM,
  describeWorkspaceError,
  isWorkspaceErrorReason,
} from '@/lib/workspace-error';
import { useForm } from '@tanstack/react-form';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const SUBDOMAIN_REGEX = /^(?=[a-z0-9-]{3,63}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

const schema = z.object({
  subdomain: z
    .string()
    .min(1, 'Workspace is required')
    .regex(
      SUBDOMAIN_REGEX,
      'Use 3-63 lowercase letters, digits, or hyphens (no leading or trailing hyphen).',
    ),
});

export default function ApexWorkspaces() {
  useWorkspaceErrorToast();

  const form = useForm({
    defaultValues: { subdomain: '' },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => {
      window.location.assign(
        getTenantUrl(value.subdomain.toLowerCase(), '/dashboard'),
      );
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Go to your workspace</CardTitle>
          <CardDescription>
            Enter your workspace URL to continue.
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
                      <FieldLabel htmlFor={field.name}>Workspace</FieldLabel>
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
                          autoComplete="off"
                          autoCapitalize="none"
                          autoCorrect="off"
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
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? 'Redirecting…' : 'Continue'}
                    <ArrowRight />
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

function useWorkspaceErrorToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didShow = useRef(false);

  useEffect(() => {
    if (didShow.current) return;
    const reason = searchParams.get(WORKSPACE_ERROR_PARAM);
    if (!isWorkspaceErrorReason(reason)) return;
    didShow.current = true;
    const subdomain = searchParams.get(WORKSPACE_SUBDOMAIN_PARAM);
    toast.error(describeWorkspaceError(reason, subdomain));
    const next = new URLSearchParams(searchParams.toString());
    next.delete(WORKSPACE_ERROR_PARAM);
    next.delete(WORKSPACE_SUBDOMAIN_PARAM);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [searchParams, router, pathname]);
}
