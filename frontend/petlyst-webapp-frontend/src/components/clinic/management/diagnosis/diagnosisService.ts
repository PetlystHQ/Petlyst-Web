import axios from 'axios';
import axiosInstance from '../../../../utils/axiosConfig';
import { API_URL } from '../../../../config/api';

// Diagnosis Interface
export interface Diagnosis {
  diagnosis_id: number;
  examination_id: number;
  diagnosis_type: 'standard' | 'custom';
  diagnosis_code?: string;
  diagnosis_name: string;
  description?: string;
  diagnosis_date: string;
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data from related tables
  pet_id?: number;
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  vet_id?: number;
  veterinarian_name?: string;
  examination_date?: string;
}

// Diagnosis creation/update data
export interface DiagnosisData {
  examination_id: number;
  diagnosis_type: 'standard' | 'custom';
  diagnosis_code?: string;
  diagnosis_name: string;
  description?: string;
  diagnosis_date?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

// Standard diagnosis for dropdown
export interface StandardDiagnosis {
  diagnosis_id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  species: string;
  is_active: boolean;
  veterinarian_id?: number;
}

// Standard diagnosis creation/update data
export interface StandardDiagnosisFormData {
  code?: string;
  name: string;
  description?: string;
  category?: string;
  species: string;
  is_active: boolean;
}

// Filters for listing diagnoses
export interface DiagnosisFilters {
  examination_id?: number;
  diagnosis_type?: 'standard' | 'custom';
  diagnosis_code?: string;
  diagnosis_name?: string;
  pet_id?: number;
  vet_id?: number;
  start_date?: string;
  end_date?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  limit?: number;
  offset?: number;
}

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('token');

// Create base axios instance with authorization header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Create a new diagnosis
export const createDiagnosis = async (diagnosisData: DiagnosisData): Promise<Diagnosis> => {
  try {
    const response = await axiosInstance.post('/diagnoses', diagnosisData);
    return response.data;
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    throw error;
  }
};

// Get a diagnosis by ID
export const getDiagnosis = async (diagnosisId: number): Promise<Diagnosis> => {
  try {
    const response = await axiosInstance.get(`/diagnoses/${diagnosisId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting diagnosis ${diagnosisId}:`, error);
    throw error;
  }
};

// List diagnoses with filters
export const listDiagnoses = async (filters: DiagnosisFilters = {}): Promise<Diagnosis[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/diagnoses?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error listing diagnoses:', error);
    throw error;
  }
};

// Update a diagnosis
export const updateDiagnosis = async (diagnosisId: number, diagnosisData: Partial<DiagnosisData>): Promise<Diagnosis> => {
  try {
    const response = await axiosInstance.put(`/diagnoses/${diagnosisId}`, diagnosisData);
    return response.data;
  } catch (error) {
    console.error(`Error updating diagnosis ${diagnosisId}:`, error);
    throw error;
  }
};

// Delete a diagnosis
export const deleteDiagnosis = async (diagnosisId: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/diagnoses/${diagnosisId}`);
  } catch (error) {
    console.error(`Error deleting diagnosis ${diagnosisId}:`, error);
    throw error;
  }
};

// Get diagnoses for a specific pet
export const getPetDiagnoses = async (petId: number): Promise<Diagnosis[]> => {
  try {
    const response = await axiosInstance.get(`/diagnoses/pet/${petId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting diagnoses for pet ${petId}:`, error);
    throw error;
  }
};

// Get diagnoses for a specific examination
export const getExaminationDiagnoses = async (examinationId: number): Promise<Diagnosis[]> => {
  try {
    const response = await axiosInstance.get(`/diagnoses/examination/${examinationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting diagnoses for examination ${examinationId}:`, error);
    throw error;
  }
};

// Get all standard diagnoses (optional species filter)
export const getStandardDiagnoses = async (species?: string): Promise<StandardDiagnosis[]> => {
  try {
    const url = '/api/diagnoses/standard';
    const params = species ? { species } : {};
    const response = await api.get(url, { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching standard diagnoses:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch standard diagnoses');
  }
};

// Get veterinarian's custom diagnoses
export const getVeterinarianDiagnoses = async (): Promise<StandardDiagnosis[]> => {
  try {
    const response = await api.get('/api/diagnoses/standard/veterinarian');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching veterinarian diagnoses:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch veterinarian diagnoses');
  }
};

// Get a standard diagnosis by ID
export const getStandardDiagnosisById = async (id: number): Promise<StandardDiagnosis> => {
  try {
    const response = await api.get(`/api/diagnoses/standard/id/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching standard diagnosis ${id}:`, error);
    throw new Error(error.response?.data?.message || `Failed to fetch standard diagnosis ${id}`);
  }
};

// Get a standard diagnosis by code (backward compatibility)
export const getStandardDiagnosis = async (code: string): Promise<StandardDiagnosis> => {
  try {
    const response = await api.get(`/api/diagnoses/standard/code/${code}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching standard diagnosis ${code}:`, error);
    throw new Error(error.response?.data?.message || `Failed to fetch standard diagnosis ${code}`);
  }
};

// Create a new standard diagnosis 
export const createStandardDiagnosis = async (diagnosisData: StandardDiagnosisFormData): Promise<StandardDiagnosis> => {
  try {
    const response = await api.post('/api/diagnoses/standard', diagnosisData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating standard diagnosis:', error);
    throw new Error(error.response?.data?.message || 'Failed to create standard diagnosis');
  }
};

// Update a standard diagnosis by ID
export const updateStandardDiagnosisById = async (id: number, diagnosisData: Partial<StandardDiagnosisFormData>): Promise<StandardDiagnosis> => {
  try {
    const response = await api.put(`/api/diagnoses/standard/id/${id}`, diagnosisData);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating standard diagnosis ${id}:`, error);
    throw new Error(error.response?.data?.message || `Failed to update standard diagnosis ${id}`);
  }
};

// Update a standard diagnosis by code (backward compatibility)
export const updateStandardDiagnosis = async (code: string, diagnosisData: Partial<StandardDiagnosisFormData>): Promise<StandardDiagnosis> => {
  try {
    const response = await api.put(`/api/diagnoses/standard/code/${code}`, diagnosisData);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating standard diagnosis ${code}:`, error);
    throw new Error(error.response?.data?.message || `Failed to update standard diagnosis ${code}`);
  }
};

// Delete a standard diagnosis by ID
export const deleteStandardDiagnosisById = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/diagnoses/standard/id/${id}`);
  } catch (error: any) {
    console.error(`Error deleting standard diagnosis ${id}:`, error);
    throw new Error(error.response?.data?.message || `Failed to delete standard diagnosis ${id}`);
  }
};

// Delete a standard diagnosis by code (backward compatibility)
export const deleteStandardDiagnosis = async (code: string): Promise<void> => {
  try {
    await api.delete(`/api/diagnoses/standard/code/${code}`);
  } catch (error: any) {
    console.error(`Error deleting standard diagnosis ${code}:`, error);
    throw new Error(error.response?.data?.message || `Failed to delete standard diagnosis ${code}`);
  }
};
