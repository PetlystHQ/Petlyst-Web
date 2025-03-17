import React, { useState, useEffect } from 'react';
import { SocialMediaSection } from './SocialMediaSection';
import { PhoneNumberSection } from './PhoneNumberSection';
import { PhoneNumberEntry } from '../../../types/clinic';

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
  phone_numbers: PhoneNumberEntry[]; // Updated to use phone_numbers array
  description: string;
  coordinates?: { lat: number; lng: number };
  // New properties for the Communication tab
  showPhoneNumber?: boolean;
  allowDirectMessages?: boolean;
  email?: string;
  showMailAddress?: boolean;
}

interface CommunicationFormProps {
  formData: ExtendedClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSocialMediaChange: (index: number, field: 'platform' | 'url', value: string) => void;
  handleAddEmptySocialMedia: () => void;
  handleRemoveSocialMedia: (index: number) => void;
  handlePhoneNumberChange: (index: number, field: 'type' | 'number', value: string) => void;
  handleAddEmptyPhoneNumber: () => void;
  handleRemovePhoneNumber: (index: number) => void;
  hasExistingClinic: boolean;
  loading: boolean;
  setError: (error: string) => void; // Ana sayfadan hata göstermek için
  attemptedSubmit?: boolean; // Continue tuşuna basıldığında true olacak prop
  isEditMode?: boolean;
}

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  formData,
  handleInputChange,
  handleSocialMediaChange,
  handleAddEmptySocialMedia,
  handleRemoveSocialMedia,
  handlePhoneNumberChange,
  handleAddEmptyPhoneNumber,
  handleRemovePhoneNumber,
  hasExistingClinic,
  loading,
  setError,
  attemptedSubmit = false, // Varsayılan olarak false
  isEditMode = false
}) => {
  // State for email validation
  const [emailError, setEmailError] = useState<string>('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  // Track which form fields have been touched by the user
  const [formTouched, setFormTouched] = useState({
    email: false,
    phone: false
  });

  // Extend form data with the necessary fields if they don't exist
  const extendedFormData = formData;

  // Check form submission validity and clear error messages when validation passes
  useEffect(() => {
    // Validate email address
    const isEmailAddressValid = formData.email && isEmailValid;
    
    // Validate at least one phone number is provided
    const hasValidPhoneNumber = formData.phone_numbers.length > 0 && 
      formData.phone_numbers.some(phone => phone.type && phone.number && phone.number.trim().length > 0);
    
    // Telefon numaralarının 11 haneli olup olmadığını kontrol et
    const hasValidPhoneNumberLength = checkPhoneNumberLength();
    
    // Form is valid only if email is valid
    // NOT: Telefon numarası validasyonları artık yerel olarak ele alınıyor, global hata mesajı göstermiyoruz
    const isCommunicationFormValid = isEmailAddressValid;
    
    // Store the validation state in the document body for the parent component to access
    document.body.dataset.communicationFormValid = String(isCommunicationFormValid);
    
    // Don't set error messages here - let the parent component handle error display
    // during form submission/validation
    
    return () => {
      // Component unmount olduğunda veriyi temizle
      if (document.body.dataset.communicationFormValid) {
        delete document.body.dataset.communicationFormValid;
      }
    };
  }, [formData.email, isEmailValid, formData.phone_numbers]);

  // Telefon numaralarının uzunluğunu kontrol eden fonksiyon
  const checkPhoneNumberLength = () => {
    // Boş telefon numarası girişlerini filtrele
    const validPhoneEntries = formData.phone_numbers.filter(
      phone => phone.type && phone.number && phone.number.trim().length > 0
    );
    
    // Hiç telefon numarası yoksa geçersiz
    if (validPhoneEntries.length === 0) {
      return false;
    }
    
    // Tüm telefon numaralarının 11 haneli olup olmadığını kontrol et
    const allPhoneNumbersValid = validPhoneEntries.every(phone => {
      const trimmedNumber = phone.number.trim().replace(/\s+/g, ''); // Boşlukları temizle
      return trimmedNumber.length === 11;
    });
    
    return allPhoneNumbersValid;
  };

  // Handle toggle changes
  const handleToggleChange = (field: 'showPhoneNumber' | 'allowDirectMessages' | 'showMailAddress') => {
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

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      // Email is now required
      setEmailError('Email address is required');
      setIsEmailValid(false);
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
      return false;
    } else {
      setEmailError('');
      setIsEmailValid(true);
      return true;
    }
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark email field as touched
    setFormTouched(prev => ({ ...prev, email: true }));
    
    // Standard input handling
    handleInputChange(e);
    
    // Validate the email as user types
    const isValid = validateEmail(e.target.value);
    
    // Eğer email artık geçerliyse, ana sayfadaki hata mesajını temizle
    if (isValid) {
      setError('');
    }
  };

  // Validate email when focus leaves the field
  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Mark email field as touched
    setFormTouched(prev => ({ ...prev, email: true }));
    
    // Validate email and clear general error if valid
    const isValid = validateEmail(e.target.value);
    if (isValid) {
      setError('');
    }
  };

  // Handle phone number changes without showing errors
  const handlePhoneChange = (index: number, field: 'type' | 'number', value: string) => {
    // Just update the phone number without triggering error display
    handlePhoneNumberChange(index, field, value);
  };

  // Handle adding empty phone number without showing errors
  const handleAddPhone = () => {
    // Just add a new phone number without triggering error display
    handleAddEmptyPhoneNumber();
  };

  // Handle removing phone number without showing errors
  const handleRemovePhone = (index: number) => {
    // Just remove the phone number without triggering error display
    handleRemovePhoneNumber(index);
  };

  // Check for incomplete phone numbers
  const incompletePhoneNumbers = formData.phone_numbers.filter(phone => 
    (phone.type && (!phone.number || phone.number.trim() === '')) || 
    (phone.number && phone.number.trim() !== '' && !phone.type)
  );
  
  const hasIncompletePhoneNumbers = incompletePhoneNumbers.length > 0;

  // Telefon numarası girilen ama 11 haneden az olan kayıtları kontrol et
  const invalidLengthPhoneNumbers = formData.phone_numbers.filter(phone => 
    phone.type && phone.number && phone.number.trim() !== '' && 
    phone.number.trim().replace(/\s+/g, '').length !== 11
  );
  
  const hasInvalidLengthPhoneNumbers = invalidLengthPhoneNumbers.length > 0;

  return (
    <div className="communication-form">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
        <p className="text-sm text-gray-600 mt-1">Configure your clinic's contact options and social media presence</p>
      </div>

      <div className="space-y-6">
        {/* Phone Numbers Section */}
        <div className="mb-6">
          <PhoneNumberSection
            phoneNumbers={formData.phone_numbers}
            handlePhoneNumberChange={handlePhoneChange}
            handleAddEmptyPhoneNumber={handleAddPhone}
            handleRemovePhoneNumber={handleRemovePhone}
            hasExistingClinic={hasExistingClinic && !isEditMode}
            loading={loading}
            invalidLengthPhoneNumbers={invalidLengthPhoneNumbers}
            attemptedSubmit={attemptedSubmit}
            setError={setError}
            isEditMode={isEditMode}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Add at least one phone number. You can add both fixed line and mobile numbers.
            </p>
          </div>
          
          {/* Warning message for incomplete phone numbers */}
          {hasIncompletePhoneNumbers && (
            <div className={`mt-2 p-2 ${attemptedSubmit ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'} rounded-md border`}>
              <p className={`text-xs ${attemptedSubmit ? 'text-red-700' : 'text-yellow-700'} flex items-center`}>
                <svg className={`h-4 w-4 mr-1 ${attemptedSubmit ? 'text-red-600' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  {attemptedSubmit ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                Please complete all phone number entries with both type and number, or remove incomplete entries
              </p>
            </div>
          )}
          
          {/* Warning message for invalid length phone numbers */}
          {hasInvalidLengthPhoneNumbers && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700 flex items-center">
                <svg className="h-4 w-4 mr-1 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Phone numbers must be exactly 11 digits. Please correct the highlighted entries.
              </p>
            </div>
          )}
        </div>

        {/* Social Media Section */}
        <div className="mb-6">
          <SocialMediaSection
            socialMediaLinks={formData.social_media_links}
            handleSocialMediaChange={handleSocialMediaChange}
            handleAddEmptySocialMedia={handleAddEmptySocialMedia}
            handleRemoveSocialMedia={handleRemoveSocialMedia}
            hasExistingClinic={hasExistingClinic && !isEditMode}
            loading={loading}
            isEditMode={isEditMode}
          />
        </div>

        {/* Email Address Section with Show Email Toggle Combined */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                disabled={(hasExistingClinic && !isEditMode) || loading}
                className={`w-full pl-3 pr-10 py-2 border ${
                  !formData.email 
                    ? 'border-gray-300' 
                    : isEmailValid 
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                      : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                } rounded-md shadow-sm focus:outline-none disabled:bg-gray-100 disabled:text-gray-500`}
                placeholder="Enter clinic email address"
                required
              />
              {formData.email && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isEmailValid ? (
                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {emailError ? (
              <p className="mt-1 text-xs text-red-500">{emailError}</p>
            ) : formData.email && isEmailValid ? (
              <p className="mt-1 text-xs text-green-500">Valid email format</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                This email will be used for official communications.
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Email Address in Profile
            </label>
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => handleToggleChange('showMailAddress')}
              disabled={(hasExistingClinic && !isEditMode) || loading}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                extendedFormData.showMailAddress ? 'bg-blue-600' : 'bg-gray-200'
              } ${hasExistingClinic || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="sr-only">Enable email display</span>
              <span
                className={`pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  extendedFormData.showMailAddress ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <span
                  className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                    extendedFormData.showMailAddress ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                  }`}
                >
                  <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                    <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span
                  className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${
                    extendedFormData.showMailAddress ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
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
            When enabled, your clinic's email address will be visible on your public profile.
          </p>
        </div>

        {/* Phone Number and Direct Messages Toggles in Same Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={(hasExistingClinic && !isEditMode) || loading}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  extendedFormData.showPhoneNumber ? 'bg-blue-600' : 'bg-gray-200'
                } ${hasExistingClinic || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">Enable phone number display</span>
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
                      <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
              When enabled, your clinic's phone numbers will be visible on your public profile.
            </p>
          </div>

          {/* Allow Direct Messages Toggle */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Allow Direct Messages
              </label>
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleChange('allowDirectMessages')}
                disabled={(hasExistingClinic && !isEditMode) || loading}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  extendedFormData.allowDirectMessages ? 'bg-blue-600' : 'bg-gray-200'
                } ${hasExistingClinic || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">Enable direct messages</span>
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
                      <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
              When enabled, pet owners can send direct messages to your clinic through the platform.
            </p>
          </div>
        </div>

        {/* Form validation note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-700 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            Form validation will be performed when you click the Continue button. Make sure to add at least one phone number and a valid email address before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
}; 