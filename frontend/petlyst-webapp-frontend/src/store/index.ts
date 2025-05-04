import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import examinationsReducer from '../components/clinic/management/examination/examinationSlice';
import diagnosesReducer from '../components/clinic/management/diagnosis/DiagnosisSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    examinations: examinationsReducer,
    diagnoses: diagnosesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 