import { ThemeToggle } from '@/components/ui/theme-toggle';

import { AnnouncementBar } from './AnnouncementBar';
import { FAQ } from './FAQ';
import { Features } from './Features';
import { FoundersNote } from './FoundersNote';
import { Hero } from './Hero';
import { Roadmap } from './Roadmap';
import { ScrollProgress } from './ScrollProgress';
import { SocialProof } from './SocialProof';
import { Waitlist } from './Waitlist';

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <ScrollProgress />
      <AnnouncementBar />
      <ThemeToggle className="fixed top-3 right-4 z-50 sm:top-4 sm:right-6" />
      <Hero />
      <SocialProof />
      <Features />
      <Roadmap />
      <FoundersNote />
      <FAQ />
      <Waitlist />

      <footer className="border-t border-border/50 py-10 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Gurukul · Built in public · Launching Q3
          2026
        </p>
      </footer>
    </main>
  );
}
