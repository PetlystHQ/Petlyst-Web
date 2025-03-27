import React, { useState, ReactNode, useEffect } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { DashboardView, VerificationStatus } from '../../types/dashboard';

interface DashboardLayoutProps {
  children: ReactNode;
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  verificationStatus: VerificationStatus;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  verificationStatus
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Enhanced toggle function with strict state management
  const toggleMobileMenu = () => {
    console.log('DashboardLayout toggle called, current state:', isMobileMenuOpen);
    
    // Force a state update with the functional form
    setIsMobileMenuOpen((prevState) => {
      const newState = !prevState;
      console.log('New mobile menu state in DashboardLayout:', newState);
      return newState;
    });
  };

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Mobile menu state changed in DashboardLayout:', isMobileMenuOpen);
    
    // If sidebar is open, add a class to prevent body scrolling
    if (isMobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen h-screen bg-gray-100 overflow-hidden">
      <DashboardSidebar 
        currentView={currentView}
        onViewChange={onViewChange}
        verificationStatus={verificationStatus}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={toggleMobileMenu}
      />
      
      <main 
        className={`flex-1 p-4 pt-20 lg:pt-4 transition-all duration-300 overflow-y-auto ${
          isMobileMenuOpen ? 'opacity-50 lg:opacity-100' : ''
        } lg:ml-0`}
        onClick={() => {
          if (isMobileMenuOpen) {
            toggleMobileMenu();
          }
        }}
      >
        {/* Page Content */}
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 