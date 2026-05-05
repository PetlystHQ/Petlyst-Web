import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tooltip } from '../shared/Tooltip';
import { API_URL } from '../../../config/api';
import { getApiErrorMessage } from '../../../utils/errorMessage';

interface EditServicesProps {
  clinicId: string | number;
  token: string;
  onServicesChange?: () => void;
}

interface ServiceOptions {
  servedAnimalTypes: string[];
  medicalServices: string[];
  additionalServices: string[];
}

interface ClinicServices {
  servedAnimalTypes: string[];
  medicalServices: string[];
  additionalServices: string[];
}

// Available options for each category
const animalTypeOptions = [
  'Dogs', 'Cats', 'Birds', 'Rabbits', 'Rodents', 'Ferrets', 'Reptiles', 
  'Amphibians', 'Fish', 'Exotic Pets', 'Farm Animals', 'Horses', 'Other'
];

const medicalServicesOptions = [
  'Vaccination', 'Preventive Care', 'Dental Care', 'Surgery', 'Emergency Care', 'X-Ray',
  'Ultrasound', 'Laboratory Tests', 'Pharmacy', 'Internal Medicine', 'Orthopedics',
  'Cardiology', 'Dermatology', 'Ophthalmology', 'Neurology', 'Reproduction',
  'Behavior Consultation', 'Nutrition Consultation', 'Euthanasia'
];

const additionalServicesOptions = [
  'Grooming', 'Boarding', 'Pet Hotel', 'Pet Daycare', 'Pet Training',
  'Pet Transportation', 'Pet Adoption', 'Pet Insurance', 'Online Consultation',
  'Home Visits', 'Microchipping', 'Pet Food & Supplies'
];

// ServiceCategory component for rendering each service category
interface ServiceCategoryProps {
  title: string;
  description: string;
  icon: JSX.Element;
  options: string[];
  selectedItems: string[];
  onChange: (selectedItems: string[]) => void;
  loading: boolean;
  colorScheme: 'blue' | 'green' | 'purple';
}

const ServiceCategory: React.FC<ServiceCategoryProps> = ({
  title,
  description,
  icon,
  options,
  selectedItems,
  onChange,
  loading,
  colorScheme
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Color variations based on the scheme
  const colorVariants = {
    blue: {
      header: 'bg-blue-50 border-blue-100',
      title: 'text-blue-800',
      description: 'text-blue-600',
      icon: 'text-blue-600',
      count: 'bg-blue-100 text-blue-800',
      checkbox: 'text-blue-600 focus:ring-blue-500'
    },
    green: {
      header: 'bg-green-50 border-green-100',
      title: 'text-green-800',
      description: 'text-green-600',
      icon: 'text-green-600',
      count: 'bg-green-100 text-green-800',
      checkbox: 'text-green-600 focus:ring-green-500'
    },
    purple: {
      header: 'bg-purple-50 border-purple-100',
      title: 'text-purple-800',
      description: 'text-purple-600',
      icon: 'text-purple-600',
      count: 'bg-purple-100 text-purple-800',
      checkbox: 'text-purple-600 focus:ring-purple-500'
    }
  };
  
  const colors = colorVariants[colorScheme];
  
  const handleOptionToggle = (option: string) => {
    const newSelection = selectedItems.includes(option)
      ? selectedItems.filter(item => item !== option)
      : [...selectedItems, option];
    
    onChange(newSelection);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
      <button
        className={`w-full text-left px-5 py-4 flex items-center justify-between ${colors.header} border-b`}
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex items-center">
          <span className={`mr-3 ${colors.icon}`}>{icon}</span>
          <div>
            <div className="flex items-center">
              <h3 className={`text-lg font-medium ${colors.title}`}>
                {title}
              </h3>
              {selectedItems.length > 0 && (
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.count}`}>
                  {selectedItems.length} selected
                </span>
              )}
            </div>
            <p className={`text-sm ${colors.description}`}>{description}</p>
          </div>
        </div>
        
        <span className={`${colors.icon} transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-5 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {options.map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={`option-${option.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={selectedItems.includes(option)}
                  onChange={() => handleOptionToggle(option)}
                  disabled={loading}
                  className={`h-4 w-4 rounded border-gray-300 ${colors.checkbox}`}
                />
                <label 
                  htmlFor={`option-${option.replace(/\s+/g, '-').toLowerCase()}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const EditServices: React.FC<EditServicesProps> = ({
  clinicId,
  token,
  onServicesChange
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ClinicServices>({
    servedAnimalTypes: [],
    medicalServices: [],
    additionalServices: []
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalServices, setOriginalServices] = useState<ClinicServices>({
    servedAnimalTypes: [],
    medicalServices: [],
    additionalServices: []
  });
  const [availableOptions, setAvailableOptions] = useState<ServiceOptions>({
    servedAnimalTypes: animalTypeOptions,
    medicalServices: medicalServicesOptions,
    additionalServices: additionalServicesOptions
  });

  // Fetch clinic services on component mount
  useEffect(() => {
    fetchClinicServices();
  }, [clinicId]);

  // Check for changes to enable/disable save button
  useEffect(() => {
    const hasServicesChanged = 
      JSON.stringify(services.servedAnimalTypes) !== JSON.stringify(originalServices.servedAnimalTypes) ||
      JSON.stringify(services.medicalServices) !== JSON.stringify(originalServices.medicalServices) ||
      JSON.stringify(services.additionalServices) !== JSON.stringify(originalServices.additionalServices);
    
    setHasChanges(hasServicesChanged);
  }, [services, originalServices]);

  // Fetch services from the backend
  const fetchClinicServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = API_URL;
      const response = await axios.get(`${apiUrl}/api/clinics/${clinicId}/services`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const fetchedServices = {
          servedAnimalTypes: response.data.services.animalTypes || [],
          medicalServices: response.data.services.medicalServices || [],
          additionalServices: response.data.services.additionalServices || []
        };
        
        setServices(fetchedServices);
        setOriginalServices(fetchedServices);

        // If we have available options from the backend, use them
        if (response.data.availableOptions) {
          setAvailableOptions({
            servedAnimalTypes: response.data.availableOptions.animalTypes || animalTypeOptions,
            medicalServices: response.data.availableOptions.medicalServices || medicalServicesOptions,
            additionalServices: response.data.availableOptions.additionalServices || additionalServicesOptions
          });
        }
      } else {
        setError('Failed to fetch clinic services');
      }
    } catch (err) {
      console.error('Error fetching clinic services:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch clinic services'));
    } finally {
      setLoading(false);
    }
  };

  // Handle changes to services
  const handleServiceChange = (
    field: 'servedAnimalTypes' | 'medicalServices' | 'additionalServices',
    value: string[]
  ) => {
    setServices(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save services to the backend
  const saveServices = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const apiUrl = API_URL;
      const response = await axios.put(
        `${apiUrl}/api/clinics/${clinicId}/services`,
        {
          animalTypes: services.servedAnimalTypes,
          medicalServices: services.medicalServices,
          additionalServices: services.additionalServices
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Clinic services updated successfully');
        setOriginalServices(services);
        
        // Notify parent component if needed
        if (onServicesChange) {
          onServicesChange();
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Failed to update clinic services');
      }
    } catch (err) {
      console.error('Error updating clinic services:', err);
      setError(getApiErrorMessage(err, 'Failed to update clinic services'));
    } finally {
      setSaving(false);
    }
  };

  // Generate icons for each category
  const animalTypesIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
    </svg>
  );
  
  const medicalServicesIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
    </svg>
  );
  
  const additionalServicesIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
  );

  // Validation rules
  const hasMissingRequiredFields = 
    services.servedAnimalTypes.length === 0 || 
    services.medicalServices.length === 0 || 
    services.additionalServices.length === 0;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Clinic Services</h2>
          <Tooltip text="Manage the types of animals you treat and services you offer" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Update the animals your clinic treats and the services you offer to help pet owners find your clinic.
        </p>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="ml-4 text-gray-600">Loading clinic services...</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4 animate-fadeIn">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4 animate-fadeIn">
          <div className="flex">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{success}</p>
          </div>
        </div>
      )}
      
      {!loading && (
        <div className="space-y-4">
          {/* Service Categories */}
          <ServiceCategory
            title="Animal Types"
            description="Select the types of animals your clinic treats"
            icon={animalTypesIcon}
            options={availableOptions.servedAnimalTypes}
            selectedItems={services.servedAnimalTypes}
            onChange={(value) => handleServiceChange('servedAnimalTypes', value)}
            loading={saving}
            colorScheme="blue"
          />
          
          <ServiceCategory
            title="Medical Services"
            description="Select the medical services your clinic provides"
            icon={medicalServicesIcon}
            options={availableOptions.medicalServices}
            selectedItems={services.medicalServices}
            onChange={(value) => handleServiceChange('medicalServices', value)}
            loading={saving}
            colorScheme="green"
          />
          
          <ServiceCategory
            title="Additional Services"
            description="Select the additional services your clinic offers"
            icon={additionalServicesIcon}
            options={availableOptions.additionalServices}
            selectedItems={services.additionalServices}
            onChange={(value) => handleServiceChange('additionalServices', value)}
            loading={saving}
            colorScheme="purple"
          />
          
          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={saveServices}
              disabled={saving || !hasChanges || hasMissingRequiredFields}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (saving || !hasChanges || hasMissingRequiredFields) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
          
          {/* Validation warning */}
          {hasMissingRequiredFields && hasChanges && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>You must select at least one option in each category to save changes.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;
document.head.appendChild(style); 