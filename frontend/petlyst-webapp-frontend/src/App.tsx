import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import DefaultHeader from './components/layout/DefaultHeader';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/admin/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AddClinicPage from './pages/AddClinicPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ClinicPreviewPage from './pages/ClinicPreviewPage';
import './styles/clinicPreview.css';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/add-clinic';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isClinicPreview = location.pathname.startsWith('/clinic-preview/');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDashboard && !isAdminRoute && !isClinicPreview && <DefaultHeader />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedUserType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedUserType="veterinarian">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-clinic" 
          element={
            <ProtectedRoute allowedUserType="veterinarian">
              <AddClinicPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/clinic-preview/:clinicId" element={
          <ProtectedRoute>
            <ClinicPreviewPage />
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
