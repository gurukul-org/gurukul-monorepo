import type { Metadata } from 'next';
import { Oxanium } from 'next/font/google';

import { DocsHeader } from '@/components/DocsHeader';
import { Sidebar } from '@/components/Sidebar';
import { getNavigation } from '@/lib/docs';
import { cn } from '@/lib/utils';

import './globals.css';

const oxanium = Oxanium({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Docs | Gurukul',
  description: 'Documentation for Gurukul',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nav = getNavigation();

  return (
    <html
      lang="en"
      className={cn('font-sans', oxanium.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased selection:bg-primary/20">
        <div className="relative flex min-h-screen flex-col">
          <DocsHeader />
          <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
            <Sidebar nav={nav} />
            <main className="relative py-6 lg:gap-10 lg:py-8">
              <div className="mx-auto w-full min-w-0">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
