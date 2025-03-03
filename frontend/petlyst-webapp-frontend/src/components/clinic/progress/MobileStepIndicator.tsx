import React from 'react';
import { FormStep } from '../../../types/clinic';

interface Step {
  id: FormStep;
  title: string;
}

interface MobileStepIndicatorProps {
  steps: Step[];
  currentStep: FormStep;
}

export const MobileStepIndicator: React.FC<MobileStepIndicatorProps> = ({
  steps,
  currentStep
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="md:hidden w-full px-4 py-4 bg-white border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
        <p className="text-sm font-medium text-blue-600">
          {steps[currentStepIndex].title}
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}; 