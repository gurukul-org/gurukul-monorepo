// Public surface of @repo/permissions.
// Both backend (NestJS) and frontend (Next.js bundler) consume this.

// Named type re-exports — the `id()` cast helper in ./types is intentionally NOT
// re-exported here. Keeping it module-internal preserves the PermissionId brand at the
// package boundary: consumers can only obtain a PermissionId via PERMS.*.id or ID_TO_ENTRY.
export type {
  PermissionId,
  FeatureKey,
  EditorCategory,
  IconName,
  PermissionKind,
  PermissionEntry,
  FeatureDefinition,
  DefaultRoleDefinition,
} from "./types";

export { FEATURES, PERMS } from "./registry";
export type { Perms } from "./registry";

export {
  expandScopes,
  userHasPermission,
  userHasAnyPermission,
} from "./helpers/expand";

export {
  ALL_PERMISSION_IDS,
  ID_TO_ENTRY,
  isValidPermissionId,
} from "./helpers/lookup";

export { getViewScope, getViewScopeEntities } from "./helpers/viewScope";
export type { ViewScope } from "./helpers/viewScope";

export {
  featuresByEditorCategory,
  applyDependencies,
  DEPENDENCIES,
} from "./helpers/categorize";
export type { PermissionDependency } from "./helpers/categorize";

export {
  owner,
  branchManager,
  academicDirector,
  hod,
  administrativeOfficer,
  faculty,
  staff,
  studentRole,
  parentRole,
  DEFAULT_ROLES,
} from "./defaultRoles";
