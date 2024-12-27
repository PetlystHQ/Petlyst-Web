import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: 'veterinarian' | 'pet_owner';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserType 
}) => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedUserType && user.user_type !== allowedUserType) {
    // Redirect to home if user type doesn't match
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 