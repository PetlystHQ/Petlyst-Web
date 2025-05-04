import axios from 'axios';
import axiosInstance from '../../../../utils/axiosConfig';

// Interfaces based on the backend model
export interface Examination {
  examination_id: number;
  pet_id: number;
  pet_name?: string;
  pet_species?: string;
  pet_breed?: string;
  vet_id: number;
  veterinarian_name?: string;
  appointment_id: number | null;
  status: 'started' | 'in_progress' | 'completed';
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExaminationFilters {
  pet_id?: number;
  vet_id?: number;
  status?: string;
  clinic_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface CreateExaminationData {
  pet_id: number;
  appointment_id?: number;
  temperature?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  weight?: number;
  notes?: string;
}

export interface UpdateExaminationData {
  status?: 'started' | 'in_progress' | 'completed';
  temperature?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  weight?: number;
  notes?: string;
  appointment_id?: number;
}

// Helper for logging API calls with context
const logApiCall = (method: string, endpoint: string, data?: any) => {
  console.log(`API ${method} - ${endpoint}`, data ? { data } : '');
};

// Helper for handling API errors
const handleApiCallError = (error: any, context: string) => {
  if (error.response) {
    console.error(`API Error (${context}) - Response:`, {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    console.error(`API Error (${context}) - Request:`, error.request);
  } else {
    console.error(`API Error (${context}):`, error.message);
  }
  throw error;
};

const examinationService = {
  // List examinations with filters
  async listExaminations(filters: ExaminationFilters) {
    try {
      logApiCall('GET', '/examinations', filters);
      const response = await axiosInstance.get('/examinations', {
        params: filters
      });
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'listExaminations');
    }
  },

  // Get specific examination
  async getExamination(examinationId: number) {
    try {
      logApiCall('GET', `/examinations/${examinationId}`);
      const response = await axiosInstance.get(`/examinations/${examinationId}`);
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'getExamination');
    }
  },

  // Create new examination
  async createExamination(examinationData: CreateExaminationData) {
    try {
      logApiCall('POST', '/examinations', examinationData);
      const response = await axiosInstance.post('/examinations', examinationData);
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'createExamination');
    }
  },

  // Update examination
  async updateExamination(examinationId: number, updateData: UpdateExaminationData) {
    try {
      logApiCall('PUT', `/examinations/${examinationId}`, updateData);
      const response = await axiosInstance.put(`/examinations/${examinationId}`, updateData);
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'updateExamination');
    }
  },

  // Update examination status
  async updateExaminationStatus(examinationId: number, status: 'started' | 'in_progress' | 'completed') {
    try {
      logApiCall('PUT', `/examinations/${examinationId}/status`, { status });
      const response = await axiosInstance.put(`/examinations/${examinationId}/status`, { status });
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'updateExaminationStatus');
    }
  },

  // Get pet examination history
  async getPetExaminationHistory(petId: number) {
    try {
      logApiCall('GET', `/examinations/pet/${petId}`);
      const response = await axiosInstance.get(`/examinations/pet/${petId}`);
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'getPetExaminationHistory');
    }
  },

  // Delete examination
  async deleteExamination(examinationId: number) {
    try {
      logApiCall('DELETE', `/examinations/${examinationId}`);
      const response = await axiosInstance.delete(`/examinations/${examinationId}`);
      return response.data;
    } catch (error) {
      return handleApiCallError(error, 'deleteExamination');
    }
  }
};

export default examinationService;
