'use client';

import { useEffect, useMemo } from 'react';
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
import { useParents } from '@/services/api/requests/parents';
import { useLinkParent, useStudent } from '@/services/api/requests/students';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

const linkSchema = z
  .object({
    parentProfileId: z.string().uuid('Please select a parent.'),
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

type LinkValues = z.infer<typeof linkSchema>;

interface LinkParentModalProps {
  studentId: string;
}

export function LinkParentModal({ studentId }: LinkParentModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { data: student, isLoading: isLoadingStudent } = useStudent(studentId);
  const { data: parentsData, isLoading: isLoadingParents } = useParents({
    limit: 100,
  } as any);
  const { mutateAsync: linkParent, isPending: isLinking } = useLinkParent();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LinkValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      parentProfileId: '',
      relationship: 'GUARDIAN',
      relationshipDescription: '',
    },
  });

  const relationshipValue = watch('relationship');

  const onSubmit = async (values: LinkValues) => {
    try {
      await linkParent({
        studentId,
        dto: {
          parentProfileId: values.parentProfileId,
          relationship: values.relationship,
          relationshipDescription: values.relationshipDescription || undefined,
        },
      });
      toast.success('Parent linked successfully!');
      hideModal();
    } catch (err) {
      showError(err);
    }
  };

  // Filter out parents already linked to this student
  const unlinkedParents = useMemo(() => {
    const parents = parentsData?.parents || [];
    if (!student?.parents) return parents;
    const linkedIds = new Set(student.parents.map((p) => p.parentProfileId));
    return parents.filter((p) => !linkedIds.has(p.id));
  }, [parentsData, student]);

  const isSaving = isLinking || isLoadingStudent || isLoadingParents;

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Link Parent / Guardian"
      description="Select an existing parent profile to link to this student."
      size="md"
      primaryAction={{
        label: isLinking ? 'Linking...' : 'Link Parent',
        onClick: handleSubmit(onSubmit),
        loading: isLinking,
        disabled: isSaving || unlinkedParents.length === 0,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isLinking,
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          {/* Select Parent */}
          <Field data-invalid={!!errors.parentProfileId}>
            <FieldLabel
              htmlFor="parentProfileId"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Select Parent <span className="text-red-500">*</span>
            </FieldLabel>
            {isLoadingParents ? (
              <div className="h-10 animate-pulse bg-zinc-150 rounded-lg dark:bg-zinc-800" />
            ) : unlinkedParents.length === 0 ? (
              <div className="text-xs p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 italic">
                All existing parent records are already linked to this student.
              </div>
            ) : (
              <select
                id="parentProfileId"
                {...register('parentProfileId')}
                disabled={isSaving}
                className="w-full h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              >
                <option value="">-- Choose a Parent --</option>
                {unlinkedParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || 'Unnamed Parent'} ({p.emergencyPhone})
                  </option>
                ))}
              </select>
            )}
            {errors.parentProfileId && (
              <FieldError>{errors.parentProfileId.message}</FieldError>
            )}
          </Field>

          {/* Relationship Type */}
          {unlinkedParents.length > 0 && (
            <>
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
                  disabled={isSaving}
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
                    disabled={isSaving}
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
            </>
          )}
        </FieldGroup>
      </form>
    </Modal>
  );
}
