'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useChangeUserPassword,
  useCurrentUserProfile,
  useUpdateUserProfile,
} from '@/services/api/requests/users';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  );
}

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfilePanel() {
  const { data: profile, isLoading } = useCurrentUserProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } =
    useUpdateUserProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const onFormSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      });
    } catch {
      // API hook handles notifications and error logging
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  const isSubmitting = isUpdating;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold tracking-tight">
          Profile Details
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Update your personal information.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4 max-w-lg"
      >
        <FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-zinc-100 dark:bg-zinc-800 text-muted-foreground cursor-not-allowed"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
            <Input
              id="phone"
              placeholder="+1 (555) 000-0000"
              {...register('phone')}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs text-destructive mt-1">
                {errors.phone.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </div>
  );
}

const securityFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type SecurityFormValues = z.infer<typeof securityFormSchema>;

export function SecurityPanel() {
  const { mutateAsync: changePassword, isPending: isChanging } =
    useChangeUserPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onFormSubmit = async (data: SecurityFormValues) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
    } catch {
      // API hook handles notifications and error logging
    }
  };

  const isSubmitting = isChanging;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold tracking-tight">Security</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Change your password.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4 max-w-lg"
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              {...register('currentPassword')}
              disabled={isSubmitting}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              disabled={isSubmitting}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm New Password
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </span>
          ) : (
            'Update Password'
          )}
        </Button>
      </form>
    </div>
  );
}

/** @deprecated Use ProfilePanel or SecurityPanel directly. Kept for sidepane backward compat. */
export function ProfileSettings() {
  return <ProfilePanel />;
}
