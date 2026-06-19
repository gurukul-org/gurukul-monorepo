import { type Role } from '@/services/api/requests/roles';

// Add every modal you register, in declaration order.
// `None` MUST be the first/zero value — it's the closed state.
export enum ModalType {
  None,
  ExampleDeletion,
  InviteMemberModal,
  RoleModal,
  RevokeAccessModal,
  DeleteModal,
}

// Union of every modal's payload shape. Each member should ideally
// come from its modal's own `types.ts` so payloads stay co-located.
export type ModalPayload =
  | Record<string, never> // for modals with no payload
  | { id: string } // ExampleDeletion
  | { editingRole: Role | null } // RoleModal
  | { membershipId: string; userFullName: string } // RevokeAccessModal
  | {
      title: string;
      subtitle: string;
      confirmButtonText?: string;
      onConfirm: () => void | Promise<void>;
    }; // DeleteModal

export type ModalState = {
  type: ModalType;
  payload: ModalPayload;
};
