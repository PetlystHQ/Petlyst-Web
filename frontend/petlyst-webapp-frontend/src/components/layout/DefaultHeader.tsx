import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import AuthModal from '../../components/modals/AuthModal';
import ResetPasswordModal from '../../components/modals/ResetPasswordModal';

const DefaultHeader: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isPetOwnerPage = location.pathname === '/pet-owner-home';

  // Debug log to check user data
  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
      console.log('User type:', user.user_type);
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
  };

  const handleForgotPassword = () => {
    setIsAuthModalOpen(false);
    setIsResetPasswordModalOpen(true);
  };

  const handleBackToLogin = () => {
    setIsResetPasswordModalOpen(false);
    setIsAuthModalOpen(true);
  };

  // Function to get initials from name and surname
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
              <img 
                src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
                alt="Petlyst Logo" 
                className="h-8 w-auto"
              />
                <span className="text-2xl font-bold text-blue-600">Petlyst</span>
              </Link>
              {!isPetOwnerPage && (
                <div className="ml-4 flex items-center">
                  <span className="text-base font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-md border-l-4 border-blue-600 shadow-sm">
                    Enterprise
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative flex items-center">
                  {isPetOwnerPage ? (
                    <Link to="/" className="mr-6 px-4 py-1.5 bg-white border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium flex items-center" title="Go to Enterprise Page">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7"></path>
                      </svg>
                      Petlyst Enterprise
                    </Link>
                  ) : (
                    <Link to="/pet-owner-home" className="mr-6 px-4 py-1.5 bg-white border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium flex items-center" title="Go to Pet Owner Page">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7"></path>
                      </svg>
                      Petlyst Community
                    </Link>
                  )}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 focus:outline-none group"
                  >
                    <span className="text-gray-700">Hello, {user.name}</span>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium group-hover:bg-blue-700 transition-colors">
                      {getInitials(user.name, user.surname)}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                      {user.user_type === 'veterinarian' && (
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onForgotPassword={handleForgotPassword}
      />
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onBackToLogin={handleBackToLogin}
      />
    </>
  );
};

export default DefaultHeader;
