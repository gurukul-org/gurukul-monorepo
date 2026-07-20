'use client';

import Link from 'next/link';

import { HomeworkTable } from '@/components/Homework/HomeworkTable';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  useAssignments,
  useDeleteAssignment,
} from '@/services/api/requests/homework';
import { ClipboardList, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function HomeworkPage() {
  // Ensure the user has the base permission to view homework
  useRequirePermission({
    permission: PERMS.homework.viewOwn,
    redirectTo: '/dashboard',
  });

  const { hasPermission } = usePermission();
  const isTeacher = hasPermission(PERMS.homework.create);

  const { data: assignments, isLoading, error } = useAssignments();
  const deleteAssignment = useDeleteAssignment();

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete assignment "${title}"?`)) {
      try {
        await deleteAssignment.mutateAsync(id);
        toast.success(`Assignment "${title}" deleted.`);
      } catch (err) {
        toast.error('Failed to delete assignment.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-zinc-500 animate-pulse flex items-center gap-2">
          <ClipboardList className="h-5 w-5 animate-bounce" /> Loading homework
          assignments...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Failed to load assignments. Please check your network connection.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Homework & Assignments
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isTeacher
              ? 'Manage homework tasks, track student submissions, and grade work.'
              : 'View assigned homework, deadlines, and submission grades.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/homework/submissions"
                  className="flex items-center gap-1.5"
                >
                  <Users className="h-4 w-4" /> View Submissions
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium"
              >
                <Link href={`/homework/create`}>
                  <Plus className="h-4 w-4 mr-1.5" /> Create Homework
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main List */}
      {!assignments || assignments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
          <ClipboardList className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No homework found
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {isTeacher
              ? 'Create your first assignment to get started.'
              : 'You do not have any homework assigned at the moment.'}
          </p>
        </div>
      ) : (
        <HomeworkTable
          assignments={assignments}
          isTeacher={isTeacher}
          showClassName={true}
          onDelete={handleDelete}
          isDeleting={deleteAssignment.isPending}
        />
      )}
    </div>
  );
}
