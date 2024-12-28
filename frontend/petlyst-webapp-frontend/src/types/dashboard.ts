export type DashboardView = 'overview' | 'clinics';

export type VerificationStatus = 'pending' | 'verified' | 'unverified' | null;

export interface Clinic {
  id: string;
  name: string;
  address: string;
  workingHours: string;
  phone: string;
  status: 'active' | 'inactive';
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