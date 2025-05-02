import React, { useState, useEffect } from 'react';

interface RoomFormData {
  roomName: string;
  roomType: 'intensive_care' | 'observation' | 'standard' | 'isolation';
}

interface RoomFormProps {
  initialData?: RoomFormData;
  onSubmit: (formData: RoomFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState<RoomFormData>({
    roomName: '',
    roomType: 'standard'
  });
  const [errors, setErrors] = useState<{ roomName?: string }>({});
  
  // Initialize form with initial data if provided (edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
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
    const newErrors: { roomName?: string } = {};
    
    if (!formData.roomName.trim()) {
      newErrors.roomName = 'Room name is required';
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

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">
        {initialData ? 'Edit Room' : 'Add New Room'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
            Room Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="roomName"
            name="roomName"
            value={formData.roomName}
            onChange={handleInputChange}
            className={`w-full rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
              errors.roomName ? 'border-red-300' : ''
            }`}
            placeholder="Enter room name (e.g. Room 101, ICU 1)"
            disabled={isSubmitting}
          />
          {errors.roomName && (
            <p className="mt-1 text-sm text-red-600">{errors.roomName}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1">
            Room Type <span className="text-red-600">*</span>
          </label>
          <select
            id="roomType"
            name="roomType"
            value={formData.roomType}
            onChange={handleInputChange}
            className="w-full rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="intensive_care">Intensive Care</option>
            <option value="observation">Observation</option>
            <option value="standard">Standard</option>
            <option value="isolation">Isolation</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (initialData ? 'Updating...' : 'Creating...')
              : (initialData ? 'Update Room' : 'Create Room')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomForm; 