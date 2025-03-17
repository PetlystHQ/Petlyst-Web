import React from 'react';
import { Tooltip } from '../shared/Tooltip';
import { ClinicFormData } from '../../../types/clinic';

interface RegistrationFormProps {
  formData: ClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  hasExistingClinic: boolean;
  loading: boolean;
  isEditMode?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  handleInputChange,
  hasExistingClinic,
  loading,
  isEditMode = false
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax and Veterinary License Information</h2>
        <p className="text-gray-600 text-sm">
          Please provide your tax identification number (VKN) and veterinary license number to complete your clinic registration.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tax Identification Number */}
        <div>
          <label htmlFor="taxIdentificationNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Tax Identification Number (VKN) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="taxIdentificationNumber"
              id="taxIdentificationNumber"
              value={formData.taxIdentificationNumber || ''}
              onChange={handleInputChange}
              maxLength={10}
              disabled={(hasExistingClinic && !isEditMode) || loading}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-3 sm:text-sm border-gray-300 rounded-md"
              placeholder="10-digit Tax ID"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Enter your 10-digit Tax Identification Number (VKN)</p>
        </div>

        {/* Veterinary License Number */}
        <div>
          <label htmlFor="veterinaryLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Veterinary License Number <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="veterinaryLicenseNumber"
              id="veterinaryLicenseNumber"
              value={formData.veterinaryLicenseNumber || ''}
              onChange={handleInputChange}
              disabled={(hasExistingClinic && !isEditMode) || loading}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full px-4 py-3 sm:text-sm border-gray-300 rounded-md"
              placeholder="Veterinary License Number"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Enter your veterinary license number</p>
        </div>
      </div>
    </div>
  );
}; 