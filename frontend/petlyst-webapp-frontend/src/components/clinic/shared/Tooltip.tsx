import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  text, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const getPositionClasses = () => {
    switch(position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };
  
  // Determine the arrow position based on tooltip position
  const getArrowClasses = () => {
    switch(position) {
      case 'top':
        return 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800';
      case 'bottom':
        return 'top-[-5px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800';
      case 'left':
        return 'right-[-5px] top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800';
      case 'right':
        return 'left-[-5px] top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800';
      default:
        return 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800';
    }
  };
  
  return (
    <div 
      className="inline-block relative ml-1 cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="flex items-center justify-center w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors duration-200">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-3.5 w-3.5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      
      {isVisible && (
        <div className={`absolute z-10 w-60 px-3 py-2 bg-gray-800 text-xs text-white rounded-md shadow-lg transition-opacity duration-200 ${getPositionClasses()}`}>
          {text}
          <div className={`absolute w-0 h-0 ${getArrowClasses()}`}></div>
        </div>
      )}
    </div>
  );
}; 