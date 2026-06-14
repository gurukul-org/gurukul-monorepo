export enum SidePaneType {
  DummySidepane = 'DummySidepane',
}

export interface DummySidepanePayload {
  message?: string;
}

export type SidePanePayloadMap = {
  [SidePaneType.DummySidepane]: DummySidepanePayload;
};

export type SidePanePayload = DummySidepanePayload;
