'use client';

import { useEffect, useState } from 'react';

import type { ParsedHeading } from '@/lib/docs';
import { cn } from '@/lib/utils';

interface TocProps {
  headings: ParsedHeading[];
}

export function TableOfContents({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-60px 0px -70% 0px', threshold: 0 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const tocHeadings = headings.filter((h) => h.level > 1);
  if (tocHeadings.length === 0) return null;

  return (
    <div className="hidden text-sm xl:block">
      <div className="sticky top-16 -mt-10 max-h-[calc(100vh-5rem)] overflow-y-auto pt-10">
        <h5 className="mb-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground">
          On this page
        </h5>
        <ul className="m-0 list-none font-medium">
          {tocHeadings.map((heading) => (
            <li
              key={heading.id}
              className={cn('mt-0 pt-2', heading.level === 3 && 'pl-4')}
            >
              <a
                href={`#${heading.id}`}
                className={cn(
                  'inline-block no-underline transition-colors hover:text-foreground',
                  activeId === heading.id
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground',
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
