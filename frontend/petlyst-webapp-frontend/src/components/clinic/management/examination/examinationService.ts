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
}

const examinationService = {
  // List examinations with filters
  async listExaminations(filters: ExaminationFilters) {
    const response = await axiosInstance.get('/examinations', {
      params: filters
    });
    return response.data;
  },

  // Get specific examination
  async getExamination(examinationId: number) {
    const response = await axiosInstance.get(`/examinations/${examinationId}`);
    return response.data;
  },

  // Create new examination
  async createExamination(examinationData: CreateExaminationData) {
    const response = await axiosInstance.post('/examinations', examinationData);
    return response.data;
  },

  // Update examination
  async updateExamination(examinationId: number, updateData: UpdateExaminationData) {
    const response = await axiosInstance.put(`/examinations/${examinationId}`, updateData);
    return response.data;
  },

  // Update examination status
  async updateExaminationStatus(examinationId: number, status: 'started' | 'in_progress' | 'completed') {
    const response = await axiosInstance.put(`/examinations/${examinationId}/status`, { status });
    return response.data;
  },

  // Get pet examination history
  async getPetExaminationHistory(petId: number) {
    const response = await axiosInstance.get(`/examinations/pet/${petId}`);
    return response.data;
  },

  // Delete examination
  async deleteExamination(examinationId: number) {
    const response = await axiosInstance.delete(`/examinations/${examinationId}`);
    return response.data;
  }
};

export default examinationService;
