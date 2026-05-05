import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/dashboard';
import { VETERINARY_LANGUAGES } from '../constants/VeterinaryLanguages';

interface Veterinarian {
  veterinarian_id: string;
  user_name: string;
  user_surname: string;
  user_profile_photo: string | null;
  biography: string | null;
  preferred_languages: string[] | null;
  veterinarian_verification_status: string;
  expertise_count: number;
}

const VeterinariansListPage: React.FC = () => {
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchVeterinarians = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.PUBLIC_PROFILES);
        
        if (response.data.success) {
          setVeterinarians(response.data.veterinarians);
        } else {
          setError(response.data.message || 'Failed to load veterinarians list');
        }
      } catch (error) {
        console.error('Error fetching veterinarians:', error);
        setError('Failed to load veterinarians list. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVeterinarians();
  }, []);

  // Function to get language name from ID
  const getLanguageName = (languageId: string) => {
    const language = VETERINARY_LANGUAGES.find(l => l.id === languageId);
    return language ? language.name : languageId;
  };

  // Truncate biography for preview
  const truncateBiography = (bio: string, maxLength: number = 150) => {
    if (!bio) return '';
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  };

  // Filter veterinarians based on search term
  const filteredVeterinarians = veterinarians.filter(vet => {
    const fullName = `${vet.user_name} ${vet.user_surname}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Add a new function to generate a slug
  const generateSlug = (vet: any): string => {
    const firstName = vet.user_name || '';
    const lastName = vet.user_surname || '';


    const slug = `dr-${firstName.toLowerCase()}-${lastName.toLowerCase()}`
      .replace(/\s+/g, '-')    // Replace spaces with hyphens
      .replace(/[^\w-]+/g, '') // Remove non-word chars
      .replace(/--+/g, '-')    // Collapse multiple hyphens to single
      .replace(/^-+/, '')      // Trim hyphens from start
      .replace(/-+$/, '');     // Trim hyphens from end
    
    return slug;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading veterinarians...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Our Veterinarians
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Find the perfect veterinary professional for your pet's needs
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for a veterinarian by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* No results message */}
        {filteredVeterinarians.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 005.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No veterinarians found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or check back later.</p>
          </div>
        )}

        {/* Veterinarians List */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVeterinarians.map((veterinarian) => (
            <div 
              key={veterinarian.veterinarian_id} 
              className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link to={`/veterinarians/profile/${generateSlug(veterinarian)}`} className="block">
                <div className="p-6 flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {veterinarian.user_profile_photo ? (
                      <img 
                        src={veterinarian.user_profile_photo} 
                        alt={`${veterinarian.user_name} ${veterinarian.user_surname}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Dr. {veterinarian.user_name} {veterinarian.user_surname}
                    </h2>
                    {veterinarian.veterinarian_verification_status === 'verified' && (
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <svg className="mr-1 h-1.5 w-1.5 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Verified
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {veterinarian.expertise_count} {veterinarian.expertise_count === 1 ? 'expertise area' : 'expertise areas'}
                    </p>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  {/* Biography preview */}
                  {veterinarian.biography ? (
                    <p className="text-sm text-gray-600 mt-3">
                      {truncateBiography(veterinarian.biography)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-3">
                      No biography provided.
                    </p>
                  )}
                  
                  {/* Languages */}
                  {veterinarian.preferred_languages && veterinarian.preferred_languages.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-medium text-gray-500 mb-1">Languages:</h3>
                      <div className="flex flex-wrap gap-1">
                        {veterinarian.preferred_languages.map(languageId => (
                          <span 
                            key={languageId} 
                            className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {getLanguageName(languageId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                    <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                      View Profile
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VeterinariansListPage; 