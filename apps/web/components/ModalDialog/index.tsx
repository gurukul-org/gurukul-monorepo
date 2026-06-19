'use client';

import { Fragment } from 'react';

import DeleteModal from '@/components/modals/Confirmations/DeleteModal';
import ExampleDeletion from '@/components/modals/Confirmations/ExampleDeletion';
import RevokeAccessModal from '@/components/modals/Confirmations/RevokeAccess';
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import { RoleModal } from '@/components/modals/RoleModal';
import { useModalPayload, useModalType } from '@/hooks/use-modal';
import { ModalType } from '@/lib/store/types/modal';

// Registry: one line per modal. React.ComponentType<any> is intentional —
// each modal narrows its own payload type internally.
const Modal: { [key in ModalType]?: React.ComponentType<any> } = {
  [ModalType.None]: Fragment,
  [ModalType.ExampleDeletion]: ExampleDeletion,
  [ModalType.InviteMemberModal]: InviteMemberModal,
  [ModalType.RoleModal]: RoleModal,
  [ModalType.RevokeAccessModal]: RevokeAccessModal,
  [ModalType.DeleteModal]: DeleteModal,
};

export default function ModalDialog() {
  const modalType = useModalType();
  const modalPayload = useModalPayload();

  const CurrentModal = Modal[modalType];
  if (!CurrentModal) return null;

  return <CurrentModal {...(modalPayload || {})} />;
}
