'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useChangeUserPassword,
  useCurrentUserProfile,
  useUpdateUserProfile,
} from '@/services/api/requests/users';

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

export function ProfilePanel() {
  const { data: profile, isLoading } = useCurrentUserProfile();
  const updateProfileMutation = useUpdateUserProfile();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName,
      lastName,
      phone: phone || null,
    });
  };

  if (isLoading) return <ProfileSkeleton />;

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
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="mt-2"
        >
          {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}

export function SecurityPanel() {
  const changePasswordMutation = useChangeUserPassword();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold tracking-tight">Security</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Change your password.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm New Password
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>
        </FieldGroup>

        {passwordError && (
          <p className="text-xs text-destructive font-medium">
            {passwordError}
          </p>
        )}

        <Button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="mt-2"
        >
          {changePasswordMutation.isPending ? 'Updating…' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}

/** @deprecated Use ProfilePanel or SecurityPanel directly. Kept for sidepane backward compat. */
export function ProfileSettings() {
  return <ProfilePanel />;
}
