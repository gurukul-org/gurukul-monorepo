import { useCallback } from 'react';

import { useAppDispatch } from '@/lib/store';
import { hideModal, showModal } from '@/lib/store/slices/uiSlice';
import { ModalPayloadMap, ModalType } from '@/lib/store/types/modal';

export function useShowModal() {
  const dispatch = useAppDispatch();
  return useCallback(
    <T extends ModalType>(type: T, payload?: ModalPayloadMap[T]) => {
      dispatch(showModal({ type, payload }));
    },
    [dispatch],
  );
}

export function useHideModal() {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);
}

// Convenience hooks for specific modals
export function useDummyModal() {
  const show = useShowModal();
  return useCallback(
    (payload?: ModalPayloadMap[ModalType.DummyModal]) => {
      show(ModalType.DummyModal, payload);
    },
    [show],
  );
}

export function useInviteMemberModal() {
  const show = useShowModal();
  return useCallback(() => {
    show(ModalType.InviteMemberModal);
  }, [show]);
}

// Keep a backward compatible useModal wrapper for any legacy uses
export function useModal() {
  const show = useShowModal();
  const hide = useHideModal();

  const open = useCallback(
    (type: string, data?: unknown) => {
      show(type as ModalType, data as ModalPayloadMap[ModalType]);
    },
    [show],
  );

  return {
    open,
    close: hide,
  };
}
