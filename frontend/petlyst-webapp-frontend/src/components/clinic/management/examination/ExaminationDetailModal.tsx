import React from 'react';
import { format } from 'date-fns';
import { Examination } from './examinationService';
import { FaTimes, FaEdit, FaThermometer, FaHeartbeat, FaWeight, FaStethoscope, FaPaw, FaCalendarAlt, FaUser } from 'react-icons/fa';

interface ExaminationDetailModalProps {
  examination: Examination | null;
  onClose: () => void;
  onEdit: (examination: Examination) => void;
}

const ExaminationDetailModal: React.FC<ExaminationDetailModalProps> = ({
  examination,
  onClose,
  onEdit,
}) => {
  if (!examination) return null;

  // Format the status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'started':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Started</span>;
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">In Progress</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Completed</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">Examination Details</h3>
                {formatStatus(examination.status)}
              </div>
              <button
                type="button"
                className="bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-2 flex items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FaCalendarAlt className="text-indigo-500" />
                <span>{format(new Date(examination.created_at), 'PPP')}</span>
              </div>
              {examination.updated_at !== examination.created_at && (
                <div className="ml-4 flex items-center space-x-2 text-sm text-gray-500">
                  <span className="text-xs">Last updated: {format(new Date(examination.updated_at), 'PPP')}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white px-6 py-4">
            {/* Patient Information */}
            <div className="mb-5 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaPaw className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      {examination.pet_name || `Pet #${examination.pet_id}`}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {examination.pet_species} {examination.pet_breed ? `(${examination.pet_breed})` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onEdit(examination)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
              
              <div className="mt-3 text-sm text-gray-600 flex items-center">
                <FaUser className="text-gray-400 mr-2" />
                <span>Examined by: {examination.veterinarian_name || `Veterinarian #${examination.vet_id}`}</span>
              </div>
            </div>
            
            {/* Vital Signs Grid */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vital Signs</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center space-x-3 hover:border-blue-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                    <FaThermometer className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="font-medium text-gray-900">
                      {examination.temperature ? `${examination.temperature} °C` : 'Not recorded'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center space-x-3 hover:border-red-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                    <FaHeartbeat className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="font-medium text-gray-900">
                      {examination.heart_rate ? `${examination.heart_rate} bpm` : 'Not recorded'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center space-x-3 hover:border-blue-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <FaStethoscope className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Respiratory Rate</p>
                    <p className="font-medium text-gray-900">
                      {examination.respiratory_rate ? `${examination.respiratory_rate} rpm` : 'Not recorded'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center space-x-3 hover:border-blue-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <FaWeight className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">
                      {examination.weight ? `${examination.weight} kg` : 'Not recorded'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notes Section */}
            {examination.notes && (
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{examination.notes}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaminationDetailModal;
