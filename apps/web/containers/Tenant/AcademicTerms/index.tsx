'use client';

import { useMemo, useState } from 'react';

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShowApiError } from '@/hooks/api/use-show-api-error';
import {
  useShowAcademicTermModal,
  useShowDeleteModal,
} from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  AcademicTerm,
  useAcademicTerms,
  useActivateAcademicTerm,
  useArchiveAcademicTerm,
  useDeactivateAcademicTerm,
  useDeleteAcademicTerm,
} from '@/services/api/requests/academic-terms';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Archive,
  Calendar,
  Check,
  Eye,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

export default function TenantAcademicTermsContainer() {
  const allowed = useRequirePermission({
    permission: PERMS.academicTerm.view,
    redirectTo: '/dashboard',
  });

  const [activeTab, setActiveTab] = useState<string>('active');

  const { hasPermission } = usePermission();
  const showAcademicTermModal = useShowAcademicTermModal();
  const showDeleteModal = useShowDeleteModal();
  const showError = useShowApiError();

  // API hooks
  const statusParam = activeTab === 'all' ? undefined : activeTab;
  const { data: terms, isLoading, isError } = useAcademicTerms(statusParam);

  const { mutateAsync: activateTerm } = useActivateAcademicTerm();
  const { mutateAsync: deactivateTerm } = useDeactivateAcademicTerm();
  const { mutateAsync: archiveTerm } = useArchiveAcademicTerm();
  const { mutateAsync: deleteTerm } = useDeleteAcademicTerm();

  const handleActivate = async (term: AcademicTerm) => {
    try {
      await activateTerm(term.id);
      toast.success(`Academic term "${term.name}" is now active!`);
    } catch (error) {
      showError(error);
    }
  };

  const handleDeactivate = async (term: AcademicTerm) => {
    try {
      await deactivateTerm(term.id);
      toast.success(`Academic term "${term.name}" deactivated.`);
    } catch (error) {
      showError(error);
    }
  };

  const handleArchive = (term: AcademicTerm) => {
    showDeleteModal({
      title: 'Archive Academic Term',
      subtitle: `Are you sure you want to archive "${term.name}"? This term will be soft-deleted but remain visible in historical views. Archived terms cannot be selected when creating new classes.`,
      confirmButtonText: 'Archive',
      onConfirm: async () => {
        try {
          await archiveTerm(term.id);
          toast.success(`Academic term "${term.name}" archived.`);
        } catch (error) {
          showError(error);
        }
      },
    });
  };

  const handleDelete = (term: AcademicTerm) => {
    showDeleteModal({
      title: 'Delete Academic Term',
      subtitle: `Are you sure you want to permanently delete "${term.name}"? This action cannot be undone.`,
      confirmButtonText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          await deleteTerm(term.id);
          toast.success(`Academic term "${term.name}" permanently deleted.`);
        } catch (error) {
          showError(error);
        }
      },
    });
  };

  const columns = useMemo<ColumnDef<AcademicTerm>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Term Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ row }) => {
          const date = new Date(row.original.startDate);
          return (
            <span className="text-zinc-600 dark:text-zinc-300">
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
        accessorKey: 'endDate',
        header: 'End Date',
        cell: ({ row }) => {
          const date = new Date(row.original.endDate);
          return (
            <span className="text-zinc-600 dark:text-zinc-300">
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
        accessorKey: 'classCount',
        header: 'Classes Scheduled',
        cell: ({ row }) => (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {row.original.classCount}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const t = row.original;
          const now = new Date();
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);

          let label = 'Upcoming';
          let badgeClass =
            'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60';

          if (t.deletedAt) {
            label = 'Archived';
            badgeClass =
              'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
          } else if (t.isActive) {
            label = 'Active';
            badgeClass =
              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
          } else if (end < now) {
            label = 'Past';
            badgeClass =
              'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
          } else if (start > now) {
            label = 'Upcoming';
            badgeClass =
              'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60';
          }

          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}
            >
              {label}
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
        accessorKey: 'updatedBy',
        header: 'Updated By',
        cell: ({ row }) => (
          <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate max-w-[120px] inline-block">
            {row.original.updatedBy || 'System'}
          </span>
        ),
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
          const t = row.original;
          const canEdit = hasPermission(PERMS.academicTerm.edit);
          const canDelete = hasPermission(PERMS.academicTerm.delete);

          if (!canEdit && !canDelete) return null;

          const isDeletable = t.classCount === 0;

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
                  {canEdit && !t.deletedAt && (
                    <>
                      <DropdownMenuItem
                        onClick={() => showAcademicTermModal(t)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4 opacity-70" />
                        Edit Details
                      </DropdownMenuItem>
                      {t.isActive ? (
                        <DropdownMenuItem
                          onClick={() => handleDeactivate(t)}
                          className="cursor-pointer"
                        >
                          <XCircle className="mr-2 h-4 w-4 opacity-70 text-red-500" />
                          Deactivate Term
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleActivate(t)}
                          className="cursor-pointer"
                        >
                          <Check className="mr-2 h-4 w-4 opacity-70 text-emerald-500" />
                          Mark Active
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {canDelete && !t.deletedAt && (
                    <DropdownMenuItem
                      onClick={() => handleArchive(t)}
                      className="cursor-pointer"
                    >
                      <Archive className="mr-2 h-4 w-4 opacity-70" />
                      Archive (Soft Delete)
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      disabled={!isDeletable}
                      onClick={() => handleDelete(t)}
                      className={`cursor-pointer ${
                        isDeletable
                          ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        !isDeletable
                          ? 'Cannot delete term: classes are scheduled in it.'
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
    [hasPermission, showAcademicTermModal, showDeleteModal],
  );

  const table = useReactTable({
    data: terms || [],
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
            Academic Terms
          </h2>
          <p className="text-sm text-muted-foreground">
            Define and manage school terms, semesters, or trimesters for your
            institution.
          </p>
        </div>
        {hasPermission(PERMS.academicTerm.create) && (
          <Button
            onClick={() => showAcademicTermModal(null)}
            className="sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Term
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b pb-1 border-zinc-200 dark:border-zinc-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="h-9">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All Terms</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-sm">Loading academic terms...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm text-red-500 font-medium">
            Failed to load terms.
          </p>
        </div>
      ) : !terms || terms.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-20 bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800">
          <Calendar className="h-10 w-10 text-muted-foreground/60 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-150 mb-1">
            No academic terms
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm text-center mb-6">
            There are no terms listed under this status filter. Create a new
            term to schedule classes.
          </p>
          {hasPermission(PERMS.academicTerm.create) && activeTab === 'all' && (
            <Button onClick={() => showAcademicTermModal(null)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create First Term
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
