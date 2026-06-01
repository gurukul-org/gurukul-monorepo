import { type NextRequest, NextResponse } from 'next/server';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'lvh.me';

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0] ?? host;
  if (hostname === APP_DOMAIN) return null;
  const suffix = `.${APP_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  return sub || null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const subdomain = extractSubdomain(host);
  const { pathname, search } = request.nextUrl;

  // Block direct access to the internal /tenant/* tree from any host so URLs stay clean.
  if (pathname.startsWith('/tenant')) {
    if (subdomain) {
      const url = request.nextUrl.clone();
      url.pathname = '/tenant/not-found';
      return NextResponse.rewrite(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === '/' ? '/tenant/dashboard' : `/tenant${pathname}`;
    url.search = search;
    const res = NextResponse.rewrite(url);
    res.headers.set('x-tenant-subdomain', subdomain);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals, static assets, and the theme-init script.
    '/((?!_next/static|_next/image|favicon.ico|theme-init.js|.*\\..*).*)',
  ],
};
