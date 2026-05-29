// Reserved subdomains for system
// These subdomains are reserved and cannot be used by tenants
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

/* CONDITIONS TO VALIDATE A NEW SUBDOMAIN
 * Only lowercase letters, numbers, and hyphens
 * Between 3 and 63 characters long
 * Cannot start or end with a hyphen
 */
export const SUBDOMAIN_REGEX = /^(?=[a-z0-9-]{3,63}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Cache TTL for tenant data (in milliseconds)
export const TENANT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms
