import { type AcademicTerm } from '@/services/api/requests/academic-terms';
import { type Class } from '@/services/api/requests/classes';
import { type Course } from '@/services/api/requests/courses';
import { type Program } from '@/services/api/requests/programs';
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
  AcademicTermModal,
  ProgramModal,
  ClassModal,
  CourseModal,
}

// Union of every modal's payload shape. Each member should ideally
// come from its modal's own `types.ts` so payloads stay co-located.
export type ModalPayload =
  | Record<string, never> // for modals with no payload
  | { id: string } // ExampleDeletion
  | { editingRole: Role | null } // RoleModal
  | { editingTerm: AcademicTerm | null } // AcademicTermModal
  | { editingProgram: Program | null } // ProgramModal
  | { editingClass: Class | null } // ClassModal
  | { editingCourse: Course | null } // CourseModal
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
