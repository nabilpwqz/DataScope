import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import datasetReducer from './slices/datasetSlice';
import searchConfigReducer from './slices/searchConfigSlice';
import savedViewsReducer from './slices/savedViewsSlice';
import uiPreferenceReducer from './slices/uiPreferenceSlice';
import { dataScopeApi } from './services/dataScopeApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dataset: datasetReducer,
    searchConfig: searchConfigReducer,
    savedViews: savedViewsReducer,
    uiPreference: uiPreferenceReducer,
    [dataScopeApi.reducerPath]: dataScopeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(dataScopeApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
