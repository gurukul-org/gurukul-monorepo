import { headers } from 'next/headers';

import { getApiBaseUrl, parseHost } from '@/lib/env';
import 'server-only';

import { type ThemeConfig, normalizeTheme } from './theme-config';

/**
 * Server-side read of the current tenant's theme for no-flash injection.
 * Resolves the tenant from the incoming Host header (the API middleware maps
 * the subdomain to a tenant) via the public, unauthenticated theme endpoint.
 * Returns null on the apex domain (no tenant), when no theme is set, or on any
 * failure (e.g. the API being unreachable) — in which case the app falls back to
 * the static globals.css defaults and the theme still applies client-side.
 */
export async function getTenantThemeSSR(): Promise<ThemeConfig | null> {
  try {
    const host = (await headers()).get('host');
    if (!host) return null;

    // No tenant on the apex domain — skip the pointless round-trip.
    const { subdomain } = parseHost(host);
    if (!subdomain) return null;

    const res = await fetch(`${getApiBaseUrl(host)}/tenants/theme`, {
      // Small revalidate window: theme changes are also applied instantly on the
      // client after save, so this only affects other tabs/hard reloads.
      next: { revalidate: 30 },
      // Fail fast if the API is momentarily down; don't stall SSR.
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { theme?: unknown } | null;
    if (!data?.theme) return null;
    return normalizeTheme(data.theme);
  } catch {
    return null;
  }
}
