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
import {
  Course,
  useCreateCourse,
  useUpdateCourse,
} from '@/services/api/requests/courses';
import { usePrograms } from '@/services/api/requests/programs';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

interface CourseModalProps {
  editingCourse: Course | null;
}

export function CourseModal({ editingCourse }: CourseModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: createCourse, isPending: isCreating } =
    useCreateCourse();
  const { mutateAsync: updateCourse, isPending: isUpdating } =
    useUpdateCourse();

  // Load programs for dropdown
  const { data: programs, isLoading: loadingPrograms } = usePrograms({
    status: 'active',
  });

  const programOptions = useMemo(() => {
    return (programs ?? []).map((p) => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }));
  }, [programs]);

  const courseFormSchema = z.object({
    programId: z.string().uuid('Please select an academic program'),
    name: z
      .string()
      .trim()
      .min(1, 'Course name is required')
      .max(150, 'Name cannot exceed 150 characters'),
    code: z
      .string()
      .trim()
      .min(1, 'Course code is required')
      .max(50, 'Code cannot exceed 50 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Code must be alphanumeric and contain no spaces',
      ),
    credits: z
      .union([
        z
          .number()
          .int('Credits must be an integer')
          .min(1, 'Credits must be at least 1'),
        z.nan(),
      ])
      .optional(),
    description: z.string().trim().optional(),
  });

  type FormValues = z.infer<typeof courseFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      programId: editingCourse?.program.id || '',
      name: editingCourse?.name || '',
      code: editingCourse?.code || '',
      credits: editingCourse?.credits || undefined,
      description: editingCourse?.description || '',
    },
  });

  const onFormSubmit = async (data: FormValues) => {
    try {
      const normalizedCredits =
        data.credits !== undefined && !isNaN(data.credits)
          ? data.credits
          : undefined;

      if (editingCourse) {
        await updateCourse({
          id: editingCourse.id,
          dto: {
            name: data.name,
            code: data.code.toUpperCase(),
            description: data.description || '',
            credits: normalizedCredits,
          },
        });
        toast.success('Course details updated successfully!');
      } else {
        await createCourse({
          programId: data.programId,
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || undefined,
          credits: normalizedCredits,
        });
        toast.success('Course created successfully!');
      }
      hideModal();
    } catch (error) {
      showError(error);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title={editingCourse ? 'Edit Course Details' : 'Create Academic Course'}
      description={
        editingCourse
          ? `Edit course configurations for ${editingCourse.name}.`
          : 'Create a new course offering and associate it with a program.'
      }
    >
      {loadingPrograms ? (
        <div className="py-10 flex flex-col items-center justify-center text-zinc-500">
          <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full mb-2"></div>
          <span className="text-xs">Loading form settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <FieldGroup>
            {/* Program selection */}
            <Field>
              <FieldLabel>Academic Program *</FieldLabel>
              <SearchableSelect
                disabled={!!editingCourse}
                options={programOptions}
                placeholder="Select Program (e.g. 9th Grade)"
                {...register('programId')}
              />
              {errors.programId && (
                <FieldError>{errors.programId.message}</FieldError>
              )}
            </Field>

            {/* Course Name */}
            <Field>
              <FieldLabel>Course Name *</FieldLabel>
              <Input placeholder="e.g. Mathematics" {...register('name')} />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            {/* Course Code */}
            <Field>
              <FieldLabel>Course Code *</FieldLabel>
              <Input
                placeholder="e.g. MATH101"
                className="uppercase"
                {...register('code')}
              />
              {errors.code && <FieldError>{errors.code.message}</FieldError>}
            </Field>

            {/* Credits */}
            <Field>
              <FieldLabel>Credits (Optional)</FieldLabel>
              <Input
                type="number"
                placeholder="e.g. 4"
                {...register('credits', { valueAsNumber: true })}
              />
              {errors.credits && (
                <FieldError>{errors.credits.message}</FieldError>
              )}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>Description (Optional)</FieldLabel>
              <textarea
                placeholder="e.g. Description of syllabus, grading, etc."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register('description')}
              />
              {errors.description && (
                <FieldError>{errors.description.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={hideModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? 'Saving...'
                : editingCourse
                  ? 'Save Changes'
                  : 'Create Course'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
