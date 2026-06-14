export enum ModalType {
  DummyModal = 'DummyModal',
}

export interface DummyModalPayload {
  message?: string;
}

export type ModalPayloadMap = {
  [ModalType.DummyModal]: DummyModalPayload;
};

export type ModalPayload = DummyModalPayload;
