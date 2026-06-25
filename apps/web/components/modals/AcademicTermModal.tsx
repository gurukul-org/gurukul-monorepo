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
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import {
  AcademicTerm,
  useCreateAcademicTerm,
  useUpdateAcademicTerm,
} from '@/services/api/requests/academic-terms';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const academicTermFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 60 characters')
      .max(60, 'Name must be between 2 and 60 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after the start date',
      path: ['endDate'],
    },
  );

type FormValues = z.infer<typeof academicTermFormSchema>;

interface AcademicTermModalProps {
  editingTerm: AcademicTerm | null;
}

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

export function AcademicTermModal({ editingTerm }: AcademicTermModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: createTerm, isPending: isCreating } =
    useCreateAcademicTerm();
  const { mutateAsync: updateTerm, isPending: isUpdating } =
    useUpdateAcademicTerm();

  const [warning, setWarning] = useState<{
    message: string;
    type: 'overlap' | 'has_classes';
    data: FormValues;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(academicTermFormSchema),
    defaultValues: {
      name: editingTerm?.name || '',
      startDate: formatDateForInput(editingTerm?.startDate),
      endDate: formatDateForInput(editingTerm?.endDate),
    },
  });

  const onFormSubmit = async (data: FormValues, force = false) => {
    try {
      if (editingTerm) {
        await updateTerm({
          id: editingTerm.id,
          dto: {
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            ignoreWarnings: force,
          },
        });
        toast.success('Academic term updated successfully!');
      } else {
        await createTerm({
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          ignoreWarnings: force,
        });
        toast.success('Academic term created successfully!');
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
            type:
              errorData.message === 'OVERLAP_WARNING'
                ? 'overlap'
                : 'has_classes',
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
      title={editingTerm ? 'Edit Academic Term' : 'Create Academic Term'}
      description={
        editingTerm
          ? 'Modify details for this academic term. Changing dates for a term with classes will require confirmation.'
          : 'Define a new academic term period for your institution.'
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
          <Field data-invalid={!!errors.name}>
            <FieldLabel
              htmlFor="name"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Term Name
            </FieldLabel>
            <Input
              id="name"
              {...register('name')}
              disabled={isSaving || !!warning}
              placeholder="e.g. Fall 2026"
              className="h-10 text-sm focus-visible:ring-primary/30"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.startDate}>
              <FieldLabel
                htmlFor="startDate"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                Start Date
              </FieldLabel>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                disabled={isSaving || !!warning}
                className="h-10 text-sm focus-visible:ring-primary/30"
                aria-invalid={!!errors.startDate}
              />
              {errors.startDate && (
                <FieldError>{errors.startDate.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.endDate}>
              <FieldLabel
                htmlFor="endDate"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
              >
                End Date
              </FieldLabel>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                disabled={isSaving || !!warning}
                className="h-10 text-sm focus-visible:ring-primary/30"
                aria-invalid={!!errors.endDate}
              />
              {errors.endDate && (
                <FieldError>{errors.endDate.message}</FieldError>
              )}
            </Field>
          </div>
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
              : editingTerm
                ? 'Save Changes'
                : 'Create Term'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
