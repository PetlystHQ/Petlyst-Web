import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import DashboardLayout from '../components/layout/DashboardLayout';
import VerificationModal from '../components/modals/VerificationModal';
import { Overview } from '../components/dashboard/views/Overview';
import { Clinics } from '../components/dashboard/views/Clinics';
import VeterinarianProfile from '../components/veterinarian/VeterinarianProfile';
import { DashboardView, Clinic } from '../types/dashboard';
import { DASHBOARD_VIEWS, VIEW_TITLES, API_ENDPOINTS } from '../constants/dashboard';
import { RootState } from '../store';
import { useAppSelector } from '../hooks/useAppSelector';
import { API_URL } from '../config/api';

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const location = useLocation();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [refreshKey] = useState(0);
  const [hasSubmittedClinics, setHasSubmittedClinics] = useState(false);
  const [checkingClinics, setCheckingClinics] = useState(true);
  
  // Veterinerin onaylanmış bir klinik ilişkisi var mı kontrol etmek için state
  const [hasApprovedClinic, setHasApprovedClinic] = useState(false);
  const [checkingApprovedClinic, setCheckingApprovedClinic] = useState(true);
  
  const { 
    verificationStatus, 
    isLoading, 
    error, 
    updateVerificationStatus,
    refreshStatus 
  } = useVerificationStatus();
  const token = useSelector((state: RootState) => state.auth.token);
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const redirectState = location.state as { pendingRequest?: boolean } | null;
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Clinics durumunu tutacak state ekleyelim
  const [clinics, setClinics] = useState<Clinic[]>([]);

  // Check if veterinarian has approved clinic association
  useEffect(() => {
    const checkApprovedClinicStatus = async () => {
      if (!token || !user || user.user_type !== 'veterinarian') {
        setCheckingApprovedClinic(false);
        return;
      }
      
      setCheckingApprovedClinic(true);
      try {
        // API endpoint we created to check for approved clinic
        const response = await axios.get(`${API_URL}/api/veterinarian/approved-clinic/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Set hasApprovedClinic to true if the API returns a clinic
        setHasApprovedClinic(response.data && response.data.success && response.data.clinic !== null);
        console.log('Approved clinic check:', response.data);
      } catch (error) {
        console.error('Error checking approved clinic status:', error);
        setHasApprovedClinic(false);
      } finally {
        setCheckingApprovedClinic(false);
      }
    };
    
    // Run the check when verification status is verified
    if (verificationStatus === 'verified') {
      checkApprovedClinicStatus();
    }
  }, [token, user, verificationStatus]);

  // Check if veterinarian has any clinics
  useEffect(() => {
    const checkClinicSubmissions = async () => {
      if (!token) return;
      
      setCheckingClinics(true);
      try {
        const response = await axios.get(`${API_URL}/api/clinics/my-clinics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && Array.isArray(response.data.clinics)) {
          setClinics(response.data.clinics);
          setHasSubmittedClinics(response.data.clinics.length > 0);
        }
      } catch (error) {
        console.error('Error checking clinic submissions:', error);
        setHasSubmittedClinics(false);
      } finally {
        setCheckingClinics(false);
      }
    };
    
    if (verificationStatus === 'verified') {
      checkClinicSubmissions();
    }
  }, [token, verificationStatus, refreshKey]);

  // Set active view from navigation state
  useEffect(() => {
    const state = location.state as { activeView?: DashboardView };
    if (state?.activeView) {
      setCurrentView(state.activeView);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Effect to ensure veterinarian has a slug
  useEffect(() => {
    // Only run for veterinarian users
    if (user?.user_type === 'veterinarian' && token) {
      const ensureSlug = async () => {
        try {
          console.log('Ensuring veterinarian has a slug...');
          setCheckingClinics(true); // Use existing loading state to show spinner
          const response = await axios.post(API_ENDPOINTS.ENSURE_SLUG, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('Slug ensure response:', response.data);
        } catch (error) {
          console.error('Error ensuring slug:', error);
        } finally {
          setCheckingClinics(false); // Always ensure loading state is cleared
        }
      };
      
      ensureSlug();
    }
  }, [user, token]);

  useEffect(() => {
    // Check if redirected due to pending clinic request
    if (redirectState?.pendingRequest) {
      setNotificationMessage("You cannot add or edit clinics while you have a pending clinic join request.");
      // Clear the state after 8 seconds
      const timer = setTimeout(() => {
        setNotificationMessage(null);
      }, 8000);
      
      // Immediately clear the redirect state after using it
      window.history.replaceState({}, document.title);
      
      return () => clearTimeout(timer);
    }
  }, [redirectState]);

  // Klinik durumu değişikliğini dinle
  useEffect(() => {
    const handleClinicStatusChange = async () => {
      console.log('Clinic status change detected');
      if (localStorage.getItem('clinic_status_changed') === 'true') {
        // API üzerinden klinik durumunu güncelle
        if (token && user && user.user_type === 'veterinarian') {
          setCheckingApprovedClinic(true);
          try {
            const response = await axios.get(`${API_URL}/api/veterinarian/approved-clinic/${user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            // Durumu API'dan gelen yanıta göre güncelle
            setHasApprovedClinic(response.data && response.data.success && response.data.clinic !== null);
            console.log('Approved clinic check after status change:', response.data);
          } catch (error) {
            console.error('Error checking approved clinic status after change:', error);
            setHasApprovedClinic(false);
          } finally {
            setCheckingApprovedClinic(false);
          }
        } else {
          // Token veya kullanıcı yoksa doğrudan false olarak ayarla
          setHasApprovedClinic(false);
        }
        
        // localStorage'ı temizle
        localStorage.removeItem('clinic_status_changed');
      }
    };

    // Event listener ekle
    window.addEventListener('clinicStatusChanged', handleClinicStatusChange);
    
    // Component unmount olduğunda event listener'ı kaldır
    return () => {
      window.removeEventListener('clinicStatusChanged', handleClinicStatusChange);
    };
  }, [token, user]);

  const handleAddClinic = () => {
    // Navigate to the add clinic page instead of opening a modal
    navigate('/add-clinic');
  };

  const handleEditClinic = (clinic: Clinic) => {
    // Navigate to the add clinic page with clinic ID for editing
    navigate(`/add-clinic?clinicId=${clinic.clinic_id}`);
  };

  const handleVerificationSubmit = async () => {
    await updateVerificationStatus('pending');
    setIsVerificationModalOpen(false);
    // Refresh the status after a short delay to ensure backend has updated
    setTimeout(refreshStatus, 1000);
  };

  const handleBackToPetlyst = () => {
    navigate('/');
  };

  const renderContent = () => {
    const commonProps = {
      verificationStatus,
      onVerify: () => setIsVerificationModalOpen(true),
      isLoading: isLoading || checkingClinics || checkingApprovedClinic,
      onAddClinic: handleAddClinic,
      onViewChange: setCurrentView,
      hasSubmittedClinics,
      hasApprovedClinic // Pass the approved clinic status to Overview
    };

    // Profile view is always accessible regardless of verification status
    if (currentView === DASHBOARD_VIEWS.profile) {
      return <VeterinarianProfile />;
    }

    // Only allow access to certain views if verified
    if (verificationStatus !== 'verified' && currentView !== DASHBOARD_VIEWS.overview) {
      return <Overview {...commonProps} />;
    }

    switch (currentView) {
      case DASHBOARD_VIEWS.overview:
        return <Overview 
          {...commonProps} 
          firstClinic={clinics && clinics.length > 0 ? clinics[0] : null}
        />;
      case DASHBOARD_VIEWS.clinics:
        return (
          <Clinics
            isLoading={isLoading}
            onAddClinic={handleAddClinic}
            onEditClinic={handleEditClinic}
            refreshKey={refreshKey}
          />
        );
      default:
        return <Overview {...commonProps} />;
    }
  };

  if (error) {
    return (
      <DashboardLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        verificationStatus={verificationStatus}
      >
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      verificationStatus={verificationStatus}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{VIEW_TITLES[currentView]}</h1>
        <button
          onClick={handleBackToPetlyst}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Petlyst
        </button>
      </div>
      
      {/* Notification message for redirected users */}
      {notificationMessage && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {notificationMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {renderContent()}

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSubmitSuccess={handleVerificationSubmit}
      />
    </DashboardLayout>
  );
};

export default Dashboard; 