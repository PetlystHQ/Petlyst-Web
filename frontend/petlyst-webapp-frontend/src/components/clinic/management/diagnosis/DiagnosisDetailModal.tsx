import React from 'react';
import { Diagnosis } from './diagnosisService';
import { format } from 'date-fns';
import { FaTimes, FaEdit, FaCalendarAlt, FaSyringe, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';

interface DiagnosisDetailModalProps {
  diagnosis: Diagnosis;
  onClose: () => void;
  onEdit: (diagnosis: Diagnosis) => void;
}

const DiagnosisDetailModal: React.FC<DiagnosisDetailModalProps> = ({
  diagnosis,
  onClose,
  onEdit,
}) => {
  // Format severity for display
  const formatSeverity = (severity: string | undefined) => {
    if (!severity) return null;
    
    switch (severity) {
      case 'mild':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">Mild</span>;
      case 'moderate':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Moderate</span>;
      case 'severe':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">Severe</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">{severity}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
        {/* Header */}
        <div className="bg-blue-50 px-6 py-4 rounded-t-lg border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FaClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{diagnosis.diagnosis_name}</h3>
              <div className="flex items-center mt-1 space-x-2">
                {diagnosis.diagnosis_code && (
                  <span className="text-sm text-gray-500">Code: {diagnosis.diagnosis_code}</span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  diagnosis.diagnosis_type === 'standard' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {diagnosis.diagnosis_type === 'standard' ? 'Standard' : 'Custom'}
                </span>
                {formatSeverity(diagnosis.severity)}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(diagnosis)}
              className="text-indigo-600 hover:text-indigo-900 p-2"
            >
              <FaEdit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="px-6 py-5">
          {/* Date and Examination Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
            <div className="flex items-center text-gray-600">
              <FaCalendarAlt className="text-gray-500 mr-2" />
              <span>
                {diagnosis.diagnosis_date 
                  ? format(new Date(diagnosis.diagnosis_date), 'PPP')
                  : 'Date not specified'
                }
              </span>
            </div>
            
            {diagnosis.examination_date && (
              <div className="mt-2 flex items-center text-gray-600">
                <FaSyringe className="text-gray-500 mr-2" />
                <span>
                  Examination Date: {format(new Date(diagnosis.examination_date), 'PPP')}
                </span>
              </div>
            )}
            
            {diagnosis.pet_name && (
              <div className="mt-2 bg-white p-2 rounded border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Patient: </span>
                <span className="text-sm text-gray-900">{diagnosis.pet_name}</span>
                {diagnosis.pet_species && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({diagnosis.pet_species}{diagnosis.pet_breed ? `, ${diagnosis.pet_breed}` : ''})
                  </span>
                )}
              </div>
            )}
            
            {diagnosis.veterinarian_name && (
              <div className="mt-2 text-sm text-gray-600">
                Diagnosed by: {diagnosis.veterinarian_name}
              </div>
            )}
          </div>
          
          {/* Description and Notes */}
          <div className="space-y-5">
            {diagnosis.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800">
                  <p className="text-sm whitespace-pre-wrap">{diagnosis.description}</p>
                </div>
              </div>
            )}
            
            {diagnosis.severity === 'severe' && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">Attention Required</h4>
                  <p className="mt-1 text-sm text-red-700">
                    This is classified as a severe diagnosis and may require immediate attention or treatment.
                  </p>
                </div>
              </div>
            )}
            
            {diagnosis.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800">
                  <p className="text-sm whitespace-pre-wrap">{diagnosis.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisDetailModal;
