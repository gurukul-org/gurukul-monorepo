'use client';

import { useState } from 'react';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-50 overflow-hidden border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur"
        >
          <div className="container mx-auto flex items-center justify-center gap-3 px-4 py-2 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/60" />
            <p className="text-center">
              <span className="font-medium text-foreground">
                Launching Q3 2026.
              </span>{' '}
              Join the waitlist to lock in founding-member pricing.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Dismiss announcement"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
