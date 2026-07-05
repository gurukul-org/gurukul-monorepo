'use client';

import { useMemo, useState } from 'react';

import { Modal } from '@/components/modals/Modal';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useHideModal } from '@/hooks/use-modal';
import {
  BulkEnrolResult,
  useBulkCreateEnrolment,
} from '@/services/api/requests/enrolments';
import { useStudents } from '@/services/api/requests/students';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface BulkEnrolModalProps {
  classId: string;
}

export function BulkEnrolModal({ classId }: BulkEnrolModalProps) {
  const hideModal = useHideModal();
  const showError = useShowApiError();

  const { mutateAsync: bulkEnrol, isPending: isSaving } =
    useBulkCreateEnrolment();

  // Fetch active students to populate the multiselect list
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    limit: 100,
    status: 'ACTIVE',
  });

  const activeStudents = studentsData?.students ?? [];

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  // Date state
  const [enrolledAt, setEnrolledAt] = useState<string>(
    new Date().toISOString().split('T')[0] || '',
  );
  // Bulk response results panel state
  const [results, setResults] = useState<BulkEnrolResult | null>(null);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const name = (student.name ?? '').toLowerCase();
      const roll = student.rollNumber.toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || roll.includes(query);
    });
  }, [activeStudents, searchQuery]);

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => {
      // Add all visible IDs that are not already selected
      const next = [...prev];
      visibleIds.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) =>
      prev.filter((id) => !visibleIds.includes(id)),
    );
  };

  const onSubmit = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student to enrol.');
      return;
    }
    try {
      const res = await bulkEnrol({
        classId,
        studentProfileIds: selectedStudentIds,
        enrolledAt: new Date(enrolledAt).toISOString(),
      });
      setResults(res);
      toast.success('Bulk enrolment processed.');
    } catch (err) {
      showError(err);
    }
  };

  // Maps student UUID to name for display in results
  const studentMap = useMemo(() => {
    const map = new Map<string, string>();
    activeStudents.forEach((s) => {
      map.set(s.id, `${s.name ?? 'Unnamed'} (${s.rollNumber})`);
    });
    return map;
  }, [activeStudents]);

  if (results) {
    return (
      <Modal
        isOpen={true}
        onClose={hideModal}
        title="Bulk Enrolment Results"
        description="Here is the breakdown of the batch enrollment results."
        size="md"
        primaryAction={{
          label: 'Done',
          onClick: hideModal,
        }}
      >
        <div className="space-y-4">
          <div className="flex gap-4 text-xs font-semibold">
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
              Succeeded: {results.succeeded.length}
            </span>
            <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded">
              Failed: {results.failed.length}
            </span>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-80 overflow-y-auto divide-y">
            {results.succeeded.map((item) => (
              <div
                key={item.studentProfileId}
                className="flex items-center gap-3 p-3 text-sm text-emerald-800 dark:text-emerald-350 bg-emerald-50/10"
              >
                <div className="h-5 w-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">
                  {studentMap.get(item.studentProfileId) || 'Unknown Student'}
                </span>
                <span className="text-xs text-emerald-600 ml-auto">
                  Enrolled
                </span>
              </div>
            ))}
            {results.failed.map((item) => (
              <div
                key={item.studentProfileId}
                className="flex items-start gap-3 p-3 text-sm text-red-800 dark:text-red-350 bg-red-50/10"
              >
                <div className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {studentMap.get(item.studentProfileId) || 'Unknown Student'}
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {item.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title="Bulk Enrol Students"
      description="Select multiple students and pick an enrollment date to add them in batch."
      size="md"
      primaryAction={{
        label: isSaving
          ? 'Processing...'
          : `Enrol ${selectedStudentIds.length} Student(s)`,
        onClick: onSubmit,
        loading: isSaving,
        disabled:
          isSaving || isLoadingStudents || selectedStudentIds.length === 0,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: hideModal,
        disabled: isSaving,
      }}
    >
      <div className="space-y-4">
        <FieldGroup className="gap-4">
          {/* Enrollment Date */}
          <Field>
            <FieldLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Enrollment Date
            </FieldLabel>
            <Input
              type="date"
              value={enrolledAt}
              onChange={(e) => setEnrolledAt(e.target.value)}
              disabled={isSaving}
              className="h-10 text-sm focus-visible:ring-primary/30"
            />
          </Field>

          {/* Student Multiselect List */}
          <Field>
            <FieldLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Select Students to Enrol
            </FieldLabel>
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSaving || isLoadingStudents}
                className="h-9 text-xs focus-visible:ring-primary/30"
              />
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={
                  isSaving || isLoadingStudents || filteredStudents.length === 0
                }
                className="text-[10px] font-bold text-primary hover:underline shrink-0"
              >
                Select All
              </button>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={
                  isSaving || isLoadingStudents || filteredStudents.length === 0
                }
                className="text-[10px] font-bold text-muted-foreground hover:underline shrink-0"
              >
                Clear
              </button>
            </div>

            {isLoadingStudents ? (
              <div className="h-64 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                Loading active students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="h-64 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-xs text-muted-foreground italic">
                No active students matching filters found.
              </div>
            ) : (
              <div className="h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y bg-zinc-50/10">
                {filteredStudents.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 text-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleStudent(student.id)}
                        disabled={isSaving}
                        className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {student.name ?? 'Unnamed Student'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          Roll: {student.rollNumber}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="text-[10px] text-zinc-400 font-medium italic mt-1.5">
              Selected {selectedStudentIds.length} of {activeStudents.length}{' '}
              active student records.
            </div>
          </Field>
        </FieldGroup>
      </div>
    </Modal>
  );
}
