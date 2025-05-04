// ExaminationList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchExaminations, 
  deleteExamination 
} from './examinationSlice';
import { ExaminationFilter, Examination } from './examinationService';
import ExaminationFilters from './ExaminationFilters';
import ExaminationDetailModal from './ExaminationDetailModal';
import NewExaminationModal from './NewExaminationModal';
import { AppDispatch } from '../../../../store';
import { RootState } from '../../../../store';

const ExaminationList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { examinations, loading, error, totalCount } = useSelector(
    (state: RootState) => state.examinations
  );
  
  // State for modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedExaminationId, setSelectedExaminationId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State for auto-starting examination from pet records
  const [initialPetId, setInitialPetId] = useState<string | null>(null);
  
  // Add state to prevent repeated API calls when there's an error
  const [apiErrorCount, setApiErrorCount] = useState(0);
  const [hasApiError, setHasApiError] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState<ExaminationFilter>({
    limit: 10,
    offset: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = filters.limit || 10;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Load examinations when component mounts or filters change, with error handling
  const fetchData = useCallback(async () => {
    // If we've had multiple consecutive errors, don't keep trying
    if (apiErrorCount > 3) {
      setHasApiError(true);
      return;
    }

    try {
      await dispatch(fetchExaminations(filters)).unwrap();
      // Reset error counter on successful fetch
      setApiErrorCount(0);
      setHasApiError(false);
    } catch (err) {
      console.error('Error fetching examinations:', err);
      setApiErrorCount(prev => prev + 1);
      if (apiErrorCount + 1 > 3) {
        setHasApiError(true);
      }
    }
  }, [dispatch, filters, apiErrorCount]);

  useEffect(() => {
    // Only fetch if we haven't hit the error threshold
    if (!loading.list && !hasApiError) {
      fetchData();
    }
  }, [fetchData, hasApiError]);
  
  // Check for pet ID in localStorage (from PetRecords component)
  useEffect(() => {
    // First check for petId from localStorage
    const petId = localStorage.getItem('startExamForPet');
    
    if (petId) {
      console.log('Found pet ID in localStorage:', petId);
      setInitialPetId(petId);
      setShowNewModal(true);
      
      // Remove from localStorage to prevent re-opening on refresh
      localStorage.removeItem('startExamForPet');
    }
    
    // Clean URL by removing any petId parameter from URL without refreshing the page
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('petId')) {
      currentUrl.searchParams.delete('petId');
      window.history.replaceState({}, '', currentUrl);
    }
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: ExaminationFilter) => {
    setCurrentPage(1);
    setFilters({
      ...newFilters,
      offset: 0,
      limit: pageSize
    });
    // Reset error state when filters change
    setHasApiError(false);
    setApiErrorCount(0);
  };
  
  // Manual retry function
  const handleRetry = () => {
    setHasApiError(false);
    setApiErrorCount(0);
    fetchData();
  };
  
  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters({
      ...filters,
      offset: (page - 1) * pageSize
    });
  };
  
  // Open examination details modal
  const handleViewDetails = (examinationId: number) => {
    setSelectedExaminationId(examinationId);
    setShowDetailModal(true);
  };
  
  // Delete examination
  const handleDelete = (examinationId: number) => {
    setSelectedExaminationId(examinationId);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (selectedExaminationId) {
      dispatch(deleteExamination(selectedExaminationId))
        .unwrap()
        .then(() => {
          setShowDeleteModal(false);
        })
        .catch(err => {
          console.error('Delete failed:', err);
        });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Status badge colors
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'started': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800'
    };
    
    const statusTextMap: { [key: string]: string } = {
      'started': 'Started',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusTextMap[status] || status}
      </span>
    );
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Examinations</h2>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          onClick={() => setShowNewModal(true)}
        >
          New Examination
        </button>
      </div>
      
      <ExaminationFilters onFilterChange={handleFilterChange} />
      
      {/* Show API error with retry button */}
      {hasApiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <div>
            <p className="font-medium">Unable to load examinations</p>
            <p className="text-sm">There was a problem connecting to the server.</p>
          </div>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Show regular error message if it's not a connection issue */}
      {error && !hasApiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading.list && !hasApiError ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : examinations.length === 0 && !hasApiError ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          No examination records found.
        </div>
      ) : !hasApiError && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinarian</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examinations.map((examination: Examination) => (
                  <tr key={examination.examination_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{examination.pet_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examination.pet_species} - {examination.pet_breed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examination.veterinarian_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(examination.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(examination.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={() => handleViewDetails(examination.examination_id)}
                      >
                        Details
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(examination.examination_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 mx-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 mx-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show only 5 pages with current page in the middle
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 mx-1 rounded ${pageNum === currentPage ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 3 || 
                    pageNum === currentPage + 3
                  ) {
                    return <span key={`ellipsis-${pageNum}`} className="px-1">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 mx-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 mx-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Last
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Examination Deletion</h3>
            <p className="text-gray-700 mb-2">Are you sure you want to delete this examination record?</p>
            <p className="text-red-600 text-sm font-medium mb-4">
              Note: Examinations with linked diagnoses cannot be deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Examination Detail Modal */}
      {selectedExaminationId && (
        <ExaminationDetailModal
          examinationId={selectedExaminationId}
          show={showDetailModal}
          onHide={() => {
            setShowDetailModal(false);
            setSelectedExaminationId(null);
          }}
        />
      )}
      
      {/* New Examination Modal */}
      <NewExaminationModal
        show={showNewModal}
        onHide={() => {
          setShowNewModal(false);
          setInitialPetId(null);
        }}
        onExaminationCreated={() => {
          // Reset error state on successful creation
          setHasApiError(false);
          setApiErrorCount(0);
          dispatch(fetchExaminations(filters));
        }}
        initialPetId={initialPetId ? parseInt(initialPetId) : undefined}
      />
    </div>
  );
};

export default ExaminationList;