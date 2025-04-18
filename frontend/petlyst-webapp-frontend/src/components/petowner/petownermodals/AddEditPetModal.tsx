import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';

// Pet form data interface
interface PetFormData {
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  gender: string;
  photo?: string;
}

interface AddEditPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetAdded: () => void;
  petToEdit?: {
    pet_id: string;
    pet_name: string;
    pet_type: string;
    pet_breed: string;
    pet_birth_date: string;
    pet_gender: string;
    pet_profile_photo?: string;
  };
  mode: 'add' | 'edit';
}

const AddEditPetModal: React.FC<AddEditPetModalProps> = ({ 
  isOpen, 
  onClose, 
  onPetAdded, 
  petToEdit,
  mode 
}) => {
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: '',
    breed: '',
    birth_date: '',
    gender: '',
    photo: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If editing, populate form with pet data
  useEffect(() => {
    if (mode === 'edit' && petToEdit) {
      setFormData({
        name: petToEdit.pet_name,
        species: petToEdit.pet_type,
        breed: petToEdit.pet_breed,
        birth_date: petToEdit.pet_birth_date,
        gender: petToEdit.pet_gender,
        photo: petToEdit.pet_profile_photo
      });
    } else {
      // Reset form when opening in add mode
      setFormData({
        name: '',
        species: '',
        breed: '',
        birth_date: '',
        gender: '',
        photo: ''
      });
    }
  }, [mode, petToEdit, isOpen]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = "Pet name is required";
    if (!formData.species.trim()) errors.species = "Pet type is required";
    if (!formData.breed.trim()) errors.breed = "Breed is required";
    if (!formData.gender.trim()) errors.gender = "Gender is required";
    
    // Birth date validation is optional but should be a valid date if provided
    if (formData.birth_date) {
      const dateObj = new Date(formData.birth_date);
      if (isNaN(dateObj.getTime())) {
        errors.birth_date = "Please enter a valid date";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Map from form data to API expected format
      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birth_date: formData.birth_date,
        gender: formData.gender,
        photo: formData.photo || undefined
      };
      
      let response;
      
      if (mode === 'add') {
        response = await axiosInstance.post('/pets/add', petData);
      } else if (mode === 'edit' && petToEdit) {
        response = await axiosInstance.put(`/pets/${petToEdit.pet_id}`, petData);
      }
      
      if (response && response.data.success) {
        // Reset form and close modal
        setFormData({
          name: '',
          species: '',
          breed: '',
          birth_date: '',
          gender: '',
          photo: ''
        });
        onClose();
        onPetAdded();
      }
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'editing'} pet:`, error);
      setFormErrors({
        submit: `Failed to ${mode === 'add' ? 'add' : 'edit'} pet. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {mode === 'add' ? 'Add New Pet' : 'Edit Pet'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.submit && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
              {formErrors.submit}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter pet name"
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type*</label>
            <select
              name="species"
              value={formData.species}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.species ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select pet type</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Fish">Fish</option>
              <option value="Reptile">Reptile</option>
              <option value="Small Mammal">Small Mammal</option>
              <option value="Other">Other</option>
            </select>
            {formErrors.species && <p className="text-red-500 text-xs mt-1">{formErrors.species}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breed*</label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.breed ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter breed"
            />
            {formErrors.breed && <p className="text-red-500 text-xs mt-1">{formErrors.breed}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.gender ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {formErrors.gender && <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.birth_date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.birth_date && <p className="text-red-500 text-xs mt-1">{formErrors.birth_date}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
            <input
              type="text"
              name="photo"
              value={formData.photo || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter photo URL (optional)"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? (mode === 'add' ? 'Adding...' : 'Saving...') : (mode === 'add' ? 'Add Pet' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditPetModal;
