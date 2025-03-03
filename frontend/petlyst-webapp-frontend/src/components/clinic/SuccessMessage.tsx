import React from 'react';

interface SuccessMessageProps {
  handleBackToDashboard: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ handleBackToDashboard }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img 
              src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
              alt="Petlyst Logo" 
              className="h-8 w-auto"
          />
          <span className="ml-3 text-xl font-semibold text-gray-800">Petlyst</span>
        </div>
        <button
          onClick={handleBackToDashboard}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </header>
      
      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto my-8 p-6 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Clinic Added Successfully!</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your clinic has been added and is pending verification.
            </p>
            <button
              onClick={handleBackToDashboard}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 