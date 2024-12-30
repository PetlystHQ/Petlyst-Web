export type DashboardView = 'overview' | 'clinics';

export type VerificationStatus = 'pending' | 'verified' | 'unverified' | null;

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone_number: string | null;
  location: string | null;
  description: string | null;
  verification_status: 'pending' | 'verified' | 'not_verified' | 'archived';
}

export interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  owner: string;
  lastVisit: string;
} 