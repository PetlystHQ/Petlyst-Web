import React, { useState, useEffect } from 'react';
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
  const { loading } = useAppSelector(state => state.diagnoses);
  
  const [formData, setFormData] = useState<StandardDiagnosisFormData>({
    name: diagnosis?.name || '',
    species: diagnosis?.species || '',
    category: diagnosis?.category || '',
    description: diagnosis?.description || '',
    is_active: diagnosis?.is_active !== false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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
    
    if (diagnosis) {
      // Update existing diagnosis
      dispatch(updateStandardDiagnosis({
        code: diagnosis.code,
        diagnosisData: formData
      })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          onSuccess();
        }
      });
    } else {
      // Create new diagnosis
      dispatch(createStandardDiagnosis(formData)).then((result) => {
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
            {diagnosis ? 'Edit Standard Diagnosis' : 'New Standard Diagnosis'}
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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Name*
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
                <option value="">Select a species</option>
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
                placeholder="e.g., Respiratory, Cardiac, Dermatological"
              />
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
            
            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
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
            {loading ? 'Saving...' : diagnosis ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardDiagnosisForm;
