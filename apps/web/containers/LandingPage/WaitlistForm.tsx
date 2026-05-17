'use client';

import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Variant = 'hero' | 'cta';

export function WaitlistForm({
  variant = 'hero',
  className,
  buttonLabel = 'Join waitlist',
  placeholder = 'you@institute.edu',
}: {
  variant?: Variant;
  className?: string;
  buttonLabel?: string;
  placeholder?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    // Simulated submission. Backend wiring is out of scope for this design pass.
    await new Promise((r) => setTimeout(r, 700));
    setStatus('success');
  }

  const isCta = variant === 'cta';

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'flex items-center justify-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300',
          className,
        )}
      >
        <Check className="h-4 w-4" />
        You&apos;re on the list. We&apos;ll be in touch before launch.
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'mx-auto flex w-full flex-col gap-2 sm:flex-row',
        isCta ? 'max-w-md' : 'max-w-md',
        className,
      )}
    >
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        aria-label="Work email"
        className={cn(
          'h-12 flex-1 rounded-md text-base placeholder:text-muted-foreground/60',
          isCta
            ? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground'
            : 'border-border/60 bg-background/60 backdrop-blur',
        )}
      />
      <Button
        type="submit"
        size="lg"
        variant={isCta ? 'secondary' : 'default'}
        disabled={status === 'submitting'}
        className={cn(
          'h-12 px-6 text-sm font-semibold tracking-wide',
          !isCta &&
            'shadow-[0_0_24px_-4px] shadow-primary/40 hover:shadow-[0_0_32px_-2px] hover:shadow-primary/60',
        )}
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining…
          </>
        ) : (
          <>
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
