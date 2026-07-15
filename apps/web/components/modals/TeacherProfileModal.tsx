'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useHideModal } from '@/hooks/use-modal';
import { useTeacherDetail } from '@/services/api/requests/teachers';
import { BookOpen, Loader2, ShieldAlert, UserCheck, X } from 'lucide-react';

interface TeacherProfileModalProps {
  teacherId: string;
}

export function TeacherProfileModal({ teacherId }: TeacherProfileModalProps) {
  const hideModal = useHideModal();

  const { data: teacher, isLoading, isError } = useTeacherDetail(teacherId);

  return (
    <Dialog open onOpenChange={(open) => !open && hideModal()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto bg-card p-0 sm:max-w-[560px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Teacher Profile Detail
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View teacher identity and assigned classes.
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 p-1.5 text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              Loading teacher details...
            </span>
          </div>
        ) : isError || !teacher ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <span className="text-xs font-semibold">
              Failed to load teacher details
            </span>
          </div>
        ) : (
          <div className="px-6 pb-6">
            {/* Quick Profile Summary Card */}
            <div className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/55 p-5 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold uppercase">
                {teacher.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {teacher.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {teacher.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Classes
              </span>
              {teacher.classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-1" />
                  <p className="text-xs font-medium text-zinc-500">
                    No classes assigned.
                  </p>
                </div>
              ) : (
                teacher.classes.map((c) => (
                  <div
                    key={c.classId}
                    className="flex items-center justify-between p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/20"
                  >
                    <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {c.className}
                    </h4>
                    {c.isPrimary && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 uppercase">
                        Primary
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
