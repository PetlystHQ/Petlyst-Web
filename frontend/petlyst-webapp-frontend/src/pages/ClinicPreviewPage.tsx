import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { RootState } from '../store';
import { API_URL } from '../config/api';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { MapComponent } from '../components/clinic/forms/MapComponent';
import { ClinicFormData, PhoneNumberEntry, PhoneTypeEnum } from '../types/clinic';
import { getApiErrorMessage, getApiErrorStatus, getApiErrorResponse } from '../utils/errorMessage';
// Window augmentation for the Google Maps SDK loaded via script tag.
// The `google` namespace itself comes from `@types/google.maps`.
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

interface PhoneNumber {
  type: string;
  number: string;
}

interface SocialMediaLink {
  platform: string;
  url: string;
}

interface ClinicDetails {
  clinic_id: string;
  clinic_name: string;
  clinic_type: string;
  clinic_description: string;
  clinic_address: string;
  clinic_verification_status: string;
  clinic_created_at: string;
  clinic_updated_at: string;
  establishment_year: number;
  establishment_month: number;
  province: string;
  district: string;
  opening_time: string;
  closing_time: string;
  is_open_24_7: string;
  available_days: boolean[];
  emergency_available_days: boolean[];
  tax_identification_number: string;
  veterinary_license_number: string;
  phone_numbers: PhoneNumber[];
  social_media: SocialMediaLink[];
  animal_types: string[];
  medical_services: string[];
  additional_services: string[];
  allow_online_meetings: boolean;
  photos: { url: string }[];
  clinic_email: string;
  clinic_operator_id: string;
  latitude?: number;
  longitude?: number;
  slot_duration?: number;
  has_emergency_service?: boolean;
  showPhoneNumber?: boolean;
  showMailAddress?: boolean;
  allowDirectMessages?: boolean;
  show_phone_number?: boolean;
  show_mail_address?: boolean;
  allow_direct_messages?: boolean;
}

const ClinicPreviewPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [clinic, setClinic] = useState<ClinicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Photo gallery states
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingImages, setLoadingImages] = useState<{[key: number]: boolean}>({});
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [clinicPhotos, setClinicPhotos] = useState<{url: string}[]>([]);

  useEffect(() => {
    const fetchClinicDetails = async () => {
      if (!user) {
        console.error('User not found in Redux state');
        setUnauthorized(true);
        return;
      }
      
      console.log('===== FETCHING CLINIC DETAILS =====');
      console.log('User from Redux:', user);
      console.log('Clinic ID from params:', clinicId);
      
      setLoading(true);
      try {
        console.log('Making API request to:', `${API_URL}/api/clinics/${clinicId}`);
        const response = await axiosInstance.get(`/clinics/${clinicId}`);
        
        console.log('===== API RESPONSE =====');
        console.log('Full API response:', response);
        console.log('Clinic data:', response.data?.clinic);
        console.log('Additional data:', {
          clinic_locations: response.data?.clinic_locations || 'Not provided',
          hasLocations: Boolean(response.data?.clinic_locations)
        });
        
        if (!response.data.clinic) {
          console.error('No clinic data in API response');
          setError('No clinic data found');
          setLoading(false);
          return;
        }
        
        const clinicData = { ...response.data.clinic };
        
        // Debug working hours data
        console.log('===== WORKING HOURS DATA DEBUG =====');
        console.log('Opening Time:', clinicData.opening_time || 'Not Found');
        console.log('Closing Time:', clinicData.closing_time || 'Not Found');
        console.log('Is Open 24/7:', clinicData.is_open_24_7 || 'Not Found');
        console.log('Slot Duration:', clinicData.slot_duration || 'Not Found');
        console.log('Available Days:', clinicData.available_days || 'Not Found');
        
        // Debug services data
        console.log('===== SERVICES DATA DEBUGGING =====');
        console.log('Animal types directly from API:', clinicData.animal_types);
        console.log('Medical services directly from API:', clinicData.medical_services);
        console.log('Additional services directly from API:', clinicData.additional_services);
        
        // Ensure service arrays are initialized
        if (!clinicData.animal_types || !Array.isArray(clinicData.animal_types)) {
          console.log('Initializing empty animal_types array');
          clinicData.animal_types = [];
        }
        
        if (!clinicData.medical_services || !Array.isArray(clinicData.medical_services)) {
          console.log('Initializing empty medical_services array');
          clinicData.medical_services = [];
        }
        
        if (!clinicData.additional_services || !Array.isArray(clinicData.additional_services)) {
          console.log('Initializing empty additional_services array');
          clinicData.additional_services = [];
        }
        
        // Check for location data with more explicit logging
        console.log('===== LOCATION DATA IN MAIN CLINIC OBJECT =====');
        console.log('Address:', clinicData.clinic_address || 'Not found');
        console.log('Province:', clinicData.province || 'Not found');
        console.log('District:', clinicData.district || 'Not found');
        console.log('Latitude:', clinicData.latitude || 'Not found');
        console.log('Longitude:', clinicData.longitude || 'Not found');
        
        // Add a temporary flag to check if we have essential location data
        let hasLocationData = Boolean(
          clinicData.clinic_address && 
          clinicData.province && 
          clinicData.district
        );
        
        console.log('Has basic location data:', hasLocationData);

        // Check if clinic_locations might be in a nested object
        if (response.data.clinic_locations) {
          console.log('===== FOUND CLINIC_LOCATIONS OBJECT =====');
          console.log('clinic_locations data:', response.data.clinic_locations);
          
          // If location data is in a separate object, merge it with clinic data
          if (response.data.clinic_locations.length > 0) {
            console.log('Found location data items:', response.data.clinic_locations.length);
            const locationData = response.data.clinic_locations[0];
            
            // Log the location data
            console.log('First location item:', locationData);
            
            // Update clinic data with location data, preserving existing values if they exist
            if (locationData.clinic_address) clinicData.clinic_address = locationData.clinic_address;
            if (locationData.province) clinicData.province = locationData.province;
            if (locationData.district) clinicData.district = locationData.district;
            
            // Handle number conversion for coordinates
            if (locationData.latitude) {
              // Ensure latitude is a number
              clinicData.latitude = typeof locationData.latitude === 'string' 
                ? parseFloat(locationData.latitude) 
                : locationData.latitude;
            }
            
            if (locationData.longitude) {
              // Ensure longitude is a number
              clinicData.longitude = typeof locationData.longitude === 'string'
                ? parseFloat(locationData.longitude)
                : locationData.longitude;
            }
            
            console.log('===== MERGED LOCATION DATA =====');
            console.log('Updated clinic_address:', clinicData.clinic_address || 'Still missing');
            console.log('Updated province:', clinicData.province || 'Still missing');
            console.log('Updated district:', clinicData.district || 'Still missing');
            console.log('Updated latitude:', clinicData.latitude || 'Still missing');
            console.log('Updated longitude:', clinicData.longitude || 'Still missing');
            
            // Update location data flag
            hasLocationData = Boolean(
              clinicData.clinic_address && 
              clinicData.province && 
              clinicData.district
            );
            
            console.log('Has location data after merge:', hasLocationData);
          }
        }
        
        console.log('Trimmed status:', clinicData.clinic_verification_status ? clinicData.clinic_verification_status.trim() : '');
        
        // Check if user is admin (from localStorage or from Redux)
        const isAdmin = user.user_type === 'admin' || localStorage.getItem('adminToken');
        console.log('User type check - Is admin:', isAdmin);
        
        if (!isAdmin) {
          // For non-admin users, enforce status restrictions
          if (clinicData.clinic_verification_status !== 'pending' && clinicData.clinic_verification_status !== 'not_verified') {
            console.error(`Unauthorized: Clinic status "${clinicData.clinic_verification_status}" is not pending or not_verified`);
            setUnauthorized(true);
            setLoading(false);
            return;
          }

          // For non-admin users, check if they are the clinic operator
          const clinicOperatorId = String(clinicData.clinic_operator_id).trim();
          const userId = String(user.id).trim();
          console.log('Comparing IDs - Clinic operator:', clinicOperatorId, 'Current user:', userId);
          
          if (clinicOperatorId !== userId) {
            console.error('Unauthorized: User is not the clinic operator');
            setUnauthorized(true);
            setLoading(false);
            return;
          }
        } else {
          console.log('Admin user detected - granting access to clinic details');
        }

        console.log('Authorization checks passed, setting clinic data');
        setClinic(clinicData);
        
        // Klinik fotoğraflarını al
        try {
          console.log('Fetching clinic photos from clinicalbum');
          const photosResponse = await axiosInstance.get(`/clinics/${clinicId}/photos`);
          
          console.log('Photos API response:', photosResponse.data);
          
          if (photosResponse.data.success && photosResponse.data.photos && photosResponse.data.photos.length > 0) {
            // clinicalbum tablosundan gelen fotoğrafları URL'ye dönüştür
            const photos = photosResponse.data.photos.map((photo: { clinic_album_photo_url: string }) => ({
              url: photo.clinic_album_photo_url
            }));

            console.log('Processed photos:', photos);
            setClinicPhotos(photos);

            // Yükleme durumlarını ayarla
            const newLoadingState: {[key: number]: boolean} = {};
            photos.forEach((_photo: { url: string }, index: number) => {
              newLoadingState[index] = true;
            });
            setLoadingImages(newLoadingState);
          }
        } catch (photoErr) {
          console.error('Error fetching clinic photos:', photoErr);
          // Fotoğraflar yoksa devam et, sadece boş array kalır
        }
        
        setLoading(false);
      } catch (err) {
        console.error('===== ERROR FETCHING CLINIC DETAILS =====');
        console.error('Error object:', err);
        console.error('Response data:', getApiErrorResponse(err)?.data);
        console.error('Status code:', getApiErrorStatus(err));
        
        if (getApiErrorStatus(err) === 403 || getApiErrorStatus(err) === 401) {
          setUnauthorized(true);
        } else {
          setError(getApiErrorMessage(err, 'Failed to load clinic details'));
        }
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchClinicDetails();
    }
  }, [clinicId, token, user]);

  useEffect(() => {
    if (unauthorized) {
      const isAdmin = user?.user_type === 'admin' || localStorage.getItem('adminToken');
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    }
  }, [unauthorized, navigate, user]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonth = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  // Format time string to display in a more user-friendly format (e.g., "09:00" to "9:00 AM")
  const formatTimeString = (timeString: string | null | undefined) => {
    if (!timeString) return "Not specified";
    
    try {
      // Parse the time string (format: "HH:MM")
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Create a date object and set the time
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      
      // Format the time in 12-hour format with AM/PM
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return timeString; // Return the original string if there's an error
    }
  };

  const getDayName = (index: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index];
  };

  // Function to open the photo modal
  const openPhotoModal = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsModalOpen(true);
    setModalImageLoading(true); // Set loading state
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Function to close the photo modal
  const closePhotoModal = () => {
    setIsModalOpen(false);
    setSelectedPhotoIndex(null);
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'auto';
  };

  // Function to navigate to next photo
  const nextPhoto = () => {
    if (clinicPhotos.length > 0 && selectedPhotoIndex !== null) {
      setModalImageLoading(true); // Set loading state
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % clinicPhotos.length);
    }
  };

  // Function to navigate to previous photo
  const prevPhoto = () => {
    if (clinicPhotos.length > 0 && selectedPhotoIndex !== null) {
      setModalImageLoading(true); // Set loading state
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + clinicPhotos.length) % clinicPhotos.length);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch (e.key) {
        case 'ArrowRight':
          nextPhoto();
          break;
        case 'ArrowLeft':
          prevPhoto();
          break;
        case 'Escape':
          closePhotoModal();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedPhotoIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track image loading states
  const handleImageLoad = (index: number) => {
    setLoadingImages(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const handleImageError = (index: number) => {
    setLoadingImages(prev => ({
      ...prev,
      [index]: false
    }));
    console.error(`Failed to load image at index ${index}`);
  };

  // Initialize loading state for images when photos is loaded
  useEffect(() => {
    if (clinicPhotos.length > 0) {
      const newLoadingState: {[key: number]: boolean} = {};
      clinicPhotos.forEach((_, index) => {
        newLoadingState[index] = true;
      });
      setLoadingImages(newLoadingState);
    }
  }, [clinicPhotos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading clinic details...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return null;
  }

  if (error) {
    const isAdmin = user?.user_type === 'admin' || localStorage.getItem('adminToken');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Error Loading Clinic</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    const isAdmin = user?.user_type === 'admin' || localStorage.getItem('adminToken');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <p className="text-gray-600">No clinic data found</p>
          <button
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Add a dummy updateField function to pass to MapComponent
  const dummyUpdateField = (name: string, value: unknown) => {
    console.log(`Preview page would update ${name} to:`, value);
    // No actual update in preview mode
  };

  // Create a mock formData for the MapComponent
  const createMapFormData = (clinic: ClinicDetails): ClinicFormData => {
    // Convert phone numbers to the expected format
    const convertedPhoneNumbers: PhoneNumberEntry[] = (clinic.phone_numbers || []).map(phone => ({
      type: (phone.type === 'fixed_line' || phone.type === 'mobile_number') 
        ? phone.type as PhoneTypeEnum 
        : '' as PhoneTypeEnum,
      number: phone.number
    }));
    
    return {
      name: clinic.clinic_name || '',
      clinicType: clinic.clinic_type || '',
      biography: '',
      establishment_date: `${clinic.establishment_year || ''}-${clinic.establishment_month || ''}`,
      social_media_links: clinic.social_media || [],
      province: clinic.province || '',
      district: clinic.district || '',
      address: clinic.clinic_address || '',
      coordinates: clinic.latitude && clinic.longitude ? {
        lat: typeof clinic.latitude === 'string' ? parseFloat(clinic.latitude) : clinic.latitude,
        lng: typeof clinic.longitude === 'string' ? parseFloat(clinic.longitude) : clinic.longitude
      } : undefined,
      phone_numbers: convertedPhoneNumbers,
      email: clinic.clinic_email || '',
      description: clinic.clinic_description || '',
      showPhoneNumber: clinic.showPhoneNumber || false,
      allowDirectMessages: clinic.allowDirectMessages || false,
      showMailAddress: clinic.showMailAddress || false,
      servedAnimalTypes: clinic.animal_types || [],
      medicalServices: clinic.medical_services || [],
      additionalServices: clinic.additional_services || [],
      available_days: clinic.available_days ? clinic.available_days.map((day, index) => day ? String(index) : '').filter(Boolean) : [],
      emergency_available_days: clinic.emergency_available_days ? clinic.emergency_available_days.map((day, index) => day ? String(index) : '').filter(Boolean) : [],
      has_emergency_service: clinic.has_emergency_service || false,
      is_open_24_7: clinic.is_open_24_7 === 'Yes',
      slot_duration: clinic.slot_duration || 30,
      opening_time: clinic.opening_time || '',
      closing_time: clinic.closing_time || '',
      allow_online_meetings: clinic.allow_online_meetings || false,
      taxIdentificationNumber: clinic.tax_identification_number || '',
      veterinaryLicenseNumber: clinic.veterinary_license_number || '',
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 clinic-preview-page">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center mb-6">
        <div className="flex items-center">
          <img 
            src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
            alt="Petlyst Logo" 
            className="h-8 w-auto"
          />
          <span className="ml-3 text-xl font-semibold text-gray-800">Petlyst</span>
        </div>
        <button
          onClick={() => {
            const isAdmin = user?.user_type === 'admin' || localStorage.getItem('adminToken');
            navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clinic Submission Details</h1>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              clinic.clinic_verification_status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : clinic.clinic_verification_status === 'verified'
                  ? 'bg-green-100 text-green-800'
                  : clinic.clinic_verification_status === 'not_verified'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}>
              {clinic.clinic_verification_status === 'pending_submission' 
                ? 'Incomplete Submission' 
                : clinic.clinic_verification_status === 'not_verified'
                  ? 'Rejected Submission'
                  : clinic.clinic_verification_status.charAt(0).toUpperCase() + clinic.clinic_verification_status.slice(1)}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Clinic Name</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{clinic.clinic_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Clinic Type</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {clinic.clinic_type === 'veterinary_clinic' ? 'Veterinary Clinic' : 'Animal Hospital'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Establishment Date</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatMonth(clinic.establishment_month)} {clinic.establishment_year}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created On</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatDateTime(clinic.clinic_created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Gallery */}
        {clinicPhotos.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinic Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {clinicPhotos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative group cursor-pointer rounded-lg overflow-hidden h-48 bg-gray-100 transition transform hover:scale-105 hover:shadow-lg"
                    onClick={() => openPhotoModal(index)}
                  >
                    {/* Loading indicator */}
                    {loadingImages[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <div className="w-8 h-8 relative">
                          <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
                          <div className="absolute inset-0 rounded-full border-3 border-t-blue-500 animate-spin"></div>
                        </div>
                      </div>
                    )}
                    <img 
                      src={photo.url} 
                      alt={`Clinic photo ${index + 1}`} 
                      className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages[index] ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {clinic.clinic_address || 'No address available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Province / District</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {clinic.province && clinic.district 
                    ? `${clinic.province}, ${clinic.district}`
                    : clinic.province 
                      ? clinic.province 
                      : clinic.district 
                        ? clinic.district 
                        : 'No province/district information available'}
                </p>
              </div>
            </div>
            
            {/* Add Map Display */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Map Location</p>
              <ErrorBoundary>
                {clinic.latitude && clinic.longitude ? (
                  <MapComponent 
                    formData={createMapFormData(clinic)}
                    updateField={dummyUpdateField}
                    hasExistingClinic={true}
                    loading={false}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50 h-[300px]">
                    <p className="text-sm text-gray-500">No location coordinates available</p>
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            {/* Phone Numbers */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Phone Numbers</p>
              {clinic.phone_numbers && clinic.phone_numbers.length > 0 ? (
                <div className="space-y-2">
                  {clinic.phone_numbers.map((phone, index) => (
                    <div key={index} className="flex items-center">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{phone.number}</p>
                        <p className="text-xs text-gray-500">{phone.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No phone numbers provided</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Email</p>
              {clinic.clinic_email ? (
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <p className="text-sm font-medium text-gray-900">{clinic.clinic_email}</p>
                </div>
              ) : (
                <p className="text-gray-500">No email provided</p>
              )}
            </div>

            {/* Social Media */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Social Media</p>
              {clinic.social_media && clinic.social_media.length > 0 ? (
                <div className="space-y-2">
                  {clinic.social_media.map((social, index) => (
                    <div key={index} className="flex items-center">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{social.platform}</p>
                        <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{social.url}</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No social media links provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Add Privacy & Communication Preferences section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Communication Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${clinic.show_phone_number ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'} mr-3`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Show Phone Number</p>
                  <p className="text-xs text-gray-500">{clinic.show_phone_number ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${clinic.show_mail_address ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'} mr-3`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Show Email Address</p>
                  <p className="text-xs text-gray-500">{clinic.show_mail_address ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${clinic.allow_direct_messages ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'} mr-3`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Allow Direct Messages</p>
                  <p className="text-xs text-gray-500">{clinic.allow_direct_messages ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${clinic.allow_online_meetings ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'} mr-3`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Allow Online Meetings</p>
                  <p className="text-xs text-gray-500">{clinic.allow_online_meetings ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {clinic.clinic_description && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Clinic</h2>
              <p className="text-gray-700 whitespace-pre-line">{clinic.clinic_description}</p>
            </div>
          </div>
        )}

        {/* Services */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
            
            {/* Animal Types */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Animals Served</p>
              {clinic.animal_types && clinic.animal_types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {clinic.animal_types.map((type, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {type}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No animal types specified</p>
              )}
            </div>
            
            {/* Medical Services */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Medical Services</p>
              {clinic.medical_services && clinic.medical_services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {clinic.medical_services.map((service, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No medical services specified</p>
              )}
            </div>
            
            {/* Additional Services */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Additional Services</p>
              {clinic.additional_services && clinic.additional_services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {clinic.additional_services.map((service, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No additional services specified</p>
              )}
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Working Hours</h2>
            
            <div className="space-y-6">
              {/* Status Indicators - Group all indicators in a flex container */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* 24/7 Status */}
                {clinic.is_open_24_7 === 'Yes' && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">This clinic is open 24/7</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Service Status */}
                {clinic.has_emergency_service && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">This clinic provides emergency services</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Duration */}
                {clinic.slot_duration && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-md flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-indigo-800">
                          Appointment Duration: {clinic.slot_duration} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Appointment Hours Section */}
              <div className="bg-gray-50 rounded-lg p-5 mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Appointment Hours</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Opening Time</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatTimeString(clinic.opening_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Closing Time</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatTimeString(clinic.closing_time)}</p>
                    </div>
                  </div>
                </div>
              </div>
            
              {/* Working Days */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Working Days</h3>
                <div className="flex flex-wrap gap-2">
                  {clinic.available_days && clinic.available_days.map((isAvailable, index) => (
                    <span key={index} className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      isAvailable 
                        ? 'bg-green-100 text-green-800 shadow-sm' 
                        : 'bg-gray-100 text-gray-500 line-through'
                    }`}>
                      {getDayName(index)}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Emergency Service Days */}
              {clinic.emergency_available_days && clinic.emergency_available_days.some(day => day) && (
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Emergency Service Days</h3>
                  <div className="flex flex-wrap gap-2">
                    {clinic.emergency_available_days.map((isAvailable, index) => (
                      isAvailable && (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 shadow-sm">
                          {getDayName(index)}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Online Meetings Information */}
              {clinic.allow_online_meetings && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">This clinic offers online appointments</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Tax Identification Number (VKN)</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{clinic.tax_identification_number || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Veterinary License Number</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{clinic.veterinary_license_number || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Photo Modal */}
      {isModalOpen && clinicPhotos.length > 0 && selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={closePhotoModal}>
          <div className="relative max-w-6xl w-full p-2 md:p-4" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
              onClick={closePhotoModal}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Previous button */}
            <button 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Next button */}
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Photo */}
            <div className="bg-transparent rounded-lg overflow-hidden max-h-[90vh] flex items-center justify-center">
              {/* Modal loading indicator */}
              {modalImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin"></div>
                  </div>
                </div>
              )}
              <img 
                src={clinicPhotos[selectedPhotoIndex].url} 
                alt={`Clinic photo ${selectedPhotoIndex + 1}`} 
                className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-300 ${modalImageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setModalImageLoading(false)}
                onError={() => setModalImageLoading(false)}
              />
            </div>
            
            {/* Photo counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 py-2 px-4 bg-black bg-opacity-50 text-white rounded-full text-sm">
              {selectedPhotoIndex + 1} / {clinicPhotos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicPreviewPage; 