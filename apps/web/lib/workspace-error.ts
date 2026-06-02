export type WorkspaceErrorReason =
  | 'workspace-not-found'
  | 'workspace-unreachable';

export const WORKSPACE_ERROR_PARAM = 'error';
export const WORKSPACE_SUBDOMAIN_PARAM = 'subdomain';

export function isWorkspaceErrorReason(
  value: string | null,
): value is WorkspaceErrorReason {
  return value === 'workspace-not-found' || value === 'workspace-unreachable';
}

export function buildWorkspaceErrorUrl(
  baseUrl: string,
  reason: WorkspaceErrorReason,
  subdomain: string | null,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set(WORKSPACE_ERROR_PARAM, reason);
  if (subdomain) url.searchParams.set(WORKSPACE_SUBDOMAIN_PARAM, subdomain);
  return url.toString();
}

export function describeWorkspaceError(
  reason: WorkspaceErrorReason,
  subdomain: string | null,
): string {
  const label = subdomain ? `"${subdomain}"` : 'that workspace';
  if (reason === 'workspace-not-found') {
    return `Workspace ${label} doesn't exist. Try a different workspace URL.`;
  }
  return `Workspace ${label} is unreachable right now. Please try again.`;
}
