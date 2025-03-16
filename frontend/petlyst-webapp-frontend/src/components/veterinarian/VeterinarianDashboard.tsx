import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { DashboardView, VerificationStatus, Clinic } from '../../types/dashboard';
import { DASHBOARD_VIEWS, API_ENDPOINTS } from '../../constants/dashboard';
import DashboardLayout from '../layout/DashboardLayout';
import ClinicsList from './ClinicsList';
import VideoConferenceButton from './VideoConferenceButton';

const VeterinarianDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>(DASHBOARD_VIEWS.overview);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [incompleteClinics, setIncompleteClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, token } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchVerificationStatus();
  }, [token, navigate]);

  useEffect(() => {
    if (verificationStatus === 'verified') {
      fetchClinics();
      fetchIncompleteClinics();
    }
  }, [verificationStatus, token]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.VERIFICATION_STATUS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setVerificationStatus(response.data.status);
    } catch (err) {
      setError('Failed to fetch verification status');
      console.error('Error fetching verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.CLINICS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setClinics(response.data.clinics);
    } catch (err) {
      setError('Failed to fetch clinics');
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncompleteClinics = async () => {
    try {
      console.log('Fetching incomplete clinics from:', API_ENDPOINTS.INCOMPLETE_CLINICS);
      const response = await axios.get(API_ENDPOINTS.INCOMPLETE_CLINICS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Incomplete clinics response:', response.data);
      setIncompleteClinics(response.data.clinics);
    } catch (err) {
      console.error('Error fetching incomplete clinics:', err);
    }
  };

  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view);
  };

  const renderDashboardContent = () => {
    switch (currentView) {
      case DASHBOARD_VIEWS.clinics:
        return <ClinicsList clinics={clinics} loading={loading} error={error} />;
      case DASHBOARD_VIEWS.overview:
      default:
        return (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Welcome to Your Dashboard</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Incomplete Clinics Warning */}
                {incompleteClinics.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Incomplete Clinic Submissions</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>You have {incompleteClinics.length} incomplete clinic submission{incompleteClinics.length > 1 ? 's' : ''}.</p>
                          <div className="mt-2">
                            {incompleteClinics.map(clinic => (
                              <div key={clinic.clinic_id} className="flex items-center justify-between">
                                <span>{clinic.clinic_name}</span>
                                <button
                                  onClick={() => navigate(`/add-clinic?clinicId=${clinic.clinic_id}`)}
                                  className="text-sm text-yellow-700 hover:text-yellow-800 underline"
                                >
                                  Continue
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Status Section */}
                <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-800 mb-2">Account Status</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-sm sm:text-base">
                      <span className="font-medium">Verification Status:</span>
                    </div>
                    <div>
                      {verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      ) : verificationStatus === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {verificationStatus !== 'verified' && (
                    <p className="mt-3 text-sm text-blue-700">
                      {verificationStatus === 'pending' 
                        ? 'Your verification is being processed. You will be notified once it is complete.'
                        : 'Please submit your verification documents to access all features.'}
                    </p>
                  )}
                </div>
                
                {/* Account Information and Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h3>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <span className="text-gray-800">{user?.name} {user?.surname}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <span className="text-gray-800">{user?.email}</span>
                      </div>
                      {user?.phone && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="text-sm font-medium text-gray-500">Phone:</span>
                          <span className="text-gray-800">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-500">Clinic</p>
                        <p className="text-xl font-bold text-gray-800">{clinics.length > 0 ? 1 : 0}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-500">Active</p>
                        <p className="text-xl font-bold text-gray-800">
                          {clinics.filter(c => c.clinic_verification_status === 'verified').length > 0 ? 1 : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Video Conference Section */}
                <VideoConferenceButton className="mt-4" />
                
                {/* Actions Section */}
                {verificationStatus === 'verified' && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-end">
                    <button
                      onClick={() => setCurrentView(DASHBOARD_VIEWS.clinics)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View My Clinic
                    </button>
                    {clinics.length === 0 && (
                      <button
                        onClick={() => navigate('/add-clinic')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Add My Clinic
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      currentView={currentView}
      onViewChange={handleViewChange}
      verificationStatus={verificationStatus}
    >
      {renderDashboardContent()}
    </DashboardLayout>
  );
};

export default VeterinarianDashboard; 