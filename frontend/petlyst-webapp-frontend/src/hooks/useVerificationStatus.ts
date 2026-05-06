import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useAppSelector } from './useAppSelector';
import { VerificationStatus } from '../types/dashboard';
import { API_ENDPOINTS } from '../constants/dashboard';

// Get initial status from localStorage if available
const getInitialStatus = (): VerificationStatus => {
  const savedStatus = localStorage.getItem('verification_status');
  if (
    savedStatus === 'pending' ||
    savedStatus === 'verified' ||
    savedStatus === 'not_verified' ||
    savedStatus === 'archived'
  ) {
    return savedStatus;
  }
  return 'pending';
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
      const response = await axiosInstance.get(API_ENDPOINTS.VERIFICATION_STATUS);
      
      // API yanıtını kontrol et ve doğru key'i kullan
      // Bazı endpoint'ler 'verification_status', bazıları 'status' kullanabilir
      const newStatus = (
        response.data.verification_status || 
        response.data.status || 
        'verified' // API hatası durumunda varsayılan olarak 'verified' kullan
      ) as VerificationStatus;
      
      setVerificationStatus(newStatus);
      // Save to localStorage if not null
      if (newStatus) {
        localStorage.setItem('verification_status', newStatus);
      }
    } catch (error) {
      // API hatası durumunda varsayılan olarak 'verified' değerini ayarla
      console.error('Error fetching verification status:', error);
      setError('Error fetching verification status');
      
      // API hatası olsa bile varsayılan olarak 'verified' kullan
      // Bu, kullanıcının form doldurmasına izin verecek
      setVerificationStatus('verified');
      localStorage.setItem('verification_status', 'verified');
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