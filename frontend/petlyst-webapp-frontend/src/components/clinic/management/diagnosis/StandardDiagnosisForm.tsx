import React, { useState } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  createStandardDiagnosis,
  updateStandardDiagnosis
} from './DiagnosisSlice';
import { StandardDiagnosis, StandardDiagnosisFormData } from './diagnosisService';
import { FaTimes } from 'react-icons/fa';

interface StandardDiagnosisFormProps {
  diagnosis: StandardDiagnosis | null;
  onClose: () => void;
  onSuccess: () => void;
}

const StandardDiagnosisForm: React.FC<StandardDiagnosisFormProps> = ({
  diagnosis,
  onClose,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
  const { loading, standardDiagnoses } = useAppSelector(state => state.diagnoses);
  const isEdit = !!diagnosis;
  
  const [formData, setFormData] = useState<Omit<StandardDiagnosisFormData, 'code'>>({
    name: diagnosis?.name || '',
    description: diagnosis?.description || '',
    category: diagnosis?.category || '',
    species: diagnosis?.species || '',
    is_active: diagnosis?.is_active !== false // Default to true if undefined
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Generate a unique code based on species, category and timestamp
  const generateUniqueCode = (): string => {
    // Get species prefix (first 3 letters)
    const speciesPrefix = formData.species ? formData.species.substring(0, 3).toUpperCase() : 'GEN';
    
    // Get category prefix (first 3 letters or 'GEN' if empty)
    const categoryPrefix = formData.category 
      ? formData.category.substring(0, 3).toUpperCase() 
      : 'GEN';
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    
    // Create unique code
    return `${speciesPrefix}-${categoryPrefix}-${timestamp}`;
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.species.trim()) {
      newErrors.species = 'Species is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (isEdit && diagnosis) {
      dispatch(updateStandardDiagnosis({
        code: diagnosis.code,
        diagnosisData: formData
      })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          onSuccess();
        }
      });
    } else {
      // Generate a unique code for new diagnosis
      const uniqueCode = generateUniqueCode();
      
      // Create the complete form data with generated code
      const completeFormData: StandardDiagnosisFormData = {
        code: uniqueCode,
        ...formData
      };
      
      dispatch(createStandardDiagnosis(completeFormData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          onSuccess();
        }
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? 'Edit Standard Diagnosis' : 'New Standard Diagnosis'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow p-6">
          <div className="space-y-6">
            {/* Show code only when editing */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={diagnosis?.code || ''}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Diagnosis code cannot be changed</p>
              </div>
            )}
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name*
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            {/* Species */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species*
              </label>
              <select
                name="species"
                value={formData.species}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.species ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select Species</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="reptile">Reptile</option>
                <option value="small_mammal">Small Mammal</option>
                <option value="large_animal">Large Animal</option>
                <option value="exotic">Exotic</option>
                <option value="other">Other</option>
              </select>
              {errors.species && (
                <p className="mt-1 text-sm text-red-600">{errors.species}</p>
              )}
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Category helps in code generation and organizing diagnoses</p>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Is Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
        </form>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardDiagnosisForm;
