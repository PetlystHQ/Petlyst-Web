import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  listDiagnoses, 
  getDiagnosis, 
  deleteDiagnosis,
  resetDiagnosisState,
  getExaminationDiagnoses,
  getPetDiagnoses
} from './DiagnosisSlice';
import { Diagnosis, DiagnosisFilters } from './diagnosisService';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaEye, FaPlus, FaFilter, FaSearch, FaClipboardList, FaListAlt } from 'react-icons/fa';
import DiagnosisDetailModal from './DiagnosisDetailModal';
import DiagnosisForm from './DiagnosisForm';
import StandardDiagnosesList from './StandardDiagnosesList';

interface DiagnosisListProps {
  filters?: DiagnosisFilters;
  examinationId?: number;
  petId?: number;
  onViewDiagnosis?: (diagnosis: Diagnosis) => void;
  onEditDiagnosis?: (diagnosis: Diagnosis) => void;
}

const DiagnosisList: React.FC<DiagnosisListProps> = ({ 
  filters = {}, 
  examinationId,
  petId: propPetId,
  onViewDiagnosis,
  onEditDiagnosis
}) => {
  const dispatch = useAppDispatch();
  const { diagnoses, loading, error, totalCount, currentDiagnosis, success } = useAppSelector(state => state.diagnoses);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'diagnoses' | 'standard'>('diagnoses');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters, setLocalFilters] = useState<DiagnosisFilters>({
    ...filters,
    examination_id: examinationId,
    pet_id: propPetId
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Rename the prop petId to propPetId to avoid confusion
  const [petId, setPetId] = useState<number | undefined>(propPetId);
  
  // Fetch diagnoses function
  const fetchDiagnoses = useCallback(() => {
    if (examinationId) {
      dispatch(getExaminationDiagnoses(examinationId));
    } else if (petId) {
      dispatch(getPetDiagnoses(petId));
    } else {
      const queryParams: DiagnosisFilters = {
        ...localFilters,
        limit,
        offset
      };
      dispatch(listDiagnoses(queryParams));
    }
  }, [dispatch, examinationId, petId, localFilters, limit, offset]);
  
  // Initial data load
  useEffect(() => {
    if (activeTab === 'diagnoses') {
      fetchDiagnoses();
    }
  }, [fetchDiagnoses, activeTab]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newOffset = (page - 1) * limit;
    setOffset(newOffset);
  };
  
  // Handle diagnosis view
  const handleViewDiagnosis = (diagnosis: Diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setDetailModalOpen(true);
    dispatch(getDiagnosis(diagnosis.diagnosis_id));
    
    if (onViewDiagnosis) {
      onViewDiagnosis(diagnosis);
    }
  };
  
  // Handle diagnosis edit
  const handleEditDiagnosis = (diagnosis: Diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setIsEdit(true);
    setFormModalOpen(true);
    
    if (onEditDiagnosis) {
      onEditDiagnosis(diagnosis);
    }
  };
  
  // Handle diagnosis delete confirmation
  const openDeleteConfirmation = (diagnosisId: number) => {
    setConfirmDelete(diagnosisId);
  };
  
  // Handle diagnosis deletion
  const handleDeleteDiagnosis = () => {
    if (confirmDelete) {
      dispatch(deleteDiagnosis(confirmDelete))
        .unwrap()
        .then(() => {
          setConfirmDelete(null);
          // Show success message
          setErrors({});
          // Refresh the list
          fetchDiagnoses();
        })
        .catch((error) => {
          console.error('Delete diagnosis error:', error);
          
          // Set error message and keep dialog open
          setErrors({
            delete: "Failed to delete diagnosis. Please try again later."
          });
          
          // Don't close the delete confirmation dialog so they can try again
          // setConfirmDelete(null);
        });
    }
  };
  
  // Handle new diagnosis
  const handleAddDiagnosis = () => {
    setSelectedDiagnosis(null);
    setIsEdit(false);
    setFormModalOpen(true);
  };
  
  // Handle modal close
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedDiagnosis(null);
  };
  
  // Listen for openDiagnosisForm event from ManagementDashboard
  useEffect(() => {
    const handleOpenDiagnosisForm = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventPetId = customEvent.detail?.petId;
      const examinationId = customEvent.detail?.examinationId;
      
      console.log('DiagnosisList: Received openDiagnosisForm event with pet ID:', eventPetId);
      console.log('DiagnosisList: Received openDiagnosisForm event with examination ID:', examinationId);
      
      if (eventPetId) {
        // Update the component's petId state
        setPetId(Number(eventPetId));
        
        // Store in localStorage as fallback
        localStorage.setItem('currentPetId', eventPetId.toString());
        
        // Open the form
        setSelectedDiagnosis(null);
        setIsEdit(false);
        setFormModalOpen(true);
        
        console.log('DiagnosisList: Opened diagnosis form for pet ID:', eventPetId);
      }
    };
    
    // Add event listener for the original event
    window.addEventListener('openDiagnosisForm', handleOpenDiagnosisForm);
    
    // Listen for startDiagnosis event from ExaminationList
    const handleStartDiagnosis = (event: Event) => {
      const customEvent = event as CustomEvent;
      const petId = customEvent.detail?.petId;
      const examinationId = customEvent.detail?.examinationId;
      
      console.log('DiagnosisList: Received startDiagnosis event with petId:', petId, 'and examinationId:', examinationId);
      
      if (petId) {
        // Update states
        setPetId(Number(petId));
        localStorage.setItem('currentPetId', petId.toString());
        
        // IMPORTANT: If we have an examinationId, store it in localStorage for DiagnosisForm to use
        if (examinationId) {
          console.log('Setting examination ID in localStorage:', examinationId);
          localStorage.setItem('examinationIdForDiagnosis', examinationId.toString());
        }
        
        // Open the form immediately
        setSelectedDiagnosis(null);
        setIsEdit(false);
        setFormModalOpen(true);
        
        console.log('DiagnosisList: Opened diagnosis form from examination with form modal state:', formModalOpen);
      }
    };
    
    // Add event listener for the startDiagnosis event
    window.addEventListener('startDiagnosis', handleStartDiagnosis as EventListener);
    
    // Try to get petId from localStorage if not provided via props
    if (!propPetId) {
      const storedPetId = localStorage.getItem('currentPetId');
      if (storedPetId) {
        console.log('DiagnosisList: Found petId in localStorage:', storedPetId);
        setPetId(Number(storedPetId));
      }
    }
    
    return () => {
      window.removeEventListener('openDiagnosisForm', handleOpenDiagnosisForm);
      window.removeEventListener('startDiagnosis', handleStartDiagnosis as EventListener);
    };
  }, [propPetId]);
  
  // Handle form modal close
  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedDiagnosis(null);
    setIsEdit(false);
    
    // Clear petId if it was set from an event and not from props
    if (petId && !propPetId) {
      setPetId(undefined);
    }
  };
  
  // Handle form submission success
  const handleFormSuccess = () => {
    setFormModalOpen(false);
    fetchDiagnoses();
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    setOffset(0);
    setFilterOpen(false);
    fetchDiagnoses();
  };
  
  // Reset filters
  const resetFilters = () => {
    setLocalFilters({
      examination_id: examinationId,
      pet_id: propPetId
    });
    setSearchTerm('');
    setCurrentPage(1);
    setOffset(0);
    setFilterOpen(false);
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setLocalFilters({
      ...localFilters,
      diagnosis_name: e.target.value ? e.target.value : undefined
    });
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  // Handle filter changes
  const handleFilterChange = (key: keyof DiagnosisFilters, value: any) => {
    setLocalFilters({
      ...localFilters,
      [key]: value
    });
  };
  
  // Track success state for refetching
  useEffect(() => {
    if (success) {
      fetchDiagnoses();
      dispatch(resetDiagnosisState());
    }
  }, [success, dispatch, fetchDiagnoses]);
  
  // Format severity for display
  const formatSeverity = (severity: string | undefined) => {
    if (!severity) return null;
    
    switch (severity) {
      case 'mild':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">Mild</span>;
      case 'moderate':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Moderate</span>;
      case 'severe':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">Severe</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">{severity}</span>;
    }
  };
  
  // Tab navigation component
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <button
          onClick={() => setActiveTab('diagnoses')}
          className={`${
            activeTab === 'diagnoses'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          aria-current={activeTab === 'diagnoses' ? 'page' : undefined}
        >
          <FaClipboardList className="mr-2" />
          Patient Diagnoses
        </button>
        <button
          onClick={() => setActiveTab('standard')}
          className={`${
            activeTab === 'standard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          aria-current={activeTab === 'standard' ? 'page' : undefined}
        >
          <FaListAlt className="mr-2" />
          Diagnoses Template
        </button>
      </nav>
    </div>
  );
  
  // Render the diagnoses content
  const renderDiagnosesContent = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Diagnoses</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
          <button
            onClick={handleAddDiagnosis}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            New Diagnosis
          </button>
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex mb-4">
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
          <button
            type="submit"
            className="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
        
        {/* Advanced filters */}
        {filterOpen && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 animate-slide-down">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={localFilters.diagnosis_type || ''}
                  onChange={(e) => handleFilterChange('diagnosis_type', e.target.value || undefined)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="standard">Standard</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={localFilters.severity || ''}
                  onChange={(e) => handleFilterChange('severity', e.target.value || undefined)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Severities</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={localFilters.start_date || ''}
                    onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={localFilters.end_date || ''}
                    onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
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
      
      {/* Delete error message */}
      {errors.delete && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errors.delete}
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
      {!loading && diagnoses.length === 0 && (
        <div className="bg-white p-6 text-center rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No diagnoses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new diagnosis.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddDiagnosis}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2" />
              New Diagnosis
            </button>
          </div>
        </div>
      )}
      
      {/* Diagnoses table */}
      {!loading && diagnoses.length > 0 && (
        <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Diagnosis</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {diagnoses.map((diagnosis) => (
                <tr key={diagnosis.diagnosis_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {diagnosis.pet_name ? `${diagnosis.pet_name} - ` : ''}{diagnosis.diagnosis_name}
                        </div>
                        {diagnosis.diagnosis_code && (
                          <div className="text-gray-500">Code: {diagnosis.diagnosis_code}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      diagnosis.diagnosis_type === 'standard' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {diagnosis.diagnosis_type === 'standard' ? 'Standard' : 'Custom'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {diagnosis.diagnosis_date 
                      ? format(new Date(diagnosis.diagnosis_date), 'MMM dd, yyyy')
                      : 'N/A'
                    }
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatSeverity(diagnosis.severity)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewDiagnosis(diagnosis)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditDiagnosis(diagnosis)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openDeleteConfirmation(diagnosis.diagnosis_id)}
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
      
      {/* Pagination */}
      {!loading && diagnoses.length > 0 && totalCount > limit && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage * limit >= totalCount}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage * limit >= totalCount
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{offset + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(offset + limit, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  } border border-gray-300 focus:z-20`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers - simplified for brevity */}
                {Array.from(
                  { length: Math.ceil(totalCount / limit) },
                  (_, i) => i + 1
                )
                  .filter(page => {
                    // Show current page, first page, last page, and pages around current
                    const lastPage = Math.ceil(totalCount / limit);
                    return (
                      page === 1 ||
                      page === lastPage ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-white">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 border-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 focus:z-20'
                        } border focus:outline-offset-0`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage * limit >= totalCount}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                    currentPage * limit >= totalCount
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  } border border-gray-300 focus:z-20`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        {/* Tab navigation */}
        <TabNavigation />
        
        {/* Tab content */}
        {activeTab === 'diagnoses' ? (
          renderDiagnosesContent()
        ) : (
          <StandardDiagnosesList />
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center text-red-600 mb-4">
              <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-xl font-bold">Delete Diagnosis</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this diagnosis? This action cannot be undone.
            </p>
            
            {errors.delete && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p className="text-sm font-medium">{errors.delete}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmDelete(null);
                  setErrors({});
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDiagnosis}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail modal */}
      {detailModalOpen && selectedDiagnosis && (
        <DiagnosisDetailModal
          diagnosis={selectedDiagnosis}
          onClose={handleCloseDetailModal}
          onEdit={handleEditDiagnosis}
        />
      )}
      
      {/* Form modal */}
      {formModalOpen && (
        <DiagnosisForm
          diagnosis={isEdit ? selectedDiagnosis : null}
          examinationId={examinationId}
          petId={petId}
          onClose={handleCloseFormModal}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
};

export default DiagnosisList;
