'use client';

import { REVEAL_VIEWPORT, fadeUp, staggerContainer } from '@/lib/motion';
import { Quote } from 'lucide-react';
import { motion } from 'motion/react';

export function FoundersNote() {
  return (
    <section className="relative py-24 sm:py-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        className="container mx-auto max-w-3xl px-4"
      >
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-8 backdrop-blur sm:p-12">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

          <motion.div variants={fadeUp}>
            <Quote className="h-8 w-8 text-primary/60" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-balance text-xl leading-relaxed text-foreground sm:text-2xl"
          >
            Most institutes still run on a stack of spreadsheets, WhatsApp
            groups, and three different SaaS tools that don&apos;t talk to each
            other. We&apos;re building Gurukul because the people who actually
            run schools — admins, teachers, principals — deserve software that
            respects their time. We&apos;re not there yet. But we&apos;re close,
            and we&apos;d love to bring you along while we get there.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-cyan-500" />
            <div>
              <p className="text-sm font-semibold">The Gurukul team</p>
              <p className="text-xs text-muted-foreground">
                Building in public · 2026
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
