'use client';

import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/lib/store';
import { toggleTheme } from '@/lib/store/slices/themeSlice';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function ThemeToggle({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme.mode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync DOM class + localStorage whenever Redux theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage disabled
    }
  }, [theme]);

  function handleToggle() {
    dispatch(toggleTheme());
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'dark'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-foreground/80 backdrop-blur transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && (
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
