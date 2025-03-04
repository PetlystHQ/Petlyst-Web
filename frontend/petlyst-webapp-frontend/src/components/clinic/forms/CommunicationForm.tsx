import React, { useState, useEffect } from 'react';
import { SocialMediaSection } from './SocialMediaSection';

// Define SocialMediaLink type here temporarily
interface SocialMediaLink {
  platform: string;
  url: string;
}

// Define a custom interface that extends the existing ClinicFormData
interface ExtendedClinicFormData {
  name: string;
  clinicType: string;
  biography: string;
  establishment_date: string;
  social_media_links: SocialMediaLink[];
  province: string;
  district: string;
  address: string;
  phone_number: string;
  description: string;
  coordinates?: { lat: number; lng: number };
  // New properties for the Communication tab
  showPhoneNumber?: boolean;
  allowDirectMessages?: boolean;
}

interface CommunicationFormProps {
  formData: ExtendedClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSocialMediaChange: (index: number, field: 'platform' | 'url', value: string) => void;
  handleAddEmptySocialMedia: () => void;
  handleRemoveSocialMedia: (index: number) => void;
  hasExistingClinic: boolean;
  loading: boolean;
  setError: (error: string) => void; // Ana sayfadan hata göstermek için
}

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  formData,
  handleInputChange,
  handleSocialMediaChange,
  handleAddEmptySocialMedia,
  handleRemoveSocialMedia,
  hasExistingClinic,
  loading,
  setError
}) => {
  // State for phone validation
  const [phoneError, setPhoneError] = useState<string>('');
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);
  
  // Extend form data with the necessary fields if they don't exist
  const extendedFormData = {
    ...formData,
    showPhoneNumber: formData.showPhoneNumber || false,
    allowDirectMessages: formData.allowDirectMessages || false
  };

  // Validate phone when component mounts or phone_number changes
  useEffect(() => {
    if (formData.phone_number) {
      validatePhoneNumber(formData.phone_number);
    }
  }, [formData.phone_number]);

  // Check form submission validity and clear error messages when validation passes
  useEffect(() => {
    // İletişim formunda geçersiz telefon numarası girildiyse parent'a bildir
    if (formData.phone_number && !isPhoneValid) {
      // Ana sayfaya bir veri ekleyerek CommunicationForm validasyonunun durumunu bildir
      const communicationFormValid = false;
      document.body.dataset.communicationFormValid = String(communicationFormValid);
    } else {
      document.body.dataset.communicationFormValid = 'true';
      
      // Validasyon başarılı olduğunda, eğer önceden bir hata mesajı varsa temizle
      if (isPhoneValid && formData.phone_number) {
        setError(''); // Global hata mesajını temizle
      }
    }

    return () => {
      // Component unmount olduğunda veriyi temizle
      if (document.body.dataset.communicationFormValid) {
        delete document.body.dataset.communicationFormValid;
      }
    };
  }, [isPhoneValid, formData.phone_number, setError]);

  // Handle toggle changes
  const handleToggleChange = (field: 'showPhoneNumber' | 'allowDirectMessages') => {
    // This is a workaround for creating a synthetic event that works with handleInputChange
    const customEvent = {
      target: {
        name: field,
        value: !formData[field]
      }
    };
    
    // Call handleInputChange with our custom event
    // Using type assertion to make TypeScript happy
    handleInputChange(customEvent as unknown as React.ChangeEvent<HTMLInputElement>);
  };
  
  // Validate phone number
  const validatePhoneNumber = (phone: string) => {
    // Basic Türkiye phone number format: +90 5XX XXX XX XX or 05XX XXX XX XX
    const turkeyPhoneRegex = /^(\+90|0)?\s*5\d{2}\s*\d{3}\s*\d{2}\s*\d{2}$/;
    
    if (!phone) {
      setPhoneError('Phone number is required.');
      setIsPhoneValid(false);
      return false;
    }
    
    if (!turkeyPhoneRegex.test(phone)) {
      setPhoneError('Please enter a valid Turkish phone number. Example: +90 5XX XXX XX XX');
      setIsPhoneValid(false);
      return false;
    }
    
    setPhoneError('');
    setIsPhoneValid(true);
    return true;
  };
  
  // Handle phone input change with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Call the parent handleInputChange
    handleInputChange(e);
    // Validate on change but delay error display to avoid frustrating user while typing
    if (value.length > 5) {
      validatePhoneNumber(value);
    } else {
      setPhoneError('');
      setIsPhoneValid(false);
    }
  };
  
  // Validate on blur (when user finishes typing)
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validatePhoneNumber(e.target.value);
  };

  return (
    <div className="communication-form">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
        <p className="text-sm text-gray-600 mt-1">Configure your clinic's contact options and social media presence</p>
      </div>

      <div className="space-y-6">
        {/* Phone Number Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            required
            disabled={hasExistingClinic || loading}
            className={`w-full px-3 py-2 border ${phoneError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500`}
            placeholder="Enter phone number (e.g., +90 5XX XXX XX XX)"
          />
          {phoneError ? (
            <p className="mt-1 text-xs text-red-500">{phoneError}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Please enter a valid phone number including country code.
            </p>
          )}
        </div>

        {/* Toggle Switches in Card Style */}
        <div className="space-y-4">
          {/* Show Phone Number Toggle in Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Show Phone Number in Profile
              </label>
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleChange('showPhoneNumber')}
                disabled={hasExistingClinic || loading}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  extendedFormData.showPhoneNumber ? 'bg-blue-600' : 'bg-gray-200'
                } ${hasExistingClinic || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">Show phone number</span>
                <span
                  className={`pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    extendedFormData.showPhoneNumber ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  <span
                    className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                      extendedFormData.showPhoneNumber ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                    }`}
                  >
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span
                    className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                      extendedFormData.showPhoneNumber ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                    }`}
                  >
                    <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                    </svg>
                  </span>
                </span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, your clinic's phone number will be visible on your public profile
            </p>
          </div>

          {/* Allow Direct Messages Toggle in Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Allow Direct Messages
              </label>
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleChange('allowDirectMessages')}
                disabled={hasExistingClinic || loading}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  extendedFormData.allowDirectMessages ? 'bg-blue-600' : 'bg-gray-200'
                } ${hasExistingClinic || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">Allow direct messages</span>
                <span
                  className={`pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    extendedFormData.allowDirectMessages ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  <span
                    className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                      extendedFormData.allowDirectMessages ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                    }`}
                  >
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span
                    className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                      extendedFormData.allowDirectMessages ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                    }`}
                  >
                    <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                    </svg>
                  </span>
                </span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, clients can send direct messages to your clinic through the platform
            </p>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Social Media Accounts</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add your clinic's social media accounts to help clients connect with you online
          </p>
          
          <SocialMediaSection
            socialMediaLinks={formData.social_media_links}
            handleSocialMediaChange={handleSocialMediaChange}
            handleAddEmptySocialMedia={handleAddEmptySocialMedia}
            handleRemoveSocialMedia={handleRemoveSocialMedia}
            hasExistingClinic={hasExistingClinic}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}; 