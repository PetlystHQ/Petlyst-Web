import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  text: string;
  type: 'clinic' | 'animal_type' | 'medical_service' | 'additional_service' | 'city';
}

// Common Turkish cities to suggest
const commonCities = [
  'Ankara', 'Istanbul', 'Izmir', 'Antalya', 'Bursa',
  'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Kayseri'
];

const PetOwnerHomePage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [popularAnimalTypes, setPopularAnimalTypes] = useState<string[]>([]);
  const [popularServices, setPopularServices] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isEmergency, setIsEmergency] = useState(false);

  // Fetch popular searches when component mounts
  useEffect(() => {
    fetchPopularSearches();
  }, []);

  // Fetch popular animal types and services
  const fetchPopularSearches = async () => {
    try {
      console.log("Using relative URLs with Vite proxy");
      
      const [animalTypesRes, servicesRes] = await Promise.all([
        axios.get(`/api/pet-owners/popular-animal-types`),
        axios.get(`/api/pet-owners/popular-services`)
      ]);

      if (animalTypesRes.data.success) {
        setPopularAnimalTypes(animalTypesRes.data.animalTypes.map((item: any) => item.animal_type_name));
      }

      if (servicesRes.data.success) {
        const medicalServices = servicesRes.data.services.medical.map((item: any) => item.service_name);
        const additionalServices = servicesRes.data.services.additional.map((item: any) => item.service_name);
        setPopularServices([...medicalServices, ...additionalServices]);
      }
    } catch (error: any) {
      console.error('Error fetching popular searches:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
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
        console.log("Using relative URL with Vite proxy");
        console.log("Searching for:", searchQuery);
        
        // Get API suggestions
        const response = await axios.get(`/api/pet-owners/search-suggestions`, {
          params: { query: searchQuery }
        });

        console.log("Suggestion response:", response.data);

        let allSuggestions: SearchSuggestion[] = [];
        
        // Add API suggestions
        if (response.data.success) {
          allSuggestions = [...response.data.suggestions];
        }
        
        // Add city suggestions
        const cityMatches = commonCities.filter(city => 
          city.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        const citySuggestions: SearchSuggestion[] = cityMatches.map(city => ({
          text: city,
          type: 'city'
        }));
        
        // Combine and limit to 5 suggestions
        allSuggestions = [...allSuggestions, ...citySuggestions].slice(0, 5);
        
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
      } catch (error: any) {
        console.error('Error fetching suggestions:', error);
        console.error('Error details:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
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

    // Prepare URL parameters
    const params = new URLSearchParams();
    params.set('query', searchQuery);
    
    // Add emergency parameter if enabled
    if (isEmergency) {
      params.set('emergency', 'true');
    }

    // Navigate to search results page
    navigate(`/search?${params.toString()}`);
  };

  // Handle emergency toggle
  const toggleEmergency = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setIsEmergency(!isEmergency);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Navigate to search results with appropriate parameters
    const params = new URLSearchParams();
    params.set('query', suggestion.text);
    
    // Add type-specific parameter if applicable
    if (suggestion.type === 'animal_type') {
      params.set('animalType', suggestion.text);
    } else if (suggestion.type === 'medical_service') {
      params.set('medicalService', suggestion.text);
    } else if (suggestion.type === 'additional_service') {
      params.set('additionalService', suggestion.text);
    } else if (suggestion.type === 'city') {
      params.set('province', suggestion.text);
    }
    
    navigate(`/search?${params.toString()}`);
  };

  // Handle popular search click
  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    
    // Navigate to search results
    navigate(`/search?query=${encodeURIComponent(term)}`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    // Handle arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prevIndex => 
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } 
    // Handle arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prevIndex => 
        prevIndex > 0 ? prevIndex - 1 : 0
      );
    } 
    // Handle Enter to select the currently highlighted suggestion
    else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    }
    // Handle Escape to close suggestions
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section with Search */}
      <div className="relative mb-16">
        {/* Background Image Container */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-lg">
          <img 
            src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-image.png" 
            alt="Pets" 
            className="w-full h-full object-cover object-bottom"
          />
          {/* Slight overlay for better text readability */}
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[2px]"></div>
        </div>
        
        {/* Content Container - positioned above the background */}
        <div className="relative z-10 text-center py-20 px-4">
          <h1 className="text-4xl font-bold text-white mb-6 text-shadow-sm drop-shadow-lg">
            Find the Purrfect Care for Your Pet
          </h1>
          
          {/* Short description */}
          <p className="text-xl text-white mb-10 max-w-2xl mx-auto text-shadow-sm">
            Skip the worry, start with a clinic that truly cares
          </p>
          
          {/* Fancy Search Bar */}
          <div className="max-w-4xl mx-auto mb-16">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative group">
                {/* Search icon */}
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    <circle cx="10" cy="10" r="7" fill="none" strokeOpacity="0.3"></circle>
                  </svg>
                </div>
                
                {/* Input field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for veterinarians, services, or pet care..."
                  className="w-full pl-14 pr-36 py-4 text-base rounded-full border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all duration-300 shadow-lg group-hover:shadow-xl"
                  onBlur={() => {
                    // Small delay to allow click events on suggestions to fire
                    setTimeout(() => {
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }, 150);
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
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    <ul className="divide-y divide-gray-50">
                      {suggestions.map((suggestion, index) => (
                        <li 
                          key={`${suggestion.type}-${index}`}
                          className={`px-5 py-3.5 cursor-pointer flex items-center transition-colors duration-150 ${
                            index === selectedSuggestionIndex ? 'bg-blue-50' : 'hover:bg-blue-50'
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          {/* Icon based on suggestion type */}
                          <span className="mr-4 flex-shrink-0">
                            {suggestion.type === 'clinic' && (
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                              </svg>
                            )}
                            {suggestion.type === 'animal_type' && (
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                              </svg>
                            )}
                            {(suggestion.type === 'medical_service' || suggestion.type === 'additional_service') && (
                              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                              </svg>
                            )}
                            {suggestion.type === 'city' && (
                              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              </svg>
                            )}
                          </span>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium text-gray-900 truncate">{suggestion.text}</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {suggestion.type === 'clinic' && 'Clinic'}
                              {suggestion.type === 'animal_type' && 'Animal Type'}
                              {suggestion.type === 'medical_service' && 'Medical Service'}
                              {suggestion.type === 'additional_service' && 'Additional Service'}
                              {suggestion.type === 'city' && 'City'}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Emergency button */}
              <button
                type="button"
                onClick={toggleEmergency}
                className={`absolute right-[132px] top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                  isEmergency 
                    ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300' 
                    : 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
                } transition-all duration-200 shadow-sm z-20 flex items-center space-x-1`}
                title="Emergency services only"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>
              
              {/* Search button */}
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 bg-white border-2 border-blue-500 text-blue-600 px-4 py-2 rounded-full font-medium hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-md flex items-center"
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
            
            {/* Spacing element */}
            <div className="mt-10"></div>
          </div>
        </div>
      </div>

      {/* Popular categories section */}
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
    </div>
  );
};

export default PetOwnerHomePage;
