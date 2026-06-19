import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { SidePaneType } from '../types/sidepane';

export interface UIState {
  sidepane: {
    isOpen: boolean;
    type: SidePaneType | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
  };
}

const initialState: UIState = {
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
    showSidePane: (
      state,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const { showSidePane, hideSidePane } = uiSlice.actions;

export default uiSlice.reducer;
