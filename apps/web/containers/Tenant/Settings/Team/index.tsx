'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  useCancelInvitation,
  useInviteUser,
  useResendInvitation,
} from '@/services/api/requests/invitations';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Mock data since we don't have endpoints to fetch members yet
const mockMembers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    roles: ['Admin'],
    status: 'ACTIVE',
  },
];

const mockPending = [
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    roles: ['Teacher'],
    status: 'INVITED',
  },
];

const inviteFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role must be selected'),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function TeamContainer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      alert('Invitation sent successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send invitation.');
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendInvite(id);
      alert('Invitation resent!');
    } catch {
      alert('Failed to resend invitation.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvite(id);
      alert('Invitation cancelled!');
    } catch {
      alert('Failed to cancel invitation.');
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
            Active Members
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockMembers.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {m.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {m.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {m.roles.map((r) => (
                        <span
                          key={r}
                          className="mr-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                        >
                          {r}
                        </span>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Pending Invitations
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockPending.map((p) => {
                  const isThisResending =
                    isResending && resendingInviteId === p.id;
                  const isThisCanceling =
                    isCanceling && cancelingInviteId === p.id;

                  return (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {p.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {p.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {p.roles.map((r) => (
                          <span
                            key={r}
                            className="mr-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                          >
                            {r}
                          </span>
                        ))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleResend(p.id)}
                          disabled={isAnyMutating}
                          className="mr-4 text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isThisResending ? 'Resending...' : 'Resend'}
                        </button>
                        <button
                          onClick={() => handleCancel(p.id)}
                          disabled={isAnyMutating}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isThisCanceling ? 'Canceling...' : 'Cancel'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
