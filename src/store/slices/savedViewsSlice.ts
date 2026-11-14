import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SavedView } from '@/types';

export interface SavedViewsState {
  activeViewId: string | null;
  activeView: SavedView | null;
  isSaveModalOpen: boolean;
  isAiModalOpen: boolean;
}

const initialState: SavedViewsState = {
  activeViewId: null,
  activeView: null,
  isSaveModalOpen: false,
  isAiModalOpen: false,
};

export const savedViewsSlice = createSlice({
  name: 'savedViews',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<SavedView | null>) => {
      state.activeView = action.payload;
      state.activeViewId = action.payload ? action.payload.id : null;
    },
    setSaveModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isSaveModalOpen = action.payload;
    },
    setAiModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAiModalOpen = action.payload;
    },
    clearActiveView: (state) => {
      state.activeView = null;
      state.activeViewId = null;
    },
  },
});

export const { setActiveView, setSaveModalOpen, setAiModalOpen, clearActiveView } =
  savedViewsSlice.actions;

export default savedViewsSlice.reducer;
