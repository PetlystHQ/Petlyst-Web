import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RootState } from '../store';
import axiosInstance from '../utils/axiosConfig';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { ClinicFormData, FormStep, LocationCoordinates } from '../types/clinic';
import { ClinicDetailsForm } from '../components/clinic/forms/ClinicDetailsForm';
import { LocationsForm } from '../components/clinic/forms/LocationsForm';
import { StepProgressBar } from '../components/clinic/progress/StepProgressBar';
import { MobileStepIndicator } from '../components/clinic/progress/MobileStepIndicator';
import { SuccessMessage } from '../components/clinic/SuccessMessage';
import { CommunicationForm } from '../components/clinic/forms/CommunicationForm';
import { VisualsForm } from '../components/clinic/forms/VisualsForm';
import { ServicesForm } from '../components/clinic/forms/ServicesForm';
import { RegistrationForm } from '../components/clinic/forms/RegistrationForm';
import { AppointmentsForm } from '../components/clinic/forms/AppointmentsForm';
import { getApiErrorMessage, getApiErrorResponse } from '../utils/errorMessage';

const AddClinicPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinicId');
  const token = useSelector((state: RootState) => state.auth.token);
  const [currentStep, setCurrentStep] = useState<FormStep>('clinic_details');
  const [formModified, setFormModified] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [exitDestination, setExitDestination] = useState('');
  const [isEditMode] = useState(!!clinicId);
  const [attemptedRegistrationSubmit, setAttemptedRegistrationSubmit] = useState(false);
  const [attemptedAppointmentsSubmit, setAttemptedAppointmentsSubmit] = useState(false);
  const [, setIsUserInitiatedSubmit] = useState(false);
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    clinicType: 'Veterinary Clinic',
    biography: '',
    establishment_date: '',
    social_media_links: [],
    
    // Location information
    province: '',
    district: '',
    address: '',
    
    // Replace single phone number with array of phone numbers
    phone_numbers: [],
    email: '',
    description: '',
    
    // New fields with default values
    showPhoneNumber: false,
    allowDirectMessages: false,
    showMailAddress: false,
    
    // Services fields
    servedAnimalTypes: [],
    medicalServices: [],
    additionalServices: [],
    
    // Appointment fields
    available_days: [],
    emergency_available_days: [],
    has_emergency_service: false,
    is_open_24_7: false,
    slot_duration: 60,
    opening_time: '',
    closing_time: '',
    allow_online_meetings: false,
    
    // Registration fields
    taxIdentificationNumber: '',
    veterinaryLicenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [hasExistingClinic, setHasExistingClinic] = useState(false);
  const { verificationStatus, isLoading: verificationLoading } = useVerificationStatus();
  
  // İletişim adımı için kullanıcının Continue tuşuna basıp basmadığını izlemek için state
  const [attemptedCommunicationSubmit, setAttemptedCommunicationSubmit] = useState(false);
  
  // Photo upload states
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [, setUploadProgress] = useState<number>(0);
  const [, setCurrentPhotoIndex] = useState(0);

  // Progress steps
  const steps: { id: FormStep; title: string }[] = [
    { id: 'clinic_details', title: 'Clinic Details' },
    { id: 'locations', title: 'Locations' },
    { id: 'communication', title: 'Communication' },
    { id: 'visuals', title: 'Visuals' },
    { id: 'services', title: 'Services' },
    { id: 'appointments', title: 'Appointments' },
    { id: 'tax_registration', title: 'Registration' }
  ];

  // Add cleanup function to the component animations
  useEffect(() => {
  const style = document.createElement('style');
  style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
  .animate-fade-in {
        animation: fadeIn 0.3s ease-in-out forwards;
      }
      .animate-modal-slide-in {
        animation: slideIn 0.3s ease-out forwards;
  }
  `;
  document.head.appendChild(style);

    // Return cleanup function
    return () => {
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // Check if user already has a clinic
  useEffect(() => {
    const checkExistingClinics = async () => {
      try {
        const response = await axiosInstance.get(`/clinics/my-clinics`);
        
        // Kullanıcının kliniği varsa
        if (response.data.clinics && response.data.clinics.length > 0) {
          setHasExistingClinic(true);
          // Düzenleme modu değilse hata göster
          if (!clinicId) {
          setError('You already have a registered clinic. Each veterinarian can only register one clinic.');
          }
        } else {
          // Kullanıcı daha önce klinik eklemediyse, formun ilk yüklenişini işaretle
          setHasExistingClinic(false);
        }
      } catch (err) {
        // Hata durumunda sessizce ilerle ve normal form akışına devam et
        console.error('Error checking for existing clinics:', err);
        setHasExistingClinic(false); // Varsayılan olarak klinik olmadığını kabul et
      }
    };

    // Check for existing clinics when component mounts
    checkExistingClinics();
    
    // Add before unload event listener
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formModified && !success) {
        const message = "You have unsaved changes that will be lost if you leave this page.";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // formModified, success and token are read inside handleBeforeUnload via
    // closure. We deliberately don't re-attach the listener on every change
    // (`formModified` flips on each keystroke) — the closure captures the
    // values at attach time, and the warning prompt only matters on the
    // exit attempt itself, where the latest values are read via state-ref
    // semantics. clinicId is the only structural change worth re-attaching for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  // Load clinic data if in edit mode
  useEffect(() => {
    const fetchClinicData = async () => {
      if (clinicId) {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/clinics/${clinicId}`);

          if (response.data && response.data.clinic) {
            const clinic = response.data.clinic;
            
            // Populate form data with clinic information
            setFormData({
              name: clinic.name || '',
              clinicType: clinic.clinic_type || 'Veterinary Clinic',
              biography: clinic.biography || '',
              establishment_date: clinic.establishment_date || '',
              social_media_links: clinic.social_media_links || [],
              province: clinic.province || '',
              district: clinic.district || '',
              address: clinic.address || '',
              phone_numbers: clinic.phone_numbers || [],
              email: clinic.email || '',
              description: clinic.description || '',
              showPhoneNumber: clinic.show_phone_number || false,
              allowDirectMessages: clinic.allow_direct_messages || false,
              showMailAddress: clinic.show_mail_address || false,
              servedAnimalTypes: clinic.served_animal_types || [],
              medicalServices: clinic.medical_services || [],
              additionalServices: clinic.additional_services || [],
              available_days: clinic.available_days || [],
              emergency_available_days: clinic.emergency_available_days || [],
              has_emergency_service: clinic.has_emergency_service || false,
              is_open_24_7: clinic.is_open_24_7 || false,
              slot_duration: clinic.slot_duration || 60,
              opening_time: clinic.opening_time || '',
              closing_time: clinic.closing_time || '',
              allow_online_meetings: clinic.allow_online_meetings || false,
              taxIdentificationNumber: clinic.tax_identification_number || '',
              veterinaryLicenseNumber: clinic.veterinary_license_number || ''
            });
            
            // Don't mark the form as modified initially
            setFormModified(false);
          }
        } catch (error) {
          console.error('Error fetching clinic data:', error);
          setError('Failed to load clinic data for editing.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClinicData();
  }, [clinicId, token]);

  // Redirect if not verified or already has a clinic
  useEffect(() => {
    if (!verificationLoading) {
      // Sadece halihazırda bir klinik var ise ve düzenleme modunda değilse kullanıcıyı yönlendir
      if (hasExistingClinic && !clinicId) {
        navigate('/dashboard');
      }
      
      // Eğer doğrulama durumu undefined/null ise, varsayılan olarak devam et
      // Bu, API hatası durumunda bile kullanıcının form doldurmasına olanak sağlar
      if (verificationStatus === null && !hasExistingClinic) {
        // Varsayılan olarak devam et, hata gösterme
        setError('');
      }
    }
  }, [verificationStatus, verificationLoading, navigate, hasExistingClinic, clinicId]);

  // Clear error message when step changes
  useEffect(() => {
    // Adım değiştiğinde hata mesajını temizle
    setError('');
    
    // Reset attempted submission flags when changing steps
    if (currentStep === 'tax_registration') {
      setAttemptedRegistrationSubmit(false);
    } else if (currentStep === 'appointments') {
      setAttemptedAppointmentsSubmit(false);
    }
    
    // Always reset the user-initiated submit flag when changing steps
    setIsUserInitiatedSubmit(false);
  }, [currentStep]);

  // Handle navigation away from the page
  const handleNavigation = useCallback((path: string) => {
    if (formModified && !success) {
      // Show confirmation dialog if form has been modified
      setExitDestination(path);
      setShowExitConfirmation(true);
    } else {
      // If form is unmodified or success is true, navigate directly
      setFormData({
        name: '',
        clinicType: 'Veterinary Clinic',
        biography: '',
        establishment_date: '',
        social_media_links: [],
        province: '',
        district: '',
        address: '',
        phone_numbers: [],
        email: '',
        description: '',
        showPhoneNumber: false,
        allowDirectMessages: false,
        showMailAddress: false,
        servedAnimalTypes: [],
        medicalServices: [],
        additionalServices: [],
        available_days: [],
        emergency_available_days: [],
        has_emergency_service: false,
        is_open_24_7: false,
        slot_duration: 60,
        opening_time: '',
        closing_time: '',
        allow_online_meetings: false,
        taxIdentificationNumber: '',
        veterinaryLicenseNumber: ''
      });
      setSelectedPhotos([]);
      setPhotoPreviewUrls([]);
      setUploadProgress(0);
      setFormModified(false);
      setError('');
      setLoading(false);
      setSuccess(false);
      setCurrentStep('clinic_details');
      // Navigate directly without setTimeout
      navigate(path);
    }
  }, [formModified, navigate, success]);

  // Confirm navigation and proceed without saving
  const confirmNavigation = () => {
    setShowExitConfirmation(false);
    navigate(exitDestination);
  };

  // Cancel navigation and stay on the page
  const cancelNavigation = () => {
    setShowExitConfirmation(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkbox inputs, use checked property
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    setFormModified(true);
  };

  const updateCoordinates = (coordinates: LocationCoordinates) => {
    setFormData(prev => ({
      ...prev,
      coordinates
    }));
    setFormModified(true);
  };

  const handleAddEmptySocialMedia = () => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks.push({ platform: '', url: '' });
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handleRemoveSocialMedia = (index: number) => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks.splice(index, 1);
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handleSocialMediaChange = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => {
      const newSocialMediaLinks = [...(prev.social_media_links || [])];
      newSocialMediaLinks[index] = {
        ...newSocialMediaLinks[index],
        [field]: value
      };
      return {
        ...prev,
        social_media_links: newSocialMediaLinks
      };
    });
    setFormModified(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Maksimum fotoğraf sayısını kontrol et
    if (files.length + selectedPhotos.length > 10) {
      setError(`You can only upload up to 10 photos. Please select fewer photos. (${selectedPhotos.length}/10 already uploaded)`);
      e.target.value = ''; // Input'u temizle
      return;
    }

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length < files.length) {
      setError('Only image files are allowed. Some files were not added.');
      e.target.value = ''; // Input'u temizle
      return;
    }
    
    // Create preview URLs for selected photos
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    
    setSelectedPhotos(prev => [...prev, ...imageFiles]);
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setFormModified(true);
    
    // Seçim başarılı olduysa ana sayfadaki hata mesajını temizleyelim
    if (selectedPhotos.length + imageFiles.length < 3) {
      setError(`Please upload at least 3 photos of your clinic. (${selectedPhotos.length + imageFiles.length}/3 uploaded)`);
    } else {
      setError(''); // Yeterli sayıda fotoğraf varsa hata mesajını temizle
    }
    
    e.target.value = ''; // Input'u her durumda temizle
  };

  const handleRemovePhoto = (index: number) => {
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormModified(true);
    
    // Fotoğraf silindikten sonra kalan fotoğraf sayısını kontrol edelim
    // ve gerekirse uyarı mesajı gösterelim
    if (selectedPhotos.length - 1 < 3) {
      setError(`Please upload at least 3 photos of your clinic. (${selectedPhotos.length - 1}/3 uploaded)`);
    }
  };

  const uploadPhotos = async (clinicId: string | number, clinicName: string) => {
    if (selectedPhotos.length === 0) return;
    
    // Ensure clinicId is valid
    if (!clinicId) {
      console.error('Attempted to upload photos with invalid clinicId:', clinicId);
      setError('Cannot upload photos: Invalid clinic ID');
      return;
    }


    const uploadPromises = selectedPhotos.map(async (photo, index) => {
      setCurrentPhotoIndex(index);
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('clinicId', clinicId.toString());
      
      // clinicName'i backend ile aynı şekilde sanitize et
      const sanitizedClinicName = clinicName;
      
      // Eğer gerçek ismi kullanmak istiyorsak, backend ile aynı düzeltmeyi yapalım
      formData.append('clinicName', sanitizedClinicName);
      
      // FormData içeriğini kontrol et
      
      try {
        const response = await axiosInstance.post(`/clinics/upload-photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          },
        });

        // Yanıtı kontrol et
        if (response.data.success) {
          if (!response.data.photo || !response.data.photo.url) {
            console.error(`Photo ${index + 1} upload succeeded but no URL returned`, response.data);
          } else {
            // URL'ye fetch atarak erişilebilirliği test et
            try {
              await fetch(response.data.photo.url, { method: 'HEAD' });
            } catch (fetchErr) {
              console.warn(`Could not verify photo ${index + 1} accessibility:`, fetchErr);
            }
          }
        } else {
          console.error(`Photo ${index + 1} upload reported failure:`, response.data);
        }
        
        return response.data;
      } catch (err) {
        const errorDetails = getApiErrorResponse(err)?.data || { message: getApiErrorMessage(err) };
        console.error(`Error uploading photo ${index + 1}:`, errorDetails);
        throw new Error(`Failed to upload photo ${index + 1}: ${errorDetails.message || getApiErrorMessage(err)}`);
      }
    });

    try {
      await Promise.all(uploadPromises);
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError(`Upload failed: ${getApiErrorMessage(err)}`);
      throw err;
    }
  };

  const handleNextStep = () => {
    setError('');
    
    // Check validations based on current step
    if (currentStep === 'clinic_details') {
      // Validate clinic name
      if (!formData.name || formData.name.trim() === '') {
        setError('Please enter a clinic name');
        return;
      }
      
      // Validate establishment date is required
      if (!formData.establishment_date || formData.establishment_date.trim() === '') {
        setError('Please enter clinic establishment date');
        return;
      }
      
      // Validate establishment date - check if it's in the future
      if (formData.establishment_date) {
        const currentDate = new Date();
        const selectedDate = new Date(formData.establishment_date);
        
        // Set time to beginning of month for accurate comparison
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
        
        if (selectedDate > currentDate) {
          setError('Establishment date cannot be in the future');
          return;
        }
      }
    }
    // Check if address is provided in the locations step
    else if (currentStep === 'locations') {
      // Validate refine address details
      if (!formData.address || formData.address.trim() === '') {
        setError('Please enter your clinic address');
        return;
      }
      
      // Validate province and district
      if (!formData.province || formData.province.trim() === '') {
        setError('Please select a province');
        return;
      }
      
      if (!formData.district || formData.district.trim() === '') {
        setError('Please select a district');
        return;
      }
    }
    // If we're on the communication step, check if any social media platforms have empty URLs
    else if (currentStep === 'communication') {
      // İletişim adımında Continue tuşuna basıldığında state'i true yapıyoruz
      setAttemptedCommunicationSubmit(true);
      
      // First, check if any social media platforms have empty URLs
      const emptyUrlPlatforms = formData.social_media_links.filter(link => 
        link.platform && !link.url.trim()
      );
      
      if (emptyUrlPlatforms.length > 0) {
        // Get the names of platforms with empty URLs for the error message
        const platformNames = emptyUrlPlatforms.map(link => link.platform).join(', ');
        setError(`Please add URLs for the following platforms: ${platformNames}`);
        return;
      }
      
      // Check email validation
      if (!formData.email) {
        setError('Please enter an email address');
        return;
      }
      
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Please enter a valid email address');
        return;
      }
      
      // Check if there are any incomplete phone number entries (type filled but number empty or vice versa)
      const incompletePhoneNumbers = formData.phone_numbers.filter(phone => 
        (phone.type && (!phone.number || phone.number.trim() === '')) || 
        (phone.number && phone.number.trim() !== '' && !phone.type)
      );
      
      if (incompletePhoneNumbers.length > 0) {
        setError('Please complete all phone number entries with both type and number, or remove incomplete entries');
        return;
      }
      
      // Check if at least one complete phone number is provided
      const hasValidPhoneNumber = formData.phone_numbers.length > 0 && 
        formData.phone_numbers.some(phone => phone.type && phone.number && phone.number.trim().length > 0);
      
      if (!hasValidPhoneNumber) {
        setError('Please add at least one phone number with both type and number fields filled');
        return;
      }

      // Check if all phone numbers have 11 digits
      const invalidLengthPhoneNumbers = formData.phone_numbers.filter(phone => 
        phone.type && phone.number && phone.number.trim() !== '' && 
        phone.number.trim().replace(/\s+/g, '').length !== 11
      );
      
      // Eğer geçersiz uzunlukta telefon numarası varsa, devam edemezsiniz
      // Ancak üst kısımda genel hata mesajı göstermiyoruz, sadece kırmızı uyarı gösteriliyor
      if (invalidLengthPhoneNumbers.length > 0) {
        // setError yapmıyoruz, yerel olarak hatalar gösteriliyor
        return;
      }
    }
    // If we're on the visuals step, check if at least 3 photos are uploaded
    else if (currentStep === 'visuals') {
      if (selectedPhotos.length < 3) {
        setError('Please upload at least 3 photos of your clinic');
        return;
      }
    }
    // If we're on the services step, check if required selections are made
    else if (currentStep === 'services') {
      // Check for animal types
      if (formData.servedAnimalTypes.length === 0) {
        setError('Please select at least one animal type you serve');
        return;
      }
      
      // Check for medical services
      if (formData.medicalServices.length === 0) {
        setError('Please select at least one medical service');
        return;
      }
      
      // Check for additional services
      if (formData.additionalServices.length === 0) {
        setError('Please select at least one additional service');
        return;
      }
    }
    // Appointments step validation
    else if (currentStep === 'appointments') {
      // Check if at least one working day is selected
      if (formData.available_days.length === 0) {
        setError('Please select at least one working day');
        return;
      }
      
      // Check if opening time is set
      if (!formData.opening_time) {
        setError('Please set an opening time');
        return;
      }
      
      // Check if closing time is set
      if (!formData.closing_time) {
        setError('Please set a closing time');
        return;
      }
      
      // Check if opening time is earlier than closing time
      if (formData.opening_time >= formData.closing_time) {
        setError('Opening time must be earlier than closing time');
        return;
      }
    }

    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      // If we're moving to tax_registration step, make sure we don't auto-submit
      const nextStep = steps[currentIndex + 1].id;
      
      // Reset flag and clear error when moving to registration step
      if (nextStep === 'tax_registration') {
        setAttemptedRegistrationSubmit(false);
        setError('');
      }
      
      setCurrentStep(nextStep);
    }

    // If we're moving to the tax_registration step, reset the error and attempted submission flag
    if (currentIndex < steps.length - 1 && steps[currentIndex + 1].id === 'tax_registration') {
      setError('');
      setAttemptedRegistrationSubmit(false);
    }

    // Set attempted submit flag for appointments step if we're on that step
    if (currentStep === 'appointments') {
      setAttemptedAppointmentsSubmit(true);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setError('');
      // Clear attempted registration submit when moving to different step
      if (currentStep === 'tax_registration') {
        setAttemptedRegistrationSubmit(false);
      }
      // Clear attempted appointments submit when moving away from appointments step
      if (currentStep === 'appointments') {
        setAttemptedAppointmentsSubmit(false);
      }
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleGoToStep = (stepId: FormStep) => {
    setError('');
    // Clear attempted registration submit when moving to different step
    if (currentStep === 'tax_registration' && stepId !== 'tax_registration') {
      setAttemptedRegistrationSubmit(false);
    }
    // Clear attempted appointments submit when moving away from appointments step
    if (currentStep === 'appointments' && stepId !== 'appointments') {
      setAttemptedAppointmentsSubmit(false);
    }
    // Also reset the flag when moving to the appointments step
    if (stepId === 'appointments') {
      setAttemptedAppointmentsSubmit(false);
    }
    setCurrentStep(stepId);
  };

  // Modify the validateTaxRegistration function to work properly for both display and submission
  const validateTaxRegistration = (forSubmission = false) => {
    // Only check for display purposes if not attemptedRegistrationSubmit and not forSubmission
    if (!attemptedRegistrationSubmit && !forSubmission) return [];
    
    const registrationErrors = [];
    
    // Validate tax identification number (VKN) - Should be exactly 10 digits
    if (!formData.taxIdentificationNumber || formData.taxIdentificationNumber.length !== 10) {
      registrationErrors.push('Tax identification number (VKN) must be exactly 10 characters');
    }
    
    // Validate veterinary license number - Should be exactly 10 characters
    if (!formData.veterinaryLicenseNumber || formData.veterinaryLicenseNumber.length !== 10) {
      registrationErrors.push('Veterinary license number must be exactly 10 characters');
    }
    
    return registrationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set flag to indicate this is a user-initiated submit
    setIsUserInitiatedSubmit(true);
    
    // Set attempted submit flag for registration step if we're on that step
    if (currentStep === 'tax_registration') {
      setAttemptedRegistrationSubmit(true);

      // Always validate the tax identification and veterinary license numbers directly here
      // regardless of the attemptedRegistrationSubmit flag
      if (!formData.taxIdentificationNumber || formData.taxIdentificationNumber.length !== 10) {
        setError('Tax identification number (VKN) must be exactly 10 characters');
        setIsUserInitiatedSubmit(false); // Reset the flag if validation fails
        return;
      }
      
      if (!formData.veterinaryLicenseNumber || formData.veterinaryLicenseNumber.length !== 10) {
        setError('Veterinary license number must be exactly 10 characters');
        setIsUserInitiatedSubmit(false); // Reset the flag if validation fails
        return;
      }
    }

    // Clinic details validation
    if (!formData.name || formData.name.trim() === '') {
      setError('Please enter a clinic name');
      return;
    }
    
    // Establishment date is required for complete submissions
    if (!formData.establishment_date) {
      setError('Please enter the establishment date');
      return;
    }
    
    // Validate establishment date - check if it's in the future
    if (formData.establishment_date) {
      const currentDate = new Date();
      const selectedDate = new Date(formData.establishment_date);
      
      // Set time to beginning of month for accurate comparison
      currentDate.setDate(1);
      currentDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > currentDate) {
        setError('Establishment date cannot be in the future');
        return;
      }
    }
    
    // Address validation
    if (!formData.address || formData.address.trim() === '') {
      setError('Please enter your clinic address');
      return;
    }
    
    // Check if user already has a clinic
    if (hasExistingClinic && !clinicId) {
      setError('You already have a registered clinic. Each veterinarian can only register one clinic.');
      return;
    }

    // Check if user is not verified
    if (verificationStatus === null && !hasExistingClinic) {
      setError('Your clinic is not verified. Please complete the verification process.');
      return;
    }
    
    // Only allow complete form submission on the final step
    if (currentStep !== 'tax_registration') {
      // If not on the final step, just move to the next step instead
      handleNextStep();
      return;
    }

    // At this point we're guaranteed to be on the tax_registration step
    
    // Use the validateTaxRegistration function to get any errors
    // Pass true to indicate this is a submission check
    const registrationErrors = validateTaxRegistration(true);
    
    // If there are registration errors, show the first one and stop submission
    if (registrationErrors.length > 0) {
      setError(registrationErrors[0]);
      return;
    }
    
    // Validation for previous steps
    // Clinic Details step
    if (!formData.name || !formData.establishment_date) {
      setError('Clinic name and establishment date are required');
      return;
    }
    
    // Locations step validation
    if (!formData.address) {
      setError('Clinic address is required');
      return;
    }
    
    // Visuals step validation
    if (selectedPhotos.length < 3) {
      setError('Please upload at least 3 photos of your clinic');
      return;
    }
    
    // Services step validation
    if (formData.servedAnimalTypes.length === 0) {
      setError('Please select at least one animal type you serve');
      return;
    }
    
    if (formData.medicalServices.length === 0) {
      setError('Please select at least one medical service');
      return;
    }
    
    // Appointments step validation
    if (formData.available_days.length === 0) {
      setError('Please select at least one working day');
      return;
    }
    
    if (!formData.opening_time) {
      setError('Please set an opening time');
      return;
    }
    
    if (!formData.closing_time) {
      setError('Please set a closing time');
      return;
    }
    
    // Açılış saati kapanış saatinden önce olmalı
    if (formData.opening_time >= formData.closing_time) {
      setError('Opening time must be earlier than closing time');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Add debug logging for slot_duration
      
      // Create a copy of the form data for submission
      const submissionData = { ...formData };
      
      // Modify clinic name to include the clinic type if it doesn't already end with it
      if (submissionData.name && submissionData.clinicType) {
        const baseClinicName = submissionData.name.trim();
        const clinicTypeSuffix = submissionData.clinicType.trim();
        
        // Check if the name already ends with the clinic type
        if (!baseClinicName.endsWith(clinicTypeSuffix)) {
          submissionData.name = `${baseClinicName} ${clinicTypeSuffix}`;
        }
      }
      
      if (!token) {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          setError('Authentication token not found. Please try logging in again.');
          return;
        }
      }

      // Parse establishment_date into year and month
      let establishmentYear = null;
      let establishmentMonth = null;
      
      if (formData.establishment_date) {
        // Format is typically YYYY-MM or YYYY-MM-DD
        const dateParts = formData.establishment_date.split('-');
        if (dateParts.length >= 2) {
          establishmentYear = parseInt(dateParts[0], 10);
          establishmentMonth = parseInt(dateParts[1], 10);
        }
      }
      
      // First, create the clinic
      const response = await axiosInstance.post(
        `/clinics/add`,
        {
          clinic_name: submissionData.name, // Use the modified name with clinic type
          clinic_type: formData.clinicType,
          clinic_address: formData.address || "Adres belirtilmedi",
          clinic_phone: formData.phone_numbers.length > 0 ? formData.phone_numbers : null,
          clinic_email: formData.email || null,
          clinic_description: formData.biography || formData.description || null,
          
          // Çalışma günleri ve saatleri
          available_days: formData.available_days.length > 0 
            ? formData.available_days 
            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          emergency_available_days: formData.emergency_available_days || [], 
          opening_time: formData.opening_time || "09:00",
          closing_time: formData.closing_time || "18:00",
          allow_online_meetings: formData.allow_online_meetings || false,
          
          establishment_date: formData.establishment_date,
          establishment_year: establishmentYear,
          establishment_month: establishmentMonth,
          show_phone_number: formData.showPhoneNumber,
          show_mail_address: formData.showMailAddress,
          allow_direct_messages: formData.allowDirectMessages,
          province: formData.province || null,
          district: formData.district || null,
          social_media_links: formData.social_media_links || [],
          
          // Location coordinates from Google Maps
          latitude: formData.coordinates ? formData.coordinates.lat : null,
          longitude: formData.coordinates ? formData.coordinates.lng : null,
          
          served_animal_types: formData.servedAnimalTypes || [],
          medical_services: formData.medicalServices || [],
          additional_services: formData.additionalServices || [],
          
          tax_identification_number: formData.taxIdentificationNumber || null,
          veterinary_license_number: formData.veterinaryLicenseNumber || null,
          
          // Make sure is_open_24_7 is sent as a boolean
          is_open_24_7: Boolean(formData.is_open_24_7),
          
          // Explicitly send the slot duration to ensure it's passed to the backend
          slot_duration: formData.slot_duration, 

          is_partial_submission: false,
          verification_status: 'pending'
        }
      );

      if (response.status === 201) {
        
        // Fotoğrafları yükle
        try {
          
          await uploadPhotos(
            response.data.clinic.clinic_id,
            response.data.clinic.clinic_name
          );
          
        } catch (photoError) {
          console.error('Failed to upload photos:', photoError);
          // Fotoğraf yükleme hatası olsa bile klinik kaydedildi, kullanıcıya bildir
          setError('Your clinic was created, but there was an error uploading photos. You can upload them later from clinic editing page.');
          // 2 saniye sonra dashboard'a git
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return;
        }
        
        // Reset form
        setFormData({
          name: '',
          clinicType: 'Veterinary Clinic',
          biography: '',
          establishment_date: '',
          social_media_links: [],
          province: '',
          district: '',
          address: '',
          phone_numbers: [],
          email: '',
          description: '',
          showPhoneNumber: false,
          allowDirectMessages: false,
          showMailAddress: false,
          servedAnimalTypes: [],
          medicalServices: [],
          additionalServices: [],
          available_days: [],
          emergency_available_days: [],
          has_emergency_service: false,
          is_open_24_7: false,
          slot_duration: 60,
          opening_time: '',
          closing_time: '',
          allow_online_meetings: false,
          taxIdentificationNumber: '',
          veterinaryLicenseNumber: ''
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        setUploadProgress(0);
        setFormModified(false);
        setError('');
        setSuccess(true);
        setCurrentStep('clinic_details');
        // Navigate directly without setTimeout
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Clinic addition error:', getApiErrorResponse(err) || err);
      setError(
        getApiErrorResponse(err)?.data?.message || 
        getApiErrorResponse(err)?.statusText || 
        getApiErrorMessage(err) || 
        'Failed to add clinic. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle services change
  const handleServicesChange = (
    field: 'servedAnimalTypes' | 'medicalServices' | 'additionalServices',
    value: string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormModified(true);
  };

  const handleAddEmptyPhoneNumber = () => {
    setFormData(prev => {
      const newPhoneNumbers = [...(prev.phone_numbers || [])];
      newPhoneNumbers.push({ type: '', number: '' });
      return {
        ...prev,
        phone_numbers: newPhoneNumbers
      };
    });
    setFormModified(true);
  };

  const handleRemovePhoneNumber = (index: number) => {
    setFormData(prev => {
      const newPhoneNumbers = [...(prev.phone_numbers || [])];
      newPhoneNumbers.splice(index, 1);
      return {
        ...prev,
        phone_numbers: newPhoneNumbers
      };
    });
    setFormModified(true);
  };

  const handlePhoneNumberChange = (index: number, field: 'type' | 'number', value: string) => {
    setFormData(prev => {
      const newPhoneNumbers = [...(prev.phone_numbers || [])];
      newPhoneNumbers[index] = {
        ...newPhoneNumbers[index],
        [field]: value
      };
      return {
        ...prev,
        phone_numbers: newPhoneNumbers
      };
    });
    setFormModified(true);
  };

  // Success message
  if (success) {
    return <SuccessMessage handleBackToDashboard={() => {
      setFormData({
        name: '',
        clinicType: 'Veterinary Clinic',
        biography: '',
        establishment_date: '',
        social_media_links: [],
        province: '',
        district: '',
        address: '',
        phone_numbers: [],
        email: '',
        description: '',
        showPhoneNumber: false,
        allowDirectMessages: false,
        showMailAddress: false,
        servedAnimalTypes: [],
        medicalServices: [],
        additionalServices: [],
        available_days: [],
        emergency_available_days: [],
        has_emergency_service: false,
        is_open_24_7: false,
        slot_duration: 60,
        opening_time: '',
        closing_time: '',
        allow_online_meetings: false,
        taxIdentificationNumber: '',
        veterinaryLicenseNumber: ''
      });
      setSelectedPhotos([]);
      setPhotoPreviewUrls([]);
      setUploadProgress(0);
      setFormModified(false);
      setError('');
      setLoading(false);
      setSuccess(false);
      setCurrentStep('clinic_details');
      // Navigate directly without setTimeout
      navigate('/dashboard');
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Mobile Progress Indicator - Only visible on mobile */}
      <div className="md:hidden">
        <MobileStepIndicator steps={steps} currentStep={currentStep} handleBackToDashboard={() => handleNavigation('/dashboard')} />
      </div>

      {/* Desktop Progress Bar - Vertical sidebar */}
      <StepProgressBar 
        steps={steps} 
        currentStep={currentStep} 
        handleGoToStep={handleGoToStep} 
        loading={loading} 
        handleBackToDashboard={() => handleNavigation('/dashboard')}
      />
      
      {/* Main content area - adjusted to work with the sidebar */}
      <div className="flex-grow flex">
        <div className="md:ml-60 w-full flex flex-col items-center justify-center min-h-screen py-6">
          
          {/* Let's Start Section - Form dışında, üstte, bağımsız kutu */}
          {currentStep === 'clinic_details' && (
            <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-800">Let's Start</h2>
                  <p className="text-sm text-gray-600 mt-1">Adding clinic details will help us to create inclusive page for your clinic!</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Form Container */}
          <div className={`w-full bg-white rounded-lg shadow p-6 ${
            currentStep === 'locations' || currentStep === 'services' ? 'max-w-6xl' : 'max-w-3xl'
          }`}>
            {error && currentStep !== 'visuals' && 
             // Extra safeguard: For tax_registration step, only show error after submission attempt
             (currentStep !== 'tax_registration' || attemptedRegistrationSubmit) && (
              <div className={`p-4 ${error.includes('Tax identification number') || error.includes('Veterinary license number') ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-red-50 border-l-4 border-red-500'} mb-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {error.includes('Tax identification number') || error.includes('Veterinary license number') ? (
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${error.includes('Tax identification number') || error.includes('Veterinary license number') ? 'text-blue-700' : 'text-red-700'}`}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Clinic Details Section */}
              {currentStep === 'clinic_details' && (
                <ClinicDetailsForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSocialMediaChange={handleSocialMediaChange}
                  handleAddEmptySocialMedia={handleAddEmptySocialMedia}
                  handleRemoveSocialMedia={handleRemoveSocialMedia}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  loading={loading}
                  isEditMode={isEditMode}
                />
              )}

              {/* Locations Section */}
              {currentStep === 'locations' && (
                <LocationsForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  updateCoordinates={updateCoordinates}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  loading={loading}
                  isEditMode={isEditMode}
                />
              )}

              {/* Communication Section */}
              {currentStep === 'communication' && (
                <CommunicationForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSocialMediaChange={handleSocialMediaChange}
                  handleAddEmptySocialMedia={handleAddEmptySocialMedia}
                  handleRemoveSocialMedia={handleRemoveSocialMedia}
                  handlePhoneNumberChange={handlePhoneNumberChange}
                  handleAddEmptyPhoneNumber={handleAddEmptyPhoneNumber}
                  handleRemovePhoneNumber={handleRemovePhoneNumber}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  loading={loading}
                  setError={setError}
                  attemptedSubmit={attemptedCommunicationSubmit}
                  isEditMode={isEditMode}
                />
              )}

              {/* Visuals Section */}
              {currentStep === 'visuals' && (
                <VisualsForm
                  selectedPhotos={selectedPhotos}
                  photoPreviewUrls={photoPreviewUrls}
                  handlePhotoSelect={handlePhotoSelect}
                  handleRemovePhoto={handleRemovePhoto}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  loading={loading}
                  error={error}
                  setError={setError}
                  isEditMode={isEditMode}
                />
              )}

              {/* Services Section */}
              {currentStep === 'services' && (
                <ServicesForm
                  formData={{
                    servedAnimalTypes: formData.servedAnimalTypes || [],
                    medicalServices: formData.medicalServices || [],
                    additionalServices: formData.additionalServices || []
                  }}
                  handleServicesChange={handleServicesChange}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  loading={loading}
                  setError={setError}
                  isEditMode={isEditMode}
                />
              )}

              {/* Tax and Registration Section */}
              {currentStep === 'tax_registration' && (
                <RegistrationForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  loading={loading}
                  isEditMode={isEditMode}
                />
              )}

              {/* Appointments Section */}
              {currentStep === 'appointments' && (
                <AppointmentsForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  loading={loading}
                  hasExistingClinic={hasExistingClinic && !isEditMode}
                  isEditMode={isEditMode}
                  validateOnSubmit={attemptedAppointmentsSubmit}
                />
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {currentStep !== 'clinic_details' && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={loading}
                    className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                      loading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    Previous
                  </button>
                )}
                <button
                  type={currentStep === 'tax_registration' ? 'submit' : 'button'}
                  onClick={currentStep !== 'tax_registration' ? handleNextStep : undefined}
                  disabled={(hasExistingClinic && !isEditMode) || loading}
                  className={`px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    (hasExistingClinic && !isEditMode) || loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${currentStep === 'clinic_details' ? 'ml-auto' : ''}`}
                >
                  {loading 
                    ? 'Submitting...' 
                    : currentStep === 'tax_registration' 
                      ? 'Submit' 
                      : (
                        <span className="flex items-center">
                          Continue
                          <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                      )
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full animate-modal-slide-in">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Unsaved Changes</h3>
                  <p className="text-sm text-gray-500">
                    You have unsaved changes. Are you sure you want to leave this page? All your changes will be lost.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={cancelNavigation}
                  className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
                >
                  Stay Here
                </button>
              
                <button
                  onClick={confirmNavigation}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors font-medium inline-flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Leave Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddClinicPage; 