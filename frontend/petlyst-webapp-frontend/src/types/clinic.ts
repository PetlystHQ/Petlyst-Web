export interface SocialMediaLink {
  platform: string;
  url: string;
}

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
  coordinates?: LocationCoordinates;
  
  phone_number: string;
  description: string;
  
  // Communication preferences
  showPhoneNumber: boolean;
  allowDirectMessages: boolean;
  
  // Service information
  servedAnimalTypes: string[];
  medicalServices: string[];
  additionalServices: string[];
  
  // Registration information
  taxIdentificationNumber: string;
  veterinaryLicenseNumber: string;
}

export type FormStep = 'clinic_details' | 'locations' | 'communication' | 'visuals' | 'services' | 'tax_registration'; 