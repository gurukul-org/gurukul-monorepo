'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  useShowDeleteModal,
  useShowInviteMemberModal,
  useShowParentModal,
  useShowParentProfileModal,
} from '@/hooks/use-modal';
import {
  ParentListItem,
  useDeleteParent,
  useParents,
} from '@/services/api/requests/parents';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ParentsContainer() {
  const [search, setSearch] = useState('');
  const [filterNoStudents, setFilterNoStudents] = useState(false);

  const { data, isLoading, isError } = useParents({
    search: search || undefined,
    filterNoStudents: filterNoStudents || undefined,
  });

  const showParentModal = useShowParentModal();
  const showParentProfile = useShowParentProfileModal();
  const showDeleteModal = useShowDeleteModal();
  const showInviteMemberModal = useShowInviteMemberModal();
  const { mutateAsync: deleteParent } = useDeleteParent();

  const handleConfirmDelete = async (parent: ParentListItem) => {
    try {
      const res = await deleteParent(parent.id);
      toast.success(res.message || 'Parent record deleted successfully.');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to delete parent record.',
      );
    }
  };

  const columns = useMemo<ColumnDef<ParentListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Parent / Guardian',
        cell: ({ row }) => {
          const p = row.original;
          const initials = p.name
            ? p.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : p.emergencyPhone.slice(0, 2);
          return (
            <button
              type="button"
              onClick={() => showParentProfile(p.id)}
              className="flex items-center gap-3 text-left hover:opacity-85 focus:outline-none"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-semibold uppercase">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-primary hover:underline truncate max-w-[180px]">
                  {p.name ?? (
                    <span className="text-muted-foreground italic">
                      No portal account
                    </span>
                  )}
                </span>
                {p.email && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {p.email}
                  </span>
                )}
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: 'emergencyPhone',
        header: 'Emergency Phone',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {row.original.emergencyPhone}
          </span>
        ),
      },
      {
        accessorKey: 'studentCount',
        header: 'Linked Students',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {row.original.studentCount}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const parent = row.original;
          const hasLinkedKids = parent.studentCount > 0;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => showParentProfile(parent.id)}
                  >
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => showParentModal(parent)}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      showDeleteModal({
                        title: hasLinkedKids
                          ? 'Soft-delete Parent Profile'
                          : 'Delete Parent Profile',
                        subtitle: hasLinkedKids
                          ? `This parent has ${parent.studentCount} linked student record(s). Soft-deleting will preserve relationships and historical access logs.`
                          : 'Are you sure you want to permanently delete this parent profile?',
                        confirmButtonText: hasLinkedKids
                          ? 'Soft Delete'
                          : 'Delete Permanently',
                        onConfirm: () => handleConfirmDelete(parent),
                      })
                    }
                    className="text-red-600 focus:text-red-700"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.parents ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Parent & Guardian Records
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage contact information, emergency phone records, and family
            links.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => showInviteMemberModal('Parent')}
            className="h-10 gap-1.5 font-semibold"
          >
            <Mail className="h-4 w-4" /> Invite Parent
          </Button>
          <Button
            onClick={() => showParentModal(null)}
            className="h-10 gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" /> Create Parent
          </Button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card p-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-9 h-10 text-sm focus-visible:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="filterNoStudents"
            type="checkbox"
            checked={filterNoStudents}
            onChange={(e) => setFilterNoStudents(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="filterNoStudents"
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 select-none cursor-pointer"
          >
            Show parents with no linked students (Hygiene)
          </label>
        </div>
      </div>

      {/* Table Data Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">
            Loading parents record list...
          </span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-red-500">
          <ShieldAlert className="h-8 w-8" />
          <span className="text-xs font-semibold">
            Failed to fetch parent records
          </span>
        </div>
      ) : data?.parents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-card">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            No Parents Found
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            No records matched your search filters. Create a new record to get
            started.
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
