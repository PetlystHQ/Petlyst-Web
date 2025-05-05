import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { 
  createDiagnosis, 
  updateDiagnosis,
  getStandardDiagnoses
} from './DiagnosisSlice';
import { Diagnosis, DiagnosisData, StandardDiagnosis } from './diagnosisService';
import { FaTimes, FaSearch, FaExclamationTriangle, FaNotesMedical } from 'react-icons/fa';
import axios from 'axios';

interface DiagnosisFormProps {
  diagnosis: Diagnosis | null;
  examinationId?: number;
  petId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExaminationOption {
  examination_id: number;
  examination_date: string;
  created_at?: string;
  status: string;
  vet_name?: string;
  pet_name?: string;
  pet_id?: number;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  diagnosis,
  examinationId,
  petId: propPetId,
  onClose,
  onSuccess,
}) => {
  console.log('DiagnosisForm INITIAL RENDER - Props:', { diagnosis, examinationId, petId: propPetId });
  
  const dispatch = useAppDispatch();
  const { loading, standardDiagnoses } = useAppSelector(state => state.diagnoses);
  const isEdit = !!diagnosis;
  
  // Use internal state for petId to allow setting from localStorage if not in props
  const [petId, setPetId] = useState<number | undefined>(propPetId);
  const [clinicId, setClinicId] = useState<number | undefined>();
  
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
  const [examinations, setExaminations] = useState<ExaminationOption[]>([]);
  const [loadingExaminations, setLoadingExaminations] = useState(false);
  const [hasExaminations, setHasExaminations] = useState(false);
  
  // Try to get petId from props, URL, or localStorage
  useEffect(() => {
    // First check if we have a prop petId
    if (propPetId) {
      console.log('DiagnosisForm - Using petId from props:', propPetId);
      setPetId(propPetId);
      return;
    }
    
    // Check for examination ID in localStorage
    const storedExamId = localStorage.getItem('examinationIdForDiagnosis');
    if (storedExamId) {
      console.log('DiagnosisForm - Found examination ID in localStorage:', storedExamId);
      const parsedExamId = parseInt(storedExamId);
      
      if (!isNaN(parsedExamId)) {
        console.log('DiagnosisForm - Setting examination ID from localStorage:', parsedExamId);
        setFormData(prev => ({
          ...prev,
          examination_id: parsedExamId
        }));
        
        // Remove from localStorage after using it
        setTimeout(() => {
          localStorage.removeItem('examinationIdForDiagnosis');
        }, 500);
      }
    }
    
    // Then check if we have examinationId and can get petId from there
    if (examinationId && !petId) {
      console.log('DiagnosisForm - Will try to get petId from examination:', examinationId);
      
      const fetchExaminationDetails = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/examinations/${examinationId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.success && response.data.examination) {
            const petIdFromExam = response.data.examination.pet_id;
            console.log('DiagnosisForm - Retrieved petId from examination:', petIdFromExam);
            setPetId(petIdFromExam);
          }
        } catch (error) {
          console.error('DiagnosisForm - Error fetching examination details:', error);
        }
      };
      
      fetchExaminationDetails();
      return;
    }
    
    // Then try URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlPetId = urlParams.get('petId');
    
    if (urlPetId) {
      console.log('DiagnosisForm - Found petId in URL:', urlPetId);
      const parsedPetId = parseInt(urlPetId);
      
      if (!isNaN(parsedPetId)) {
        console.log('DiagnosisForm - Using petId from URL:', parsedPetId);
        setPetId(parsedPetId);
        return;
      }
    }
    
    // Finally try localStorage
    const storedPetId = localStorage.getItem('currentPetId');
    if (storedPetId) {
      console.log('DiagnosisForm - Found petId in localStorage:', storedPetId);
      const parsedPetId = parseInt(storedPetId);
      
      if (!isNaN(parsedPetId)) {
        console.log('DiagnosisForm - Using petId from localStorage:', parsedPetId);
        setPetId(parsedPetId);
        return;
      }
    }
    
    console.warn('DiagnosisForm - No petId found in props, URL, or localStorage');
  }, [propPetId, examinationId, petId]);
  
  // Get the clinic ID from localStorage
  useEffect(() => {
    const storedClinicId = localStorage.getItem('selectedClinicId');
    if (storedClinicId) {
      console.log('DiagnosisForm - Found clinicId in localStorage:', storedClinicId);
      setClinicId(parseInt(storedClinicId));
    }
  }, []);
  
  // Fetch standard diagnoses
  useEffect(() => {
    if (formData.diagnosis_type === 'custom') {
      dispatch(getStandardDiagnoses(undefined));
    }
  }, [dispatch, formData.diagnosis_type]);
  
  // Fetch examinations for the pet when petId is available
  useEffect(() => {
    console.log('DiagnosisForm - petId or isEdit changed:', { petId, isEdit, examinationId, hasExaminations });
    
    if (!isEdit) {
      if (petId) {
        console.log('DiagnosisForm - Triggering fetchExaminationsForPet for petId:', petId);
        fetchExaminationsForPet(petId);
      } else if (clinicId) {
        console.log('DiagnosisForm - Triggering fetchClinicExaminations for clinicId:', clinicId);
        fetchClinicExaminations(clinicId);
      }
    }
  }, [petId, clinicId, isEdit, hasExaminations]);
  
  // Fetch all clinic examinations
  const fetchClinicExaminations = async (clinicId: number) => {
    if (!clinicId) {
      console.log('DiagnosisForm - fetchClinicExaminations called with invalid clinicId');
      return;
    }
    
    console.log('DiagnosisForm - fetchClinicExaminations STARTED with clinicId:', clinicId);
    setLoadingExaminations(true);
    setErrors(prev => ({ ...prev, examinations: '' }));
    
    try {
      const token = localStorage.getItem('token');
      console.log('DiagnosisForm - Token found?', !!token);
      
      // Get all veterinarians in this clinic
      const vetResponse = await axios.get(`/api/clinics/${clinicId}/veterinarians`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!vetResponse.data.success || !vetResponse.data.veterinarians) {
        throw new Error('Failed to fetch clinic veterinarians');
      }
      
      // Get approved vets only
      const approvedVets = vetResponse.data.veterinarians
        .filter((vet: any) => vet.status === 'approved')
        .map((vet: any) => vet.veterinarian_id);
      
      console.log('DiagnosisForm - Approved vets in clinic:', approvedVets);
      
      if (approvedVets.length === 0) {
        console.log('DiagnosisForm - No approved vets found in clinic');
        setExaminations([]);
        setHasExaminations(false);
        setLoadingExaminations(false);
        return;
      }
      
      // Fetch examinations for all clinic vets
      const allExaminations: ExaminationOption[] = [];
      
      // Process in batches to avoid overwhelming the server
      for (let i = 0; i < approvedVets.length; i += 5) {
        const batchVets = approvedVets.slice(i, i + 5);
        const batchPromises = batchVets.map((vetId: number) => 
          axios.get(`/api/examinations?vet_id=${vetId}&status=in_progress,completed`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(response => {
          if (response.data.success && response.data.examinations) {
            const exams = response.data.examinations.map((exam: any) => ({
              examination_id: exam.examination_id,
              examination_date: new Date(exam.examination_date || exam.created_at).toLocaleDateString(),
              status: exam.status,
              vet_name: exam.veterinarian_name,
              pet_name: exam.pet_name,
              pet_id: exam.pet_id
            }));
            
            allExaminations.push(...exams);
          }
        });
      }
      
      console.log(`DiagnosisForm - Found ${allExaminations.length} total examinations from clinic vets`);
      
      // Sort by date, newest first
      allExaminations.sort((a, b) => 
        new Date(b.examination_date).getTime() - new Date(a.examination_date).getTime()
      );
      
      setExaminations(allExaminations);
      setHasExaminations(allExaminations.length > 0);
      
      // Auto-select the first examination only if pet matches or no pet is selected
      if (!formData.examination_id && allExaminations.length > 0) {
        const matchingExam = petId
          ? allExaminations.find(exam => exam.pet_id === petId)
          : allExaminations[0];
          
        if (matchingExam) {
          console.log('DiagnosisForm - Auto-selecting examination:', matchingExam.examination_id);
          setFormData(prev => ({
            ...prev, 
            examination_id: matchingExam.examination_id
          }));
        }
      }
    } catch (error: any) {
      console.error('DiagnosisForm - Error fetching clinic examinations:', error);
      console.error('DiagnosisForm - Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setErrors(prev => ({ ...prev, examinations: 'Failed to load clinic examinations' }));
      setExaminations([]);
      setHasExaminations(false);
    } finally {
      console.log('DiagnosisForm - fetchClinicExaminations COMPLETED');
      setLoadingExaminations(false);
    }
  };
  
  // Fetch examinations for the pet
  const fetchExaminationsForPet = async (petId: number) => {
    if (!petId) {
      console.log('DiagnosisForm - fetchExaminationsForPet called with invalid petId');
      return;
    }
    
    console.log('DiagnosisForm - fetchExaminationsForPet STARTED with petId:', petId);
    setLoadingExaminations(true);
    setErrors(prev => ({ ...prev, examinations: '' }));
    
    // Use the correct endpoint that now combines both functionalities
    const apiUrl = `/api/examinations/pet-history/${petId}?status=for_diagnosis`;
    console.log('DiagnosisForm - Requesting API endpoint:', apiUrl);
    
    try {
      const token = localStorage.getItem('token');
      console.log('DiagnosisForm - Token found?', !!token);
      
      // Log request details
      console.log('DiagnosisForm - Making API request to:', apiUrl);
      
      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const endTime = Date.now();
      
      console.log(`DiagnosisForm - API response received in ${endTime - startTime}ms:`, response.data);
      
      if (response.data && response.data.success && response.data.examinations && response.data.examinations.length > 0) {
        // Map the examination data from the response
        const exams = response.data.examinations.map((exam: any) => {
          console.log('Raw examination data from API:', exam);
          return {
            examination_id: exam.examination_id,
            examination_date: new Date(exam.examination_date || exam.created_at).toLocaleDateString(),
            status: exam.status,
            vet_name: exam.veterinarian_name,
            pet_name: exam.pet_name
          };
        });
        
        console.log('DiagnosisForm - Mapped examinations:', exams);
        
        // Only use examinations with status "in_progress" or "completed"
        const filteredExams = exams.filter((exam: any) => 
          exam.status === 'in_progress' || exam.status === 'completed'
        );
        
        console.log('DiagnosisForm - Filtered examinations for diagnosis:', filteredExams);
        
        setExaminations(filteredExams);
        setHasExaminations(filteredExams.length > 0);
        
        // Auto-select the first examination
        if (!formData.examination_id && filteredExams.length > 0) {
          console.log('DiagnosisForm - Auto-selecting first examination:', filteredExams[0].examination_id);
          setFormData(prev => ({
            ...prev, 
            examination_id: filteredExams[0].examination_id
          }));
        }
      } else {
        console.log('DiagnosisForm - No examinations found for pet:', petId);
        setExaminations([]);
        setHasExaminations(false);
      }
    } catch (error: any) {
      console.error('DiagnosisForm - Error fetching examinations:', error);
      console.error('DiagnosisForm - Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setErrors(prev => ({ ...prev, examinations: 'Failed to load examinations' }));
      setExaminations([]);
      setHasExaminations(false);
      
      // Try without the status parameter as a fallback
      try {
        console.log('DiagnosisForm - Trying fallback without status parameter...');
        const token = localStorage.getItem('token');
        const fallbackUrl = `/api/examinations/pet-history/${petId}`;
        
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('DiagnosisForm - Fallback response:', fallbackResponse.data);
        
        if (fallbackResponse.data && fallbackResponse.data.success && 
            fallbackResponse.data.examinations && fallbackResponse.data.examinations.length > 0) {
          
          const exams = fallbackResponse.data.examinations.map((exam: any) => ({
            examination_id: exam.examination_id,
            examination_date: new Date(exam.examination_date || exam.created_at).toLocaleDateString(),
            status: exam.status,
            vet_name: exam.veterinarian_name,
            pet_name: exam.pet_name
          }));
          
          // Only use examinations with status "in_progress" or "completed"
          const filteredExams = exams.filter((exam: any) => 
            exam.status === 'in_progress' || exam.status === 'completed'
          );
          
          if (filteredExams.length > 0) {
            console.log('DiagnosisForm - Fallback successful with filtered exams:', filteredExams);
            setExaminations(filteredExams);
            setHasExaminations(true);
            
            if (!formData.examination_id) {
              setFormData(prev => ({
                ...prev, 
                examination_id: filteredExams[0].examination_id
              }));
            }
          }
        }
      } catch (fallbackError) {
        console.error('DiagnosisForm - Fallback also failed:', fallbackError);
      }
    } finally {
      console.log('DiagnosisForm - fetchExaminationsForPet COMPLETED');
      setLoadingExaminations(false);
    }
  };
  
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
  
  // Handle redirecting to create a new examination
  const handleCreateExamination = () => {
    // Store pet ID in localStorage to pre-select it in the examination form
    if (petId) {
      localStorage.setItem('startExamForPet', petId.toString());
      // Also store in a common place so other components can find it
      localStorage.setItem('currentPetId', petId.toString());
    }
    
    // Close current modal
    onClose();
    
    // Dispatch custom event to open examination form
    const event = new CustomEvent('startExamination', { 
      detail: { petId } 
    });
    window.dispatchEvent(event);
  };
  
  // Add a useEffect to log examinations whenever they change
  useEffect(() => {
    if (examinations.length > 0) {
      console.log('DEBUG: Current examinations array:', examinations);
      console.log('Pet names available:', examinations.map(e => e.pet_name || 'NOT FOUND'));
    }
  }, [examinations]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {isEdit ? 'Edit Diagnosis' : 'New Diagnosis'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow p-6">
          {/* No examinations warning */}
          {!isEdit && petId && !hasExaminations && !loadingExaminations && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-r-md shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    There are no active examinations for this patient. A diagnosis must be associated with an examination.
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleCreateExamination}
                      className="flex items-center text-sm font-medium text-yellow-700 hover:text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <FaNotesMedical className="mr-2" />
                      Create an examination first
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Examination Selection - First field */}
            {!isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Examination*
                </label>
                {loadingExaminations ? (
                  <div className="py-2 px-3 border border-gray-300 rounded-md bg-gray-50">
                    <div className="animate-pulse flex items-center">
                      <div className="h-4 w-4 bg-gray-300 rounded-full mr-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : examinations.length > 0 ? (
                  <select
                    name="examination_id"
                    value={formData.examination_id || ''}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${
                      errors.examination_id ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="">Select an examination</option>
                    {examinations.map(exam => (
                      <option key={exam.examination_id} value={exam.examination_id}>
                        {exam.pet_name ? `${exam.pet_name}` : ''} - {exam.examination_date}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                    No active examinations available
                  </div>
                )}
                {errors.examination_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.examination_id}</p>
                )}
                {!hasExaminations && !loadingExaminations && (
                  <p className="mt-1 text-xs text-gray-500">
                    You need to create an examination record before adding a diagnosis.
                  </p>
                )}
              </div>
            )}
            
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
            
            {/* Standard Diagnosis Selection */}
            {formData.diagnosis_type === 'custom' && (
              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Diagnoses Template
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={standardDiagnosisSearch}
                    onChange={(e) => setStandardDiagnosisSearch(e.target.value)}
                    onFocus={() => setShowStandardDropdown(true)}
                    placeholder="Search diagnoses templates..."
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
                        No matching diagnoses templates found
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
            {!examinationId && isEdit && !formData.examination_id && (
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
            <div className="md:col-span-2">
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
            <div className="md:col-span-2">
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
            disabled={loading || (!isEdit && !hasExaminations)}
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
