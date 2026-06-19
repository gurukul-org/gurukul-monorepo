'use client';

import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useShowInviteMemberModal } from '@/hooks/use-modal';
import {
  useCancelInvitation,
  useResendInvitation,
} from '@/services/api/requests/invitations';
import { useTenantUsers } from '@/services/api/requests/users';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamContainer() {
  const showError = useShowApiError();
  const showInviteModal = useShowInviteMemberModal();

  const {
    data: usersData,
    isLoading,
    isError,
    refetch,
  } = useTenantUsers({ limit: 25, status: 'INVITED' });

  const pendingInvitations = useMemo(() => {
    return usersData?.users ?? [];
  }, [usersData]);

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

  const isAnyMutating = isResending || isCanceling;

  const handleResend = async (id: string) => {
    try {
      await resendInvite(id);
      toast.success('Invitation resent successfully!');
    } catch (error: unknown) {
      showError(error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvite(id);
      toast.success('Invitation cancelled successfully!');
    } catch (error: unknown) {
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
        <Button onClick={showInviteModal} disabled={isAnyMutating}>
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
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Invited At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Last Resent At
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-zinc-900 dark:text-zinc-50">
                          {invitation.invitedBy
                            ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim() ||
                              invitation.invitedBy.email
                            : '-'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {invitation.createdAt
                            ? new Date(invitation.createdAt).toLocaleString(
                                undefined,
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                },
                              )
                            : '-'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {invitation.createdAt &&
                          invitation.updatedAt &&
                          new Date(invitation.updatedAt).getTime() >
                            new Date(invitation.createdAt).getTime()
                            ? new Date(invitation.updatedAt).toLocaleString(
                                undefined,
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                },
                              )
                            : 'Never'}
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
    </div>
  );
}
