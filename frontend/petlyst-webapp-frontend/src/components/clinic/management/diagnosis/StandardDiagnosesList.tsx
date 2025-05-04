import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  getStandardDiagnoses,
  deleteStandardDiagnosis,
  resetDiagnosisState
} from './DiagnosisSlice';
import { StandardDiagnosis } from './diagnosisService';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import StandardDiagnosisForm from './StandardDiagnosisForm';

const StandardDiagnosesList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { standardDiagnoses, loading, error, success } = useAppSelector(state => state.diagnoses);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDiagnoses, setFilteredDiagnoses] = useState<StandardDiagnosis[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<StandardDiagnosis | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string>('');
  
  // Load standard diagnoses
  useEffect(() => {
    dispatch(getStandardDiagnoses(undefined));
  }, [dispatch]);
  
  // Filter diagnoses based on search term and species
  useEffect(() => {
    if (standardDiagnoses.length > 0) {
      let filtered = standardDiagnoses;
      
      // Apply species filter
      if (speciesFilter) {
        filtered = filtered.filter(diag => diag.species === speciesFilter);
      }
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter(diag => 
          diag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diag.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (diag.category && diag.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setFilteredDiagnoses(filtered);
    } else {
      setFilteredDiagnoses([]);
    }
  }, [searchTerm, standardDiagnoses, speciesFilter]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle species filter change
  const handleSpeciesFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeciesFilter(e.target.value);
  };
  
  // Open form to add new diagnosis
  const handleAddNew = () => {
    setSelectedDiagnosis(null);
    setShowForm(true);
  };
  
  // Open form to edit diagnosis
  const handleEdit = (diagnosis: StandardDiagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setShowForm(true);
  };
  
  // Open delete confirmation
  const handleDeleteConfirm = (code: string) => {
    setConfirmDelete(code);
  };
  
  // Delete diagnosis
  const handleDelete = () => {
    if (confirmDelete) {
      dispatch(deleteStandardDiagnosis(confirmDelete));
      setConfirmDelete(null);
    }
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
  };
  
  // Track success state for refetching
  useEffect(() => {
    if (success) {
      dispatch(getStandardDiagnoses(undefined));
      dispatch(resetDiagnosisState());
    }
  }, [success, dispatch]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Standard Diagnoses</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaPlus className="mr-2" />
          New Standard Diagnosis
        </button>
      </div>
      
      {/* Search and filter section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search diagnoses..."
              className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
          </div>
          
          <div className="sm:w-60">
            <select
              value={speciesFilter}
              onChange={handleSpeciesFilterChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="reptile">Reptile</option>
              <option value="small_mammal">Small Mammal</option>
              <option value="large_animal">Large Animal</option>
              <option value="exotic">Exotic</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* No diagnoses state */}
      {!loading && filteredDiagnoses.length === 0 && (
        <div className="bg-white p-6 text-center rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No standard diagnoses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || speciesFilter 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new standard diagnosis.'}
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2" />
              New Standard Diagnosis
            </button>
          </div>
        </div>
      )}
      
      {/* Diagnoses table */}
      {!loading && filteredDiagnoses.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Code</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Species</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDiagnoses.map((diagnosis) => (
                <tr key={diagnosis.code} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {diagnosis.code}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {diagnosis.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {diagnosis.species}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {diagnosis.category || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      diagnosis.is_active !== false
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {diagnosis.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(diagnosis)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(diagnosis.code)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Form modal */}
      {showForm && (
        <StandardDiagnosisForm
          diagnosis={selectedDiagnosis}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
      
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center text-red-600 mb-4">
              <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-xl font-bold">Delete Standard Diagnosis</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this standard diagnosis? This may affect diagnoses that use this code.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardDiagnosesList;