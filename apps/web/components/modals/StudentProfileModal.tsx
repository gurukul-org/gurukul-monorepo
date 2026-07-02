'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useHideModal,
  useShowDeleteModal,
  useShowEditParentLinkModal,
  useShowLinkParentModal,
} from '@/hooks/use-modal';
import { usePermission } from '@/hooks/use-permission';
import {
  useCreateEnrolment,
  useUpdateEnrolmentStatus,
  useWithdrawEnrolment,
} from '@/services/api/requests/enrolments';
import { useStudent, useUnlinkParent } from '@/services/api/requests/students';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { PERMS } from '@repo/permissions';

interface StudentProfileModalProps {
  studentId: string;
}

type TabKey = 'overview' | 'enrolments' | 'parents' | 'audit';

const STATUS_PILL: Record<
  string,
  { dot: string; pill: string; label: string }
> = {
  ACTIVE: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    label: 'Active',
  },
  SUSPENDED: {
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    label: 'Suspended',
  },
  GRADUATED: {
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    label: 'Graduated',
  },
  INACTIVE: {
    dot: 'bg-zinc-500',
    pill: 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700',
    label: 'Inactive',
  },
};

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  });
}

export function StudentProfileModal({ studentId }: StudentProfileModalProps) {
  const hideModal = useHideModal();
  const [tab, setTab] = useState<TabKey>('overview');

  const { data: student, isLoading, isError } = useStudent(studentId);

  const { hasPermission } = usePermission();
  const showDeleteModal = useShowDeleteModal();
  const showLinkParentModal = useShowLinkParentModal();
  const showEditParentLinkModal = useShowEditParentLinkModal();
  const { mutateAsync: withdraw } = useWithdrawEnrolment();
  const { mutateAsync: updateStatus } = useUpdateEnrolmentStatus();
  const { mutateAsync: enrolStudent } = useCreateEnrolment();
  const { mutateAsync: unlinkParent } = useUnlinkParent();

  const handleUnlinkParent = (parentId: string, parentName: string) => {
    showDeleteModal({
      title: 'Unlink Parent / Guardian',
      subtitle: `Are you sure you want to unlink ${parentName} from this student? This operation will write an audit log.`,
      confirmButtonText: 'Unlink Parent',
      onConfirm: async () => {
        try {
          await unlinkParent({ studentId, parentId });
          toast.success('Parent unlinked successfully!');
        } catch (err) {
          toast.error('Failed to unlink parent.');
        }
      },
    });
  };

  const handleWithdrawEnrolment = (
    enrolmentId: string,
    studentName: string,
  ) => {
    showDeleteModal({
      title: 'Withdraw Student',
      subtitle: `Are you sure you want to withdraw ${studentName} from this class? You can optionally provide a reason.`,
      confirmButtonText: 'Withdraw Student',
      onConfirm: async () => {
        const reason = window.prompt('Enter reason for withdrawal (optional):');
        if (reason === null) return;
        try {
          await withdraw({
            id: enrolmentId,
            withdrawReason: reason || undefined,
          });
          toast.success('Student withdrawn successfully.');
        } catch (err: any) {
          toast.error(
            err.response?.data?.message || 'Failed to withdraw student.',
          );
        }
      },
    });
  };

  const handleCompleteEnrolment = async (enrolmentId: string) => {
    try {
      await updateStatus({
        id: enrolmentId,
        dto: { status: 'COMPLETED' },
      });
      toast.success('Enrollment marked as completed.');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to complete enrolment.',
      );
    }
  };

  const handleReEnrolStudent = async (
    classId: string,
    studentProfileId: string,
  ) => {
    try {
      await enrolStudent({
        studentProfileId,
        classId,
        enrolledAt: new Date().toISOString(),
      });
      toast.success('Student re-enrolled successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to re-enrol student.');
    }
  };

  const statusStyle = (
    student
      ? (STATUS_PILL[student.status] ?? STATUS_PILL.INACTIVE)
      : STATUS_PILL.INACTIVE
  ) as { dot: string; pill: string; label: string };

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
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Student Profile Detail
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View student profile, parents, enrolments, and audit history.
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
              Loading student details...
            </span>
          </div>
        ) : isError || !student ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <span className="text-xs font-semibold">
              Failed to load student details
            </span>
          </div>
        ) : (
          <div className="px-6 pb-6">
            {/* Quick Profile Summary Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/55 p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold uppercase">
                  {student.name
                    ? student.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : student.rollNumber.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {student.name ?? (
                      <span className="text-muted-foreground italic">
                        No Portal Account
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Roll No:{' '}
                    <span className="font-mono font-medium">
                      {student.rollNumber}
                    </span>
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase border ${statusStyle.pill}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                />
                {statusStyle.label}
              </span>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6 gap-6">
              {(
                [
                  { key: 'overview', label: 'Overview' },
                  { key: 'enrolments', label: 'Enrolments' },
                  { key: 'parents', label: 'Parents / Guardians' },
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
            <div className="space-y-4 min-h-[220px]">
              {tab === 'overview' && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Student Name
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {student.name ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email address
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {student.email ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Admission Date
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {formatDate(student.admissionDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Portal Membership ID
                    </span>
                    <p
                      className="text-sm font-mono text-zinc-800 dark:text-zinc-200 truncate"
                      title={student.membershipId ?? ''}
                    >
                      {student.membershipId ?? 'Unlinked'}
                    </p>
                  </div>
                </div>
              )}

              {tab === 'enrolments' && (
                <div className="space-y-3">
                  {student.enrolments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/40 mb-1" />
                      <p className="text-xs font-medium text-zinc-500">
                        No enrolments recorded.
                      </p>
                    </div>
                  ) : (
                    student.enrolments.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/20"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {e.class.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {e.class.program?.name || 'No Program'} ·{' '}
                            {e.class.academicTerm?.name || 'No Term'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right space-y-1">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase ${
                                e.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                                  : e.status === 'WITHDRAWN'
                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:border-red-800'
                                    : e.status === 'COMPLETED'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                                      : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900'
                              }`}
                            >
                              {e.status}
                            </span>
                            <p className="text-[9px] text-muted-foreground">
                              Enrolled: {formatDate(e.enrolledAt)}
                            </p>
                          </div>

                          {/* Quick Enrolment Actions */}
                          {e.status === 'ACTIVE' && (
                            <div className="flex gap-1.5 shrink-0">
                              {hasPermission(PERMS.enrolment.edit) && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteEnrolment(e.id)}
                                  title="Mark Complete"
                                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-600 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {hasPermission(PERMS.enrolment.delete) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleWithdrawEnrolment(
                                      e.id,
                                      student.name ?? student.rollNumber,
                                    )
                                  }
                                  title="Withdraw"
                                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {e.status === 'WITHDRAWN' &&
                            hasPermission(PERMS.enrolment.create) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleReEnrolStudent(e.class.id, student.id)
                                }
                                title="Re-enrol Student"
                                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-primary border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors flex items-center gap-1 text-[10px] font-bold shrink-0"
                              >
                                <RefreshCw className="h-3.5 w-3.5" /> Re-enrol
                              </button>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'parents' && (
                <div className="space-y-4">
                  {/* Header with link button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Parents & Guardians
                    </h3>
                    {hasPermission(PERMS.student.linkParent) && (
                      <button
                        type="button"
                        onClick={() => showLinkParentModal(student.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                      >
                        <UserPlus className="h-3 w-3" /> Link Parent
                      </button>
                    )}
                  </div>

                  {/* Warning banner for zero parents */}
                  {student.parents.length === 0 && (
                    <div className="flex gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg text-xs items-start">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[11px]">
                          No Linked Parents/Guardians
                        </p>
                        <p className="mt-0.5 text-[10px] opacity-90">
                          This student profile does not have any linked parents
                          or guardians. Please link at least one parent or
                          guardian for communication and portal access.
                        </p>
                      </div>
                    </div>
                  )}

                  {student.parents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <Users className="h-8 w-8 text-muted-foreground/40 mb-1" />
                      <p className="text-xs font-medium text-zinc-500">
                        No linked parents/guardians.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {student.parents.map((p) => (
                        <div
                          key={p.parentProfileId}
                          className="p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/20 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {p.parentName ?? 'Unnamed Parent'}
                              </h4>
                              {p.relationshipDescription && (
                                <p className="text-[10px] text-muted-foreground italic">
                                  {p.relationshipDescription}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase">
                                {p.relationship}
                              </span>

                              {/* Edit / Unlink parent link actions */}
                              <div className="flex gap-1 shrink-0 ml-1">
                                {hasPermission(
                                  PERMS.student.editParentLink,
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      showEditParentLinkModal(
                                        student.id,
                                        p.parentProfileId,
                                        p.relationship,
                                        p.relationshipDescription,
                                      )
                                    }
                                    title="Edit Link"
                                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {hasPermission(PERMS.student.unlinkParent) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUnlinkParent(
                                        p.parentProfileId,
                                        p.parentName ?? 'this parent',
                                      )
                                    }
                                    title="Unlink Parent"
                                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1 border-t border-zinc-50 dark:border-zinc-900">
                            {p.parentEmail && (
                              <div>
                                Email:{' '}
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                  {p.parentEmail}
                                </span>
                              </div>
                            )}
                            {p.emergencyPhone && (
                              <div>
                                Emergency Phone:{' '}
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                  {p.emergencyPhone}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
                        {student.audit.createdBy?.name || 'System / Seed'}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground text-[9px]">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(student.audit.createdAt, true)}
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/25">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[10px] uppercase">
                        <User className="h-3 w-3" />
                        Last Updated By
                      </div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {student.audit.updatedBy?.name || 'System / Seed'}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground text-[9px]">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(student.audit.updatedAt, true)}
                      </div>
                    </div>
                  </div>
                  {student.audit.deletedAt && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3.5 border border-red-200 dark:border-red-900/40 text-[11px] text-red-800 dark:text-red-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      Student profile soft-deleted (status INACTIVE) on{' '}
                      {formatDate(student.audit.deletedAt, true)}.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
