export type DashboardView = 'overview' | 'clinics';

export type VerificationStatus = 'pending' | 'verified' | 'not_verified' | 'archived';

export interface Clinic {
  clinic_id: string;
  clinic_name: string;
  clinic_email: string | null;
  clinic_operator_id: string;
  clinic_description: string | null;
  clinic_verification_status: VerificationStatus;
  clinic_address: string | null;
  clinic_phone_number: string | null;
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