import React, { useState } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  createStandardDiagnosis, 
  updateStandardDiagnosis
} from './DiagnosisSlice';
import { StandardDiagnosis, StandardDiagnosisFormData } from './diagnosisService';
import { FaTimes, FaQuestionCircle } from 'react-icons/fa';

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
  const user = useAppSelector(state => state.auth.user);
  
  const [formData, setFormData] = useState<StandardDiagnosisFormData>({
    name: diagnosis?.name || '',
    species: diagnosis?.species || '',
    category: diagnosis?.category || '',
    description: diagnosis?.description || '',
    is_active: diagnosis?.is_active !== false, // Default to true if not specified
    code: diagnosis?.code
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
      // Update existing diagnosis - now uses ID or code depending on what's available
      if (diagnosis.diagnosis_id) {
        // Use ID-based update
        dispatch(updateStandardDiagnosis({
          id: diagnosis.diagnosis_id,
          diagnosisData: formData
        })).then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            onSuccess();
          }
        });
      } else {
        // Fallback to code-based update for backward compatibility
        dispatch(updateStandardDiagnosis({
          code: diagnosis.code,
          diagnosisData: formData
        })).then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            onSuccess();
          }
        });
      }
    } else {
      // Create new diagnosis - veterinarian_id will be set by the backend
      dispatch(createStandardDiagnosis(formData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          onSuccess();
        }
      });
    }
  };

  // Check if user can edit this diagnosis (only custom ones or admins can edit system ones)
  const canEditDiagnosis = (): boolean => {
    if (!diagnosis) return true; // New diagnoses can always be created
    
    // If it's a veterinarian's custom diagnosis, they can edit it
    if (diagnosis.veterinarian_id) return true;
    
    // If it's a system diagnosis, only admins can edit it
    return user?.user_type === 'admin';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {diagnosis ? 'Edit Diagnosis Template' : 'New Diagnosis Template'}
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
            {/* Diagnosis Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Diagnosis Code*
                <div className="relative ml-2 group">
                  <div className="cursor-help">
                    <FaQuestionCircle className="text-gray-400 w-4 h-4" />
                  </div>
                  <div className="invisible group-hover:visible absolute z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg ml-2 top-0 left-full">
                    A unique code for this diagnosis template. This will be used as a reference when creating diagnoses.
                  </div>
                </div>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code || ''}
                onChange={handleChange}
                disabled={!!diagnosis}
                className={`block w-full px-3 py-2 border ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  !!diagnosis ? 'bg-gray-100' : ''
                }`}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
              {!!diagnosis && (
                <p className="mt-1 text-xs text-gray-500">
                  Diagnosis template code cannot be changed after creation.
                </p>
              )}
            </div>
            
            {/* Diagnosis Name */}
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
                <option value="">Select species</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="rodent">Rodent</option>
                <option value="reptile">Reptile</option>
                <option value="fish">Fish</option>
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
                placeholder="e.g., Cardiac, Respiratory, Digestive, etc."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_active" className="font-medium text-gray-700">Active</label>
                <p className="text-gray-500">Inactive templates will not appear in search results when creating diagnoses.</p>
              </div>
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
            disabled={loading || !canEditDiagnosis()}
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
