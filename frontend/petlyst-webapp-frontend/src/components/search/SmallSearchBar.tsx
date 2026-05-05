import React, { useState, useEffect, KeyboardEvent } from 'react';
import axios from 'axios';

interface SearchSuggestion {
  text: string;
  type: 'clinic' | 'animal_type' | 'medical_service' | 'additional_service' | 'city' | 'veterinarian';
}

interface SmallSearchBarProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

const SmallSearchBar: React.FC<SmallSearchBarProps> = ({ initialQuery }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Update local state when prop changes
  useEffect(() => {
    setSearchQuery(initialQuery || '');
    // Reset suggestions when initialQuery changes (when navigating to the page)
    setSuggestions([]);
    setShowSuggestions(false);
  }, [initialQuery]);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        // Get API suggestions
        const response = await axios.get(`/api/pet-owners/search-suggestions`, {
          params: { query: searchQuery }
        });

        let allSuggestions: SearchSuggestion[] = [];
        
        // Add API suggestions (which now include city suggestions from the database)
        if (response.data.success) {
          allSuggestions = [...response.data.suggestions];
        }
        
        // Limit to 5 suggestions
        allSuggestions = allSuggestions.slice(0, 5);
        
        setSuggestions(allSuggestions);
        // Only show suggestions if there are results AND if user has actively typed
        // This prevents showing suggestions just because initial value was set
        setShowSuggestions(allSuggestions.length > 0 && document.activeElement === document.querySelector('input[type="text"]'));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // For regular search with the search button, use the 'all' filter by default
    // to ensure both clinics and veterinarians are included in results
    const params = new URLSearchParams();
    
    // Common medical services
    const medicalServices = [
      'Vaccination', 'Internal Medicine', 'Ultrasound', 'Preventive Care', 'X-Ray',
      'Surgery', 'Emergency Care', 'Laboratory', 'Dental Care', 'Ophthalmology'
    ];
    
    // Common additional services
    const additionalServices = [
      'Boarding', 'Pet Transportation', 'Pet Daycare', 'Grooming', 'Home Visits',
      'Behavioral Consultation', 'Nutrition Consultation', 'Pet Insurance', 'Pet Adoption'
    ];
    
    // Medical service kontrolü
    const medicalServiceMatch = medicalServices.find(service => 
      service.toLowerCase() === searchQuery.toLowerCase() ||
      searchQuery.toLowerCase().includes(service.toLowerCase())
    );
    
    // Additional service kontrolü
    const additionalServiceMatch = additionalServices.find(service => 
      service.toLowerCase() === searchQuery.toLowerCase() ||
      searchQuery.toLowerCase().includes(service.toLowerCase())
    );
    
    if (medicalServiceMatch) {
      // Medical service parametresi olarak ayarla
      params.set('medicalService', medicalServiceMatch);
      // Query parametresini boş olarak ayarla
      params.set('query', '');
    } else if (additionalServiceMatch) {
      // Additional service parametresi olarak ayarla
      params.set('additionalService', additionalServiceMatch);
      // Query parametresini boş olarak ayarla
      params.set('query', '');
    } else {
      // Normal bir arama sorgusu ise query parametresini ayarla
      params.set('query', searchQuery);
    }
    
    params.set('veterinarian', 'all'); // Set to 'all' to include both clinics and veterinarians
    
    // Navigate using window.location for full page reload and consistent behavior
    window.location.href = `/search?${params.toString()}`;
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Create appropriate URL parameters
    const params = new URLSearchParams();
    
    // If this is a veterinarian suggestion, we need to use a custom handler
    if (suggestion.type === 'veterinarian') {
      // Set veterinarian parameter to 'any' to indicate we're searching for veterinarians
      params.set('veterinarian', 'any');
      // Use a dedicated parameter for veterinarian name
      params.set('veterinarianName', suggestion.text);
      // Do NOT include query parameter for veterinarian searches
      
      // Kesinlikle veterinarian=any kullan, hiçbir koşulda boş string olmamalı
      console.log("Searching for veterinarian:", suggestion.text);
      
      // Navigate using window.location to ensure full page reload
      window.location.href = `/search?${params.toString()}`;
      return;
    } else if (suggestion.type === 'clinic') {
      // For clinic type, set veterinarian to empty string to show only clinics
      params.set('veterinarian', '');
      params.set('query', suggestion.text);
      
      // Navigate using window.location to ensure full page reload
      window.location.href = `/search?${params.toString()}`;
      return;
    } else if (suggestion.type === 'animal_type' || 
              suggestion.type === 'medical_service' || 
              suggestion.type === 'additional_service' ||
              suggestion.type === 'city') {
      // For these types, show all results
      params.set('veterinarian', 'all');
      
      // Add specific filter based on type
      if (suggestion.type === 'animal_type') {
        params.set('animalType', suggestion.text);
        params.set('query', suggestion.text); // Include query for general search
      } else if (suggestion.type === 'medical_service') {
        params.set('medicalService', suggestion.text);
        // Arama sorgusundan servisi çıkar, sadece service filtresi olarak kullan
        params.set('query', '');
      } else if (suggestion.type === 'additional_service') {
        params.set('additionalService', suggestion.text);
        // Arama sorgusundan additional servisi çıkar, sadece additionalService filtresi olarak kullan
        params.set('query', '');
      } else if (suggestion.type === 'city') {
        params.set('province', suggestion.text);
        // Şehir için query parametresi kullanmıyoruz, query boş olsun
        params.set('query', '');
      }
      
      // Navigate using window.location to ensure full page reload
      window.location.href = `/search?${params.toString()}`;
      return;
    }
    
    // For all other suggestion types or fallback, use all results
    params.set('query', suggestion.text);
    params.set('veterinarian', 'all');
    window.location.href = `/search?${params.toString()}`;
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
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="relative group">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          placeholder="Search for clinics, services..."
          className="w-full pl-10 pr-16 py-2.5 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm hover:shadow-md"
          onBlur={() => {
            // Small delay to allow click events on suggestions to fire
            setTimeout(() => {
              setShowSuggestions(false);
              setSelectedSuggestionIndex(-1);
            }, 150);
          }}
          onFocus={() => {
            // Don't automatically show suggestions on focus
            // Only show suggestions if user starts typing
          }}
        />
        
        {/* Animated gradient border on hover/focus */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={`${suggestion.type}-${index}`}
                  className={`px-4 py-2.5 cursor-pointer flex items-center transition-colors duration-150 ${
                    index === selectedSuggestionIndex ? 'bg-blue-50' : 'hover:bg-blue-50'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  {/* Icon based on suggestion type */}
                  <span className="mr-3 flex-shrink-0">
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
                    {suggestion.type === 'city' && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    )}
                    {suggestion.type === 'veterinarian' && (
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-900 truncate">{suggestion.text}</p>
                    <p className="text-xs text-gray-500">
                      {suggestion.type === 'clinic' && 'Clinic'}
                      {suggestion.type === 'animal_type' && 'Animal Type'}
                      {suggestion.type === 'medical_service' && 'Medical Service'}
                      {suggestion.type === 'additional_service' && 'Additional Service'}
                      {suggestion.type === 'city' && 'City'}
                      {suggestion.type === 'veterinarian' && 'Veterinarian'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Search button */}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-white border-2 border-blue-500 text-blue-600 px-3 py-1 rounded-lg font-medium hover:bg-blue-500 hover:text-white transition-all"
        >
          <span className="flex items-center">
            <span className="hidden sm:inline mr-1">Search</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </span>
        </button>
      </div>
    </form>
  );
};

export default SmallSearchBar;
