import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClinicCard from '../components/search/ClinicCard';
import SearchFilter from '../components/search/SearchFilter';
import SmallSearchBar from '../components/search/SmallSearchBar';
import { getApiErrorMessage, getApiErrorStatus, getApiErrorResponse, isApiError } from '../utils/errorMessage';
// Types for our data
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
  slug?: string; // Klinik için SEO-dostu URL'ler için slug
}

// Define the Veterinarian interface
interface Veterinarian {
  veterinarian_id: string;
  user_id: number;
  user_name: string;
  user_surname: string;
  user_email: string;
  user_profile_photo: string | null;
  slug: string;
  biography: string | null;
  preferred_languages: string[] | null;
  expertise: string[];
  clinic: {
    clinic_id: number;
    clinic_name: string;
    province: string;
    district: string;
  } | null;
}

interface SearchResponse {
  success: boolean;
  clinics: Clinic[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Define veterinarian search response
interface VeterinarianSearchResponse {
  success: boolean;
  veterinarians: Veterinarian[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const SearchResult: React.FC = () => {
  // Get and manage URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State for search results and UI state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [vetPagination, setVetPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Extract search parameters from URL
  const query = searchParams.get('query') || '';
  const province = searchParams.get('province') || '';
  const district = searchParams.get('district') || '';
  const animalType = searchParams.get('animalType') || '';
  const medicalService = searchParams.get('medicalService') || '';
  const additionalService = searchParams.get('additionalService') || '';
  const clinicType = searchParams.get('clinicType') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const veterinarian = searchParams.get('veterinarian') || '';
  const expertise = searchParams.get('expertise') || '';
  const veterinarianName = searchParams.get('veterinarianName') || '';

  // Check if we're searching for veterinarians (based on URL parameter)
  const isVeterinarianSearch = (veterinarian === 'any' || veterinarianName) && veterinarian !== '';
  const showAllResults = veterinarian === 'all';
  // If we have a query but no specific filter, we should search in both categories
  const isDefaultSearch = query && !veterinarian && !veterinarianName && !animalType && !medicalService && !additionalService && !clinicType && !expertise;

  // Fetch search results whenever URL parameters change
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use relative URL with proxy
        console.log("Using relative URL with Vite proxy");

        // Construct API parameters from URL parameters
        const params: Record<string, string | number> = {};
        if (query) params.query = query;
        if (province) params.province = province;
        if (district) params.district = district;
        if (animalType) params.animalType = animalType;
        if (medicalService) params.medicalService = medicalService;
        if (additionalService) params.additionalService = additionalService;
        if (clinicType) params.clinicType = clinicType;
        params.page = page;
        params.limit = limit;

        console.log("Sending request with params:", params);
        
        // Call the search API with relative URL (proxy will handle the rest)
        const response = await axios.get<SearchResponse>(
          `/api/pet-owners/search-clinics`, 
          { params }
        );
        
        if (response.data.success) {
          setClinics(response.data.clinics);
          setPagination(response.data.pagination);
        } else {
          setError('Failed to fetch search results');
        }
        
        return response; // Return the response for chaining
      } catch (err) {
        console.error('Error fetching search results:', err);
        
        // Enhanced error reporting
        let errorMessage = 'An error occurred';
        
        if (getApiErrorMessage(err)) {
          errorMessage += `: ${getApiErrorMessage(err)}`;
        }
        
        // Extract more details from axios error
        if (getApiErrorResponse(err)) {
          console.error('Response status:', getApiErrorStatus(err));
          console.error('Response data:', getApiErrorResponse(err)?.data);
          errorMessage += ` (Status: ${getApiErrorStatus(err)})`;
          
          if (getApiErrorResponse(err)?.data && getApiErrorMessage(err)) {
            errorMessage += ` - ${getApiErrorMessage(err)}`;
          }
        } else if (isApiError(err) && err.request) {
          // Request was made but no response received
          console.error('No response received:', err.request);
          errorMessage += ' - No response from server';
        }
        
        setError(errorMessage);
        throw err; // Re-throw for error handling in the Promise chain
      } finally {
        setLoading(false);
      }
    };

    const fetchVeterinarians = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Construct API parameters
        const params: Record<string, string | number> = {};
        if (query) params.query = query;
        if (province) params.province = province;
        if (expertise) params.expertise = expertise;
        if (veterinarian && veterinarian !== 'all') params.veterinarian = veterinarian;
        if (veterinarianName) params.veterinarianName = veterinarianName;
        params.page = page;
        params.limit = limit;

        console.log("Searching for veterinarians with params:", params);
        console.log("Query parameter:", query);
        console.log("Veterinarian parameter:", veterinarian);
        console.log("VeterinarianName parameter:", veterinarianName);
        
        // Call the veterinarian search API
        const response = await axios.get<VeterinarianSearchResponse>(
          `/api/pet-owners/search-veterinarians`, 
          { params }
        );
        
        console.log("Response from API:", response.data);
        console.log("Found veterinarians:", response.data.veterinarians?.length || 0);
        
        if (response.data.success) {
          setVeterinarians(response.data.veterinarians);
          setVetPagination(response.data.pagination);
        } else {
          setError('Failed to fetch veterinarian results');
        }
        
        return response; // Return the response for chaining
      } catch (err) {
        console.error('Error fetching veterinarian results:', err);
        
        let errorMessage = 'An error occurred while searching for veterinarians';
        
        if (getApiErrorResponse(err)) {
          errorMessage += ` (${getApiErrorStatus(err)})`;
          if (getApiErrorResponse(err)?.data && getApiErrorMessage(err)) {
            errorMessage += ` - ${getApiErrorMessage(err)}`;
          }
        }
        
        setError(errorMessage);
        throw err; // Re-throw for error handling in the Promise chain
      } finally {
        setLoading(false);
      }
    };

    // Set default if no veterinarian param is set - only on initial page load, not when deliberately changing filters
    if (!veterinarian && !searchParams.has('veterinarian') && !searchParams.toString().includes('veterinarian=')) {
      // Açıkça belirtilmediği durumda varsayılan olarak 'all' ayarla
      updateFilters({ veterinarian: 'all' });
      return;
    }

    // For "all" option, fetch both clinics and veterinarians
    if (showAllResults) {
      Promise.all([
        fetchSearchResults(),
        fetchVeterinarians()
      ]).then(() => {
        // Artık otomatik geçiş yapmıyoruz, kullanıcının seçimini koruyoruz
        console.log("Showing all results (clinics and veterinarians)");
      }).catch(err => {
        console.error("Error fetching all results:", err);
      });
    } else if (isVeterinarianSearch) {
      fetchVeterinarians();
    } else if (isDefaultSearch) {
      // If the user is searching with a query but no specific filters, search both categories
      Promise.all([
        fetchSearchResults(),
        fetchVeterinarians()
      ]).then(() => {
        // Kullanıcının seçimini koruyoruz
        console.log("Showing results for default search (both categories)");
      }).catch(err => {
        console.error("Error fetching default search results:", err);
      });
    } else {
      // Klinik aramalarında veteriner verileri getirmeye gerek yok
      fetchSearchResults();
      // Clinics seçili iken veteriner listesini temizle
      if (veterinarian === '') {
        setVeterinarians([]);
      }
    }
  }, [
    query, province, district, animalType, medicalService, 
    additionalService, clinicType, page, limit, 
    veterinarian, expertise, veterinarianName, searchParams
  ]);

  // Update URL parameters when filters change
  const updateFilters = (newFilters: Record<string, string | number>) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    // Update each parameter
    Object.entries(newFilters).forEach(([key, value]) => {
      // Special handling for veterinarian parameter
      if (key === 'veterinarian') {
        if (value === '') {
          // Explicitly set empty value for clinics view
          updatedParams.set(key, '');
        } else if (value) {
          updatedParams.set(key, value.toString());
        } else {
          updatedParams.delete(key);
        }
      } else {
        // Normal handling for other parameters
        if (value) {
          updatedParams.set(key, value.toString());
        } else {
          updatedParams.delete(key);
        }
      }
    });
    
    // Reset to page 1 when filters change
    if (!('page' in newFilters)) {
      updatedParams.set('page', '1');
    }
    
    setSearchParams(updatedParams);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  // Handle search from small search bar
  const handleSearch = (newQuery: string) => {
    updateFilters({ query: newQuery });
  };

  // Render veterinarian card
  const renderVeterinarianCard = (vet: Veterinarian) => {
    const handleCardClick = () => {
      navigate(`/veterinarians/profile/${vet.slug || vet.veterinarian_id}`);
    };

    return (
      <div 
        key={vet.veterinarian_id} 
        className="rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer h-full flex flex-col"
        onClick={handleCardClick}
      >
        {/* Veterinarian Info */}
        <div className="px-4 py-3 flex-grow flex flex-col justify-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
            Dr. {vet.user_name} {vet.user_surname}
          </h3>
          
          {/* Clinic Info */}
          {vet.clinic && (
            <div className="mb-2 flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm truncate">{vet.clinic.clinic_name}</span>
            </div>
          )}
          
          {/* Location */}
          {vet.clinic && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-1.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm truncate">{vet.clinic.province}, {vet.clinic.district}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {veterinarianName ? `Veterinarian: ${veterinarianName}` : 
          query ? `Search Results for "${query}"` : 'All Results'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <SearchFilter 
            updateFilters={updateFilters}
            currentFilters={{
              query,
              province,
              district,
              animalType,
              medicalService,
              additionalService,
              clinicType,
              expertise,
              veterinarian
            }}
          />
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3">
          {/* Small Search Bar - aligned with filters */}
          <div className="mb-4">
            <SmallSearchBar 
              initialQuery={query} 
              onSearch={handleSearch} 
            />
          </div>
          
          {/* Active filters display */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
            <div className="mb-2 text-sm text-gray-500">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {/* Filter tags/pills */}
              {query && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  Search: {query}
                  <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ query: '' })}>×</button>
                </span>
              )}
              {province && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  Province: {province}
                  <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ province: '' })}>×</button>
                </span>
              )}
              {district && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  District: {district}
                  <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ district: '' })}>×</button>
                </span>
              )}
              {clinicType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  Clinic Type: {clinicType}
                  <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ clinicType: '' })}>×</button>
                </span>
              )}
              {animalType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  Animal: {animalType}
                  <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ animalType: '' })}>×</button>
                </span>
              )}
              {medicalService && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
                  Service: {medicalService}
                  <button className="ml-2 text-green-500 hover:text-green-700" onClick={() => updateFilters({ medicalService: '' })}>×</button>
                </span>
              )}
              {additionalService && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center">
                  Additional: {additionalService}
                  <button className="ml-2 text-purple-500 hover:text-purple-700" onClick={() => updateFilters({ additionalService: '' })}>×</button>
                </span>
              )}
              {veterinarian && !veterinarianName && (
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm flex items-center">
                  Veterinarian: {veterinarian}
                  <button className="ml-2 text-teal-500 hover:text-teal-700" onClick={() => updateFilters({ veterinarian: '' })}>×</button>
                </span>
              )}
              {veterinarianName && (
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm flex items-center">
                  Veterinarian: {veterinarianName}
                  <button className="ml-2 text-teal-500 hover:text-teal-700" onClick={() => updateFilters({ veterinarianName: '' })}>×</button>
                </span>
              )}
              {expertise && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center">
                  Expertise: {expertise}
                  <button className="ml-2 text-indigo-500 hover:text-indigo-700" onClick={() => updateFilters({ expertise: '' })}>×</button>
                </span>
              )}
              
              {(query || province || district || clinicType || animalType || medicalService || additionalService || veterinarian || expertise || veterinarianName) && (
                <button 
                  className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm flex items-center hover:bg-red-100"
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('page', '1');
                    params.set('limit', limit.toString());
                    setSearchParams(params);
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-700">Loading results...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-lg text-red-700">
              <p className="font-medium">Error loading results</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div>
              {/* Showing count */}
              <div className="mb-4 text-gray-600">
                {/* No results found */}
                {showAllResults && clinics.length === 0 && veterinarians.length === 0 && (
                  <div>No results found matching your criteria</div>
                )}
                {isDefaultSearch && clinics.length === 0 && veterinarians.length === 0 && (
                  <div>No results found matching your criteria</div>
                )}
                
                {/* Results found in 'all' mode */}
                {showAllResults && (clinics.length > 0 || veterinarians.length > 0) && (
                  <div>
                    Showing {clinics.length + veterinarians.length} results 
                    ({clinics.length} clinics and {veterinarians.length} veterinarians)
                  </div>
                )}
                
                {/* Results found in 'default search' mode */}
                {isDefaultSearch && (clinics.length > 0 || veterinarians.length > 0) && (
                  <div>
                    Showing {clinics.length + veterinarians.length} results 
                    ({clinics.length} clinics and {veterinarians.length} veterinarians)
                  </div>
                )}
                
                {/* Results for clinic-only search */}
                {!showAllResults && !isVeterinarianSearch && !isDefaultSearch && clinics.length === 0 && (
                  <div>No clinics found matching your criteria</div>
                )}
                {!showAllResults && !isVeterinarianSearch && !isDefaultSearch && clinics.length > 0 && (
                  <div>Showing {clinics.length} of {pagination.total} clinics</div>
                )}
                
                {/* Results for veterinarian-only search */}
                {!showAllResults && isVeterinarianSearch && !isDefaultSearch && veterinarians.length === 0 && (
                  <div>No veterinarians found matching your criteria</div>
                )}
                {!showAllResults && isVeterinarianSearch && !isDefaultSearch && veterinarians.length > 0 && (
                  <div>Showing {veterinarians.length} of {vetPagination.total} veterinarians</div>
                )}
              </div>
              
              {/* Results display */}
              {/* Show clinics when searching for clinics or in "all" mode */}
              {(showAllResults || !isVeterinarianSearch) && clinics.length > 0 && (
                <div className={`${showAllResults ? "mb-8" : ""}`}>
                  {showAllResults && <h2 className="text-xl font-bold mb-4">Clinics</h2>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clinics.map(clinic => (
                      <ClinicCard key={clinic.clinic_id} clinic={clinic} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show veterinarians when searching for veterinarians or in "all" mode */}
              {(showAllResults || isVeterinarianSearch || isDefaultSearch) && veterinarians.length > 0 && veterinarian !== '' && (
                <div>
                  {(showAllResults || isDefaultSearch) && <h2 className="text-xl font-bold mb-4">Veterinarians</h2>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {veterinarians.map(veterinarian => renderVeterinarianCard(veterinarian))}
                  </div>
                </div>
              )}
              
              {/* Pagination - only show for non-all searches */}
              {!showAllResults && isVeterinarianSearch && vetPagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center">
                    <button
                      onClick={() => handlePageChange(vetPagination.page - 1)}
                      disabled={vetPagination.page === 1}
                      className={`px-3 py-1 rounded-l-md ${
                        vetPagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-50'
                      } border border-gray-300`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: vetPagination.totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        // Show current page, first page, last page, and pages around current
                        return p === 1 || p === vetPagination.totalPages || 
                               Math.abs(p - vetPagination.page) <= 1;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis
                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                        const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-3 py-1 bg-white border-t border-b border-gray-300 text-gray-500">
                                ...
                              </span>
                            )}
                            
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 ${
                                vetPagination.page === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-blue-600 hover:bg-blue-50'
                              } border-t border-b border-gray-300`}
                            >
                              {page}
                            </button>
                            
                            {showEllipsisAfter && (
                              <span className="px-3 py-1 bg-white border-t border-b border-gray-300 text-gray-500">
                                ...
                              </span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    
                    <button
                      onClick={() => handlePageChange(vetPagination.page + 1)}
                      disabled={vetPagination.page === vetPagination.totalPages}
                      className={`px-3 py-1 rounded-r-md ${
                        vetPagination.page === vetPagination.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-50'
                      } border border-gray-300`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {/* Pagination for clinics */}
              {!showAllResults && !isVeterinarianSearch && pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded-l-md ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-50'
                      } border border-gray-300`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        // Show current page, first page, last page, and pages around current
                        return p === 1 || p === pagination.totalPages || 
                               Math.abs(p - pagination.page) <= 1;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis
                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                        const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-3 py-1 bg-white border-t border-b border-gray-300 text-gray-500">
                                ...
                              </span>
                            )}
                            
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 ${
                                pagination.page === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-blue-600 hover:bg-blue-50'
                              } border-t border-b border-gray-300`}
                            >
                              {page}
                            </button>
                            
                            {showEllipsisAfter && (
                              <span className="px-3 py-1 bg-white border-t border-b border-gray-300 text-gray-500">
                                ...
                              </span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-3 py-1 rounded-r-md ${
                        pagination.page === pagination.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-50'
                      } border border-gray-300`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResult;
