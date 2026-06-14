'use client';

import * as React from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type SidepaneSize = 'sm' | 'md' | 'lg' | 'half' | 'full';

const SIZE_CLASSES: Record<SidepaneSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  half: 'sm:max-w-[50vw]',
  full: 'sm:max-w-full',
};

export interface SidepaneProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: SidepaneSize;
  side?: 'left' | 'right';
  className?: string;
}

export function Sidepane({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'half',
  side = 'right',
  className,
}: SidepaneProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col h-full w-full bg-card border-l shadow-xl p-6 gap-6 outline-none',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {(title || description) && (
          <SheetHeader className="space-y-1.5 pb-2 border-b flex-shrink-0">
            {title && (
              <SheetTitle className="text-lg font-semibold tracking-tight">
                {title}
              </SheetTitle>
            )}
            {description && (
              <SheetDescription className="text-sm text-muted-foreground">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
        )}
        <div className="flex-1 overflow-y-auto py-2 pr-1 -mr-1 text-sm leading-relaxed">
          {children}
        </div>
        {footer && (
          <SheetFooter className="pt-4 border-t flex-shrink-0 gap-2 sm:gap-0">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
