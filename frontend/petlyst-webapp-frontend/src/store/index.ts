import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import examinationsReducer from '../components/clinic/management/examination/examinationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    examinations: examinationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 