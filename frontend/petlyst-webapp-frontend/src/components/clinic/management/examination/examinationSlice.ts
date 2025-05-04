// examinationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { examinationService, Examination, ExaminationFilter, ExaminationData, ApiResponse } from './examinationService';

interface ExaminationState {
  examinations: Examination[];
  examination: Examination | null;
  petExaminations: Examination[];
  loading: {
    list: boolean;
    details: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  error: string | null;
  success: boolean;
  totalCount: number;
}

const initialState: ExaminationState = {
  examinations: [],
  examination: null,
  petExaminations: [],
  loading: {
    list: false,
    details: false,
    create: false,
    update: false,
    delete: false
  },
  error: null,
  success: false,
  totalCount: 0
};

// Async thunks
export const fetchExaminations = createAsyncThunk<
  ApiResponse<Examination[]>,
  ExaminationFilter,
  { rejectValue: string }
>(
  'examinations/fetchExaminations',
  async (filters: ExaminationFilter, { rejectWithValue }) => {
    try {
      return await examinationService.getExaminations(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error retrieving examinations');
    }
  }
);

export const fetchExamination = createAsyncThunk<
  ApiResponse<Examination>,
  number,
  { rejectValue: string }
>(
  'examinations/fetchExamination',
  async (id: number, { rejectWithValue }) => {
    try {
      return await examinationService.getExamination(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error retrieving examination details');
    }
  }
);

export const createExamination = createAsyncThunk<
  ApiResponse<Examination>,
  ExaminationData,
  { rejectValue: string }
>(
  'examinations/createExamination',
  async (examinationData: ExaminationData, { rejectWithValue }) => {
    try {
      return await examinationService.createExamination(examinationData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error creating examination');
    }
  }
);

export const updateExamination = createAsyncThunk<
  ApiResponse<Examination>,
  { id: number; data: Partial<ExaminationData> },
  { rejectValue: string }
>(
  'examinations/updateExamination',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await examinationService.updateExamination(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error updating examination');
    }
  }
);

export const updateExaminationStatus = createAsyncThunk<
  ApiResponse<Examination>,
  { id: number; status: 'started' | 'in_progress' | 'completed' },
  { rejectValue: string }
>(
  'examinations/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await examinationService.updateExaminationStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error updating examination status');
    }
  }
);

export const fetchPetExaminationHistory = createAsyncThunk<
  ApiResponse<Examination[]>,
  number,
  { rejectValue: string }
>(
  'examinations/fetchPetHistory',
  async (petId: number, { rejectWithValue }) => {
    try {
      return await examinationService.getPetExaminationHistory(petId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error retrieving examination history');
    }
  }
);

export const deleteExamination = createAsyncThunk<
  ApiResponse<any> & { id: number },
  number,
  { rejectValue: string }
>(
  'examinations/deleteExamination',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await examinationService.deleteExamination(id);
      return { ...response, id };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error deleting examination');
    }
  }
);

const examinationSlice = createSlice({
  name: 'examinations',
  initialState,
  reducers: {
    resetExaminationState: (state) => {
      state.loading = initialState.loading;
      state.error = null;
      state.success = false;
    },
    clearExaminationDetails: (state) => {
      state.examination = null;
    },
    resetExaminationErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchExaminations
      .addCase(fetchExaminations.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchExaminations.fulfilled, (state, action: PayloadAction<ApiResponse<Examination[]>>) => {
        state.loading.list = false;
        if (action.payload.examinations) {
          state.examinations = action.payload.examinations;
          state.totalCount = action.payload.count || action.payload.examinations.length;
        }
        state.success = action.payload.success;
      })
      .addCase(fetchExaminations.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload || 'Error retrieving examinations';
      })
      
      // fetchExamination
      .addCase(fetchExamination.pending, (state) => {
        state.loading.details = true;
        state.error = null;
      })
      .addCase(fetchExamination.fulfilled, (state, action: PayloadAction<ApiResponse<Examination>>) => {
        state.loading.details = false;
        if (action.payload.examination) {
          state.examination = action.payload.examination;
        }
        state.success = action.payload.success;
      })
      .addCase(fetchExamination.rejected, (state, action) => {
        state.loading.details = false;
        state.error = action.payload || 'Error retrieving examination details';
      })
      
      // createExamination
      .addCase(createExamination.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createExamination.fulfilled, (state, action: PayloadAction<ApiResponse<Examination>>) => {
        state.loading.create = false;
        if (action.payload.examination) {
          state.examination = action.payload.examination;
          state.examinations = [action.payload.examination, ...state.examinations];
        }
        state.success = action.payload.success;
      })
      .addCase(createExamination.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload || 'Error creating examination';
      })
      
      // updateExamination
      .addCase(updateExamination.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateExamination.fulfilled, (state, action: PayloadAction<ApiResponse<Examination>>) => {
        state.loading.update = false;
        if (action.payload.examination) {
          state.examination = action.payload.examination;
          state.examinations = state.examinations.map(exam => 
            exam.examination_id === action.payload.examination!.examination_id 
              ? action.payload.examination! 
              : exam
          );
        }
        state.success = action.payload.success;
      })
      .addCase(updateExamination.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || 'Error updating examination';
      })
      
      // updateExaminationStatus
      .addCase(updateExaminationStatus.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateExaminationStatus.fulfilled, (state, action: PayloadAction<ApiResponse<Examination>>) => {
        state.loading.update = false;
        if (action.payload.examination) {
          state.examination = action.payload.examination;
          state.examinations = state.examinations.map(exam => 
            exam.examination_id === action.payload.examination!.examination_id 
              ? action.payload.examination! 
              : exam
          );
        }
        state.success = action.payload.success;
      })
      .addCase(updateExaminationStatus.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || 'Error updating examination status';
      })
      
      // fetchPetExaminationHistory
      .addCase(fetchPetExaminationHistory.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchPetExaminationHistory.fulfilled, (state, action: PayloadAction<ApiResponse<Examination[]>>) => {
        state.loading.list = false;
        if (action.payload.examinations) {
          state.petExaminations = action.payload.examinations;
        }
        state.success = action.payload.success;
      })
      .addCase(fetchPetExaminationHistory.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload || 'Error retrieving examination history';
      })
      
      // deleteExamination
      .addCase(deleteExamination.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteExamination.fulfilled, (state, action: PayloadAction<ApiResponse<any> & { id: number }>) => {
        state.loading.delete = false;
        if (action.payload.success) {
          state.examinations = state.examinations.filter(
            exam => exam.examination_id !== action.payload.id
          );
          if (state.examination && state.examination.examination_id === action.payload.id) {
            state.examination = null;
          }
        }
        state.success = action.payload.success;
      })
      .addCase(deleteExamination.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload || 'Error deleting examination';
      });
  }
});

export const { resetExaminationState, clearExaminationDetails, resetExaminationErrors } = examinationSlice.actions;

export default examinationSlice.reducer;