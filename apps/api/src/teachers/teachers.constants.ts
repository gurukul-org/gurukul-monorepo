/**
 * Teacher (tenant membership) status values surfaced by the teacher directory.
 * Single source of truth for backend validation of the `status` filter and an
 * exportable reference for the frontend filter options.
 *
 * These mirror the TenantMembership.status lifecycle states that represent a
 * real teacher account; REMOVED / soft-deleted memberships are intentionally
 * excluded from the filterable set (the list query already drops deletedAt rows).
 */
export const TEACHER_STATUS = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type TeacherStatus =
  (typeof TEACHER_STATUS)[keyof typeof TEACHER_STATUS];

export const ALL_TEACHER_STATUSES = Object.values(TEACHER_STATUS);
