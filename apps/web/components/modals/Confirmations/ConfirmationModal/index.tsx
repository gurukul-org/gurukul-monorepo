'use client';

import { ReactNode, useState } from 'react';

import { Modal } from '@/components/modals/Modal';
import { useHideModal } from '@/hooks/use-modal';

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  confirmButtonText: string;
  cancelButtonText?: string;
  onConfirm: () => void | Promise<void>;
  ctaProcessing?: boolean;
  noCancelButton?: boolean;
};

// Reusable confirm dialog base — every "delete X" / "are you sure?"
// modal should wrap this rather than re-implementing the plumbing.
export default function ConfirmationModal({
  title,
  subtitle,
  confirmButtonText,
  cancelButtonText = 'Cancel',
  onConfirm,
  ctaProcessing,
  noCancelButton,
}: Props) {
  const hideModal = useHideModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      hideModal();
    } catch (err) {
      // Caller's mutation hook surfaces its own error toast.
      console.error('Confirmation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={hideModal}
      title={title}
      description={subtitle}
      primaryAction={{
        label: confirmButtonText,
        onClick: handleConfirm,
        loading: isLoading || ctaProcessing,
        disabled: isLoading || ctaProcessing,
        variant: 'destructive',
      }}
      secondaryAction={
        noCancelButton
          ? undefined
          : {
              label: cancelButtonText,
              onClick: hideModal,
              disabled: isLoading || ctaProcessing,
            }
      }
    >
      {/* Children slot intentionally empty — subtitle covers the message. */}
      <span />
    </Modal>
  );
}
