import * as React from 'react';

import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const statusPillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap',
  {
    variants: {
      status: {
        shipped: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        'in-progress': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
        'coming-next': 'border-primary/30 bg-primary/10 text-primary',
        planned: 'border-border bg-muted/40 text-muted-foreground',
      },
    },
    defaultVariants: {
      status: 'coming-next',
    },
  },
);

const dotColor: Record<
  NonNullable<VariantProps<typeof statusPillVariants>['status']>,
  string
> = {
  shipped: 'bg-emerald-400',
  'in-progress': 'bg-amber-400 animate-pulse',
  'coming-next': 'bg-primary',
  planned: 'bg-muted-foreground',
};

function StatusPill({
  className,
  status = 'coming-next',
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof statusPillVariants>) {
  return (
    <span
      data-slot="status-pill"
      className={cn(statusPillVariants({ status }), className)}
      {...props}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          dotColor[status ?? 'coming-next'],
        )}
      />
      {children}
    </span>
  );
}

export { StatusPill };
