export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'lvh.me';
export const API_PORT = process.env.NEXT_PUBLIC_API_PORT ?? '8000';
export const FE_PORT = process.env.NEXT_PUBLIC_FE_PORT ?? '3000';
// When set (e.g. '/api'), api is same-origin behind a reverse proxy — path-based routing.
// When empty (dev default), api lives on API_PORT — port-based routing.
export const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH ?? '';

function hostnameOnly(host: string): string {
  return host.split(':')[0] ?? host;
}

function clientProtocol(): 'http:' | 'https:' {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:' ? 'https:' : 'http:';
  }
  return process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
}

export function getApiBaseUrl(host?: string): string {
  const protocol = clientProtocol();
  const sourceHost =
    host ?? (typeof window !== 'undefined' ? window.location.host : APP_DOMAIN);
  const hostname = hostnameOnly(sourceHost);
  if (API_BASE_PATH) {
    return `${protocol}//${hostname}${API_BASE_PATH}`;
  }
  return `${protocol}//${hostname}:${API_PORT}`;
}

export function getApexUrl(path = '/'): string {
  return `${clientProtocol()}//${APP_DOMAIN}:${FE_PORT}${path}`;
}

export function getTenantUrl(subdomain: string, path = '/'): string {
  return `${clientProtocol()}//${subdomain}.${APP_DOMAIN}:${FE_PORT}${path}`;
}

export function parseHost(host: string): {
  subdomain: string | null;
  isApex: boolean;
} {
  const hostname = hostnameOnly(host);
  if (hostname === APP_DOMAIN) return { subdomain: null, isApex: true };
  const suffix = `.${APP_DOMAIN}`;
  if (hostname.endsWith(suffix)) {
    const sub = hostname.slice(0, -suffix.length);
    return sub
      ? { subdomain: sub, isApex: false }
      : { subdomain: null, isApex: true };
  }
  return { subdomain: null, isApex: false };
}
