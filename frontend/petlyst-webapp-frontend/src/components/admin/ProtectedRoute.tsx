import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: 'veterinarian' | 'pet_owner' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserType 
}) => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const location = useLocation();
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  // Special handling for admin routes
  if (allowedUserType === 'admin') {
    if (!adminToken || !adminUser) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Regular user route protection
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedUserType && user.user_type !== allowedUserType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 