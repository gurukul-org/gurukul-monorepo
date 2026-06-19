import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ModalState, ModalType } from '../types/modal';

const initialState: ModalState = {
  type: ModalType.None,
  payload: {},
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    showModal: (_state, action: PayloadAction<ModalState>) => action.payload,
    hideModal: () => initialState,
    resetModal: () => initialState,
  },
});

export const { actions, reducer } = modalSlice;
