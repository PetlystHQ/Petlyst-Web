import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../store';

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

  useEffect(() => {
    const fetchClinicDetails = async () => {
      if (!user) {
        console.error('User not found in Redux state');
        setUnauthorized(true);
        return;
      }
      
      console.log('User from Redux:', user);
      console.log('Clinic ID from params:', clinicId);
      
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        
        console.log('Clinic API response:', response.data);
        
        if (!response.data.clinic) {
          console.error('No clinic data in API response');
          setError('No clinic data found');
          setLoading(false);
          return;
        }
        
        const clinicData = response.data.clinic;
        
        console.log('Clinic verification status:', clinicData.clinic_verification_status);
        console.log('Clinic operator ID:', clinicData.clinic_operator_id);
        console.log('Current user ID:', user.id);

        // Check verification status with more logging and string trimming
        const status = clinicData.clinic_verification_status ? clinicData.clinic_verification_status.trim() : '';
        console.log('Trimmed status:', status);
        
        if (status !== 'pending' && status !== 'pending_submission') {
          console.error(`Unauthorized: Clinic status "${status}" is not pending or pending_submission`);
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        // Convert both IDs to strings and trim for comparison
        const clinicOperatorId = String(clinicData.clinic_operator_id).trim();
        const userId = String(user.id).trim();
        console.log('Comparing IDs - Clinic operator:', clinicOperatorId, 'Current user:', userId);
        
        if (clinicOperatorId !== userId) {
          console.error('Unauthorized: User is not the clinic operator');
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        console.log('Authorization checks passed, setting clinic data');
        setClinic(clinicData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching clinic details:', err);
        console.error('Response data:', err.response?.data);
        console.error('Status code:', err.response?.status);
        
        if (err.response?.status === 403 || err.response?.status === 401) {
          setUnauthorized(true);
        } else {
          setError(err.response?.data?.message || 'Failed to load clinic details');
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
      navigate('/dashboard');
    }
  }, [unauthorized, navigate]);

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

  const getDayName = (index: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clinic details...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return null;
  }

  if (error) {
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
              onClick={() => navigate('/dashboard')}
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <p className="text-gray-600">No clinic data found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          onClick={() => navigate('/dashboard')}
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
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {clinic.clinic_verification_status.charAt(0).toUpperCase() + clinic.clinic_verification_status.slice(1)}
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

        {/* Location Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{clinic.clinic_address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Province / District</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {clinic.province}, {clinic.district}
                </p>
              </div>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Working Hours</h2>
            
            {clinic.is_open_24_7 === 'Yes' ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">This clinic is open 24/7</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Opening Time</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{clinic.opening_time}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Closing Time</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{clinic.closing_time}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-500 mb-2">Working Days</p>
                  <div className="flex flex-wrap gap-2">
                    {clinic.available_days && clinic.available_days.map((isAvailable, index) => (
                      <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-500 line-through'
                      }`}>
                        {getDayName(index)}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Emergency Service Days</p>
                  {clinic.emergency_available_days && clinic.emergency_available_days.some(day => day) ? (
                    <div className="flex flex-wrap gap-2">
                      {clinic.emergency_available_days.map((isAvailable, index) => (
                        isAvailable && (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            {getDayName(index)}
                          </span>
                        )
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No emergency service days</p>
                  )}
                </div>
              </>
            )}
            
            {clinic.allow_online_meetings && (
              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Photos */}
        {clinic.photos && clinic.photos.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinic Photos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {clinic.photos.map((photo, index) => (
                  <div key={index} className="rounded-lg overflow-hidden h-48 bg-gray-100">
                    <img 
                      src={photo.url} 
                      alt={`Clinic photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default ClinicPreviewPage; 