'use client';

import { useHideModal } from '@/hooks/use-modal';
import { useAppSelector } from '@/lib/store';
import { ModalType } from '@/lib/store/types/modal';

import { DummyModal } from './DummyModal';

const MODAL_COMPONENTS = {
  [ModalType.DummyModal]: DummyModal,
};

export function ModalProvider() {
  const { isOpen, type, payload } = useAppSelector((state) => state.ui.modal);
  const close = useHideModal();

  if (!isOpen || !type) return null;

  const ModalComponent =
    MODAL_COMPONENTS[type as keyof typeof MODAL_COMPONENTS];
  if (!ModalComponent) return null;

  return <ModalComponent isOpen={isOpen} onClose={close} {...payload} />;
}
