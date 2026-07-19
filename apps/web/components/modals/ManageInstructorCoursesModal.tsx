'use client';

import { useState } from 'react';

import { Modal } from '@/components/modals/Modal';
import { Field, FieldLabel } from '@/components/ui/field';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import { useClass } from '@/services/api/requests/classes';
import { useUpdateInstructorCourses } from '@/services/api/requests/instructors';
import { toast } from 'sonner';

interface ManageInstructorCoursesModalProps {
  classId: string;
  classInstructorId: string;
  teacherName: string;
  currentCourseIds: string[];
}

export function ManageInstructorCoursesModal({
  classId,
  classInstructorId,
  teacherName,
  currentCourseIds,
}: ManageInstructorCoursesModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { data: cls, isLoading: isLoadingClass } = useClass(classId);
  const { mutateAsync: updateCourses, isPending: isSaving } =
    useUpdateInstructorCourses();

  const [selectedCourseIds, setSelectedCourseIds] =
    useState<string[]>(currentCourseIds);

  const courses = cls?.program.courses || [];

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleSave = async () => {
    try {
      await updateCourses({
        classId,
        id: classInstructorId,
        courseIds: selectedCourseIds,
      });
      toast.success('Courses updated successfully!');
      hideModal();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Manage Courses Taught"
      description={`Select the courses ${teacherName} teaches in this class.`}
      size="md"
      primaryAction={{
        label: isSaving ? 'Saving...' : 'Save',
        onClick: handleSave,
        loading: isSaving,
        disabled: isSaving || isLoadingClass,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isSaving,
      }}
    >
      <Field>
        <FieldLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          Courses
        </FieldLabel>
        {courses.length === 0 ? (
          <span className="text-[10px] text-muted-foreground italic">
            No courses linked to this class&apos;s program.
          </span>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto border rounded-lg p-2">
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
    </Modal>
  );
}
