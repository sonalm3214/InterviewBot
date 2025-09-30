import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import interviewSlice from './interviewSlice';

const persistConfig = {
  key: 'interview',
  storage,
  whitelist: ['currentCandidate', 'timerState', 'lastActivity']
};

const persistedInterviewReducer = persistReducer(persistConfig, interviewSlice);

export const store = configureStore({
  reducer: {
    interview: persistedInterviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
