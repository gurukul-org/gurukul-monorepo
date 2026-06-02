'use client';

import { useEffect } from 'react';

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
import { useSubdomain } from '@/hooks/use-subdomain';
import { getApexUrl } from '@/lib/env';
import { useIsAuthenticated } from '@/lib/store/auth';
import { useRequestLogin } from '@/services/api/requests/auth';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function TenantLogin() {
  const { subdomain } = useSubdomain();
  const isAuthenticated = useIsAuthenticated();
  const login = useRequestLogin();

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => {
      login.mutate(value);
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace('/dashboard');
    }
  }, [isAuthenticated]);

  const isPending = login.isPending || login.isSuccess;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {subdomain
              ? `Continue to ${subdomain}.`
              : 'Continue to your workspace.'}
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
              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        autoComplete="email"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="password">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        autoComplete="current-password"
                      />
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
                    {isPending || isSubmitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Wrong workspace?{' '}
            <a
              href={getApexUrl('/login')}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Choose another
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
