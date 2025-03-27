import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface SearchSuggestion {
  text: string;
  type: 'clinic' | 'animal_type' | 'medical_service' | 'additional_service';
}

interface Clinic {
  clinic_id: number;
  clinic_name: string;
  clinic_type: string;
  clinic_description: string;
  opening_time: string;
  closing_time: string;
  available_days: boolean[];
  province: string;
  district: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  photos: string[];
}

const PetOwnerHomePage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Clinic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popularAnimalTypes, setPopularAnimalTypes] = useState<string[]>([]);
  const [popularServices, setPopularServices] = useState<string[]>([]);

  // Fetch popular searches when component mounts
  useEffect(() => {
    fetchPopularSearches();
  }, []);

  // Fetch popular animal types and services
  const fetchPopularSearches = async () => {
    try {
      const [animalTypesRes, servicesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/pet-owners/popular-animal-types`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/pet-owners/popular-services`)
      ]);

      if (animalTypesRes.data.success) {
        setPopularAnimalTypes(animalTypesRes.data.animalTypes.map((item: any) => item.animal_type_name));
      }

      if (servicesRes.data.success) {
        const medicalServices = servicesRes.data.services.medical.map((item: any) => item.service_name);
        const additionalServices = servicesRes.data.services.additional.map((item: any) => item.service_name);
        setPopularServices([...medicalServices, ...additionalServices]);
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  };

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/pet-owners/search-suggestions`, {
          params: { query: searchQuery }
        });

        if (response.data.success) {
          setSuggestions(response.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/pet-owners/search-clinics`, {
        params: { query: searchQuery }
      });

      if (response.data.success) {
        setSearchResults(response.data.clinics);
        // Scroll to results section
        document.getElementById('searchResults')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error searching for clinics:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Auto-submit search form
    handleSearch({ preventDefault: () => {} } as React.FormEvent);
  };

  // Handle popular search click
  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    
    // Auto-submit search form
    handleSearch({ preventDefault: () => {} } as React.FormEvent);
  };

  // Format clinic type for display
  const formatClinicType = (type: string) => {
    if (type === 'veterinary_clinic') return 'Veterinary Clinic';
    if (type === 'animal_hospital') return 'Animal Hospital';
    return type;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section with Search */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Find the Perfect Care for Your Pet
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Search for veterinarians, pet services, and more to keep your furry friends happy and healthy
        </p>
        
        {/* Fancy Search Bar */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  <circle cx="10" cy="10" r="7" fill="none" strokeOpacity="0.3"></circle>
                </svg>
              </div>
              
              {/* Input field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for veterinarians, services, or pet care..."
                className="w-full pl-16 pr-20 py-6 text-lg rounded-full border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all duration-300 shadow-lg group-hover:shadow-xl"
                onBlur={() => {
                  // Small delay to allow click events on suggestions to fire
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
              />
              
              {/* Animated gradient border on hover/focus */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg">
                  <ul className="py-1 divide-y divide-gray-100">
                    {suggestions.map((suggestion, index) => (
                      <li 
                        key={`${suggestion.type}-${index}`}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {/* Icon based on suggestion type */}
                        <span className="mr-3">
                          {suggestion.type === 'clinic' && (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                          )}
                          {suggestion.type === 'animal_type' && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                          )}
                          {(suggestion.type === 'medical_service' || suggestion.type === 'additional_service') && (
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                          )}
                        </span>
                        <div>
                          <p className="font-medium">{suggestion.text}</p>
                          <p className="text-xs text-gray-500">
                            {suggestion.type === 'clinic' && 'Clinic'}
                            {suggestion.type === 'animal_type' && 'Animal Type'}
                            {suggestion.type === 'medical_service' && 'Medical Service'}
                            {suggestion.type === 'additional_service' && 'Additional Service'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Search button */}
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 bg-white border-2 border-blue-500 text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-md flex items-center"
              disabled={isSearching}
            >
              {isSearching ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                <>
                  <span>Search</span>
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </>
              )}
            </button>
          </form>
          
          {/* Popular searches */}
          {(popularAnimalTypes.length > 0 || popularServices.length > 0) && (
            <div className="mt-6 text-sm text-gray-600">
              <span className="mr-2">Popular searches:</span>
              <div className="inline-flex flex-wrap gap-2 mt-2">
                {popularAnimalTypes.slice(0, 3).map((type, index) => (
                  <button
                    key={`animal-${index}`}
                    onClick={() => handlePopularSearchClick(type)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {type}
                  </button>
                ))}
                {popularServices.slice(0, 3).map((service, index) => (
                  <button
                    key={`service-${index}`}
                    onClick={() => handlePopularSearchClick(service)}
                    className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <div id="searchResults" className="mb-20">
          <h2 className="text-2xl font-semibold mb-6">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((clinic) => (
              <Link 
                to={`/clinics/${clinic.clinic_id}`} 
                key={clinic.clinic_id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Clinic Image */}
                <div className="h-48 overflow-hidden relative">
                  {clinic.photos && clinic.photos.length > 0 ? (
                    <img
                      src={clinic.photos[0]}
                      alt={clinic.clinic_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg shadow-md text-xs font-medium">
                    {formatClinicType(clinic.clinic_type)}
                  </div>
                </div>
                
                {/* Clinic Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">{clinic.clinic_name}</h3>
                  
                  {/* Location */}
                  {(clinic.province || clinic.district) && (
                    <div className="flex items-center text-gray-600 mb-2 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{[clinic.district, clinic.province].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Working Hours */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{clinic.opening_time} - {clinic.closing_time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular categories section - show only if no search results */}
      {searchResults.length === 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Veterinarians</h3>
              <p className="text-gray-600">Find trusted veterinarians near you</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Pet Shops</h3>
              <p className="text-gray-600">Quality products for your pets</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Pet Services</h3>
              <p className="text-gray-600">Grooming, training and more</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerHomePage;
