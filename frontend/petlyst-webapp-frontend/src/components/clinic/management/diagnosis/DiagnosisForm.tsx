import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  createDiagnosis, 
  updateDiagnosis,
  getStandardDiagnoses
} from './DiagnosisSlice';
import { Diagnosis, DiagnosisData, StandardDiagnosis } from './diagnosisService';
import { FaTimes, FaSearch } from 'react-icons/fa';

interface DiagnosisFormProps {
  diagnosis: Diagnosis | null;
  examinationId?: number;
  petId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  diagnosis,
  examinationId,
  petId,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { loading, standardDiagnoses } = useAppSelector(state => state.diagnoses);
  const isEdit = !!diagnosis;
  
  const [formData, setFormData] = useState<DiagnosisData>({
    examination_id: examinationId || diagnosis?.examination_id || 0,
    diagnosis_type: diagnosis?.diagnosis_type || 'custom',
    diagnosis_code: diagnosis?.diagnosis_code || '',
    diagnosis_name: diagnosis?.diagnosis_name || '',
    diagnosis_date: diagnosis?.diagnosis_date ? new Date(diagnosis.diagnosis_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: diagnosis?.description || '',
    severity: diagnosis?.severity || 'mild',
    notes: diagnosis?.notes || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [standardDiagnosisSearch, setStandardDiagnosisSearch] = useState('');
  const [filteredStandardDiagnoses, setFilteredStandardDiagnoses] = useState<StandardDiagnosis[]>([]);
  const [showStandardDropdown, setShowStandardDropdown] = useState(false);
  
  // Fetch standard diagnoses
  useEffect(() => {
    if (formData.diagnosis_type === 'custom') {
      dispatch(getStandardDiagnoses(undefined));
    }
  }, [dispatch, formData.diagnosis_type]);
  
  // Filter standard diagnoses based on search term
  useEffect(() => {
    if (standardDiagnoses.length > 0 && standardDiagnosisSearch) {
      const filtered = standardDiagnoses.filter(sd => 
        sd.name.toLowerCase().includes(standardDiagnosisSearch.toLowerCase()) ||
        (sd.code && sd.code.toLowerCase().includes(standardDiagnosisSearch.toLowerCase()))
      );
      setFilteredStandardDiagnoses(filtered);
    } else {
      setFilteredStandardDiagnoses(standardDiagnoses);
    }
  }, [standardDiagnosisSearch, standardDiagnoses]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // When diagnosis type changes, reset related fields
    if (name === 'diagnosis_type') {
      if (value === 'custom') {
        setShowStandardDropdown(true);
      } else {
        setShowStandardDropdown(false);
      }
    }
  };
  
  // Select a standard diagnosis
  const selectStandardDiagnosis = (std: StandardDiagnosis) => {
    setFormData({
      ...formData,
      diagnosis_code: std.code,
      diagnosis_name: std.name,
      description: std.description || formData.description
    });
    setShowStandardDropdown(false);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.diagnosis_name.trim()) {
      newErrors.diagnosis_name = 'Diagnosis name is required';
    }
    
    if (!formData.examination_id) {
      newErrors.examination_id = 'Examination is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (isEdit && diagnosis) {
      dispatch(updateDiagnosis({
        diagnosisId: diagnosis.diagnosis_id,
        diagnosisData: formData
      })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          onSuccess();
        }
      });
    } else {
      dispatch(createDiagnosis(formData)).then((result) => {
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
            {isEdit ? 'Edit Diagnosis' : 'New Diagnosis'}
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
            {/* Diagnosis Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Type*
              </label>
              <select
                name="diagnosis_type"
                value={formData.diagnosis_type}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="standard">Standard</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            {/* Standard Diagnosis Selection */}
            {formData.diagnosis_type === 'custom' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Standard Diagnosis as Template
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={standardDiagnosisSearch}
                    onChange={(e) => setStandardDiagnosisSearch(e.target.value)}
                    onFocus={() => setShowStandardDropdown(true)}
                    placeholder="Search standard diagnoses..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                </div>
                
                {showStandardDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-300">
                    {filteredStandardDiagnoses.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No matching standard diagnoses found
                      </div>
                    )}
                    {filteredStandardDiagnoses.map((std) => (
                      <div
                        key={std.code}
                        onClick={() => selectStandardDiagnosis(std)}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                      >
                        <div className="flex items-center">
                          <span className="font-medium block truncate">
                            {std.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 block">
                          Code: {std.code} | Species: {std.species}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Diagnosis Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Name*
              </label>
              <input
                type="text"
                name="diagnosis_name"
                value={formData.diagnosis_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.diagnosis_name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.diagnosis_name && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnosis_name}</p>
              )}
            </div>
            
            {/* Diagnosis Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Code
              </label>
              <input
                type="text"
                name="diagnosis_code"
                value={formData.diagnosis_code}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Examination ID - Hidden if passed as prop */}
            {!examinationId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Examination ID*
                </label>
                <input
                  type="number"
                  name="examination_id"
                  value={formData.examination_id || ''}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.examination_id ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.examination_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.examination_id}</p>
                )}
              </div>
            )}
            
            {/* Diagnosis Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Date
              </label>
              <input
                type="date"
                name="diagnosis_date"
                value={formData.diagnosis_date}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                name="severity"
                value={formData.severity || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
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
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
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

export default DiagnosisForm;
