import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ClinicCard from '../components/search/ClinicCard';

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

const SearchResult: React.FC = () => {
  // Get and manage URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for search results and UI state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
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
      } catch (err: any) {
        console.error('Error fetching search results:', err);
        
        // Enhanced error reporting
        let errorMessage = 'An error occurred';
        
        if (err.message) {
          errorMessage += `: ${err.message}`;
        }
        
        // Extract more details from axios error
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
          errorMessage += ` (Status: ${err.response.status})`;
          
          if (err.response.data && err.response.data.message) {
            errorMessage += ` - ${err.response.data.message}`;
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error('No response received:', err.request);
          errorMessage += ' - No response from server';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, province, district, animalType, medicalService, additionalService, clinicType, page, limit]);

  // Update URL parameters when filters change
  const updateFilters = (newFilters: Record<string, string | number>) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    // Update each parameter
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        updatedParams.set(key, value.toString());
      } else {
        updatedParams.delete(key);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Search Results for "${query}"` : 'All Clinics'}
      </h1>
      
      {/* Filter section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-3">
          {/* Filter tags/pills would go here */}
          {query && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Search: {query}
              <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ query: '' })}>×</button>
            </span>
          )}
          {province && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Province: {province}
              <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => updateFilters({ province: '' })}>×</button>
            </span>
          )}
          {/* More filter pills would go here */}
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-6">
          {error}
        </div>
      )}
      
      {/* Results display */}
      {!loading && !error && clinics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No clinics found matching your search criteria.</p>
        </div>
      )}
      
      {/* Clinic Grid */}
      {!loading && !error && clinics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clinics.map(clinic => (
            <ClinicCard key={clinic.clinic_id} clinic={clinic} />
          ))}
        </div>
      )}
      
      {/* Pagination controls */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-10">
          <nav className="flex items-center space-x-2">
            <button 
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }).map((_, index) => {
              // Display current page, first, last, and pages around current
              const pageNum = index + 1;
              const isCurrentPage = pageNum === pagination.page;
              const isFirstPage = pageNum === 1;
              const isLastPage = pageNum === pagination.totalPages;
              const isNearCurrentPage = Math.abs(pageNum - pagination.page) <= 1;
              
              // Only render if it's the current page, first/last page, or near current
              if (isCurrentPage || isFirstPage || isLastPage || isNearCurrentPage) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded ${
                      isCurrentPage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              
              // Add ellipsis if needed
              if ((pageNum === 2 && pagination.page > 3) || 
                  (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)) {
                return <span key={pageNum} className="px-2">...</span>;
              }
              
              return null;
            })}
            
            <button 
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 rounded ${pagination.page === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
      
    </div>
  );
};

export default SearchResult;
