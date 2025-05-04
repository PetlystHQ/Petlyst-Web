import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Diagnosis, 
  DiagnosisData, 
  DiagnosisFilters,
  StandardDiagnosis,
  StandardDiagnosisFormData,
  createDiagnosis as apiCreateDiagnosis,
  getDiagnosis as apiGetDiagnosis,
  listDiagnoses as apiListDiagnoses,
  updateDiagnosis as apiUpdateDiagnosis,
  deleteDiagnosis as apiDeleteDiagnosis,
  getPetDiagnoses as apiGetPetDiagnoses,
  getExaminationDiagnoses as apiGetExaminationDiagnoses,
  getStandardDiagnoses as apiGetStandardDiagnoses,
  createStandardDiagnosis as apiCreateStandardDiagnosis,
  updateStandardDiagnosis as apiUpdateStandardDiagnosis,
  deleteStandardDiagnosis as apiDeleteStandardDiagnosis
} from './diagnosisService';

// Define the state interface
interface DiagnosisState {
  diagnoses: Diagnosis[];
  currentDiagnosis: Diagnosis | null;
  standardDiagnoses: StandardDiagnosis[];
  loading: boolean;
  error: string | null;
  success: boolean;
  totalCount: number;
}

// Initial state
const initialState: DiagnosisState = {
  diagnoses: [],
  currentDiagnosis: null,
  standardDiagnoses: [],
  loading: false,
  error: null,
  success: false,
  totalCount: 0
};

// Async thunks for API operations
export const createDiagnosis = createAsyncThunk(
  'diagnoses/create',
  async (diagnosisData: DiagnosisData, { rejectWithValue }) => {
    try {
      return await apiCreateDiagnosis(diagnosisData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create diagnosis');
    }
  }
);

export const getDiagnosis = createAsyncThunk(
  'diagnoses/getById',
  async (diagnosisId: number, { rejectWithValue }) => {
    try {
      return await apiGetDiagnosis(diagnosisId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to get diagnosis ${diagnosisId}`);
    }
  }
);

export const listDiagnoses = createAsyncThunk(
  'diagnoses/list',
  async (filters: DiagnosisFilters = {}, { rejectWithValue }) => {
    try {
      return await apiListDiagnoses(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to list diagnoses');
    }
  }
);

export const updateDiagnosis = createAsyncThunk(
  'diagnoses/update',
  async ({ diagnosisId, diagnosisData }: { diagnosisId: number, diagnosisData: Partial<DiagnosisData> }, { rejectWithValue }) => {
    try {
      return await apiUpdateDiagnosis(diagnosisId, diagnosisData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to update diagnosis ${diagnosisId}`);
    }
  }
);

export const deleteDiagnosis = createAsyncThunk(
  'diagnoses/delete',
  async (diagnosisId: number, { rejectWithValue }) => {
    try {
      await apiDeleteDiagnosis(diagnosisId);
      return diagnosisId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to delete diagnosis ${diagnosisId}`);
    }
  }
);

export const getPetDiagnoses = createAsyncThunk(
  'diagnoses/getByPet',
  async (petId: number, { rejectWithValue }) => {
    try {
      return await apiGetPetDiagnoses(petId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to get diagnoses for pet ${petId}`);
    }
  }
);

export const getExaminationDiagnoses = createAsyncThunk(
  'diagnoses/getByExamination',
  async (examinationId: number, { rejectWithValue }) => {
    try {
      return await apiGetExaminationDiagnoses(examinationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to get diagnoses for examination ${examinationId}`);
    }
  }
);

export const getStandardDiagnoses = createAsyncThunk(
  'diagnoses/getStandard',
  async (species: string | undefined, { rejectWithValue }) => {
    try {
      return await apiGetStandardDiagnoses(species);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get standard diagnoses');
    }
  }
);

// Add thunks for standard diagnosis management
export const createStandardDiagnosis = createAsyncThunk(
  'diagnoses/createStandard',
  async (diagnosisData: StandardDiagnosisFormData, { rejectWithValue }) => {
    try {
      return await apiCreateStandardDiagnosis(diagnosisData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create standard diagnosis');
    }
  }
);

export const updateStandardDiagnosis = createAsyncThunk(
  'diagnoses/updateStandard',
  async ({ code, diagnosisData }: { code: string, diagnosisData: Partial<StandardDiagnosisFormData> }, { rejectWithValue }) => {
    try {
      return await apiUpdateStandardDiagnosis(code, diagnosisData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to update standard diagnosis ${code}`);
    }
  }
);

export const deleteStandardDiagnosis = createAsyncThunk(
  'diagnoses/deleteStandard',
  async (code: string, { rejectWithValue }) => {
    try {
      await apiDeleteStandardDiagnosis(code);
      return code;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || `Failed to delete standard diagnosis ${code}`);
    }
  }
);

// Create the slice
const diagnosisSlice = createSlice({
  name: 'diagnoses',
  initialState,
  reducers: {
    resetDiagnosisState: (state) => {
      state.success = false;
      state.error = null;
    },
    clearCurrentDiagnosis: (state) => {
      state.currentDiagnosis = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create diagnosis
      .addCase(createDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDiagnosis.fulfilled, (state, action: PayloadAction<Diagnosis>) => {
        state.loading = false;
        state.success = true;
        state.diagnoses.unshift(action.payload);
        state.currentDiagnosis = action.payload;
        state.totalCount += 1;
      })
      .addCase(createDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get diagnosis by ID
      .addCase(getDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDiagnosis.fulfilled, (state, action: PayloadAction<Diagnosis>) => {
        state.loading = false;
        state.currentDiagnosis = action.payload;
      })
      .addCase(getDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // List diagnoses
      .addCase(listDiagnoses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listDiagnoses.fulfilled, (state, action: PayloadAction<Diagnosis[]>) => {
        state.loading = false;
        state.diagnoses = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(listDiagnoses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update diagnosis
      .addCase(updateDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDiagnosis.fulfilled, (state, action: PayloadAction<Diagnosis>) => {
        state.loading = false;
        state.success = true;
        state.diagnoses = state.diagnoses.map(diagnosis => 
          diagnosis.diagnosis_id === action.payload.diagnosis_id ? action.payload : diagnosis
        );
        state.currentDiagnosis = action.payload;
      })
      .addCase(updateDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete diagnosis
      .addCase(deleteDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDiagnosis.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.success = true;
        state.diagnoses = state.diagnoses.filter(
          diagnosis => diagnosis.diagnosis_id !== action.payload
        );
        if (state.currentDiagnosis?.diagnosis_id === action.payload) {
          state.currentDiagnosis = null;
        }
        state.totalCount -= 1;
      })
      .addCase(deleteDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get pet diagnoses
      .addCase(getPetDiagnoses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPetDiagnoses.fulfilled, (state, action: PayloadAction<Diagnosis[]>) => {
        state.loading = false;
        state.diagnoses = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(getPetDiagnoses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get examination diagnoses
      .addCase(getExaminationDiagnoses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExaminationDiagnoses.fulfilled, (state, action: PayloadAction<Diagnosis[]>) => {
        state.loading = false;
        state.diagnoses = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(getExaminationDiagnoses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get standard diagnoses
      .addCase(getStandardDiagnoses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStandardDiagnoses.fulfilled, (state, action: PayloadAction<StandardDiagnosis[]>) => {
        state.loading = false;
        state.standardDiagnoses = action.payload;
      })
      .addCase(getStandardDiagnoses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create standard diagnosis
      .addCase(createStandardDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStandardDiagnosis.fulfilled, (state, action: PayloadAction<StandardDiagnosis>) => {
        state.loading = false;
        state.success = true;
        state.standardDiagnoses = [action.payload, ...state.standardDiagnoses];
      })
      .addCase(createStandardDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update standard diagnosis
      .addCase(updateStandardDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStandardDiagnosis.fulfilled, (state, action: PayloadAction<StandardDiagnosis>) => {
        state.loading = false;
        state.success = true;
        state.standardDiagnoses = state.standardDiagnoses.map(diagnosis => 
          diagnosis.code === action.payload.code ? action.payload : diagnosis
        );
      })
      .addCase(updateStandardDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete standard diagnosis
      .addCase(deleteStandardDiagnosis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStandardDiagnosis.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.success = true;
        state.standardDiagnoses = state.standardDiagnoses.filter(
          diagnosis => diagnosis.code !== action.payload
        );
      })
      .addCase(deleteStandardDiagnosis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions and reducer
export const { resetDiagnosisState, clearCurrentDiagnosis } = diagnosisSlice.actions;
export default diagnosisSlice.reducer;
