'use client';

import { useMemo } from 'react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import { useAcademicTerms } from '@/services/api/requests/academic-terms';
import {
  Class,
  useCreateClass,
  useUpdateClass,
} from '@/services/api/requests/classes';
import { usePrograms } from '@/services/api/requests/programs';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

interface ClassModalProps {
  editingClass: Class | null;
}

export function ClassModal({ editingClass }: ClassModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: createClass, isPending: isCreating } = useCreateClass();
  const { mutateAsync: updateClass, isPending: isUpdating } = useUpdateClass();

  // Load select options
  const { data: programs, isLoading: loadingPrograms } = usePrograms({
    status: 'active',
  });
  const { data: terms, isLoading: loadingTerms } = useAcademicTerms();

  const programOptions = useMemo(() => {
    return (programs ?? []).map((p) => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }));
  }, [programs]);

  const termOptions = useMemo(() => {
    return (terms ?? [])
      .filter((t) => !t.deletedAt)
      .map((t) => ({
        value: t.id,
        label: `${t.name}${t.isActive ? ' (Active)' : ''}`,
      }));
  }, [terms]);

  const statusOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
    [],
  );

  const classFormSchema = z
    .object({
      programId: z.string().uuid('Please select a program'),
      academicTermId: z.string().uuid('Please select an academic term'),
      maxCapacity: z
        .number()
        .int('Capacity must be an integer')
        .min(1, 'Capacity must be at least 1'),
      name: z.string().trim().optional(),
      status: z.string().optional(),
    })
    .refine(
      (data) => {
        if (editingClass && data.maxCapacity < editingClass.enrolledCount) {
          return false;
        }
        return true;
      },
      {
        message: `Capacity cannot be reduced below the current enrollment of ${editingClass?.enrolledCount || 0} students.`,
        path: ['maxCapacity'],
      },
    );

  type FormValues = z.infer<typeof classFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      programId: editingClass?.program.id || '',
      academicTermId: editingClass?.academicTerm.id || '',
      maxCapacity: editingClass?.maxCapacity || 30,
      name: editingClass?.name || '',
      status: editingClass?.status || 'ACTIVE',
    },
  });

  const onFormSubmit = async (data: FormValues) => {
    try {
      if (editingClass) {
        await updateClass({
          id: editingClass.id,
          dto: {
            name: data.name || editingClass.name,
            maxCapacity: data.maxCapacity,
            status: data.status,
          },
        });
        toast.success('Class details updated successfully!');
      } else {
        await createClass({
          programId: data.programId,
          academicTermId: data.academicTermId,
          name: data.name || undefined,
          maxCapacity: data.maxCapacity,
        });
        toast.success('Class created successfully!');
      }
      hideModal();
    } catch (error) {
      showError(error);
    }
  };

  const isSaving = isCreating || isUpdating;
  const isLoadingData = loadingPrograms || loadingTerms;

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title={editingClass ? 'Edit Section Details' : 'Create Class Section'}
      description={
        editingClass
          ? `Edit settings for ${editingClass.name}.`
          : 'Define a concrete section for a program (grade) in a term with capacity.'
      }
    >
      {isLoadingData ? (
        <div className="py-10 flex flex-col items-center justify-center text-zinc-500">
          <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full mb-2"></div>
          <span className="text-xs">Loading form configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <FieldGroup>
            {/* Program Selection */}
            <Field>
              <FieldLabel>Academic Program *</FieldLabel>
              <SearchableSelect
                disabled={!!editingClass}
                options={programOptions}
                placeholder="Select Program (e.g. 9th Grade)"
                {...register('programId')}
              />
              {errors.programId && (
                <FieldError>{errors.programId.message}</FieldError>
              )}
            </Field>

            {/* Term Selection */}
            <Field>
              <FieldLabel>Academic Term *</FieldLabel>
              <SearchableSelect
                disabled={!!editingClass}
                options={termOptions}
                placeholder="Select Term"
                {...register('academicTermId')}
              />
              {errors.academicTermId && (
                <FieldError>{errors.academicTermId.message}</FieldError>
              )}
            </Field>

            {/* Section Name (Optional) */}
            <Field>
              <FieldLabel>Section Name (Optional)</FieldLabel>
              <Input
                placeholder="e.g. Section A (leave blank to auto-generate)"
                {...register('name')}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            {/* Max Capacity */}
            <Field>
              <FieldLabel>Max capacity *</FieldLabel>
              <Input
                type="number"
                placeholder="e.g. 40"
                {...register('maxCapacity', { valueAsNumber: true })}
              />
              {editingClass && (
                <p className="text-[10px] text-zinc-500 font-medium">
                  Current enrolled students: {editingClass.enrolledCount}.
                  Cannot reduce capacity below this.
                </p>
              )}
              {errors.maxCapacity && (
                <FieldError>{errors.maxCapacity.message}</FieldError>
              )}
            </Field>

            {/* Status (Edit only) */}
            {editingClass && (
              <Field>
                <FieldLabel>Status</FieldLabel>
                <SearchableSelect
                  options={statusOptions}
                  placeholder="Select Status"
                  {...register('status')}
                />
                {errors.status && (
                  <FieldError>{errors.status.message}</FieldError>
                )}
              </Field>
            )}
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={hideModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? 'Saving...'
                : editingClass
                  ? 'Save Changes'
                  : 'Create Section'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
