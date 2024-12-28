import React from 'react';
import { Clinic } from '../../../types/dashboard';

interface ClinicsProps {
  clinics?: Clinic[];
  isLoading?: boolean;
  onAddClinic?: () => void;
  onEditClinic?: (clinic: Clinic) => void;
  onViewClinicDetails?: (clinic: Clinic) => void;
}

export const Clinics: React.FC<ClinicsProps> = ({
  clinics = [],
  isLoading,
  onAddClinic,
  onEditClinic,
  onViewClinicDetails
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="min-h-[400px]">
        <div 
          onClick={onAddClinic}
          className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group max-w-md"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Add Your First Clinic</h3>
          <p className="text-sm text-gray-500 text-center mb-4 group-hover:text-blue-600">
            Start managing your veterinary practice by adding your clinic details
          </p>
          <div className="flex items-center text-sm text-blue-600">
            <span>Get Started</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clinics.map(clinic => (
        <div key={clinic.id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
              <p className="text-sm text-gray-600">{clinic.address}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              clinic.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {clinic.status}
            </span>
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Working Hours:</span> {clinic.workingHours}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Phone:</span> {clinic.phone}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEditClinic?.(clinic)}
              className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onViewClinicDetails?.(clinic)}
              className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 