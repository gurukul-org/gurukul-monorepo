'use client';

import { Modal } from '@/components/modals/Modal';

interface DummyModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function DummyModal({ isOpen, onClose, message }: DummyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sample Modal"
      description="This is a dummy modal to verify it works."
      primaryAction={{
        label: 'Confirm',
        onClick: () => {
          console.log('Confirmed modal action!');
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
          'Modal content goes here. Replace this with real content later.'}
      </p>
    </Modal>
  );
}
