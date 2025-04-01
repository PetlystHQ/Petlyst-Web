import { useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/dashboard';
import { useAppSelector } from '../../hooks/useAppSelector';

const Dashboard = () => {
  const { user, token } = useAppSelector(state => state.auth);

  // Effect to ensure veterinarian has a slug
  useEffect(() => {
    // Only run for veterinarian users
    if (user?.user_type === 'veterinarian' && token) {
      const ensureSlug = async () => {
        try {
          console.log('Ensuring veterinarian has a slug...');
          const response = await axios.post(API_ENDPOINTS.ENSURE_SLUG, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('Slug ensure response:', response.data);
        } catch (error) {
          console.error('Error ensuring slug:', error);
        }
      };
      
      ensureSlug();
    }
  }, [user, token]);

  // Rest of the component...
}; 