import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useAppSelector } from '../../hooks/useAppSelector';
import { API_ENDPOINTS } from '../../constants/dashboard';
import { VETERINARY_EXPERTISE_AREAS, EXPERTISE_CATEGORIES } from '../../constants/VeterinaryExpertise';
import { VETERINARY_LANGUAGES, getLanguageNameById } from '../../constants/VeterinaryLanguages';
import { getApiErrorMessage } from '../../utils/errorMessage';

interface Education {
  education_id: number;
  school_name: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

interface Certification {
  certification_id: number;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  certification_number: string | null;
  created_at: string;
}

interface Expertise {
  expertise_id: number;
  expertise_area: string;
  created_at: string;
}

interface FormData {
  school_name: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface CertificationFormData {
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  certification_number: string;
}

interface ExpertiseFormData {
  expertise_area: string;
}

// Add new profile interface
interface ProfileData {
  biography: string | null;
  preferred_languages: string[] | null;
  user_name: string;
  user_surname: string;
  user_email: string;
  user_phone: string | null;
  user_profile_photo: string | null;
}

// Fotoğraf interface'i ekle
interface VeterinarianPhoto {
  veterinarian_album_photo_id: number;
  veterinarian_album_photo_url: string;
  veterinarian_album_photo_url_created_at: string;
}

// Add new clinic interface
interface Clinic {
  clinic_id: number;
  clinic_name: string;
  clinic_type: string;
  clinic_description: string | null;
  province: string;
  district: string;
  clinic_address: string | null;
  photos: string[];
  operator_name?: string;
  operator_surname?: string;
  location_name?: string;
  location_district?: string;
  location_province?: string;
  services?: string;
  status?: boolean;
}

const VeterinarianProfile: React.FC = () => {
  const { token } = useAppSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState<string>('education');
  
  // Education state
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [educationLoading, setEducationLoading] = useState<boolean>(true);
  const [educationError, setEducationError] = useState<string | null>(null);
  
  // Certification state
  const [certificationList, setCertificationList] = useState<Certification[]>([]);
  const [certificationLoading, setCertificationLoading] = useState<boolean>(true);
  const [certificationError, setCertificationError] = useState<string | null>(null);
  
  // Expertise state
  const [expertiseList, setExpertiseList] = useState<Expertise[]>([]);
  const [expertiseLoading, setExpertiseLoading] = useState<boolean>(true);
  const [expertiseError, setExpertiseError] = useState<string | null>(null);
  
  // Education form state
  const [showEducationForm, setShowEducationForm] = useState<boolean>(false);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationFormData, setEducationFormData] = useState<FormData>({
    school_name: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false
  });
  
  // Certification form state
  const [showCertificationForm, setShowCertificationForm] = useState<boolean>(false);
  const [editingCertificationId, setEditingCertificationId] = useState<number | null>(null);
  const [certificationFormData, setCertificationFormData] = useState<CertificationFormData>({
    certification_name: '',
    issuing_organization: '',
    issue_date: '',
    certification_number: ''
  });
  
  // Expertise form state
  const [showExpertiseForm, setShowExpertiseForm] = useState<boolean>(false);
  const [editingExpertiseId, setEditingExpertiseId] = useState<number | null>(null);
  const [expertiseFormData, setExpertiseFormData] = useState<ExpertiseFormData>({
    expertise_area: ''
  });
  const [selectedExpertiseAreas, setSelectedExpertiseAreas] = useState<string[]>([]);
  const [expertiseSearch, setExpertiseSearch] = useState<string>('');
  const [isSubmittingExpertise, setIsSubmittingExpertise] = useState<boolean>(false);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEducationId, setDeleteEducationId] = useState<number | null>(null);
  const [deleteCertificationId, setDeleteCertificationId] = useState<number | null>(null);
  const [deleteExpertiseId, setDeleteExpertiseId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'education' | 'certification' | 'expertise' | 'photo'>('education');

  // Add new profile state
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  
  // Biography form state
  const [biographyText, setBiographyText] = useState<string>('');
  const [showBiographyForm, setShowBiographyForm] = useState<boolean>(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  // Photos state
  const [photos, setPhotos] = useState<VeterinarianPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState<boolean>(true);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [deletePhotoLoading, setDeletePhotoLoading] = useState<boolean>(false);
  const [fileInputKey, setFileInputKey] = useState<number>(0); // For resetting file input
  
  // Clinic search state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicSearchQuery, setClinicSearchQuery] = useState<string>('');
  const [clinicSearchLoading, setClinicSearchLoading] = useState<boolean>(false);
  const [clinicSearchError, setClinicSearchError] = useState<string | null>(null);
  const [clinicJoinLoading, setClinicJoinLoading] = useState<boolean>(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [showJoinConfirmationModal, setShowJoinConfirmationModal] = useState<boolean>(false);
  const [clinicJoinError, setClinicJoinError] = useState<string | null>(null);
  const [clinicJoinSuccess, setClinicJoinSuccess] = useState<string | null>(null);
  const [myClinic, setMyClinic] = useState<{ clinic_id: number; clinic_name: string; [key: string]: unknown } | null>(null);
  const [myClinicLoading, setMyClinicLoading] = useState<boolean>(false);
  
  // Verification status state
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'unverified' | null>(null);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  
  // State for pending request
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [pendingRequestDetails, setPendingRequestDetails] = useState<{ clinic_id?: number; clinic_name?: string; status?: string; created_at?: string; [key: string]: unknown } | null>(null);
  
  // Önce yeni bir state ekleyelim - klinikten ayrılma modalı için
  const [showLeaveConfirmationModal, setShowLeaveConfirmationModal] = useState<boolean>(false);
  const [leavingClinicLoading, setLeavingClinicLoading] = useState<boolean>(false);
  const [leaveClinicError, setLeaveClinicError] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeTab === 'education') {
      fetchEducation();
    } else if (activeTab === 'certifications') {
      fetchCertifications();
    } else if (activeTab === 'expertise') {
      fetchExpertise();
    } else if (activeTab === 'biography') {
      fetchProfile();
    } else if (activeTab === 'photos') {
      fetchPhotos();
    } else if (activeTab === 'clinics') {
      fetchMyClinic();
      fetchVerificationStatus();
      checkPendingRequests();
    }
    // The eight fetch*/check* functions are in-component; adding any of
    // them would loop. Effect should re-run only on tab/token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  // Fetch verification status immediately when component loads
  useEffect(() => {
    fetchVerificationStatus();
    // fetchVerificationStatus is in-component; adding it would loop.
     
  }, [token]);

  // Check for selectedProfileTab in localStorage and switch to that tab if available
  useEffect(() => {
    const selectedTab = localStorage.getItem('selectedProfileTab');
    if (selectedTab) {
      setActiveTab(selectedTab);
      // Clear the localStorage item after switching tabs
      localStorage.removeItem('selectedProfileTab');
    }
  }, []);
  
  // Check for pending requests when tab changes to clinics
  useEffect(() => {
    if (activeTab === 'clinics') {
      fetchMyClinic();
      checkPendingRequests();
    }
    // fetchMyClinic / checkPendingRequests are in-component; adding them
    // would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchEducation = async () => {
    try {
      setEducationLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.EDUCATION);
      setEducationList(response.data);
      setEducationError(null);
    } catch (error) {
      console.error('Error fetching education data:', error);
      setEducationError('Failed to load education data. Please try again later.');
    } finally {
      setEducationLoading(false);
    }
  };

  const fetchCertifications = async () => {
    try {
      setCertificationLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.CERTIFICATIONS);
      setCertificationList(response.data);
      setCertificationError(null);
    } catch (error) {
      console.error('Error fetching certification data:', error);
      setCertificationError('Failed to load certification data. Please try again later.');
    } finally {
      setCertificationLoading(false);
    }
  };

  const fetchExpertise = async () => {
    try {
      setExpertiseLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.EXPERTISE);
      setExpertiseList(response.data);
      setExpertiseError(null);
    } catch (error) {
      console.error('Error fetching expertise data:', error);
      setExpertiseError('Failed to load expertise data. Please try again later.');
    } finally {
      setExpertiseLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.PROFILE);
      
      setProfileData(response.data);
      
      // Initialize form state with profile data
      setBiographyText(response.data.biography || '');
      setLanguages(response.data.preferred_languages || []);
      
      setProfileError(null);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfileError('Failed to load profile data. Please try again later.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      setPhotosLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.VET_PHOTOS);
      
      if (response.data.success) {
        setPhotos(response.data.photos || []);
        setPhotosError(null);
      } else {
        setPhotosError(response.data.message || 'Failed to load photos.');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotosError('Failed to load photos. Please try again later.');
    } finally {
      setPhotosLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setPhotosError('Only image files are allowed.');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setPhotosError('File size must be less than 10MB.');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      setPhotosError(null);
      
      // Get veterinarian name from profile data
      if (!profileData) {
        await fetchProfile();
      }
      
      const veterinarianName = profileData ? 
        `${profileData.user_name} ${profileData.user_surname}` : 
        'Unknown';
      
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('veterinarianName', veterinarianName);
      
      // If a photo already exists, delete it first
      if (photos.length > 0) {
        try {
          const photoId = photos[0].veterinarian_album_photo_id;
          await axiosInstance.delete(`${API_ENDPOINTS.VET_PHOTOS}/${photoId}`);
        } catch (deleteError) {
          console.error('Error deleting existing photo:', deleteError);
          // Continue with upload even if delete fails
        }
      }
      
      const response = await axiosInstance.post(API_ENDPOINTS.UPLOAD_VET_PHOTO, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (response.data.success) {
        // Reset file input for future uploads
        setFileInputKey(prev => prev + 1);
        // Fetch updated photos
        fetchPhotos();
      } else {
        setPhotosError(response.data.message || 'Failed to upload photo.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setPhotosError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const confirmDeletePhoto = (photoId: number) => {
    setPhotoToDelete(photoId);
    setShowDeleteModal(true);
    setDeleteType('photo');
  };

  const deletePhoto = async (photoId: number) => {
    try {
      setDeletePhotoLoading(true);
      
      const response = await axiosInstance.delete(`${API_ENDPOINTS.VET_PHOTOS}/${photoId}`);
      
      if (response.data.success) {
        // Update photos state by removing the deleted photo
        setPhotos(prevPhotos => 
          prevPhotos.filter(photo => photo.veterinarian_album_photo_id !== photoId)
        );
      } else {
        setPhotosError(response.data.message || 'Failed to delete photo.');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      setPhotosError('Failed to delete photo. Please try again.');
    } finally {
      setDeletePhotoLoading(false);
      setPhotoToDelete(null);
    }
  };

  const handleAddEducation = () => {
    setEducationFormData({
      school_name: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false
    });
    setEditingEducationId(null);
    setShowEducationForm(true);
  };

  const handleAddCertification = () => {
    setCertificationFormData({
      certification_name: '',
      issuing_organization: '',
      issue_date: '',
      certification_number: ''
    });
    setEditingCertificationId(null);
    setShowCertificationForm(true);
  };

  const handleAddExpertise = () => {
    setExpertiseFormData({
      expertise_area: ''
    });
    setSelectedExpertiseAreas([]);
    setEditingExpertiseId(null);
    setExpertiseSearch('');
    setShowExpertiseForm(true);
  };

  const handleEditEducation = (education: Education) => {
    setEducationFormData({
      school_name: education.school_name,
      field_of_study: education.field_of_study,
      start_date: education.start_date.split('T')[0], // Format date to YYYY-MM-DD
      end_date: education.end_date ? education.end_date.split('T')[0] : '',
      is_current: education.is_current
    });
    setEditingEducationId(education.education_id);
    setShowEducationForm(true);
  };

  const handleEditCertification = (certification: Certification) => {
    setCertificationFormData({
      certification_name: certification.certification_name,
      issuing_organization: certification.issuing_organization,
      issue_date: certification.issue_date.split('T')[0], // Format date to YYYY-MM-DD
      certification_number: certification.certification_number || ''
    });
    setEditingCertificationId(certification.certification_id);
    setShowCertificationForm(true);
  };

  const handleEditExpertise = (expertise: Expertise) => {
    setExpertiseFormData({
      expertise_area: expertise.expertise_area
    });
    setSelectedExpertiseAreas([expertise.expertise_area]);
    setEditingExpertiseId(expertise.expertise_id);
    setExpertiseSearch('');
    setShowExpertiseForm(true);
  };

  const handleEducationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEducationFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'is_current' && checked ? { end_date: '' } : {})
      }));
    } else {
      setEducationFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCertificationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCertificationFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        school_name: educationFormData.school_name,
        field_of_study: educationFormData.field_of_study,
        start_date: educationFormData.start_date,
        end_date: educationFormData.is_current ? null : educationFormData.end_date,
        is_current: educationFormData.is_current
      };

      if (editingEducationId) {
        // Update existing education
        await axiosInstance.put(`${API_ENDPOINTS.EDUCATION}/${editingEducationId}`, payload, { headers: { 'Content-Type': 'application/json' } });
      } else {
        // Add new education
        await axiosInstance.post(API_ENDPOINTS.EDUCATION, payload, { headers: { 'Content-Type': 'application/json' } });
      }
      
      // Reset form and fetch updated data
      setShowEducationForm(false);
      setEditingEducationId(null);
      fetchEducation();
    } catch (error) {
      console.error('Error saving education:', error);
      setEducationError('Failed to save education data. Please try again.');
    }
  };

  const handleSubmitCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        certification_name: certificationFormData.certification_name,
        issuing_organization: certificationFormData.issuing_organization,
        issue_date: certificationFormData.issue_date,
        certification_number: certificationFormData.certification_number || null
      };

      if (editingCertificationId) {
        // Update existing certification
        await axiosInstance.put(`${API_ENDPOINTS.CERTIFICATIONS}/${editingCertificationId}`, payload, { headers: { 'Content-Type': 'application/json' } });
      } else {
        // Add new certification
        await axiosInstance.post(API_ENDPOINTS.CERTIFICATIONS, payload, { headers: { 'Content-Type': 'application/json' } });
      }
      
      // Reset form and fetch updated data
      setShowCertificationForm(false);
      setEditingCertificationId(null);
      fetchCertifications();
    } catch (error) {
      console.error('Error saving certification:', error);
      setCertificationError('Failed to save certification data. Please try again.');
    }
  };

  const handleSubmitExpertise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmittingExpertise(true);
      
      if (editingExpertiseId) {
        // For edit mode, we still only edit one expertise at a time
        const payload = {
          expertise_area: expertiseFormData.expertise_area
        };
        
        // Update existing expertise
        await axiosInstance.put(`${API_ENDPOINTS.EXPERTISE}/${editingExpertiseId}`, payload, { headers: { 'Content-Type': 'application/json' } });
      } else {
        // Add multiple new expertise areas
        if (selectedExpertiseAreas.length === 0) {
          setExpertiseError('Please select at least one expertise area.');
          setIsSubmittingExpertise(false);
          return;
        }
        
        // Make sequential API calls for each selected expertise
        for (const expertiseArea of selectedExpertiseAreas) {
          const payload = {
            expertise_area: expertiseArea
          };
          
          await axiosInstance.post(API_ENDPOINTS.EXPERTISE, payload, { headers: { 'Content-Type': 'application/json' } });
        }
      }
      
      // Reset form and fetch updated data
      setShowExpertiseForm(false);
      setEditingExpertiseId(null);
      setSelectedExpertiseAreas([]);
      setExpertiseFormData({ expertise_area: '' });
      fetchExpertise();
    } catch (error) {
      console.error('Error saving expertise:', error);
      setExpertiseError('Failed to save expertise data. Please try again.');
    } finally {
      setIsSubmittingExpertise(false);
    }
  };

  const handleDeleteEducation = async (educationId: number) => {
    setDeleteEducationId(educationId);
    setDeleteType('education');
    setShowDeleteModal(true);
  };

  const handleDeleteCertification = async (certificationId: number) => {
    setDeleteCertificationId(certificationId);
    setDeleteType('certification');
    setShowDeleteModal(true);
  };

  const handleDeleteExpertise = async (expertiseId: number) => {
    setDeleteExpertiseId(expertiseId);
    setDeleteType('expertise');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'education' && deleteEducationId) {
        await axiosInstance.delete(`${API_ENDPOINTS.EDUCATION}/${deleteEducationId}`);
        fetchEducation();
      } else if (deleteType === 'certification' && deleteCertificationId) {
        await axiosInstance.delete(`${API_ENDPOINTS.CERTIFICATIONS}/${deleteCertificationId}`);
        fetchCertifications();
      } else if (deleteType === 'expertise' && deleteExpertiseId) {
        await axiosInstance.delete(`${API_ENDPOINTS.EXPERTISE}/${deleteExpertiseId}`);
        fetchExpertise();
      } else if (deleteType === 'photo' && photoToDelete) {
        await deletePhoto(photoToDelete);
      }
      
      setShowDeleteModal(false);
      setDeleteEducationId(null);
      setDeleteCertificationId(null);
      setDeleteExpertiseId(null);
      setPhotoToDelete(null);
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      if (deleteType === 'education') {
        setEducationError(`Failed to delete ${deleteType} record. Please try again.`);
      } else if (deleteType === 'certification') {
        setCertificationError(`Failed to delete ${deleteType} record. Please try again.`);
      } else if (deleteType === 'expertise') {
        setExpertiseError(`Failed to delete ${deleteType} record. Please try again.`);
      } else if (deleteType === 'photo') {
        setPhotosError(`Failed to delete photo. Please try again.`);
      }
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteEducationId(null);
    setDeleteCertificationId(null);
    setDeleteExpertiseId(null);
    setPhotoToDelete(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const renderEducationSection = () => {
    if (educationLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      );
    }

    if (educationError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{educationError}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Education Form */}
        {showEducationForm && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
              {editingEducationId ? 'Edit Education' : 'Add Education'}
            </h3>
            <form onSubmit={handleSubmitEducation}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
                    School/University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="school_name"
                    name="school_name"
                    value={educationFormData.school_name}
                    onChange={handleEducationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. Ankara University"
                  />
                </div>
                
                <div>
                  <label htmlFor="field_of_study" className="block text-sm font-medium text-gray-700 mb-1">
                    Field of Study <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="field_of_study"
                    name="field_of_study"
                    value={educationFormData.field_of_study}
                    onChange={handleEducationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. Veterinary Medicine"
                  />
                </div>
                
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={educationFormData.start_date}
                    onChange={handleEducationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
                
                <div className="flex items-center h-full pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="is_current"
                      name="is_current"
                      checked={educationFormData.is_current}
                      onChange={handleEducationFormChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      I am currently studying here
                    </span>
                  </label>
                </div>
                
                {!educationFormData.is_current && (
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={educationFormData.end_date}
                      onChange={handleEducationFormChange}
                      required={!educationFormData.is_current}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowEducationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  {editingEducationId ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Education
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Education List */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Education History</h3>
              <p className="text-sm text-gray-500 mt-1">Add your academic qualifications and education background</p>
            </div>
            {!showEducationForm && (
              <button
                onClick={handleAddEducation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Education
              </button>
            )}
          </div>
          
          {/* No education records message - only show when no records AND form is not visible */}
          {educationList.length === 0 && !showEducationForm && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 mb-2">No education records found</p>
              <p className="text-sm text-gray-400">Add your educational background to enhance your professional profile</p>
            </div>
          )}
          
          {/* Education list - only render if we have records */}
          {educationList.length > 0 && (
            <div className="space-y-4">
              {educationList.map((education) => (
                <div key={education.education_id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">{education.school_name}</h4>
                      <p className="text-gray-600 mt-1">{education.field_of_study}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {formatDate(education.start_date)} - {education.is_current ? 
                            <span className="text-blue-600 font-medium">Present</span> : 
                            formatDate(education.end_date)
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEducation(education)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteEducation(education.education_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {education.is_current && (
                    <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Currently Studying
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCertificationsSection = () => {
    if (certificationLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      );
    }

    if (certificationError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{certificationError}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Certification Form */}
        {showCertificationForm && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
              {editingCertificationId ? 'Edit Certification' : 'Add Certification'}
            </h3>
            <form onSubmit={handleSubmitCertification}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="certification_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Certification Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="certification_name"
                    name="certification_name"
                    value={certificationFormData.certification_name}
                    onChange={handleCertificationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. Veterinary Surgery Specialist"
                  />
                </div>
                
                <div>
                  <label htmlFor="issuing_organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="issuing_organization"
                    name="issuing_organization"
                    value={certificationFormData.issuing_organization}
                    onChange={handleCertificationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. American Board of Veterinary Practitioners"
                  />
                </div>
                
                <div>
                  <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="issue_date"
                    name="issue_date"
                    value={certificationFormData.issue_date}
                    onChange={handleCertificationFormChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="certification_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Certification Number
                  </label>
                  <input
                    type="text"
                    id="certification_number"
                    name="certification_number"
                    value={certificationFormData.certification_number}
                    onChange={handleCertificationFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="e.g. ABVP-0123456"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowCertificationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  {editingCertificationId ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Certification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Certification List */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Professional Certifications</h3>
              <p className="text-sm text-gray-500 mt-1">Add your professional certifications and licenses</p>
            </div>
            {!showCertificationForm && (
              <button
                onClick={handleAddCertification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Certification
              </button>
            )}
          </div>
          
          {/* No certification records message */}
          {certificationList.length === 0 && !showCertificationForm && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-gray-500 mb-2">No certification records found</p>
              <p className="text-sm text-gray-400">Add your professional certifications to enhance your profile</p>
            </div>
          )}
          
          {/* Certification list */}
          {certificationList.length > 0 && (
            <div className="space-y-4">
              {certificationList.map((certification) => (
                <div key={certification.certification_id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">{certification.certification_name}</h4>
                      <p className="text-gray-600 mt-1">{certification.issuing_organization}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Issued: {formatDate(certification.issue_date)}</span>
                      </div>
                      {certification.certification_number && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Certification No:</span> {certification.certification_number}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCertification(certification)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCertification(certification.certification_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExpertiseSection = () => {
    if (expertiseLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      );
    }

    if (expertiseError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{expertiseError}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Expertise Form */}
        {showExpertiseForm && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
              {editingExpertiseId ? 'Edit Expertise' : 'Add Multiple Expertise Areas'}
            </h3>
            <form onSubmit={handleSubmitExpertise}>
              <div className="mb-6">
                <div className="mb-4">
                  <label htmlFor="expertise-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Expertise Areas
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="expertise-search"
                      className="pl-10 block w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Search for expertise areas..."
                      value={expertiseSearch}
                      onChange={(e) => setExpertiseSearch(e.target.value)}
                    />
                    {expertiseSearch && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setExpertiseSearch('')}
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {editingExpertiseId ? 'Select an expertise area' : 'Select expertise areas'} <span className="text-red-500">*</span>
                  </label>
                  {!editingExpertiseId && selectedExpertiseAreas.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedExpertiseAreas.length} {selectedExpertiseAreas.length === 1 ? 'area' : 'areas'} selected
                    </span>
                  )}
                </div>
                
                <div className="space-y-6">
                  {EXPERTISE_CATEGORIES.map(category => {
                    // Get expertise areas for this category
                    const categoryExpertise = VETERINARY_EXPERTISE_AREAS.filter(
                      expertise => expertise.category === category && 
                        (!expertiseSearch || 
                         expertise.name.toLowerCase().includes(expertiseSearch.toLowerCase()))
                    );
                    
                    // Only render category if it has items matching the search
                    if (categoryExpertise.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-3">
                        <h4 className="text-md font-medium text-gray-700 border-b pb-2">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryExpertise.map(expertise => {
                            // Check if this expertise is already added (and not the one being edited)
                            const isAlreadyAdded = 
                              isExpertiseAlreadyAdded(expertise.id) && 
                              (!editingExpertiseId || 
                               expertiseList.find(e => e.expertise_id === editingExpertiseId)?.expertise_area !== expertise.id);
                            
                            // Check if currently selected
                            const isSelected = selectedExpertiseAreas.includes(expertise.id);
                            
                            // Highlight search term if present
                            let displayName: React.ReactNode = expertise.name;
                            if (expertiseSearch) {
                              const index = expertise.name.toLowerCase().indexOf(expertiseSearch.toLowerCase());
                              if (index >= 0) {
                                const beforeMatch = expertise.name.substring(0, index);
                                const match = expertise.name.substring(index, index + expertiseSearch.length);
                                const afterMatch = expertise.name.substring(index + expertiseSearch.length);
                                displayName = (
                                  <>
                                    {beforeMatch}
                                    <span className="bg-yellow-100">{match}</span>
                                    {afterMatch}
                                  </>
                                );
                              }
                            }
                            
                            return (
                              <div
                                key={expertise.id}
                                onClick={() => {
                                  if (!isAlreadyAdded) {
                                    if (editingExpertiseId) {
                                      // In edit mode, only allow one selection
                                      setExpertiseFormData({ expertise_area: expertise.id });
                                      setSelectedExpertiseAreas([expertise.id]);
                                    } else {
                                      // In add mode, allow multiple selections
                                      toggleExpertiseSelection(expertise.id);
                                    }
                                  }
                                }}
                                className={`border rounded-md p-3 transition-colors ${
                                  isAlreadyAdded
                                    ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-blue-50 border-blue-300 shadow-sm cursor-pointer'
                                      : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {!isAlreadyAdded && (
                                      <div className="flex-shrink-0 h-4 w-4 mr-2">
                                        {isSelected ? (
                                          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        ) : (
                                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                          </svg>
                                        )}
                                      </div>
                                    )}
                                    {isAlreadyAdded && (
                                      <div className="flex-shrink-0 h-4 w-4 mr-2">
                                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                    <span className={`text-sm ${
                                      isAlreadyAdded 
                                        ? 'text-gray-500' 
                                        : isSelected
                                          ? 'font-medium text-blue-700' 
                                          : 'text-gray-700'
                                    }`}>
                                      {displayName}
                                    </span>
                                  </div>
                                  {isAlreadyAdded && (
                                    <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded">Added</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {expertiseSearch && VETERINARY_EXPERTISE_AREAS.filter(
                expertise => expertise.name.toLowerCase().includes(expertiseSearch.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg mt-4">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">No expertise areas found matching "{expertiseSearch}"</p>
                  <button 
                    type="button" 
                    onClick={() => setExpertiseSearch('')}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {!editingExpertiseId && selectedExpertiseAreas.length === 0 && !expertiseSearch && (
                <p className="text-sm text-red-500 mt-2">Please select at least one expertise area</p>
              )}
              
              {editingExpertiseId && !expertiseFormData.expertise_area && !expertiseSearch && (
                <p className="text-sm text-red-500 mt-2">Please select an expertise area</p>
              )}
            
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpertiseForm(false);
                    setExpertiseSearch('');
                    setSelectedExpertiseAreas([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    (editingExpertiseId && !expertiseFormData.expertise_area) || 
                    (!editingExpertiseId && selectedExpertiseAreas.length === 0) ||
                    isSubmittingExpertise
                  }
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center ${
                    ((editingExpertiseId && expertiseFormData.expertise_area) || 
                     (!editingExpertiseId && selectedExpertiseAreas.length > 0)) && !isSubmittingExpertise
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-300 text-white cursor-not-allowed'
                  }`}
                >
                  {isSubmittingExpertise ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : editingExpertiseId ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add {selectedExpertiseAreas.length > 0 ? `${selectedExpertiseAreas.length} Areas` : 'Expertise'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Expertise List */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Areas of Expertise</h3>
              <p className="text-sm text-gray-500 mt-1">Add your specialized areas of veterinary expertise</p>
            </div>
            {!showExpertiseForm && (
              <button
                onClick={handleAddExpertise}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Expertise
              </button>
            )}
          </div>
          
          {/* No expertise records message */}
          {expertiseList.length === 0 && !showExpertiseForm && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-gray-500 mb-2">No expertise records found</p>
              <p className="text-sm text-gray-400">Add your specialized areas of veterinary expertise to enhance your profile</p>
            </div>
          )}
          
          {/* Expertise list */}
          {expertiseList.length > 0 && (
            <div className="space-y-6">
              {/* Group expertise by category */}
              {EXPERTISE_CATEGORIES.map(category => {
                // Get expertise items in this category
                const categoryExpertise = expertiseList.filter(exp => {
                  const expertise = VETERINARY_EXPERTISE_AREAS.find(e => e.id === exp.expertise_area);
                  return expertise && expertise.category === category;
                });
                
                // Only render category if it has items
                if (categoryExpertise.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-3">
                    <h4 className="text-md font-medium text-gray-700 border-b pb-2">{category}</h4>
                    <div className="space-y-3">
                      {categoryExpertise
                        .map((expertise) => {
                          const expertiseDetails = VETERINARY_EXPERTISE_AREAS.find(e => e.id === expertise.expertise_area);
                          return (
                            <div key={expertise.expertise_id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                  </svg>
                                  <div>
                                    <h4 className="font-semibold text-lg text-gray-800">{expertiseDetails?.name || expertise.expertise_area}</h4>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditExpertise(expertise)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Edit"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpertise(expertise.expertise_id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Function to check if an expertise area is already added
  const isExpertiseAlreadyAdded = (expertiseId: string): boolean => {
    return expertiseList.some(item => item.expertise_area === expertiseId);
  };

  // Function to toggle expertise selection
  const toggleExpertiseSelection = (expertiseId: string) => {
    setSelectedExpertiseAreas(prev => {
      if (prev.includes(expertiseId)) {
        return prev.filter(id => id !== expertiseId);
      } else {
        return [...prev, expertiseId];
      }
    });
  };

  const handleEditBiography = () => {
    if (profileData) {
      setBiographyText(profileData.biography || '');
      setLanguages(profileData.preferred_languages || []);
      setSelectedLanguages(profileData.preferred_languages || []);
      setShowBiographyForm(true);
    }
  };
  
  const handleBiographyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBiographyText(e.target.value);
  };
  
  // Replace handleAddLanguage and handleRemoveLanguage with toggleLanguageSelection
  const toggleLanguageSelection = (languageId: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageId)) {
        return prev.filter(id => id !== languageId);
      } else {
        return [...prev, languageId];
      }
    });
  };
  
  // Check if a language is already added
  const isLanguageAlreadyAdded = (languageId: string): boolean => {
    return languages.includes(languageId);
  };
  
  const handleSubmitBiography = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSavingProfile(true);
      
      const payload = {
        biography: biographyText.trim() || null,
        preferred_languages: selectedLanguages.length > 0 ? selectedLanguages : null
      };
      
      await axiosInstance.put(API_ENDPOINTS.PROFILE, payload, { headers: { 'Content-Type': 'application/json' } });
      
      // Update profile data and hide form
      setShowBiographyForm(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileError('Failed to save profile data. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderBiographySection = () => {
    if (profileLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{profileError}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Biography Form */}
        {showBiographyForm && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
              Edit Professional Biography
            </h3>
            <form onSubmit={handleSubmitBiography}>
              <div className="mb-6">
                <label htmlFor="biography" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Biography
                </label>
                <textarea
                  id="biography"
                  name="biography"
                  rows={8}
                  value={biographyText}
                  onChange={handleBiographyChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="Write your professional biography here..."
                  maxLength={2000}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {2000 - biographyText.length} characters remaining
                </p>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select languages you speak <span className="text-red-500">*</span>
                  </label>
                  {selectedLanguages.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedLanguages.length} {selectedLanguages.length === 1 ? 'language' : 'languages'} selected
                    </span>
                  )}
                </div>
                
                {/* Flat list of languages without categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {VETERINARY_LANGUAGES.map(language => {
                    // Check if this language is already in profile languages (and not being edited)
                    const alreadyAdded = isLanguageAlreadyAdded(language.id) && 
                                        !selectedLanguages.includes(language.id);
                    
                    // Check if currently selected
                    const isSelected = selectedLanguages.includes(language.id);
                    
                    return (
                      <div
                        key={language.id}
                        onClick={() => {
                          if (!alreadyAdded) {
                            toggleLanguageSelection(language.id);
                          }
                        }}
                        className={`border rounded-md p-3 transition-colors ${
                          alreadyAdded
                            ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-50 border-blue-300 shadow-sm cursor-pointer'
                              : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {!alreadyAdded && (
                              <div className="flex-shrink-0 h-4 w-4 mr-2">
                                {isSelected ? (
                                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                  </svg>
                                )}
                              </div>
                            )}
                            {alreadyAdded && (
                              <div className="flex-shrink-0 h-4 w-4 mr-2">
                                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <span className={`text-sm ${
                              alreadyAdded 
                                ? 'text-gray-500' 
                                : isSelected
                                  ? 'font-medium text-blue-700' 
                                  : 'text-gray-700'
                            }`}>
                              {language.name}
                            </span>
                          </div>
                          {alreadyAdded && (
                            <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded">Added</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBiographyForm(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  {isSavingProfile ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Biography Display */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Professional Biography</h3>
              <p className="text-sm text-gray-500 mt-1">Share your professional story and expertise with pet owners</p>
            </div>
            {!showBiographyForm && (
              <button
                onClick={handleEditBiography}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {profileData?.biography ? 'Edit Biography' : 'Add Biography'}
              </button>
            )}
          </div>
          
          {/* Display biography if available */}
          {profileData?.biography ? (
            <div className="space-y-6">
              <div className="prose max-w-none">
                {profileData.biography.split('\n').map((paragraph, index) => (
                  paragraph ? <p key={index} className="text-gray-800">{paragraph}</p> : <br key={index} />
                ))}
              </div>
              
              {/* Languages Section - Updated to display without categories */}
              {profileData.preferred_languages && profileData.preferred_languages.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Languages Spoken</h4>
                  
                  {/* Flat list of languages without categories */}
                  <div className="flex flex-wrap gap-2">
                    {profileData.preferred_languages.map(langId => {
                      const langObj = VETERINARY_LANGUAGES.find(l => l.id === langId);
                      const langName = langObj ? langObj.name : getLanguageNameById(langId);
                      
                      return (
                        <span 
                          key={langId} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {langName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <p className="text-gray-500 mb-2">No biography added yet</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Add your professional biography to share your experience, specialties, and approach with pet owners.
                This helps build trust and showcases your expertise.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // PhotosSection ekle
  const renderPhotosSection = () => {
    if (photosLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      );
    }

    if (photosError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{photosError}</p>
            </div>
          </div>
        </div>
      );
    }

    const hasPhoto = photos.length > 0;
    const currentPhoto = hasPhoto ? photos[0] : null;

    return (
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Profile Picture</h3>
            <p className="text-sm text-gray-500 mt-1">Add a professional profile picture to enhance your presence</p>
          </div>
        </div>
        
        {/* No photo message */}
        {!hasPhoto && (
          <div className="flex flex-col items-center">
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 w-full max-w-lg mx-auto mb-6">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mb-2">No profile picture yet</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto pb-4">
                Add a professional profile picture to enhance your presence and build trust with pet owners.
              </p>
              
              <label 
                htmlFor="photo-upload-empty" 
                className={`px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center cursor-pointer ${uploadingPhoto ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {uploadingPhoto ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Picture
                  </>
                )}
                <input 
                  id="photo-upload-empty" 
                  type="file" 
                  key={fileInputKey + "-empty"}
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload} 
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
          </div>
        )}
        
        {/* Single photo display */}
        {currentPhoto && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-center mb-4">
                <div className="relative w-full flex justify-center">
                  <img
                    src={currentPhoto.veterinarian_album_photo_url}
                    alt="Veterinarian profile"
                    className="rounded-lg shadow-md object-contain max-h-[400px]"
                  />
                </div>
              </div>
              
              <div className="mt-2 text-center mb-4">
                <p className="text-xs text-gray-500">
                  Uploaded on {new Date(currentPhoto.veterinarian_album_photo_url_created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => confirmDeletePhoto(currentPhoto.veterinarian_album_photo_id)}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors shadow-sm inline-flex items-center"
                  disabled={deletePhotoLoading}
                >
                  {deletePhotoLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Picture
                    </>
                  )}
                </button>
                
                <label 
                  htmlFor="photo-upload" 
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center cursor-pointer ${uploadingPhoto ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {uploadingPhoto ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Change Picture
                    </>
                  )}
                  <input 
                    id="photo-upload" 
                    type="file" 
                    key={fileInputKey}
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fetch my clinic to see if the veterinarian is already associated with a clinic
  const fetchMyClinic = async () => {
    try {
      setMyClinicLoading(true);
      
      const response = await axiosInstance.get(`/veterinarian/my-clinic`);
      
      if (response.data && response.data.success) {
        setMyClinic(response.data.clinic);
        // If user is associated with a clinic, they can't have pending requests
        setHasPendingRequest(false);
        setPendingRequestDetails(null);
      } else {
        setMyClinic(null);
        // Check for pending requests separately
        await checkPendingRequests();
      }
    } catch (error) {
      console.error('Error fetching my clinic:', error);
      setMyClinic(null);
    } finally {
      setMyClinicLoading(false);
    }
  };
  
  // Fetch verification status
  const fetchVerificationStatus = async () => {
    try {
      setVerificationLoading(true);
      
      const response = await axiosInstance.get(API_ENDPOINTS.VERIFICATION_STATUS);
      
      
      if (response.data && response.data.verification_status) {
        setVerificationStatus(response.data.verification_status);
      } else {
        setVerificationStatus('unverified');
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setVerificationStatus('unverified');
    } finally {
      setVerificationLoading(false);
    }
  };
  
  // Search for clinics
  const searchClinics = async () => {
    if (!clinicSearchQuery.trim()) return;
    
    try {
      setClinicSearchLoading(true);
      setClinicSearchError(null);
      setClinics([]);
      
      const response = await axiosInstance.get(`/pet-owners/search-clinics`, { params: {
          query: clinicSearchQuery,
          limit: 50
        } });
      
      if (response.data && response.data.success && Array.isArray(response.data.clinics)) {
        const clinicsData = response.data.clinics;
        
        // Get clinic ids for operator information
        const clinicIds = clinicsData.map((clinic: Clinic) => clinic.clinic_id);
        
        if (clinicIds.length > 0) {
          try {
            // Fetch operators for all clinics in a single request
            const operatorsResponse = await axiosInstance.post(`/veterinarian/clinic-operators`, { clinicIds });
            
            if (operatorsResponse.data && operatorsResponse.data.success) {
              const operatorsMap = operatorsResponse.data.operators;
              
              // Add operator info to each clinic
              const clinicsWithOperators = clinicsData.map((clinic: Clinic) => {
                if (operatorsMap[clinic.clinic_id]) {
                  return {
                    ...clinic,
                    operator_name: operatorsMap[clinic.clinic_id].operator_name,
                    operator_surname: operatorsMap[clinic.clinic_id].operator_surname
                  };
                }
                return clinic;
              });
              
              setClinics(clinicsWithOperators);
            } else {
              console.warn('Failed to fetch operators for clinics');
              setClinics(clinicsData);
            }
          } catch (operatorError) {
            console.error('Error fetching clinic operators:', operatorError);
            setClinics(clinicsData);
          }
        } else {
          setClinics(clinicsData);
        }
      } else {
        setClinicSearchError('Failed to fetch clinics. Please try again.');
      }
    } catch (error) {
      console.error('Error searching clinics:', error);
      setClinicSearchError('An error occurred while searching for clinics. Please try again.');
    } finally {
      setClinicSearchLoading(false);
    }
  };
  
  // Handle clinic search input change
  const handleClinicSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClinicSearchQuery(e.target.value);
  };
  
  // Handle clinic search form submit
  const handleClinicSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchClinics();
  };
  
  // Show join confirmation modal
  const showJoinConfirmation = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setShowJoinConfirmationModal(true);
    setClinicJoinError(null);
  };
  
  // Send join request
  const sendJoinRequest = async () => {
    if (!selectedClinic) return;
    
    try {
      setClinicJoinLoading(true);
      setClinicJoinError(null);
      
      const response = await axiosInstance.post(`/veterinarian/request-join-clinic/${selectedClinic.clinic_id}`, {});
      
      if (response.data && response.data.success) {
        setClinicJoinSuccess(`Your request to join ${selectedClinic.clinic_name} has been sent successfully!`);
        setShowJoinConfirmationModal(false);
        
        // Check pending requests after submitting
        await checkPendingRequests();
        fetchMyClinic(); // Refresh my clinic status
        
        // Overview sayfasının güncellenmesi için event tetikle
        localStorage.setItem('clinic_status_changed', 'true');
        const event = new Event('clinicStatusChanged');
        window.dispatchEvent(event);
      } else {
        setClinicJoinError('Failed to send join request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      setClinicJoinError(getApiErrorMessage(error, 'An error occurred while sending the join request. Please try again.'));
    } finally {
      setClinicJoinLoading(false);
    }
  };
  
  // Render clinic search section
  const renderClinicSearchSection = () => {
    if (myClinicLoading || verificationLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      );
    }
    
    // If the veterinarian is already associated with a clinic, show the clinic info
    if (myClinic) {
      return (
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">My Clinic</h3>
              <p className="text-sm text-gray-500 mt-1">You are currently associated with the following clinic</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{myClinic.clinic_name}</h3>
              </div>
              <button
                onClick={showLeaveConfirmation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
              >
                Leave Clinic
              </button>
            </div>
          </div>
          
          {/* Klinikten ayrılma onay modalı */}
          {showLeaveConfirmationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Clinic Confirmation</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to leave <span className="font-semibold">{myClinic.clinic_name}</span>? This action cannot be undone.
                </p>
                
                {leaveClinicError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-sm text-red-700">{leaveClinicError}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowLeaveConfirmationModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                    disabled={leavingClinicLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeaveClinic}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
                    disabled={leavingClinicLoading}
                  >
                    {leavingClinicLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Leave Clinic'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // The clinic search content
    const clinicSearchContent = (
      <div>
        {/* Pending Request Banner */}
        {hasPendingRequest && pendingRequestDetails && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-10a1 1 0 10-2 0v3.5a1 1 0 102 0V8zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  You have a pending join request for {pendingRequestDetails.clinic_name || 'a clinic'}.
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  You cannot send new join requests until this request is approved or canceled.
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  Request sent on {pendingRequestDetails.created_at ? new Date(pendingRequestDetails.created_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Form */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Clinic Search</h3>
              <p className="text-sm text-gray-500 mt-1">Search for clinics and send join requests</p>
            </div>
          </div>
          
          <form onSubmit={handleClinicSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                value={clinicSearchQuery}
                onChange={handleClinicSearchInputChange}
                placeholder="Search for clinics by name, location, or services..."
                className="w-full p-4 pl-12 pr-14 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                disabled={hasPendingRequest}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="submit"
                  className={`px-4 py-2 ${hasPendingRequest 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md text-sm font-medium transition-colors shadow-sm inline-flex items-center`}
                  disabled={clinicSearchLoading || !clinicSearchQuery.trim() || hasPendingRequest}
                >
                  {clinicSearchLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Success Message */}
        {clinicJoinSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{clinicJoinSuccess}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setClinicJoinSuccess(null)}
                    className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {clinicSearchError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{clinicSearchError}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Results */}
        {clinics.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Results</h3>
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <div key={clinic.clinic_id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{clinic.clinic_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {clinic.location_name ? (
                          `${clinic.location_name}, ${clinic.location_district}, ${clinic.location_province}`
                        ) : (
                          `${clinic.district}, ${clinic.province}`
                        )}
                      </p>
                      {clinic.operator_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Clinic Owner:</span> {clinic.operator_name} {clinic.operator_surname}
                        </p>
                      )}
                      {clinic.services && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {clinic.services.split(',').map((service, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {service.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start">
                      {clinic.status ? (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Associated
                        </div>
                      ) : (
                        <button
                          onClick={() => showJoinConfirmation(clinic)}
                          disabled={hasPendingRequest}
                          className={`px-3 py-1 ${
                            hasPendingRequest
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          } rounded-md text-sm font-medium transition-colors`}
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Loading Indicator */}
        {clinicSearchLoading && (
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="flex justify-center items-center py-8">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              <p className="text-gray-600 ml-4 font-medium">Searching clinics...</p>
            </div>
          </div>
        )}
        
        {/* No Results Found */}
        {!clinicSearchLoading && clinicSearchQuery && clinics.length === 0 && !clinicSearchError && (
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="text-center py-10">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clinics found</h3>
              <p className="mt-1 text-sm text-gray-500">Try changing your search query to find more results.</p>
            </div>
          </div>
        )}
      </div>
    );
    
    // Render content with or without blur overlay based on verification status
    if (verificationStatus !== 'verified') {
      return (
        <div className="relative">
          {/* Blurred content */}
          <div className="blur-sm pointer-events-none">
            {clinicSearchContent}
          </div>
          
          {/* Verification required overlay - horizontal banner style */}
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10 rounded-lg">
            <div className={`bg-white shadow-lg rounded-lg border ${verificationStatus === 'pending' ? 'border-yellow-300 border-2' : 'border-red-300 border-2'} p-6 w-full max-w-3xl mx-auto`}>
              <div className="flex flex-col md:flex-row items-center">
                <div className="flex-shrink-0 mr-6 mb-4 md:mb-0">
                  {verificationStatus === 'pending' ? (
                    <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className={`text-xl font-semibold ${verificationStatus === 'pending' ? 'text-yellow-800' : 'text-red-800'} mb-2`}>
                    {verificationStatus === 'pending' ? 'Verification In Progress' : 'Verification Required'}
                  </h3>
                  <p className="text-gray-700 mb-4 font-medium">
                    {verificationStatus === 'pending' 
                      ? "Your verification is pending approval. Once your account is verified, you'll be able to search and join clinics. Thank you for your patience."
                      : "You must be a verified veterinarian to search and join clinics. Please complete the verification process to access this feature."}
                  </p>
                  <div className={`inline-flex ${verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} px-4 py-2 rounded-full text-sm font-medium`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold">{verificationStatus === 'pending' ? 'Verification Pending' : 'Not Verified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Return normal content for verified veterinarians
    return clinicSearchContent;
  };

  // Function to check if veterinarian has pending requests
  const checkPendingRequests = async () => {
    try {
      const response = await axiosInstance.get(`/veterinarian/check-pending-requests`);
      
      if (response.data && response.data.success) {
        setHasPendingRequest(response.data.hasPendingRequest);
        setPendingRequestDetails(response.data.pendingRequest);
      } else {
        setHasPendingRequest(false);
        setPendingRequestDetails(null);
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
      setHasPendingRequest(false);
      setPendingRequestDetails(null);
    }
  };

  // Klinikten ayrılma fonksiyonu
  const handleLeaveClinic = async () => {
    if (!myClinic) return;
    
    try {
      setLeavingClinicLoading(true);
      setLeaveClinicError(null);
      
      const response = await axiosInstance.delete(`/veterinarian/leave-clinic/${myClinic.id}`);
      
      if (response.data && response.data.success) {
        // Başarıyla ayrılındı
        setMyClinic(null);
        setShowLeaveConfirmationModal(false);
        setClinicJoinSuccess("You have successfully left the clinic.");
        
        // Overview sayfasındaki hasApprovedClinic state'inin güncellenmesi için event tetikle
        localStorage.setItem('clinic_status_changed', 'true');
        // Custom event fırlat
        const event = new Event('clinicStatusChanged');
        window.dispatchEvent(event);
      } else {
        setLeaveClinicError('Failed to leave clinic. Please try again.');
      }
    } catch (error) {
      console.error('Error leaving clinic:', error);
      setLeaveClinicError(getApiErrorMessage(error, 'An error occurred while leaving the clinic. Please try again.'));
    } finally {
      setLeavingClinicLoading(false);
    }
  };

  // Klinikten ayrılma onay modalını gösterme fonksiyonu
  const showLeaveConfirmation = () => {
    setShowLeaveConfirmationModal(true);
    setLeaveClinicError(null);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Profile Tabs */}
      <div className="px-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('education')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'education'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Education
            </div>
          </button>
          <button
            onClick={() => setActiveTab('certifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'certifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Certifications
            </div>
          </button>
          <button
            onClick={() => setActiveTab('expertise')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'expertise'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Areas of Expertise
            </div>
          </button>
          <button
            onClick={() => setActiveTab('biography')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'biography'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Biography
            </div>
          </button>
          {/* Photos tab */}
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'photos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Profile Picture
            </div>
          </button>
          {/* Clinics tab */}
          <button
            onClick={() => setActiveTab('clinics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'clinics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Clinics
            </div>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'education' && renderEducationSection()}
        {activeTab === 'certifications' && renderCertificationsSection()}
        {activeTab === 'expertise' && renderExpertiseSection()}
        {activeTab === 'biography' && renderBiographySection()}
        {activeTab === 'photos' && renderPhotosSection()}
        {activeTab === 'clinics' && renderClinicSearchSection()}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Delete {deleteType === 'education' ? 'Education' : deleteType === 'certification' ? 'Certification' : deleteType === 'expertise' ? 'Expertise' : 'Photo'} {deleteType !== 'photo' ? 'Record' : ''}
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Join Clinic Confirmation Modal */}
      {showJoinConfirmationModal && selectedClinic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Confirm Join Request
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to send a request to join <span className="font-semibold">{selectedClinic.clinic_name}</span>?
            </p>
            
            {clinicJoinError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-r-md shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{clinicJoinError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowJoinConfirmationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendJoinRequest}
                disabled={clinicJoinLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
              >
                {clinicJoinLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Confirm & Send Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinarianProfile; 
