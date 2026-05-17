'use client';

import { useRef } from 'react';

import { StatusPill } from '@/components/ui/status-pill';
import { REVEAL_VIEWPORT, fadeUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

type Milestone = {
  quarter: string;
  title: string;
  body: string;
  status: 'shipped' | 'in-progress' | 'coming-next' | 'planned';
  statusLabel: string;
};

const milestones: Milestone[] = [
  {
    quarter: 'Q4 2025',
    title: 'Foundation & design system',
    body: 'Monorepo, Next.js 15 + React 19 setup, shadcn-based design system, Docker dev environment.',
    status: 'shipped',
    statusLabel: 'Shipped',
  },
  {
    quarter: 'Q1 2026',
    title: 'Auth, multi-tenant, billing',
    body: 'Institute-level tenancy, role-based permissions, secure auth flows, Stripe-backed billing primitives.',
    status: 'shipped',
    statusLabel: 'Shipped',
  },
  {
    quarter: 'Q2 2026',
    title: 'Scheduling engine + admissions',
    body: 'Constraint solver for timetables, admissions pipeline, parent & student portals in private beta.',
    status: 'in-progress',
    statusLabel: 'In development',
  },
  {
    quarter: 'Q3 2026',
    title: 'Public launch',
    body: 'AI student insights, curriculum hub, integrations with major accounting & ERP systems. Waitlist invites go out.',
    status: 'coming-next',
    statusLabel: 'Launching',
  },
  {
    quarter: 'Q4 2026',
    title: 'Mobile apps & marketplace',
    body: 'Native iOS/Android, third-party plugin marketplace, advanced analytics.',
    status: 'planned',
    statusLabel: 'Planned',
  },
];

const statusIcon = {
  shipped: CheckCircle2,
  'in-progress': Loader2,
  'coming-next': Circle,
  planned: Circle,
} as const;

export function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 20%'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="relative py-24 sm:py-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        className="container mx-auto px-4"
      >
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <motion.p
            variants={fadeUp}
            className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
          >
            Roadmap
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl"
          >
            Building in public
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-balance text-muted-foreground"
          >
            We&apos;re shipping milestone-by-milestone. Here&apos;s what&apos;s
            already done, what&apos;s in flight, and what&apos;s next.
          </motion.p>
        </div>

        <div ref={ref} className="relative mx-auto max-w-3xl">
          {/* Static rail */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border/40 sm:left-1/2 sm:-translate-x-1/2" />
          {/* Animated rail fill */}
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute left-4 top-2 bottom-2 w-px origin-top bg-gradient-to-b from-primary via-primary/60 to-primary/10 sm:left-1/2 sm:-translate-x-1/2"
          />

          <ul className="space-y-10">
            {milestones.map((milestone, i) => (
              <MilestoneItem
                key={milestone.quarter}
                milestone={milestone}
                index={i}
              />
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

function MilestoneItem({
  milestone,
  index,
}: {
  milestone: Milestone;
  index: number;
}) {
  const Icon = statusIcon[milestone.status];
  const onLeft = index % 2 === 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-2 sm:gap-12"
    >
      {/* Node */}
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
          milestone.status === 'shipped' &&
            'border-emerald-400/60 text-emerald-300',
          milestone.status === 'in-progress' &&
            'border-amber-400/60 text-amber-300',
          milestone.status === 'coming-next' &&
            'border-primary/60 text-primary',
          milestone.status === 'planned' &&
            'border-border text-muted-foreground',
          'sm:absolute sm:left-1/2 sm:top-1 sm:-translate-x-1/2',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            milestone.status === 'in-progress' &&
              'animate-spin [animation-duration:3s]',
          )}
        />
      </span>

      <div
        className={cn(
          'rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur transition-colors hover:border-primary/30',
          'sm:col-span-1',
          onLeft ? 'sm:col-start-1 sm:text-right' : 'sm:col-start-2',
        )}
      >
        <div
          className={cn(
            'mb-2 flex items-center gap-2',
            onLeft && 'sm:justify-end',
          )}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {milestone.quarter}
          </span>
          <StatusPill status={milestone.status}>
            {milestone.statusLabel}
          </StatusPill>
        </div>
        <h3 className="text-lg font-semibold">{milestone.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {milestone.body}
        </p>
      </div>
    </motion.li>
  );
}
