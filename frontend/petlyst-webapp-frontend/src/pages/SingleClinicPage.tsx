import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  phone_numbers?: { type: string; number: string }[];
  social_media?: { platform: string; url: string }[];
  clinic_verification_status: string;
  is_open_24_7?: string;
}

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
}

const SingleClinicPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  
  // States
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<ClinicServices | null>(null);
  const [photos, setPhotos] = useState<ClinicPhoto[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch clinic data on component mount
  useEffect(() => {
    const fetchClinicData = async () => {
      if (!clinicId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch clinic details
        const response = await axios.get(`/api/pet-owners/clinics/${clinicId}`);
        if (response.data.success) {
          setClinic(response.data.clinic);
        } else {
          setError('Failed to fetch clinic details');
        }
        
        // Fetch clinic photos
        const photosResponse = await axios.get(`/api/pet-owners/clinics/${clinicId}/photos`);
        if (photosResponse.data.success) {
          setPhotos(photosResponse.data.photos || []);
        }
        
        // Fetch clinic services
        const servicesResponse = await axios.get(`/api/pet-owners/clinics/${clinicId}/services`);
        if (servicesResponse.data.success) {
          setServices(servicesResponse.data.services);
        }
        
        // Fetch clinic veterinarians (public endpoint)
        const vetsResponse = await axios.get(`/api/pet-owners/clinics/${clinicId}/public-veterinarians`);
        if (vetsResponse.data.success) {
          setVeterinarians(vetsResponse.data.veterinarians || []);
        }
        
      } catch (err: any) {
        console.error('Error fetching clinic data:', err);
        setError('Failed to load clinic data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClinicData();
  }, [clinicId]);
  
  // Format day names
  const getDayName = (index: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if clinic is open today
    if (!clinic.available_days[day]) return false;
    
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
  
  // Navigate to next photo in carousel
  const nextPhoto = () => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };
  
  // Navigate to previous photo in carousel
  const prevPhoto = () => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };
  
  // Handle booking appointment
  const handleBookAppointment = () => {
    if (!clinic) return;
    navigate(`/booking/${clinic.clinic_id}`);
  };
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Fixed CTA button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleBookAppointment}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-full shadow-lg flex items-center transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Book Appointment
        </button>
      </div>
      
      {/* Clinic Photos Carousel */}
      <div className="relative h-80 md:h-96 bg-gray-900">
        {photos.length > 0 ? (
          <>
            <img 
              src={photos[currentPhotoIndex]?.clinic_album_photo_url} 
              alt={`${clinic.clinic_name}`}
              className="w-full h-full object-cover"
            />
            {/* Carousel Navigation */}
            {photos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between p-4">
                <button 
                  onClick={prevPhoto}
                  className="bg-white/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={nextPhoto}
                  className="bg-white/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            {/* Photo Counter */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No photos available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Clinic Title and Type */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{clinic.clinic_name}</h1>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {formatClinicType(clinic.clinic_type)}
                </span>
                <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isOpenNow() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isOpenNow() ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {isOpenNow() ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>
            <button
              onClick={handleBookAppointment}
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md shadow-sm flex items-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Appointment
            </button>
          </div>
          
          {/* Clinic Description */}
          {clinic.clinic_description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">About the Clinic</h2>
              <p className="text-gray-600 whitespace-pre-line">{clinic.clinic_description}</p>
            </div>
          )}
          
          {/* Hours and Location Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Working Hours */}
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
                    {clinic.available_days.map((isOpen, idx) => (
                      <div key={idx} className={`text-center py-1 px-1 rounded text-xs ${isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {getDayName(idx).substring(0, 3)}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Emergency Service */}
              {clinic.emergency_available_days && clinic.emergency_available_days.some(day => day) && (
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <p className="text-sm font-medium text-orange-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Emergency Service Available
                  </p>
                </div>
              )}
            </div>
            
            {/* Location Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h3>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Address:</span> {clinic.clinic_address}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Area:</span> {clinic.district}, {clinic.province}
              </p>
              
              {/* Contact Information */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                {clinic.phone_numbers && clinic.phone_numbers.length > 0 && (
                  <div className="text-gray-600 mb-1">
                    <span className="font-medium">Phone:</span> {clinic.phone_numbers[0].number}
                  </div>
                )}
                {clinic.clinic_email && (
                  <div className="text-gray-600">
                    <span className="font-medium">Email:</span> {clinic.clinic_email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Services and Specialties */}
        {services && (
          <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Services & Specialties</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Animal Types */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 4.51 10.09 5 9 5H7a2 2 0 00-2 2v3m7 10v-5" />
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
        
        {/* Veterinarians */}
        {veterinarians.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Our Veterinarians</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {veterinarians.map((vet) => (
                <div 
                  key={vet.id} 
                  className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/veterinarians/profile/${vet.id}`)}
                >
                  <div className="p-5">
                    <div className="flex items-center mb-3">
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
                    
                    {vet.expertise && vet.expertise.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {vet.expertise.slice(0, 2).map((exp, idx) => (
                            <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {exp.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {vet.expertise.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              +{vet.expertise.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/veterinarians/profile/${vet.id}`);
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                    >
                      View Profile
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Map */}
        {(clinic.latitude && clinic.longitude) && (
          <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
            <div className="h-80 bg-gray-200 rounded-lg">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, borderRadius: '0.5rem' }}
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${clinic.latitude},${clinic.longitude}`}
                allowFullScreen
              ></iframe>
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
    </div>
  );
};

export default SingleClinicPage;
