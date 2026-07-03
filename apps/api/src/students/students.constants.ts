/**
 * Student status values.
 * Used as the single source of truth on both backend validation and
 * as an exportable reference for the frontend.
 */
export const STUDENT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  GRADUATED: 'GRADUATED',
  INACTIVE: 'INACTIVE',
} as const;

/**
 * Roll-number rules shared by single-create validation (DTO) and the CSV
 * bulk-import path so the two can never drift apart.
 */
export const ROLL_NUMBER_REGEX = /^[a-zA-Z0-9\-]+$/;
export const ROLL_NUMBER_MAX_LENGTH = 50;

export type StudentStatus =
  (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

export const ALL_STUDENT_STATUSES = Object.values(STUDENT_STATUS);

/**
 * Defines which statuses a student can move TO from a given current status.
 * GRADUATED is terminal — no outbound transitions.
 * INACTIVE can be reversed to ACTIVE.
 */
export const STUDENT_STATUS_TRANSITIONS: Record<
  StudentStatus,
  StudentStatus[]
> = {
  [STUDENT_STATUS.ACTIVE]: [
    STUDENT_STATUS.SUSPENDED,
    STUDENT_STATUS.GRADUATED,
    STUDENT_STATUS.INACTIVE,
  ],
  [STUDENT_STATUS.SUSPENDED]: [STUDENT_STATUS.ACTIVE, STUDENT_STATUS.INACTIVE],
  [STUDENT_STATUS.INACTIVE]: [STUDENT_STATUS.ACTIVE],
  [STUDENT_STATUS.GRADUATED]: [], // terminal
};
