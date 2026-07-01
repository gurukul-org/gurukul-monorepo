'use client';

import { type ReactNode, useState } from 'react';

import { PermissionGate } from '@/components/permission-gate';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useHideModal,
  useShowChangeRoleModal,
  useShowModal,
  useShowSuspendMemberModal,
} from '@/hooks/use-modal';
import { useAuthUser } from '@/lib/store/auth';
import { ModalType } from '@/lib/store/types/modal';
import {
  type MemberDetail,
  useReactivateMember,
  useTenantMember,
} from '@/services/api/requests/users';
import {
  Activity,
  Calendar,
  Clock,
  Crown,
  LayoutGrid,
  Loader2,
  Lock,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundCog,
  Users2,
  X,
} from 'lucide-react';

import { PERMS } from '@repo/permissions';

interface MemberProfileModalProps {
  membershipId: string;
}

type TabKey = 'overview' | 'activity' | 'security';

const STATUS_PILL: Record<string, { dot: string; pill: string }> = {
  ACTIVE: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  INVITED: {
    dot: 'bg-sky-500',
    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  },
  SUSPENDED: {
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  REMOVED: {
    dot: 'bg-red-500',
    pill: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
};

const FALLBACK_PILL = STATUS_PILL.REMOVED as { dot: string; pill: string };

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actorName(actor: MemberDetail['updatedBy']) {
  return actor ? `${actor.firstName} ${actor.lastName}` : '—';
}

export function MemberProfileModal({ membershipId }: MemberProfileModalProps) {
  const hideModal = useHideModal();
  const showModal = useShowModal();
  const showChangeRole = useShowChangeRoleModal();
  const showSuspend = useShowSuspendMemberModal();
  const authUser = useAuthUser();

  const [tab, setTab] = useState<TabKey>('overview');

  const { data: member, isLoading, isError } = useTenantMember(membershipId);
  const { mutateAsync: reactivate, isPending: isReactivating } =
    useReactivateMember();

  const isSelf = authUser?.membershipId === membershipId;
  const fullName = member ? `${member.firstName} ${member.lastName}` : '';
  const initials = member
    ? `${member.firstName?.charAt(0) ?? ''}${member.lastName?.charAt(0) ?? ''}`.toUpperCase() ||
      'U'
    : '';
  const isOwnerLike = !!member && (member.isFounder || member.isAdmin);

  // Destructive actions are blocked for yourself, the owner, and admins —
  // mirrors the backend privilege guard so the UI never offers a no-op.
  const canMutateTarget =
    !!member && !isSelf && !member.isFounder && !member.isAdmin;

  // Primary role = the highest-privilege (lowest rank) assigned role.
  const sortedRoles = member
    ? [...member.roles].sort((a, b) => a.rank - b.rank)
    : [];
  const primaryRole = sortedRoles[0];

  const status = member?.status ?? 'ACTIVE';
  const statusStyle = STATUS_PILL[status] ?? FALLBACK_PILL;

  return (
    <Dialog open onOpenChange={(open) => !open && hideModal()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto bg-card p-0 sm:max-w-[1040px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Member Profile
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View and manage member details and permissions
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 p-1.5 text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-24">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : isError || !member ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-red-500">
            <ShieldAlert className="h-7 w-7" />
            <span className="text-sm font-medium">
              Failed to load this member.
            </span>
          </div>
        ) : (
          <div className="grid gap-6 px-6 pb-6 md:grid-cols-[300px_1fr]">
            {/* ---------------- LEFT CARD ---------------- */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              {/* Banner + avatar */}
              <div className="relative">
                <div className="h-24 bg-gradient-to-b from-primary/20 to-primary/5" />
                <div className="absolute inset-x-0 top-12 flex justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary/25 text-2xl font-bold uppercase text-primary shadow-sm">
                    {initials}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-5 pb-5 pt-14 text-center">
                {/* Name + You */}
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {fullName}
                  </h3>
                  {isSelf && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      You
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {member.email}
                </p>

                {/* Status pill */}
                <div className="mt-3 flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusStyle.pill}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                    />
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Primary role card */}
                {primaryRole && (
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left dark:border-zinc-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-950/40">
                      <Crown className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Primary Role
                      </p>
                      <p className="truncate text-sm font-semibold text-primary">
                        {primaryRole.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {isOwnerLike
                          ? 'Full access to all features and settings'
                          : 'Role-based workspace access'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Assigned roles */}
                <div className="mt-5 text-left">
                  <p className="border-b border-zinc-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-900">
                    Assigned Roles ({member.roles.length})
                  </p>
                  <div className="mt-2 space-y-1">
                    {member.roles.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No roles assigned
                      </span>
                    ) : (
                      sortedRoles.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2.5 py-1.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-800">
                            {r.id === primaryRole?.id ? (
                              <Crown className="h-3.5 w-3.5" />
                            ) : (
                              <UserRound className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <span className="flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {r.name}
                          </span>
                          {r.id === primaryRole?.id && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Primary
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- RIGHT COLUMN ---------------- */}
            <div className="flex flex-col">
              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
                <TabButton
                  active={tab === 'overview'}
                  onClick={() => setTab('overview')}
                  icon={<LayoutGrid className="h-4 w-4" />}
                  label="Overview"
                />
                <TabButton
                  active={tab === 'activity'}
                  onClick={() => setTab('activity')}
                  icon={<Activity className="h-4 w-4" />}
                  label="Activity"
                />
                <TabButton
                  active={tab === 'security'}
                  onClick={() => setTab('security')}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Security"
                />
              </div>

              {tab === 'overview' && (
                <div className="space-y-6 pt-6">
                  {/* Member information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Member Information
                    </h4>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                      <InfoItem
                        icon={<Calendar className="h-4 w-4" />}
                        label="Member Since"
                        value={formatDate(member.joinedAt ?? member.createdAt)}
                      />
                      <InfoItem
                        icon={<UserRound className="h-4 w-4" />}
                        label="Invited By"
                        value={actorName(member.invitedBy)}
                      />
                      <InfoItem
                        icon={<UserRound className="h-4 w-4" />}
                        label="Last Updated By"
                        value={actorName(member.updatedBy)}
                      />
                      <InfoItem
                        icon={<Clock className="h-4 w-4" />}
                        label="Last Updated At"
                        value={formatDate(member.updatedAt)}
                      />
                    </div>
                  </div>

                  {/* Owner privileges banner */}
                  {isOwnerLike && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        This member has owner privileges and can manage all
                        aspects of the workspace.
                      </p>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <PermissionGate permission={PERMS.user.edit}>
                        <ActionButton
                          icon={<UserRoundCog className="h-4 w-4" />}
                          label="Change Role"
                          disabled={!canMutateTarget}
                          onClick={() =>
                            showChangeRole({
                              membershipId,
                              currentRoleIds: member.roles.map((r) => r.id),
                              userFullName: fullName,
                            })
                          }
                        />
                      </PermissionGate>

                      <PermissionGate permission={PERMS.user.suspend}>
                        {status === 'SUSPENDED' ? (
                          <ActionButton
                            icon={<PlayCircle className="h-4 w-4" />}
                            label="Reactivate Access"
                            tone="emerald"
                            disabled={!canMutateTarget || isReactivating}
                            onClick={async () => {
                              await reactivate(membershipId);
                              hideModal();
                            }}
                          />
                        ) : (
                          <ActionButton
                            icon={<PauseCircle className="h-4 w-4" />}
                            label="Suspend Access"
                            tone="amber"
                            disabled={!canMutateTarget || status !== 'ACTIVE'}
                            onClick={() => showSuspend(membershipId, fullName)}
                          />
                        )}
                      </PermissionGate>

                      <PermissionGate permission={PERMS.user.delete}>
                        <ActionButton
                          icon={<Trash2 className="h-4 w-4" />}
                          label="Remove Member"
                          tone="red"
                          disabled={!canMutateTarget}
                          onClick={() =>
                            showModal(ModalType.RevokeAccessModal, {
                              membershipId,
                              userFullName: fullName,
                            })
                          }
                        />
                      </PermissionGate>
                    </div>
                  </div>

                  {/* Owner permissions card */}
                  {isOwnerLike && (
                    <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          Owner Permissions
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          As an owner, this member has full control over the
                          workspace, including billing, member management, and
                          security settings.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'activity' && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Activity className="h-7 w-7 text-muted-foreground/60" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Last updated {formatDate(member.updatedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.updatedBy
                      ? `Most recent change by ${actorName(member.updatedBy)}.`
                      : 'No changes have been recorded for this member yet.'}
                  </p>
                </div>
              )}

              {tab === 'security' && (
                <div className="space-y-4 pt-6">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Access &amp; Security
                  </h4>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <InfoItem
                      icon={<ShieldCheck className="h-4 w-4" />}
                      label="Account Status"
                      value={status.charAt(0) + status.slice(1).toLowerCase()}
                    />
                    <InfoItem
                      icon={<Lock className="h-4 w-4" />}
                      label="Privilege Level"
                      value={isOwnerLike ? 'Administrator' : 'Standard member'}
                    />
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-muted-foreground dark:bg-zinc-900">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

const ACTION_TONE: Record<string, string> = {
  neutral:
    'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900',
  amber:
    'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30',
  red: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30',
  emerald:
    'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30',
};

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'amber' | 'red' | 'emerald';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 ${ACTION_TONE[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}
