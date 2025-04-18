import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import axiosInstance from '../../../utils/axiosConfig';
import PET_TYPES_AND_BREEDS, { getBreedsByPetTypeName, PetBreed } from '../../../constants/PetTypesAndBreeds';

// Pet form data interface
interface PetFormData {
  name: string;
  species: string;
  breed: string;
  birth_day?: string;
  birth_month?: string;
  birth_year?: string;
  gender: string;
  photo?: string | File;
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
    pet_birth_date?: string;
    pet_birth_day?: number;
    pet_birth_month?: number;
    pet_birth_year?: number;
    pet_gender: string;
    pet_owner_id: string;
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
  label?: string;
  error?: string;
  className?: string;
  required?: boolean;
  showLabelInside?: boolean;
  dropdownPosition?: 'bottom' | 'top';
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  className,
  required = false,
  showLabelInside = false,
  dropdownPosition = 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
    <div className="relative" ref={dropdownRef}>
      {label && !showLabelInside && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && '*'}
        </label>
      )}
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
          placeholder={showLabelInside && label ? `${label}${required ? '*' : ''}` : placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-gray-400 transform transition-transform ${
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
        <div 
          className={`absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-48 overflow-auto ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full'
          }`}
          style={{ maxHeight: '200px' }}
        >
          <ul className="py-0.5">
            {filteredOptions.map((option, index) => (
              <li
                key={option.id}
                className={`px-3 py-2 cursor-pointer text-sm ${
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
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
};

// Generate options for days, months, and years
const generateDayOptions = () => {
  const days = [];
  for (let i = 1; i <= 31; i++) {
    days.push({ id: i.toString(), name: i.toString() });
  }
  return days;
};

const generateMonthOptions = () => {
  return [
    { id: '1', name: 'January' },
    { id: '2', name: 'February' },
    { id: '3', name: 'March' },
    { id: '4', name: 'April' },
    { id: '5', name: 'May' },
    { id: '6', name: 'June' },
    { id: '7', name: 'July' },
    { id: '8', name: 'August' },
    { id: '9', name: 'September' },
    { id: '10', name: 'October' },
    { id: '11', name: 'November' },
    { id: '12', name: 'December' }
  ];
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // Allow pets up to 30 years old
  for (let i = currentYear; i >= currentYear - 30; i--) {
    years.push({ id: i.toString(), name: i.toString() });
  }
  return years;
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
    birth_day: '',
    birth_month: '',
    birth_year: '',
    gender: '',
    photo: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Get available breeds based on selected species
  const availableBreeds = useMemo<PetBreed[]>(() => {
    if (!formData.species) return [];
    return getBreedsByPetTypeName(formData.species);
  }, [formData.species]);

  // Day, month, year options
  const dayOptions = useMemo(() => generateDayOptions(), []);
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const yearOptions = useMemo(() => generateYearOptions(), []);

  // Add overlay locking when modal is open
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Force window to top
      window.scrollTo(0, 0);
      
      // Add margin to body to prevent content shift
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
      
      // Prevent touchmove events on mobile
      document.addEventListener('touchmove', preventScroll, { passive: false });
    }
    
    return () => {
      // Restore scroll when modal closes
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('touchmove', preventScroll);
    }
  }, [isOpen]);
  
  // Prevent scroll on touchmove
  const preventScroll = (e: TouchEvent) => {
    if (!modalRef.current?.contains(e.target as Node)) {
      e.preventDefault();
    }
  };

  // Parse date string or use individual fields
  const parseDateToComponents = (dateString?: string, day?: number, month?: number, year?: number) => {
    if (day && month && year) {
      return {
        day: day.toString(),
        month: month.toString(),
        year: year.toString()
      };
    } else if (dateString) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return {
            day: date.getDate().toString(),
            month: (date.getMonth() + 1).toString(),
            year: date.getFullYear().toString()
          };
        }
      } catch (e) {
        console.error("Failed to parse date:", e);
      }
    }
    return { day: '', month: '', year: '' };
  };

  // If editing, populate form with pet data
  useEffect(() => {
    if (mode === 'edit' && petToEdit) {
      const { day, month, year } = parseDateToComponents(
        petToEdit.pet_birth_date, 
        petToEdit.pet_birth_day, 
        petToEdit.pet_birth_month, 
        petToEdit.pet_birth_year
      );
      
      setFormData({
        name: petToEdit.pet_name,
        species: petToEdit.pet_type,
        breed: petToEdit.pet_breed,
        birth_day: day,
        birth_month: month,
        birth_year: year,
        gender: petToEdit.pet_gender,
        photo: petToEdit.pet_profile_photo
      });

      if (petToEdit.pet_profile_photo) {
        setPreviewUrl(petToEdit.pet_profile_photo);
      }
    } else {
      // Reset form when opening in add mode
      setFormData({
        name: '',
        species: '',
        breed: '',
        birth_day: '',
        birth_month: '',
        birth_year: '',
        gender: '',
        photo: ''
      });
      setPreviewUrl(null);
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

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear error if there was one
      if (formErrors.photo) {
        setFormErrors(prev => ({
          ...prev,
          photo: ''
        }));
      }
    }
  };

  // Handle removing image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const handleChooseImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = "Pet name is required";
    if (!formData.species.trim()) errors.species = "Pet type is required";
    if (!formData.breed.trim()) errors.breed = "Breed is required";
    if (!formData.gender) errors.gender = "Gender is required";
    
    // Date validation - All fields must be filled if any are filled
    const hasDay = !!formData.birth_day;
    const hasMonth = !!formData.birth_month;
    const hasYear = !!formData.birth_year;
    
    if ((hasDay || hasMonth || hasYear) && (!hasDay || !hasMonth || !hasYear)) {
      errors.birth_date = "Please provide a complete birth date (day, month, and year)";
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
      // TODO: In the future, implement actual file upload to S3
      // For now, we'll just use the previewUrl or existing photo URL
      
      // Map from form data to API expected format
      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birth_day: formData.birth_day ? parseInt(formData.birth_day) : null,
        birth_month: formData.birth_month ? parseInt(formData.birth_month) : null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        gender: formData.gender,
        photo: typeof formData.photo === 'string' ? formData.photo : previewUrl
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
          birth_day: '',
          birth_month: '',
          birth_year: '',
          gender: '',
          photo: ''
        });
        setPreviewUrl(null);
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

  // Render modal with Portal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl relative z-50 my-8 mx-auto overflow-hidden"
        style={{ height: 'auto', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-800">
            {mode === 'add' ? 'Add New Pet' : 'Edit Pet Information'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          <form onSubmit={handleSubmit}>
            {formErrors.submit && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-6">
                {formErrors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column: Photo upload area */}
              <div className="lg:col-span-4 bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Pet Photo</span>
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-grow flex flex-col items-center justify-center py-4">
                    {previewUrl ? (
                      <div className="text-center w-full">
                        <img 
                          src={previewUrl} 
                          alt="Pet preview" 
                          className="mx-auto h-40 w-40 object-cover rounded-lg border-2 border-gray-200" 
                        />
                        <button
                          type="button"
                          onClick={handleChooseImage}
                          className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                        >
                          Change Photo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center w-full">
                        <div className="mx-auto h-40 w-40 flex items-center justify-center bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                          <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <button
                          type="button"
                          onClick={handleChooseImage}
                          className="px-4 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                        >
                          Upload Photo
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Upload a clear photo of your pet. This helps veterinarians recognize your pet during appointments.
                  </p>
                </div>
              </div>

              {/* Right column: Form fields */}
              <div className="lg:col-span-8 space-y-5">
                {/* Pet name field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter pet name"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                
                {/* Type and Breed in 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type*</label>
                    <SearchableDropdown
                      options={PET_TYPES_AND_BREEDS.map(type => ({ id: type.id, name: type.name }))}
                      value={formData.species}
                      onChange={(value) => handleDropdownChange('species', value)}
                      placeholder="Select pet type"
                      error={formErrors.species}
                      required={true}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breed*</label>
                    <SearchableDropdown
                      options={availableBreeds}
                      value={formData.breed}
                      onChange={(value) => handleDropdownChange('breed', value)}
                      placeholder={formData.species ? "Select breed" : "Select pet type first"}
                      error={formErrors.breed}
                      required={true}
                      className={!formData.species ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
                
                {/* Birth date with improved layout - MOVED BEFORE GENDER */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Day</label>
                      <SearchableDropdown
                        options={dayOptions}
                        value={formData.birth_day || ''}
                        onChange={(value) => handleDropdownChange('birth_day', value)}
                        placeholder="Day"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month</label>
                      <SearchableDropdown
                        options={monthOptions}
                        value={formData.birth_month ? monthOptions.find(m => m.id === formData.birth_month)?.name || '' : ''}
                        onChange={(value) => {
                          const month = monthOptions.find(m => m.name === value)?.id || '';
                          handleDropdownChange('birth_month', month);
                        }}
                        placeholder="Month"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Year</label>
                      <SearchableDropdown
                        options={yearOptions}
                        value={formData.birth_year || ''}
                        onChange={(value) => handleDropdownChange('birth_year', value)}
                        placeholder="Year"
                      />
                    </div>
                  </div>
                  {formErrors.birth_date && <p className="text-red-500 text-xs mt-1">{formErrors.birth_date}</p>}
                </div>
                
                {/* Gender selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
                  <div className="flex space-x-4">
                    <label 
                      className={`flex-1 cursor-pointer rounded-md py-2 px-4 border transition-all ${
                        formData.gender === "Male" 
                          ? "bg-blue-100 border-blue-500" 
                          : "bg-white border-gray-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className={`font-medium text-sm ${formData.gender === "Male" ? "text-blue-800" : "text-gray-700"}`}>
                          Male
                        </span>
                        <input
                          type="radio"
                          id="gender-male"
                          name="gender"
                          value="Male"
                          checked={formData.gender === "Male"}
                          onChange={handleInputChange}
                          className="sr-only" // Hide the actual radio button
                        />
                      </div>
                    </label>
                    
                    <label 
                      className={`flex-1 cursor-pointer rounded-md py-2 px-4 border transition-all ${
                        formData.gender === "Female" 
                          ? "bg-pink-100 border-pink-500" 
                          : "bg-white border-gray-300 hover:bg-pink-50"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className={`font-medium text-sm ${formData.gender === "Female" ? "text-pink-800" : "text-gray-700"}`}>
                          Female
                        </span>
                        <input
                          type="radio"
                          id="gender-female"
                          name="gender"
                          value="Female"
                          checked={formData.gender === "Female"}
                          onChange={handleInputChange}
                          className="sr-only" // Hide the actual radio button
                        />
                      </div>
                    </label>
                  </div>
                  {formErrors.gender && <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? (mode === 'add' ? 'Adding...' : 'Saving...') : (mode === 'add' ? 'Add Pet' : 'Save Changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddEditPetModal;
