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
import { useShowClassModal } from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { ClassStudent, useClass } from '@/services/api/requests/classes';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  ChevronRight,
  Edit,
  GraduationCap,
  Info,
  Loader2,
  Users,
} from 'lucide-react';

import { PERMS } from '@repo/permissions';

interface TenantClassDetailContainerProps {
  classId: string;
}

export default function TenantClassDetailContainer({
  classId,
}: TenantClassDetailContainerProps) {
  const { hasPermission } = usePermission();
  const showClassModal = useShowClassModal();

  const { data: cls, isLoading, isError } = useClass(classId);

  // Column definitions for enrolled students table
  const columns = useMemo<ColumnDef<ClassStudent>[]>(
    () => [
      {
        accessorKey: 'rollNumber',
        header: 'Roll Number',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">
            {row.original.rollNumber || 'N/A'}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Student Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border uppercase">
              {row.original.firstName.charAt(0)}
            </div>
            <span className="text-xs font-medium">
              {row.original.firstName} {row.original.lastName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email Address',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-500">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'enrolledAt',
        header: 'Enrolled Date',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-500">
            {new Date(row.original.enrolledAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-350 dark:border-emerald-900/60'
                  : status === 'WITHDRAWN'
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-350 dark:border-red-900/60'
                    : 'bg-zinc-50 text-zinc-650 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
              }`}
            >
              {status}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: cls?.enrolledStudents || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <span className="text-sm">Loading section details...</span>
      </div>
    );
  }

  if (isError || !cls) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <p className="text-sm text-red-500 font-semibold mb-4">
          Failed to load section details.
        </p>
        <Button asChild size="sm">
          <Link href="/academics/classes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Link>
        </Button>
      </div>
    );
  }

  const instructors = cls.instructors || [];
  const classIncharge = instructors.find((i) => i.isPrimary);
  const courses = cls.program.courses || [];
  const pct =
    cls.maxCapacity > 0
      ? Math.round((cls.enrolledCount / cls.maxCapacity) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/academics/classes"
          className="hover:text-primary transition-colors"
        >
          Classes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
          {cls.name}
        </span>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {cls.name}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                cls.status === 'ARCHIVED'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-350'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-350'
              }`}
            >
              {cls.status === 'ARCHIVED' ? 'Archived' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Section of{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {cls.program.name}
            </span>{' '}
            ({cls.program.code}) for academic term{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {cls.academicTerm.name}
            </span>
            .
          </p>
        </div>

        {hasPermission(PERMS.class.edit) && cls.status === 'ACTIVE' && (
          <Button onClick={() => showClassModal(cls)} size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Section
          </Button>
        )}
      </div>

      {/* Metadata Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Capacity Utilization Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Capacity Utilization
            </span>
            <Users className="h-4.5 w-4.5 text-zinc-400" />
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {cls.enrolledCount}
              </span>
              <span className="text-zinc-400 text-sm">
                / {cls.maxCapacity} Seats
              </span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                pct >= 90
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                  : pct >= 75
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'
              }`}
            >
              {pct}% Filled
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 90
                  ? 'bg-red-500'
                  : pct >= 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Class Incharge Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Class Incharge
            </span>
            <Info className="h-4.5 w-4.5 text-zinc-400" />
          </div>
          {classIncharge ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-sm font-extrabold uppercase shrink-0">
                {classIncharge.firstName.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                  {classIncharge.firstName} {classIncharge.lastName}
                </span>
                <span className="text-xs text-zinc-400 truncate">
                  {classIncharge.email}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic block">
              No Class Incharge assigned.
            </span>
          )}
          <div className="text-[10px] text-zinc-400 italic mt-2">
            Responsible for managing general section activities.
          </div>
        </div>

        {/* Audit Details Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Audit Metadata
            </span>
            <Info className="h-4.5 w-4.5 text-zinc-400" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Created By:</span>
              <span className="text-zinc-900 dark:text-zinc-50 font-semibold truncate max-w-[120px]">
                {cls.creator
                  ? `${cls.creator.firstName} ${cls.creator.lastName.charAt(0)}.`
                  : 'System'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Created At:</span>
              <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
                {new Date(cls.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-900 pt-1 mt-1">
              <span className="text-zinc-500 font-medium">Updated By:</span>
              <span className="text-zinc-900 dark:text-zinc-50 font-semibold truncate max-w-[120px]">
                {cls.updater
                  ? `${cls.updater.firstName} ${cls.updater.lastName.charAt(0)}.`
                  : 'System'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Updated At:</span>
              <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
                {new Date(cls.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content: Left (Courses & Teachers), Right (Students) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Courses List Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 border-b pb-2">
              <GraduationCap className="h-4.5 w-4.5 text-primary shrink-0" />
              Subjects & Courses ({courses.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {courses.length === 0 ? (
                <span className="text-xs text-muted-foreground italic block py-4 text-center">
                  No courses linked to this Program.
                </span>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-2.5 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col gap-0.5 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-150">
                      {course.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-medium">
                      {course.code}{' '}
                      {course.credits ? `• ${course.credits} Credits` : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assigned Teachers Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 border-b pb-2">
              <Users className="h-4.5 w-4.5 text-primary shrink-0" />
              Assigned Teachers ({instructors.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {instructors.length === 0 ? (
                <span className="text-xs text-muted-foreground italic block py-4 text-center">
                  No teachers assigned.
                </span>
              ) : (
                instructors.map((teacher) => (
                  <div
                    key={teacher.membershipId}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                        {teacher.firstName.charAt(0)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-150 truncate">
                          {teacher.firstName} {teacher.lastName}
                        </span>
                        <span className="text-[9px] text-zinc-400 truncate">
                          {teacher.email}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 ${
                        teacher.isPrimary
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
                      }`}
                    >
                      {teacher.isPrimary ? 'Class Incharge' : 'Teacher'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Enrolled Students Table Card */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 border-b pb-2">
              <Users className="h-4.5 w-4.5 text-primary shrink-0" />
              Enrolled Students ({cls.enrolledStudents?.length || 0})
            </h3>

            {!cls.enrolledStudents || cls.enrolledStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                <span className="text-xs font-semibold">
                  No students enrolled
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  Students can be enrolled in this section from the student
                  database.
                </span>
              </div>
            ) : (
              <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-96 overflow-y-auto">
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
      </div>
    </div>
  );
}
