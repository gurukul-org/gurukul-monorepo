'use client';

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  FilterConfig,
  FilterPanel,
} from '@/components/FilterPanel/FilterPanel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useShowClassModal, useShowDeleteModal } from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import { useAcademicTerms } from '@/services/api/requests/academic-terms';
import {
  Class,
  useArchiveClass,
  useClasses,
  useCourses,
  useDeleteClass,
  useInstructors,
} from '@/services/api/requests/classes';
import { usePrograms } from '@/services/api/requests/programs';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axios from 'axios';
import {
  Archive,
  Calendar,
  Eye,
  Loader2,
  MoreVertical,
  Plus,
  School,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function TenantClassesContainer() {
  const allowed = useRequirePermission({
    anyOf: [PERMS.class.view, PERMS.class.viewOwn],
    redirectTo: '/dashboard',
  });

  const [filterValues, setFilterValues] = useState<
    Record<string, { value: string; label: string }[]>
  >({
    term: [],
    program: [],
    course: [],
    section: [],
    instructor: [],
  });

  const { hasPermission } = usePermission();
  const showClassModal = useShowClassModal();
  const showDeleteModal = useShowDeleteModal();
  const showError = useShowApiError();

  const loadSectionOptions = useCallback(
    async (search: string, page: number) => {
      const { data } = await axios.get<{
        items: { value: string; label: string }[];
        hasMore: boolean;
      }>('/classes/options', {
        params: { page, limit: 10, search },
      });
      return data;
    },
    [],
  );

  const loadTeacherOptions = useCallback(
    async (search: string, page: number) => {
      const { data } = await axios.get<{
        items: { value: string; label: string }[];
        hasMore: boolean;
      }>('/instructors/options', {
        params: { page, limit: 10, search },
      });
      return data;
    },
    [],
  );

  // API query filters
  const classesQueryFilters = useMemo(
    () => ({
      term:
        (filterValues.term || []).map((x) => x.value).join(',') || undefined,
      program:
        (filterValues.program || []).map((x) => x.value).join(',') || undefined,
      course:
        (filterValues.course || []).map((x) => x.value).join(',') || undefined,
      instructor:
        (filterValues.instructor || []).map((x) => x.value).join(',') ||
        undefined,
      section:
        (filterValues.section || []).map((x) => x.value).join(',') || undefined,
    }),
    [filterValues],
  );

  // Queries for data & filters
  const { data: classes, isLoading, isError } = useClasses(classesQueryFilters);
  const { data: terms } = useAcademicTerms();
  const { data: programs } = usePrograms({ status: 'active' });
  const { data: courses } = useCourses({
    programId:
      (filterValues.program || []).map((x) => x.value).join(',') || undefined,
  });
  const { data: instructors } = useInstructors();

  const termOptions = useMemo(() => {
    return (terms ?? []).map((t) => ({ value: t.id, label: t.name }));
  }, [terms]);

  const programOptions = useMemo(() => {
    return (programs ?? []).map((p) => ({ value: p.id, label: p.name }));
  }, [programs]);

  const courseOptions = useMemo(() => {
    return (courses ?? []).map((c) => ({ value: c.id, label: c.name }));
  }, [courses]);

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'term',
        label: 'Academic Term',
        type: 'select',
        options: termOptions,
        placeholder: 'All Terms',
      },
      {
        key: 'program',
        label: 'Program',
        type: 'select',
        options: programOptions,
        placeholder: 'All Programs',
      },
      {
        key: 'course',
        label: 'Subject/Course',
        type: 'select',
        options: courseOptions,
        placeholder: 'All Courses',
      },
      {
        key: 'section',
        label: 'Section',
        type: 'async-select',
        loadOptions: loadSectionOptions,
        placeholder: 'All Sections',
      },
      {
        key: 'instructor',
        label: 'Teacher',
        type: 'async-select',
        loadOptions: loadTeacherOptions,
        placeholder: 'All Teachers',
      },
    ],
    [
      termOptions,
      programOptions,
      courseOptions,
      loadSectionOptions,
      loadTeacherOptions,
    ],
  );

  const handleFilterPanelChange = useCallback(
    (newValues: typeof filterValues) => {
      const currentProgs = (filterValues.program || [])
        .map((p) => p.value)
        .sort()
        .join(',');
      const newProgs = (newValues.program || [])
        .map((p) => p.value)
        .sort()
        .join(',');
      if (newProgs !== currentProgs) {
        newValues.course = [];
      }
      setFilterValues(newValues);
    },
    [filterValues],
  );

  const { mutateAsync: archiveClass } = useArchiveClass();
  const { mutateAsync: deleteClass } = useDeleteClass();

  const handleArchive = useCallback(
    (cls: Class) => {
      showDeleteModal({
        title: 'Archive Section',
        subtitle: `Are you sure you want to archive "${cls.name}"? Archived sections cannot accept new enrollments, but will preserve all enrollment history.`,
        confirmButtonText: 'Archive Section',
        onConfirm: async () => {
          try {
            await archiveClass(cls.id);
            toast.success(`Section "${cls.name}" archived successfully.`);
          } catch (error) {
            showError(error);
          }
        },
      });
    },
    [showDeleteModal, archiveClass, showError],
  );

  const handleDelete = useCallback(
    (cls: Class) => {
      showDeleteModal({
        title: 'Permanently Delete Section',
        subtitle: `Are you sure you want to permanently delete "${cls.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete Permanently',
        onConfirm: async () => {
          try {
            await deleteClass(cls.id);
            toast.success(`Section "${cls.name}" permanently deleted.`);
          } catch (error) {
            showError(error);
          }
        },
      });
    },
    [showDeleteModal, deleteClass, showError],
  );

  const columns = useMemo<ColumnDef<Class>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Section Name / Program',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <School className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <Link
                href={`/academics/classes/${row.original.id}`}
                className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline hover:text-primary transition-colors"
              >
                {row.original.name}
              </Link>
              <span className="text-xs text-zinc-500 font-medium">
                {row.original.program.name} ({row.original.program.code})
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'academicTerm',
        header: 'Term',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
            <Calendar className="h-3.5 w-3.5 opacity-60 shrink-0" />
            <span className="text-xs font-semibold">
              {row.original.academicTerm.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'primaryInstructor',
        header: 'Class Incharge',
        cell: ({ row }) => {
          const instructor = row.original.primaryInstructor;
          if (!instructor) {
            return (
              <span className="text-xs text-muted-foreground italic">
                None assigned
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border uppercase">
                {instructor.firstName.charAt(0)}
              </div>
              <span className="text-xs font-medium">
                {instructor.firstName} {instructor.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'utilization',
        header: 'Enrolled / Capacity',
        cell: ({ row }) => {
          const count = row.original.enrolledCount;
          const capacity = row.original.maxCapacity;
          const pct = capacity > 0 ? Math.round((count / capacity) * 100) : 0;
          return (
            <div className="flex flex-col gap-1 w-28">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-800 dark:text-zinc-200">
                  {count} / {capacity}
                </span>
                <span className="text-zinc-400 font-normal text-[10px]">
                  {pct}% Used
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
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
          );
        },
      },

      {
        id: 'createdAt',
        header: 'Created By / At',
        cell: ({ row }) => {
          const creator = row.original.creator;
          const createdAt = new Date(
            row.original.createdAt,
          ).toLocaleDateString();
          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {creator
                  ? `${creator.firstName} ${creator.lastName.charAt(0)}.`
                  : 'System'}
              </span>
              <span className="text-[10px] text-zinc-400">{createdAt}</span>
            </div>
          );
        },
      },
      {
        id: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) => {
          const updater = row.original.updater;
          const updatedAt = new Date(
            row.original.updatedAt,
          ).toLocaleDateString();
          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {updater
                  ? `${updater.firstName} ${updater.lastName.charAt(0)}.`
                  : 'System'}
              </span>
              <span className="text-[10px] text-zinc-400">{updatedAt}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const isArchived = status === 'ARCHIVED';
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                isArchived
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-350 dark:border-emerald-900/60'
              }`}
            >
              {isArchived ? 'Archived' : 'Active'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const cls = row.original;
          const canEdit = hasPermission(PERMS.class.edit);
          const canDelete = hasPermission(PERMS.class.delete);
          const isDeletable = cls.enrolledCount === 0;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/academics/classes/${cls.id}`}>
                      <Eye className="mr-2 h-4 w-4 opacity-70" />
                      View Details
                    </Link>
                  </DropdownMenuItem>

                  {canEdit && cls.status === 'ACTIVE' && (
                    <DropdownMenuItem
                      onClick={() => showClassModal(cls)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4 opacity-70" />
                      Edit Details
                    </DropdownMenuItem>
                  )}

                  {canEdit && cls.status === 'ACTIVE' && (
                    <DropdownMenuItem
                      onClick={() => handleArchive(cls)}
                      className="cursor-pointer"
                    >
                      <Archive className="mr-2 h-4 w-4 opacity-70 text-amber-600" />
                      Archive Section
                    </DropdownMenuItem>
                  )}

                  {canDelete && (
                    <DropdownMenuItem
                      disabled={!isDeletable}
                      onClick={() => handleDelete(cls)}
                      className={`cursor-pointer ${
                        isDeletable
                          ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        !isDeletable
                          ? 'Cannot delete: section has active or historical enrollments.'
                          : undefined
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4 opacity-70" />
                      Hard Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [hasPermission, showClassModal, handleArchive, handleDelete],
  );

  const table = useReactTable({
    data: classes || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Class Sections
          </h2>
          <p className="text-sm text-muted-foreground">
            Schedule specific class sections for programs, manage student
            capacities, and assign class incharges.
          </p>
        </div>
        {hasPermission(PERMS.class.create) && (
          <Button onClick={() => showClassModal(null)} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Section
          </Button>
        )}
      </div>

      {/* Filters and Controls */}
      <FilterPanel
        feature="classes"
        configs={filterConfigs}
        values={filterValues}
        onChange={handleFilterPanelChange}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-sm">Loading sections...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm text-red-500 font-semibold">
            Failed to load sections. Please check permissions or refresh.
          </p>
        </div>
      ) : !classes || classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-20 bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800">
          <School className="h-10 w-10 text-muted-foreground/60 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-150 mb-1">
            No sections found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm text-center mb-6">
            There are no class sections matching the selected filters. Create a
            new section to start.
          </p>
          {hasPermission(PERMS.class.create) && (
            <Button onClick={() => showClassModal(null)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create First Section
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
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
  );
}
