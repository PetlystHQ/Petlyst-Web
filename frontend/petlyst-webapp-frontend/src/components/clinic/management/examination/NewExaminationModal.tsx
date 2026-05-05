import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { createExamination, updateExamination } from './examinationSlice';
import { CreateExaminationData, Examination, UpdateExaminationData } from './examinationService';
import { FaTimes, FaCalendarCheck } from 'react-icons/fa';
import axios from 'axios';
import { format } from 'date-fns';
import { getApiErrorMessage } from '../../../../utils/errorMessage';

interface NewExaminationModalProps {
  petId?: number;
  examination?: Examination; // For edit mode
  appointmentId?: number; // Yeni eklenen prop
  onClose: () => void;
  onSuccess?: () => void;
}

interface Pet {
  pet_id: number;
  pet_name: string;
  pet_species?: string;
  pet_breed?: string;
}

interface Appointment {
  appointment_id: number;
  appointment_date: string;
  appointment_start_hour: string;
  appointment_end_hour: string;
  status: string; // Bu, SQL sorgusunda appointment_status AS status olarak alınır
  notes: string | null;
  clinic_id: number;
  video_meeting: boolean;
  meeting_url: string | null;
  meeting_password: string | null;
}

const NewExaminationModal: React.FC<NewExaminationModalProps> = ({
  petId,
  examination,
  appointmentId,
  onClose,
  onSuccess
}) => {
  // Determine if we're in edit mode
  const isEditMode = !!examination;
  const isFirstRender = useRef(true);
  
  const dispatch = useAppDispatch();
  const { loading, success, error } = useAppSelector(state => state.examinations);
  
  // Seçili kliniğin ID'sini localStorage'dan al
  const [currentClinicId, setCurrentClinicId] = useState<number | null>(null);
  
  useEffect(() => {
    const clinicId = localStorage.getItem('selectedClinicId');
    if (clinicId) {
      setCurrentClinicId(parseInt(clinicId, 10));
    }
  }, []);
  
  // Only log on first render
  useEffect(() => {
    if (isFirstRender.current) {
      if (isEditMode) {
        console.log('Edit mode - Examination ID:', examination.examination_id);
      } else if (petId) {
        console.log('Create mode - Pet ID:', petId);
      } else {
        console.log('Create mode - No Pet ID');
      }
      isFirstRender.current = false;
    }
  }, [isEditMode, examination, petId]);
  
  const [formData, setFormData] = useState<CreateExaminationData & UpdateExaminationData>({
    pet_id: isEditMode ? examination.pet_id : (petId || 0),
    appointment_id: isEditMode ? (examination.appointment_id || undefined) : appointmentId,
    temperature: isEditMode ? examination.temperature || undefined : undefined,
    heart_rate: isEditMode ? examination.heart_rate || undefined : undefined,
    respiratory_rate: isEditMode ? examination.respiratory_rate || undefined : undefined,
    weight: isEditMode ? examination.weight || undefined : undefined,
    notes: isEditMode ? examination.notes || '' : '',
    status: isEditMode ? examination.status : 'started'
  });
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [petSearchTerm, setPetSearchTerm] = useState(isEditMode ? examination.pet_name || '' : '');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [fetchingPets, setFetchingPets] = useState(false);
  const [fetchingAppointments, setFetchingAppointments] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [justOpened, setJustOpened] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  
  // Prevent accidental modal closure
  const handleSafeClose = () => {
    if (loading) {
      return; // Don't allow closing while submitting
    }
    
    if (justOpened) {
      return; // Prevent immediate closing after opening
    }
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 50);
  };
  
  // Set a timer to allow closing after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setJustOpened(false);
    }, 800); // Prevent closing for 800ms
    
    return () => clearTimeout(timer);
  }, []);

  // Update form data when petId prop changes (only in create mode)
  useEffect(() => {
    if (!isEditMode && petId) {
      setFormData(prev => ({
        ...prev,
        pet_id: petId
      }));
      
      // Pet değiştiğinde randevuları yeniden çek
      fetchPetAppointments(petId);
    }
  }, [petId, isEditMode]);

  // Fetch pet appointments
  const fetchPetAppointments = async (petId: number) => {
    if (!petId) return;
    
    try {
      setFetchingAppointments(true);
      const response = await axios.get(`/api/examinations/pet-appointments/${petId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success && response.data.appointments) {
        setAppointments(response.data.appointments);
        
        // Eğer appointment ID verilmişse, onu seç
        if (appointmentId) {
          setFormData(prev => ({
            ...prev,
            appointment_id: appointmentId
          }));
        }
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching pet appointments:', error);
    } finally {
      setFetchingAppointments(false);
    }
  };

  // Fetch pets if petId is not provided (only in create mode)
  useEffect(() => {
    // Skip if we're in edit mode
    if (isEditMode) {
      // Set the selected pet based on the examination
      setSelectedPet({
        pet_id: examination.pet_id,
        pet_name: examination.pet_name || `Pet #${examination.pet_id}`,
        pet_species: examination.pet_species,
        pet_breed: examination.pet_breed
      });
      
      // Edit modunda, bu pet için randevuları getir
      if (examination.pet_id) {
        fetchPetAppointments(examination.pet_id);
      }
      return;
    }
    
    const fetchPets = async () => {
      try {
        setFetchingPets(true);
        setFetchError(null);
        
        // Get user's clinics to find their clinic ID
        const clinicResponse = await axios.get('/api/clinics/my-clinics', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!clinicResponse.data.clinics || clinicResponse.data.clinics.length === 0) {
          console.error('No clinics found for this veterinarian');
          setFetchError('No clinics found for this veterinarian');
          setFetchingPets(false);
          return;
        }
        
        // Use the first clinic ID (most common case)
        const clinicId = clinicResponse.data.clinics[0].clinic_id;
        
        // Fetch patients (pets) from this clinic
        const patientsResponse = await axios.get(`/api/clinics/${clinicId}/patients`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (patientsResponse.data.success && patientsResponse.data.pets) {
          // Format the pets data
          const formattedPets = patientsResponse.data.pets.map((pet: {
            pet_id: number | string;
            pet_name: string;
            pet_type?: string;
            pet_species?: string;
            pet_breed?: string;
          }) => ({
            pet_id: parseInt(String(pet.pet_id), 10), // Ensure pet_id is a number
            pet_name: pet.pet_name,
            pet_species: pet.pet_type || pet.pet_species,
            pet_breed: pet.pet_breed
          }));
          
          setPets(formattedPets);
          
          // If petId is provided, find the pet in the list and set its name
          if (petId) {
            const selectedPet = formattedPets.find((pet: Pet) => pet.pet_id === petId);
            if (selectedPet) {
              setPetSearchTerm(selectedPet.pet_name);
              setSelectedPet(selectedPet);
              
              // And fetch this pet's appointments
              fetchPetAppointments(petId);
            }
          }
        } else {
          setFetchError('No patients found for this clinic');
        }
      } catch (err) {
        console.error('Error fetching pets:', err);
        setFetchError(getApiErrorMessage(err, 'Failed to fetch pets'));
      } finally {
        setFetchingPets(false);
      }
    };
    
    fetchPets();
  }, [petId, isEditMode, examination]);

  // Reset form when modal closes or on success
  useEffect(() => {
    if (success && onSuccess && !isClosing) {
      onSuccess();
      handleSafeClose();
    }
  }, [success, onSuccess, isClosing]);

  // Update search term when a pet is selected from the fetched list
  useEffect(() => {
    if (!isEditMode && petId && pets.length > 0) {
      const selectedPet = pets.find(pet => pet.pet_id === petId);
      if (selectedPet) {
        setPetSearchTerm(selectedPet.pet_name);
        setSelectedPet(selectedPet);
      }
    }
  }, [petId, pets, isEditMode]);

  // Randevuları filtrele - sadece seçili kliniğin randevularını göster
  useEffect(() => {
    if (currentClinicId && appointments.length > 0) {
      const filtered = appointments.filter(app => app.clinic_id === currentClinicId);
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments([]);
    }
  }, [appointments, currentClinicId]);

  const filteredPets = pets.filter((pet: Pet) => 
    pet.pet_name.toLowerCase().includes(petSearchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePetSelection = (selectedPet: Pet) => {
    setFormData(prev => ({
      ...prev,
      pet_id: selectedPet.pet_id,
      appointment_id: undefined // Pet değiştiğinde randevu seçimini sıfırla
    }));
    setPetSearchTerm(selectedPet.pet_name);
    setShowPetDropdown(false);
    setSelectedPet(selectedPet);
    
    if (formErrors.pet_id) {
      setFormErrors(prev => ({
        ...prev,
        pet_id: ''
      }));
    }
    
    // Seçilen pet için randevuları getir
    fetchPetAppointments(selectedPet.pet_id);
  };

  const handleAppointmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const appointmentId = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
    setFormData(prev => ({
      ...prev,
      appointment_id: appointmentId
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as 'started' | 'in_progress' | 'completed';
    setFormData(prev => ({
      ...prev,
      status
    }));
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.pet_id) {
      errors.pet_id = 'Please select a pet';
    }
    
    if (formData.temperature !== undefined && (formData.temperature < 35 || formData.temperature > 45)) {
      errors.temperature = 'Temperature should be between 35°C and 45°C';
    }
    
    if (formData.heart_rate !== undefined && (formData.heart_rate < 30 || formData.heart_rate > 300)) {
      errors.heart_rate = 'Heart rate should be between 30 and 300 bpm';
    }
    
    if (formData.respiratory_rate !== undefined && (formData.respiratory_rate < 5 || formData.respiratory_rate > 100)) {
      errors.respiratory_rate = 'Respiratory rate should be between 5 and 100 rpm';
    }
    
    if (formData.weight !== undefined && (formData.weight <= 0 || formData.weight > 500)) {
      errors.weight = 'Weight should be between 0 and 500 kg';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEditMode) {
      // Update mode
      const updateData: UpdateExaminationData = {
        status: formData.status,
        temperature: formData.temperature,
        heart_rate: formData.heart_rate,
        respiratory_rate: formData.respiratory_rate,
        weight: formData.weight,
        notes: formData.notes,
        // Edit modunda appointment_id güncelleme yapmak istiyorsak:
        appointment_id: formData.appointment_id
      };
      
      dispatch(updateExamination({ 
        examinationId: examination.examination_id,
        updateData
      }));
    } else {
      // Create mode
      const createData: CreateExaminationData = {
        pet_id: formData.pet_id,
        temperature: formData.temperature,
        heart_rate: formData.heart_rate,
        respiratory_rate: formData.respiratory_rate,
        weight: formData.weight,
        notes: formData.notes,
        appointment_id: formData.appointment_id
      };
      
      dispatch(createExamination(createData));
    }
  };

  // Format appointment date/time for display
  const formatAppointmentDate = (date: string, start_hour: string) => {
    try {
      // PostgreSQL timestamp'i parse et
      // start_hour "2023-05-15 14:30:00" formatında olabilir
      const dateObj = new Date(start_hour);
      
      // Eğer geçerli bir tarih değilse, alternatif olarak appointment_date ile birleştir
      if (isNaN(dateObj.getTime())) {
        // Özellikle appointment_date "2023-05-15" formatında ve
        // start_hour "14:30:00" formatında ise bu yaklaşım gerekli olabilir
        const combinedDate = new Date(`${date}T${start_hour.split(' ')[1] || '00:00:00'}`);
        return format(combinedDate, 'PPP p');
      }
      
      return format(dateObj, 'PPP p');
    } catch (e) {
      console.error('Error formatting date:', e);
      // Sorun olursa basit formatta göster
      return `${date} ${start_hour.split(' ')[1] || start_hour}`;
    }
  };

  return (
    <div 
      className="fixed z-10 inset-0 overflow-y-auto" 
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-gray-500 opacity-75" 
            onClick={(e) => {
              e.stopPropagation();
              // Only allow background click to close if not loading and not just opened
              if (!loading && !justOpened) {
                handleSafeClose();
              }
            }}
          ></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={handleSafeClose}
              disabled={loading}
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEditMode ? 'Edit Examination' : 'New Examination'}
                </h3>
                
                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4 relative">
                      <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Pet <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={petSearchTerm}
                          onChange={(e) => {
                            if (!isEditMode && !petId) {
                              setPetSearchTerm(e.target.value);
                              setShowPetDropdown(true);
                            }
                          }}
                          onFocus={() => {
                            if (!isEditMode && !petId) {
                              setShowPetDropdown(true);
                            }
                          }}
                          placeholder="Search pet by name"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.pet_id ? 'border-red-300' : 'border-gray-300'
                          } ${(isEditMode || petId) ? 'bg-gray-100' : ''}`}
                          disabled={fetchingPets || isEditMode || !!petId}
                        />
                        {fetchingPets && (
                          <div className="absolute right-3 top-2">
                            <div className="w-5 h-5 border-2 border-t-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {showPetDropdown && !fetchingPets && !isEditMode && !petId && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md overflow-auto max-h-60">
                            <ul className="py-1 text-base text-gray-700">
                              {filteredPets.length > 0 ? (
                                filteredPets.map(pet => (
                                  <li
                                    key={pet.pet_id}
                                    className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                                    onClick={() => handlePetSelection(pet)}
                                  >
                                    <div className="font-medium">{pet.pet_name}</div>
                                    {pet.pet_species && (
                                      <div className="text-xs text-gray-500">
                                        {pet.pet_species} {pet.pet_breed ? `(${pet.pet_breed})` : ''}
                                      </div>
                                    )}
                                  </li>
                                ))
                              ) : fetchError ? (
                                <li className="px-4 py-2 text-red-500">{fetchError}</li>
                              ) : (
                                <li className="px-4 py-2 text-gray-500">No pets found</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      {((isEditMode || petId) && petSearchTerm) && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-blue-700 font-medium">{petSearchTerm}</span>
                            {selectedPet && (
                              <span className="ml-2 text-xs text-blue-600">
                                {selectedPet.pet_species} 
                                {selectedPet.pet_breed ? ` (${selectedPet.pet_breed})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {formErrors.pet_id && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.pet_id}</p>
                      )}
                    </div>
                    
                    {/* Randevu seçim dropdown'u */}
                    <div className="mb-4">
                      <label htmlFor="appointment_id" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaCalendarCheck className="mr-2 text-indigo-500" />
                        Related Appointment
                      </label>
                      <div className="relative">
                        <select
                          id="appointment_id"
                          name="appointment_id"
                          value={formData.appointment_id || ""}
                          onChange={handleAppointmentChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={fetchingAppointments}
                        >
                          <option value="">No appointment selected</option>
                          {filteredAppointments.map(appointment => (
                            <option key={appointment.appointment_id} value={appointment.appointment_id}>
                              {formatAppointmentDate(appointment.appointment_date, appointment.appointment_start_hour)}
                            </option>
                          ))}
                        </select>
                        {fetchingAppointments && (
                          <div className="absolute right-3 top-2">
                            <div className="w-5 h-5 border-2 border-t-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {filteredAppointments.length === 0 ? 
                          'No upcoming appointments available for this pet at this clinic' : 
                          'Select a related appointment or leave blank'
                        }
                      </p>
                    </div>
                    
                    {isEditMode && (
                      <div className="mb-4">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleStatusChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="started">Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                          Temperature (°C)
                        </label>
                        <input
                          type="number"
                          id="temperature"
                          name="temperature"
                          step="0.1"
                          min="0"
                          value={formData.temperature === undefined ? '' : formData.temperature}
                          onChange={handleNumberInputChange}
                          placeholder="36.5"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.temperature ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.temperature && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.temperature}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="heart_rate" className="block text-sm font-medium text-gray-700 mb-1">
                          Heart Rate (bpm)
                        </label>
                        <input
                          type="number"
                          id="heart_rate"
                          name="heart_rate"
                          min="0"
                          value={formData.heart_rate === undefined ? '' : formData.heart_rate}
                          onChange={handleNumberInputChange}
                          placeholder="80"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.heart_rate ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.heart_rate && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.heart_rate}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="respiratory_rate" className="block text-sm font-medium text-gray-700 mb-1">
                          Respiratory Rate (rpm)
                        </label>
                        <input
                          type="number"
                          id="respiratory_rate"
                          name="respiratory_rate"
                          min="0"
                          value={formData.respiratory_rate === undefined ? '' : formData.respiratory_rate}
                          onChange={handleNumberInputChange}
                          placeholder="20"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.respiratory_rate ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.respiratory_rate && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.respiratory_rate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          id="weight"
                          name="weight"
                          step="0.1"
                          min="0"
                          value={formData.weight === undefined ? '' : formData.weight}
                          onChange={handleNumberInputChange}
                          placeholder="15.5"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.weight ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.weight && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.weight}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={4}
                        value={formData.notes || ''}
                        onChange={handleInputChange}
                        placeholder="Enter examination notes here..."
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    {error && (
                      <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || fetchingPets}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                (loading || fetchingPets) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Examination' : 'Create Examination')}
            </button>
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={loading}
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewExaminationModal;
