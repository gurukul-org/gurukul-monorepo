'use client';

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useShowCourseModal, useShowDeleteModal } from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  Course,
  useCourses,
  useDeleteCourse,
} from '@/services/api/requests/courses';
import { usePrograms } from '@/services/api/requests/programs';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  BookOpen,
  Eye,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function TenantCoursesContainer() {
  const allowed = useRequirePermission({
    anyOf: [PERMS.course.view, PERMS.course.viewOwn],
    redirectTo: '/dashboard',
  });

  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { hasPermission } = usePermission();
  const showCourseModal = useShowCourseModal();
  const showDeleteModal = useShowDeleteModal();
  const showError = useShowApiError();

  const coursesQueryFilters = useMemo(
    () => ({
      programId: selectedProgram || undefined,
      search: searchQuery || undefined,
    }),
    [selectedProgram, searchQuery],
  );

  const { data: courses, isLoading, isError } = useCourses(coursesQueryFilters);
  const { data: programs } = usePrograms({ status: 'active' });

  const programOptions = useMemo(() => {
    return (programs ?? []).map((p) => ({ value: p.id, label: p.name }));
  }, [programs]);

  const { mutateAsync: deleteCourse } = useDeleteCourse();

  const handleDelete = useCallback(
    (course: Course) => {
      showDeleteModal({
        title: 'Delete Course',
        subtitle: `Are you sure you want to delete course "${course.name}" (${course.code})? This will soft delete the course.`,
        confirmButtonText: 'Delete Course',
        onConfirm: async () => {
          try {
            await deleteCourse(course.id);
            toast.success(`Course "${course.name}" deleted successfully.`);
          } catch (error) {
            showError(error);
          }
        },
      });
    },
    [showDeleteModal, deleteCourse, showError],
  );

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Course Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <Link
                href={`/academics/courses/${row.original.id}`}
                className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline hover:text-primary transition-colors"
              >
                {row.original.name}
              </Link>
              {row.original.description && (
                <span className="text-[10px] text-zinc-400 line-clamp-1 max-w-[250px]">
                  {row.original.description}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Course Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'program',
        header: 'Academic Program',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">
            {row.original.program.name} ({row.original.program.code})
          </span>
        ),
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
              <span className="font-semibold text-zinc-805 dark:text-zinc-200">
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
              <span className="font-semibold text-zinc-805 dark:text-zinc-200">
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
        accessorKey: 'credits',
        header: 'Credits',
        cell: ({ row }) => (
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {row.original.credits !== null
              ? `${row.original.credits} Cr`
              : 'N/A'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const course = row.original;
          const canEdit = hasPermission(PERMS.course.edit);
          const canDelete = hasPermission(PERMS.course.delete);

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
                    <Link href={`/academics/courses/${course.id}`}>
                      <Eye className="mr-2 h-4 w-4 opacity-70" />
                      View Details
                    </Link>
                  </DropdownMenuItem>

                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() => showCourseModal(course)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4 opacity-70" />
                      Edit Details
                    </DropdownMenuItem>
                  )}

                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(course)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4 opacity-70" />
                      Delete Course
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [hasPermission, showCourseModal, handleDelete],
  );

  const table = useReactTable({
    data: courses || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const clearFilters = () => {
    setSelectedProgram('');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedProgram || searchQuery;

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Academic Courses
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage course subjects, academic program associations, and student
            credits.
          </p>
        </div>
        {hasPermission(PERMS.course.create) && (
          <Button onClick={() => showCourseModal(null)} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* Search Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Search Courses
            </label>
            <Input
              placeholder="e.g. Mathematics or MATH101"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Program Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Program Filter
            </label>
            <SearchableSelect
              value={selectedProgram}
              onChange={setSelectedProgram}
              options={programOptions}
              placeholder="All Programs"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <Button variant="ghost" size="xs" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-sm">Loading academic courses...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm text-red-500 font-semibold">
            Failed to load courses. Please refresh.
          </p>
        </div>
      ) : !courses || courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-20 bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800">
          <BookOpen className="h-10 w-10 text-muted-foreground/60 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-150 mb-1">
            No courses found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm text-center mb-6">
            There are no academic courses matching your filters. Create a new
            course to start.
          </p>
          {hasPermission(PERMS.course.create) && (
            <Button onClick={() => showCourseModal(null)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create First Course
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
