import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Dataset, DatasetField } from '@/types';

export interface DatasetState {
  selectedDatasetId: string;
  activeDataset: Dataset | null;
  activeFields: DatasetField[];
  selectedRecordId: string | null;
  selectedRowIds: Record<string, boolean>;
  isDetailDrawerOpen: boolean;
}

const initialState: DatasetState = {
  selectedDatasetId: 'ds-sales-01',
  activeDataset: null,
  activeFields: [],
  selectedRecordId: null,
  selectedRowIds: {},
  isDetailDrawerOpen: false,
};

export const datasetSlice = createSlice({
  name: 'dataset',
  initialState,
  reducers: {
    setSelectedDatasetId: (state, action: PayloadAction<string>) => {
      state.selectedDatasetId = action.payload;
      state.selectedRowIds = {};
      state.selectedRecordId = null;
      state.isDetailDrawerOpen = false;
    },
    setActiveDataset: (state, action: PayloadAction<Dataset>) => {
      state.activeDataset = action.payload;
      state.activeFields = action.payload.fields || [];
    },
    openRecordDetail: (state, action: PayloadAction<string>) => {
      state.selectedRecordId = action.payload;
      state.isDetailDrawerOpen = true;
    },
    closeRecordDetail: (state) => {
      state.selectedRecordId = null;
      state.isDetailDrawerOpen = false;
    },
    toggleRowSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedRowIds[id]) {
        delete state.selectedRowIds[id];
      } else {
        state.selectedRowIds[id] = true;
      }
    },
    selectAllRows: (state, action: PayloadAction<string[]>) => {
      const newMap: Record<string, boolean> = {};
      action.payload.forEach((id) => {
        newMap[id] = true;
      });
      state.selectedRowIds = newMap;
    },
    clearRowSelection: (state) => {
      state.selectedRowIds = {};
    },
  },
});

export const {
  setSelectedDatasetId,
  setActiveDataset,
  openRecordDetail,
  closeRecordDetail,
  toggleRowSelection,
  selectAllRows,
  clearRowSelection,
} = datasetSlice.actions;

export default datasetSlice.reducer;

