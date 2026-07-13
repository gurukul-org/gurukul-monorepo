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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import { useShowDeleteModal, useShowProgramModal } from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  Program,
  useArchiveProgram,
  useDeleteProgram,
  usePrograms,
} from '@/services/api/requests/programs';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Archive,
  BookOpen,
  Eye,
  GraduationCap,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function TenantProgramsContainer() {
  const allowed = useRequirePermission({
    permission: PERMS.program.view,
    redirectTo: '/dashboard',
  });

  const [activeTab, setActiveTab] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { hasPermission } = usePermission();
  const showProgramModal = useShowProgramModal();
  const showDeleteModal = useShowDeleteModal();
  const showError = useShowApiError();

  // API hooks
  const {
    data: programs,
    isLoading,
    isError,
  } = usePrograms({
    status: activeTab === 'all' ? undefined : activeTab,
    search: searchQuery || undefined,
  });

  const { mutateAsync: archiveProgram } = useArchiveProgram();
  const { mutateAsync: deleteProgram } = useDeleteProgram();

  const handleArchive = useCallback(
    (program: Program) => {
      showDeleteModal({
        title: 'Archive Program',
        subtitle: `Are you sure you want to archive "${program.name}"? Soft-deleting a program prevents adding new courses to it. Existing courses will remain functional.`,
        confirmButtonText: 'Archive Program',
        onConfirm: async () => {
          try {
            await archiveProgram(program.id);
            toast.success(`Program "${program.name}" archived successfully.`);
          } catch (error) {
            showError(error);
          }
        },
      });
    },
    [showDeleteModal, archiveProgram, showError],
  );

  const handleDelete = useCallback(
    (program: Program) => {
      showDeleteModal({
        title: 'Permanently Delete Program',
        subtitle: `Are you sure you want to permanently delete "${program.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete Permanently',
        onConfirm: async () => {
          try {
            await deleteProgram(program.id);
            toast.success(`Program "${program.name}" permanently deleted.`);
          } catch (error) {
            showError(error);
          }
        },
      });
    },
    [showDeleteModal, deleteProgram, showError],
  );

  const columns = useMemo<ColumnDef<Program>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Program Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <Link
                href={`/academics/programs/${row.original.id}`}
                className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline hover:text-primary transition-colors"
              >
                {row.original.name}
              </Link>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border px-2 py-0.5 rounded">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'courseCount',
        header: 'Courses',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <BookOpen className="h-3.5 w-3.5 opacity-60" />
            <span className="text-sm font-medium">
              {row.original.courseCount}
            </span>
          </div>
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isArchived = !!row.original.deletedAt;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                isArchived
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
              }`}
            >
              {isArchived ? 'Archived' : 'Active'}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdBy',
        header: 'Created By',
        cell: ({ row }) => (
          <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate max-w-[120px] inline-block">
            {row.original.createdBy || 'System'}
          </span>
        ),
      },
      {
        accessorKey: 'updatedBy',
        header: 'Updated By',
        cell: ({ row }) => (
          <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate max-w-[120px] inline-block">
            {row.original.updatedBy || 'System'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
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
      {
        accessorKey: 'updatedAt',
        header: 'Updated At',
        cell: ({ row }) => {
          const date = new Date(row.original.updatedAt);
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const program = row.original;
          const canEdit = hasPermission(PERMS.program.edit);
          const canDelete = hasPermission(PERMS.program.delete);
          const isDeletable = program.courseCount === 0;

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
                    <Link href={`/academics/programs/${program.id}`}>
                      <Eye className="mr-2 h-4 w-4 opacity-70" />
                      View Details
                    </Link>
                  </DropdownMenuItem>

                  {canEdit && !program.deletedAt && (
                    <DropdownMenuItem
                      onClick={() => showProgramModal(program)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4 opacity-70" />
                      Edit Details
                    </DropdownMenuItem>
                  )}

                  {canDelete && !program.deletedAt && (
                    <DropdownMenuItem
                      onClick={() => handleArchive(program)}
                      className="cursor-pointer"
                    >
                      <Archive className="mr-2 h-4 w-4 opacity-70 text-amber-600" />
                      Archive (Soft Delete)
                    </DropdownMenuItem>
                  )}

                  {canDelete && (
                    <DropdownMenuItem
                      disabled={!isDeletable}
                      onClick={() => handleDelete(program)}
                      className={`cursor-pointer ${
                        isDeletable
                          ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        !isDeletable
                          ? 'Cannot hard-delete program: there are active or archived courses under it.'
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
    [hasPermission, showProgramModal, handleArchive, handleDelete],
  );

  const table = useReactTable({
    data: programs || [],
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
            Academic Programs
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage grade levels, pathways, and programs offered by your school.
          </p>
        </div>
        {hasPermission(PERMS.program.create) && (
          <Button onClick={() => showProgramModal(null)} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b pb-4 border-zinc-200 dark:border-zinc-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="h-9">
            <TabsTrigger value="active">Active Programs</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All Programs</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Content Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-sm">Loading programs...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm text-red-500 font-medium font-semibold">
            Failed to load programs.
          </p>
        </div>
      ) : !programs || programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-20 bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800">
          <GraduationCap className="h-10 w-10 text-muted-foreground/60 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-150 mb-1">
            No programs found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm text-center mb-6">
            There are no programs listed under this filter. Add a program to
            start mapping courses.
          </p>
          {hasPermission(PERMS.program.create) && activeTab === 'active' && (
            <Button onClick={() => showProgramModal(null)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add First Program
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
