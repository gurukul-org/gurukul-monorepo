import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/lib/store';
import { actions } from '@/lib/store/slices/modal';
import { ModalPayload, ModalType } from '@/lib/store/types/modal';
import { type AcademicTerm } from '@/services/api/requests/academic-terms';
import { type Program } from '@/services/api/requests/programs';
import { type Role } from '@/services/api/requests/roles';

// Generic primitives — every per-modal hook below composes these.
export function useShowModal() {
  const dispatch = useAppDispatch();
  return useCallback(
    (type: ModalType, payload: ModalPayload) =>
      dispatch(actions.showModal({ type, payload })),
    [dispatch],
  );
}

export function useHideModal() {
  const dispatch = useAppDispatch();
  return useCallback(() => dispatch(actions.hideModal()), [dispatch]);
}

export function useModalType() {
  return useAppSelector((state) => state.modal.type);
}

export function useModalPayload() {
  return useAppSelector((state) => state.modal.payload);
}

// Per-modal hooks — one per registered modal. This is the public API
// every feature component should use. Callers never reference
// ModalType directly.
export function useShowExampleDeletionModal(id: string) {
  const showModal = useShowModal();
  return useCallback(
    () => showModal(ModalType.ExampleDeletion, { id }),
    [showModal, id],
  );
}

export function useShowInviteMemberModal() {
  const showModal = useShowModal();
  return useCallback(
    () => showModal(ModalType.InviteMemberModal, {}),
    [showModal],
  );
}

export function useShowRoleModal() {
  const showModal = useShowModal();
  return useCallback(
    (editingRole: Role | null) =>
      showModal(ModalType.RoleModal, { editingRole }),
    [showModal],
  );
}

export function useShowAcademicTermModal() {
  const showModal = useShowModal();
  return useCallback(
    (editingTerm: AcademicTerm | null) =>
      showModal(ModalType.AcademicTermModal, { editingTerm }),
    [showModal],
  );
}

export function useShowProgramModal() {
  const showModal = useShowModal();
  return useCallback(
    (editingProgram: Program | null) =>
      showModal(ModalType.ProgramModal, { editingProgram }),
    [showModal],
  );
}

export function useShowRevokeAccessModal(
  membershipId: string,
  userFullName: string,
) {
  const showModal = useShowModal();
  return useCallback(
    () =>
      showModal(ModalType.RevokeAccessModal, { membershipId, userFullName }),
    [showModal, membershipId, userFullName],
  );
}

export function useShowDeleteModal() {
  const showModal = useShowModal();
  return useCallback(
    (payload: {
      title: string;
      subtitle: string;
      confirmButtonText?: string;
      onConfirm: () => void | Promise<void>;
    }) => showModal(ModalType.DeleteModal, payload),
    [showModal],
  );
}

export function useShowMemberProfileModal() {
  const showModal = useShowModal();
  return useCallback(
    (membershipId: string) =>
      showModal(ModalType.MemberProfileModal, { membershipId }),
    [showModal],
  );
}

export function useShowChangeRoleModal() {
  const showModal = useShowModal();
  return useCallback(
    (payload: {
      membershipId: string;
      currentRoleIds: string[];
      userFullName: string;
    }) => showModal(ModalType.ChangeRoleModal, payload),
    [showModal],
  );
}

export function useShowSuspendMemberModal() {
  const showModal = useShowModal();
  return useCallback(
    (membershipId: string, userFullName: string) =>
      showModal(ModalType.SuspendMemberModal, { membershipId, userFullName }),
    [showModal],
  );
}
