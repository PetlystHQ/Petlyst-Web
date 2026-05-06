import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/axiosConfig';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import AdmitForm from './AdmitForm';
import { getApiErrorMessage } from '../../../../utils/errorMessage';

interface Room {
  id: string;
  room_name: string;
  room_type: string;
  room_status: string;
}

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
  owner_id: string;
  owner_name?: string;
}

interface Hospitalization {
  id: string;
  room_id: string;
  pet_id: string;
  admission_date: string;
  expected_discharge_date: string;
  actual_discharge_date: string | null;
  room_name: string;
  room_type: string;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
  clinic_id: string;
}

interface PatientHospitalizationProps {
  clinicId: string;
  onDataChanged?: () => void;
}

const PatientHospitalization: React.FC<PatientHospitalizationProps> = ({ clinicId, onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'admit'>('current');
  const [currentHospitalizations, setCurrentHospitalizations] = useState<Hospitalization[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [clinicPatients, setClinicPatients] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedHospitalization, setSelectedHospitalization] = useState<Hospitalization | null>(null);
  const [dischargeDate, setDischargeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const token = useSelector((state: RootState) => state.auth.token);
  
  // Fetch data when component mounts
  useEffect(() => {
    if (activeTab === 'current') {
      fetchCurrentHospitalizations();
    } else if (activeTab === 'admit') {
      fetchAvailableRooms();
      fetchClinicPatients();
    }
    // The three fetch* functions are in-component; adding them would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clinicId, token]);
  
  // Fetch current hospitalizations
  const fetchCurrentHospitalizations = async () => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/clinics/${clinicId}/hospitalization/current`);
      
      if (response.data.success) {
        console.log('Hospitalizations received:', response.data.hospitalizations?.length || 0);
        
        // Client-side filter to ensure deleted pets don't appear
        const filteredHospitalizations = response.data.hospitalizations.filter((hospitalization: Hospitalization) => {
          // Skip hospitalizations with missing or suspicious pet data
          if (!hospitalization.pet_id || !hospitalization.pet_name) {
            console.log('Skipping hospitalization with missing pet data:', hospitalization.id);
            return false;
          }
          
          // Skip if pet name contains deletion markers
          if (hospitalization.pet_name?.includes("[DELETED]") || 
              hospitalization.pet_name?.includes("(DELETED)") ||
              hospitalization.pet_name?.toLowerCase().includes("deleted")) {
            console.log('Skipping hospitalization for deleted pet:', hospitalization.pet_id, hospitalization.pet_name);
            return false;
          }
          
          return true;
        });
        
        if (filteredHospitalizations.length !== response.data.hospitalizations.length) {
          console.log(`Filtered out ${response.data.hospitalizations.length - filteredHospitalizations.length} hospitalizations for deleted pets`);
        }
        
        setCurrentHospitalizations(filteredHospitalizations);
      } else {
        setError('Failed to fetch current hospitalizations');
      }
    } catch (err) {
      console.error('Error fetching current hospitalizations:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch current hospitalizations'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch available rooms
  const fetchAvailableRooms = async () => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/clinics/${clinicId}/hospitalization/rooms`);
      
      if (response.data.success) {
        // Filter out only vacant rooms
        const vacant = response.data.rooms.filter((room: Room) => room.room_status === 'vacant');
        setAvailableRooms(vacant);
      } else {
        setError('Failed to fetch available rooms');
      }
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch available rooms'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch clinic patients
  const fetchClinicPatients = async () => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/clinics/${clinicId}/patients`);
      
      if (response.data.success) {
        // The endpoint returns the patient data in the 'pets' property
        setClinicPatients(response.data.pets.map((pet: {
          pet_id: number | string;
          pet_name: string;
          pet_type?: string;
          pet_species?: string;
          pet_breed: string;
          owner_id: number | string;
          pet_owner_name: string;
          pet_owner_surname: string;
        }) => ({
          pet_id: pet.pet_id.toString(),
          pet_name: pet.pet_name,
          pet_species: pet.pet_type || pet.pet_species,
          pet_breed: pet.pet_breed,
          owner_id: pet.owner_id.toString(),
          owner_name: `${pet.pet_owner_name} ${pet.pet_owner_surname}`
        })));
        console.log('Fetched patients:', response.data.pets);
      } else {
        setError('Failed to fetch clinic patients');
      }
    } catch (err) {
      console.error('Error fetching clinic patients:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch clinic patients'));
      
      // No need for mock data anymore as we're now using the correct endpoint
      setClinicPatients([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle patient admission
  const handleAdmitPatient = async (formData: {
    roomId: string;
    petId: string;
    admissionDate: string;
    expectedDischargeDate: string;
  }) => {
    if (!token) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post(`/hospitalization/admit`, formData);
      
      if (response.data.success) {
        // Reset form and fetch updated data
        setActiveTab('current');
        fetchCurrentHospitalizations();
        
        // Notify parent component about data change
        if (onDataChanged) onDataChanged();
      } else {
        setError('Failed to admit patient');
      }
    } catch (err) {
      console.error('Error admitting patient:', err);
      setError(getApiErrorMessage(err, 'Failed to admit patient'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle patient discharge
  const handleDischargePatient = async () => {
    if (!token || !selectedHospitalization) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axiosInstance.put(`/hospitalization/${selectedHospitalization.id}/discharge`, { actualDischargeDate: dischargeDate });
      
      if (response.data.success) {
        setShowDischargeModal(false);
        setSelectedHospitalization(null);
        fetchCurrentHospitalizations();
        
        // Notify parent component about data change
        if (onDataChanged) onDataChanged();
      } else {
        setError('Failed to discharge patient');
      }
    } catch (err) {
      console.error('Error discharging patient:', err);
      setError(getApiErrorMessage(err, 'Failed to discharge patient'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate days in hospital
  const calculateDays = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Get room type display
  const getRoomTypeDisplay = (type: string) => {
    switch (type) {
      case 'intensive_care':
        return 'Intensive Care';
      case 'observation':
        return 'Observation';
      case 'standard':
        return 'Standard';
      case 'isolation':
        return 'Isolation';
      default:
        return type;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Patient Hospitalization</h2>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`${
              activeTab === 'current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
          >
            Current Patients
          </button>
          <button
            onClick={() => setActiveTab('admit')}
            className={`${
              activeTab === 'admit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
          >
            Admit Patient
          </button>
        </nav>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Content based on active tab */}
      {!loading && activeTab === 'current' && (
        <div>
          {currentHospitalizations.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No patients hospitalized</h3>
              <p className="mt-1 text-gray-500">
                There are currently no patients hospitalized in your clinic.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('admit')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Admit New Patient
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Discharge
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days In Hospital
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentHospitalizations.map(hospitalization => (
                      <tr key={hospitalization.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {hospitalization.pet_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {hospitalization.pet_species} / {hospitalization.pet_breed}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{hospitalization.room_name}</div>
                          <div className="text-sm text-gray-500">{getRoomTypeDisplay(hospitalization.room_type)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(hospitalization.admission_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(hospitalization.expected_discharge_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {calculateDays(hospitalization.admission_date)} days
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedHospitalization(hospitalization);
                              setShowDischargeModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Discharge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {!loading && activeTab === 'admit' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admit New Patient</h3>
          
          {!availableRooms || availableRooms.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No rooms available for hospitalization. Please make a room available before admitting a patient.
                  </p>
                </div>
              </div>
            </div>
          ) : !clinicPatients || clinicPatients.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No patients registered with this clinic. Register a patient before admitting them to hospitalization.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AdmitForm
              rooms={availableRooms}
              patients={clinicPatients}
              onSubmit={handleAdmitPatient}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      )}
      
      {/* Discharge Modal */}
      {showDischargeModal && selectedHospitalization && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Discharge Patient
                </h3>
                <button
                  onClick={() => setShowDischargeModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  You are about to discharge <span className="font-medium text-gray-900">{selectedHospitalization.pet_name}</span> from <span className="font-medium text-gray-900">{selectedHospitalization.room_name}</span>.
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="dischargeDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Date
                </label>
                <input
                  type="date"
                  id="dischargeDate"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDischargePatient}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Discharge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHospitalization; 