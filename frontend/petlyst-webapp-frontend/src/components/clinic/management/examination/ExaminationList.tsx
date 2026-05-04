import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  listExaminations, 
  getExamination, 
  deleteExamination,
  updateExaminationStatus,
  resetExaminationState
} from './examinationSlice';
import { Examination, ExaminationFilters } from './examinationService';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaEye, FaPlus, FaStethoscope } from 'react-icons/fa';
import ExaminationDetailModal from './ExaminationDetailModal';
import NewExaminationModal from './NewExaminationModal';
import axiosInstance from '../../../../utils/axiosConfig';

interface ExaminationListProps {
  filters?: ExaminationFilters;
  onViewExamination?: (examination: Examination) => void;
  onEditExamination?: (examination: Examination) => void;
}

const ExaminationList: React.FC<ExaminationListProps> = ({ 
  filters = {}, 
  onViewExamination,
  onEditExamination
}) => {
  const dispatch = useAppDispatch();
  const { examinations, loading, error, totalCount, currentExamination, success } = useAppSelector(state => state.examinations);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newExamModalOpen, setNewExamModalOpen] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState<Examination | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingAttempts, setLoadingAttempts] = useState(0);
  const [selectedPetId, setSelectedPetId] = useState<number | undefined>(undefined);
  const [modalJustOpened, setModalJustOpened] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>(undefined);
  
  // Add a loading lock to prevent multiple simultaneous API calls
  const loadingLockRef = useRef(false);
  
  // Reference to track if we've already processed localStorage
  const startExamChecked = useRef(false);
  // Reference to track API call timeouts
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // New state to track examinations with diagnoses
  const [examinationsWithDiagnoses, setExaminationsWithDiagnoses] = useState<number[]>([]);
  
  // Function to check if an examination has associated diagnoses
  const fetchExaminationsWithDiagnoses = useCallback(async () => {
    if (!examinations.length) return;
    
    try {
      const examsWithDiagnoses: number[] = [];
      
      // For each examination, check if it has diagnoses
      await Promise.all(
        examinations.map(async (examination) => {
          try {
            const response = await axiosInstance.get(`/diagnoses/examination/${examination.examination_id}`);
            if (response.data && response.data.length > 0) {
              examsWithDiagnoses.push(examination.examination_id);
            }
          } catch (err) {
            console.error(`Error checking diagnoses for exam ${examination.examination_id}:`, err);
          }
        })
      );
      
      setExaminationsWithDiagnoses(examsWithDiagnoses);
    } catch (error) {
      console.error('Error fetching examinations with diagnoses:', error);
    }
  }, [examinations]);
  
  // Call the function when examinations changes
  useEffect(() => {
    if (examinations.length > 0 && !loading) {
      fetchExaminationsWithDiagnoses();
    }
  }, [examinations, loading, fetchExaminationsWithDiagnoses]);
  
  // Check if an examination has associated diagnoses
  const hasDiagnoses = (examinationId: number) => {
    return examinationsWithDiagnoses.includes(examinationId);
  };
  
  // Check if there's a pet ID in localStorage to start an examination for, only once
  useEffect(() => {
    if (!startExamChecked.current) {
      startExamChecked.current = true;
      const startExamForPet = localStorage.getItem('startExamForPet');
      console.log('Checking localStorage for startExamForPet:', startExamForPet);
      
      if (startExamForPet) {
        try {
          const petIdValue = parseInt(startExamForPet, 10);
          console.log('Found pet ID in localStorage, setting selected pet ID:', petIdValue);
          
          // Store pet ID in state
          setSelectedPetId(petIdValue);
          
          // Check if there's also an appointment ID in localStorage
          const appointmentId = localStorage.getItem('appointmentIdForExam');
          if (appointmentId) {
            setSelectedAppointmentId(parseInt(appointmentId, 10));
          }
          
          // Set a small timeout to ensure state updates properly before opening modal
          setTimeout(() => {
            console.log('Opening examination modal for pet:', petIdValue);
            setNewExamModalOpen(true);
            setModalJustOpened(true);
            
            // Modalın yanlışlıkla kapanmasını önlemek için koruma süresi
            setTimeout(() => {
              setModalJustOpened(false);
            }, 1000);
            
            // Only remove from localStorage after we're sure the modal is open
            setTimeout(() => {
              console.log('Removing startExamForPet from localStorage');
              localStorage.removeItem('startExamForPet');
              localStorage.removeItem('appointmentIdForExam');
            }, 100);
          }, 100);
        } catch (error) {
          console.error('Error processing pet ID from localStorage:', error);
        }
      }
    }
  }, []);
  
  // Listen for custom event to start examination from other components
  useEffect(() => {
    const handleStartExamination = (event: CustomEvent) => {
      const petId = event.detail?.petId;
      console.log('Received startExamination event with pet ID:', petId);
      
      if (petId) {
        try {
          const petIdValue = parseInt(petId, 10);
          console.log('Setting selected pet ID from event:', petIdValue);
          
          // First set the pet ID
          setSelectedPetId(petIdValue);
          
          // Then use a small timeout to ensure state updates before opening modal
          setTimeout(() => {
            console.log('Opening examination modal from event handler');
            setNewExamModalOpen(true);
            setModalJustOpened(true);
            
            // Modalın yanlışlıkla kapanmasını önlemek için koruma süresi
            setTimeout(() => {
              setModalJustOpened(false);
            }, 1000);
          }, 50);
        } catch (error) {
          console.error('Error processing pet ID from event:', error);
        }
      }
    };

    // Add event listener
    window.addEventListener('startExamination', handleStartExamination as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('startExamination', handleStartExamination as EventListener);
    };
  }, []);
  
  // Calculate offset based on pagination
  const offset = (currentPage - 1) * limit;
  
  // Memoize the filters + pagination params to prevent unnecessary re-renders
  const requestParams = useMemo(() => {
    // Ensure clinic_id is always included in the request params
    const clinicId = localStorage.getItem('selectedClinicId');
    
    return {
      ...filters,
      limit,
      offset,
      clinic_id: clinicId ? parseInt(clinicId, 10) : filters.clinic_id // Ensure clinic_id is included and is a number
    };
  }, [filters, limit, offset]);
  
  // Fetch examinations function with timeout handling
  const fetchExaminations = useCallback(() => {
    // Prevent multiple simultaneous API calls
    if (loadingLockRef.current) {
      console.log('Loading already in progress, skipping duplicate API call');
      return;
    }
    
    // Set the loading lock
    loadingLockRef.current = true;
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Check if clinic_id is missing
    if (!requestParams.clinic_id) {
      console.error('Missing clinic_id in request params');
      setLocalError('Clinic ID is missing. Please select a clinic first.');
      loadingLockRef.current = false;
      return;
    }
    
    console.log('Fetching examinations with params:', requestParams);
    
    // Set a timeout to handle API calls that never return
    loadingTimeoutRef.current = setTimeout(() => {
      if (loading && !isDataLoaded) {
        console.error('Request timed out after 15 seconds');
        setLocalError('Request timed out. The server might be unavailable. Please try again.');
        // Release the loading lock
        loadingLockRef.current = false;
      }
    }, 15000); // 15 second timeout - increased from 10 seconds
    
    // Limit to max 5 loading attempts - increased from 3
    if (loadingAttempts >= 5) {
      setLocalError('Failed to load data after multiple attempts. Please refresh the page and try again.');
      loadingLockRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      return;
    }
    
    setLoadingAttempts(prev => prev + 1);
    
    dispatch(listExaminations(requestParams))
      .unwrap()
      .then((response) => {
        console.log('Successfully fetched examinations:', response);
        setIsDataLoaded(true);
        setLoadingAttempts(0); // Reset attempts on success
        loadingLockRef.current = false;
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      })
      .catch(err => {
        console.error('Error fetching examinations:', err);
        setIsDataLoaded(true);
        setLocalError(err?.message || 'Failed to load examinations. Please try again.');
        loadingLockRef.current = false;
        
        // Add a small delay before allowing another fetch attempt
        setTimeout(() => {
          loadingLockRef.current = false;
        }, 2000);
        
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      });
  }, [dispatch, requestParams, loading, isDataLoaded, loadingAttempts]);
  
  // Load examinations when component mounts or filters/pagination change
  useEffect(() => {
    if (!isDataLoaded) {
      console.log('Initial data load or reload triggered');
      fetchExaminations();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [fetchExaminations, isDataLoaded]);
  
  // Add a refresh interval to automatically retry loading if needed
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    // If there's an error, set up an interval to retry automatically every 30 seconds
    if (localError || error) {
      refreshInterval = setInterval(() => {
        console.log('Auto-retry interval triggered');
        handleRetry();
      }, 30000); // Auto-retry every 30 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [localError, error]);
  
  // Update selected examination when currentExamination changes in redux store
  useEffect(() => {
    if (currentExamination && detailModalOpen) {
      setSelectedExamination(currentExamination);
    }
  }, [currentExamination, detailModalOpen]);
  
  // Handle success state (after create/update/delete) without triggering re-renders
  const processedSuccessRef = useRef(false);
  useEffect(() => {
    if (success && !processedSuccessRef.current) {
      processedSuccessRef.current = true;
      // Reset state to avoid multiple refreshes
      dispatch(resetExaminationState());
      // Refresh data
      fetchExaminations();
    } else if (!success) {
      processedSuccessRef.current = false;
    }
  }, [success, dispatch, fetchExaminations]);
  
  // Handle status change
  const handleStatusChange = (examinationId: number, newStatus: 'started' | 'in_progress' | 'completed') => {
    dispatch(updateExaminationStatus({ examinationId, status: newStatus }));
  };
  
  // Handle examination view
  const handleViewExamination = (examination: Examination) => {
    setSelectedExamination(examination);
    setDetailModalOpen(true);
    dispatch(getExamination(examination.examination_id));
    
    // Call the parent component's handler if provided
    if (onViewExamination) {
      onViewExamination(examination);
    }
  };
  
  // Handle examination edit
  const handleEditExamination = (examination: Examination) => {
    // First get the most up-to-date data
    dispatch(getExamination(examination.examination_id))
      .unwrap()
      .then(() => {
        // Open edit modal with the selected examination
        setSelectedExamination(examination);
        setEditModalOpen(true);
      })
      .catch(err => {
        console.error('Error fetching examination for edit:', err);
        // Show error notification
        setLocalError(`Failed to load examination details: ${err.message || 'Unknown error'}`);
      });
    
    // Call the parent component's handler if provided
    if (onEditExamination) {
      onEditExamination(examination);
    }
  };
  
  // Handle closing the detail modal
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    // Only clear selected examination when edit modal is also closed
    if (!editModalOpen) {
      setSelectedExamination(null);
    }
  };
  
  // Close the edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    // Only clear selected examination when detail modal is also closed
    if (!detailModalOpen) {
      setSelectedExamination(null);
    }
  };
  
  // Handle opening the new examination modal
  const handleOpenNewExamModal = () => {
    console.log('Manual modal open requested');
    // First clear any pet selection if this is a manual open
    setSelectedPetId(undefined);
    
    // Then open the modal
    setNewExamModalOpen(true);
    setModalJustOpened(true);
    
    // Modalın yanlışlıkla kapanmasını önlemek için koruma süresi
    setTimeout(() => {
      setModalJustOpened(false);
    }, 1000);
  };
  
  // Handle closing the new examination modal
  const handleCloseNewExamModal = () => {
    console.log('Modal close requested');
    
    // Eğer modal henüz yeni açıldıysa, kapatılmasını engelle
    if (modalJustOpened) {
      console.log('Preventing modal close - modal just opened');
      return;
    }
    
    setNewExamModalOpen(false);
    
    // Only clear the selected pet ID after closing the modal
    setTimeout(() => {
      setSelectedPetId(undefined);
    }, 100);
  };
  
  // Handle successful creation of new examination
  const handleExamCreationSuccess = () => {
    // Will be handled by the success effect
  };
  
  // Handle confirmation dialog for delete
  const handleConfirmDelete = (examinationId: number) => {
    setConfirmDelete(examinationId);
  };
  
  // Handle deletion of examination
  const handleDeleteExamination = async () => {
    if (confirmDelete) {
      await dispatch(deleteExamination(confirmDelete));
      setConfirmDelete(null);
      
      // Close the detail modal if the deleted examination is currently being viewed
      if (selectedExamination && selectedExamination.examination_id === confirmDelete) {
        setDetailModalOpen(false);
        setSelectedExamination(null);
      }
    }
  };
  
  // Retry loading if there was an error
  const handleRetry = () => {
    console.log('Manual retry triggered');
    setLocalError(null);
    setIsDataLoaded(false);
    setLoadingAttempts(0); // Reset attempts counter
    loadingLockRef.current = false; // Release the lock
    fetchExaminations();
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'started':
        return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">Started</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded bg-green-100 text-green-800">Completed</span>;
      default:
        return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Add a guard effect to log modal state changes
  useEffect(() => {
    console.log('Modal state changed:', { 
      isOpen: newExamModalOpen, 
      selectedPetId: selectedPetId 
    });
  }, [newExamModalOpen, selectedPetId]);
  
  // Start diagnosis for an examination
  const handleStartDiagnosis = (examination: Examination) => {
    console.log('Starting diagnosis for examination:', examination.examination_id);
    
    // Store examination ID and pet ID in localStorage
    localStorage.setItem('currentPetId', examination.pet_id.toString());
    
    // Dispatch custom event to open diagnosis form
    const event = new CustomEvent('startDiagnosis', { 
      detail: { 
        petId: examination.pet_id,
        examinationId: examination.examination_id
      } 
    });
    window.dispatchEvent(event);
  };
  
  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Examinations</h2>
            <div className="inline-flex items-center mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Workflow: Examination must be created before adding diagnoses
            </div>
          </div>
          <button
            onClick={handleOpenNewExamModal}
            className="px-4 py-2 flex items-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            New Examination
          </button>
        </div>
      </div>
      
      {(loading && !isDataLoaded) ? (
        <div className="flex justify-center p-8">
          <div className="loader flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading examinations...</p>
          </div>
        </div>
      ) : localError || error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading examinations</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{localError || error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : examinations.length === 0 ? (
        <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No examinations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new examination for a patient.
          </p>
          
          <div className="mt-4 bg-blue-50 rounded-md p-4 mx-auto max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 text-left">
                <h3 className="text-sm font-semibold text-blue-800">Clinical Workflow</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <div className="flex items-center">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span className="ml-2">Create an examination record</span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span className="ml-2">Add diagnoses to the examination</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleOpenNewExamModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              New Examination
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-gray-700 sm:pl-6">Patient</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-700">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-700">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {examinations.map((examination) => (
                <tr key={examination.examination_id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900">
                      {examination.pet_name || `Pet #${examination.pet_id}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {examination.pet_species} {examination.pet_breed ? `(${examination.pet_breed})` : ''}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                    {format(new Date(examination.created_at), 'PPP')}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {renderStatusBadge(examination.status)}
                      <select
                        className="text-sm border border-gray-300 rounded-md py-1 pl-2 pr-8 bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={examination.status}
                        onChange={(e) => handleStatusChange(
                          examination.examination_id, 
                          e.target.value as 'started' | 'in_progress' | 'completed'
                        )}
                      >
                        <option value="started">Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex items-center space-x-1 justify-end">
                      <button
                        onClick={() => handleViewExamination(examination)}
                        className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditExamination(examination)}
                        className="p-1.5 rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit examination"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartDiagnosis(examination)}
                        className="p-1.5 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                        title="Start diagnosis"
                      >
                        <FaStethoscope className="w-4 h-4" />
                      </button>
                      {!hasDiagnoses(examination.examination_id) && (
                        <button
                          onClick={() => handleConfirmDelete(examination.examination_id)}
                          className="p-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete examination"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{offset + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(offset + limit, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                        currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      &laquo;
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else {
                        // For many pages, show current page in the middle with 2 pages on each side
                        const start = Math.max(1, currentPage - 2);
                        pageNum = start + index;
                        if (pageNum > totalPages) return null;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                        currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaTrash className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Examination</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this examination? This action cannot be undone. Note that examinations with associated diagnoses cannot be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={handleDeleteExamination}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Examination Detail Modal */}
      {detailModalOpen && (
        <ExaminationDetailModal 
          examination={selectedExamination}
          onClose={handleCloseDetailModal}
          onEdit={handleEditExamination}
        />
      )}
      
      {/* Edit Examination Modal */}
      {editModalOpen && selectedExamination && (
        <NewExaminationModal
          examination={selectedExamination}
          onClose={handleCloseEditModal}
          onSuccess={handleExamCreationSuccess}
        />
      )}
      
      {/* New Examination Modal */}
      {newExamModalOpen && (
        <NewExaminationModal
          petId={selectedPetId}
          appointmentId={selectedAppointmentId}
          onClose={handleCloseNewExamModal}
          onSuccess={handleExamCreationSuccess}
        />
      )}
    </>
  );
};

export default ExaminationList;
