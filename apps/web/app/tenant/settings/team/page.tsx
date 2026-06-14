"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import {
  useInviteUser,
  useResendInvitation,
  useCancelInvitation,
} from "../../../../../services/api/requests/invitations";

// Mock data since we don't have endpoints to fetch members yet
const mockMembers = [
  { id: "1", name: "Admin User", email: "admin@example.com", roles: ["Admin"], status: "ACTIVE" },
];

const mockPending = [
  { id: "2", name: "Jane Doe", email: "jane@example.com", roles: ["Teacher"], status: "INVITED" },
];

export default function TeamManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { mutate: inviteUser, isPending: isInviting } = useInviteUser();
  const { mutate: resendInvite, isPending: isResending } = useResendInvitation();
  const { mutate: cancelInvite, isPending: isCanceling } = useCancelInvitation();

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      roleIds: ["role-id-1"], // Default placeholder
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      inviteUser(value, {
        onSuccess: () => {
          setIsModalOpen(false);
          form.reset();
          alert("Invitation sent successfully!");
        },
        onError: (error: any) => {
          alert(error.response?.data?.message || "Failed to send invitation.");
        },
      });
    },
  });

  const handleResend = (id: string) => {
    setResendingId(id);
    resendInvite(id, {
      onSuccess: () => {
        alert("Invitation resent!");
        setResendingId(null);
      },
      onError: () => {
        alert("Failed to resend invitation.");
        setResendingId(null);
      },
    });
  };

  const handleCancel = (id: string) => {
    setCancelingId(id);
    cancelInvite(id, {
      onSuccess: () => {
        alert("Invitation cancelled!");
        setCancelingId(null);
      },
      onError: () => {
        alert("Failed to cancel invitation.");
        setCancelingId(null);
      },
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500">Manage your tenant members and roles.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Invite Member
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Active Members</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockMembers.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{m.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{m.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {m.roles.map((r) => (
                        <span key={r} className="mr-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{r}</span>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Pending Invitations</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Roles</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockPending.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{p.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{p.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {p.roles.map((r) => (
                        <span key={r} className="mr-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">{r}</span>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleResend(p.id)}
                        disabled={isResending}
                        className="mr-4 text-blue-600 hover:text-blue-900"
                      >
                        {resendingId === p.id ? "Resending..." : "Resend"}
                      </button>
                      <button
                        onClick={() => handleCancel(p.id)}
                        disabled={isCanceling}
                        className="text-red-600 hover:text-red-900"
                      >
                        {cancelingId === p.id ? "Canceling..." : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Invite New Member</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field
                name="firstName"
                validators={{
                  onChange: z.string().min(1, "First name is required"),
                }}
                children={(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {field.state.meta.errors ? (
                      <p className="mt-1 text-xs text-red-600">{field.state.meta.errors}</p>
                    ) : null}
                  </div>
                )}
              />

              <form.Field
                name="lastName"
                validators={{
                  onChange: z.string().min(1, "Last name is required"),
                }}
                children={(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {field.state.meta.errors ? (
                      <p className="mt-1 text-xs text-red-600">{field.state.meta.errors}</p>
                    ) : null}
                  </div>
                )}
              />

              <form.Field
                name="email"
                validators={{
                  onChange: z.string().email("Invalid email address"),
                }}
                children={(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {field.state.meta.errors ? (
                      <p className="mt-1 text-xs text-red-600">{field.state.meta.errors}</p>
                    ) : null}
                  </div>
                )}
              />

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    form.reset();
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isInviting}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isInviting ? "Sending..." : "Send Invitation"}
                    </button>
                  )}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
