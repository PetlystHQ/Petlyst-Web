import { useEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import axios from 'axios';
import { API_URL } from '../../config/api';

const DashboardSidebar = () => {
  const token = useAppSelector(state => state.auth.token);

  const checkVerificationStatus = async () => {
    try {
      if (!token) {
        console.error('No token found');
        return;
      }

      await axios.get(
        `${API_URL}/api/veterinarian/verification-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
    // checkVerificationStatus is intentionally not a dep: it captures `token`
    // via closure, and adding it would loop. This file is an orphan duplicate
    // tracked in ROADMAP.md ("Duplicate `DashboardSidebar.tsx`") and is
    // slated for removal during Effort 2.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="h-full bg-white shadow-lg">
      {/* Rest of your sidebar code */}
    </div>
  );
};

export default DashboardSidebar; 