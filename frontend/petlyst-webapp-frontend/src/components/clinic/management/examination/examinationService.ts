// examinationService.ts
import axios from 'axios';

const API_BASE_URL = '/api/examinations';

export interface ExaminationFilter {
  pet_id?: number;
  vet_id?: number;
  status?: string;
  clinic_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface ExaminationData {
  pet_id: number;
  appointment_id?: number | null;
  temperature?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  weight?: number | null;
  notes?: string | null;
}

export interface Examination {
  examination_id: number;
  pet_id: number;
  vet_id: number;
  appointment_id?: number | null;
  status: 'started' | 'in_progress' | 'completed';
  temperature?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  weight?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
  veterinarian_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  examination?: Examination;
  examinations?: Examination[];
  count?: number;
  error?: string;
  [key: string]: any;
}

// Helper function to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const examinationService = {
  // Get all examinations (filtered)
  async getExaminations(filters: ExaminationFilter = {}): Promise<ApiResponse<Examination[]>> {
    try {
      const response = await axios.get<ApiResponse<Examination[]>>(API_BASE_URL, { 
        params: filters,
        ...getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'An error occurred while making the request' };
    }
  },

  // Get a single examination detail
  async getExamination(examinationId: number): Promise<ApiResponse<Examination>> {
    try {
      const response = await axios.get<ApiResponse<Examination>>(
        `${API_BASE_URL}/${examinationId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Error retrieving examination details' };
    }
  },

  // Create a new examination
  async createExamination(examinationData: ExaminationData): Promise<ApiResponse<Examination>> {
    try {
      const response = await axios.post<ApiResponse<Examination>>(
        API_BASE_URL, 
        examinationData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Error creating examination' };
    }
  },

  // Update examination information
  async updateExamination(examinationId: number, updateData: Partial<ExaminationData>): Promise<ApiResponse<Examination>> {
    try {
      const response = await axios.put<ApiResponse<Examination>>(
        `${API_BASE_URL}/${examinationId}`, 
        updateData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Error updating examination' };
    }
  },

  // Update examination status
  async updateExaminationStatus(examinationId: number, status: 'started' | 'in_progress' | 'completed'): Promise<ApiResponse<Examination>> {
    try {
      const response = await axios.put<ApiResponse<Examination>>(
        `${API_BASE_URL}/${examinationId}/status`, 
        { status },
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Error updating status' };
    }
  },

  // Get examination history for a pet
  async getPetExaminationHistory(petId: number): Promise<ApiResponse<Examination[]>> {
    try {
      const response = await axios.get<ApiResponse<Examination[]>>(
        `${API_BASE_URL}/pet/${petId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Error retrieving examination history' };
    }
  },

  // Delete examination
  async deleteExamination(examinationId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete<ApiResponse<any>>(
        `${API_BASE_URL}/${examinationId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Error deleting examination' };
    }
  }
};