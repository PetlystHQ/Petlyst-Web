import { DashboardView } from '../types/dashboard';

// API base URL - Default to localhost if environment variable is not set
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const DASHBOARD_VIEWS: Record<DashboardView, DashboardView> = {
  overview: 'overview',
  clinics: 'clinics',
};

export const VIEW_TITLES: Record<DashboardView, string> = {
  overview: 'Overview',
  clinics: 'My Clinics',
};

export const API_ENDPOINTS = {
  VERIFICATION_STATUS: `${API_URL}/api/veterinarian/verification-status`,
  CLINICS: `${API_URL}/api/veterinarian/clinics`,
}; 