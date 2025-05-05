import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AuthModal from '../components/modals/AuthModal';
import ResetPasswordModal from '../components/modals/ResetPasswordModal';
import AppointmentModal from '../components/petowner/petownermodals/AppointmentModal';
import { createPortal } from 'react-dom';

// Clinic interface
interface Clinic {
  clinic_id: number;
  clinic_name: string;
  clinic_type: string;
  clinic_description: string;
  opening_time: string;
  closing_time: string;
  available_days: boolean[];
  emergency_available_days?: boolean[];
  province: string;
  district: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  clinic_email?: string;
  phone_numbers?: { type: string; number: string; phone_type: string }[];
  social_media?: { platform: string; url: string }[];
  clinic_verification_status: string;
  is_open_24_7?: string;
  slug?: string;
  // Add these fields as they might be returned directly from the by-slug endpoint
  animal_types?: string[];
  medical_services?: string[];
  additional_services?: string[];
  establishment_year: number;
  establishment_month: number;
  allow_direct_messages: boolean;
  allow_online_meetings?: boolean;
  clinic_time_slots?: number;
}

// Try multiple ways to access the API key
const getApiKey = (): string => {
  // For debugging
  console.log('[DEBUG] Environment variables check in SingleClinicPage:');
  console.log('import.meta.env available:', typeof import.meta.env !== 'undefined');
  console.log('VITE_GOOGLE_MAPS_API_KEY via import.meta:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  console.log('VITE_GOOGLE_MAPS_EMBED_API_KEY via import.meta:', import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY);
  
  // Özel olarak Embed API için ayrı bir key kullanın (önerilir)
  const embedApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY;
  if (embedApiKey) {
    return embedApiKey;
  }
  
  // Genel API key'i kullan
  const viaImportMeta = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Return the API key or a hardcoded fallback for development ONLY
  return viaImportMeta || 
    // API KEY'İNİZİ BURAYA EKLEYİN - GEÇİCİ ÇÖZÜM
    '';
};

// Get API key using our robust method
const GOOGLE_MAPS_API_KEY = getApiKey();

// Services interface
interface ClinicServices {
  animalTypes: string[];
  medicalServices: string[];
  additionalServices: string[];
}

// Photos interface
interface ClinicPhoto {
  clinic_album_photo_id: number;
  clinic_album_photo_url: string;
  clinic_album_photo_url_created_at: string;
}

// Veterinarian interface
interface Veterinarian {
  id: number;
  veterinarian_id: number;
  user_id: number;
  user_name: string;
  user_surname: string;
  user_email?: string;
  user_profile_photo?: string;
  status: string; // approved, pending, rejected
  expertise: string[];
  slug?: string;
}

// Update User interface
interface User {
  id: number;  // This is the user ID we'll use
  email: string;
  name: string;
  surname: string;
  user_type?: string; // Add user_type property
  // Remove user_id as it's not needed
}

const SingleClinicPage: React.FC = () => {
  const params = useParams<{ clinicId?: string, slug?: string }>();
  const navigate = useNavigate();
  // Redux'tan token'ı al
  const token = useSelector((state: RootState) => state.auth.token) || localStorage.getItem('token');
  
  // Determine if we're using ID or slug
  const isUsingId = !!params.clinicId;
  const paramValue = isUsingId ? params.clinicId : params.slug;
  
  console.log("Route params:", params);
  console.log("Using ID?", isUsingId, "Param value:", paramValue);
  
  // States
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<ClinicServices | null>(null);
  const [photos, setPhotos] = useState<ClinicPhoto[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [serviceDuration, setServiceDuration] = useState<{ years: number; months: number } | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageStatus, setMessageStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteAnimation, setFavoriteAnimation] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [hasPendingAppointment, setHasPendingAppointment] = useState(false);
  const [checkingAppointment, setCheckingAppointment] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Get user from Redux instead of making a separate API call
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Check if user is a veterinarian
  const isVeterinarian = user?.user_type === 'veterinarian';
  
  // Fetch clinic data on component mount
  useEffect(() => {
    const fetchClinicData = async () => {
      if (!paramValue) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let clinicData: Clinic;
        
        // Always fetch by slug, regardless of the path format
        console.log("Fetching clinic by slug:", paramValue);
        const response = await axiosInstance.get(`/clinics/public/by-slug/${paramValue}`);
        console.log("Clinic response:", response.data);
        
        if (response.data.success) {
          clinicData = response.data.clinic;
          
          // Fetch additional data
          try {
            if (clinicData.clinic_id) {
              console.log("Fetching additional data for clinic ID:", clinicData.clinic_id);
              
              // Fetch clinic photos
              try {
                let photosResponse;
                
                // Önce token varsa özel endpoint'i kullan
                if (token) {
                  try {
                    photosResponse = await axiosInstance.get(`/clinics/${clinicData.clinic_id}/photos`, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    console.log("Photos response from private endpoint:", photosResponse.data);
                  } catch (privateError) {
                    console.log("Private endpoint failed, trying public endpoint");
                    // Private endpoint başarısız olursa public endpoint'i dene
                    photosResponse = null;
                  }
                }
                
                // Token yoksa veya private endpoint başarısız olduysa public endpoint'i kullan
                if (!photosResponse) {
                  photosResponse = await axiosInstance.get(`/clinics/public/${clinicData.clinic_id}/photos`);
                  console.log("Photos response from public endpoint:", photosResponse.data);
                }
                
                // Fotoğrafları set et
                if (photosResponse && photosResponse.data.success) {
                  setPhotos(photosResponse.data.photos || []);
                }
              } catch (photosError) {
                console.warn("Could not fetch photos:", photosError);
                // Fotoğraf çekme hatası olsa bile diğer işlevlere devam et
              }
              
              // Fetch veterinarians
              try {
                const vetsResponse = await axiosInstance.get(`/pet-owners/clinics/${clinicData.clinic_id}/public-veterinarians`);
                console.log("Veterinarians response:", vetsResponse.data);
                if (vetsResponse.data.success) {
                  setVeterinarians(vetsResponse.data.veterinarians || []);
                }
              } catch (vetsError) {
                console.warn("Could not fetch veterinarians:", vetsError);
              }
              
              // If we need to, we can extract services directly from the clinic data
              if (clinicData.animal_types || clinicData.medical_services || clinicData.additional_services) {
                setServices({
                  animalTypes: clinicData.animal_types || [],
                  medicalServices: clinicData.medical_services || [],
                  additionalServices: clinicData.additional_services || []
                });
              } else {
                // Fetch clinic services if not already in the clinic data
                try {
                  const servicesResponse = await axiosInstance.get(`/pet-owners/clinics/${clinicData.clinic_id}/services`);
                  if (servicesResponse.data.success) {
                    setServices(servicesResponse.data.services);
                  }
                } catch (servicesError) {
                  console.warn("Could not fetch services:", servicesError);
                }
              }
            }
          } catch (additionalError) {
            console.warn("Could not fetch some additional clinic data:", additionalError);
            // Continue showing the clinic with incomplete data
          }
        } else {
          throw new Error('Failed to fetch clinic details');
        }
        
        // Fetch service duration
        try {
          const durationResponse = await axiosInstance.get(`/clinics/${clinicData.clinic_id}/service-duration`);
          if (durationResponse.data.success) {
            setServiceDuration(durationResponse.data.serviceDuration);
          }
        } catch (error) {
          console.error('Error fetching service duration:', error);
        }
        
        // Set clinic data
        setClinic(clinicData);
        
      } catch (err: any) {
        console.error('Error fetching clinic data:', err);
        setError('Failed to load clinic data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClinicData();
  }, [paramValue, token]);
  
  // Separate useEffect to check favorite status when clinic data is loaded
  useEffect(() => {
    // Only run this if the clinic is loaded and user is logged in and NOT a veterinarian
    if (clinic && token && !isVeterinarian) {
      const checkFavoriteStatus = async () => {
        try {
          // Add debug logs
          console.log("Making favorite check request for clinic ID:", clinic.clinic_id);
          console.log("Using token:", token);
          console.log("Clinic details:", clinic);
          
          // IMPORTANT: Use axiosInstance instead of direct axios calls
          const favoriteCheckResponse = await axiosInstance.get(`/pet-owners/saved-clinics/${clinic.clinic_id}/check`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (favoriteCheckResponse.data.success) {
            setIsSaved(favoriteCheckResponse.data.isFavorite);
          }
        } catch (favoriteError: any) {
          console.warn("Could not check favorite status:", favoriteError);
          // Log more details about the error
          console.error("Error details:", favoriteError.message);
          console.error("Error config:", favoriteError.config);
          console.error("Error response:", favoriteError.response?.data);
          // Don't show error to user, silently fail and assume not favorited
          setIsSaved(false);
        }
      };
      
      checkFavoriteStatus();
    } else {
      // If user not logged in or is a veterinarian, always set to not favorited
      setIsSaved(false);
    }
  }, [clinic, token, isVeterinarian]);
  
  // Add a useEffect to check for pending appointments
  useEffect(() => {
    // Only check for pending appointments if the clinic is loaded and user is logged in
    if (clinic && token && !isVeterinarian) {
      const checkPendingAppointment = async () => {
        try {
          setCheckingAppointment(true);
          console.log("Checking pending appointments for clinic ID:", clinic.clinic_id);
          
          const response = await axiosInstance.get(`/pet-owners/has-pending-appointment/${clinic.clinic_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            setHasPendingAppointment(response.data.hasPendingAppointment);
            console.log("Pending appointment status:", response.data.hasPendingAppointment);
          }
        } catch (error: any) {
          console.warn("Could not check pending appointment status:", error);
          // Silently fail, default is false
        } finally {
          setCheckingAppointment(false);
        }
      };
      
      checkPendingAppointment();
    }
  }, [clinic, token, isVeterinarian]);
  
  // Format day names
  const getDayName = (index: number): string => {
    // Days starting from Monday, index 0 = Monday
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index];
  };
  
  // Format time
  const formatTime = (time: string): string => {
    if (!time) return 'Not specified';
    
    // If time has seconds part (e.g. "14:30:00"), remove it
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length > 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return time;
  };
  
  // Format clinic type display
  const formatClinicType = (type: string): string => {
    if (type === 'animal_hospital') return 'Animal Hospital';
    if (type === 'veterinary_clinic') return 'Veterinary Clinic';
    return type;
  };
  
  // Check if clinic is open now
  const isOpenNow = (): boolean => {
    if (!clinic) return false;
    
    // If clinic is open 24/7
    if (clinic.is_open_24_7 === 'Yes') return true;
    
    const now = new Date();
    const jsDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // JavaScript getDay() --> SQL array indeks dönüşümü
    // 0 (Pazar) -> 6
    // 1 (Pazartesi) -> 0
    // 2 (Salı) -> 1
    // ...
    // 6 (Cumartesi) -> 5
    const sqlArrayIndex = jsDay === 0 ? 6 : jsDay - 1;
    
    // Check if clinic is open today
    if (!clinic.available_days[sqlArrayIndex]) return false;
    
    // Check current time against opening and closing times
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const openingTimeParts = clinic.opening_time.split(':').map(Number);
    const closingTimeParts = clinic.closing_time.split(':').map(Number);
    
    const openingHour = openingTimeParts[0];
    const openingMinute = openingTimeParts[1];
    
    const closingHour = closingTimeParts[0];
    const closingMinute = closingTimeParts[1];
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const openingTotalMinutes = openingHour * 60 + openingMinute;
    const closingTotalMinutes = closingHour * 60 + closingMinute;
    
    return currentTotalMinutes >= openingTotalMinutes && currentTotalMinutes <= closingTotalMinutes;
  };
  
  // Open photo modal with specific index
  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index);
    setImageLoading(true);
    setShowPhotoModal(true);
    document.body.style.overflow = 'hidden';
  };

  // Close photo modal
  const closePhotoModal = () => {
    setShowPhotoModal(false);
    document.body.style.overflow = 'auto';
  };

  // Navigate to next photo in modal
  const nextPhoto = () => {
    if (photos.length === 0) return;
    setImageLoading(true);
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };
  
  // Navigate to previous photo in modal
  const prevPhoto = () => {
    if (photos.length === 0) return;
    setImageLoading(true);
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  // Handle keyboard navigation in modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPhotoModal) return;
      
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
  }, [showPhotoModal]);
  
  // Handle booking appointment
  const handleBookAppointment = () => {
    if (!clinic) return;
    
    // If user has a pending appointment, don't allow booking
    if (hasPendingAppointment) {
      return;
    }
    
    // Check if user is logged in
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    
    // If user is logged in, open appointment modal
    setIsAppointmentModalOpen(true);
  };
  
  // Function to generate slug
  const generateSlug = (name: string, surname: string): string => {
    return `dr-${name.toLowerCase()}-${surname.toLowerCase()}`
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '')  // Remove non-word chars
      .replace(/\-\-+/g, '-')    // Replace multiple hyphens with single
      .replace(/^-+/, '')        // Trim hyphens from start
      .replace(/-+$/, '');       // Trim hyphens from end
  };
  
  // Handle forgot password
  const handleForgotPassword = () => {
    setIsAuthModalOpen(false);
    setIsResetPasswordModalOpen(true);
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setIsResetPasswordModalOpen(false);
    setIsAuthModalOpen(true);
  };
  
  // Update handleSaveClinic function
  const handleSaveClinic = async () => {
    if (!clinic) return;
    
    // If not logged in, open auth modal instead of redirecting
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    // Add debug logs
    console.log("Attempting to save/unsave clinic with ID:", clinic.clinic_id);
    console.log("Current saved status:", isSaved);
    console.log("Using token:", token);
    
    setFavoriteLoading(true);

    try {
      if (isSaved) {
        // Remove from favorites using axiosInstance
        const response = await axiosInstance.delete(
          `/pet-owners/saved-clinics/${clinic.clinic_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log("Delete favorite response:", response.data);
        
        if (response.data.success) {
          setIsSaved(false);
          // Trigger animation
          setFavoriteAnimation(true);
          setTimeout(() => setFavoriteAnimation(false), 500);
        }
      } else {
        // Add to favorites using axiosInstance
        const response = await axiosInstance.post(
          `/pet-owners/saved-clinics/${clinic.clinic_id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log("Add favorite response:", response.data);
        
        if (response.data.success) {
          setIsSaved(true);
          // Trigger animation
          setFavoriteAnimation(true);
          setTimeout(() => setFavoriteAnimation(false), 500);
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite status:', error);
      // More detailed error logging
      console.error("Error details:", error.message);
      console.error("Error config:", error.config);
      console.error("Error response:", error.response?.data);
      
      // More specific error messages based on the response
      if (error.response) {
        const { status, data } = error.response;
        
        // Handle different error codes
        if (status === 403) {
          alert(data.message || 'Only pet owners can favorite clinics');
        } else if (status === 404) {
          alert(data.message || 'Clinic or user not found');
        } else if (status === 500) {
          alert('Server error. Please try again later.');
        } else {
          alert(data.message || 'An error occurred. Please try again later.');
        }
      } else if (error.request) {
        // Network error - request was made but no response received
        alert('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        alert('An error occurred. Please try again later.');
      }
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  // Show tooltip when hovering over the pending button
  const showTooltip = () => {
    if (buttonRef.current) {
      setButtonPosition(buttonRef.current.getBoundingClientRect());
      setTooltipVisible(true);
    }
  };

  // Hide tooltip
  const hideTooltip = () => {
    setTooltipVisible(false);
  };
  
  // Add scroll event listener to hide tooltip when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (tooltipVisible) {
        hideTooltip();
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [tooltipVisible]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading clinic information...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !clinic) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Clinic Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The clinic you're looking for doesn't exist or may have been removed."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Add the message modal component
  const MessageModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Send Message</h3>
          <button 
            onClick={() => {
              setShowMessageModal(false);
              setMessageContent('');
              setMessageStatus({ type: null, message: '' });
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Type your message here..."
          className="w-full h-32 p-2 border rounded-md mb-4"
        />
        
        {messageStatus.type && (
          <div className={`mb-4 p-2 rounded-md ${
            messageStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {messageStatus.message}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!messageContent.trim()) {
                setMessageStatus({ type: 'error', message: 'Please enter a message' });
                return;
              }
              
              try {
                // Use axiosInstance for the message endpoint as well
                const response = await axiosInstance.post(`/clinics/${clinic?.clinic_id}/send-message`, {
                  message: messageContent,
                  senderId: user?.id // Use id instead of user_id
                }, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.data.success) {
                  setMessageStatus({ type: 'success', message: 'Message sent successfully' });
                  setTimeout(() => {
                    setShowMessageModal(false);
                    setMessageContent('');
                    setMessageStatus({ type: null, message: '' });
                  }, 2000);
                }
              } catch (error: any) {
                setMessageStatus({ 
                  type: 'error', 
                  message: error.response?.data?.message || 'Failed to send message' 
                });
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Photo Gallery - As a separate card with rounded corners */}
        {photos.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
            <div className="relative h-96 p-2">
              <div className="grid grid-cols-4 h-full gap-2">
                {/* Main photo */}
                <div className="col-span-2 row-span-1 h-full relative" onClick={() => openPhotoModal(0)}>
                  <img 
                    src={photos[0]?.clinic_album_photo_url} 
                    alt={`${clinic?.clinic_name}`}
                    className="w-full h-full object-cover cursor-pointer rounded-lg"
                  />
                </div>
                
                {/* Side photos */}
                <div className="col-span-2 grid grid-cols-2 gap-2 h-full">
                  {photos.slice(1, 5).map((photo, index) => (
                    <div key={index} className="relative h-full" onClick={() => openPhotoModal(index + 1)}>
                      <img 
                        src={photo.clinic_album_photo_url} 
                        alt={`${clinic?.clinic_name}`}
                        className="w-full h-full object-cover cursor-pointer rounded-lg"
                      />
                      
                      {/* "See all photos" overlay on the last visible photo */}
                      {photos.length > 5 && index === 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer rounded-lg">
                          <div className="text-white text-center">
                            <p className="font-semibold">+{photos.length - 5}</p>
                            <p className="text-xs">View All</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
            <div className="h-72 flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No photos available</p>
              </div>
            </div>
          </div>
        )}
          
        {/* Clinic Information - As a separate card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{clinic?.clinic_name}</h1>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {formatClinicType(clinic?.clinic_type || '')}
                  </span>
                  <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isOpenNow() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isOpenNow() ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {isOpenNow() ? 'Open Now' : 'Closed'}
                  </span>
                  {/* Add Online Meeting Badge */}
                  {clinic?.allow_online_meetings && (
                    <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <span className="inline-block w-2 h-2 rounded-full mr-2 bg-purple-500"></span>
                      Online Meeting
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons Group */}
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 sm:items-center">
                {/* Primary Action - Only show for non-veterinarians */}
                {!isVeterinarian && (
                  <div 
                    className="relative"
                    onMouseEnter={hasPendingAppointment ? showTooltip : undefined}
                    onMouseLeave={hasPendingAppointment ? hideTooltip : undefined}
                  >
                    <button
                      ref={buttonRef}
                      onClick={handleBookAppointment}
                      disabled={hasPendingAppointment || checkingAppointment}
                      className={`${
                        hasPendingAppointment 
                          ? 'bg-orange-500 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white font-medium px-6 py-2.5 rounded-lg shadow-sm flex items-center justify-center transition-colors pointer-events-auto`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {checkingAppointment 
                        ? 'Checking...' 
                        : hasPendingAppointment 
                          ? 'Pending' 
                          : 'Book Appointment'}
                    </button>

                    {/* Tooltip Portal */}
                    {hasPendingAppointment && tooltipVisible && createPortal(
                      <div 
                        className="fixed bg-gradient-to-br from-gray-800 to-gray-900 text-white text-sm rounded-xl p-4 shadow-xl z-[9999] max-w-xs border border-gray-700"
                        style={{
                          top: buttonRef.current ? `${buttonRef.current.getBoundingClientRect().top - 10}px` : '0',
                          left: buttonRef.current ? `${buttonRef.current.getBoundingClientRect().left + buttonRef.current.getBoundingClientRect().width / 2}px` : '0',
                          transform: 'translate(-50%, -100%)',
                          marginTop: '-5px',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        <div className="relative">
                          <div className="mb-3">
                            <p className="text-center leading-relaxed">
                              Your appointment request has been sent to the clinic. The veterinarian will approve it based on availability.
                            </p>
                          </div>
                          
                          <div className="text-center mb-2">
                            <p className="text-gray-300 text-xs mb-2">If you changed your mind, please cancel your request via:</p>
                            <div className="inline-flex items-center justify-center py-1.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              <span className="font-medium">Dashboard</span>
                              <svg className="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium">Appointments</span>
                            </div>
                          </div>
                          
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                )}
                
                {/* Secondary Actions Group */}
                <div className="flex gap-2">
                  {/* Only show favorite button for pet owners or non-logged-in users */}
                  {!isVeterinarian && (
                    <button
                      onClick={handleSaveClinic}
                      disabled={favoriteLoading}
                      className={`${
                        isSaved 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      } font-medium px-4 py-2.5 rounded-lg border border-gray-200 flex items-center justify-center transition-colors min-w-[44px] ${
                        favoriteAnimation ? 'animate-pulse' : ''
                      }`}
                    >
                      {favoriteLoading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg 
                            className={`w-5 h-5 ${favoriteAnimation ? 'scale-125 transition-transform' : ''}`}
                            fill={isSaved ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="ml-2 hidden sm:inline">
                            {isSaved ? 'Favorited' : 'Favorite'}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Only show message button for non-veterinarians */}
                  {!isVeterinarian && (
                    <button
                      onClick={() => setShowMessageModal(true)}
                      className="bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium px-4 py-2.5 rounded-lg border border-gray-200 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="ml-2 hidden sm:inline">Message</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Clinic Description */}
            {clinic?.clinic_description && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">About the Clinic</h2>
                <p className="text-gray-600 whitespace-pre-line">{clinic.clinic_description}</p>
              </div>
            )}
            
            {/* Hours and Location Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Working Hours ve Emergency Service - Dikey olarak (Sol sütun) */}
              <div>
                {/* Working Hours Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Working Hours
                  </h3>
                  
                  {clinic.is_open_24_7 === 'Yes' ? (
                    <p className="text-green-600 font-medium">Open 24/7</p>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Hours:</span> {formatTime(clinic.opening_time)} - {formatTime(clinic.closing_time)}
                      </p>
                      <div className="grid grid-cols-7 gap-1 mt-3">
                        {/* SQL array sıralaması: 0=Pazartesi, 1=Salı, 2=Çarşamba, ... 6=Pazar */}
                        {[
                          clinic.available_days[0], // Pazartesi (index 0)
                          clinic.available_days[1], // Salı (index 1)
                          clinic.available_days[2], // Çarşamba (index 2)
                          clinic.available_days[3], // Perşembe (index 3)
                          clinic.available_days[4], // Cuma (index 4)
                          clinic.available_days[5], // Cumartesi (index 5)
                          clinic.available_days[6], // Pazar (index 6)
                        ].map((isOpen, idx) => (
                          <div key={idx} className={`text-center py-1 px-1 rounded text-xs ${isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Emergency Service Section */}
                {clinic.emergency_available_days && clinic.emergency_available_days.some(day => day) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mt-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Emergency Service
                    </h3>
                    
                    {/* Tüm günler açıksa 24/7 olarak göster */}
                    {clinic.emergency_available_days.every(day => day) ? (
                      <div className="flex items-center mt-2">
                        <div className="flex items-center justify-center bg-orange-100 text-orange-800 px-4 py-2 rounded-lg border border-orange-200 shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <span className="font-bold text-md">24/7</span>
                            <span className="font-medium ml-1">Emergency Service Available</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">
                          <span className="font-medium">Available on:</span>
                        </p>
                        <div className="grid grid-cols-7 gap-1 mt-3">
                          {/* SQL array sıralaması: 0=Pazartesi, 1=Salı, 2=Çarşamba, ... 6=Pazar */}
                          {[
                            clinic.emergency_available_days[0], // Pazartesi (index 0)
                            clinic.emergency_available_days[1], // Salı (index 1)
                            clinic.emergency_available_days[2], // Çarşamba (index 2)
                            clinic.emergency_available_days[3], // Perşembe (index 3)
                            clinic.emergency_available_days[4], // Cuma (index 4)
                            clinic.emergency_available_days[5], // Cumartesi (index 5)
                            clinic.emergency_available_days[6], // Pazar (index 6)
                          ].map((isOpen, idx) => (
                            <div key={idx} className={`text-center py-1 px-1 rounded text-xs ${isOpen ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Location Info - Sağ sütun */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                {/* Service Duration - Enhanced Design */}
                {serviceDuration && (
                  <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800">Active Service Time</h4>
                          <p className="text-blue-600 font-medium">
                            {serviceDuration.years > 0 ? `${serviceDuration.years} years, ` : ''}{serviceDuration.months} months
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {clinic.phone_numbers && clinic.phone_numbers.map((phone, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-center">
                        {phone.phone_type === 'fixed_line' ? (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                  {clinic.clinic_email && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-center w-full">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {clinic.social_media && clinic.social_media.map((social, index) => (
                      <a 
                        key={index} 
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-700 font-medium text-sm">
                          {social.platform.charAt(0).toUpperCase() + social.platform.slice(1).toLowerCase()}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Veterinarians Section - Add this before Services section */}
        {veterinarians.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Our Veterinarians</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {veterinarians.slice(0, 6).map((vet) => (
                  <div 
                    key={vet.veterinarian_id} 
                    className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (vet.slug) {
                        navigate(`/veterinarians/profile/${vet.slug}`);
                      } else {
                        // Slug yoksa profil sayfasına yönlendirme yapmıyoruz
                        console.warn("Veterinarian has no slug:", vet.veterinarian_id);
                      }
                    }}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        {vet.user_profile_photo ? (
                          <img 
                            src={vet.user_profile_photo} 
                            alt={`Dr. ${vet.user_name} ${vet.user_surname}`}
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800">Dr. {vet.user_name} {vet.user_surname}</h3>
                          <p className="text-sm text-gray-500">Veterinarian</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (vet.slug) {
                            navigate(`/veterinarians/profile/${vet.slug}`);
                          } else {
                            console.warn("Veterinarian has no slug:", vet.veterinarian_id);
                          }
                        }}
                        className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full font-medium transition-colors"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {veterinarians.length > 6 && (
                <div className="mt-4 text-center">
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                    onClick={() => {
                      // Scroll to the veterinarians full section
                      document.getElementById('veterinarians-full-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    View All Veterinarians
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Services and Specialties */}
        {services && (
          <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Services & Specialties</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Animals Treated - Fixed Icon */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Animals Treated
                </h3>
                <div className="flex flex-wrap gap-2">
                  {services.animalTypes.map((type, index) => (
                    <span key={index} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Medical Services */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Medical Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {services.medicalServices.map((service, index) => (
                    <span key={index} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Additional Services */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Additional Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {services.additionalServices.map((service, index) => (
                    <span key={index} className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Map and Location Section */}
        {(clinic.latitude && clinic.longitude) && (
          <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Area Section */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Area
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {clinic?.province}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {clinic?.district}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Address Section */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Address
                    </h3>
                    <p className="text-gray-800">{clinic?.clinic_address}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-80 bg-gray-100 rounded-lg overflow-hidden relative">
              {/* Google Maps iframe*/}
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=REDACTED_GOOGLE_MAPS_KEY&q=${clinic?.latitude},${clinic?.longitude}&zoom=15&language=tr&maptype=roadmap`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Clinic Location"
              ></iframe>
              
              {/* Harita alt bilgi ve koordinatlar */}
              <div className="absolute bottom-4 right-4 z-10">
                <div className="bg-white p-2 rounded-lg shadow-md text-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      {clinic?.latitude ? Number(clinic.latitude).toFixed(6) : 'N/A'}, {clinic?.longitude ? Number(clinic.longitude).toFixed(6) : 'N/A'}
                    </span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${clinic?.latitude},${clinic?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reviews section (placeholder) */}
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Write a Review</button>
          </div>
          
          {/* Reviews Coming Soon message */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Reviews Coming Soon!</h3>
            <p className="text-blue-600 max-w-md mx-auto">
              We're working on adding reviews for {clinic.clinic_name}. Stay tuned to see what other pet owners think about their experience!
            </p>
          </div>
        </div>
      </div>
      
      {/* Photo Modal */}
      {showPhotoModal && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center" onClick={closePhotoModal}>
          <button className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="max-w-4xl max-h-[80vh] relative" onClick={e => e.stopPropagation()}>
            {/* Loading Spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            
            <img 
              src={photos[currentPhotoIndex]?.clinic_album_photo_url} 
              alt={`${clinic?.clinic_name}`}
              className={`max-h-[80vh] max-w-full ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            
            <div className="absolute inset-x-0 bottom-0 p-4 flex justify-between">
              <button 
                className="bg-black bg-opacity-50 p-2 rounded-full text-white"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="bg-black bg-opacity-50 h-10 flex items-center justify-center px-4 rounded-full text-white text-sm">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
              
              <button 
                className="bg-black bg-opacity-50 p-2 rounded-full text-white"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {showMessageModal && <MessageModal />}
      
      {/* Add auth modals at the bottom of the component */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onForgotPassword={handleForgotPassword}
      />
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onBackToLogin={handleBackToLogin}
      />
      
      {/* Add appointment modal */}
      {clinic && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          clinicId={clinic.clinic_id}
          clinicName={clinic.clinic_name}
          availableDays={clinic.available_days}
          openingTime={clinic.opening_time}
          closingTime={clinic.closing_time}
          timeSlotDuration={clinic.clinic_time_slots || 30}
          allowOnlineMeetings={true}
          onAppointmentCreated={() => {
            // Update pending appointment status when a new appointment is created
            setHasPendingAppointment(true);
            setIsAppointmentModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SingleClinicPage;
