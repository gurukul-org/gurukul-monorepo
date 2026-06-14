'use client';

import { Modal } from '@/components/modals/Modal';
import { Button } from '@/components/ui/button';

interface DummyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DummyModal({ isOpen, onClose }: DummyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sample Modal"
      description="This is a dummy modal to verify it works."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <p className="text-muted-foreground">
        Modal content goes here. Replace this with real content later.
      </p>
    </Modal>
  );
}
