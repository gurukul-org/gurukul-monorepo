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
import { useUpdateParentLink } from '@/services/api/requests/students';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

const editSchema = z
  .object({
    relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']),
    relationshipDescription: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.relationship === 'OTHER') {
        return !!data.relationshipDescription?.trim();
      }
      return true;
    },
    {
      message: 'Description is required when relationship is OTHER.',
      path: ['relationshipDescription'],
    },
  );

type EditValues = z.infer<typeof editSchema>;

interface EditParentLinkModalProps {
  studentId: string;
  parentId: string;
  currentRelationship: string;
  currentDescription?: string | null;
}

export function EditParentLinkModal({
  studentId,
  parentId,
  currentRelationship,
  currentDescription,
}: EditParentLinkModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: updateParentLink, isPending: isUpdating } =
    useUpdateParentLink();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      relationship: (currentRelationship as any) || 'GUARDIAN',
      relationshipDescription: currentDescription || '',
    },
  });

  const relationshipValue = watch('relationship');

  const onSubmit = async (values: EditValues) => {
    try {
      await updateParentLink({
        studentId,
        parentId,
        dto: {
          relationship: values.relationship,
          relationshipDescription: values.relationshipDescription || undefined,
        },
      });
      toast.success('Relationship updated successfully!');
      hideModal();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Edit Relationship Type"
      description="Update the relationship type and description for this parent link."
      size="md"
      primaryAction={{
        label: isUpdating ? 'Saving...' : 'Save Changes',
        onClick: handleSubmit(onSubmit),
        loading: isUpdating,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isUpdating,
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          {/* Relationship Type */}
          <Field data-invalid={!!errors.relationship}>
            <FieldLabel
              htmlFor="relationship"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Relationship Type <span className="text-red-500">*</span>
            </FieldLabel>
            <select
              id="relationship"
              {...register('relationship')}
              disabled={isUpdating}
              className="w-full h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            >
              <option value="FATHER">Father</option>
              <option value="MOTHER">Mother</option>
              <option value="GUARDIAN">Guardian</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.relationship && (
              <FieldError>{errors.relationship.message}</FieldError>
            )}
          </Field>

          {/* Relationship Description for OTHER */}
          {relationshipValue === 'OTHER' && (
            <Field data-invalid={!!errors.relationshipDescription}>
              <FieldLabel
                htmlFor="relationshipDescription"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Specify Relationship <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="relationshipDescription"
                {...register('relationshipDescription')}
                disabled={isUpdating}
                placeholder="e.g. Uncle, Aunt, Grandparent"
                className="h-10 text-sm focus-visible:ring-primary/30"
              />
              {errors.relationshipDescription && (
                <FieldError>
                  {errors.relationshipDescription.message}
                </FieldError>
              )}
            </Field>
          )}
        </FieldGroup>
      </form>
    </Modal>
  );
}
