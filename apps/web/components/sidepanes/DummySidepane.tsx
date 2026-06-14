'use client';

import { Sidepane } from '@/components/sidepanes/Sidepane';
import { Button } from '@/components/ui/button';

interface DummySidepaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DummySidepane({ isOpen, onClose }: DummySidepaneProps) {
  return (
    <Sidepane
      isOpen={isOpen}
      onClose={onClose}
      title="Sample Sidepane"
      description="This is a dummy sidepane to verify it works."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <p className="text-muted-foreground">
        Sidepane content goes here. Replace this with real content later.
      </p>
    </Sidepane>
  );
}
