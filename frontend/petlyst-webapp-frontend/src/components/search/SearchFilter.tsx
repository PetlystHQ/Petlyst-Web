import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SearchFilterProps {
  updateFilters: (filters: Record<string, string | number>) => void;
  currentFilters: {
    query?: string;
    province?: string;
    district?: string;
    animalType?: string;
    medicalService?: string;
    additionalService?: string;
    clinicType?: string;
    emergency?: string;
    veterinarian?: string;
    expertise?: string;
    veterinarianName?: string;
  };
}

interface LocationData {
  provinces: string[];
  districts: string[];
}

interface AnimalType {
  animal_type_name: string;
  clinic_count: number;
}

interface Service {
  service_name: string;
  clinic_count: number;
  service_type: string;
}

interface ExpertiseArea {
  expertise_area: string;
  count: number;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ updateFilters, currentFilters }) => {
  // State for filter options from API
  const [locations, setLocations] = useState<LocationData>({ provinces: [], districts: [] });
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [services, setServices] = useState<{
    medical: Service[];
    additional: Service[];
  }>({ medical: [], additional: [] });
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  
  // Loading states
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingAnimalTypes, setLoadingAnimalTypes] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingExpertise, setLoadingExpertise] = useState(false);
  
  // UI state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    location: false,
    animalType: false,
    clinicType: false,
    services: false,
    expertise: false
  });

  // Fetch locations (provinces and districts)
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await axios.get('/api/pet-owners/locations');
        if (response.data.success) {
          setLocations(response.data.locations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchLocations();
  }, []);
  
  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!currentFilters.province) {
        return;
      }
      
      setLoadingLocations(true);
      try {
        const response = await axios.get(`/api/pet-owners/locations?province=${currentFilters.province}`);
        if (response.data.success) {
          setLocations(prev => ({
            ...prev,
            districts: response.data.locations.districts
          }));
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchDistricts();
  }, [currentFilters.province]);
  
  // Fetch popular animal types
  useEffect(() => {
    const fetchAnimalTypes = async () => {
      setLoadingAnimalTypes(true);
      try {
        const response = await axios.get('/api/pet-owners/popular-animal-types');
        if (response.data.success) {
          setAnimalTypes(response.data.animalTypes);
        }
      } catch (error) {
        console.error('Error fetching animal types:', error);
      } finally {
        setLoadingAnimalTypes(false);
      }
    };
    
    fetchAnimalTypes();
  }, []);
  
  // Fetch popular services
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const response = await axios.get('/api/pet-owners/popular-services');
        if (response.data.success) {
          setServices(response.data.services);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoadingServices(false);
      }
    };
    
    fetchServices();
  }, []);
  
  // Fetch expertise areas
  useEffect(() => {
    const fetchExpertiseAreas = async () => {
      setLoadingExpertise(true);
      try {
        const response = await axios.get('/api/pet-owners/veterinarian-expertise-areas');
        if (response.data.success) {
          setExpertiseAreas(response.data.expertiseAreas);
        }
      } catch (error) {
        console.error('Error fetching expertise areas:', error);
      } finally {
        setLoadingExpertise(false);
      }
    };
    
    fetchExpertiseAreas();
  }, []);
  
  // Toggle filter section expansion
  const toggleSection = (section: string) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    // If selecting the same filter, clear it
    if (currentFilters[key as keyof typeof currentFilters] === value) {
      updateFilters({ [key]: '' });
    } else {
      updateFilters({ [key]: value });
    }
  };

  // Handle toggle for emergency filter
  const handleEmergencyToggle = () => {
    updateFilters({ emergency: currentFilters.emergency === 'true' ? '' : 'true' });
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      {/* Emergency Toggle - Separate section at the top */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium text-gray-800">Emergency Services</span>
          </div>
          
          {/* Toggle Button */}
          <button 
            onClick={handleEmergencyToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${currentFilters.emergency === 'true' ? 'bg-red-600' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={currentFilters.emergency === 'true'}
          >
            <span className="sr-only">Enable emergency filter</span>
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentFilters.emergency === 'true' ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Search Type Filter - NEW SECTION */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 mb-3">Search Type</span>
          <div className="flex space-x-2">
            <button
              onClick={() => updateFilters({ veterinarian: 'all' })}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                currentFilters.veterinarian === 'all'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                // Explicitly set the veterinarian parameter to empty string
                updateFilters({ veterinarian: '' });
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                // Make sure this is an explicit string comparison for empty string
                currentFilters.veterinarian === ''
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Clinics
            </button>
            <button
              onClick={() => updateFilters({ veterinarian: 'any' })}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                currentFilters.veterinarian === 'any' || currentFilters.veterinarianName
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Veterinarians
            </button>
          </div>
        </div>
      </div>

      {/* Location Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('location')}
          className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
        >
          <span className="font-medium text-gray-800">Location</span>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${expanded.location ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expanded.location && (
          <div className="px-4 py-3 border-t border-gray-100">
            {loadingLocations ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Province Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <div className="relative">
                    <select
                      value={currentFilters.province || ''}
                      onChange={(e) => handleFilterChange('province', e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none bg-white shadow-sm"
                    >
                      <option value="">All Provinces</option>
                      {locations.provinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* District Selection (only show if province is selected) */}
                {currentFilters.province && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <div className="relative">
                      <select
                        value={currentFilters.district || ''}
                        onChange={(e) => handleFilterChange('district', e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none bg-white shadow-sm"
                      >
                        <option value="">All Districts</option>
                        {locations.districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Clinic Type Filter */}
      {!currentFilters.veterinarian && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('clinicType')}
            className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-800">Clinic Type</span>
            <svg
              className={`h-5 w-5 text-gray-500 transform ${expanded.clinicType ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded.clinicType && (
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['Veterinary Clinic', 'Animal Hospital'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('clinicType', type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        currentFilters.clinicType === type
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Animal Type Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('animalType')}
          className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
        >
          <span className="font-medium text-gray-800">Animal Type</span>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${expanded.animalType ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expanded.animalType && (
          <div className="px-4 py-3 border-t border-gray-100">
            {loadingAnimalTypes ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {animalTypes.map(type => (
                  <button
                    key={type.animal_type_name}
                    onClick={() => handleFilterChange('animalType', type.animal_type_name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      currentFilters.animalType === type.animal_type_name
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.animal_type_name} ({type.clinic_count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Services Filter */}
      <div>
        <button
          onClick={() => toggleSection('services')}
          className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
        >
          <span className="font-medium text-gray-800">Services</span>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${expanded.services ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expanded.services && (
          <div className="px-4 py-3 border-t border-gray-100">
            {loadingServices ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Medical Services */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {services.medical.map(service => (
                      <button
                        key={service.service_name}
                        onClick={() => handleFilterChange('medicalService', service.service_name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          currentFilters.medicalService === service.service_name
                            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {service.service_name} ({service.clinic_count})
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Additional Services */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {services.additional.map(service => (
                      <button
                        key={service.service_name}
                        onClick={() => handleFilterChange('additionalService', service.service_name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          currentFilters.additionalService === service.service_name
                            ? 'bg-purple-100 text-purple-800 border-2 border-purple-300' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {service.service_name} ({service.clinic_count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Veterinary Expertise Filter - Sadece Veterinarians seçiliyse göster */}
      {currentFilters.veterinarian && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('expertise')}
            className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-800">Veterinary Expertise</span>
            <svg
              className={`h-5 w-5 text-gray-500 transform ${expanded.expertise ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded.expertise && (
            <div className="px-4 py-3 border-t border-gray-100">
              {loadingExpertise ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {expertiseAreas.length > 0 ? (
                    expertiseAreas.map(expertise => (
                      <button
                        key={expertise.expertise_area}
                        onClick={() => handleFilterChange('expertise', expertise.expertise_area)}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors ${
                          currentFilters.expertise === expertise.expertise_area
                            ? 'bg-blue-100 text-blue-800'
                            : 'text-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{expertise.expertise_area}</span>
                          <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                            {expertise.count}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">No expertise areas available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
