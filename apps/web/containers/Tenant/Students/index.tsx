'use client';

import { useMemo, useState } from 'react';

import { AccountStatusBadge } from '@/components/AccountStatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  useShowBulkImportModal,
  useShowDeleteModal,
  useShowInviteMemberModal,
  useShowStudentModal,
  useShowStudentProfileModal,
  useShowStudentStatusModal,
} from '@/hooks/use-modal';
import {
  StudentListItem,
  useDeleteStudent,
  useStudent,
  useStudents,
} from '@/services/api/requests/students';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  SUSPENDED: {
    label: 'Suspended',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  GRADUATED: {
    label: 'Graduated',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  INACTIVE: {
    label: 'Inactive',
    className:
      'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700',
  },
};

const STUDENT_STATUSES = ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'INACTIVE'];

// ---------------------------------------------------------------------------
// Row actions cell — separated so we can call hooks correctly
// ---------------------------------------------------------------------------

function StudentRowActions({ student }: { student: StudentListItem }) {
  const showStudentModal = useShowStudentModal();
  const showStudentStatusModal = useShowStudentStatusModal();
  const showDeleteModal = useShowDeleteModal();
  const { mutateAsync: deleteStudent } = useDeleteStudent();

  // Fetch full student detail lazily only when status modal is triggered
  const [fetchDetail, setFetchDetail] = useState(false);
  const { data: fullStudent } = useStudent(student.id, fetchDetail);

  const handleStatusChange = () => {
    setFetchDetail(true);
    // fullStudent may not be ready yet; the effect below will open the modal
  };

  // Open status modal once the full student data is available
  const [statusModalPending, setStatusModalPending] = useState(false);

  const handleStatusClick = () => {
    setStatusModalPending(true);
    setFetchDetail(true);
  };

  // Show the status modal as soon as fullStudent arrives
  if (statusModalPending && fullStudent) {
    setStatusModalPending(false);
    showStudentStatusModal(fullStudent);
  }

  return (
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
            onClick={() => showStudentModal(student)}
            className="cursor-pointer gap-2"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleStatusClick}
            className="cursor-pointer gap-2"
            disabled={student.status === 'GRADUATED'}
          >
            <UserCog className="h-3.5 w-3.5" />
            Change Status
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer gap-2"
            disabled={student.enrolmentCount > 0}
            onClick={() => {
              showDeleteModal({
                title: 'Delete Student',
                subtitle:
                  student.enrolmentCount > 0
                    ? 'This student has enrolment records and cannot be hard-deleted. Set status to INACTIVE instead.'
                    : `Permanently delete ${student.name ?? student.rollNumber}? This action cannot be undone.`,
                confirmButtonText: 'Delete Student',
                onConfirm: async () => {
                  await deleteStudent(student.id);
                  toast.success('Student deleted.');
                },
              });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main container
// ---------------------------------------------------------------------------

export default function TenantStudentsContainer() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
    [],
  );

  const statusOptions = useMemo(() => {
    return STUDENT_STATUSES.map((s) => ({
      value: s,
      label: s.charAt(0) + s.slice(1).toLowerCase(),
    }));
  }, []);

  const limitOptions = useMemo(() => {
    return [5, 10, 20, 50].map((size) => ({
      value: String(size),
      label: String(size),
    }));
  }, []);

  const showStudentModal = useShowStudentModal();
  const showInviteMemberModal = useShowInviteMemberModal();
  const showBulkImportModal = useShowBulkImportModal();

  const { data, isLoading, isError, refetch } = useStudents({
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    limit,
    cursor,
  });

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setCursorHistory((prev) => [...prev, cursor]);
      setCursor(data.nextCursor ?? undefined);
    }
  };

  const handlePrevPage = () => {
    const prev = [...cursorHistory];
    const previous = prev.pop();
    setCursorHistory(prev);
    setCursor(previous);
  };

  const handlePageSizeChange = (size: number) => {
    setLimit(size);
    setCursor(undefined);
    setCursorHistory([]);
  };

  // Reset pagination when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setCursor(undefined);
    setCursorHistory([]);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCursor(undefined);
    setCursorHistory([]);
  };

  const columns = useMemo<ColumnDef<StudentListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Student',
        cell: ({ row }) => {
          const s = row.original;
          const showProfile = useShowStudentProfileModal();
          const initials = s.name
            ? s.name
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : s.rollNumber.slice(0, 2).toUpperCase();
          return (
            <button
              type="button"
              onClick={() => showProfile(s.id)}
              className="flex items-center gap-3 text-left hover:opacity-80 focus:outline-none"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-semibold uppercase">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-primary hover:underline truncate max-w-[180px]">
                    {s.name ?? (
                      <span className="text-muted-foreground italic">
                        No portal account
                      </span>
                    )}
                  </span>
                  <AccountStatusBadge status={s.accountStatus} />
                </span>
                {s.email && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {s.email}
                  </span>
                )}
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: 'rollNumber',
        header: 'Roll No.',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {row.original.rollNumber}
          </span>
        ),
      },
      {
        accessorKey: 'admissionDate',
        header: 'Admitted',
        cell: ({ row }) => {
          const d = new Date(row.original.admissionDate);
          return (
            <span className="text-zinc-500 text-xs">
              {d.toLocaleDateString(undefined, {
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
          const badge =
            STATUS_BADGE[row.original.status] ?? STATUS_BADGE['INACTIVE']!;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${badge.className}`}
            >
              {badge.label}
            </span>
          );
        },
      },
      {
        id: 'counts',
        header: 'Enrolments / Parents',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span
                title="Enrolled classes"
                className="flex items-center gap-1"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                {s.enrolmentCount}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span title="Linked parents" className="flex items-center gap-1">
                👨‍👩‍👧 {s.parentCount}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => <StudentRowActions student={row.original} />,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.students ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Students
            </h1>
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student profiles, enrolments, and linked guardians.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => showBulkImportModal('student')}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => showInviteMemberModal('Student')}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Invite Student
          </Button>
          <Button onClick={() => showStudentModal(null)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or roll number..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <SearchableSelect
            value={statusFilter}
            onChange={handleStatusFilter}
            options={statusOptions}
            placeholder="All Statuses"
            className="h-9 min-w-36 py-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Rows per page:</span>
          <SearchableSelect
            value={String(limit)}
            onChange={(val: string) => handlePageSizeChange(Number(val))}
            options={limitOptions}
            placeholder="Select limit"
            className="h-9 w-20 py-1 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-950">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              Loading students...
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <span className="text-xs font-semibold">
              Failed to load students
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : data?.students.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                No students found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter
                  ? 'Try adjusting your search or filter.'
                  : 'Add your first student to get started.'}
              </p>
            </div>
            {!search && !statusFilter && (
              <Button
                size="sm"
                onClick={() => showStudentModal(null)}
                className="gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Student
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
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
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900"
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
              disabled={cursorHistory.length === 0}
              className="h-8 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!data.nextCursor}
              className="h-8 gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
