import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import DefaultHeader from './components/layout/DefaultHeader';
import HomePage from './pages/HomePage';
import PetOwnerHomePage from './pages/PetOwnerHomePage';
import ProtectedRoute from './components/admin/ProtectedRoute';
import ProtectedClinicRoute from './components/admin/ProtectedClinicRoute';
import Dashboard from './pages/Dashboard';
import AddClinicPage from './pages/AddClinicPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ClinicPreviewPage from './pages/ClinicPreviewPage';
import EditClinicPage from './pages/EditClinicPage';
import ManagementDashboard from './pages/ManagementDashboard';
import PetOwnerDashboard from './pages/PetOwnerDashboard';
import SearchResult from './pages/SearchResult';
import VeterinariansListPage from './pages/VeterinariansListPage';
import SingleVeterinarianPage from './pages/SingleVeterinarianPage';
import SingleClinicPage from './pages/SingleClinicPage';
import SavedClinicsPage from './pages/SavedClinicsPage';
import ContactUsPage from './pages/ContactUsPage';
import AboutUsPage from './pages/AboutUsPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
import ForbiddenPage from './pages/ForbiddenPage';
import './styles/clinicPreview.css';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || 
                      location.pathname === '/add-clinic' || 
                      location.pathname.startsWith('/edit-clinic/') ||
                      location.pathname.startsWith('/management-dashboard') ||
                      location.pathname === '/pet-owner-dashboard';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isClinicPreview = location.pathname.startsWith('/clinic-preview/');
  const isErrorPage = location.pathname === '/404' || 
                     location.pathname === '/403' ||
                     location.pathname === '/500';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDashboard && !isAdminRoute && !isClinicPreview && !isErrorPage && <DefaultHeader />}
      <Routes>
        <Route path="/" element={<PetOwnerHomePage />} />
        <Route path="/enterprise" element={<HomePage />} />
        <Route path="/pet-owner-home" element={<PetOwnerHomePage />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/veterinarians" element={<VeterinariansListPage />} />
        <Route path="/veterinarians/:id" element={<SingleVeterinarianPage />} />
        <Route path="/veterinarians/profile/:slug" element={<SingleVeterinarianPage />} />
        <Route path="/clinics/id/:clinicId" element={<SingleClinicPage />} />
        <Route path="/clinics/:slug" element={<SingleClinicPage />} />
        <Route path="/saved-clinics" element={
          <ProtectedRoute allowedUserType="pet_owner">
            <SavedClinicsPage />
          </ProtectedRoute>
        } />
        <Route path="/pet-owner-dashboard" element={
          <ProtectedRoute allowedUserType="pet_owner">
            <PetOwnerDashboard />
          </ProtectedRoute>
        } />
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
            <ProtectedClinicRoute>
              <AddClinicPage />
            </ProtectedClinicRoute>
          } 
        />
        <Route path="/clinic-preview/:clinicId" element={
          <ProtectedRoute>
            <ClinicPreviewPage />
          </ProtectedRoute>
        } />
        <Route path="/edit-clinic/:clinicId" element={
          <ProtectedClinicRoute>
            <EditClinicPage />
          </ProtectedClinicRoute>
        } />
        <Route path="/management-dashboard" element={
          <ProtectedRoute allowedUserType="veterinarian">
            <ManagementDashboard />
          </ProtectedRoute>
        } />
        <Route path="/management-dashboard/:clinicId" element={
          <ProtectedRoute allowedUserType="veterinarian">
            <ManagementDashboard />
          </ProtectedRoute>
        } />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        
        {/* Error Pages */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ErrorPage />} />
        <Route path="/error" element={<ErrorPage />} />
        
        {/* Catch-all route for 404 errors */}
        <Route path="*" element={<NotFoundPage />} />
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
