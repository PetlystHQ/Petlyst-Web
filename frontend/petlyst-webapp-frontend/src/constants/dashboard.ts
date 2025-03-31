import { DashboardView } from '../types/dashboard';

// API base URL - Default to localhost if environment variable is not set
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const DASHBOARD_VIEWS: Record<DashboardView, DashboardView> = {
  overview: 'overview',
  clinics: 'clinics',
  profile: 'profile',
};

export const VIEW_TITLES: Record<DashboardView, string> = {
  overview: 'Overview',
  clinics: 'My Clinic',
  profile: 'My Profile',
};

export const API_ENDPOINTS = {
  VERIFICATION_STATUS: `${API_URL}/api/veterinarian/verification-status`,
  CLINICS: `${API_URL}/api/veterinarian/clinics`,
  INCOMPLETE_CLINICS: `${API_URL}/api/clinics/incomplete`,
  EDUCATION: `${API_URL}/api/veterinarian/education`,
  CERTIFICATIONS: `${API_URL}/api/veterinarian/certifications`,
  EXPERTISE: `${API_URL}/api/veterinarian/expertise`,
  PROFILE: `${API_URL}/api/veterinarian/profile`,
  // Veterinarian photos endpoints
  VET_PHOTOS: `${API_URL}/api/veterinarian/photos`,
  UPLOAD_VET_PHOTO: `${API_URL}/api/veterinarian/upload-photo`,
  // Profile visibility endpoint
  PROFILE_VISIBILITY: `${API_URL}/api/veterinarian/profile-visibility`
}; 