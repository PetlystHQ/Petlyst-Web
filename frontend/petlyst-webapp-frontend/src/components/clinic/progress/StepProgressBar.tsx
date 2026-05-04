import React from 'react';
import { FormStep } from '../../../types/clinic';

interface Step {
  id: FormStep;
  title: string;
}

interface StepProgressBarProps {
  steps: Step[];
  currentStep: FormStep;
  handleGoToStep: (stepId: FormStep) => void;
  loading: boolean;
  handleBackToDashboard: () => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  steps,
  currentStep,
  handleGoToStep,
  loading,
  handleBackToDashboard
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Icons for each step type
  const getStepIcon = (stepId: FormStep) => {
    switch(stepId) {
      case 'clinic_details':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'locations':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'communication':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'visuals':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'services':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'appointments':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'tax_registration':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="hidden md:flex bg-white border-r border-gray-200 fixed left-0 top-0 h-full w-60 overflow-y-auto flex-col">
      {/* Logo Section at top */}
      <div className="pt-8 pb-6 px-4 border-b border-gray-200 bg-gray-50">
        <div className="text-center">
          <img 
            src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
            alt="Petlyst Logo" 
            className="h-14 w-auto mx-auto mb-3"
          />
          <h1 className="text-xl font-semibold text-gray-800">Petlyst</h1>
          <p className="text-xs text-gray-500 mt-1">Clinic Submission Page</p>
        </div>
      </div>
      
      {/* Steps in the middle */}
      <div className="flex-grow flex items-center">
        <div className="flex flex-col space-y-3 px-4 w-full">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleGoToStep(step.id)}
                disabled={loading || index > currentStepIndex}
                className={`w-full h-14 rounded shadow-sm flex items-center px-4 transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white ring-1 ring-blue-100'
                    : isCompleted
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-500 border border-gray-300'
                }`}
              >
                <div className={`${isActive || isCompleted ? 'text-white' : 'text-gray-400'} mr-3`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    getStepIcon(step.id)
                  )}
                </div>
                <span className="text-sm font-medium">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Dashboard button at bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleBackToDashboard}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}; 