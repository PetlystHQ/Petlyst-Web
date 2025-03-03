import React from 'react';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => (
  <div className="group relative ml-2 inline-block">
    <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute z-10 w-48 p-2 bg-gray-800 text-xs text-white rounded shadow-lg opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 transition-opacity duration-300 pointer-events-none">
      {text}
      <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
    </div>
  </div>
); 