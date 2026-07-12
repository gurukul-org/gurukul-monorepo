// Shows where a member sits in the account lifecycle:
// PENDING (pre-created via import) -> INVITED (invite sent) -> ACTIVE (accepted).
// Shared by the student and parent grids.

const ACCOUNT_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending',
    className:
      'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  },
  INVITED: {
    label: 'Invited',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  ACTIVE: {
    label: 'Active',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  SUSPENDED: {
    label: 'Suspended',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  },
};

export function AccountStatusBadge({ status }: { status: string | null }) {
  // PENDING (pre-created, not yet invited) is intentionally not surfaced in the
  // table — only invited/active/etc. get a badge.
  if (!status || status === 'PENDING') return null;
  const cfg = ACCOUNT_STATUS_BADGE[status] ?? {
    label: status,
    className:
      'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
  };
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
