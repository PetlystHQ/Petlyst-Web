import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!adminToken || !adminUser) {
        return <Navigate to="/admin/login" replace />;
    }

    try {
        const user = JSON.parse(adminUser);
        if (user.userType !== 'admin') {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            return <Navigate to="/admin/login" replace />;
        }
    } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute; 