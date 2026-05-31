// Reserved subdomains for system use. These cannot be claimed by tenants.
export const RESERVED_SUBDOMAINS = new Set<string>([
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'ftp',
  'staging',
  'dev',
  'test',
  'status',
  'docs',
  'help',
  'support',
  'blog',
  'cdn',
  'static',
  'assets',
  'dashboard',
  'auth',
]);

/* Valid subdomain rules:
 *   only lowercase letters, digits, and hyphens
 *   3 to 63 characters
 *   cannot start or end with a hyphen
 */
export const SUBDOMAIN_REGEX = /^(?=[a-z0-9-]{3,63}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Cache TTL for resolved tenants (milliseconds).
export const TENANT_CACHE_TTL = 5 * 60 * 1000;
