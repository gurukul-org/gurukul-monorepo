'use client';

import { Fragment } from 'react';

import { AcademicTermModal } from '@/components/modals/AcademicTermModal';
import { ClassModal } from '@/components/modals/ClassModal';
import DeleteModal from '@/components/modals/Confirmations/DeleteModal';
import ExampleDeletion from '@/components/modals/Confirmations/ExampleDeletion';
import RevokeAccessModal from '@/components/modals/Confirmations/RevokeAccess';
import { CourseModal } from '@/components/modals/CourseModal';
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import { ProgramModal } from '@/components/modals/ProgramModal';
import { RoleModal } from '@/components/modals/RoleModal';
import { StudentModal } from '@/components/modals/StudentModal';
import { StudentStatusModal } from '@/components/modals/StudentStatusModal';
import { useModalPayload, useModalType } from '@/hooks/use-modal';
import { ModalType } from '@/lib/store/types/modal';

// Registry: one line per modal. React.ComponentType<any> is intentional —
// each modal narrows its own payload type internally.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const Modal: { [key in ModalType]?: React.ComponentType<any> } = {
  [ModalType.None]: Fragment,
  [ModalType.ExampleDeletion]: ExampleDeletion,
  [ModalType.InviteMemberModal]: InviteMemberModal,
  [ModalType.RoleModal]: RoleModal,
  [ModalType.RevokeAccessModal]: RevokeAccessModal,
  [ModalType.DeleteModal]: DeleteModal,
  [ModalType.AcademicTermModal]: AcademicTermModal,
  [ModalType.ProgramModal]: ProgramModal,
  [ModalType.ClassModal]: ClassModal,
  [ModalType.CourseModal]: CourseModal,
  [ModalType.StudentModal]: StudentModal,
  [ModalType.StudentStatusModal]: StudentStatusModal,
};

export default function ModalDialog() {
  const modalType = useModalType();
  const modalPayload = useModalPayload();

  const CurrentModal = Modal[modalType];
  if (!CurrentModal) return null;

  return <CurrentModal {...(modalPayload || {})} />;
}
