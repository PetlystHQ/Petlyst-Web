import React, { useState, useCallback, useMemo } from 'react';
import { Tooltip } from '../shared/Tooltip';
import { ClinicFormData, LocationCoordinates } from '../../../types/clinic';
import TurkishCities from "../../../constants/TurkishCities";
import { MapComponent } from './MapComponent';


interface LocationsFormProps {
  formData: ClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  updateCoordinates: (coordinates: LocationCoordinates) => void;
  hasExistingClinic: boolean;
  loading: boolean;
}

export const LocationsForm: React.FC<LocationsFormProps> = ({
  formData,
  handleInputChange,
  updateCoordinates,
  hasExistingClinic,
  loading
}) => {
  // Default to 'manual' tab
  const [activeTab, setActiveTab] = useState<'manual' | 'map'>('manual');
  
  // Get the Provinces list
  const provinces = useMemo(() => {
    return Object.keys(TurkishCities).sort();
  }, []);
  
  // Get districts for a specific province
  const getDistricts = useCallback((province: string) => {
    return TurkishCities[province] ? TurkishCities[province].sort() : [];
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Location Details</h2>
          <Tooltip text="Add the physical location where your clinic operates" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Enter your clinic's location details
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`mr-4 py-2 px-4 text-sm font-medium ${
              activeTab === 'manual'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            }`}
            disabled={hasExistingClinic || loading}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'map'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            }`}
            disabled={hasExistingClinic || loading}
          >
            Choose from Map
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Manual Entry Form */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:space-x-4">
              <div className="md:w-1/2 mb-4 md:mb-0">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province *
                  </label>
                  <Tooltip text="Select the province where your clinic is located" />
                </div>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required
                  disabled={hasExistingClinic || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="" disabled>Select Province</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:w-1/2">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <Tooltip text="Select the district within the province where your clinic is located" />
                </div>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  disabled={hasExistingClinic || loading || !formData.province}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="" disabled>Select District</option>
                  {formData.province && getDistricts(formData.province).map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Address *
                </label>
                <Tooltip text="Enter the complete address including street, building number, etc." />
              </div>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                disabled={hasExistingClinic || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Enter your detailed address (street, number, etc.)"
              />
            </div>
          </div>
        )}

        {/* Map Selection */}
        {activeTab === 'map' && (
          <MapComponent
            formData={formData}
            handleInputChange={handleInputChange}
            updateCoordinates={updateCoordinates}
            hasExistingClinic={hasExistingClinic}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}; 