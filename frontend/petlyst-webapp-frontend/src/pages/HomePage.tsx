import React, { useState } from 'react';
import AuthModal from '../components/modals/AuthModal';

const HomePage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleForgotPassword = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 overflow-hidden">
      {/* Hero Section with Background Image */}
      <div className="relative mb-16 min-h-[580px]">
        {/* Background Image Container */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-lg">
          <img 
            src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-enterprise-image.png" 
            alt="Pet Care" 
            className="w-full h-full object-cover object-center"
          />
          {/* Slight overlay for better text readability */}
          <div className="absolute inset-0 bg-blue-900/30"></div>
        </div>
        
        {/* Content Container - positioned above the background */}
        <div className="relative z-10 text-left py-20 px-8 md:px-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 text-shadow-sm drop-shadow-lg">
              The Digital Bridge <br />for Better Veterinary Care
            </h1>
            
            {/* Short description */}
            <p className="text-xl text-white mb-4 text-shadow-sm leading-relaxed">
              Petlyst connects veterinary professionals to <br /> smarter tools, stronger workflows, and client relationships
            </p>
            <p className="text-xl text-white mb-12 font-semibold bg-blue-500/30 px-4 py-2 rounded inline-block shadow-sm">
              all through one seamless digital platform.
            </p>
          </div>

          {/* Four cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 mx-auto px-2">
            {/* Card 1 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 transform transition-transform hover:scale-105">
              <div className="text-blue-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Workflow</h3>
              <p className="text-sm text-gray-700">Streamline operations with smart scheduling and reporting tools.</p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 transform transition-transform hover:scale-105">
              <div className="text-blue-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Communication</h3>
              <p className="text-sm text-gray-700">Secure client communication with encrypted chats and video calls.</p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 transform transition-transform hover:scale-105">
              <div className="text-blue-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data-Driven Insights</h3>
              <p className="text-sm text-gray-700">Power decisions with analytics and custom dashboards.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 transform transition-transform hover:scale-105">
              <div className="text-blue-600 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Client-Centered Experience</h3>
              <p className="text-sm text-gray-700">Enhance client experience with easy booking and personalized care.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onForgotPassword={handleForgotPassword}
      />
    </div>
  );
};

export default HomePage; 