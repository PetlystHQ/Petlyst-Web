import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import examinationService, { 
  Examination,
  ExaminationFilters,
  CreateExaminationData,
  UpdateExaminationData
} from './examinationService';

// Define the state interface
interface ExaminationState {
  examinations: Examination[];
  currentExamination: Examination | null;
  petExaminations: Examination[];
  loading: boolean;
  error: string | null;
  success: boolean;
  totalCount: number;
}

// Initial state
const initialState: ExaminationState = {
  examinations: [],
  currentExamination: null,
  petExaminations: [],
  loading: false,
  error: null,
  success: false,
  totalCount: 0
};

// Async thunks
export const listExaminations = createAsyncThunk(
  'examinations/list',
  async (filters: ExaminationFilters, { rejectWithValue }) => {
    try {
      return await examinationService.listExaminations(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch examinations');
    }
  }
);

export const getExamination = createAsyncThunk(
  'examinations/get',
  async (examinationId: number, { rejectWithValue }) => {
    try {
      return await examinationService.getExamination(examinationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch examination');
    }
  }
);

export const createExamination = createAsyncThunk(
  'examinations/create',
  async (examinationData: CreateExaminationData, { rejectWithValue }) => {
    try {
      return await examinationService.createExamination(examinationData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create examination');
    }
  }
);

export const updateExamination = createAsyncThunk(
  'examinations/update',
  async ({ examinationId, updateData }: { examinationId: number, updateData: UpdateExaminationData }, { rejectWithValue }) => {
    try {
      return await examinationService.updateExamination(examinationId, updateData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update examination');
    }
  }
);

export const updateExaminationStatus = createAsyncThunk(
  'examinations/updateStatus',
  async ({ examinationId, status }: { examinationId: number, status: 'started' | 'in_progress' | 'completed' }, { rejectWithValue }) => {
    try {
      return await examinationService.updateExaminationStatus(examinationId, status);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update examination status');
    }
  }
);

export const getPetExaminationHistory = createAsyncThunk(
  'examinations/petHistory',
  async (petId: number, { rejectWithValue }) => {
    try {
      return await examinationService.getPetExaminationHistory(petId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pet examination history');
    }
  }
);

export const deleteExamination = createAsyncThunk(
  'examinations/delete',
  async (examinationId: number, { rejectWithValue }) => {
    try {
      return await examinationService.deleteExamination(examinationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete examination');
    }
  }
);

// Create the slice
const examinationSlice = createSlice({
  name: 'examinations',
  initialState,
  reducers: {
    resetExaminationState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearCurrentExamination: (state) => {
      state.currentExamination = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // List examinations
      .addCase(listExaminations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listExaminations.fulfilled, (state, action: PayloadAction<{ success: boolean, examinations: Examination[], count: number }>) => {
        state.loading = false;
        state.examinations = action.payload.examinations;
        state.totalCount = action.payload.count;
        state.success = true;
      })
      .addCase(listExaminations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get examination
      .addCase(getExamination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExamination.fulfilled, (state, action: PayloadAction<{ success: boolean, examination: Examination }>) => {
        state.loading = false;
        state.currentExamination = action.payload.examination;
        state.success = true;
      })
      .addCase(getExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create examination
      .addCase(createExamination.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createExamination.fulfilled, (state, action: PayloadAction<{ success: boolean, examination: Examination }>) => {
        state.loading = false;
        state.examinations = [action.payload.examination, ...state.examinations];
        state.currentExamination = action.payload.examination;
        state.success = true;
      })
      .addCase(createExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update examination
      .addCase(updateExamination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExamination.fulfilled, (state, action: PayloadAction<{ success: boolean, examination: Examination }>) => {
        state.loading = false;
        state.examinations = state.examinations.map(exam => 
          exam.examination_id === action.payload.examination.examination_id 
            ? action.payload.examination 
            : exam
        );
        state.currentExamination = action.payload.examination;
        state.success = true;
      })
      .addCase(updateExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update examination status
      .addCase(updateExaminationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExaminationStatus.fulfilled, (state, action: PayloadAction<{ success: boolean, examination: Examination }>) => {
        state.loading = false;
        state.examinations = state.examinations.map(exam => 
          exam.examination_id === action.payload.examination.examination_id 
            ? action.payload.examination 
            : exam
        );
        state.currentExamination = action.payload.examination;
        state.success = true;
      })
      .addCase(updateExaminationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get pet examination history
      .addCase(getPetExaminationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPetExaminationHistory.fulfilled, (state, action: PayloadAction<{ success: boolean, examinations: Examination[], count: number }>) => {
        state.loading = false;
        state.petExaminations = action.payload.examinations;
        state.success = true;
      })
      .addCase(getPetExaminationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete examination
      .addCase(deleteExamination.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExamination.fulfilled, (state, action: PayloadAction<{ success: boolean }>) => {
        state.loading = false;
        if (state.currentExamination) {
          state.examinations = state.examinations.filter(
            exam => exam.examination_id !== state.currentExamination?.examination_id
          );
          state.currentExamination = null;
        }
        state.success = true;
      })
      .addCase(deleteExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetExaminationState, clearCurrentExamination } = examinationSlice.actions;
export default examinationSlice.reducer;
