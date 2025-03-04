import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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

const AddClinicPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const [currentStep, setCurrentStep] = useState<FormStep>('clinic_details');
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
    allowDirectMessages: false
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

  // Check if user already has a clinic
  useEffect(() => {
    const checkExistingClinics = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/clinics/my-clinics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && Array.isArray(response.data.clinics) && response.data.clinics.length > 0) {
          setHasExistingClinic(true);
          setError('You already have a registered clinic. Each veterinarian can only register one clinic.');
        }
      } catch (err: any) {
        console.error('Error checking existing clinics:', err);
      }
    };

    if (token) {
      checkExistingClinics();
    }
  }, [token]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateCoordinates = (coordinates: LocationCoordinates) => {
    setFormData(prev => ({
      ...prev,
      coordinates
    }));
  };

  const handleAddSocialMedia = (platform: string) => {
    // Check if the platform already exists
    const exists = formData.social_media_links.some(link => link.platform === platform);
    if (!exists) {
      setFormData(prev => ({
        ...prev,
        social_media_links: [...prev.social_media_links, { platform, url: '' }]
      }));
    }
  };

  const handleAddEmptySocialMedia = () => {
    setFormData(prev => ({
      ...prev,
      social_media_links: [...prev.social_media_links, { platform: '', url: '' }]
    }));
  };

  const handleRemoveSocialMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_media_links: prev.social_media_links.filter((_, i) => i !== index)
    }));
  };

  const handleSocialMediaChange = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => {
      const updatedLinks = [...prev.social_media_links];
      updatedLinks[index] = {
        ...updatedLinks[index],
        [field]: value
      };
      return {
        ...prev,
        social_media_links: updatedLinks
      };
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedPhotos.length > 5) {
      setError('You can only upload up to 5 photos');
      return;
    }

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Create preview URLs for selected photos
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    
    setSelectedPhotos(prev => [...prev, ...imageFiles]);
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setError('');
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (clinicId: string, clinicName: string) => {
    if (selectedPhotos.length === 0) return;

    const totalPhotos = selectedPhotos.length;
    let uploadedCount = 0;
    let errors: string[] = [];

    for (const photo of selectedPhotos) {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('clinicId', clinicId);
      formData.append('clinicName', clinicName);

      try {
        await axios.post(
          'http://localhost:3000/api/clinics/upload-photo',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = progressEvent.loaded / progressEvent.total;
                uploadedCount += progress / totalPhotos;
                setUploadProgress(Math.round(uploadedCount * 100));
              }
            }
          }
        );
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        const errorMessage = error.response?.data?.message || 'Failed to upload photo';
        errors.push(`Failed to upload ${photo.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  };

  const handleNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setError('');
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
    
    // Check if we're in communication step and the form data is valid
    if (currentStep === 'communication') {
      // Telefon numarası validasyonunu kontrol et
      const isCommunicationFormValid = document.body.dataset.communicationFormValid === 'true';
      
      // Eğer telefon numarası geçerli değilse, ilerlemesini engelle
      if (!isCommunicationFormValid && formData.phone_number) {
        setError('Please enter a valid phone number.');
        // Telefon numarası input'una odaklan
        const phoneInput = document.querySelector('input[name="phone_number"]') as HTMLInputElement;
        if (phoneInput) phoneInput.focus();
        return;
      } else {
        // Telefon numarası validasyonu başarılı, hata mesajını temizle
        setError('');
      }
    }
    
    // If not on the final step, go to next step
    if (currentStep !== 'tax_registration') {
      // Hata mesajını temizle ve sonraki adıma geç
      setError('');
      handleNextStep();
      return;
    }
    
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

      // First, create the clinic
      const response = await axios.post(
        'http://localhost:3000/api/clinics/add',
        formData,
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
          allowDirectMessages: false
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        setUploadProgress(0);

        // Redirect to dashboard after success message
        setTimeout(() => {
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
        <div className="mx-auto max-w-3xl w-full my-8 bg-white rounded-lg shadow p-6">
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
              <PlaceholderSection
                title="Visuals"
                subtitle="Add photos and images for your clinic"
                tooltipText="Upload photos and visuals that showcase your clinic"
              />
            )}

            {/* Services Section */}
            {currentStep === 'services' && (
              <PlaceholderSection
                title="Services"
                subtitle="Add services offered by your clinic"
                tooltipText="List the veterinary services your clinic provides to patients"
              />
            )}

            {/* Tax and Registration Section */}
            {currentStep === 'tax_registration' && (
              <PlaceholderSection
                title="Registration"
                subtitle="Add tax and registration information for your clinic"
                tooltipText="Provide legal and tax registration information for your clinic"
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
    </div>
  );
};

export default AddClinicPage; 