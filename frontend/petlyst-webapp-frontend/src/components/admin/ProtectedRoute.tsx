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
    // Add debugging
    console.log('Admin route check:', { adminToken, adminUser });
    
    if (!adminToken || !adminUser) {
      console.log('Admin authentication failed: Missing token or user data');
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    
    // Check for admin userType in both formats
    const isAdmin = adminUser.userType === 'admin' || adminUser.user_type === 'admin';
    
    if (!isAdmin) {
      console.log('User is not an admin:', adminUser);
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    
    console.log('Admin authentication successful');
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