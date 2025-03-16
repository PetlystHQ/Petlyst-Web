import React from 'react';
import { Tooltip } from '../shared/Tooltip';
import { ClinicFormData } from '../../../types/clinic';

interface ClinicDetailsFormProps {
  formData: ClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSocialMediaChange: (index: number, field: 'platform' | 'url', value: string) => void;
  handleAddEmptySocialMedia: () => void;
  handleRemoveSocialMedia: (index: number) => void;
  hasExistingClinic: boolean;
  loading: boolean;
}

export const ClinicDetailsForm: React.FC<ClinicDetailsFormProps> = ({
  formData,
  handleInputChange,
  handleSocialMediaChange,
  handleAddEmptySocialMedia,
  handleRemoveSocialMedia,
  hasExistingClinic,
  loading
}) => {
  return (
    <div>
      {/* Clinic Details Section - Yeni başlık */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Clinic Details</h3>
        <p className="text-sm text-gray-600 mt-1">Enter the basic information about your veterinary clinic.</p>
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
            max={new Date().toISOString().slice(0, 7)}
            disabled={hasExistingClinic || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
      </div>
    </div>
  );
}; 