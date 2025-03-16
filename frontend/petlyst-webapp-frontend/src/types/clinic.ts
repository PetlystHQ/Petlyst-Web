export interface SocialMediaLink {
  platform: string;
  url: string;
}

// PhoneNumberEntry interface updated to match database enum values
export type PhoneTypeEnum = 'fixed_line' | 'mobile_number' | '';

export interface PhoneNumberEntry {
  type: PhoneTypeEnum;  // Using the database enum values: 'fixed_line' or 'mobile_number' or empty string for initial state
  number: string;
}

/**
 * @deprecated This interface is no longer used as latitude and longitude have been removed from the database
 */
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface ClinicFormData {
  name: string;
  clinicType: string;
  biography: string;
  establishment_date: string;
  social_media_links: SocialMediaLink[];
  
  // Location information
  province: string;
  district: string;
  address: string;
  /** @deprecated coordinates are no longer stored in the database */
  coordinates?: LocationCoordinates;
  
  phone_numbers: PhoneNumberEntry[];
  email: string;
  description: string;
  
  // Communication preferences
  showPhoneNumber: boolean;
  allowDirectMessages: boolean;
  showMailAddress: boolean;
  
  // Service information
  servedAnimalTypes: string[];
  medicalServices: string[];
  additionalServices: string[];
  
  // Appointment information
  available_days: string[];
  emergency_available_days: string[];
  has_emergency_service: boolean;
  is_open_24_7: boolean;
  slot_duration: number;
  opening_time: string;
  closing_time: string;
  allow_online_meetings: boolean;
  
  // Registration information
  taxIdentificationNumber: string;
  veterinaryLicenseNumber: string;
}

export type FormStep = 'clinic_details' | 'locations' | 'communication' | 'visuals' | 'services' | 'appointments' | 'tax_registration'; 