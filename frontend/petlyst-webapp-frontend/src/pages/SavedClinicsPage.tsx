import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getApiErrorStatus } from '../utils/errorMessage';

// Saved clinic interface
interface SavedClinic {
  clinic_id: number;
  clinic_name: string;
  clinic_type: string;
  clinic_description: string;
  province: string;
  district: string;
  clinic_address: string;
  photos: string[];
  favorited_at: string;
  slug: string;
}

const SavedClinicsPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token) || localStorage.getItem('token');


  const [savedClinics, setSavedClinics] = useState<SavedClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!token) {
      navigate('/login', { state: { redirectTo: '/saved-clinics' } });
      return;
    }
    
    const fetchSavedClinics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/pet-owners/saved-clinics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setSavedClinics(response.data.favorites);
        } else {
          setError('Failed to load saved clinics');
        }
      } catch (err) {
        console.error('Error fetching saved clinics:', err);
        if (getApiErrorStatus(err) === 403) {
          setError('Only pet owners can access saved clinics');
        } else {
          setError('Failed to load saved clinics. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedClinics();
  }, [token, navigate]);
  
  const handleRemoveFavorite = async (clinicId: number) => {
    try {
      const response = await axios.delete(`/api/pet-owners/saved-clinics/${clinicId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Remove the clinic from the list
        setSavedClinics(savedClinics.filter(clinic => clinic.clinic_id !== clinicId));
      }
    } catch (error) {
      console.error('Error removing clinic from favorites:', error);
    }
  };
  
  // Format clinic type display
  const formatClinicType = (type: string): string => {
    if (type === 'animal_hospital') return 'Animal Hospital';
    if (type === 'veterinary_clinic') return 'Veterinary Clinic';
    return type;
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading saved clinics...</p>
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
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Saved Clinics</h1>
          <p className="text-gray-500 mt-2">Clinics you've added to your favorites</p>
        </div>
        
        {savedClinics.length === 0 ? (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Saved Clinics</h2>
            <p className="text-gray-600 mb-6">You haven't added any clinics to your favorites yet</p>
            <Link to="/clinics" className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Explore Clinics
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedClinics.map((clinic) => (
              <div key={clinic.clinic_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-40">
                  {clinic.photos && clinic.photos.length > 0 ? (
                    <img 
                      src={clinic.photos[0]} 
                      alt={clinic.clinic_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <button 
                    onClick={() => handleRemoveFavorite(clinic.clinic_id)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4">
                  <Link to={`/clinics/${clinic.slug}`} className="block">
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">{clinic.clinic_name}</h3>
                  </Link>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {formatClinicType(clinic.clinic_type)}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="ml-2">
                      <p className="text-sm text-gray-700 leading-snug">
                        {clinic.province}, {clinic.district}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Link 
                      to={`/clinics/${clinic.slug}`}
                      className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedClinicsPage; 