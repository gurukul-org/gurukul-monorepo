'use client';

import { useEffect, useRef, useState } from 'react';

import { REVEAL_VIEWPORT, fadeUp, staggerContainer } from '@/lib/motion';
import { animate, motion, useInView } from 'motion/react';

function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}

const stats = [
  { label: 'Institutes on the waitlist', value: 1247 },
  { label: 'Countries represented', value: 18 },
  { label: 'Pre-launch design partners', value: 42 },
];

export function SocialProof() {
  return (
    <section className="relative border-y border-border/40 bg-muted/20 py-16">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        className="container mx-auto px-4"
      >
        <motion.p
          variants={fadeUp}
          className="mb-10 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          Already requested by educators worldwide
        </motion.p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                <Counter target={stat.value} />
                {stat.value >= 1000 ? '+' : ''}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
