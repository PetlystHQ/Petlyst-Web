import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/dashboard';
import { setProfileVisibility } from '../../store/slices/authSlice';

interface ViewProfileButtonProps {
  className?: string;
  forceRefresh?: boolean;
}

const ViewProfileButton: React.FC<ViewProfileButtonProps> = ({ className = '', forceRefresh = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token, profileVisibility: storeProfileVisibility } = useAppSelector(state => state.auth);
  const [isProfilePublic, setIsProfilePublic] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // First useEffect: When redux store visibility changes, update local state
  useEffect(() => {
    console.log("Redux profileVisibility changed:", storeProfileVisibility);
    if (storeProfileVisibility !== null) {
      setIsProfilePublic(storeProfileVisibility);
    }
  }, [storeProfileVisibility]);

  // Second useEffect: Fetch profile visibility on mount or forceRefresh
  useEffect(() => {
    const fetchProfileVisibility = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        // Using API_ENDPOINTS instead of hardcoded URL
        const response = await axios.get(API_ENDPOINTS.PROFILE_VISIBILITY, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const isPublic = response.data?.is_profile_public ?? false;
        setIsProfilePublic(isPublic);
        
        // Also update the Redux store
        dispatch(setProfileVisibility(isPublic));
        
        console.log("ViewProfileButton: Updated visibility state:", isPublic);
      } catch (error) {
        console.error("Error fetching profile visibility:", error);
        // Default to private if we can't determine
        setIsProfilePublic(false);
        dispatch(setProfileVisibility(false));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfileVisibility();
    }
  }, [user, token, forceRefresh, dispatch]);

  // Use the Redux store value if available, otherwise use local state
  const effectiveProfileVisibility = storeProfileVisibility !== null 
    ? storeProfileVisibility 
    : isProfilePublic;

  console.log("ViewProfileButton rendering with:", { 
    storeProfileVisibility, 
    isProfilePublic, 
    effectiveProfileVisibility 
  });

  const handleViewProfile = async () => {
    console.log("Current user:", user);
    
    if (!user) {
      console.error("No user found");
      return;
    }

    // Get user ID safely
    const userId = user?.id ?? (user as any)?.user_id;
    
    if (!userId) {
      console.error("No user ID found");
      navigate('/dashboard');
      return;
    }

    try {
      // Önce kullanıcının profil bilgilerini çekelim
      const response = await axios.get(API_ENDPOINTS.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Veterinerin slug'ı halihazırda veritabanında varsa onu kullanalım
      if (response.data && response.data.slug) {
        console.log("Using existing slug from database:", response.data.slug);
        navigate(`/veterinarians/profile/${encodeURIComponent(response.data.slug)}`);
        return;
      }

      // Slug yoksa generate edelim
      const firstName = response.data?.user_name || (user as any).first_name || '';
      const lastName = response.data?.user_surname || (user as any).last_name || '';
      
      const slug = generateSlug(firstName, lastName);
      console.log("Generated slug:", slug);
      
      // URL'deki özel karakterlerin doğru işlenmesi için encodeURIComponent kullanıyoruz
      navigate(`/veterinarians/profile/${encodeURIComponent(slug)}`);
    } catch (error) {
      console.error("Error getting profile information:", error);
      
      // Bir hata durumunda yedek olarak user objesi üzerinden slug oluşturalım
      const firstName = (user as any).first_name || (user as any).user_name || '';
      const lastName = (user as any).last_name || (user as any).user_surname || '';
      
      const slug = generateSlug(firstName, lastName);
      console.log("Fallback generated slug:", slug);
      
      navigate(`/veterinarians/profile/${encodeURIComponent(slug)}`);
    }
  };

  // Helper function to generate slug
  const generateSlug = (firstName: string, lastName: string): string => {
    // Create a base slug with the name
    const slug = `dr-${firstName.toLowerCase()}-${lastName.toLowerCase()}`
      .replace(/\s+/g, '-')    // Replace spaces with hyphens
      .replace(/[^\w-]+/g, '') // Remove non-word chars
      .replace(/--+/g, '-')    // Collapse multiple hyphens to single
      .replace(/^-+/, '')      // Trim hyphens from start
      .replace(/-+$/, '');     // Trim hyphens from end
      
    return slug;
  };

  // Define styles based on profile visibility
  const cardBgClass = effectiveProfileVisibility === false ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-100';
  const titleTextClass = effectiveProfileVisibility === false ? 'text-gray-800' : 'text-indigo-800';
  const descTextClass = effectiveProfileVisibility === false ? 'text-gray-600' : 'text-indigo-600';
  const iconClass = effectiveProfileVisibility === false ? 'text-gray-300' : 'text-indigo-200';
  const buttonBgClass = effectiveProfileVisibility === false ? 'bg-gray-500 hover:bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <div className={`${cardBgClass} rounded-lg shadow-sm border overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${titleTextClass}`}>
              {effectiveProfileVisibility === false ? 'Your Private Profile' : 'Your Public Profile'}
            </h3>
            <p className={`mt-1 text-sm ${descTextClass}`}>
              {effectiveProfileVisibility === false ? 
                'Only you can see your profile right now' : 
                'View how your profile appears to others'}
            </p>
          </div>
          <div className="hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <button
          onClick={handleViewProfile}
          className={`w-full px-4 py-3 ${buttonBgClass} text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {effectiveProfileVisibility === false ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {effectiveProfileVisibility === false ? 'View My Private Profile' : 'View My Public Profile'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewProfileButton; 