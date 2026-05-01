import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import axios from 'axios';
import { API_URL } from '../../config/api';

interface ProtectedClinicRouteProps {
  children: React.ReactNode;
}

const ProtectedClinicRoute: React.FC<ProtectedClinicRouteProps> = ({ children }) => {
  const { user, isAuthenticated, token } = useAppSelector(state => state.auth);
  const location = useLocation();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPendingRequests = async () => {
      if (!token || !isAuthenticated || user?.user_type !== 'veterinarian') {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/veterinarian/check-pending-requests`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.success) {
          setHasPendingRequest(response.data.hasPendingRequest);
        }
      } catch (error) {
        console.error('Error checking pending clinic requests:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPendingRequests();
  }, [token, isAuthenticated, user]);

  if (loading) {
    // Show loading state while checking pending requests
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Regular user route protection
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user is a veterinarian
  if (user.user_type !== 'veterinarian') {
    return <Navigate to="/" replace />;
  }

  // Check for pending clinic requests
  if (hasPendingRequest) {
    // Redirect to dashboard with a message about pending request
    return <Navigate to="/dashboard" state={{ pendingRequest: true }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedClinicRoute; 