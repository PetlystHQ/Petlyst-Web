import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../store';
import { API_URL } from '../config/api';
import { ClinicFormData, PhoneNumberEntry, PhoneTypeEnum } from '../types/clinic';
import { MapComponent } from '../components/clinic/forms/MapComponent';
import { EditVisuals } from '../components/clinic/forms/EditVisuals';
import { EditServices } from '../components/clinic/forms/EditServices';
import EditHours from '../components/clinic/forms/EditHours';
import EditRegistration from '../components/clinic/forms/EditRegistration';

const EditClinicPage: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  
  // States
  const [formData, setFormData] = useState<ClinicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formModified, setFormModified] = useState(false);
  const [contactValid, setContactValid] = useState(true);
  
  // Define fetchClinicData at component level so it can be reused
  const fetchClinicData = async () => {
    if (!clinicId) return;
    
    try {
      setLoading(true);
      const apiUrl = API_URL;
      const response = await axios.get(`${apiUrl}/api/clinics/${clinicId}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        // Add timestamp to prevent browser caching
        params: { _t: new Date().getTime() }
      });

      if (response.data && response.data.clinic) {
        const clinic = response.data.clinic;
        
        // Clean data processing - Extract proper name and type
        let clinicName = clinic.clinic_name || '';
        let clinicType = 'Veterinary Clinic'; // Default
        
        // Check if clinic name contains the type and extract it
        if (clinicName.includes('Animal Hospital')) {
          clinicType = 'Animal Hospital';
          clinicName = clinicName.replace('Animal Hospital', '').trim();
        } else if (clinicName.includes('Veterinary Clinic')) {
          clinicType = 'Veterinary Clinic';
          clinicName = clinicName.replace('Veterinary Clinic', '').trim();
        }
        
        console.log('Extracted clinic name:', clinicName);
        console.log('Clinic type:', clinicType);
        
        // ÖNEMLİ: 24/7 durumu ve çalışma günleri için iyileştirme
        // Veritabanından gelen değerleri doğrudan kullan, 24/7 değeri Yes olsa bile override etme
        const available_days = processDaysFromBackend(clinic.available_days);
        const emergency_available_days = processDaysFromBackend(clinic.emergency_available_days);
        
        // Randevu süresi değerini doğru şekilde işle ve konsola yazdır
        let slotDuration = 60; // Varsayılan değer
        
        // Veritabanından gelen değerin detaylı kontrolü
        if (clinic.clinic_time_slots !== null && clinic.clinic_time_slots !== undefined) {
          if (typeof clinic.clinic_time_slots === 'string') {
            slotDuration = parseInt(clinic.clinic_time_slots, 10);
          } else if (typeof clinic.clinic_time_slots === 'number') {
            slotDuration = clinic.clinic_time_slots;
          }
          
          // NaN kontrolü
          if (isNaN(slotDuration)) {
            slotDuration = 60;
          }
        }
        
        console.log('Database randevu süresi:', clinic.clinic_time_slots, 'İşlenmiş değer:', slotDuration);
        
        setFormData({
          name: clinicName,
          clinicType: clinicType,
          biography: clinic.clinic_description || '',
          establishment_date: clinic.establishment_year && clinic.establishment_month ? 
            `${clinic.establishment_year}-${clinic.establishment_month.toString().padStart(2, '0')}` : '',
          social_media_links: response.data.clinic.social_media || [],
          province: clinic.province || '',
          district: clinic.district || '',
          address: clinic.clinic_address || '',
          phone_numbers: clinic.phone_numbers || [],
          email: clinic.clinic_email || '',
          description: clinic.clinic_description || '',
          showPhoneNumber: clinic.show_phone_number || false,
          allowDirectMessages: clinic.allow_direct_messages || false,
          showMailAddress: clinic.show_mail_address || false,
          servedAnimalTypes: clinic.animal_types || [],
          medicalServices: clinic.medical_services || [],
          additionalServices: clinic.additional_services || [],
          available_days: available_days,
          emergency_available_days: emergency_available_days,
          has_emergency_service: emergency_available_days.length > 0,
          is_open_24_7: clinic.is_open_24_7 === 'Yes',
          // 'clinic_time_slots' veritabanı alanının doğru işlenmiş değerini kullan
          slot_duration: slotDuration,
          opening_time: clinic.opening_time || '',
          closing_time: clinic.closing_time || '',
          allow_online_meetings: clinic.allow_online_meetings || false,
          taxIdentificationNumber: clinic.tax_identification_number || '',
          veterinaryLicenseNumber: clinic.veterinary_license_number || '',
          coordinates: clinic.latitude && clinic.longitude ? {
            lat: parseFloat(clinic.latitude),
            lng: parseFloat(clinic.longitude)
          } : undefined
        });
      }
    } catch (err: any) {
      console.error('Error fetching clinic data:', err);
      setError(err.response?.data?.message || 'Failed to load clinic information');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get day name by index
  const getDayNameByIndex = (index: number): string => {
    // Backend indeks: 0=Sunday, 1=Monday, 2=Tuesday, ...
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[index] || '';
  };

  // Fetch clinic data on component mount and when activeTab changes
  useEffect(() => {
    fetchClinicData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, token, activeTab]); // Add activeTab dependency to refetch when tab changes
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkbox inputs, use checked property
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => prev ? {
      ...prev,
      [name]: inputValue
    } : null);
    
    setFormModified(true);
  };
  
  // Save clinic data
  const saveClinicData = async () => {
    if (!formData) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Only validate fields based on the current tab
      // This prevents "Clinic Name Required" errors when editing hours or registration
      if (activeTab === 'basic') {
        // Validate basic info when on basic tab
        if (!formData.name || formData.name.trim() === '') {
          setError('Please enter a clinic name');
          setSaving(false);
          return;
        }
        
        // Validate establishment date if provided
        if (formData.establishment_date) {
          const isValid = validateEstablishmentDate(formData.establishment_date);
          if (!isValid) {
            setSaving(false);
            return;
          }
        }
      } else if (activeTab === 'location') {
        // Validate location when on location tab
        if (!formData.address || formData.address.trim() === '') {
          setError('Please enter your clinic address');
          setSaving(false);
          return;
        }
      } else if (activeTab === 'contact') {
        // Validate contact info
        validateContactFields();
        if (!contactValid) {
          setSaving(false);
          return;
        }
      } else if (activeTab === 'hours') {
        // Only validate hours fields if needed
        if (formData.opening_time && formData.closing_time && formData.opening_time >= formData.closing_time) {
          setError('Opening time must be earlier than closing time');
          setSaving(false);
          return;
        }
      } else if (activeTab === 'registration') {
        // Validate registration fields
        if (formData.taxIdentificationNumber && formData.taxIdentificationNumber.length !== 10) {
          setError('Tax identification number (VKN) must be exactly 10 characters');
          setSaving(false);
          return;
        }
        
        if (formData.veterinaryLicenseNumber && formData.veterinaryLicenseNumber.length !== 10) {
          setError('Veterinary license number must be exactly 10 characters');
          setSaving(false);
          return;
        }
      }
      
      // Parse establishment_date to year and month
      let establishment_year = null;
      let establishment_month = null;
      if (formData.establishment_date) {
        const parts = formData.establishment_date.split('-');
        establishment_year = parseInt(parts[0], 10);
        establishment_month = parseInt(parts[1], 10);
      }
      
      // Log to check the phone numbers data structure
      console.log('Phone numbers data:', formData.phone_numbers);
      
      const apiUrl = API_URL;
      
      // Modify clinic name to include the clinic type if it doesn't already end with it
      let clinic_name = formData.name;
      if (formData.name && formData.clinicType) {
        const baseClinicName = formData.name.trim();
        const clinicTypeSuffix = formData.clinicType.trim();
        
        // Check if the name already ends with the clinic type
        if (!baseClinicName.endsWith(clinicTypeSuffix)) {
          clinic_name = `${baseClinicName} ${clinicTypeSuffix}`;
        }
      }
      
      // Ensure correct clinic type is sent - this is the key field for updating clinic_type
      const clinic_type = formData.clinicType === 'Animal Hospital' ? 'animal_hospital' : 'veterinary_clinic';
      
      console.log('Sending clinic_type:', clinic_type);
      console.log('Current clinicType in formData:', formData.clinicType);
      
      // Mevcut available_days ve emergency_available_days verilerini kullan
      // is_open_24_7 Yes olsa bile bu değerleri otomatik olarak değiştirme
      const available_days = formData.available_days;
      const emergency_available_days = formData.emergency_available_days;
      
      // Randevu süresini alıp doğru bir şekilde hazırla
      // Number olduğundan emin ol ve string olma durumunda number'a çevir
      // İlk önce tür kontrolü yapalım
      let slotDuration = 60; // varsayılan değer
      
      if (formData.slot_duration) {
        if (typeof formData.slot_duration === 'string') {
          slotDuration = parseInt(formData.slot_duration, 10);
        } else if (typeof formData.slot_duration === 'number') {
          slotDuration = formData.slot_duration;
        }
      }
      
      // NaN kontrolü yapalım
      if (isNaN(slotDuration)) {
        slotDuration = 60; // Geçersiz değer durumunda varsayılan
      }
      
      console.log('Randevu süresi gönderiliyor (düzeltilmiş):', {
        rawValue: formData.slot_duration,
        formattedValue: slotDuration,
        type: typeof slotDuration
      });
      
      // Create request data
      const requestData = {
        clinic_name,
        clinic_type,
        clinic_description: formData.biography || formData.description,
        clinic_email: formData.email,
        address: formData.address,
        province: formData.province,
        district: formData.district,
        show_phone_number: formData.showPhoneNumber,
        show_mail_address: formData.showMailAddress,
        allow_direct_messages: formData.allowDirectMessages,
        allow_online_meetings: formData.allow_online_meetings,
        opening_time: formData.opening_time,
        closing_time: formData.closing_time,
        is_open_24_7: formData.is_open_24_7 ? 'Yes' : 'No',
        // Veritabanında 'clinic_time_slots' alanına slot_duration değerini gönder
        clinic_time_slots: slotDuration,
        latitude: formData.coordinates?.lat,
        longitude: formData.coordinates?.lng,
        // Include establishment year and month instead of date
        establishment_year,
        establishment_month,
        tax_identification_number: formData.taxIdentificationNumber,
        veterinary_license_number: formData.veterinaryLicenseNumber,
        // Format days correctly for backend
        available_days: convertDaysToBoolean(available_days),
        emergency_available_days: convertDaysToBoolean(emergency_available_days),
        // Her değişiklikte clinic_verification_status değerini 'pending' olarak ayarla
        clinic_verification_status: 'pending'
      };
      
      // Log the full request data
      console.log('Request data:', requestData);
      
      // Özel olarak slot_duration değerini konsola yazdıralım
      console.log('Randevu süresi gönderilirken son durum:', {
        formDataValue: formData.slot_duration,
        processedValue: slotDuration,
        requestDataValue: requestData.clinic_time_slots,
        valueType: typeof requestData.clinic_time_slots
      });
      
      // First update the main clinic data
      const response = await axios.put(`${apiUrl}/api/clinics/${clinicId}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      
      if (response.status === 200) {
        // If we're on the contact tab, update phone numbers and social media links
        if (activeTab === 'contact') {
          // Update phone numbers
          if (formData.phone_numbers) {
            await axios.put(`${apiUrl}/api/clinics/${clinicId}/phone-numbers`, {
              phone_numbers: formData.phone_numbers
            }, {
              headers: {
                'Authorization': `Bearer ${token || localStorage.getItem('token')}`
              }
            });
          }
          
          // Update social media links
          if (formData.social_media_links) {
            await axios.put(`${apiUrl}/api/clinics/${clinicId}/social-media`, {
              social_media_links: formData.social_media_links
            }, {
              headers: {
                'Authorization': `Bearer ${token || localStorage.getItem('token')}`
              }
            });
          }
        }
        
        // Yanıtı detaylı olarak inceleyelim
        console.log('Clinic update response:', {
          status: response.status,
          data: response.data,
          updatedClinic: response.data.clinic,
          receivedTimeSlots: response.data.clinic?.clinic_time_slots
        });
        
        setSuccess('Clinic updated successfully');
        setFormModified(false);
        
        // Reload the data to ensure we display the latest information
        fetchClinicData();
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error updating clinic:', err);
      setError(err.response?.data?.message || 'Failed to update clinic');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    // Auto-save when changing tabs if form was modified
    if (formModified) {
      saveClinicData();
    }
    setActiveTab(tab);
  };
  
  // Create updateField function for MapComponent
  const updateField = (name: string, value: any) => {
    // First update the form data
    setFormData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
    
    setFormModified(true);
    
    // Manually validate for social media links
    if (name === 'social_media_links') {
      // Check if there's a platform selected but empty URL
      const hasInvalidSocialMedia = value.some((link: any) => 
        link.platform && (!link.url || link.url.trim() === ''));
      
      if (hasInvalidSocialMedia) {
        setError("Please provide URLs for all selected social media platforms");
        setContactValid(false);
      } else {
        setError(null);
        setContactValid(true);
      }
    }
  };
  
  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate contact fields
  const validateContactFields = () => {
    if (!formData) return;

    // Check if email is valid
    if (!formData.email || !isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      setContactValid(false);
      return;
    }

    // Check if at least one phone number exists
    if (!formData.phone_numbers || formData.phone_numbers.length === 0) {
      setError("Please add at least one phone number");
      setContactValid(false);
      return;
    }

    // Check if any phone number has type selected but number is empty
    const hasInvalidPhone = formData.phone_numbers.some(phone => 
      phone.type && (!phone.number || phone.number.trim() === ''));
    
    if (hasInvalidPhone) {
      setError("Please enter a number for all selected phone types");
      setContactValid(false);
      return;
    }

    // Check if at least one phone number is valid and complete
    const hasValidPhone = formData.phone_numbers.some(phone => 
      phone.type && phone.number && phone.number.trim() !== '');
    
    if (!hasValidPhone) {
      setError("Please add at least one valid phone number with both type and number");
      setContactValid(false);
      return;
    }

    // Check if any social media platform is selected but URL is empty
    if (formData.social_media_links && 
        formData.social_media_links.some(link => 
          link.platform && (!link.url || link.url.trim() === ''))) {
      setError("Please provide URLs for all selected social media platforms");
      setContactValid(false);
      return;
    }

    // If we reach here, all contact fields are valid
    setError(null);
    setContactValid(true);
  };
  
  // Basic Info Tab - establishment_date validation
  const validateEstablishmentDate = (dateValue: string): boolean => {
    if (!dateValue) return true;
    
    const currentDate = new Date();
    const selectedDate = new Date(dateValue);
    
    // Set date to 1st of the month for both dates to compare only year and month
    currentDate.setDate(1);
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setDate(1);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Check if selected date is in the future
    if (selectedDate > currentDate) {
      setError("Establishment date cannot be in the future");
      return false;
    }
    return true;
  };

  // Handle the establishment date change with validation
  const handleEstablishmentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isValid = validateEstablishmentDate(e.target.value);
    
    if (isValid) {
      handleInputChange(e);
      setError(null);
      setFormModified(true);
    } else {
      // Still update the form field, but don't clear the error and don't enable save button
      handleInputChange(e);
      setFormModified(false);
    }
  };

  // Handle clinic type change separately to ensure we send right format to backend
  const handleClinicTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // First update the form data with the new value
    handleInputChange(e);
    
    // Ensure formModified is set to true
    setFormModified(true);
  };
  
  // Convert days from string array ["monday", "tuesday", ...] to boolean array [true, true, false, ...]
  const convertDaysToBoolean = (days: string[]): boolean[] => {
    // Backend beklentisi: [Sunday, Monday, Tuesday, ...] sıralamasında boolean dizisi
    // EditHours bileşeni Monday ile başlıyor, o yüzden burada doğru şekilde dönüştürüyoruz
    const result = [false, false, false, false, false, false, false]; // 7 günlük boş dizi

    // Her gün için doğru indeksi ayarla
    days.forEach(day => {
      switch(day) {
        case 'sunday': result[0] = true; break;
        case 'monday': result[1] = true; break;
        case 'tuesday': result[2] = true; break;
        case 'wednesday': result[3] = true; break;
        case 'thursday': result[4] = true; break;
        case 'friday': result[5] = true; break;
        case 'saturday': result[6] = true; break;
      }
    });

    return result;
  };
  
  // Backend'den gelen boolean array'i EditHours bileşeninin beklediği string array'e dönüştürür
  const processDaysFromBackend = (daysArray: boolean[] | undefined): string[] => {
    if (!daysArray || !Array.isArray(daysArray)) return [];

    const result: string[] = [];
    
    // Backend'den gelen array: [Sunday, Monday, Tuesday, ...] şeklinde
    // Biz Monday, Tuesday, ... Sunday şeklinde string array'e çeviriyoruz
    if (daysArray[0]) result.push('sunday');
    if (daysArray[1]) result.push('monday');
    if (daysArray[2]) result.push('tuesday');
    if (daysArray[3]) result.push('wednesday');
    if (daysArray[4]) result.push('thursday');
    if (daysArray[5]) result.push('friday');
    if (daysArray[6]) result.push('saturday');
    
    return result;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading clinic details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Error Loading Clinic</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center mb-6">
        <div className="flex items-center">
          <img 
            src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
            alt="Petlyst Logo" 
            className="h-8 w-auto"
          />
          <span className="ml-3 text-xl font-semibold text-gray-800">Petlyst</span>
          <span className="mx-4 text-gray-300">|</span>
          <h1 className="text-xl font-bold text-gray-900">Edit Clinic</h1>
        </div>
        <div className="flex items-center space-x-3">
          {formModified && (
            // Only show Save Changes button if we're not on contact tab OR if we are and validation passes
            (activeTab !== 'contact' || contactValid) && (
              <button 
                onClick={saveClinicData}
                disabled={saving}
                className={`px-4 py-2 rounded-md text-white ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Display success message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Display error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button 
                onClick={() => handleTabChange('basic')}
                className={`${
                  activeTab === 'basic' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Basic Info
              </button>
              <button 
                onClick={() => handleTabChange('location')}
                className={`${
                  activeTab === 'location' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Location
              </button>
              <button 
                onClick={() => handleTabChange('contact')}
                className={`${
                  activeTab === 'contact' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Contact
              </button>
              <button 
                onClick={() => handleTabChange('photos')}
                className={`${
                  activeTab === 'photos' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Photos
              </button>
              <button 
                onClick={() => handleTabChange('services')}
                className={`${
                  activeTab === 'services' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Services
              </button>
              <button 
                onClick={() => handleTabChange('hours')}
                className={`${
                  activeTab === 'hours' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Hours
              </button>
              <button 
                onClick={() => handleTabChange('registration')}
                className={`${
                  activeTab === 'registration' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Registration
              </button>
            </nav>
          </div>
          
          {/* Tab content */}
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="clinicType" className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Type *
                  </label>
                  <select
                    id="clinicType"
                    name="clinicType"
                    value={formData?.clinicType || ""}
                    onChange={handleClinicTypeChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Veterinary Clinic">Veterinary Clinic</option>
                    <option value="Animal Hospital">Animal Hospital</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData?.name || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-[130px]"
                      placeholder="Enter clinic name"
                    />
                    <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
                      <div className="h-full w-px bg-gray-300 mr-2"></div>
                      <div className="pr-3 text-gray-500 text-sm font-medium">
                        {formData?.clinicType === "Animal Hospital" ? "Animal Hospital" : "Veterinary Clinic"}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="biography" className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Biography
                  </label>
                  <textarea
                    name="biography"
                    id="biography"
                    value={formData?.biography || ""}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about your clinic"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="establishment_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Establishment Date *
                  </label>
                  <input
                    type="month"
                    name="establishment_date"
                    id="establishment_date"
                    value={formData?.establishment_date || ""}
                    onChange={handleEstablishmentDateChange}
                    required
                    max={new Date().toISOString().slice(0, 7)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
            
            {/* Location Tab */}
            {activeTab === 'location' && formData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Clinic Location</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag the marker or click on the map to select your clinic's location. 
                    The address will be automatically filled based on the selected location.
                  </p>
                  
                  {/* Map Component */}
                  <div className="mb-6">
                    <MapComponent 
                      formData={formData}
                      updateField={updateField}
                      hasExistingClinic={false}
                      loading={loading || saving}
                    />
                  </div>
                  
                  {/* Province */}
                  <div className="mb-4">
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                      Province *
                    </label>
                    <input
                      type="text"
                      name="province"
                      id="province"
                      value={formData.province || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Province"
                    />
                  </div>
                  
                  {/* District */}
                  <div className="mb-4">
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      name="district"
                      id="district"
                      value={formData.district || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="District"
                    />
                  </div>
                  
                  {/* Detailed Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Address *
                    </label>
                    <textarea
                      name="address"
                      id="address"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter detailed address"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
            
            {/* Photos Tab */}
            {activeTab === 'photos' && formData && (
              <div className="space-y-6">
                <EditVisuals 
                  clinicId={clinicId || ''}
                  clinicName={formData.name || ''}
                  clinicType={formData.clinicType || 'Veterinary Clinic'}
                  token={token || localStorage.getItem('token') || ''}
                  onPhotoChange={() => {
                    // Refresh data or show success message if needed
                    setSuccess('Clinic photos updated successfully');
                    setTimeout(() => {
                      setSuccess(null);
                    }, 3000);
                  }}
                />
              </div>
            )}
            
            {/* Services Tab */}
            {activeTab === 'services' && formData && (
              <div className="space-y-6">
                <EditServices 
                  clinicId={clinicId || ''}
                  token={token || localStorage.getItem('token') || ''}
                  onServicesChange={() => {
                    // Refresh data or show success message if needed
                    setSuccess('Clinic services updated successfully');
                    setTimeout(() => {
                      setSuccess(null);
                    }, 3000);
                  }}
                />
              </div>
            )}
            
            {/* Hours Tab */}
            {activeTab === 'hours' && formData && (
              <div className="space-y-6">
                <EditHours 
                  formData={{
                    available_days: formData.available_days || [],
                    emergency_available_days: formData.emergency_available_days || [],
                    has_emergency_service: formData.has_emergency_service || false,
                    is_open_24_7: formData.is_open_24_7 || false,
                    slot_duration: formData.slot_duration || 60,
                    opening_time: formData.opening_time || '09:00',
                    closing_time: formData.closing_time || '17:00',
                    allow_online_meetings: formData.allow_online_meetings || false
                  }}
                  updateField={updateField}
                  loading={loading}
                  isEditMode={true}
                  setFormModified={setFormModified}
                />
              </div>
            )}
            
            {/* Registration Tab */}
            {activeTab === 'registration' && formData && (
              <div className="space-y-6">
                <EditRegistration 
                  formData={{
                    taxIdentificationNumber: formData.taxIdentificationNumber || '',
                    veterinaryLicenseNumber: formData.veterinaryLicenseNumber || ''
                  }}
                  updateField={updateField}
                  loading={loading}
                  isEditMode={true}
                />
              </div>
            )}
            
            {/* Other tabs */}
            {(activeTab !== 'basic' && activeTab !== 'location' && activeTab !== 'contact' && 
              activeTab !== 'photos' && activeTab !== 'services' && activeTab !== 'hours' && 
              activeTab !== 'registration') && (
              <p className="text-gray-500">This tab content will be implemented in the next phase.</p>
            )}
            
            {/* Contact Tab */}
            {activeTab === 'contact' && formData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  
                  {/* Email */}
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email || ""}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Validate email immediately when it changes
                        const emailValue = e.target.value;
                        if (!emailValue || !isValidEmail(emailValue)) {
                          setError("Please enter a valid email address");
                          setContactValid(false);
                        } else {
                          // Only clear error if it was an email error
                          if (error === "Please enter a valid email address") {
                            setError(null);
                          }
                          // Run full validation to check all conditions
                          validateContactFields();
                        }
                      }}
                      required
                      className={`w-full px-3 py-2 border ${
                        !formData.email || !isValidEmail(formData.email) 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="clinic@example.com"
                    />
                    <div className="mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="showMailAddress"
                          checked={formData.showMailAddress || false}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-600">Show email address on clinic profile</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Phone Numbers */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Numbers
                    </label>
                    
                    {formData.phone_numbers && formData.phone_numbers.map((phone, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <select
                          value={phone.type || ""}
                          onChange={(e) => {
                            const updatedPhones = [...formData.phone_numbers];
                            updatedPhones[index] = {
                              ...updatedPhones[index],
                              type: e.target.value as PhoneTypeEnum
                            };
                            updateField('phone_numbers', updatedPhones);
                          }}
                          className="w-1/3 mr-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Type</option>
                          <option value="fixed_line">Fixed Line</option>
                          <option value="mobile_number">Mobile Phone</option>
                        </select>
                        <input
                          type="tel"
                          value={phone.number || ""}
                          onChange={(e) => {
                            const updatedPhones = [...formData.phone_numbers];
                            updatedPhones[index] = {
                              ...updatedPhones[index],
                              number: e.target.value
                            };
                            updateField('phone_numbers', updatedPhones);
                          }}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., +90 555 123 4567"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPhones = [...formData.phone_numbers];
                            updatedPhones.splice(index, 1);
                            updateField('phone_numbers', updatedPhones);
                          }}
                          className="ml-2 p-2 text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPhones = [...(formData.phone_numbers || []), { type: '', number: '' }];
                        updateField('phone_numbers', updatedPhones);
                      }}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Phone Number
                    </button>
                    
                    <div className="mt-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="showPhoneNumber"
                          checked={formData.showPhoneNumber || false}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-600">Display phone numbers on clinic profile</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Social Media Links */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Social Media Links
                    </label>
                    
                    {formData.social_media_links && formData.social_media_links.map((social, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <select
                          value={social.platform || ''}
                          onChange={(e) => {
                            const updatedSocial = [...formData.social_media_links];
                            updatedSocial[index] = { ...updatedSocial[index], platform: e.target.value };
                            updateField('social_media_links', updatedSocial);
                          }}
                          className="w-1/4 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Platform</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="twitter">Twitter</option>
                          <option value="youtube">YouTube</option>
                          <option value="website">Website</option>
                        </select>
                        <input
                          type="url"
                          value={social.url || ''}
                          onChange={(e) => {
                            const updatedSocial = [...formData.social_media_links];
                            updatedSocial[index] = { ...updatedSocial[index], url: e.target.value };
                            updateField('social_media_links', updatedSocial);
                          }}
                          className="flex-grow px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSocial = [...formData.social_media_links];
                            updatedSocial.splice(index, 1);
                            updateField('social_media_links', updatedSocial);
                          }}
                          className="ml-2 p-2 text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const updatedSocial = [...(formData.social_media_links || []), { platform: 'instagram', url: '' }];
                        updateField('social_media_links', updatedSocial);
                      }}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Social Media Link
                    </button>
                  </div>
                  
                  {/* Communication Preferences */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Communication Preferences</h4>
                    <div className="space-y-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="allowDirectMessages"
                          checked={formData.allowDirectMessages || false}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-600">Allow direct messages from pet owners</span>
                      </label>
                      
                      <div>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            name="allow_online_meetings"
                            checked={formData.allow_online_meetings || false}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-600">Enable online video consultations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClinicPage;
