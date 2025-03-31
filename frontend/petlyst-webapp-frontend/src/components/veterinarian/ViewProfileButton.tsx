import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/dashboard';

interface ViewProfileButtonProps {
  className?: string;
}

const ViewProfileButton: React.FC<ViewProfileButtonProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user, token } = useAppSelector(state => state.auth);

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
    let slug = `dr-${firstName.toLowerCase()}-${lastName.toLowerCase()}`
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '') // Remove non-word chars
      .replace(/\-\-+/g, '-')   // Replace multiple hyphens with single
      .replace(/^-+/, '')       // Trim hyphens from start
      .replace(/-+$/, '');      // Trim hyphens from end
      
    return slug;
  };

  return (
    <div className={`bg-indigo-50 rounded-lg shadow-sm border border-indigo-100 overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-indigo-800">Your Public Profile</h3>
            <p className="mt-1 text-sm text-indigo-600">View how your profile appears to others</p>
          </div>
          <div className="hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <button
          onClick={handleViewProfile}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View My Public Profile
        </button>
      </div>
    </div>
  );
};

export default ViewProfileButton; 