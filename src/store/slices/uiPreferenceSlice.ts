import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIPreferenceState {
  tableDensity: 'compact' | 'standard' | 'spacious';
  theme: 'dark' | 'light';
  visibleColumns: Record<string, boolean>;
  columnWidths: Record<string, number>;
  sidebarCollapsed: boolean;
  highlightMatches: boolean;
  useVirtualization: boolean;
}

const defaultVisibleColumns: Record<string, boolean> = {
  recordKey: true,
  title: true,
  category: true,
  status: true,
  numericValue: true,
  country: true,
  region: true,
  recordDate: true,
};

const initialState: UIPreferenceState = {
  tableDensity: 'standard',
  theme: 'dark',
  visibleColumns: defaultVisibleColumns,
  columnWidths: {
    recordKey: 140,
    title: 280,
    category: 150,
    status: 120,
    numericValue: 160,
    country: 150,
    region: 130,
    recordDate: 140,
  },
  sidebarCollapsed: false,
  highlightMatches: true,
  useVirtualization: true,
};

export const uiPreferenceSlice = createSlice({
  name: 'uiPreference',
  initialState,
  reducers: {
    setTableDensity: (state, action: PayloadAction<'compact' | 'standard' | 'spacious'>) => {
      state.tableDensity = action.payload;
    },
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
    },
    toggleColumnVisibility: (state, action: PayloadAction<string>) => {
      const col = action.payload;
      state.visibleColumns[col] = !state.visibleColumns[col];
    },
    setVisibleColumns: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.visibleColumns = action.payload;
    },
    setColumnWidth: (state, action: PayloadAction<{ column: string; width: number }>) => {
      state.columnWidths[action.payload.column] = Math.max(80, action.payload.width);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleHighlightMatches: (state) => {
      state.highlightMatches = !state.highlightMatches;
    },
    toggleVirtualization: (state) => {
      state.useVirtualization = !state.useVirtualization;
    },
    resetColumnPreferences: (state) => {
      state.visibleColumns = defaultVisibleColumns;
    },
  },
});

export const {
  setTableDensity,
  setTheme,
  toggleColumnVisibility,
  setVisibleColumns,
  setColumnWidth,
  toggleSidebar,
  setSidebarCollapsed,
  toggleHighlightMatches,
  toggleVirtualization,
  resetColumnPreferences,
} = uiPreferenceSlice.actions;

export default uiPreferenceSlice.reducer;

