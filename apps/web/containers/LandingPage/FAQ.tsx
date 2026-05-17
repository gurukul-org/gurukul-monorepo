'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { REVEAL_VIEWPORT, fadeUp, staggerContainer } from '@/lib/motion';
import { motion } from 'motion/react';

const faqs = [
  {
    question: 'When does Gurukul actually launch?',
    answer:
      "We're targeting Q3 2026 for public launch. A private beta with design-partner institutes opens earlier in Q2 2026 — waitlist signups get first invites in order of signup.",
  },
  {
    question: 'What does early access include?',
    answer:
      "Founding members get hands-on onboarding from our team, locked-in pricing for the first two years, and a direct line to influence the roadmap. We're keeping the early cohort small so we can support every institute properly.",
  },
  {
    question: 'How is pricing decided?',
    answer:
      "Pricing isn't finalized yet — that's part of why we're talking to early users. The plan is per-student, transparent, and significantly cheaper than the patchwork of tools institutes typically replace. Waitlist members lock in founding rates.",
  },
  {
    question: "Will my institute's data be safe?",
    answer:
      "Yes. Every tenant gets isolated data and AI models. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We're building toward SOC 2 and DPDP compliance, and your data is never used to train models for other customers.",
  },
  {
    question: "Can I cancel if it's not for us?",
    answer:
      "Of course. Joining the waitlist is non-binding — it just means we'll reach out when early access opens. No card required, no commitment until you decide Gurukul is worth it.",
  },
  {
    question: 'How can I follow your progress?',
    answer:
      "Once you're on the waitlist we send a short build update once a month — what shipped, what we learned, what's next. No fluff, no marketing emails.",
  },
];

export function FAQ() {
  return (
    <section className="relative py-24 sm:py-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        className="container mx-auto max-w-3xl px-4"
      >
        <div className="mb-12 text-center">
          <motion.p
            variants={fadeUp}
            className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
          >
            FAQ
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl"
          >
            Questions before you join
          </motion.h2>
        </div>

        <motion.div variants={fadeUp}>
          <Accordion
            type="single"
            collapsible
            className="border-border/50 bg-card/30 backdrop-blur"
          >
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="px-2">
                <AccordionTrigger className="text-left text-base font-medium sm:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </motion.div>
    </section>
  );
}
