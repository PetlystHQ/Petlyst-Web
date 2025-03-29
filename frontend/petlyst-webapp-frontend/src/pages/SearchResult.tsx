import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Search Results for "${query}"` : 'All Clinics'}
      </h1>
      
      {/* Filter components will go here */}
      
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
      
      {/* Clinic list will go here */}
      
      {/* Pagination controls will go here */}
      
    </div>
  );
};

export default SearchResult;
