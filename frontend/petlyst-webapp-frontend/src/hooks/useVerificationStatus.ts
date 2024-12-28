import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAppSelector } from './useAppSelector';
import { VerificationStatus } from '../types/dashboard';
import { API_ENDPOINTS } from '../constants/dashboard';

// Get initial status from localStorage if available
const getInitialStatus = (): VerificationStatus => {
  const savedStatus = localStorage.getItem('verification_status');
  if (savedStatus === 'pending' || savedStatus === 'verified' || savedStatus === 'unverified') {
    return savedStatus;
  }
  return null;
};

export const useVerificationStatus = () => {
  const { token } = useAppSelector(state => state.auth);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(getInitialStatus());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkVerificationStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(
        API_ENDPOINTS.VERIFICATION_STATUS,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const newStatus = response.data.verification_status as VerificationStatus;
      setVerificationStatus(newStatus);
      // Save to localStorage if not null
      if (newStatus) {
        localStorage.setItem('verification_status', newStatus);
      }
    } catch (error) {
      setError('Error fetching verification status');
      console.error('Error fetching verification status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updateVerificationStatus = useCallback(async (newStatus: VerificationStatus) => {
    setVerificationStatus(newStatus);
    // Save to localStorage if not null
    if (newStatus) {
      localStorage.setItem('verification_status', newStatus);
    }
  }, []);

  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  return { 
    verificationStatus, 
    isLoading, 
    error, 
    updateVerificationStatus,
    refreshStatus: checkVerificationStatus 
  };
}; 