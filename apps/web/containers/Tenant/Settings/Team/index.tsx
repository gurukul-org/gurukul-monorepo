'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import {
  useCancelInvitation,
  useInviteUser,
  useResendInvitation,
} from '@/services/api/requests/invitations';
import { useTenantUsers } from '@/services/api/requests/users';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const inviteFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role must be selected'),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function TeamContainer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showError = useShowApiError();

  const {
    data: usersData,
    isLoading,
    isError,
    refetch,
  } = useTenantUsers({ limit: 100 });

  const pendingInvitations = useMemo(() => {
    return usersData?.users.filter((u) => u.status === 'INVITED') ?? [];
  }, [usersData]);

  const { mutateAsync: inviteUser, isPending: isInviting } = useInviteUser();
  const {
    mutateAsync: resendInvite,
    isPending: isResending,
    variables: resendingInviteId,
  } = useResendInvitation();
  const {
    mutateAsync: cancelInvite,
    isPending: isCanceling,
    variables: cancelingInviteId,
  } = useCancelInvitation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      roleIds: ['role-id-1'], // Default placeholder
    },
  });

  const isAnyMutating = isInviting || isResending || isCanceling;

  const onFormSubmit = async (data: InviteFormValues) => {
    try {
      await inviteUser(data);
      setIsModalOpen(false);
      reset();
      toast.success('Invitation sent successfully!');
    } catch (error: any) {
      showError(error);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendInvite(id);
      toast.success('Invitation resent successfully!');
    } catch (error: any) {
      showError(error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvite(id);
      toast.success('Invitation cancelled successfully!');
    } catch (error: any) {
      showError(error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500">
            Manage your tenant members and roles.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={isAnyMutating}>
          Invite Member
        </Button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Pending Invitations
          </h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">
                Loading pending invitations...
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-red-200 dark:border-red-900/60 rounded-lg bg-rose-50/50 dark:bg-rose-950/10 text-red-600 dark:text-red-400">
              <p className="text-sm font-semibold">
                Failed to load invitations
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
          ) : pendingInvitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 text-center">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                No pending invitations
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Invite new members to join your workspace.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.membershipId}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {invitation.firstName} {invitation.lastName}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {invitation.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {invitation.roles.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleResend(invitation.membershipId)
                            }
                            disabled={isAnyMutating}
                            className="text-primary hover:text-primary/80"
                          >
                            {isResending &&
                            resendingInviteId === invitation.membershipId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Resend'
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() =>
                              handleCancel(invitation.membershipId)
                            }
                            disabled={isAnyMutating}
                          >
                            {isCanceling &&
                            cancelingInviteId === invitation.membershipId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Cancel'
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Invite New Member
            </h3>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  {...register('firstName')}
                  disabled={isInviting}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  disabled={isInviting}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  disabled={isInviting}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  disabled={isInviting}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isInviting ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
