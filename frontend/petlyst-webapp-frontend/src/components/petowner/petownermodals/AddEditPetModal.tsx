import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../utils/axiosConfig';
import PET_TYPES_AND_BREEDS, { getBreedsByPetTypeName, PetBreed } from '../../../constants/PetTypesAndBreeds';

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

// Searchable dropdown component
interface SearchableDropdownProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  error?: string;
  className?: string;
  required?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  className,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  // When value changes externally, clear search term
  useEffect(() => {
    setSearchTerm('');
  }, [value]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Handle selection
  const handleSelect = (optionName: string) => {
    onChange(optionName);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].name);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        e.preventDefault();
        break;
    }
  };

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Find display value
  const displayValue = value 
    ? options.find(option => option.name === value)?.name || ''
    : '';

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && '*'}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click to register on options
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 border rounded-md ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {filteredOptions.map((option, index) => (
              <li
                key={option.id}
                className={`px-3 py-2 cursor-pointer ${
                  highlightedIndex === index
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(option.name)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

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
  
  // Get available breeds based on selected species
  const availableBreeds = useMemo<PetBreed[]>(() => {
    if (!formData.species) return [];
    return getBreedsByPetTypeName(formData.species);
  }, [formData.species]);

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

  // When species changes, reset breed
  useEffect(() => {
    // Only reset if we have a species and the current breed doesn't exist in the list
    if (formData.species && formData.breed) {
      const breedExists = availableBreeds.some(breed => breed.name === formData.breed);
      if (!breedExists) {
        setFormData(prev => ({
          ...prev,
          breed: ''
        }));
      }
    }
  }, [formData.species, availableBreeds, formData.breed]);

  // Handle regular input change
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

  // Handle dropdown change
  const handleDropdownChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is updated
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
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
          
          <SearchableDropdown
            options={PET_TYPES_AND_BREEDS.map(type => ({ id: type.id, name: type.name }))}
            value={formData.species}
            onChange={(value) => handleDropdownChange('species', value)}
            placeholder="Select pet type"
            label="Pet Type"
            error={formErrors.species}
            required={true}
          />
          
          <SearchableDropdown
            options={availableBreeds}
            value={formData.breed}
            onChange={(value) => handleDropdownChange('breed', value)}
            placeholder={formData.species ? "Select breed" : "Select pet type first"}
            label="Breed"
            error={formErrors.breed}
            required={true}
            className={!formData.species ? "bg-gray-50 cursor-not-allowed" : ""}
          />
          
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
