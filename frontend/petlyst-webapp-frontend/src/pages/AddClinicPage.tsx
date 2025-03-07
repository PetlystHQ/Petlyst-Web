import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useBeforeUnload } from 'react-router-dom';
import { RootState } from '../store';
import axios from 'axios';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { ClinicFormData, FormStep, SocialMediaLink, LocationCoordinates } from '../types/clinic';
import { ClinicDetailsForm } from '../components/clinic/forms/ClinicDetailsForm';
import { LocationsForm } from '../components/clinic/forms/LocationsForm';
import { PlaceholderSection } from '../components/clinic/forms/PlaceholderSection';
import { StepProgressBar } from '../components/clinic/progress/StepProgressBar';
import { MobileStepIndicator } from '../components/clinic/progress/MobileStepIndicator';
import { SuccessMessage } from '../components/clinic/SuccessMessage';
import { CommunicationForm } from '../components/clinic/forms/CommunicationForm';
import { toast } from 'react-hot-toast';
import { VisualsForm } from '../components/clinic/forms/VisualsForm';
import { ServicesForm } from '../components/clinic/forms/ServicesForm';
import { RegistrationForm } from '../components/clinic/forms/RegistrationForm';

const AddClinicPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const [currentStep, setCurrentStep] = useState<FormStep>('clinic_details');
  const [formModified, setFormModified] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [exitDestination, setExitDestination] = useState('');
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    clinicType: 'Veterinary Clinic',
    biography: '',
    establishment_date: '',
    social_media_links: [],
    
    // Location information
    province: '',
    district: '',
    address: '',
    
    phone_number: '',
    description: '',
    
    // New fields with default values
    showPhoneNumber: false,
    allowDirectMessages: false,
    
    // Services fields
    servedAnimalTypes: [],
    medicalServices: [],
    additionalServices: [],
    
    // Registration fields
    taxIdentificationNumber: '',
    veterinaryLicenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [hasExistingClinic, setHasExistingClinic] = useState(false);
  const { verificationStatus, isLoading: verificationLoading } = useVerificationStatus();
  
  // Photo upload states
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progress steps
  const steps: { id: FormStep; title: string }[] = [
    { id: 'clinic_details', title: 'Clinic Details' },
    { id: 'locations', title: 'Locations' },
    { id: 'communication', title: 'Communication' },
    { id: 'visuals', title: 'Visuals' },
    { id: 'services', title: 'Services' },
    { id: 'tax_registration', title: 'Registration' }
  ];

  // Add cleanup function to the component animations
  const style = document.createElement('style');
  style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out forwards;
  }
  `;
  document.head.appendChild(style);

  const cleanup = () => {
    // Remove animation styles when component unmounts
    document.head.removeChild(style);
  };

  // Check if user already has a clinic
  useEffect(() => {
    const checkExistingClinics = async () => {
      try {
        // API URL'yi kontrol et
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        
        const response = await axios.get(`${apiUrl}/api/clinics/my-clinics`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        
        // Kullanıcının kliniği varsa
        if (response.data.clinics && response.data.clinics.length > 0) {
          setHasExistingClinic(true);
          setError('You already have a registered clinic. Each veterinarian can only register one clinic.');
        } else {
          // Kullanıcı daha önce klinik eklemediyse, formun ilk yüklenişini işaretle
          setHasExistingClinic(false);
        }
      } catch (err) {
        // Hata durumunda sessizce ilerle ve normal form akışına devam et
        console.error('Error checking for existing clinics:', err);
        setHasExistingClinic(false); // Varsayılan olarak klinik olmadığını kabul et
      }
    };

    // Check for existing clinics when component mounts
    checkExistingClinics();
    
    // Add before unload event listener
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formModified && !success) {
        const message = "You have unsaved changes that will be lost if you leave this page.";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []);

  // Redirect if not verified or already has a clinic
  useEffect(() => {
    if (!verificationLoading) {
      if (verificationStatus !== 'verified') {
        navigate('/dashboard');
      }
    }
  }, [verificationStatus, verificationLoading, navigate]);

  // Clear error message when step changes
  useEffect(() => {
    // Adım değiştiğinde hata mesajını temizle
    setError('');
  }, [currentStep]);

  // Handle navigation away from the page
  const handleNavigation = useCallback((path: string) => {
    if (formModified && !success) {
      setExitDestination(path);
      setShowExitConfirmation(true);
    } else {
      navigate(path);
    }
  }, [formModified, navigate, success]);

  // Confirm navigation and proceed without saving
  const confirmNavigation = () => {
    setShowExitConfirmation(false);
    navigate(exitDestination);
  };

  // Save as draft and then navigate
  const saveAndNavigate = () => {
    setShowExitConfirmation(false);
    savePartialClinicData();
  };

  // Cancel navigation and stay on the page
  const cancelNavigation = () => {
    setShowExitConfirmation(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkbox inputs, use checked property
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    setFormModified(true);
  };

  const updateCoordinates = (coordinates: LocationCoordinates) => {
    setFormData(prev => ({
      ...prev,
      coordinates
    }));
    setFormModified(true);
  };

  const handleAddSocialMedia = (platform: string) => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks.push({ platform, url: '' });
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handleAddEmptySocialMedia = () => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks.push({ platform: '', url: '' });
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handleRemoveSocialMedia = (index: number) => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks.splice(index, 1);
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handleSocialMediaChange = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks[index] = {
        ...newSocialMediaLinks[index],
        [field]: value
      };
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedPhotos.length > 10) {
      setError('You can only upload up to 10 photos');
      return;
    }

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length < files.length) {
      setError('Only image files are allowed. Some files were not added.');
    }
    
    // Create preview URLs for selected photos
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    
    setSelectedPhotos(prev => [...prev, ...imageFiles]);
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setFormModified(true);
  };

  const handleRemovePhoto = (index: number) => {
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormModified(true);
  };

  const uploadPhotos = async (clinicId: string, clinicName: string) => {
    // API URL'yi kontrol et
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    if (selectedPhotos.length === 0) return;

    const uploadPromises = selectedPhotos.map(async (photo, index) => {
      setCurrentPhotoIndex(index);
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('clinicId', clinicId);
      formData.append('clinicName', clinicName);

      try {
        const response = await axios.post(
          `${apiUrl}/api/clinics/upload-photo`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token || localStorage.getItem('token')}`
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(progress);
              }
            }
          }
        );
        return response.data;
      } catch (err) {
        console.error('Error uploading photo:', err);
        throw err;
      }
    });

    try {
      await Promise.all(uploadPromises);
      console.log('All photos uploaded successfully');
    } catch (err) {
      console.error('Error uploading photos:', err);
      throw err;
    }
  };

  const handleNextStep = () => {
    setError('');
    
    // If we're on the communication step, check if any social media platforms have empty URLs
    if (currentStep === 'communication') {
      const emptyUrlPlatforms = formData.social_media_links.filter(link => 
        link.platform && !link.url.trim()
      );
      
      if (emptyUrlPlatforms.length > 0) {
        // Get the names of platforms with empty URLs for the error message
        const platformNames = emptyUrlPlatforms.map(link => link.platform).join(', ');
        setError(`Please add URLs for the following platforms: ${platformNames}`);
        return;
      }
    }

    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setError('');
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleGoToStep = (stepId: FormStep) => {
    setError('');
    setCurrentStep(stepId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for each step
    if (currentStep === 'clinic_details') {
      // Check if establishment date is provided and not in the future
      if (!formData.establishment_date) {
        setError('Please provide an establishment date');
        return;
      }
      
      const establishmentDate = new Date(formData.establishment_date);
      const currentDate = new Date();
      if (establishmentDate > currentDate) {
        setError('Establishment date cannot be in the future');
        return;
      }
    }
    
    if (currentStep === 'communication') {
      // Phone number validation
      const phoneRegex = /^\+90\d{10}$/;
      if (formData.phone_number && !phoneRegex.test(formData.phone_number)) {
        setError('Phone number must be in format: +90XXXXXXXXXX');
        return;
      }
    }
    
    if (currentStep === 'visuals') {
      // Check if at least 3 photos are uploaded
      if (selectedPhotos.length < 3) {
        setError('Please upload at least 3 photos');
        return;
      }
    }
    
    if (currentStep === 'services') {
      // Check if at least one animal type and one medical service are selected
      if (formData.servedAnimalTypes.length === 0) {
        setError('Please select at least one animal type');
        return;
      }
      
      if (formData.medicalServices.length === 0) {
        setError('Please select at least one medical service');
        return;
      }
    }
    
    if (currentStep === 'tax_registration') {
      // Validate tax identification number (VKN) - Should be 10 digits
      const vknRegex = /^\d{10}$/;
      if (!formData.taxIdentificationNumber || !vknRegex.test(formData.taxIdentificationNumber)) {
        setError('Tax identification number (VKN) must be 10 digits');
        return;
      }
      
      // Validate veterinary license number
      if (!formData.veterinaryLicenseNumber) {
        setError('Please enter your veterinary license number');
        return;
      }
    }
    
    // Clear any previous errors
    setError('');
    
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      if (!token) {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          setError('Authentication token not found. Please try logging in again.');
          return;
        }
      }

      // API URL'yi kontrol et
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      
      // First, create the clinic
      const response = await axios.post(
        `${apiUrl}/api/clinics/add`,
        {
          clinic_name: formData.name,
          clinic_type: formData.clinicType,
          clinic_address: formData.address || null,
          clinic_phone: formData.phone_number || null,
          clinic_email: null, // Kullanıcı tarafından girilmediğinden
          clinic_description: formData.biography || formData.description || null,
          available_days: null, // Kullanıcı tarafından girilmediğinden
          emergency_available_days: null, // Kullanıcı tarafından girilmediğinden
          opening_time: null, // Kullanıcı tarafından girilmediğinden
          closing_time: null, // Kullanıcı tarafından girilmediğinden
          coordinates: formData.coordinates || null,
          establishment_date: formData.establishment_date,
          show_phone_number: formData.showPhoneNumber,
          allow_direct_messages: formData.allowDirectMessages,
          province: formData.province || null,
          district: formData.district || null,
          social_media_links: formData.social_media_links || [],
          
          // Service related data
          served_animal_types: formData.servedAnimalTypes || [],
          medical_services: formData.medicalServices || [],
          additional_services: formData.additionalServices || [],

          is_partial_submission: false // Kısmi gönderim olup olmadığı
        },
        {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        }
      );

      if (response.status === 201) {
        // Then, upload photos if any are selected
        if (selectedPhotos.length > 0) {
          await uploadPhotos(response.data.clinic.id, response.data.clinic.name);
        }

        setSuccess(true);
        
        // Reset form
        setFormData({
          name: '',
          clinicType: 'Veterinary Clinic',
          biography: '',
          establishment_date: '',
          social_media_links: [],
          province: '',
          district: '',
          address: '',
          phone_number: '',
          description: '',
          showPhoneNumber: false,
          allowDirectMessages: false,
          servedAnimalTypes: [],
          medicalServices: [],
          additionalServices: [],
          taxIdentificationNumber: '',
          veterinaryLicenseNumber: ''
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        setUploadProgress(0);

        // Redirect to dashboard after success message
        setTimeout(() => {
          // Form is successfully submitted, we can skip the confirmation
          setFormModified(false);
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Clinic addition error:', err.response || err);
      setError(
        err.response?.data?.message || 
        err.response?.statusText || 
        err.message || 
        'Failed to add clinic. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Save partial clinic data when user wants to leave the page
  const savePartialClinicData = async () => {
    try {
      setLoading(true);
      const partialClinicData = {
        clinic_name: formData.name,
        clinic_type: formData.clinicType,
        establishment_date: formData.establishment_date,
        clinic_description: formData.description,
        is_partial_submission: true,
        
        // Optional fields that may not be filled yet
        clinic_address: formData.address || null,
        clinic_phone: formData.phone_number || null,
        province: formData.province || null,
        district: formData.district || null,
        
        // New fields
        show_phone_number: formData.showPhoneNumber,
        allow_direct_messages: formData.allowDirectMessages,
        
        // Social media links - if provided
        social_media_links: formData.social_media_links.length > 0 ? formData.social_media_links : null,
        
        // Coordinates - if provided
        coordinates: formData.coordinates || null,
        
        // Service fields
        served_animal_types: formData.servedAnimalTypes || [],
        medical_services: formData.medicalServices || [],
        additional_services: formData.additionalServices || [],
        
        // Registration fields - if provided
        tax_identification_number: formData.taxIdentificationNumber || null,
        veterinary_license_number: formData.veterinaryLicenseNumber || null
      };
      
      const storedToken = token || localStorage.getItem('token');
      if (!storedToken) {
        setError('Authentication token not found. Please try logging in again.');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      
      const response = await axios.post(
        `${apiUrl}/api/clinics/add`,
        partialClinicData,
        {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        }
      );

      if (response.status === 201) {
        // Show quick success message
        toast.success('Your clinic information has been saved as a draft.');
        
        // Navigate to dashboard after success
        setFormModified(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Partial clinic save error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to save clinic information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle services change
  const handleServicesChange = (
    field: 'servedAnimalTypes' | 'medicalServices' | 'additionalServices',
    value: string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormModified(true);
  };

  // Success message
  if (success) {
    return <SuccessMessage handleBackToDashboard={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img 
              src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
              alt="Petlyst Logo" 
              className="h-8 w-auto"
          />
          <span className="ml-3 text-xl font-semibold text-gray-800">Petlyst</span>
        </div>
        <button
          onClick={handleBackToDashboard}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </header>
      
      {/* Progress bars - Mobile and Desktop */}
      <MobileStepIndicator steps={steps} currentStep={currentStep} />
      <StepProgressBar 
        steps={steps} 
        currentStep={currentStep} 
        handleGoToStep={handleGoToStep} 
        loading={loading} 
      />
      
      <div className="flex-grow">
        {/* Main Content */}
        <div className={`mx-auto w-full my-8 bg-white rounded-lg shadow p-6 ${
          currentStep === 'locations' || currentStep === 'services' ? 'max-w-6xl' : 'max-w-3xl'
        }`}>
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Clinic Details Section */}
            {currentStep === 'clinic_details' && (
              <ClinicDetailsForm
                formData={formData}
                handleInputChange={handleInputChange}
                handleSocialMediaChange={handleSocialMediaChange}
                handleAddEmptySocialMedia={handleAddEmptySocialMedia}
                handleRemoveSocialMedia={handleRemoveSocialMedia}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
              />
            )}

            {/* Locations Section */}
            {currentStep === 'locations' && (
              <LocationsForm
                formData={formData}
                handleInputChange={handleInputChange}
                updateCoordinates={updateCoordinates}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
              />
            )}

            {/* Communication Section */}
            {currentStep === 'communication' && (
              <CommunicationForm
                formData={formData}
                handleInputChange={handleInputChange}
                handleSocialMediaChange={handleSocialMediaChange}
                handleAddEmptySocialMedia={handleAddEmptySocialMedia}
                handleRemoveSocialMedia={handleRemoveSocialMedia}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
                setError={setError}
              />
            )}

            {/* Visuals Section */}
            {currentStep === 'visuals' && (
              <VisualsForm
                selectedPhotos={selectedPhotos}
                photoPreviewUrls={photoPreviewUrls}
                handlePhotoSelect={handlePhotoSelect}
                handleRemovePhoto={handleRemovePhoto}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
                error={error}
                setError={setError}
              />
            )}

            {/* Services Section */}
            {currentStep === 'services' && (
              <ServicesForm
                formData={{
                  servedAnimalTypes: formData.servedAnimalTypes || [],
                  medicalServices: formData.medicalServices || [],
                  additionalServices: formData.additionalServices || []
                }}
                handleServicesChange={handleServicesChange}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
              />
            )}

            {/* Tax and Registration Section */}
            {currentStep === 'tax_registration' && (
              <RegistrationForm
                formData={formData}
                handleInputChange={handleInputChange}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
              />
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {currentStep !== 'clinic_details' && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={loading}
                  className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                    loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Previous
                </button>
              )}
              <button
                type="submit"
                disabled={hasExistingClinic || loading}
                className={`px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  hasExistingClinic || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${currentStep === 'clinic_details' ? 'ml-auto' : ''}`}
              >
                {loading 
                  ? 'Submitting...' 
                  : currentStep === 'tax_registration' 
                    ? 'Submit' 
                    : (
                      <span className="flex items-center">
                        Continue
                        <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    )
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">
              {formData.name && formData.establishment_date 
                ? "You can save your progress as a draft or leave without saving."
                : "All your changes will be lost if you leave this page."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Stay on this page
              </button>
              
              {formData.name && formData.establishment_date && (
                <button
                  onClick={saveAndNavigate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save as Draft
                </button>
              )}
              
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddClinicPage; 