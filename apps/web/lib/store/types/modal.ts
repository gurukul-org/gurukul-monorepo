export enum ModalType {
  DummyModal = 'DummyModal',
  InviteMemberModal = 'InviteMemberModal',
}

export interface DummyModalPayload {
  message?: string;
}

export type ModalPayloadMap = {
  [ModalType.DummyModal]: DummyModalPayload;
  [ModalType.InviteMemberModal]: undefined;
};

export type ModalPayload = DummyModalPayload;
