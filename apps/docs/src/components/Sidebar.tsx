'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { NavSection } from '@/lib/docs';
import { cn } from '@/lib/utils';

interface SidebarProps {
  nav: NavSection[];
}

export function Sidebar({ nav }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 border-r md:sticky md:block">
      <div className="h-full overflow-y-auto py-6 pl-8 pr-6 lg:py-8">
        <div className="w-full">
          {nav.map((section) => (
            <div key={section.slug} className="pb-8">
              <h4 className="mb-1 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.name}
              </h4>
              <div className="grid grid-flow-row auto-rows-max text-sm">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 hover:bg-muted hover:text-foreground',
                      pathname === item.href
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    {item.meta.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
