'use client';

import { cn } from '@/lib/utils';

interface RichTextRendererProps {
  content?: string | null;
  className?: string;
}

export function RichTextRenderer({
  content,
  className,
}: RichTextRendererProps) {
  if (!content) {
    return (
      <p className="text-zinc-400 dark:text-zinc-650 italic">
        No content provided.
      </p>
    );
  }

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-300',
        'prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50',
        'prose-p:leading-relaxed prose-strong:font-semibold',
        'prose-ul:list-disc prose-ol:list-decimal pl-0',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
