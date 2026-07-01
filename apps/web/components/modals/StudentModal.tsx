'use client';

import { useEffect, useMemo, useState } from 'react';
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
  StudentListItem,
  useCreateStudent,
  useUpdateStudent,
} from '@/services/api/requests/students';
import { useTenantUsers } from '@/services/api/requests/users';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const studentSchema = z.object({
  rollNumber: z
    .string()
    .trim()
    .min(1, 'Roll number is required.')
    .max(50, 'Roll number must be 50 characters or fewer.')
    .regex(/^[a-zA-Z0-9\-]+$/, {
      message: 'Only letters, digits, and hyphens are allowed.',
    }),
  admissionDate: z.string().optional(),
  tenantMembershipId: z
    .string()
    .uuid('Must be a valid UUID.')
    .optional()
    .or(z.literal('')),
});

type StudentValues = z.infer<typeof studentSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StudentModalProps {
  editingStudent: StudentListItem | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudentModal({ editingStudent }: StudentModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();
  const showInviteModal = useShowInviteMemberModal();
  const isEditing = !!editingStudent;

  const { mutateAsync: createStudent, isPending: isCreating } =
    useCreateStudent();
  const { mutateAsync: updateStudent, isPending: isUpdating } =
    useUpdateStudent();

  const isSaving = isCreating || isUpdating;

  // Fetch tenant members to let the user link an existing user profile with Student role
  const { data: usersData, isLoading: isLoadingUsers } = useTenantUsers({
    limit: 100,
  });

  const studentMembers = useMemo(() => {
    if (!usersData?.users) return [];
    // Allow active or invited users who possess the "Student" role.
    return usersData.users.filter((u) =>
      u.roles.some((r) => r.name.toLowerCase() === 'student'),
    );
  }, [usersData]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: isEditing
      ? {
          rollNumber: editingStudent.rollNumber,
          admissionDate: editingStudent.admissionDate
            ? new Date(editingStudent.admissionDate).toISOString().split('T')[0]
            : '',
          tenantMembershipId: '',
        }
      : {
          rollNumber: '',
          admissionDate: new Date().toISOString().split('T')[0],
          tenantMembershipId: '',
        },
  });

  // Watch the rollNumber field to detect modifications when editing
  const watchedRollNumber = watch('rollNumber');
  const rollNumberChanged =
    isEditing && watchedRollNumber !== editingStudent.rollNumber;
  const [confirmedRollChange, setConfirmedRollChange] = useState(false);

  // If the rollNumber changes back, reset the confirmation checkbox
  useEffect(() => {
    if (!rollNumberChanged) {
      setConfirmedRollChange(false);
    }
  }, [rollNumberChanged]);

  const onSubmit = async (values: StudentValues) => {
    try {
      if (isEditing) {
        if (rollNumberChanged && !confirmedRollChange) {
          toast.error('Please confirm the roll number change.');
          return;
        }

        await updateStudent({
          id: editingStudent.id,
          dto: {
            rollNumber: values.rollNumber,
            admissionDate: values.admissionDate || undefined,
            tenantMembershipId: values.tenantMembershipId || undefined,
          },
        });
        toast.success('Student updated successfully!');
      } else {
        await createStudent({
          rollNumber: values.rollNumber,
          admissionDate: values.admissionDate || undefined,
          tenantMembershipId: values.tenantMembershipId || undefined,
        });
        toast.success('Student profile created successfully!');
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
      title={isEditing ? 'Edit Student Profile' : 'Create Student Profile'}
      description={
        isEditing
          ? 'Update student details. Roll number changes require explicit confirmation.'
          : 'Create a new student record. Roll number must be unique within the tenant.'
      }
      size="md"
      primaryAction={{
        label: isSaving
          ? 'Saving...'
          : isEditing
            ? 'Save Changes'
            : 'Create Student',
        onClick: handleSubmit(onSubmit),
        loading: isSaving,
        disabled: isSaving || (rollNumberChanged && !confirmedRollChange),
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isSaving,
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          {/* Roll Number */}
          <Field data-invalid={!!errors.rollNumber}>
            <FieldLabel
              htmlFor="rollNumber"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Roll Number <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="rollNumber"
              {...register('rollNumber')}
              disabled={isSaving}
              placeholder="e.g. STU-2026-001"
              className="h-10 text-sm focus-visible:ring-primary/30"
            />
            {errors.rollNumber && (
              <FieldError>{errors.rollNumber.message}</FieldError>
            )}
          </Field>

          {/* Roll Number Change Warning Checkbox (edit mode only) */}
          {rollNumberChanged && (
            <div className="flex items-start gap-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5">
              <input
                id="confirmRollChange"
                type="checkbox"
                checked={confirmedRollChange}
                onChange={(e) => setConfirmedRollChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label
                htmlFor="confirmRollChange"
                className="text-xs text-amber-800 dark:text-amber-300 font-medium select-none"
              >
                I confirm that changing this roll number impacts external
                references like ID cards.
              </label>
            </div>
          )}

          {/* Admission Date */}
          <Field data-invalid={!!errors.admissionDate}>
            <FieldLabel
              htmlFor="admissionDate"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Admission Date
            </FieldLabel>
            <Input
              id="admissionDate"
              type="date"
              {...register('admissionDate')}
              disabled={isSaving}
              className="h-10 text-sm focus-visible:ring-primary/30"
            />
            {errors.admissionDate && (
              <FieldError>{errors.admissionDate.message}</FieldError>
            )}
          </Field>

          {/* Portal Account Select Dropdown with Inline Link */}
          <Field data-invalid={!!errors.tenantMembershipId}>
            <div className="flex items-center justify-between">
              <FieldLabel
                htmlFor="tenantMembershipId"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Portal Student Account
              </FieldLabel>
              <button
                type="button"
                onClick={() => showInviteModal('Student')}
                disabled={isSaving}
                className="text-[10px] font-semibold text-primary hover:underline"
              >
                Invite student inline
              </button>
            </div>

            <select
              id="tenantMembershipId"
              {...register('tenantMembershipId')}
              disabled={isSaving || isLoadingUsers}
              className="mt-1 block w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            >
              <option value="">
                -- Select an existing member with Student role (optional) --
              </option>
              {studentMembers.map((u) => (
                <option key={u.membershipId} value={u.membershipId}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground/70 mt-1.5">
              Links this profile to their portal login account.
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
