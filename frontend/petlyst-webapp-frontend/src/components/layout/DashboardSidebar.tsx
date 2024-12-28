import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { DashboardView, VerificationStatus } from '../../types/dashboard';
import { DASHBOARD_VIEWS } from '../../constants/dashboard';

interface DashboardSidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  verificationStatus: VerificationStatus;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  currentView, 
  onViewChange,
  verificationStatus 
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const isActive = (view: DashboardView) => currentView === view;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
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

  return (
    <div className="w-64 bg-white shadow-md flex flex-col h-screen">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-2xl font-semibold text-blue-600">
              {user?.name?.[0]?.toUpperCase()}{user?.surname?.[0]?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            {user?.name} {user?.surname}
          </h2>
          {getVerificationStatusDisplay()}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          <li>
            <button
              onClick={() => onViewChange(DASHBOARD_VIEWS.overview)}
              className={`flex items-center w-full p-2 text-gray-900 rounded-lg hover:bg-gray-100 ${
                isActive(DASHBOARD_VIEWS.overview) ? 'bg-gray-100' : ''
              }`}
            >
              <span className="ml-3">Overview</span>
            </button>
          </li>

          {/* Conditional Navigation Items */}
          {isFeatureAccessible && (
            <li>
              <button
                onClick={() => onViewChange(DASHBOARD_VIEWS.clinics)}
                className={`flex items-center w-full p-2 text-gray-900 rounded-lg hover:bg-gray-100 ${
                  isActive(DASHBOARD_VIEWS.clinics) ? 'bg-gray-100' : ''
                }`}
              >
                <span className="ml-3">Clinics</span>
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
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
    </div>
  );
};

export default DashboardSidebar; 