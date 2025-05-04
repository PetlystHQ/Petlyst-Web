import axios from 'axios';
import axiosInstance from '../../../../utils/axiosConfig';

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
  code: string;
  name: string;
  description?: string;
  category?: string;
  species: string;
  is_active?: boolean;
}

// Standard diagnosis creation/update data
export interface StandardDiagnosisFormData {
  code?: string;
  name: string;
  description?: string;
  category?: string;
  species: string;
  is_active?: boolean;
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

// Get standard diagnoses for dropdown selection
export const getStandardDiagnoses = async (species?: string): Promise<StandardDiagnosis[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (species) {
      queryParams.append('species', species);
    }
    
    const response = await axiosInstance.get(`/diagnoses/standard?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error getting standard diagnoses:', error);
    throw error;
  }
};

// Create a new standard diagnosis
export const createStandardDiagnosis = async (data: StandardDiagnosisFormData): Promise<StandardDiagnosis> => {
  try {
    const response = await axiosInstance.post('/diagnoses/standard', data);
    return response.data;
  } catch (error) {
    console.error('Error creating standard diagnosis:', error);
    throw error;
  }
};

// Update a standard diagnosis
export const updateStandardDiagnosis = async (code: string, data: Partial<StandardDiagnosisFormData>): Promise<StandardDiagnosis> => {
  try {
    const response = await axiosInstance.put(`/diagnoses/standard/${code}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating standard diagnosis ${code}:`, error);
    throw error;
  }
};

// Delete a standard diagnosis
export const deleteStandardDiagnosis = async (code: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/diagnoses/standard/${code}`);
  } catch (error) {
    console.error(`Error deleting standard diagnosis ${code}:`, error);
    throw error;
  }
};
