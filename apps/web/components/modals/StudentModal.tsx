'use client';

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
import { useHideModal } from '@/hooks/use-modal';
import {
  StudentListItem,
  useCreateStudent,
  useUpdateStudent,
} from '@/services/api/requests/students';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createSchema = z.object({
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

const editSchema = z.object({
  admissionDate: z.string().optional(),
  tenantMembershipId: z
    .string()
    .uuid('Must be a valid UUID.')
    .optional()
    .or(z.literal('')),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

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
  const isEditing = !!editingStudent;

  const { mutateAsync: createStudent, isPending: isCreating } =
    useCreateStudent();
  const { mutateAsync: updateStudent, isPending: isUpdating } =
    useUpdateStudent();

  const isSaving = isCreating || isUpdating;

  // Use different schemas for create vs edit
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: isEditing
      ? {
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

  const onSubmit = async (raw: CreateValues | EditValues) => {
    try {
      if (isEditing) {
        const vals = raw as EditValues;
        await updateStudent({
          id: editingStudent.id,
          dto: {
            admissionDate: vals.admissionDate || undefined,
            tenantMembershipId: vals.tenantMembershipId || undefined,
          },
        });
        toast.success('Student updated successfully!');
      } else {
        const vals = raw as CreateValues;
        await createStudent({
          rollNumber: vals.rollNumber,
          admissionDate: vals.admissionDate || undefined,
          tenantMembershipId: vals.tenantMembershipId || undefined,
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
          ? 'Update the admission date or portal account link. Roll number cannot be changed.'
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
          {/* Roll Number — create only */}
          {!isEditing && (
            <Field data-invalid={!!(errors as Record<string, unknown>).rollNumber}>
              <FieldLabel
                htmlFor="rollNumber"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Roll Number <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="rollNumber"
                {...register('rollNumber' as keyof CreateValues)}
                disabled={isSaving}
                placeholder="e.g. STU-2026-001"
                className="h-10 text-sm focus-visible:ring-primary/30"
              />
              {(errors as Record<string, { message?: string }>).rollNumber && (
                <FieldError>
                  {(errors as Record<string, { message?: string }>).rollNumber?.message}
                </FieldError>
              )}
            </Field>
          )}

          {/* Read-only roll number display for edit mode */}
          {isEditing && (
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Roll Number
              </span>
              <span className="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
                {editingStudent.rollNumber}
              </span>
            </div>
          )}

          {/* Admission Date */}
          <Field data-invalid={!!(errors as Record<string, unknown>).admissionDate}>
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
            {(errors as Record<string, { message?: string }>).admissionDate && (
              <FieldError>
                {(errors as Record<string, { message?: string }>).admissionDate?.message}
              </FieldError>
            )}
          </Field>

          {/* Portal Account Link */}
          <Field
            data-invalid={
              !!(errors as Record<string, unknown>).tenantMembershipId
            }
          >
            <FieldLabel
              htmlFor="tenantMembershipId"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Portal Membership ID{' '}
              <span className="text-muted-foreground/60 font-normal normal-case">
                (optional)
              </span>
            </FieldLabel>
            <Input
              id="tenantMembershipId"
              {...register('tenantMembershipId')}
              disabled={isSaving}
              placeholder="UUID of an active tenant membership"
              className="h-10 text-sm font-mono focus-visible:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Link to an existing member with the Student role to grant portal
              access. Leave blank to create an unlinked profile.
            </p>
            {(errors as Record<string, { message?: string }>)
              .tenantMembershipId && (
              <FieldError>
                {
                  (errors as Record<string, { message?: string }>)
                    .tenantMembershipId?.message
                }
              </FieldError>
            )}
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
}
