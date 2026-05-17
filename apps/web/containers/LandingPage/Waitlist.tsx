'use client';

import { REVEAL_VIEWPORT, fadeUp, staggerContainer } from '@/lib/motion';
import { motion } from 'motion/react';

import { WaitlistForm } from './WaitlistForm';

export function Waitlist() {
  return (
    <section className="relative py-24 sm:py-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        className="container mx-auto max-w-3xl px-4"
      >
        <motion.div
          variants={fadeUp}
          whileInView={{ boxShadow: '0 24px 80px -16px rgb(0 200 200 / 0.35)' }}
          viewport={REVEAL_VIEWPORT}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

          <motion.h2
            variants={fadeUp}
            className="text-balance text-3xl font-bold tracking-tight sm:text-5xl"
          >
            Be first when we open the doors
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-balance text-primary-foreground/80 sm:text-lg"
          >
            Join the waitlist today to lock in founding-member pricing and get
            early access invites as we open Q3 2026.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10">
            <WaitlistForm variant="cta" buttonLabel="Join waitlist" />
            <p className="mt-3 text-xs text-primary-foreground/70">
              ~1,247 institutes already onboard.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
