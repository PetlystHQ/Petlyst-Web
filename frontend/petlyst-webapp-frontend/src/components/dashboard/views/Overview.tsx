import React, { useMemo, useEffect, useState } from 'react';
import { DASHBOARD_VIEWS } from '../../../constants/dashboard';
import { DashboardView, Clinic } from '../../../types/dashboard';
import ViewProfileButton from '../../veterinarian/ViewProfileButton';
import ProfileCompletionCard from '../../veterinarian/ProfileCompletionCard';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { useNavigate } from 'react-router-dom';

interface OverviewProps {
  verificationStatus: string | null;
  onVerify: () => void;
  isLoading?: boolean;
  onAddClinic?: () => void;
  onViewChange?: (view: DashboardView) => void;
  hasSubmittedClinics?: boolean;
  isUpdating?: boolean;
  hasApprovedClinic?: boolean;
  firstClinic?: Clinic | null;
}

export const Overview: React.FC<OverviewProps> = ({ 
  verificationStatus, 
  onVerify, 
  isLoading, 
  onAddClinic, 
  onViewChange, 
  hasSubmittedClinics = false, 
  isUpdating, 
  hasApprovedClinic = false,
  firstClinic = null
}) => {
  // Force re-render when auth state changes (including any profile updates)
  const auth = useAppSelector(state => state.auth);
  const { profileVisibility } = auth;
  const [forceLoaded, setForceLoaded] = useState(false);
  const navigate = useNavigate();
  
  // Generate a unique key for ViewProfileButton each time profileVisibility changes
  const profileButtonKey = useMemo(() => `profile-button-${profileVisibility}-${Date.now()}`, [profileVisibility]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    console.log('Overview loading state:', isLoading);
    
    // If loading takes too long, force content to display after 5 seconds
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing content to display');
        setForceLoaded(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Get status badge for clinic
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Active
          </span>
        );
      case 'archived':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            Archive
          </span>
        );
      case 'not_verified':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending Admin Approval
          </span>
        );
    }
  };

  // Show the content if either loading is complete or the force timeout has occurred
  if (isLoading && !forceLoaded) {
    console.log('Showing loading spinner in Overview');
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  console.log('Rendering Overview content, verification status:', verificationStatus);
  return (
    <div className="space-y-6">
      {/* Verification Status Messages - conditionally rendered */}
      {verificationStatus === 'pending' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Verification In Progress</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your verification request is being reviewed. This process may take up to 24 hours.</p>
                <ul className="list-disc list-inside mt-2">
                  <li>We will notify you once the review is complete</li>
                  <li>You can continue using basic features while waiting</li>
                  <li>Additional features will be unlocked upon approval</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {verificationStatus !== 'verified' && verificationStatus !== 'pending' && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Account Verification Required</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>Your account needs to be verified to access the following features:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Managing clinic information</li>
                  <li>Accepting appointments</li>
                  <li>Managing patient records</li>
                  <li>Scheduling availability</li>
                </ul>
              </div>
              <div className="mt-4">
                <button
                  onClick={onVerify}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Verify Your Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clinic Card - Koşullu olarak gösteriliyor */}
      {verificationStatus === 'verified' && !hasSubmittedClinics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">Welcome to Your Dashboard</h2>
                
                {/* Veterinerin onaylanmış klinik ilişkisi varsa */}
                {hasApprovedClinic ? (
                  <div className="mt-4">
                    <p className="text-gray-600">
                      Your account is successfully linked to a clinic. You can now manage your veterinary practice and access all features.
                    </p>
                    <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-100">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">
                            You're all set! Explore your dashboard to manage appointments, patients, and your profile.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Veterinerin onaylanmış klinik ilişkisi yoksa */
                  <>
                    <p className="mt-2 text-gray-600">Ready to start managing your veterinary practice?</p>
                    <div className="mt-6 flex items-center space-x-4">
                      <button
                        onClick={() => {
                          onViewChange?.(DASHBOARD_VIEWS.clinics);
                          setTimeout(() => {
                            onAddClinic?.();
                          }, 100);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add Your Clinic
                        <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          // İlk önce profil görünümüne geçiş yapacak
                          onViewChange?.(DASHBOARD_VIEWS.profile);
                          // Sonra clinics sekmesini seçecek
                          localStorage.setItem('selectedProfileTab', 'clinics');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-blue-500 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Join Existing Clinic
                        <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-500 hidden md:inline-block">Get started in just a few minutes</span>
                    </div>
                  </>
                )}
              </div>
              <div className="hidden md:block">
                <svg className="w-32 h-32 text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-8 py-4">
            <div className="text-sm">
              <span className="text-gray-500">Need help? </span>
              <a href="#" className="text-blue-600 hover:text-blue-500">We feel your pain. That's it, though.</a>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Klinik Kartı - Kullanıcının kliniği varsa gösterilecek */}
      {firstClinic && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Clinic</h2>
              {getStatusBadge(firstClinic.clinic_verification_status)}
            </div>

            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{firstClinic.clinic_name}</h3>
              </div>
            </div>

            {/* Status Information Banner */}
            {firstClinic.clinic_verification_status === 'pending' && (
              <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Your clinic registration is being reviewed by administrators
                    </p>
                  </div>
                </div>
              </div>
            )}

            {firstClinic.clinic_verification_status === 'not_verified' && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Your clinic verification was not successful. Please update your information.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
            
            <div className="flex flex-wrap gap-3">
              {/* Manage Clinic Button - Only for verified and archived clinics */}
              {(firstClinic.clinic_verification_status === 'verified' || firstClinic.clinic_verification_status === 'archived') && (
                <button
                  onClick={() => {
                    localStorage.setItem('selectedClinicId', firstClinic.clinic_id);
                    navigate('/management-dashboard');
                  }}
                  className="flex items-center justify-center text-sm font-medium px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Clinic
                </button>
              )}
              
              {/* Edit Clinic Button */}
              <button
                onClick={() => navigate(`/edit-clinic/${firstClinic.clinic_id}`)}
                className="flex items-center justify-center text-sm font-medium px-4 py-2 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {firstClinic.clinic_verification_status === 'verified' ? 'Edit Clinic' : 'Edit Submission'}
              </button>
              
              {/* View Submission/Clinic Button */}
              <button
                onClick={() => {
                  const clinicId = firstClinic.clinic_id;
                  navigate(`/clinics/${clinicId}`);
                }}
                className="flex items-center justify-center text-sm font-medium px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Clinic Page
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Completion Card - shows missing profile sections (visible regardless of verification) */}
      <ProfileCompletionCard className="mb-4" onViewChange={onViewChange} />
      
      {/* Video Conference Card - only visible for verified veterinarians */}
      {verificationStatus === 'verified' && (
        <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Video Conference</h3>
                <p className="mt-1 text-sm text-purple-600">Start or join a video meeting with pet owners using Jitsi Meet</p>
              </div>
              <div className="hidden md:block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => window.open('https://meet.jit.si/PetlystVeterinarianMeeting', '_blank')}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Jitsi Meeting
            </button>
          </div>
        </div>
      )}
      
      {/* View Profile Button - visible regardless of verification status */}
      <ViewProfileButton 
        className="mt-4" 
        forceRefresh={true} 
        key={profileButtonKey} 
      />

      {isUpdating && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="w-6 h-6 relative">
            <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  );
}; 