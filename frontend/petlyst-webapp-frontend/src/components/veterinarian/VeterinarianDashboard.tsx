import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { DashboardView, VerificationStatus, Clinic } from '../../types/dashboard';
import { DASHBOARD_VIEWS, API_ENDPOINTS } from '../../constants/dashboard';
import DashboardLayout from '../layout/DashboardLayout';
import VeterinarianProfile from './VeterinarianProfile';

interface ClinicsListProps {
  clinics: Clinic[];
  loading: boolean;
  error: string | null;
}

const ClinicsList: React.FC<ClinicsListProps> = ({ clinics, loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">My Clinics</h2>
        {clinics.length === 0 && (
          <button
            onClick={() => navigate('/add-clinic')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Clinic
          </button>
        )}
      </div>

      {clinics.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Clinics Added Yet</h3>
          <p className="text-gray-600 mb-4">Add your clinic to manage your veterinary practice effectively.</p>
          <button
            onClick={() => navigate('/add-clinic')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Clinic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clinics.map((clinic) => (
            <div key={clinic.clinic_id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{clinic.clinic_name}</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    {clinic.clinic_address && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{clinic.clinic_address}</span>
                      </div>
                    )}
                    {clinic.clinic_phone_number && (
                      <div className="flex items-center mt-1">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{clinic.clinic_phone_number}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      clinic.clinic_verification_status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : clinic.clinic_verification_status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {clinic.clinic_verification_status === 'verified' 
                        ? 'Verified' 
                        : clinic.clinic_verification_status === 'pending' 
                          ? 'Pending Verification' 
                          : 'Not Verified'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => navigate(`/clinic/${clinic.clinic_id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Clinic
                  </button>
                  <button
                    onClick={() => navigate(`/edit-clinic/${clinic.clinic_id}`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium inline-flex items-center justify-center border border-gray-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Clinic
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VeterinarianDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>(DASHBOARD_VIEWS.overview);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [incompleteClinics, setIncompleteClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, token } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchVerificationStatus();
    
    // Check if we need to activate a specific view from location state
    if (location.state && location.state.viewToActivate) {
      setCurrentView(location.state.viewToActivate);
      // Clear the state to prevent it from persisting on refresh
      window.history.replaceState({}, document.title);
    }
    // fetchVerificationStatus is in-component; adding it would loop.
     
  }, [token, navigate, location]);

  useEffect(() => {
    if (verificationStatus === 'verified') {
      fetchClinics();
      fetchIncompleteClinics();
    }
    // fetchClinics / fetchIncompleteClinics are in-component; adding them
    // would loop.
     
  }, [verificationStatus, token]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.VERIFICATION_STATUS);
      
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
      const response = await axiosInstance.get(API_ENDPOINTS.CLINICS);
      
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
      const response = await axiosInstance.get(API_ENDPOINTS.INCOMPLETE_CLINICS);
      
      setIncompleteClinics(response.data.clinics);
    } catch (err) {
      console.error('Error fetching incomplete clinics:', err);
    }
  };

  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view);
  };

  useEffect(() => {
  }, [currentView]);

  const renderDashboardContent = () => {
    // Explicitly log the current view to debug
    
    if (currentView === DASHBOARD_VIEWS.clinics) {
      return <ClinicsList clinics={clinics} loading={loading} error={error} />;
    }
    
    if (currentView === DASHBOARD_VIEWS.profile) {
      return <VeterinarianProfile />;
    }
    
    // Default to overview
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Welcome to Your Dashboard</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
            </div>
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