'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import {
  Program,
  useCreateProgram,
  useUpdateProgram,
} from '@/services/api/requests/programs';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const programFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be between 2 and 120 characters')
    .max(120, 'Name must be between 2 and 120 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Code must be between 1 and 20 characters')
    .max(20, 'Code must be between 1 and 20 characters')
    .regex(
      /^[a-zA-Z0-9-]+$/,
      'Code must be alphanumeric and can contain hyphens only.',
    ),
  description: z.string().trim().optional(),
});

type FormValues = z.infer<typeof programFormSchema>;

interface ProgramModalProps {
  editingProgram: Program | null;
}

export function ProgramModal({ editingProgram }: ProgramModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: createProgram, isPending: isCreating } =
    useCreateProgram();
  const { mutateAsync: updateProgram, isPending: isUpdating } =
    useUpdateProgram();

  const [warning, setWarning] = useState<{
    message: string;
    data: FormValues;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      name: editingProgram?.name || '',
      code: editingProgram?.code || '',
      description: editingProgram?.description || '',
    },
  });

  const onFormSubmit = async (data: FormValues, force = false) => {
    try {
      if (editingProgram) {
        await updateProgram({
          id: editingProgram.id,
          dto: {
            name: data.name,
            code: data.code,
            description: data.description || undefined,
            ignoreWarnings: force,
          },
        });
        toast.success('Program updated successfully!');
      } else {
        await createProgram({
          name: data.name,
          code: data.code,
          description: data.description || undefined,
        });
        toast.success('Program created successfully!');
      }
      setWarning(null);
      hideModal();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData && errorData.error === 'Warning') {
          setWarning({
            message:
              errorData.details || errorData.message || 'Validation warning',
            data,
          });
          return;
        }
      }
      showError(error);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title={editingProgram ? 'Edit Program' : 'Create Program'}
      description={
        editingProgram
          ? 'Modify details for this school program. Changing the unique code will require confirmation.'
          : 'Define a new school program for grouping courses.'
      }
    >
      {warning && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900/60 mb-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Warning
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {warning.message}
              </p>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mt-2">
                Are you sure you want to proceed?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setWarning(null)}
              disabled={isSaving}
              className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:text-amber-300"
            >
              Go Back
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={() => onFormSubmit(warning.data, true)}
              disabled={isSaving}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
            >
              {isSaving ? 'Processing...' : 'Yes, Proceed'}
            </Button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit((d) => onFormSubmit(d, false))}
        className="space-y-6"
      >
        <FieldGroup className="gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel
                  htmlFor="name"
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
                >
                  Program Name
                </FieldLabel>
                <Input
                  id="name"
                  {...register('name')}
                  disabled={isSaving || !!warning}
                  placeholder="e.g. 9th Grade Program"
                  className="h-10 text-sm focus-visible:ring-primary/30"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>
            </div>

            <div>
              <Field data-invalid={!!errors.code}>
                <FieldLabel
                  htmlFor="code"
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
                >
                  Program Code
                </FieldLabel>
                <Input
                  id="code"
                  {...register('code')}
                  disabled={isSaving || !!warning}
                  placeholder="e.g. GRADE-9"
                  className="h-10 text-sm focus-visible:ring-primary/30"
                  aria-invalid={!!errors.code}
                />
                {errors.code && <FieldError>{errors.code.message}</FieldError>}
              </Field>
            </div>
          </div>

          <Field data-invalid={!!errors.description}>
            <FieldLabel
              htmlFor="description"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Description
            </FieldLabel>
            <Textarea
              id="description"
              {...register('description')}
              disabled={isSaving || !!warning}
              placeholder="Provide a brief description of this grade program..."
              className="min-h-[100px] text-sm focus-visible:ring-primary/30"
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <FieldError>{errors.description.message}</FieldError>
            )}
          </Field>
        </FieldGroup>

        <div className="flex w-full items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={hideModal}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !!warning}>
            {isSaving
              ? 'Saving...'
              : editingProgram
                ? 'Save Changes'
                : 'Create Program'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
