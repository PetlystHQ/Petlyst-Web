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
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  steps,
  currentStep,
  handleGoToStep,
  loading
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
      case 'tax_registration':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="hidden md:block bg-white py-6 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-12">
        <div className="flex items-center justify-evenly space-x-4">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            return (
              <React.Fragment key={step.id}>
                {/* Step indicator box with text and icon */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleGoToStep(step.id)}
                    disabled={loading || index > currentStepIndex}
                    className={`w-[150px] h-10 rounded shadow-sm flex items-center justify-center transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white ring-1 ring-blue-100'
                        : isCompleted
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-500 border border-gray-300'
                    }`}
                  >
                    <div className={`${isActive || isCompleted ? 'text-white' : 'text-gray-400'} mr-2`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        getStepIcon(step.id)
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {step.title}
                    </span>
                  </button>
                </div>
                
                {/* Connector between steps */}
                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center">
                    <svg 
                      className={`w-5 h-5 ${
                        isCompleted ? 'text-blue-500' : 'text-gray-300'
                      } transition-colors duration-200`}
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        d="M9 6l6 6-6 6" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 