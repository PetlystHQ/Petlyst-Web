import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getApiErrorMessage } from '../../../../utils/errorMessage';
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
  createStandardDiagnosis as apiCreateStandardDiagnosis
} from './diagnosisService';
import axios from 'axios';
import { API_URL } from '../../../../config/api';

// Backend tarafında kod oluşturulacağı için form verisini güncelleyelim
type CreateStandardDiagnosisData = Omit<StandardDiagnosisFormData, 'code'> & { code?: string };

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

// Define API instance
const api = axios.create({
  baseURL: API_URL, // Adjust this to your API URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set up API request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to handle API errors
const handleApiError = (error: any, rejectWithValue: any) => {
  const errorMessage = getApiErrorMessage(error, 'An error occurred');
  return rejectWithValue(errorMessage);
};

// Async thunks for API operations
export const createDiagnosis = createAsyncThunk(
  'diagnoses/create',
  async (diagnosisData: DiagnosisData, { rejectWithValue }) => {
    try {
      return await apiCreateDiagnosis(diagnosisData);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create diagnosis'));
    }
  }
);

export const getDiagnosis = createAsyncThunk(
  'diagnoses/getById',
  async (diagnosisId: number, { rejectWithValue }) => {
    try {
      return await apiGetDiagnosis(diagnosisId);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, `Failed to get diagnosis ${diagnosisId}`));
    }
  }
);

export const listDiagnoses = createAsyncThunk(
  'diagnoses/list',
  async (filters: DiagnosisFilters = {}, { rejectWithValue }) => {
    try {
      return await apiListDiagnoses(filters);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to list diagnoses'));
    }
  }
);

export const updateDiagnosis = createAsyncThunk(
  'diagnoses/update',
  async ({ diagnosisId, diagnosisData }: { diagnosisId: number, diagnosisData: Partial<DiagnosisData> }, { rejectWithValue }) => {
    try {
      return await apiUpdateDiagnosis(diagnosisId, diagnosisData);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, `Failed to update diagnosis ${diagnosisId}`));
    }
  }
);

export const deleteDiagnosis = createAsyncThunk(
  'diagnoses/delete',
  async (diagnosisId: number, { rejectWithValue }) => {
    try {
      await apiDeleteDiagnosis(diagnosisId);
      return diagnosisId;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, `Failed to delete diagnosis ${diagnosisId}`));
    }
  }
);

export const getPetDiagnoses = createAsyncThunk(
  'diagnoses/getByPet',
  async (petId: number, { rejectWithValue }) => {
    try {
      return await apiGetPetDiagnoses(petId);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, `Failed to get diagnoses for pet ${petId}`));
    }
  }
);

export const getExaminationDiagnoses = createAsyncThunk(
  'diagnoses/getByExamination',
  async (examinationId: number, { rejectWithValue }) => {
    try {
      return await apiGetExaminationDiagnoses(examinationId);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, `Failed to get diagnoses for examination ${examinationId}`));
    }
  }
);

export const getStandardDiagnoses = createAsyncThunk(
  'diagnoses/getStandard',
  async (species: string | undefined, { rejectWithValue }) => {
    try {
      return await apiGetStandardDiagnoses(species);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to get standard diagnoses'));
    }
  }
);

// Add thunks for standard diagnosis management
export const createStandardDiagnosis = createAsyncThunk(
  'diagnoses/createStandard',
  async (diagnosisData: CreateStandardDiagnosisData, { rejectWithValue }) => {
    try {
      return await apiCreateStandardDiagnosis(diagnosisData as StandardDiagnosisFormData);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to create standard diagnosis'));
    }
  }
);

export const updateStandardDiagnosis = createAsyncThunk(
  'diagnoses/updateStandardDiagnosis',
  async (
    params: { 
      code?: string; 
      id?: number; 
      diagnosisData: Partial<StandardDiagnosisFormData> 
    }, 
    { rejectWithValue }
  ) => {
    try {
      let response;
      
      if (params.id) {
        // Use ID-based update
        response = await api.put(`/api/diagnoses/standard/id/${params.id}`, params.diagnosisData);
      } else if (params.code) {
        // Use code-based update for backward compatibility
        response = await api.put(`/api/diagnoses/standard/code/${params.code}`, params.diagnosisData);
      } else {
        return rejectWithValue('Either diagnosis ID or code must be provided');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

export const deleteStandardDiagnosis = createAsyncThunk(
  'diagnoses/deleteStandardDiagnosis',
  async (diagnosisIdOrCode: number | string, { rejectWithValue }) => {
    try {
      let response;
      
      if (typeof diagnosisIdOrCode === 'number') {
        // Use ID-based deletion
        response = await api.delete(`/api/diagnoses/standard/id/${diagnosisIdOrCode}`);
      } else {
        // Use code-based deletion for backward compatibility
        response = await api.delete(`/api/diagnoses/standard/code/${diagnosisIdOrCode}`);
      }
      
      return { id: diagnosisIdOrCode, response: response.data };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
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
