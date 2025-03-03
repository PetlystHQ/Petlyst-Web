import React from 'react';
import { Tooltip } from '../shared/Tooltip';

interface PlaceholderSectionProps {
  title: string;
  subtitle: string;
  tooltipText: string;
}

export const PlaceholderSection: React.FC<PlaceholderSectionProps> = ({
  title,
  subtitle,
  tooltipText
}) => {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <Tooltip text={tooltipText} />
        </div>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>
      
      <div className="bg-gray-50 p-8 rounded-lg border border-dashed border-gray-300 text-center">
        <p className="text-gray-500">{title} content will be implemented in the next phase</p>
      </div>
    </div>
  );
}; 