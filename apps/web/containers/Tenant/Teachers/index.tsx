'use client';

import { useMemo, useState } from 'react';

import { AccountStatusBadge } from '@/components/AccountStatusBadge';
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
import { useShowTeacherProfileModal } from '@/hooks/use-modal';
import { useRequirePermission } from '@/hooks/use-require-permission';
import {
  TeacherListItem,
  useTeachers,
} from '@/services/api/requests/teachers';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Eye,
  Loader2,
  MoreVertical,
  Search,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

import { PERMS } from '@repo/permissions';

export default function TeachersContainer() {
  const allowed = useRequirePermission({
    permission: PERMS.teacher.view,
    redirectTo: '/dashboard',
  });

  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useTeachers({
    search: search || undefined,
  });

  const showTeacherProfile = useShowTeacherProfileModal();

  const columns = useMemo<ColumnDef<TeacherListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Teacher',
        cell: ({ row }) => {
          const t = row.original;
          const initials = t.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          return (
            <button
              type="button"
              onClick={() => showTeacherProfile(t.id)}
              className="flex items-center gap-3 text-left hover:opacity-85 focus:outline-none"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-semibold uppercase">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-primary hover:underline truncate max-w-[180px]">
                    {t.name}
                  </span>
                  <AccountStatusBadge status={t.accountStatus} />
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {t.email}
                </span>
              </div>
            </button>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open actions menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
              >
                <DropdownMenuItem
                  onClick={() => showTeacherProfile(row.original.id)}
                  className="cursor-pointer gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [showTeacherProfile],
  );

  const table = useReactTable({
    data: data?.teachers ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Teacher Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse teacher profiles on the platform.
          </p>
        </div>
      </div>

      {/* Search Panel */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 h-10 text-sm focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Table Data Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">
            Loading teacher directory...
          </span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-red-500">
          <ShieldAlert className="h-8 w-8" />
          <span className="text-xs font-semibold">
            Failed to fetch teacher directory
          </span>
        </div>
      ) : data?.teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-card">
          <UserCheck className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            No Teachers Found
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            No records matched your search.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
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
