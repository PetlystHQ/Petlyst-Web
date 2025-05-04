import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createExamination, resetExaminationState } from './examinationSlice';
import { ExaminationData } from './examinationService';
import { AppDispatch, RootState } from '../../../../store';
import axios from 'axios';

interface Pet {
  pet_id: number;
  pet_name: string;
  pet_species: string;
  pet_breed: string;
}

interface NewExaminationModalProps {
  show: boolean;
  onHide: () => void;
  onExaminationCreated: () => void;
  initialPetId?: number; // Auto-selected pet ID from PetRecords
}

const NewExaminationModal: React.FC<NewExaminationModalProps> = ({ 
  show, 
  onHide,
  onExaminationCreated,
  initialPetId
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector((state: RootState) => state.examinations);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  
  const [formData, setFormData] = useState<ExaminationData>({
    pet_id: initialPetId || 0,
    appointment_id: null,
    temperature: null,
    heart_rate: null,
    respiratory_rate: null,
    weight: null,
    notes: ''
  });
  
  // Update form data when initialPetId changes
  useEffect(() => {
    if (initialPetId) {
      setFormData(prev => ({
        ...prev,
        pet_id: initialPetId
      }));
    }
  }, [initialPetId]);
  
  // Fetch pets when modal is opened
  useEffect(() => {
    if (show) {
      fetchPets();
    }
  }, [show]);
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!show) {
      setFormData({
        pet_id: initialPetId || 0,
        appointment_id: null,
        temperature: null,
        heart_rate: null,
        respiratory_rate: null,
        weight: null,
        notes: ''
      });
      dispatch(resetExaminationState());
    }
  }, [show, dispatch, initialPetId]);
  
  // Handle success state
  useEffect(() => {
    if (success && !loading.create) {
      onExaminationCreated();
      onHide();
    }
  }, [success, loading.create, onExaminationCreated, onHide]);
  
  const fetchPets = async () => {
    try {
      setPetsLoading(true);
      
      // Get clinic ID from localStorage
      const clinicId = localStorage.getItem('selectedClinicId');
      if (!clinicId) {
        console.error('Clinic ID not found');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }
      
      const response = await axios.get(`/api/clinics/${clinicId}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPets(response.data.pets || []);
      } else {
        console.error('Error fetching pets:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setPetsLoading(false);
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Convert numeric values
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value ? parseFloat(value) : null
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate pet_id
    if (!formData.pet_id) {
      alert('Please select a pet');
      return;
    }
    
    // Create examination
    dispatch(createExamination(formData));
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">New Examination</h2>
          <button 
            onClick={onHide}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700 mb-1">
              Pet Selection *
            </label>
            <select
              id="pet_id"
              name="pet_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.pet_id || ''}
              onChange={handleChange}
              required
            >
              <option value="">Select a Pet</option>
              {petsLoading ? (
                <option disabled>Loading...</option>
              ) : (
                pets.map(pet => (
                  <option key={pet.pet_id} value={pet.pet_id}>
                    {pet.pet_name} ({pet.pet_species} - {pet.pet_breed})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                Body Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                id="temperature"
                name="temperature"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.temperature || ''}
                onChange={handleChange}
                placeholder="Example: 38.5"
              />
            </div>
            
            <div>
              <label htmlFor="heart_rate" className="block text-sm font-medium text-gray-700 mb-1">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                id="heart_rate"
                name="heart_rate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.heart_rate || ''}
                onChange={handleChange}
                placeholder="Example: 80"
              />
            </div>
            
            <div>
              <label htmlFor="respiratory_rate" className="block text-sm font-medium text-gray-700 mb-1">
                Respiratory Rate (bpm)
              </label>
              <input
                type="number"
                id="respiratory_rate"
                name="respiratory_rate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.respiratory_rate || ''}
                onChange={handleChange}
                placeholder="Example: 20"
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                id="weight"
                name="weight"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.weight || ''}
                onChange={handleChange}
                placeholder="Example: 10.5"
              />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Notes about the examination..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onHide}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md flex items-center"
              disabled={loading.create}
            >
              {loading.create && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Start Examination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewExaminationModal;
