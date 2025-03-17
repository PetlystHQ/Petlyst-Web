import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  isEditMode?: boolean;
}

export const LocationsForm: React.FC<LocationsFormProps> = ({
  formData,
  handleInputChange,
  updateCoordinates,
  hasExistingClinic,
  loading,
  isEditMode = false
}) => {
  // Get the Provinces list
  const provinces = useMemo(() => {
    return Object.keys(TurkishCities).sort();
  }, []);
  
  // Get districts for a specific province
  const getDistricts = useCallback((province: string) => {
    return TurkishCities[province] ? TurkishCities[province].sort() : [];
  }, []);

  // Create a function to refresh the manual address fields based on map coordinates
  const refreshFromMap = useCallback(() => {
    // This is just a visual indicator - the actual data update happens in MapComponent
    if (formData.coordinates) {
      // Show a brief "refreshing" indicator
      setRefreshing(true);
      
      // Create a synthetic event to trigger the update
      const event = {
        target: {
          name: 'coordinates',
          // Create a shallow copy of the coordinates to force a refresh
          value: { ...formData.coordinates }
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      // Use handleInputChange to refresh the fields
      handleInputChange(event);
      
      // Hide the refreshing indicator after a short delay
      setTimeout(() => setRefreshing(false), 800);
    } else {
      setRefreshing(false);
    }
  }, [formData.coordinates, handleInputChange]);

  // State to track refreshing indicator
  const [refreshing, setRefreshing] = useState(false);

  // This function wraps updateCoordinates to add debugging
  const handleCoordinatesUpdate = (coordinates: LocationCoordinates) => {
    console.log("LocationsForm: Updating coordinates:", coordinates);
    updateCoordinates(coordinates);
  };
  
  const handleRefreshMap = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Render the address form fields component
  const renderAddressFields = () => {
    return (
      <div className="space-y-6 p-3 border border-gray-200 rounded-md bg-gray-50 h-[430px] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium text-gray-700">Refine Address Details</h3>
        </div>
        
        <div className="flex flex-col space-y-4 flex-grow flex-shrink-0 justify-between">
          <div className="space-y-4">
            <div>
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
                disabled={(hasExistingClinic && !isEditMode) || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="" disabled>Select Province</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            
            <div>
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
                disabled={(hasExistingClinic && !isEditMode) || loading || !formData.province}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="" disabled>Select District</option>
                {formData.province && getDistricts(formData.province).map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pb-1">
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
              rows={5}
              disabled={(hasExistingClinic && !isEditMode) || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Enter your detailed address (street, number, etc.)"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Location Details</h2>
          <Tooltip text="Add the physical location where your clinic operates" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Place a pin on the map to select your clinic's location, then refine the address details on the right.
        </p>
      </div>

      {/* Side-by-side layout: Map on left, Address fields on right */}
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Map container - takes 60% on desktop */}
        <div className="md:w-3/5 mb-6 md:mb-0 flex flex-col">
          {/* Styled container for map that matches the address details section */}
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50 h-[430px] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-700">Select Location on Map</h3>
            </div>
            <div className="flex-grow relative">
              <MapComponent
                formData={formData}
                updateField={(name, value) => {
                  // Create a synthetic event object to use with handleInputChange
                  let fieldName = name;
                  
                  // Map detailedAddress to address in the form
                  if (name === 'detailedAddress') {
                    fieldName = 'address';
                  }
                  
                  const syntheticEvent = {
                    target: {
                      name: fieldName,
                      value,
                      type: 'text' // Default type
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  
                  handleInputChange(syntheticEvent);
                  
                  // If this is updating coordinates, also call updateCoordinates
                  if (name === 'coordinates' && typeof value === 'object') {
                    handleCoordinatesUpdate(value);
                  }
                }}
                hasExistingClinic={hasExistingClinic}
                loading={loading}
              />
            </div>
          </div>
        </div>
        
        {/* Address fields container - takes 40% on desktop */}
        <div className="md:w-2/5 flex flex-col">
          <div className="flex-grow">
            {renderAddressFields()}
          </div>
        </div>
      </div>
    </div>
  );
}; 