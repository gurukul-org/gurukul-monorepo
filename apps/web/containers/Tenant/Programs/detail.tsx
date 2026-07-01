'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useShowProgramModal } from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { ProgramCourse, useProgram } from '@/services/api/requests/programs';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Edit,
  GraduationCap,
  Info,
  Loader2,
  Plus,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

interface TenantProgramDetailContainerProps {
  programId: string;
}

export default function TenantProgramDetailContainer({
  programId,
}: TenantProgramDetailContainerProps) {
  const { data: program, isLoading, isError } = useProgram(programId);
  const { hasPermission } = usePermission();
  const showProgramModal = useShowProgramModal();
  const canEdit = hasPermission(PERMS.program.edit);

  const columns = useMemo<ColumnDef<ProgramCourse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Course Name',
        cell: ({ row }) => (
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Course Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border px-2 py-0.5 rounded">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'credits',
        header: 'Credits',
        cell: ({ row }) => (
          <span className="text-zinc-600 dark:text-zinc-300">
            {row.original.credits ?? 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'activeEnrollmentCount',
        header: 'Active Enrollments',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <Users className="h-3.5 w-3.5 opacity-60" />
            <span className="text-sm font-semibold">
              {row.original.activeEnrollmentCount}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Added On',
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <span className="text-zinc-500 text-xs">
              {date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: program?.courses || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <span className="text-sm">Loading program details...</span>
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
        <p className="text-sm text-red-500 font-semibold mb-4">
          Failed to load program.
        </p>
        <Button asChild variant="outline">
          <Link href="/academics/programs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Link>
        </Button>
      </div>
    );
  }

  const isArchived = !!program.deletedAt;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs and Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Link
            href="/academics/programs"
            className="hover:text-primary transition-colors"
          >
            Programs
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="text-zinc-800 dark:text-zinc-200">
            {program.name}
          </span>
        </div>

        <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
              <Link href="/academics/programs">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                {program.name}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                    isArchived
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isArchived ? 'Archived' : 'Active'}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Code: {program.code}
              </p>
            </div>
          </div>

          {canEdit && !program.deletedAt && (
            <Button onClick={() => showProgramModal(program)} size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Program
            </Button>
          )}
        </div>
      </div>

      {/* Program Metadata Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About Program Card */}
        <div className="md:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary opacity-80" />
            About Program
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {program.description || 'No description provided for this program.'}
          </p>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">
                Created By
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {program.createdBy || 'System'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">
                Created At
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {new Date(program.createdAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </span>
            </div>
            {program.updatedBy && (
              <div>
                <span className="text-muted-foreground block mb-0.5">
                  Updated By
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {program.updatedBy}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block mb-0.5">
                Last Updated
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {new Date(program.updatedAt).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Total Enrollment Summary Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <GraduationCap className="h-32 w-32" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary opacity-90">
              Enrollment Summary
            </h4>
            <p className="text-sm text-muted-foreground">
              Total active students currently enrolled across all courses.
            </p>
          </div>
          <div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-primary">
                {program.totalEnrollmentCount}
              </span>
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                active students
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full bg-white/50 hover:bg-white border-primary/20 text-primary dark:bg-zinc-900/50 dark:hover:bg-zinc-900 z-10 relative"
              onClick={() => toast.info('Enrollment management coming soon')}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Enroll Student
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-primary opacity-80" />
            Program Courses ({program.courses?.length || 0})
          </h3>
          {!isArchived && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info('Course mapping feature coming soon')}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Link Course
            </Button>
          )}
        </div>

        {!program.courses || program.courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-14 bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800">
            <BookOpen className="h-8 w-8 text-muted-foreground/60 mb-3" />
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-150 mb-0.5">
              No courses mapped
            </h4>
            <p className="text-[11px] text-muted-foreground max-w-xs text-center mb-4">
              There are no courses currently mapped under this program
              structure.
            </p>
            {!isArchived && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('Course mapping feature coming soon')}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Link Course
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
