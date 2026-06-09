import { FEATURES } from '../registry';
import { PermissionEntry, PermissionId } from '../types';

// All canonical permission ids in the registry — used by the database validator.
export const ALL_PERMISSION_IDS: ReadonlySet<PermissionId> = new Set(
  Object.values(FEATURES).flatMap((f) =>
    Object.values(f.permissions).map((p) => p.id),
  ),
);

// Reverse lookup for tooling, the role editor, and audit scripts.
export const ID_TO_ENTRY: ReadonlyMap<PermissionId, PermissionEntry> = new Map(
  Object.values(FEATURES).flatMap((f) =>
    Object.values(f.permissions).map(
      (p) => [p.id, p] as [PermissionId, PermissionEntry],
    ),
  ),
);

// Plain-string variant — safer than relying on the brand inside JS callers.
export function isValidPermissionId(value: string): boolean {
  return ALL_PERMISSION_IDS.has(value as PermissionId);
}
