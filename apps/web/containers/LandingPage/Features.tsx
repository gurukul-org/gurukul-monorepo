'use client';

import { useRef } from 'react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { REVEAL_VIEWPORT, fadeUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  BrainCircuit,
  CalendarSync,
  CheckCircle2,
  LineChart,
  type LucideIcon,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

type FeatureStatus = 'shipped' | 'in-progress' | 'coming-next' | 'planned';

const features: {
  title: string;
  description: string;
  icon: LucideIcon;
  status: FeatureStatus;
  statusLabel: string;
}[] = [
  {
    title: 'AI-Powered Scheduling',
    description:
      'Generate conflict-free timetables for thousands of students and staff in seconds.',
    icon: CalendarSync,
    status: 'in-progress',
    statusLabel: 'In development',
  },
  {
    title: 'Smart Student Insights',
    description:
      'Predictive analytics to identify students who need support before grades drop.',
    icon: BrainCircuit,
    status: 'coming-next',
    statusLabel: 'Coming next',
  },
  {
    title: 'Automated Admissions',
    description:
      'Streamline the entire enrollment pipeline from inquiry to fee collection.',
    icon: Users,
    status: 'coming-next',
    statusLabel: 'Coming next',
  },
  {
    title: 'Curriculum Management',
    description:
      'Centralized hub for syllabus planning, resource distribution, and progress tracking.',
    icon: BookOpen,
    status: 'planned',
    statusLabel: 'Planned',
  },
];

type Frame = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: { icon: LucideIcon; label: string; metric: string }[];
};

const frames: Frame[] = [
  {
    eyebrow: 'Operations',
    title: 'Timetables that build themselves',
    body: 'Drop in your constraints — rooms, teachers, electives, breaks. Gurukul resolves thousands of variables and gives you a publishable schedule in seconds.',
    bullets: [
      'Multi-campus, multi-stream',
      'Substitution & leave handling',
      'One-click exports to staff & parents',
    ],
    visual: [
      {
        icon: CalendarSync,
        label: 'Schedules generated',
        metric: '3,400+/day',
      },
      { icon: CheckCircle2, label: 'Conflicts resolved', metric: '99.7%' },
    ],
  },
  {
    eyebrow: 'Student success',
    title: 'See struggling students before grades slip',
    body: 'Attendance, scores, engagement, and submission patterns flow into one model. You get a ranked at-risk list every Monday morning.',
    bullets: [
      'Early-warning scoring',
      'Counsellor & parent workflows',
      'Cohort-level trend dashboards',
    ],
    visual: [
      {
        icon: LineChart,
        label: 'Risk model accuracy',
        metric: '88% precision',
      },
      { icon: Users, label: 'Cohorts tracked', metric: 'Unlimited' },
    ],
  },
  {
    eyebrow: 'Trust',
    title: 'Built for the data your institute holds',
    body: 'Tenant-isolated AI. End-to-end encryption. Audit logs for every action. Designed from day one for the regulations your IT team actually has to satisfy.',
    bullets: [
      'Per-tenant model isolation',
      'Role-based access on every record',
      'SOC 2 & DPDP-ready roadmap',
    ],
    visual: [
      { icon: ShieldCheck, label: 'Encryption', metric: 'AES-256 + TLS 1.3' },
      { icon: CheckCircle2, label: 'Audit coverage', metric: '100% of writes' },
    ],
  },
];

function FeatureGrid() {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <motion.div key={feature.title} variants={fadeUp}>
            <Card className="relative h-full border-border/50 bg-card/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_32px_-4px] hover:shadow-primary/30">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform group-hover/card:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <StatusPill status={feature.status}>
                    {feature.statusLabel}
                  </StatusPill>
                </div>
                <CardTitle className="mt-2 text-lg font-semibold">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function StickyShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  return (
    <div
      ref={ref}
      className="relative mt-32"
      style={{ height: `${frames.length * 90}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          <div className="relative h-[420px]">
            {frames.map((frame, i) => (
              <FrameText
                key={frame.title}
                frame={frame}
                index={i}
                progress={scrollYProgress}
              />
            ))}
          </div>
          <div className="relative h-[420px]">
            {frames.map((frame, i) => (
              <FrameVisual
                key={frame.title}
                frame={frame}
                index={i}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function useFrameOpacity(
  progress: ReturnType<typeof useScroll>['scrollYProgress'],
  index: number,
) {
  const total = frames.length;
  const start = index / total;
  const peakStart = start + 0.05 / total;
  const peakEnd = (index + 1) / total - 0.05 / total;
  const end = (index + 1) / total;
  return useTransform(
    progress,
    [start, peakStart, peakEnd, end],
    [0, 1, 1, index === total - 1 ? 1 : 0],
  );
}

function useFrameY(
  progress: ReturnType<typeof useScroll>['scrollYProgress'],
  index: number,
) {
  const total = frames.length;
  const start = index / total;
  const end = (index + 1) / total;
  return useTransform(progress, [start, end], [20, -20]);
}

function FrameText({
  frame,
  index,
  progress,
}: {
  frame: Frame;
  index: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const opacity = useFrameOpacity(progress, index);
  const y = useFrameY(progress, index);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col justify-center"
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
        {frame.eyebrow}
      </p>
      <h3 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {frame.title}
      </h3>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
        {frame.body}
      </p>
      <ul className="mt-6 space-y-2.5">
        {frame.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground/90">{bullet}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function FrameVisual({
  frame,
  index,
  progress,
}: {
  frame: Frame;
  index: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const opacity = useFrameOpacity(progress, index);
  const y = useFrameY(progress, index);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" />
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]">
          <div className="mb-4 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/40" />
            <span className="ml-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              gurukul / preview
            </span>
          </div>
          <div className="space-y-3">
            {frame.visual.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {row.label}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {row.metric}
                  </span>
                </div>
              );
            })}
            <div className="mt-4 grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-3 rounded-sm',
                    i % (index + 3) === 0
                      ? 'bg-primary/80'
                      : i % 2 === 0
                        ? 'bg-primary/30'
                        : 'bg-muted/40',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
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
            What we&apos;re building
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl"
          >
            One platform for everything your institute runs on
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-balance text-muted-foreground"
          >
            We&apos;re replacing the dozen fragmented tools every campus
            stitches together. Here&apos;s what&apos;s in flight and what&apos;s
            coming next.
          </motion.p>
        </div>

        <FeatureGrid />
      </motion.div>

      <StickyShowcase />
    </section>
  );
}
