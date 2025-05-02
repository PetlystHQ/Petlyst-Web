import React, { useState } from 'react';

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

interface AdmitFormProps {
  rooms: Room[];
  patients: Pet[];
  onSubmit: (formData: {
    roomId: string;
    petId: string;
    admissionDate: string;
    expectedDischargeDate: string;
  }) => void;
  isSubmitting: boolean;
}

const AdmitForm: React.FC<AdmitFormProps> = ({ rooms, patients, onSubmit, isSubmitting }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Set default expected discharge date to 3 days from now
  const defaultExpectedDischarge = new Date();
  defaultExpectedDischarge.setDate(defaultExpectedDischarge.getDate() + 3);
  const defaultExpectedDischargeStr = defaultExpectedDischarge.toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    roomId: rooms.length > 0 ? rooms[0].id : '',
    petId: patients.length > 0 ? patients[0].pet_id : '',
    admissionDate: today,
    expectedDischargeDate: defaultExpectedDischargeStr
  });
  
  const [errors, setErrors] = useState<{
    roomId?: string;
    petId?: string;
    admissionDate?: string;
    expectedDischargeDate?: string;
  }>({});
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: {
      roomId?: string;
      petId?: string;
      admissionDate?: string;
      expectedDischargeDate?: string;
    } = {};
    
    if (!formData.roomId) {
      newErrors.roomId = 'Please select a room';
    }
    
    if (!formData.petId) {
      newErrors.petId = 'Please select a patient';
    }
    
    if (!formData.admissionDate) {
      newErrors.admissionDate = 'Admission date is required';
    }
    
    if (!formData.expectedDischargeDate) {
      newErrors.expectedDischargeDate = 'Expected discharge date is required';
    } else if (new Date(formData.expectedDischargeDate) < new Date(formData.admissionDate)) {
      newErrors.expectedDischargeDate = 'Expected discharge date must be after admission date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
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
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Selection */}
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
            Select Room <span className="text-red-600">*</span>
          </label>
          <select
            id="roomId"
            name="roomId"
            value={formData.roomId}
            onChange={handleInputChange}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.roomId ? 'border-red-300' : ''
            }`}
            disabled={isSubmitting || rooms.length === 0}
          >
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.room_name} ({getRoomTypeDisplay(room.room_type)})
              </option>
            ))}
          </select>
          {errors.roomId && (
            <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
          )}
        </div>
        
        {/* Patient Selection */}
        <div>
          <label htmlFor="petId" className="block text-sm font-medium text-gray-700 mb-1">
            Select Patient <span className="text-red-600">*</span>
          </label>
          <select
            id="petId"
            name="petId"
            value={formData.petId}
            onChange={handleInputChange}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.petId ? 'border-red-300' : ''
            }`}
            disabled={isSubmitting || patients.length === 0}
          >
            {patients.map(pet => (
              <option key={pet.pet_id} value={pet.pet_id}>
                {pet.pet_name} ({pet.pet_species} - {pet.pet_breed})
              </option>
            ))}
          </select>
          {errors.petId && (
            <p className="mt-1 text-sm text-red-600">{errors.petId}</p>
          )}
        </div>
        
        {/* Admission Date */}
        <div>
          <label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700 mb-1">
            Admission Date <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            id="admissionDate"
            name="admissionDate"
            value={formData.admissionDate}
            onChange={handleInputChange}
            max={today}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.admissionDate ? 'border-red-300' : ''
            }`}
            disabled={isSubmitting}
          />
          {errors.admissionDate && (
            <p className="mt-1 text-sm text-red-600">{errors.admissionDate}</p>
          )}
        </div>
        
        {/* Expected Discharge Date */}
        <div>
          <label htmlFor="expectedDischargeDate" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Discharge Date <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            id="expectedDischargeDate"
            name="expectedDischargeDate"
            value={formData.expectedDischargeDate}
            onChange={handleInputChange}
            min={formData.admissionDate}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.expectedDischargeDate ? 'border-red-300' : ''
            }`}
            disabled={isSubmitting}
          />
          {errors.expectedDischargeDate && (
            <p className="mt-1 text-sm text-red-600">{errors.expectedDischargeDate}</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Admitting Patient...' : 'Admit Patient'}
        </button>
      </div>
    </form>
  );
};

export default AdmitForm; 