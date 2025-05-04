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

// Helper to handle API errors consistently
const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error response:', error.response.data);
    return error.response.data?.message || 
           `Server error: ${error.response.status} ${error.response.statusText}`;
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Error request:', error.request);
    return 'No response received from server. Please check your connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'An unknown error occurred';
  }
};

// Async thunks
export const listExaminations = createAsyncThunk(
  'examinations/list',
  async (filters: ExaminationFilters, { rejectWithValue }) => {
    try {
      const response = await examinationService.listExaminations(filters);
      
      // Validate the response structure
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to fetch examinations');
      }
      
      // Ensure the response has the required properties
      if (!Array.isArray(response.examinations)) {
        console.error('Invalid response structure:', response);
        return rejectWithValue('Invalid response structure from the server');
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getExamination = createAsyncThunk(
  'examinations/get',
  async (examinationId: number, { rejectWithValue }) => {
    try {
      const response = await examinationService.getExamination(examinationId);
      
      if (!response || !response.success || !response.examination) {
        return rejectWithValue(response?.message || 'Failed to fetch examination');
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createExamination = createAsyncThunk(
  'examinations/create',
  async (examinationData: CreateExaminationData, { rejectWithValue }) => {
    try {
      const response = await examinationService.createExamination(examinationData);
      
      if (!response || !response.success || !response.examination) {
        return rejectWithValue(response?.message || 'Failed to create examination');
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateExamination = createAsyncThunk(
  'examinations/update',
  async ({ examinationId, updateData }: { examinationId: number, updateData: UpdateExaminationData }, { rejectWithValue }) => {
    try {
      const response = await examinationService.updateExamination(examinationId, updateData);
      
      if (!response || !response.success || !response.examination) {
        return rejectWithValue(response?.message || 'Failed to update examination');
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateExaminationStatus = createAsyncThunk(
  'examinations/updateStatus',
  async ({ examinationId, status }: { examinationId: number, status: 'started' | 'in_progress' | 'completed' }, { rejectWithValue }) => {
    try {
      const response = await examinationService.updateExaminationStatus(examinationId, status);
      
      if (!response || !response.success || !response.examination) {
        return rejectWithValue(response?.message || 'Failed to update examination status');
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getPetExaminationHistory = createAsyncThunk(
  'examinations/petHistory',
  async (petId: number, { rejectWithValue }) => {
    try {
      const response = await examinationService.getPetExaminationHistory(petId);
      
      if (!response || !response.success || !Array.isArray(response.examinations)) {
        return rejectWithValue(response?.message || 'Failed to fetch pet examination history');
      }
      
      return response;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteExamination = createAsyncThunk(
  'examinations/delete',
  async (examinationId: number, { rejectWithValue }) => {
    try {
      const response = await examinationService.deleteExamination(examinationId);
      
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to delete examination');
      }
      
      return { 
        success: true, 
        examinationId 
      };
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
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
        state.success = false;
      })
      .addCase(listExaminations.fulfilled, (state, action: PayloadAction<{ success: boolean, examinations: Examination[], count: number }>) => {
        state.loading = false;
        state.examinations = action.payload.examinations;
        state.totalCount = action.payload.count;
        state.success = true;
        state.error = null;
      })
      .addCase(listExaminations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Get examination
      .addCase(getExamination.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getExamination.fulfilled, (state, action: PayloadAction<{ success: boolean, examination: Examination }>) => {
        state.loading = false;
        state.currentExamination = action.payload.examination;
        state.success = true;
        state.error = null;
      })
      .addCase(getExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
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
        state.error = null;
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
        state.success = false;
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
        state.error = null;
      })
      .addCase(updateExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Update examination status
      .addCase(updateExaminationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
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
        state.error = null;
      })
      .addCase(updateExaminationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Get pet examination history
      .addCase(getPetExaminationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getPetExaminationHistory.fulfilled, (state, action: PayloadAction<{ success: boolean, examinations: Examination[], count: number }>) => {
        state.loading = false;
        state.petExaminations = action.payload.examinations;
        state.success = true;
        state.error = null;
      })
      .addCase(getPetExaminationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // Delete examination
      .addCase(deleteExamination.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteExamination.fulfilled, (state, action: PayloadAction<{ success: boolean, examinationId?: number }>) => {
        state.loading = false;
        if (action.payload.examinationId && state.currentExamination) {
          state.examinations = state.examinations.filter(
            exam => exam.examination_id !== action.payload.examinationId
          );
          if (state.currentExamination.examination_id === action.payload.examinationId) {
            state.currentExamination = null;
          }
        }
        state.success = true;
        state.error = null;
      })
      .addCase(deleteExamination.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  }
});

export const { resetExaminationState, clearCurrentExamination } = examinationSlice.actions;
export default examinationSlice.reducer;
