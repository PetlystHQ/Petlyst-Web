import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { logout, setProfileVisibility } from '../../store/slices/authSlice';
import { DashboardView, VerificationStatus } from '../../types/dashboard';
import { DASHBOARD_VIEWS, API_ENDPOINTS } from '../../constants/dashboard';
import axios from 'axios';

interface DashboardSidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  verificationStatus: VerificationStatus;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  currentView, 
  onViewChange,
  verificationStatus,
  isMobileOpen = false,
  onMobileToggle
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector(state => state.auth);
  const isActive = (view: DashboardView) => currentView === view;
  const [loggingOut, setLoggingOut] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [isUpdatingProfileVisibility, setIsUpdatingProfileVisibility] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<boolean | null>(null);

  useEffect(() => {
    // Load profile visibility status
    const fetchProfileVisibility = async () => {
      try {
        console.log('Fetching profile visibility status...');
        // Use API_ENDPOINTS instead of hardcoded URL
        const response = await axios.get(API_ENDPOINTS.PROFILE_VISIBILITY, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Profile visibility status:', response.data);
        const isPublic = response.data.is_profile_public;
        setIsProfilePublic(isPublic);
        // Also update Redux store when loading initial visibility
        dispatch(setProfileVisibility(isPublic));
      } catch (error) {
        console.error('Error fetching profile visibility status:', error);
      }
    };

    if (user?.user_type === 'veterinarian' && token) {
      fetchProfileVisibility();
    }
  }, [user, token, dispatch]);

  const handleLogout = () => {
    setLoggingOut(true);
    dispatch(logout());
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const handleToggleClick = () => {
    const newVisibility = !isProfilePublic;
    setPendingVisibilityChange(newVisibility);
    setShowConfirmModal(true);
  };

  const confirmVisibilityChange = async () => {
    try {
      setIsUpdatingProfileVisibility(true);
      const newVisibility = pendingVisibilityChange;
      
      console.log('Trying to update profile visibility to:', newVisibility);
      
      // Hardcoded URL, kesin çalışacak şekilde
      const response = await axios.put('http://localhost:3000/api/veterinarian/profile-visibility', {
        is_profile_public: newVisibility
      }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Profile visibility update response:', response.data);

      if (response.status === 200) {
        setIsProfilePublic(!!newVisibility);
        // Immediately update Redux store
        dispatch(setProfileVisibility(!!newVisibility));
        console.log('Profile visibility updated successfully to:', newVisibility);
      }
    } catch (error) {
      console.error('Error updating profile visibility:', error);
    } finally {
      setIsUpdatingProfileVisibility(false);
      setShowConfirmModal(false);
      setPendingVisibilityChange(null);
    }
  };

  const cancelVisibilityChange = () => {
    setShowConfirmModal(false);
    setPendingVisibilityChange(null);
  };

  const isFeatureAccessible = verificationStatus === 'verified';

  const getVerificationStatusDisplay = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <span className="mt-1 text-sm text-green-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Verified Veterinarian
          </span>
        );
      case 'pending':
        return (
          <span className="mt-1 text-sm text-blue-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Verification Pending
          </span>
        );
      default:
        return (
          <span className="mt-1 text-sm text-yellow-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Unverified Account
          </span>
        );
    }
  };

  // Apply classes based on mobile state - adding !important to force the position in mobile view
  const sidebarClasses = `bg-white shadow-md flex flex-col h-full min-h-screen fixed lg:sticky lg:top-0 z-20 transition-all duration-300 ${
    isMobileOpen ? 'left-0 !w-64' : '-left-64 lg:left-0 w-64'
  }`;

  // Ensuring direct access to the toggle function
  const handleMobileToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile toggle button clicked');
    if (onMobileToggle) {
      onMobileToggle();
      console.log('Mobile menu toggle handler called, new state should be:', !isMobileOpen);
    } else {
      console.error('Mobile toggle function is not defined');
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button - Visible only on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow-sm h-16 px-4 flex items-center">
        <button 
          onClick={handleMobileToggle}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle menu"
          type="button"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6"
          >
            {isMobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-800">Dashboard</h1>
      </div>

      {/* Overlay for mobile - only visible when sidebar is open on mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={handleMobileToggle}
        ></div>
      )}

      <div className={sidebarClasses}>
        {/* Profile Section */}
        <div className="p-6 border-b border-gray-200 mt-16 lg:mt-0">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl sm:text-2xl font-semibold text-blue-600">
                {user?.name?.[0]?.toUpperCase()}{user?.surname?.[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              {user?.name} {user?.surname}
            </h2>
            {getVerificationStatusDisplay()}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 overflow-y-auto flex flex-col">
          <ul className="space-y-2 font-medium flex-grow">
            <li>
              <button
                onClick={() => {
                  onViewChange(DASHBOARD_VIEWS.overview);
                  if (isMobileOpen && onMobileToggle) onMobileToggle();
                }}
                className={`flex items-center w-full p-2 text-gray-900 rounded-lg hover:bg-gray-100 ${
                  isActive(DASHBOARD_VIEWS.overview) ? 'bg-gray-100' : ''
                }`}
              >
                <span className="ml-3">Overview</span>
              </button>
            </li>

            {/* My Profile - Always accessible */}
            <li>
              <button
                onClick={() => {
                  console.log('Profile button clicked, changing view to:', DASHBOARD_VIEWS.profile);
                  onViewChange(DASHBOARD_VIEWS.profile);
                  if (isMobileOpen && onMobileToggle) onMobileToggle();
                }}
                className={`flex items-center w-full p-2 text-gray-900 rounded-lg hover:bg-gray-100 ${
                  isActive(DASHBOARD_VIEWS.profile) ? 'bg-gray-100' : ''
                }`}
              >
                <span className="ml-3">My Profile</span>
              </button>
            </li>

            {/* Conditional Navigation Items - Only for verified users */}
            {isFeatureAccessible && (
              <li>
                <button
                  onClick={() => {
                    onViewChange(DASHBOARD_VIEWS.clinics);
                    if (isMobileOpen && onMobileToggle) onMobileToggle();
                  }}
                  className={`flex items-center w-full p-2 text-gray-900 rounded-lg hover:bg-gray-100 ${
                    isActive(DASHBOARD_VIEWS.clinics) ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="ml-3">My Clinic</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Profile Visibility Toggle - before logout */}
        {user?.user_type === 'veterinarian' && (
          <div className="px-4 pb-2 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Profile Visibility</span>
              <button 
                onClick={handleToggleClick}
                disabled={isUpdatingProfileVisibility}
                className="relative inline-flex items-center h-5 rounded-full w-9 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-pressed={isProfilePublic}
                aria-label="Toggle profile visibility"
              >
                <span className={`${isProfilePublic ? 'bg-blue-600' : 'bg-gray-300'} absolute h-5 w-9 mx-auto rounded-full transition-colors duration-200 ease-in-out`}></span>
                <span className={`${isProfilePublic ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isUpdatingProfileVisibility ? 'opacity-60' : ''}`}></span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              {isProfilePublic ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Public
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  Private
                </>
              )}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 text-red-600 rounded-lg hover:bg-red-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {loggingOut && (
          <div className="flex items-center">
            <div className="w-4 h-4 relative mr-1">
              <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin"></div>
            </div>
            <span>Logging out...</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-xl transform transition-all duration-300 scale-100">
            <div className="flex items-center mb-4">
              {pendingVisibilityChange ? (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">Confirm Profile Visibility Change</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
              <p className="text-gray-600">
                {pendingVisibilityChange ? (
                  <span className="flex flex-col space-y-2">
                    <span className="font-medium text-blue-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Making your profile public
                    </span>
                    <span>Your profile information will be visible to all users, including:</span>
                    <ul className="list-disc ml-5 text-sm">
                      <li>Your education history</li>
                      <li>Your certifications</li>
                      <li>Your areas of expertise</li>
                      <li>Your profile photos</li>
                    </ul>
                  </span>
                ) : (
                  <span className="flex flex-col space-y-2">
                    <span className="font-medium text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Making your profile private
                    </span>
                    <span>Your profile will only be visible to you. Other users will not be able to see your professional information.</span>
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelVisibilityChange}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={confirmVisibilityChange}
                className={`px-4 py-2 ${pendingVisibilityChange ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-md flex items-center transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar; 