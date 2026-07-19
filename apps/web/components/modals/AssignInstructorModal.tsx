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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import { useClass } from '@/services/api/requests/classes';
import {
  useAssignInstructor,
  useEligibleInstructors,
} from '@/services/api/requests/instructors';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

const assignSchema = z.object({
  tenantMembershipId: z.string().uuid('Please select an instructor.'),
  isPrimary: z.boolean(),
  courseIds: z.array(z.string().uuid()),
});

type AssignValues = z.infer<typeof assignSchema>;

interface AssignInstructorModalProps {
  classId: string;
}

export function AssignInstructorModal({ classId }: AssignInstructorModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { data: eligible, isLoading: isLoadingEligible } =
    useEligibleInstructors();
  const { data: cls, isLoading: isLoadingClass } = useClass(classId);
  const { mutateAsync: assignInstructor, isPending: isAssigning } =
    useAssignInstructor();

  // Determine if the class has no instructors assigned yet
  const hasNoInstructors = useMemo(() => {
    return !cls?.instructors || cls.instructors.length === 0;
  }, [cls]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      tenantMembershipId: '',
      isPrimary: false,
      courseIds: [],
    },
  });

  const selectedCourseIds = watch('courseIds');
  const courses = cls?.program.courses || [];

  const toggleCourse = (courseId: string) => {
    const next = selectedCourseIds.includes(courseId)
      ? selectedCourseIds.filter((id) => id !== courseId)
      : [...selectedCourseIds, courseId];
    setValue('courseIds', next);
  };

  // Automatically check & force isPrimary to true if no instructors are assigned yet
  useEffect(() => {
    if (hasNoInstructors) {
      setValue('isPrimary', true);
    }
  }, [hasNoInstructors, setValue]);

  const onSubmit = async (values: AssignValues) => {
    try {
      await assignInstructor({
        classId,
        dto: {
          tenantMembershipId: values.tenantMembershipId,
          isPrimary: values.isPrimary,
          courseIds: values.courseIds,
        },
      });
      toast.success('Instructor assigned successfully!');
      hideModal();
    } catch (err) {
      showError(err);
    }
  };

  const isSaving = isAssigning || isLoadingClass || isLoadingEligible;

  // Filter out instructors who are already assigned to this class
  const unassignedEligible = useMemo(() => {
    if (!eligible || !cls?.instructors) return eligible || [];
    const assignedIds = new Set(cls.instructors.map((i) => i.membershipId));
    return eligible.filter(
      (instructor) => !assignedIds.has(instructor.membershipId),
    );
  }, [eligible, cls]);

  const instructorOptions = useMemo(() => {
    return unassignedEligible.map((instructor) => ({
      value: instructor.membershipId,
      label: `${instructor.firstName} ${instructor.lastName}`,
      description: instructor.email,
    }));
  }, [unassignedEligible]);

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Assign Instructor"
      description="Select an eligible faculty member to assign to this class section."
      size="md"
      primaryAction={{
        label: isAssigning ? 'Assigning...' : 'Assign Instructor',
        onClick: handleSubmit(onSubmit),
        loading: isAssigning,
        disabled: isSaving || unassignedEligible.length === 0,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isAssigning,
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          {/* Instructor Selection */}
          <Field data-invalid={!!errors.tenantMembershipId}>
            <FieldLabel
              htmlFor="tenantMembershipId"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
            >
              Select Instructor <span className="text-red-500">*</span>
            </FieldLabel>
            {isLoadingEligible ? (
              <div className="h-10 animate-pulse bg-zinc-150 rounded-lg dark:bg-zinc-800" />
            ) : unassignedEligible.length === 0 ? (
              <div className="text-xs p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 italic">
                All eligible instructors have already been assigned to this
                class.
              </div>
            ) : (
              <SearchableSelect
                id="tenantMembershipId"
                options={instructorOptions}
                placeholder="-- Choose an Instructor --"
                disabled={isSaving}
                {...register('tenantMembershipId')}
              />
            )}
            {errors.tenantMembershipId && (
              <FieldError>{errors.tenantMembershipId.message}</FieldError>
            )}
          </Field>

          {/* Primary Designation Checkbox */}
          {unassignedEligible.length > 0 && (
            <Field className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="isPrimary"
                {...register('isPrimary')}
                disabled={isSaving || hasNoInstructors}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/35 mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel
                  htmlFor="isPrimary"
                  className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 cursor-pointer"
                >
                  Designate as Primary Instructor
                </FieldLabel>
                {hasNoInstructors ? (
                  <span className="text-[10px] text-muted-foreground italic">
                    First instructor must be designated as the primary
                    instructor (Class Incharge).
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400">
                    Promoting this instructor will demote the current Class
                    Incharge to a secondary instructor.
                  </span>
                )}
              </div>
            </Field>
          )}

          {/* Course Selection */}
          {unassignedEligible.length > 0 && (
            <Field>
              <FieldLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Courses Taught (optional)
              </FieldLabel>
              {courses.length === 0 ? (
                <span className="text-[10px] text-muted-foreground italic">
                  No courses linked to this class&apos;s program.
                </span>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        disabled={isSaving}
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/35"
                      />
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">
                        {course.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
          )}
        </FieldGroup>
      </form>
    </Modal>
  );
}
