'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Modal } from '@/components/modals/Modal';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal, useShowInviteMemberModal } from '@/hooks/use-modal';
import {
  ParentListItem,
  useCreateParent,
  useUpdateParent,
} from '@/services/api/requests/parents';
import { useTenantUsers } from '@/services/api/requests/users';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

const parentSchema = z.object({
  emergencyPhone: z
    .string()
    .trim()
    .min(3, 'Emergency phone must be at least 3 characters.')
    .max(20, 'Emergency phone must be 20 characters or fewer.')
    .regex(/^\+?[0-9\s\-]+$/, {
      message:
        'Phone can only contain digits, spaces, hyphens, and start with +.',
    }),
  tenantMembershipId: z
    .string()
    .uuid('Must be a valid UUID.')
    .optional()
    .or(z.literal('')),
});

type ParentValues = z.infer<typeof parentSchema>;

interface ParentModalProps {
  editingParent: ParentListItem | null;
}

export function ParentModal({ editingParent }: ParentModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();
  const showInviteModal = useShowInviteMemberModal();
  const isEditing = !!editingParent;

  const { mutateAsync: createParent, isPending: isCreating } =
    useCreateParent();
  const { mutateAsync: updateParent, isPending: isUpdating } =
    useUpdateParent();

  const isSaving = isCreating || isUpdating;

  const { data: usersData, isLoading: isLoadingUsers } = useTenantUsers({
    limit: 100,
  });

  const parentMembers = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users.filter((u) =>
      u.roles.some((r) => r.name.toLowerCase() === 'parent'),
    );
  }, [usersData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: isEditing
      ? {
          emergencyPhone: editingParent.emergencyPhone,
          tenantMembershipId: '',
        }
      : {
          emergencyPhone: '',
          tenantMembershipId: '',
        },
  });

  const onSubmit = async (values: ParentValues) => {
    try {
      if (isEditing) {
        await updateParent({
          id: editingParent.id,
          dto: {
            emergencyPhone: values.emergencyPhone,
            tenantMembershipId: values.tenantMembershipId || null,
          },
        });
        toast.success('Parent profile updated successfully!');
      } else {
        await createParent({
          emergencyPhone: values.emergencyPhone,
          tenantMembershipId: values.tenantMembershipId || undefined,
        });
        toast.success('Parent profile created successfully!');
      }
      hideModal();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title={isEditing ? 'Edit Parent Profile' : 'Create Parent Profile'}
      description={
        isEditing
          ? 'Update emergency contact phone and link portal account settings.'
          : 'Register a new parent or guardian profile.'
      }
      size="md"
      primaryAction={{
        label: isSaving
          ? 'Saving...'
          : isEditing
            ? 'Save Changes'
            : 'Create Parent',
        onClick: handleSubmit(onSubmit),
        loading: isSaving,
        disabled: isSaving,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isSaving,
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          {/* Emergency Phone */}
          <Field data-invalid={!!errors.emergencyPhone}>
            <FieldLabel
              htmlFor="emergencyPhone"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Emergency Phone <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="emergencyPhone"
              {...register('emergencyPhone')}
              disabled={isSaving}
              placeholder="e.g. +91 99999 99999"
              className="h-10 text-sm focus-visible:ring-primary/30"
            />
            {errors.emergencyPhone && (
              <FieldError>{errors.emergencyPhone.message}</FieldError>
            )}
          </Field>

          {/* Portal User Link Dropdown with Invite Member inline shortcut */}
          <Field data-invalid={!!errors.tenantMembershipId}>
            <div className="flex items-center justify-between">
              <FieldLabel
                htmlFor="tenantMembershipId"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Portal Parent Account
              </FieldLabel>
              <button
                type="button"
                onClick={showInviteModal}
                disabled={isSaving}
                className="text-[10px] font-semibold text-primary hover:underline"
              >
                Invite parent inline
              </button>
            </div>

            <select
              id="tenantMembershipId"
              {...register('tenantMembershipId')}
              disabled={isSaving || isLoadingUsers}
              className="mt-1 block w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            >
              <option value="">
                -- Select an existing member with Parent role (optional) --
              </option>
              {parentMembers.map((u) => (
                <option key={u.membershipId} value={u.membershipId}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground/70 mt-1.5">
              Connects this parent profile to their active portal member login
              account.
            </p>
            {errors.tenantMembershipId && (
              <FieldError>{errors.tenantMembershipId.message}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
}
