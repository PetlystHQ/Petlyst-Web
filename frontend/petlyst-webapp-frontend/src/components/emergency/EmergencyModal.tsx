import React from 'react';
import { openGoogleMapsDirections } from './mapUtils';
import { WarningIcon } from '../ui/ReactIcons';

// Phone number interface
interface PhoneNumber {
  phone_number: string;
  phone_type: string;
}

// Veterinarian operator interface
interface Operator {
  user_name: string;
  user_surname: string;
}

// Clinic type interface
interface Clinic {
  location_id: number;
  clinic_id: number;
  province: string;
  district: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  clinic_name: string;
  clinic_operator_id: number;
  slug: string;
  distance: number;
  phones: PhoneNumber[];
  operator: Operator | null;
}

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic;
  directionsUrl: string;
  resetEmergency: () => void;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, clinic, directionsUrl, resetEmergency }) => {
  if (!isOpen) return null;

  // Redirect to Google Maps
  const handleNavigate = () => {
    openGoogleMapsDirections(directionsUrl);
    // Keep modal open - onClose removed
  };

  // Handle close with reset
  const handleClose = () => {
    onClose();
    resetEmergency(); // Reset emergency mode when closing
  };

  // Format phone number
  const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber;
  };

  // Format distance (km)
  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} km`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen text-center">
        {/* Backdrop overlay with animated transition effect */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 transition-opacity backdrop-blur-sm" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal container with entrance animation */}
        <div className="inline-block align-bottom rounded-2xl bg-white px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border-8 border-red-600 relative animate-fadeInUp">
          {/* Top red banner removed */}
          
          {/* Modal header - larger and more striking */}
          <div className="sm:flex sm:items-start mt-2">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-red-100 sm:mx-0 sm:h-16 sm:w-16 border-4 border-red-500 animate-pulse">
              <WarningIcon size="lg" className="text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2" id="modal-title">
                Nearest Veterinary Clinic
              </h3>
            </div>
          </div>
          
          {/* Warning message - full width below the warning icon */}
          <div className="mt-4 bg-red-50 border-l-4 border-red-600 p-4 mb-4 rounded-r-lg w-full">
            <p className="text-red-700 font-medium">
              This clinic is the nearest veterinary clinic that can provide emergency service. 
              Please use the map directions to reach it quickly.
            </p>
          </div>

          {/* Clinic information - better organized */}
          <div className="mt-6 p-5 bg-white rounded-lg border border-gray-200 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">{clinic.clinic_name}</h4>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {formatDistance(clinic.distance)}
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Address with icon and better appearance */}
              <div className="flex items-start">
                <svg className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Address:</p>
                  <p className="text-sm text-gray-600">
                    {clinic.clinic_address}, {clinic.district}, {clinic.province}
                  </p>
                </div>
              </div>
              
              {/* Phone Numbers with icon and clickable styles */}
              <div className="flex items-start">
                <svg className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Phone:</p>
                  {clinic.phones && clinic.phones.length > 0 ? (
                    <ul className="space-y-2 mt-1">
                      {clinic.phones.map((phone, index) => (
                        <li key={index} className="flex items-center">
                          <a 
                            href={`tel:${phone.phone_number}`} 
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 hover:underline flex items-center"
                          >
                            {formatPhoneNumber(phone.phone_number)}
                            <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No phone information available</p>
                  )}
                </div>
              </div>
              
              {/* Veterinarian Information with icon and better appearance */}
              {clinic.operator && (
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Responsible Veterinarian:</p>
                    <p className="text-sm text-gray-600">
                      Dr. {clinic.operator.user_name} {clinic.operator.user_surname}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons - more attractive buttons */}
          <div className="mt-8 sm:mt-8 flex flex-col space-y-3">
            <button
              type="button"
              className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 sm:text-lg"
              onClick={handleNavigate}
            >
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
              Get Directions with Google Maps
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 sm:text-sm"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal; 