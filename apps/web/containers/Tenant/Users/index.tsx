'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';

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
import {
  useShowChangeRoleModal,
  useShowMemberProfileModal,
  useShowModal,
  useShowSuspendMemberModal,
} from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import { useAuthUser } from '@/lib/store/auth';
import { ModalType } from '@/lib/store/types/modal';
import {
  TenantUser,
  useReactivateMember,
  useTenantUsers,
} from '@/services/api/requests/users';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldAlert,
  Trash2,
  UserRoundCog,
  Users2,
} from 'lucide-react';

import { PERMS } from '@repo/permissions';

// The directory defaults to active members (the people who currently have
// access); the filter lets an owner inspect suspended members too.
// Mirrors the real TenantMembership lifecycle statuses — there is no "all"
// status; the directory always filters by a concrete status (default ACTIVE).
const STATUS_FILTERS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Removed', value: 'REMOVED' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
  INVITED:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
  SUSPENDED:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
  REMOVED:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60',
};

function roleBadgeClass(name: string) {
  const n = name.toLowerCase();
  if (n === 'owner' || n === 'founder')
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
  if (n.includes('admin'))
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';
  if (n.includes('teacher') || n.includes('instructor') || n.includes('tutor'))
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60';
  if (n.includes('student') || n.includes('pupil'))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
  return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
}

export default function TenantUsersContainer() {
  const [limit, setLimit] = useState(25);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]['value']>('ACTIVE');
  const [globalFilter, setGlobalFilter] = useState('');

  const statusOptions = useMemo(() => {
    return STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }));
  }, []);

  const limitOptions = useMemo(() => {
    return [10, 25, 50, 100].map((size) => ({
      value: String(size),
      label: String(size),
    }));
  }, []);

  const authUser = useAuthUser();
  const showMemberProfile = useShowMemberProfileModal();
  const openChangeRole = useShowChangeRoleModal();
  const openSuspend = useShowSuspendMemberModal();
  const showModal = useShowModal();
  const { mutateAsync: reactivate } = useReactivateMember();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMS.user.edit);
  const canSuspend = hasPermission(PERMS.user.suspend);
  const canDelete = hasPermission(PERMS.user.delete);

  const { data, isLoading, isError, refetch } = useTenantUsers({
    limit,
    cursor,
    status: statusFilter,
  });

  const resetPaging = () => {
    setCursor(undefined);
    setCursorHistory([]);
  };

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setCursorHistory((prev) => [...prev, cursor]);
      setCursor(data.nextCursor);
    }
  };

  const handlePrevPage = () => {
    const prevHistory = [...cursorHistory];
    const previous = prevHistory.pop();
    setCursorHistory(prevHistory);
    setCursor(previous);
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    resetPaging();
  };

  const handleStatusChange = (
    value: (typeof STATUS_FILTERS)[number]['value'],
  ) => {
    setStatusFilter(value);
    resetPaging();
  };

  const columns = useMemo<ColumnDef<TenantUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        accessorFn: (u) => `${u.firstName} ${u.lastName} ${u.email}`,
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = authUser?.membershipId === u.membershipId;
          const initials =
            `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase() ||
            'U';
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold uppercase text-primary">
                {initials}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 truncate font-medium text-zinc-900 dark:text-zinc-50">
                  {u.firstName} {u.lastName}
                  {isSelf && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-primary">
                      You
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="inline-block max-w-[200px] truncate text-zinc-600 dark:text-zinc-300">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: 'roles',
        header: 'Roles',
        cell: ({ row }) => {
          const roles = row.original.roles;
          if (roles.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r.id}
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleBadgeClass(
                    r.name,
                  )}`}
                >
                  {r.name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                STATUS_BADGE[status] ?? STATUS_BADGE.REMOVED
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => {
          const joinedAt = row.original.joinedAt;
          if (!joinedAt)
            return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-zinc-500">
              {new Date(joinedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          );
        },
      },
      {
        id: 'updatedBy',
        header: 'Updated By',
        cell: ({ row }) => {
          const by = row.original.updatedBy;
          return by ? (
            <span className="text-zinc-600 dark:text-zinc-300">
              {by.firstName} {by.lastName}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'updatedAt',
        header: 'Updated At',
        cell: ({ row }) => {
          const at = row.original.updatedAt;
          if (!at) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-zinc-500">
              {new Date(at).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const u = row.original;
          if (!canEdit && !canSuspend && !canDelete) return null;
          // Removed members are read-only in the directory — they keep no
          // roles or access, and returning staff come back via the invite flow.
          if (u.status === 'REMOVED') return null;
          const isSelf = authUser?.membershipId === u.membershipId;
          const canMutate = !isSelf && !u.isAdmin;
          const isSuspended = u.status === 'SUSPENDED';
          const name = `${u.firstName} ${u.lastName}`;
          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {canEdit && (
                    <DropdownMenuItem
                      disabled={!canMutate}
                      className="cursor-pointer"
                      onClick={() =>
                        openChangeRole({
                          membershipId: u.membershipId,
                          currentRoleIds: u.roles.map((r) => r.id),
                          userFullName: name,
                        })
                      }
                    >
                      <UserRoundCog className="mr-2 h-4 w-4" />
                      Change Role
                    </DropdownMenuItem>
                  )}
                  {canSuspend &&
                    (isSuspended ? (
                      <DropdownMenuItem
                        disabled={!canMutate}
                        className="cursor-pointer"
                        onClick={() => reactivate(u.membershipId)}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Reactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        disabled={!canMutate || u.status !== 'ACTIVE'}
                        className="cursor-pointer"
                        onClick={() => openSuspend(u.membershipId, name)}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Suspend
                      </DropdownMenuItem>
                    ))}
                  {canDelete && (
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={!canMutate}
                      className="cursor-pointer"
                      onClick={() =>
                        showModal(ModalType.RevokeAccessModal, {
                          membershipId: u.membershipId,
                          userFullName: name,
                        })
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      authUser?.membershipId,
      canEdit,
      canSuspend,
      canDelete,
      openChangeRole,
      openSuspend,
      showModal,
      reactivate,
    ],
  );

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Title */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Member Directory
            </h1>
            <Users2 className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone with access to this workspace. Select a member to view
            their full profile and manage their access.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <SearchableSelect
              value={statusFilter}
              onChange={(val: string) =>
                handleStatusChange(
                  val as (typeof STATUS_FILTERS)[number]['value'],
                )
              }
              options={statusOptions}
              placeholder="Select Status"
              className="h-9 min-w-32 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Rows:</span>
            <SearchableSelect
              value={String(limit)}
              onChange={(val: string) => handlePageSizeChange(Number(val))}
              options={limitOptions}
              placeholder="Select limit"
              className="h-9 w-20 py-1 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">
              Loading members...
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 p-20 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <span className="text-xs font-semibold">
              Failed to load member directory
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (data?.users.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-20 text-center">
            <Users2 className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              No members found for this filter.
            </span>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 text-xs">
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
                <TableRow
                  key={row.id}
                  onClick={() => showMemberProfile(row.original.membershipId)}
                  className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50/70 dark:border-zinc-900 dark:hover:bg-zinc-900/20"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 text-xs leading-normal"
                    >
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
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && data && (
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-900">
          <div className="text-xs text-muted-foreground">
            Page {cursorHistory.length + 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!data.nextCursor}
              className="h-8 gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
