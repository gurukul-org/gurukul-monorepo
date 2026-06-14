'use client';

import { Sidepane } from '@/components/sidepanes/Sidepane';

interface DummySidepaneProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function DummySidepane({
  isOpen,
  onClose,
  message,
}: DummySidepaneProps) {
  return (
    <Sidepane
      isOpen={isOpen}
      onClose={onClose}
      title="Sample Sidepane"
      description="This is a dummy sidepane to verify it works."
      primaryAction={{
        label: 'Save Changes',
        onClick: () => {
          console.log('Saved changes!');
          onClose();
        },
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
      }}
    >
      <p className="text-muted-foreground">
        {message ||
          'Sidepane content goes here. Replace this with real content later.'}
      </p>
    </Sidepane>
  );
}
