import type { Metadata } from 'next';

import { fontVariables } from '@/lib/theme/fonts';
import { THEME_STYLE_ID, themeToCss } from '@/lib/theme/generate-theme-css';
import { getTenantThemeSSR } from '@/lib/theme/get-tenant-theme.server';
import { cn } from '@/lib/utils';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Gurukul',
  description: 'Welcome to Gurukul',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTenantThemeSSR();

  return (
    <html
      lang="en"
      className={cn('font-sans', fontVariables)}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
        {theme && (
          <style
            id={THEME_STYLE_ID}
            dangerouslySetInnerHTML={{ __html: themeToCss(theme) }}
          />
        )}
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
