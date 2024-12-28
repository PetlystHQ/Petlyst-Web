import { DashboardView } from '../types/dashboard';

export const DASHBOARD_VIEWS: Record<DashboardView, DashboardView> = {
  overview: 'overview',
  clinics: 'clinics',
};

export const VIEW_TITLES: Record<DashboardView, string> = {
  overview: 'Overview',
  clinics: 'My Clinics',
};

export const API_ENDPOINTS = {
  VERIFICATION_STATUS: 'http://localhost:3000/api/veterinarian/verification-status',
  CLINICS: 'http://localhost:3000/api/veterinarian/clinics',
}; 