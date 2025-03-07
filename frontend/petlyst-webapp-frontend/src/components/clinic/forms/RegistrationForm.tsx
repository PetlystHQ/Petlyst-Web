import React from 'react';
import { Tooltip } from '../shared/Tooltip';
import { ClinicFormData } from '../../../types/clinic';

interface RegistrationFormProps {
  formData: ClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  hasExistingClinic: boolean;
  loading: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  handleInputChange,
  hasExistingClinic,
  loading
}) => {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Registration</h2>
          <Tooltip text="Provide official identification numbers for your clinic" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Enter your clinic's official registration information for verification purposes.
        </p>
      </div>

      {/* Verification Note Card */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Why we need this information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                These identification numbers are required to verify that your clinic is a legitimate veterinary establishment. 
                We use this information solely for verification purposes and to ensure the authenticity of clinics on our platform.
              </p>
            </div>
            <div className="mt-2 text-sm text-blue-600 font-medium">
              Your information is secure and only used for verification.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tax Identification Number (VKN) */}
        <div>
          <div className="flex items-center">
            <label htmlFor="taxIdentificationNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Vergi Kimlik Numarası (VKN) <span className="text-red-500">*</span>
            </label>
            <Tooltip text="Your clinic's 10-digit Tax Identification Number assigned by the tax authority" />
          </div>
          <input
            type="text"
            id="taxIdentificationNumber"
            name="taxIdentificationNumber"
            value={formData.taxIdentificationNumber || ''}
            onChange={handleInputChange}
            required
            disabled={hasExistingClinic || loading}
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit number (e.g., 1234567890)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">Enter your clinic's 10-digit tax identification number</p>
        </div>

        {/* Veterinary License Number */}
        <div>
          <div className="flex items-center">
            <label htmlFor="veterinaryLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Veteriner Ruhsat Numarası <span className="text-red-500">*</span>
            </label>
            <Tooltip text="The license number issued by the veterinary authority that permits your clinic to operate" />
          </div>
          <input
            type="text"
            id="veterinaryLicenseNumber"
            name="veterinaryLicenseNumber"
            value={formData.veterinaryLicenseNumber || ''}
            onChange={handleInputChange}
            required
            disabled={hasExistingClinic || loading}
            placeholder="Enter your veterinary license number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">The official license number that permits your clinic to operate as a veterinary establishment</p>
        </div>
      </div>
    </div>
  );
}; 