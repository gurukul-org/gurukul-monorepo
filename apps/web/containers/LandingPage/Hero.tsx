'use client';

import { useRef } from 'react';

import { fadeUp, staggerContainer } from '@/lib/motion';
import { Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';

import { WaitlistForm } from './WaitlistForm';

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const orbOneY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const orbTwoY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden pt-24 pb-32 sm:pt-32 lg:pt-40 lg:pb-44"
    >
      {/* Background orbs */}
      <motion.div
        aria-hidden
        style={{ y: orbOneY }}
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]"
      />
      <motion.div
        aria-hidden
        style={{ y: orbTwoY }}
        className="pointer-events-none absolute top-40 right-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[140px]"
      />

      {/* Dot grid */}
      <motion.div
        aria-hidden
        style={{ y: gridY }}
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_center,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <motion.div
        style={{ opacity: contentOpacity }}
        variants={staggerContainer(0.1)}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 text-center"
      >
        <motion.div variants={fadeUp} className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Coming Q3 2026
            <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/60" />
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mx-auto mt-8 max-w-4xl text-balance text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
        >
          Run your institute with{' '}
          <span className="bg-gradient-to-br from-primary via-primary to-cyan-300 bg-clip-text text-transparent">
            AI precision
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl"
        >
          Gurukul is a SaaS platform we&apos;re building to automate scheduling,
          admissions, and student insights for modern educational institutes.
          Join the waitlist and we&apos;ll bring you onboard when we open early
          access.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10">
          <WaitlistForm variant="hero" />
          <p className="mt-3 text-xs text-muted-foreground">
            No spam. One launch update a month — unsubscribe anytime.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
