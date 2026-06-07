import { PermissionEntry, PermissionId } from "../types";
import { FEATURES } from "../registry";
import { userHasPermission } from "./expand";

// View-scope tri-state: 'all' (no filter), 'own' (filter to user's items), 'none' (no access).
// Controllers branch on this to do row-level filtering without re-implementing scope checks.
export type ViewScope = "all" | "own" | "none";

// Auto-derive the (all, own) view pair for every ownership-aware feature at module load.
interface ViewPair {
  readonly all: PermissionEntry;
  readonly own: PermissionEntry;
}
function computeViewPairs(): Map<string, ViewPair> {
  const pairs = new Map<string, ViewPair>();
  for (const feature of Object.values(FEATURES)) {
    let allEntry: PermissionEntry | undefined;
    let ownEntry: PermissionEntry | undefined;
    let entity: string | undefined;
    for (const entry of Object.values(feature.permissions)) {
      if (!entry.ownership || !entry.ownershipFor) continue;
      if (entity && entity !== entry.ownershipFor) {
        throw new Error(
          `Feature '${feature.key}' has conflicting ownershipFor values: '${entity}' vs '${entry.ownershipFor}'.`,
        );
      }
      entity = entry.ownershipFor;
      if (entry.ownership === "all") allEntry = entry;
      if (entry.ownership === "own") ownEntry = entry;
    }
    if (entity && allEntry && ownEntry) {
      pairs.set(entity, { all: allEntry, own: ownEntry });
    }
  }
  return pairs;
}
const VIEW_PAIRS = computeViewPairs();

// Resolve the effective view scope for an entity given the user's scopes.
// Admin always returns 'all'. Holding the feature's all-* (which grants the
// view entries) also returns 'all' because userHasPermission expands it.
export function getViewScope(
  userScopes: readonly string[],
  entity: string,
  options: { isAdmin?: boolean } = {},
): ViewScope {
  if (options.isAdmin) return "all";
  const pair = VIEW_PAIRS.get(entity);
  if (!pair) return "none";
  if (userHasPermission(userScopes, pair.all)) return "all";
  if (userHasPermission(userScopes, pair.own)) return "own";
  return "none";
}

// Exposed mostly for tests/debug — list the entities for which view-scope is defined.
export function getViewScopeEntities(): readonly string[] {
  return Array.from(VIEW_PAIRS.keys()).sort();
}

export type { PermissionId };
