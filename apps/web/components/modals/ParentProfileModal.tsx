'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useHideModal } from '@/hooks/use-modal';
import { useParentDetail } from '@/services/api/requests/parents';
import {
  Clock,
  GraduationCap,
  Loader2,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';

interface ParentProfileModalProps {
  parentId: string;
}

type TabKey = 'overview' | 'students' | 'audit';

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  });
}

export function ParentProfileModal({ parentId }: ParentProfileModalProps) {
  const hideModal = useHideModal();
  const [tab, setTab] = useState<TabKey>('overview');

  const { data: parent, isLoading, isError } = useParentDetail(parentId);

  return (
    <Dialog open onOpenChange={(open) => !open && hideModal()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto bg-card p-0 sm:max-w-[720px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Parent Profile Detail
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View parent profile details, linked students, and audit history.
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 p-1.5 text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              Loading parent details...
            </span>
          </div>
        ) : isError || !parent ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <span className="text-xs font-semibold">
              Failed to load parent details
            </span>
          </div>
        ) : (
          <div className="px-6 pb-6">
            {/* Quick Profile Summary Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/55 p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold uppercase">
                  {parent.name
                    ? parent.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : parent.emergencyPhone.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {parent.name ?? (
                      <span className="text-muted-foreground italic">
                        No Linked Portal Account
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Emergency Phone:{' '}
                    <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {parent.emergencyPhone}
                    </span>
                  </p>
                </div>
              </div>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {parent.students.length} Linked Student(s)
              </span>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6 gap-6">
              {(
                [
                  { key: 'overview', label: 'Overview' },
                  { key: 'students', label: 'Linked Students' },
                  { key: 'audit', label: 'Audit Trail' },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`pb-3 text-xs font-semibold transition-all border-b-2 -mb-[2px] ${
                    tab === t.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            <div className="space-y-4 min-h-[200px]">
              {tab === 'overview' && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Parent Name
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {parent.name ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {parent.email ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Emergency Phone
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                      {parent.emergencyPhone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Portal Membership ID
                    </span>
                    <p
                      className="text-sm font-mono text-zinc-800 dark:text-zinc-200 truncate"
                      title={parent.membershipId ?? ''}
                    >
                      {parent.membershipId ?? 'Unlinked'}
                    </p>
                  </div>
                </div>
              )}

              {tab === 'students' && (
                <div className="space-y-3">
                  {parent.students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/40 mb-1" />
                      <p className="text-xs font-medium text-zinc-500">
                        No linked students found.
                      </p>
                    </div>
                  ) : (
                    parent.students.map((s) => (
                      <div
                        key={s.studentProfileId}
                        className="flex items-center justify-between p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/20"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {s.studentName ?? 'Unnamed Student'}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            Roll No:{' '}
                            <span className="font-mono">{s.rollNumber}</span> ·{' '}
                            {s.studentEmail || 'No Email'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 uppercase">
                            {s.relationship}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'audit' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/25">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[10px] uppercase">
                        <User className="h-3 w-3" />
                        Created By
                      </div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {parent.audit.createdBy?.name || 'System / Seed'}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground text-[9px]">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(parent.audit.createdAt, true)}
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/25">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[10px] uppercase">
                        <User className="h-3 w-3" />
                        Last Updated By
                      </div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {parent.audit.updatedBy?.name || 'System / Seed'}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground text-[9px]">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(parent.audit.updatedAt, true)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
