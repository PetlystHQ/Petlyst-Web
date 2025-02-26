import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import DashboardLayout from '../components/layout/DashboardLayout';
import VerificationModal from '../components/modals/VerificationModal';
import EditClinicModal from '../components/modals/EditClinicModal';
import { Overview } from '../components/dashboard/views/Overview';
import { Clinics } from '../components/dashboard/views/Clinics';
import { DashboardView } from '../types/dashboard';
import { DASHBOARD_VIEWS, VIEW_TITLES } from '../constants/dashboard';
import { Clinic } from '../types/dashboard';

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { 
    verificationStatus, 
    isLoading, 
    error, 
    updateVerificationStatus,
    refreshStatus 
  } = useVerificationStatus();
  const navigate = useNavigate();

  const handleAddClinic = () => {
    // Navigate to the add clinic page instead of opening a modal
    navigate('/add-clinic');
  };

  const handleEditClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
  };

  const handleClinicUpdate = () => {
    // Klinik listesini güncelle
    setRefreshKey(prev => prev + 1);
    // Modal'ı kapat
    setSelectedClinic(null);
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
      isLoading,
      onAddClinic: handleAddClinic,
      onViewChange: setCurrentView
    };

    // Only allow access to certain views if verified
    if (verificationStatus !== 'verified' && currentView !== DASHBOARD_VIEWS.overview) {
      return <Overview {...commonProps} />;
    }

    switch (currentView) {
      case DASHBOARD_VIEWS.overview:
        return <Overview {...commonProps} />;
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
      {renderContent()}

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSubmitSuccess={handleVerificationSubmit}
      />

      {selectedClinic && (
        <EditClinicModal
          clinic={selectedClinic}
          isOpen={Boolean(selectedClinic)}
          onClose={() => setSelectedClinic(null)}
          onUpdate={handleClinicUpdate}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard; 