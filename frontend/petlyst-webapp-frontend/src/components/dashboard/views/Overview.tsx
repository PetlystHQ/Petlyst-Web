import React from 'react';
import { DASHBOARD_VIEWS } from '../../../constants/dashboard';
import { DashboardView } from '../../../types/dashboard';

interface OverviewProps {
  verificationStatus: string | null;
  onVerify: () => void;
  isLoading?: boolean;
  onAddClinic?: () => void;
  onViewChange?: (view: DashboardView) => void;
  hasSubmittedClinics?: boolean;
  isUpdating?: boolean;
}

export const Overview: React.FC<OverviewProps> = ({ verificationStatus, onVerify, isLoading, onAddClinic, onViewChange, hasSubmittedClinics = false, isUpdating }) => {

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  if (verificationStatus !== 'verified') {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasSubmittedClinics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">Welcome to Your Dashboard</h2>
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
                  <span className="text-sm text-gray-500">Get started in just a few minutes</span>
                </div>
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