import { DashboardView } from '../types/dashboard';

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

// Relative paths intended to be passed to `axiosInstance` (which has
// `${API_URL}/api` baked into its baseURL). Do not prepend `/api/` —
// the interceptor + baseURL handle that.
export const API_ENDPOINTS = {
  VERIFICATION_STATUS: '/veterinarian/verification-status',
  CLINICS: '/veterinarian/clinics',
  INCOMPLETE_CLINICS: '/veterinarian/incomplete-clinics',
  EDUCATION: '/veterinarian/education',
  CERTIFICATIONS: '/veterinarian/certifications',
  EXPERTISE: '/veterinarian/expertise',
  PROFILE: '/veterinarian/profile',
  // Veterinarian photos endpoints
  VET_PHOTOS: '/veterinarian/photos',
  UPLOAD_VET_PHOTO: '/veterinarian/upload-photo',
  // Profile visibility endpoint
  PROFILE_VISIBILITY: '/veterinarian/profile-visibility',
  // Public profile endpoint
  PUBLIC_PROFILE: '/veterinarian/public-profile',
  PUBLIC_PROFILE_BY_SLUG: '/veterinarian/public-profile-by-slug',
  // Public profiles list endpoint
  PUBLIC_PROFILES: '/veterinarian/public-profiles',
  PROFILE_COMPLETION: '/veterinarian/profile-completion',
  ENSURE_SLUG: '/veterinarian/ensure-slug',
};
