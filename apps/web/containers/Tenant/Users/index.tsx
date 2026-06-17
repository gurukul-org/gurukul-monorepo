'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  TenantUser,
  useRevokeUserAccess,
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
  Search,
  ShieldAlert,
  UserMinus,
  Users2,
} from 'lucide-react';

export default function TenantUsersContainer() {
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );

  // Local state for searching/filtering
  const [globalFilter, setGlobalFilter] = useState('');

  // Local state for row selection
  const [rowSelection, setRowSelection] = useState({});

  // Local state for revoking access confirmation
  const [targetUser, setTargetUser] = useState<TenantUser | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // API hooks
  const { data, isLoading, isError, refetch } = useTenantUsers({
    limit,
    cursor,
  });
  const { mutateAsync: revokeAccess, isPending: isRevoking } =
    useRevokeUserAccess();

  const isPendingState = isRevoking;

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setCursorHistory((prev) => [...prev, cursor]);
      setCursor(data.nextCursor);
      setRowSelection({});
    }
  };

  const handlePrevPage = () => {
    const prevHistory = [...cursorHistory];
    const previous = prevHistory.pop();
    setCursorHistory(prevHistory);
    setCursor(previous);
    setRowSelection({});
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    setCursor(undefined);
    setCursorHistory([]);
    setRowSelection({});
  };

  const handleConfirmRevoke = async () => {
    if (!targetUser) return;
    try {
      await revokeAccess(targetUser.membershipId);
      setIsConfirmOpen(false);
      setTargetUser(null);
    } catch {
      // Error is already handled by showError in useRevokeUserAccess
    }
  };

  const columns = useMemo<ColumnDef<TenantUser>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="px-1 flex items-center">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              disabled={isPendingState}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary focus:ring-offset-2 h-4 w-4 dark:bg-zinc-900 bg-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-1 flex items-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect() || isPendingState}
              onChange={row.getToggleSelectedHandler()}
              className="rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary focus:ring-offset-2 h-4 w-4 dark:bg-zinc-900 bg-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const u = row.original;
          const initials =
            `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`.toUpperCase() ||
            'U';
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-semibold uppercase">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-zinc-900 dark:text-zinc-50 truncate max-w-[150px] sm:max-w-xs">
                  {u.firstName} {u.lastName}
                </span>
                {u.phone && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {u.phone}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[200px] inline-block">
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
            return <span className="text-muted-foreground text-xs">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => {
                let colorClass =
                  'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
                const name = r.name.toLowerCase();
                if (name === 'owner' || name === 'founder') {
                  colorClass =
                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
                } else if (name.includes('admin')) {
                  colorClass =
                    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';
                } else if (
                  name.includes('teacher') ||
                  name.includes('instructor') ||
                  name.includes('tutor')
                ) {
                  colorClass =
                    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60';
                } else if (name.includes('student') || name.includes('pupil')) {
                  colorClass =
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
                } else if (
                  name.includes('accountant') ||
                  name.includes('finance')
                ) {
                  colorClass =
                    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60';
                } else if (
                  name.includes('receptionist') ||
                  name.includes('front desk')
                ) {
                  colorClass =
                    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60';
                }
                return (
                  <span
                    key={r.id}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${colorClass}`}
                  >
                    {r.name}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined At',
        cell: ({ row }) => {
          const joinedAt = row.original.joinedAt;
          if (!joinedAt)
            return <span className="text-muted-foreground">—</span>;
          const date = new Date(joinedAt);
          return (
            <span className="text-zinc-500">
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          let badgeClass =
            'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
          if (status === 'ACTIVE') {
            badgeClass =
              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
          } else if (status === 'INVITED') {
            badgeClass =
              'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60';
          } else if (status === 'SUSPENDED') {
            badgeClass =
              'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
          } else if (status === 'REMOVED') {
            badgeClass =
              'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60';
          }
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${badgeClass}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const u = row.original;
          const isRevokable = !u.isAdmin;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 p-0"
                    disabled={isPendingState}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  {isRevokable ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setTargetUser(u);
                        setIsConfirmOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      <span>Revoke Access</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground/60 cursor-not-allowed flex flex-col items-start gap-1 p-2 focus:bg-transparent"
                    >
                      <div className="flex items-center gap-1.5 font-medium text-xs">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Revocation Blocked</span>
                      </div>
                      <span className="text-[10px] font-normal leading-normal text-muted-foreground/80">
                        Admin access cannot be revoked
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [isPendingState],
  );

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    state: {
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              User Directory
            </h1>
            <Users2 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspace memberships, view roles, and revoke member
            access.
          </p>
        </div>
      </div>

      {/* Filter and Limit controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isPendingState}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={isPendingState}
            className="h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Summary if any selected */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center justify-between text-xs text-primary animate-in fade-in duration-200">
          <span className="font-semibold">
            {Object.keys(rowSelection).length} user
            {Object.keys(rowSelection).length > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 hover:bg-primary/10"
            disabled={isPendingState}
            onClick={() => setRowSelection({})}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Main Table area */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-950">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              Loading users...
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <span className="text-xs font-semibold">
              Failed to load user directory
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : data?.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 text-center">
            <Users2 className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              No users found in this tenant.
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
                  className="data-[state=selected]:bg-muted hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900"
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

      {/* Pagination controls */}
      {!isLoading && !isError && data && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
          <div className="text-xs text-muted-foreground">
            {cursorHistory.length > 0
              ? `Page ${cursorHistory.length + 1}`
              : 'Page 1'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0 || isPendingState}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!data.nextCursor || isPendingState}
              className="h-8 gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Revocation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              <span>Revoke Workspace Access</span>
            </DialogTitle>
            <DialogDescription className="pt-2 text-zinc-600 dark:text-zinc-400">
              Are you sure you want to revoke workspace access for{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {targetUser
                  ? `${targetUser.firstName} ${targetUser.lastName}`
                  : ''}
              </span>
              ?
              <br />
              <br />
              This will immediately terminate all active sessions for this user
              in this tenant workspace and block them from re-entering. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmOpen(false);
                setTargetUser(null);
              }}
              disabled={isPendingState}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={isPendingState}
              className="flex items-center gap-1.5"
            >
              {isPendingState && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>Revoke Access</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
