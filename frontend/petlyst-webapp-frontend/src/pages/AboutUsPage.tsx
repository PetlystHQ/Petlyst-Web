import React, { useState } from 'react';
import AuthModal from '../components/modals/AuthModal';
import { useAppSelector } from '../hooks/useAppSelector';

const AboutUsPage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleForgotPassword = () => {
    // Forgot password işlemi burada yapılacak
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About Us</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover the story behind Petlyst and our mission to connect pet owners with quality veterinary care.
        </p>
      </div>

      {/* Hero Image Section */}
      <div className="mb-16 max-w-5xl mx-auto">
        <div className="relative rounded-xl overflow-hidden shadow-xl h-[400px]">
          <img 
            src="https://d2j5evtsf6ql1v.cloudfront.net/petlyst-hero-team.jpg" 
            alt="Petlyst Team" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8">
            <h2 className="text-2xl font-bold text-white">The Petlyst Team</h2>
            <p className="text-white/90">Passionate about pets, committed to their care</p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
        <div className="prose prose-lg max-w-none">
          <p>
            Petlyst was born from a simple question: "Why is it so difficult to find the right veterinary care for our beloved pets?" 
            As pet owners ourselves, we encountered the frustration of searching through scattered information, unreliable reviews, 
            and limited options when looking for quality care for our furry family members.
            <br></br>
            <br></br>
            Founded in 2024, our team came together with 
            a shared vision - to create a platform that seamlessly connects pet owners with trusted veterinary clinics and professionals, 
            making pet healthcare more accessible, transparent, and efficient.
          </p>
        </div>
      </div>

      {/* What Sets Us Apart Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">What Sets Us Apart</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Quality</h3>
            <p>We carefully inspect all veterinary clinics and professionals on our platform to ensure they meet our high standards of care and service.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Comprehensive Options</h3>
            <p>From routine check-ups to specialized treatments, our platform covers a wide range of veterinary services to meet all your pet care needs.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Informed Decisions</h3>
            <p>Transparent reviews, detailed clinic profiles, and comprehensive service information empower you to make the best choices for your pet.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Convenience First</h3>
            <p>Our user-friendly platform makes it easy to find, book, and manage veterinary appointments, saving you time and reducing stress.</p>
          </div>
        </div>
      </div>

      {/* Join Us CTA - Sadece giriş yapmayan kullanıcılara göster */}
      {!user && (
      <div className="max-w-4xl mx-auto mb-16 bg-[#458AB5] bg-opacity-90 text-white p-10 rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Join Us in Our Mission</h2>
        <p className="text-lg mb-6">
          Whether you're a pet owner seeking quality care or a veterinary professional looking to reach more patients,
          Petlyst is your trusted partner in the journey of pet healthcare.
        </p>
        <button 
          className="bg-white text-blue-600 px-8 py-3 rounded-full font-medium hover:bg-blue-100 hover:bg-blue-500 hover:text-white transition-colors"
          onClick={handleOpenAuthModal}
        >
          Get Started Today
        </button>
      </div>
      )}

      {/* Footer */}
      <div className="max-w-4xl mx-auto pt-8 border-t border-gray-200 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Petlyst. All rights reserved.</p>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal} 
        onForgotPassword={handleForgotPassword}
        initialTab="register"
      />
    </div>
  );
};

export default AboutUsPage; 