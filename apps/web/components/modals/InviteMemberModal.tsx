'use client';

import { useForm } from 'react-hook-form';

import { Modal } from '@/components/modals/Modal';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import { useInviteUser } from '@/services/api/requests/invitations';
import { useRoles } from '@/services/api/requests/roles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const inviteFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email('Invalid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role must be selected'),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

// Rendered by ModalDialog when ModalType.InviteMemberModal is active.
// No isOpen/onClose props — the modal manages its own close via useHideModal.
export function InviteMemberModal() {
  const hideModal = useHideModal();
  const showError = useShowApiError();
  const { mutateAsync: inviteUser, isPending: isInviting } = useInviteUser();
  const { data: roles, isLoading: isLoadingRoles } = useRoles();

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
      roleIds: [],
    },
  });

  const onFormSubmit = async (data: InviteFormValues) => {
    try {
      await inviteUser(data);
      toast.success('Invitation sent successfully!');
      reset();
      hideModal();
    } catch (error: unknown) {
      showError(error);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Invite New Member"
      description="Send an invitation link to a new member to join this tenant workspace."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <FieldGroup className="gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel
                htmlFor="firstName"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                First Name
              </FieldLabel>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={isInviting}
                placeholder="John"
                className="h-10 text-sm focus-visible:ring-primary/30"
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <FieldError>{errors.firstName.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel
                htmlFor="lastName"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Last Name
              </FieldLabel>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={isInviting}
                placeholder="Doe"
                className="h-10 text-sm focus-visible:ring-primary/30"
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <FieldError>{errors.lastName.message}</FieldError>
              )}
            </Field>
          </div>

          <Field data-invalid={!!errors.email}>
            <FieldLabel
              htmlFor="email"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Email Address
            </FieldLabel>
            <Input
              id="email"
              type="email"
              {...register('email')}
              disabled={isInviting}
              placeholder="john.doe@example.com"
              className="h-10 text-sm focus-visible:ring-primary/30"
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.roleIds}>
            <FieldLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Roles
            </FieldLabel>
            {isLoadingRoles ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading roles...</span>
              </div>
            ) : !roles || roles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No roles found.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 border rounded-lg p-3 max-h-36 overflow-y-auto bg-background border-zinc-200 dark:border-zinc-800">
                {roles.map((role) => (
                  <Field
                    key={role.id}
                    orientation="horizontal"
                    className="items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      value={role.id}
                      disabled={isInviting}
                      {...register('roleIds')}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      id={`role-${role.id}`}
                    />
                    <FieldLabel
                      htmlFor={`role-${role.id}`}
                      className="font-normal text-zinc-900 dark:text-zinc-50 cursor-pointer select-none"
                    >
                      {role.name}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            )}
            {errors.roleIds && (
              <FieldError>{errors.roleIds.message}</FieldError>
            )}
          </Field>
        </FieldGroup>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={hideModal}
            disabled={isInviting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isInviting}
            className="flex items-center gap-2"
          >
            {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isInviting ? 'Sending...' : 'Send Invitation'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
