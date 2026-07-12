/** Roles supported by the CSV bulk-import feature. */
export type ImportRole = 'student' | 'parent';

/** BullMQ queue + job that process member CSV imports in the background. */
export const MEMBER_IMPORT_QUEUE = 'member-import';
export const MEMBER_IMPORT_JOB = 'import-members';

/** Upper bound on rows accepted in a single import. */
export const MEMBER_IMPORT_MAX_ROWS = 500;

/** Max multipart upload size (2 MB — well above a 500-row CSV). */
export const MEMBER_IMPORT_MAX_BYTES = 2 * 1024 * 1024;

/** Payload enqueued by a bulk-import endpoint. */
export interface MemberImportJobData {
  role: ImportRole;
  tenantId: string;
  userId: string;
  csvContent: string;
  scopes: string[];
  isAdmin: boolean;
}

/** A row that could not be imported, with its source line and reason. */
export interface MemberImportSkip {
  row: number; // 1-based line number in the file (header is line 1)
  email: string | null;
  reason: string;
}

/** Outcome of a bulk import. */
export interface MemberImportResult {
  totalRows: number; // data rows found (excludes the header)
  created: number;
  skipped: MemberImportSkip[];
}
