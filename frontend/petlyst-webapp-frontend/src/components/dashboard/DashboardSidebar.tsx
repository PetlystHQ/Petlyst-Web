import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { logout, setProfileVisibility } from '../../store/slices/authSlice';
import { DashboardView, VerificationStatus } from '../../types/dashboard';
import { DASHBOARD_VIEWS, API_ENDPOINTS } from '../../constants/dashboard';
import axios from 'axios';
import { API_URL } from '../../config/api';

const DashboardSidebar = () => {
  const token = useAppSelector(state => state.auth.token);
  const dispatch = useAppDispatch();
  const [isUpdatingProfileVisibility, setIsUpdatingProfileVisibility] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<boolean | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(false);

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

  const confirmVisibilityChange = async () => {
    try {
      setIsUpdatingProfileVisibility(true);
      const newVisibility = pendingVisibilityChange;
      
      console.log('Trying to update profile visibility to:', newVisibility);
      
      // Use API_ENDPOINTS instead of hardcoded URL
      const response = await axios.put(API_ENDPOINTS.PROFILE_VISIBILITY, {
        is_profile_public: newVisibility
      }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Profile visibility update response:', response.data);

      if (response.status === 200) {
        setIsProfilePublic(!!newVisibility);
        // Update Redux store with the new visibility
        dispatch(setProfileVisibility(!!newVisibility));
        console.log('Profile visibility updated successfully to:', newVisibility);
      }
    } catch (error) {
      console.error('Error updating profile visibility:', error);
    } finally {
      setIsUpdatingProfileVisibility(false);
      setShowConfirmModal(false);
      setPendingVisibilityChange(null);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, [token]);

  return (
    <div className="h-full bg-white shadow-lg">
      {/* Rest of your sidebar code */}
    </div>
  );
};

export default DashboardSidebar; 