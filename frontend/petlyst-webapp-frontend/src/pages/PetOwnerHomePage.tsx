import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, LocationIcon, WarningIcon, ArrowRightIcon } from '../components/ui/ReactIcons';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import AuthModal from '../components/modals/AuthModal';
import { getEmergencyData, createDirectionsUrl } from '../components/emergency/EmergencyService';
import EmergencyModal from '../components/emergency/EmergencyModal';
import { Toaster, toast } from 'react-hot-toast';

interface SearchSuggestion {
  text: string;
  type: 'clinic' | 'animal_type' | 'medical_service' | 'additional_service' | 'city' | 'veterinarian';
}

// Telefon numarası için arayüz
interface PhoneNumber {
  phone_number: string;
  phone_type: string;
}

// Veteriner operatör için arayüz
interface Operator {
  user_name: string;
  user_surname: string;
}

// Klinik tipi için arayüz
interface Clinic {
  location_id: number;
  clinic_id: number;
  province: string;
  district: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  clinic_name: string;
  clinic_operator_id: number;
  slug: string;
  distance: number;
  phones: PhoneNumber[];
  operator: Operator | null;
}

// Common Turkish cities to suggest
const commonCities = [
  'Ankara', 'Istanbul', 'Izmir', 'Antalya', 'Bursa',
  'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Kayseri'
];

// Özel Toast Stili
const notifyEmergency = (message: string) => {
  toast.dismiss(); // Dismiss any existing toasts first
  toast(message, {
    icon: '🚨',
    style: {
      borderRadius: '10px',
      background: '#FEE2E2',
      color: '#991B1B',
      fontWeight: 'bold',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #F87171',
    },
    duration: 5000,
    position: 'top-center', // Force position to be top-center
    // Prevent default toast behavior
    id: 'emergency-toast', // Use a consistent ID to prevent duplicates
  });
};

// Özel Error Toast Stili
const notifyError = (message: string) => {
  toast.dismiss(); // Dismiss any existing toasts first
  toast.error(message, {
    style: {
      borderRadius: '10px',
      background: '#FEF2F2',
      color: '#991B1B',
      fontWeight: 'bold',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #EF4444',
    },
    duration: 5000,
    position: 'top-center', // Force position to be top-center
    id: 'error-toast', // Use a consistent ID to prevent duplicates
  });
};

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNavigatingToEmergency, setIsNavigatingToEmergency] = useState(false);
  
  // Acil durum modalı için state'ler
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [nearestClinic, setNearestClinic] = useState<Clinic | null>(null);
  const [directionsUrl, setDirectionsUrl] = useState('');

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

  // Handle search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    // Prepare URL parameters
    const params = new URLSearchParams();

    // Kontrol edelim - eğer arama sorgusu yaygın şehirlerden biriyse, province parametresi olarak ayarlayalım
    // Önce tam eşleşmeyi kontrol edelim, sonra içinde geçip geçmediğini
    const cityMatch = commonCities.find(city => 
      city.toLowerCase() === searchQuery.toLowerCase()
    );
    
    // Tam eşleşme yoksa, içeren arama yapalım
    const cityPartialMatch = !cityMatch && commonCities.find(city => 
      searchQuery.toLowerCase().includes(city.toLowerCase())
    );
    
    if (cityMatch || cityPartialMatch) {
      // Bulunan şehir adını province parametresi olarak ayarla
      const cityName = cityMatch || cityPartialMatch;
      if (cityName) {
        params.set('province', cityName);
        // Açıkça query parametresini boş olarak ayarlıyoruz
        params.set('query', '');
      }
    } else {
      // Normal bir arama sorgusu ise query parametresini ayarla
      params.set('query', searchQuery);
    }
    
    // Normal aramada her zaman "All" seçeneği seçili olmalı
    params.set('veterinarian', 'all');
    
    // Add emergency parameter if enabled
    if (isEmergency) {
      params.set('emergency', 'true');
    }

    // Navigate to search results page
    navigate(`/search?${params.toString()}`);
  };

  // Handle emergency toggle
  const toggleEmergency = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    
    // Eğer acil durum modu zaten aktifse, yönlendirme işlemini başlat
    if (isEmergency) {
      try {
        setIsNavigatingToEmergency(true);
        
        // En yakın klinikleri ve kullanıcı konumunu al
        const emergencyData = await getEmergencyData();
        
        // En yakın klinik (liste sıralanmış olarak gelir)
        const clinic = emergencyData.clinics[0];
        
        // Google Maps yönlendirme URL'sini oluştur
        const mapUrl = createDirectionsUrl(clinic, emergencyData.userLocation);
        
        // State'leri güncelle
        setNearestClinic(clinic);
        setDirectionsUrl(mapUrl);
        
        // Modalı açmadan önce tüm toast bildirimleri kapat
        toast.dismiss();
        
        // Modalı aç - modal açıldığında toast gösterme
        setIsEmergencyModalOpen(true);
      } catch (error: any) {
        notifyError(error.message || 'En yakın kliniğe yönlendirme sırasında bir hata oluştu');
        console.error('Emergency navigation error:', error);
      } finally {
        setIsNavigatingToEmergency(false);
      }
    } else {
      // Acil durum modunu aktif et
      setIsEmergency(true);
      notifyEmergency('Emergency mode is active! By pressing the button again, you will be directed to the nearest clinic.');
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Navigate to search results with appropriate parameters
    const params = new URLSearchParams();
    
    // Add type-specific parameter if applicable
    if (suggestion.type === 'animal_type') {
      params.set('animalType', suggestion.text);
      params.set('query', suggestion.text); // Include query for general search
      params.set('veterinarian', 'all'); // Show results from all categories
    } else if (suggestion.type === 'medical_service') {
      params.set('medicalService', suggestion.text);
      // Arama sorgusundan servisi çıkar, sadece service filtresi olarak kullan
      params.set('query', '');
      params.set('veterinarian', 'all'); // Show results from all categories
    } else if (suggestion.type === 'additional_service') {
      params.set('additionalService', suggestion.text);
      // Arama sorgusundan additional servisi çıkar, sadece additionalService filtresi olarak kullan
      params.set('query', '');
      params.set('veterinarian', 'all'); // Show results from all categories
    } else if (suggestion.type === 'city') {
      params.set('province', suggestion.text);
      // Şehir için query parametresi ekleme, sadece province kullan
      params.set('query', ''); // Query boş olsun
      params.set('veterinarian', 'all'); // Show results from all categories
    } else if (suggestion.type === 'veterinarian') {
      // Set veterinarian parameter to 'any' to indicate we're searching for veterinarians
      params.set('veterinarian', 'any');
      // Use a dedicated parameter for veterinarian name rather than query
      params.set('veterinarianName', suggestion.text);
      // Do NOT include query parameter for veterinarian searches
    } else if (suggestion.type === 'clinic') {
      // For clinic type, set veterinarian to empty string to show only clinics
      params.set('veterinarian', '');
      params.set('query', suggestion.text);
    } else {
      // For other types or if no specific type, just use query with All selected
      params.set('query', suggestion.text);
      params.set('veterinarian', 'all');
    }
    
    navigate(`/search?${params.toString()}`);
  };

  // Handle popular search click
  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    
    // Prepare URL parameters with veterinarian=all
    const params = new URLSearchParams();
    params.set('query', term);
    params.set('veterinarian', 'all');
    
    // Navigate to search results with "All" selected by default
    navigate(`/search?${params.toString()}`);
  };

  // Handle city card click
  const handleCityCardClick = (city: string) => {
    // Prepare URL parameters for city filter
    const params = new URLSearchParams();
    params.set('province', city); // Şehir adını province parametresine ekle
    params.set('veterinarian', 'all'); // Sadece klinikleri değil tüm sonuçları göster
    // Query parametresini açıkça boş olarak ayarla
    params.set('query', '');
    
    // Navigate to search results
    navigate(`/search?${params.toString()}`);
  };

  // Handle clinic card click
  const handleClinicCardClick = () => {
    // Prepare URL parameters for clinic search
    const params = new URLSearchParams();
    params.set('veterinarian', ''); // Empty string for clinics view
    params.set('clinicType', 'Veterinary Clinic'); // Set clinic type to Veterinary Clinic
    
    // Navigate to search results
    navigate(`/search?${params.toString()}`);
  };

  // Handle veterinarian card click
  const handleVeterinarianCardClick = () => {
    // Prepare URL parameters for veterinarian search
    const params = new URLSearchParams();
    params.set('veterinarian', 'any'); // 'any' for veterinarians view
    
    // Navigate to search results
    navigate(`/search?${params.toString()}`);
  };

  // Handle animal hospital card click
  const handleHospitalCardClick = () => {
    // Prepare URL parameters for animal hospital search
    const params = new URLSearchParams();
    params.set('veterinarian', ''); // Empty string for clinics view
    params.set('clinicType', 'Animal Hospital'); // Set clinic type to Animal Hospital
    
    // Navigate to search results
    navigate(`/search?${params.toString()}`);
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

  // Handle Register button click
  const handleRegisterClick = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Toast bildirimleri için Toaster componenti */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Sadece bir toast gösterilsin
          duration: 5000,
          // Diğer toast gösterim alanını kaldır
          position: 'top-center',
          // Sağ üstteki toastı engelle
          success: {
            position: 'top-center',
          },
          error: {
            position: 'top-center',
          },
          loading: {
            position: 'top-center',
          },
        }}
      />
    
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onForgotPassword={() => {/* Handle forgot password */}}
        initialTab="register"
      />
      
      {/* Emergency Modal */}
      {nearestClinic && (
        <EmergencyModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          clinic={nearestClinic}
          directionsUrl={directionsUrl}
          resetEmergency={() => setIsEmergency(false)}
        />
      )}

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
          <div className="absolute inset-0 bg-blue-900/20"></div>
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
                  <SearchIcon size="lg" className="text-blue-500" />
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
                            {suggestion.type === 'veterinarian' && (
                              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
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
                              {suggestion.type === 'veterinarian' && 'Veterinarian'}
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
                    ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300 animate-pulse' 
                    : 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
                } transition-all duration-200 shadow-sm z-20 flex items-center space-x-1`}
                title={isEmergency ? "Navigate to the nearest clinic" : "Activate emergency mode"}
                disabled={isNavigatingToEmergency}
              >
                {isNavigatingToEmergency ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <WarningIcon size="md" />
                )}
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
                    <ArrowRightIcon size="sm" className="ml-2" />
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
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center cursor-pointer"
            onClick={handleVeterinarianCardClick}
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Veterinarians</h3>
            <p className="text-gray-600">Find trusted veterinarians near you</p>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center cursor-pointer"
            onClick={handleClinicCardClick}
          >
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingOffice2Icon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Clinics</h3>
            <p className="text-gray-600">Professional veterinary clinics for your pets</p>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center cursor-pointer"
            onClick={handleHospitalCardClick}
          >
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Animal Hospital</h3>
            <p className="text-gray-600">Advanced care for all animal health needs</p>
          </div>
        </div>
      </div>

      {/* CTA Section - Same size and structure as hero section */}
      {!user && (
        <div className="relative mt-16 mb-16">
          {/* Background Image Container */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-lg h-[400px]">
            <img 
              src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-signup-cta.png" 
              alt="Pet Care" 
              className="w-full h-full object-cover object-center"
              style={{
                objectPosition: "center 91%",
                maxHeight: "110%"
              }}
            />
            {/* Slight overlay for better text readability */}
            <div className="absolute inset-0 bg-blue-900/20"></div>
          </div>
          
          {/* Content Container with white card */}
          <div className="relative z-10 py-16 px-12 h-[400px] flex items-center">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pawfect Care, Just a Tap Away
              </h2>
              
              {/* Short description */}
              <p className="text-lg text-gray-700 mb-6">
                Sign up for personalized vet recommendations and easy appointment booking.
              </p>
              
              {/* Registration Button */}
              <div className="mt-6">
                <button 
                  onClick={handleRegisterClick}
                  className="inline-block bg-white border-2 border-blue-500 text-blue-600 px-8 py-3 rounded-full font-medium hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-md flex items-center justify-center"
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Cards Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-center mb-8 pt-6">Popular Cities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Istanbul Card */}
          <div 
            className="group cursor-pointer"
            onClick={() => handleCityCardClick("Istanbul")}
          >
            <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <img 
                src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-istanbul.jpg" 
                alt="İstanbul" 
                className="w-full h-82 object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <p className="absolute bottom-3 left-4 text-white font-medium text-lg">İstanbul</p>
            </div>
          </div>

          {/* Ankara Card */}
          <div 
            className="group cursor-pointer"
            onClick={() => handleCityCardClick("Ankara")}
          >
            <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <img 
                src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-ankara.jpg" 
                alt="Ankara" 
                className="w-full h-82 object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <p className="absolute bottom-3 left-4 text-white font-medium text-lg">Ankara</p>
            </div>
          </div>

          {/* Izmir Card */}
          <div 
            className="group cursor-pointer"
            onClick={() => handleCityCardClick("Izmir")}
          >
            <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <img 
                src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-izmir.jpg" 
                alt="İzmir" 
                className="w-full h-82 object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <p className="absolute bottom-3 left-4 text-white font-medium text-lg">İzmir</p>
            </div>
          </div>

          {/* Antalya Card */}
          <div 
            className="group cursor-pointer"
            onClick={() => handleCityCardClick("Antalya")}
          >
            <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <img 
                src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-antalya.jpg" 
                alt="Antalya" 
                className="w-full h-82 object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <p className="absolute bottom-3 left-4 text-white font-medium text-lg">Antalya</p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer - Simplified */}
      <footer className="bg-[#458AB5] bg-opacity-90 text-white mt-16 rounded-xl shadow-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Logo and Copyright */}
            <div className="flex flex-col items-center sm:items-start">
              <h3 className="text-xl font-bold mb-2">Petlyst</h3>
              <p className="text-sm text-blue-50">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            
            {/* Links */}
            <div className="flex space-x-6">
              <Link to="/about-us" className="text-blue-50 hover:text-white hover:underline transition-colors" onClick={() => window.scrollTo(0, 0)}>
                About Us
              </Link>
              <Link to="/contact-us" className="text-blue-50 hover:text-white hover:underline transition-colors" onClick={() => window.scrollTo(0, 0)}>
                Contact Us
              </Link>
            </div>
            
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/petlyst_app/" target="_blank" rel="noopener noreferrer" className="text-blue-50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@Petbilir" target="_blank" rel="noopener noreferrer" className="text-blue-50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="https://x.com/petbilir" target="_blank" rel="noopener noreferrer" className="text-blue-50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PetOwnerHomePage;
