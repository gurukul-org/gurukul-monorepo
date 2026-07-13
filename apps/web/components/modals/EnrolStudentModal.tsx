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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import { useCreateEnrolment } from '@/services/api/requests/enrolments';
import { useStudents } from '@/services/api/requests/students';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const enrolmentSchema = z.object({
  studentProfileId: z.string().uuid('Please select a student.'),
  enrolledAt: z.string().min(1, 'Enrollment date is required.'),
});

type EnrolmentValues = z.infer<typeof enrolmentSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EnrolStudentModalProps {
  classId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnrolStudentModal({ classId }: EnrolStudentModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: enrolStudent, isPending: isSaving } =
    useCreateEnrolment();

  // Fetch active students to populate the selection dropdown
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    limit: 100,
    status: 'ACTIVE',
  });

  const studentOptions = useMemo(() => {
    return (studentsData?.students ?? []).map((student) => ({
      value: student.id,
      label: `${student.name ?? 'Unnamed'} (${student.rollNumber})`,
    }));
  }, [studentsData?.students]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrolmentValues>({
    resolver: zodResolver(enrolmentSchema),
    defaultValues: {
      studentProfileId: '',
      enrolledAt: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (values: EnrolmentValues) => {
    try {
      await enrolStudent({
        studentProfileId: values.studentProfileId,
        classId,
        enrolledAt: new Date(values.enrolledAt).toISOString(),
      });
      toast.success('Student enrolled successfully!');
      hideModal();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Enrol Student"
      description="Select an active student and an enrollment date to add them to this class section."
      size="md"
      primaryAction={{
        label: isSaving ? 'Enrolling...' : 'Enrol Student',
        onClick: handleSubmit(onSubmit),
        loading: isSaving,
        disabled: isSaving || isLoadingStudents,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isSaving,
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          {/* Student Selector */}
          <Field data-invalid={!!errors.studentProfileId}>
            <FieldLabel
              htmlFor="studentProfileId"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Select Student <span className="text-red-500">*</span>
            </FieldLabel>
            <SearchableSelect
              id="studentProfileId"
              options={studentOptions}
              placeholder={
                isLoadingStudents ? 'Loading students...' : 'Select student...'
              }
              disabled={isSaving || isLoadingStudents}
              {...register('studentProfileId')}
            />
            {errors.studentProfileId && (
              <FieldError>{errors.studentProfileId.message}</FieldError>
            )}
          </Field>

          {/* Enrollment Date */}
          <Field data-invalid={!!errors.enrolledAt}>
            <FieldLabel
              htmlFor="enrolledAt"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Enrollment Date <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="enrolledAt"
              type="date"
              {...register('enrolledAt')}
              disabled={isSaving}
              className="h-10 text-sm focus-visible:ring-primary/30"
            />
            {errors.enrolledAt && (
              <FieldError>{errors.enrolledAt.message}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
}
