import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import axios from 'axios';
import { useVerificationStatus } from '../hooks/useVerificationStatus';

interface SocialMediaLink {
  platform: string;
  url: string;
}

interface ClinicFormData {
  name: string;
  clinicType: string;
  biography: string;
  establishment_date: string;
  social_media_links: SocialMediaLink[];
  address: string;
  phone_number: string;
  description: string;
}

type FormStep = 'clinic_details' | 'locations' | 'communication' | 'visuals' | 'services' | 'tax_registration';

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
    address: '',
    phone_number: '',
    description: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleGoToStep = (stepId: FormStep) => {
    setCurrentStep(stepId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If not on the final step, go to next step
    if (currentStep !== 'tax_registration') {
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
          address: '',
          phone_number: '',
          description: ''
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

  // Progress indicator component
  const StepProgressBar = () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    
    // Icons for each step type
    const getStepIcon = (stepId: FormStep) => {
      switch(stepId) {
        case 'clinic_details':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          );
        case 'locations':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          );
        case 'communication':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          );
        case 'visuals':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case 'services':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          );
        case 'tax_registration':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
      }
    };
    
    return (
      <div className="hidden md:block bg-white py-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-12">
          <div className="flex items-center justify-evenly space-x-4">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <React.Fragment key={step.id}>
                  {/* Step indicator box with text and icon */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleGoToStep(step.id)}
                      disabled={loading || index > currentStepIndex}
                      className={`w-[150px] h-10 rounded shadow-sm flex items-center justify-center transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white ring-1 ring-blue-100'
                          : isCompleted
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-500 border border-gray-300'
                      }`}
                    >
                      <div className={`${isActive || isCompleted ? 'text-white' : 'text-gray-400'} mr-2`}>
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          getStepIcon(step.id)
                        )}
                      </div>
                      <span className="text-sm font-medium truncate">
                        {step.title}
                      </span>
                    </button>
                  </div>
                  
                  {/* Connector between steps */}
                  {index < steps.length - 1 && (
                    <div className="flex items-center justify-center">
                      <svg 
                        className={`w-5 h-5 ${
                          isCompleted ? 'text-blue-500' : 'text-gray-300'
                        } transition-colors duration-200`}
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          d="M9 6l6 6-6 6" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Mobile step indicator
  const MobileStepIndicator = () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    
    return (
      <div className="md:hidden w-full px-4 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <p className="text-sm font-medium text-blue-600">
            {steps[currentStepIndex].title}
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Add a new tooltip component near the top of the component function
  const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative ml-2 inline-block">
      <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="absolute z-10 w-48 p-2 bg-gray-800 text-xs text-white rounded shadow-lg opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 transition-opacity duration-300 pointer-events-none">
        {text}
        <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
      </div>
    </div>
  );

  // Success message
  if (success) {
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
        
        <div className="flex-grow flex items-center justify-center">
          <div className="max-w-2xl w-full mx-auto my-8 p-6 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clinic Added Successfully!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Your clinic has been added and is pending verification.
              </p>
              <button
                onClick={handleBackToDashboard}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
      <MobileStepIndicator />
      <StepProgressBar />
      
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
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Let's Start</h2>
                  <p className="text-sm text-gray-600 mt-1">Adding clinic details will help us to create inclusive page for your clinic!</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex flex-col md:flex-row md:space-x-4">
                      <div className="md:w-2/5 mb-4 md:mb-0">
                        <div className="flex items-center">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Clinic Type *
                          </label>
                          <Tooltip text="Select whether your establishment is an Animal Hospital or a Veterinary Clinic according to regulations" />
                        </div>
                        <select
                          name="clinicType"
                          value={formData.clinicType}
                          onChange={handleInputChange}
                          required
                          disabled={hasExistingClinic || loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="Veterinary Clinic">Veterinary Clinic</option>
                          <option value="Animal Hospital">Animal Hospital</option>
                        </select>
                      </div>
                      <div className="md:w-3/5">
                        <div className="flex items-center">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Clinic Name *
                          </label>
                          <Tooltip text="Enter the official name of your veterinary establishment" />
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            disabled={hasExistingClinic || loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 pr-[130px]"
                            placeholder="Enter clinic name"
                          />
                          <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
                            <div className="h-full w-px bg-gray-300 mr-2"></div>
                            <div className="pr-3 text-gray-500 text-sm font-medium">
                              {formData.clinicType === "Animal Hospital" ? "Animal Hospital" : "Veterinary Clinic"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <a href="https://www.resmigazete.gov.tr/eskiler/2011/12/20111221-8.htm" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        Learn more about clinic type regulations
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic Biography
                      </label>
                      <Tooltip text="Provide a detailed description of your clinic's history, expertise, and unique features" />
                    </div>
                    <textarea
                      name="biography"
                      value={formData.biography}
                      onChange={handleInputChange}
                      rows={4}
                      disabled={hasExistingClinic || loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Tell us about your clinic"
                    ></textarea>
                  </div>

                  <div>
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic Establishment Date
                      </label>
                      <Tooltip text="The month and year when your clinic was officially established" />
                    </div>
                    <input
                      type="month"
                      name="establishment_date"
                      value={formData.establishment_date}
                      onChange={handleInputChange}
                      disabled={hasExistingClinic || loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        URLs
                      </label>
                      <Tooltip text="Add your clinic's social media profiles and website links" />
                    </div>
                    
                    <div className="space-y-3">
                      {formData.social_media_links.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Optional: Add your clinic's social media links</p>
                      )}
                      
                      {formData.social_media_links.map((link, index) => {
                        // Define all icons outside of the switch statement
                        const facebookIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                        </svg>;
                        
                        const instagramIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428.247-.67.632-1.276 1.153-1.772a4.91 4.91 0 011.772-1.153c.637-.247 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
                        </svg>;
                        
                        const twitterIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                        </svg>;
                        
                        const linkedinIcon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>;
                        
                        // Get the appropriate icon and color based on the current platform
                        let icon;
                        let iconColor;
                        
                        switch(link.platform) {
                          case 'Facebook':
                            icon = facebookIcon;
                            iconColor = "text-blue-600";
                            break;
                          case 'Instagram':
                            icon = instagramIcon;
                            iconColor = "text-pink-600";
                            break;
                          case 'Twitter':
                            icon = twitterIcon;
                            iconColor = "text-blue-400";
                            break;
                          case 'LinkedIn':
                            icon = linkedinIcon;
                            iconColor = "text-blue-700";
                            break;
                          default:
                            icon = null;
                            iconColor = "text-gray-600";
                        }
                        
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1/3">
                              <div className="relative">
                                <select 
                                  value={link.platform}
                                  onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                                  disabled={hasExistingClinic || loading}
                                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                  <option value="" disabled>Choose Platform</option>
                                  {!formData.social_media_links.some((l, i) => i !== index && l.platform === 'Facebook') && (
                                    <option value="Facebook">Facebook</option>
                                  )}
                                  {!formData.social_media_links.some((l, i) => i !== index && l.platform === 'Instagram') && (
                                    <option value="Instagram">Instagram</option>
                                  )}
                                  {!formData.social_media_links.some((l, i) => i !== index && l.platform === 'Twitter') && (
                                    <option value="Twitter">Twitter</option>
                                  )}
                                  {!formData.social_media_links.some((l, i) => i !== index && l.platform === 'LinkedIn') && (
                                    <option value="LinkedIn">LinkedIn</option>
                                  )}
                                </select>
                                {/* Position the icon with proper alignment */}
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                  <div className={iconColor}>
                                    {icon}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-2/3">
                              <div className="flex items-center">
                                <div className="w-full">
                                  <input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                                    placeholder="Enter URL"
                                    disabled={hasExistingClinic || loading || !link.platform}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                  />
                                </div>
                                {/* Styled delete button in a square box */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSocialMedia(index)}
                                  disabled={hasExistingClinic || loading}
                                  className="ml-2 w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md bg-white text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Add new social media row */}
                      <button
                        type="button"
                        onClick={handleAddEmptySocialMedia}
                        disabled={hasExistingClinic || loading}
                        className="w-full mt-2 py-3 px-3 border border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 focus:outline-none transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm text-blue-600 font-medium">Add social media link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Locations Section - Placeholder */}
            {currentStep === 'locations' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
                    <Tooltip text="Add the physical locations where your clinic operates" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Add your clinic's location details</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">Location content will be implemented in the next phase</p>
                </div>
              </div>
            )}

            {/* Communication Section - Placeholder */}
            {currentStep === 'communication' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
                    <Tooltip text="Specify how clients can contact your clinic" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Add your clinic's contact details</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">Communication content will be implemented in the next phase</p>
                </div>
              </div>
            )}

            {/* Visuals Section - Placeholder */}
            {currentStep === 'visuals' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Visuals</h2>
                    <Tooltip text="Upload photos and visuals that showcase your clinic" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Add photos and images for your clinic</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">Visuals content will be implemented in the next phase</p>
                </div>
              </div>
            )}

            {/* Services Section - Placeholder */}
            {currentStep === 'services' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                    <Tooltip text="List the veterinary services your clinic provides to patients" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Add services offered by your clinic</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">Services content will be implemented in the next phase</p>
                </div>
              </div>
            )}

            {/* Tax and Registration Section - Placeholder */}
            {currentStep === 'tax_registration' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Registration</h2>
                    <Tooltip text="Provide legal and tax registration information for your clinic" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Add tax and registration information for your clinic</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">Tax and Registration content will be implemented in the next phase</p>
                </div>
              </div>
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