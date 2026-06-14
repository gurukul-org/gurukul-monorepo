import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ModalType } from '../types/modal';
import { SidePaneType } from '../types/sidepane';

export interface UIState {
  modal: {
    isOpen: boolean;
    type: ModalType | null;
    payload: any;
  };
  sidepane: {
    isOpen: boolean;
    type: SidePaneType | null;
    payload: any;
  };
}

const initialState: UIState = {
  modal: {
    isOpen: false,
    type: null,
    payload: null,
  },
  sidepane: {
    isOpen: false,
    type: null,
    payload: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showModal: (
      state,
      action: PayloadAction<{ type: ModalType; payload?: any }>,
    ) => {
      state.modal.isOpen = true;
      state.modal.type = action.payload.type;
      state.modal.payload = action.payload.payload ?? null;
    },
    hideModal: (state) => {
      state.modal.isOpen = false;
      state.modal.type = null;
      state.modal.payload = null;
    },
    showSidePane: (
      state,
      action: PayloadAction<{ type: SidePaneType; payload?: any }>,
    ) => {
      state.sidepane.isOpen = true;
      state.sidepane.type = action.payload.type;
      state.sidepane.payload = action.payload.payload ?? null;
    },
    hideSidePane: (state) => {
      state.sidepane.isOpen = false;
      state.sidepane.type = null;
      state.sidepane.payload = null;
    },
  },
});

export const { showModal, hideModal, showSidePane, hideSidePane } =
  uiSlice.actions;

export default uiSlice.reducer;
