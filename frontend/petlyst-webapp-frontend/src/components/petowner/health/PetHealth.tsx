import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  pet_birth_date: string;
  pet_gender: string;
  pet_owner_id: string;
  pet_profile_photo?: string;
}

interface Examination {
  examination_id: string;
  pet_id: string;
  vet_id: string;
  examination_date: string;
  status: string;
  temperature: number;
  heart_rate: number;
  respiratory_rate: number;
  weight: number;
  notes: string;
  appointment_id: string;
  vet_name: string;
  vet_surname: string;
  appointment_date: string;
  appointment_start_hour: string;
}

interface Diagnosis {
  diagnosis_id: string;
  examination_id: string;
  diagnosis_type: string;
  diagnosis_code: string;
  diagnosis_name: string;
  description: string;
  diagnosis_date: string;
  severity: string;
  notes: string;
  examination_date: string;
  examination_status: string;
  vet_name: string;
  vet_surname: string;
}

interface PetHealthProps {
  pets: Pet[];
  loading: boolean;
  error: string | null;
}

const PetHealth: React.FC<PetHealthProps> = ({ pets, loading, error }) => {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'examinations' | 'diagnoses'>('examinations');

  useEffect(() => {
    if (pets.length > 0) {
      // Check if there's a selected pet ID in localStorage
      const selectedPetId = localStorage.getItem('selectedPetHealthId');
      
      if (selectedPetId) {
        // Find the pet with the matching ID
        const selectedPet = pets.find(pet => pet.pet_id === selectedPetId);
        
        // If found, set it as the selected pet
        if (selectedPet) {
          setSelectedPet(selectedPet);
        } else {
          // If not found (maybe it was deleted), use the first pet
          setSelectedPet(pets[0]);
        }
        
        // Clear the localStorage item to avoid unintended selection on subsequent visits
        localStorage.removeItem('selectedPetHealthId');
      } else if (!selectedPet) {
        // If no pet is selected in localStorage and no pet is currently selected,
        // default to the first pet
        setSelectedPet(pets[0]);
      }
    }
  }, [pets, selectedPet]);

  useEffect(() => {
    if (selectedPet) {
      fetchPetHealthData(selectedPet.pet_id);
    }
  }, [selectedPet]);

  const fetchPetHealthData = async (petId: string) => {
    setDataLoading(true);
    setDataError(null);

    try {
      // Fetch examinations
      const examinationsResponse = await axiosInstance.get(`/pets/${petId}/examinations`);
      if (examinationsResponse.data.success) {
        setExaminations(examinationsResponse.data.examinations || []);
      }

      // Fetch diagnoses
      const diagnosesResponse = await axiosInstance.get(`/pets/${petId}/diagnoses`);
      if (diagnosesResponse.data.success) {
        setDiagnoses(diagnosesResponse.data.diagnoses || []);
      }
    } catch (err: any) {
      console.error('Error fetching pet health data:', err);
      setDataError(err.response?.data?.message || 'Failed to fetch health records.');
    } finally {
      setDataLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group diagnoses by examination ID for easier rendering
  const diagnosesByExamination: { [key: string]: Diagnosis[] } = {};
  diagnoses.forEach(diagnosis => {
    if (!diagnosesByExamination[diagnosis.examination_id]) {
      diagnosesByExamination[diagnosis.examination_id] = [];
    }
    diagnosesByExamination[diagnosis.examination_id].push(diagnosis);
  });

  const renderSeverityBadge = (severity: string) => {
    let colorClass = '';
    
    switch (severity) {
      case 'mild':
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        break;
      case 'moderate':
        colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
        break;
      case 'severe':
        colorClass = 'bg-red-100 text-red-800 border-red-200';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClass}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pet Health</h2>
        <p className="text-gray-600 mb-4">You don't have any pets yet. Add a pet to view health records.</p>
        <button 
          onClick={() => window.location.href = '/pets/add'} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Pet
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with decorative elements */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <path d="M800 0L0 0 0 800 800 800z" fill="none" stroke="currentColor" strokeWidth="8" />
            <circle cx="400" cy="400" r="200" fill="none" stroke="currentColor" strokeWidth="8" />
          </svg>
        </div>
        
        <div className="relative">
          <h2 className="text-2xl font-bold text-white">Pet Health Records</h2>
          <p className="text-blue-100 mt-1">
            View examination and diagnosis records of your pets
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Pet selector */}
        <div className="mb-6">
          <label htmlFor="pet-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Pet
          </label>
          <select
            id="pet-select"
            value={selectedPet?.pet_id || ''}
            onChange={(e) => {
              const petId = e.target.value;
              const pet = pets.find(p => p.pet_id === petId);
              if (pet) setSelectedPet(pet);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {pets.map(pet => (
              <option key={pet.pet_id} value={pet.pet_id}>
                {pet.pet_name} ({pet.pet_type} - {pet.pet_breed})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('examinations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'examinations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Examinations
            </button>
            <button
              onClick={() => setActiveSection('diagnoses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'diagnoses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Diagnoses
            </button>
          </nav>
        </div>

        {/* Loading state */}
        {dataLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error state */}
        {dataError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{dataError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active section */}
        {!dataLoading && !dataError && (
          <>
            {activeSection === 'examinations' ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedPet?.pet_name}'s Examination Records
                </h3>
                
                {examinations.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No examination records found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedPet?.pet_name} doesn't have any examination records yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {examinations.map(exam => (
                      <div key={exam.examination_id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-800">
                              Examination: {formatDate(exam.examination_date)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Dr. {exam.vet_name} {exam.vet_surname}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                            exam.status === 'completed' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {exam.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                        
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Body Temperature</p>
                              <p className="font-medium">{exam.temperature ? `${exam.temperature} °C` : '-'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
                              <p className="font-medium">{exam.heart_rate ? `${exam.heart_rate} bpm` : '-'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Respiratory Rate</p>
                              <p className="font-medium">{exam.respiratory_rate ? `${exam.respiratory_rate} rpm` : '-'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Weight</p>
                              <p className="font-medium">{exam.weight ? `${exam.weight} kg` : '-'}</p>
                            </div>
                          </div>
                          
                          {exam.notes && (
                            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Veterinarian Note</h5>
                              <p className="text-sm">{exam.notes}</p>
                            </div>
                          )}
                          
                          {/* Show linked diagnoses if any */}
                          {diagnosesByExamination[exam.examination_id] && diagnosesByExamination[exam.examination_id].length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Related Diagnoses
                              </h5>
                              <div className="space-y-2">
                                {diagnosesByExamination[exam.examination_id].map(diagnosis => (
                                  <div key={diagnosis.diagnosis_id} className="pl-4 border-l-2 border-indigo-300">
                                    <p className="text-sm font-medium">{diagnosis.diagnosis_name}</p>
                                    <div className="flex items-center mt-1 mb-1">
                                      {renderSeverityBadge(diagnosis.severity)}
                                      <span className="ml-2 text-xs text-gray-500">
                                        {formatDate(diagnosis.diagnosis_date)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedPet?.pet_name}'s Diagnosis Records
                </h3>
                
                {diagnoses.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No diagnosis records found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedPet?.pet_name} doesn't have any diagnosis records yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group diagnoses by date for better organization */}
                    {Object.entries(
                      diagnoses.reduce<{ [key: string]: Diagnosis[] }>((acc, diagnosis) => {
                        const date = diagnosis.diagnosis_date.split('T')[0];
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(diagnosis);
                        return acc;
                      }, {})
                    ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                    .map(([date, diagnosesForDate]) => (
                      <div key={date} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="font-medium text-gray-800">
                            {formatDate(date)}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {diagnosesForDate.length} diagnosis records
                          </p>
                        </div>
                        
                        <div className="p-4 bg-white divide-y divide-gray-100">
                          {diagnosesForDate.map(diagnosis => (
                            <div key={diagnosis.diagnosis_id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-medium text-gray-800">{diagnosis.diagnosis_name}</h5>
                                  <p className="text-sm text-gray-600">Dr. {diagnosis.vet_name} {diagnosis.vet_surname}</p>
                                </div>
                                {renderSeverityBadge(diagnosis.severity)}
                              </div>
                              
                              {diagnosis.description && (
                                <div className="mt-2 mb-3">
                                  <p className="text-sm text-gray-700">{diagnosis.description}</p>
                                </div>
                              )}
                              
                              {diagnosis.notes && (
                                <div className="mt-2 p-3 bg-purple-50 border-l-4 border-purple-300 rounded-r-lg">
                                  <h6 className="text-xs font-medium text-gray-700 mb-1">Veterinarian Note</h6>
                                  <p className="text-sm">{diagnosis.notes}</p>
                                </div>
                              )}
                              
                              {/* Link back to associated examination */}
                              <div className="mt-3 text-xs text-gray-500 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <button 
                                  onClick={() => {
                                    setActiveSection('examinations');
                                    // Ideally, we would scroll to the specific examination
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Related Examination: {formatDate(diagnosis.examination_date)}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PetHealth;
