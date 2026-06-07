import { PermissionEntry, PermissionId } from "../types";
import { FEATURES } from "../registry";

// Build the parent->descendants closure at module load.
// For each entry that declares `grants`, the parent's accepted set = { itself, every granted child }.
function computeExpansion(): Map<PermissionId, ReadonlySet<PermissionId>> {
  const result = new Map<PermissionId, Set<PermissionId>>();
  const allEntries: PermissionEntry[] = Object.values(FEATURES).flatMap((f) =>
    Object.values(f.permissions),
  );
  for (const entry of allEntries) {
    if (entry.grants && entry.grants.length > 0) {
      result.set(entry.id, new Set([entry.id, ...entry.grants]));
    }
  }
  return result as Map<PermissionId, ReadonlySet<PermissionId>>;
}
const EXPANSION = computeExpansion();

// Build the reverse map: for each permission id, which scope strings count as "having" it?
// A user has X if their scopes contain X itself OR any parent that grants X.
function computeAcceptedFor(): Map<PermissionId, ReadonlySet<PermissionId>> {
  const reverse = new Map<PermissionId, Set<PermissionId>>();

  // Every known id maps to at least itself.
  for (const feature of Object.values(FEATURES)) {
    for (const entry of Object.values(feature.permissions)) {
      reverse.set(entry.id, new Set([entry.id]));
    }
  }

  // Each parent gets added to every child's accepted set.
  for (const [parent, descendants] of EXPANSION.entries()) {
    for (const child of descendants) {
      const bucket = reverse.get(child) ?? new Set<PermissionId>([child]);
      bucket.add(parent);
      reverse.set(child, bucket);
    }
  }

  return reverse as Map<PermissionId, ReadonlySet<PermissionId>>;
}
const ACCEPTED_FOR = computeAcceptedFor();

// Returns the full set of permission ids the user effectively holds,
// given the raw scope array from their role.
export function expandScopes(
  userScopes: readonly string[],
): ReadonlySet<PermissionId> {
  const out = new Set<PermissionId>();
  for (const scope of userScopes) {
    const sid = scope as PermissionId;
    out.add(sid);
    const closure = EXPANSION.get(sid);
    if (closure) {
      for (const c of closure) out.add(c);
    }
  }
  return out;
}

// Check a single required permission against the user's scopes.
// Auto-expands: a user with `all-student` passes for any `student.*` check.
export function userHasPermission(
  userScopes: readonly string[],
  required: PermissionEntry | PermissionId | string,
): boolean {
  const targetId = (
    typeof required === "string" ? required : required.id
  ) as PermissionId;
  const accepted = ACCEPTED_FOR.get(targetId);
  if (!accepted) {
    // Unknown permission — literal match only.
    return userScopes.includes(targetId);
  }
  for (const scope of userScopes) {
    if (accepted.has(scope as PermissionId)) return true;
  }
  return false;
}

// OR semantics: passes if the user holds any one of the listed permissions.
export function userHasAnyPermission(
  userScopes: readonly string[],
  required: ReadonlyArray<PermissionEntry | PermissionId | string>,
): boolean {
  return required.some((r) => userHasPermission(userScopes, r));
}
