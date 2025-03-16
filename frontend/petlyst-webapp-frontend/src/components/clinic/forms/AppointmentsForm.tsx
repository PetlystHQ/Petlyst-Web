import React, { useState, useEffect } from 'react';
import { ClinicFormData } from '../../../types/clinic';

// Appointment duration options
type SlotDuration = '60' | '30' | '20';

interface AppointmentsFormProps {
  formData: ClinicFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  loading: boolean;
  hasExistingClinic?: boolean;
  validateOnSubmit?: boolean;
}

// Function to create a synthetic change event
const createSyntheticEvent = <T extends string | boolean | number | string[]>(name: string, value: T) => {
  return {
    target: { name, value }
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

export const AppointmentsForm: React.FC<AppointmentsFormProps> = ({
  formData,
  handleInputChange,
  loading,
  validateOnSubmit = false
}) => {
  // State added for emergency service status
  const [hasEmergencyService, setHasEmergencyService] = useState<boolean>(formData.has_emergency_service || false);
  const [isOpen24_7, setIsOpen24_7] = useState<boolean>(formData.is_open_24_7 || false);
  
  // Appointment duration state
  const [slotDuration, setSlotDuration] = useState<SlotDuration>(
    formData.slot_duration === 60 ? '60' : 
    formData.slot_duration === 30 ? '30' : 
    formData.slot_duration === 20 ? '20' : '60'
  );
  
  // Form validasyon hataları için state
  const [errors, setErrors] = useState<{ days?: string; operatingHours?: string; }>({});

  // Days list
  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];
  
  // Slot süreleri
  const slotDurations = [
    { value: '60', label: '1 Hour' },
    { value: '30', label: '30 Minutes' },
    { value: '20', label: '20 Minutes' }
  ];

  useEffect(() => {
    if (validateOnSubmit) {
      validateForm();
    } else {
      validateWorkingHours();
    }
  }, [formData.available_days, formData.opening_time, formData.closing_time, validateOnSubmit]);

  const validateWorkingHours = () => {
    const newErrors: { days?: string; operatingHours?: string; } = {};

    // Skip working hours validation if the clinic is open 24/7
    if (!formData.is_open_24_7) {
    // Working hours check: Closing time should not be before opening time
    if (formData.opening_time && formData.closing_time) {
      const openingTime = new Date(`2000-01-01T${formData.opening_time}`);
      const closingTime = new Date(`2000-01-01T${formData.closing_time}`);
      
      if (closingTime <= openingTime) {
        newErrors.operatingHours = 'Closing time must be after opening time.';
        }
      }
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors: { days?: string; operatingHours?: string; } = {};

    // Skip validation if the clinic is open 24/7
    if (!formData.is_open_24_7) {
    // Check if at least 1 regular working day is selected
    if (!formData.available_days || formData.available_days.length === 0) {
      newErrors.days = 'You must select at least one regular working day.';
    }

    // Working hours check: Closing time should not be before opening time
    if (formData.opening_time && formData.closing_time) {
      const openingTime = new Date(`2000-01-01T${formData.opening_time}`);
      const closingTime = new Date(`2000-01-01T${formData.closing_time}`);
      
      if (closingTime <= openingTime) {
        newErrors.operatingHours = 'Closing time must be after opening time.';
        }
      }
    }

    setErrors(newErrors);
  };

  // Dışarıdan validate etmek için bir metod
  // Bu metodu parent componente expose edebiliriz
  const validate = () => {
    validateForm();
    return Object.keys(errors).length === 0;
  };

  // When 24/7 status changes
  useEffect(() => {
    if (isOpen24_7) {
      // If clinic is open 24/7, set all days for both regular and emergency
      const allDays = daysOfWeek.map(day => day.id);
      handleInputChange(createSyntheticEvent('available_days', allDays));
      handleInputChange(createSyntheticEvent('emergency_available_days', allDays));
      handleInputChange(createSyntheticEvent('has_emergency_service', true));
      setHasEmergencyService(true);
    }
  }, [isOpen24_7]);

  // When emergency service status changes
  useEffect(() => {
    // If emergency service is disabled, clear selected emergency days
    if (!hasEmergencyService && formData.emergency_available_days?.length > 0) {
      handleInputChange(createSyntheticEvent('emergency_available_days', []));
    }
  }, [hasEmergencyService]);
  
  // When slot duration changes, check opening and closing times
  useEffect(() => {
    // Adjust current opening and closing hours to correct minute values
    if (formData.opening_time) {
      handleTimeAdjustment('opening_time', formData.opening_time);
    }
    if (formData.closing_time) {
      handleTimeAdjustment('closing_time', formData.closing_time);
    }
  }, [slotDuration]);

  // 24/7 toggle handler
  const handle24_7Change = (value: boolean) => {
    setIsOpen24_7(value);
    handleInputChange(createSyntheticEvent('is_open_24_7', value));
  };

  // Emergency service radio button handler
  const handleEmergencyServiceChange = (value: boolean) => {
    setHasEmergencyService(value);
    handleInputChange(createSyntheticEvent('has_emergency_service', value));
  };

  // Appointment duration change handler
  const handleSlotDurationChange = (duration: SlotDuration) => {
    setSlotDuration(duration);
    handleInputChange(createSyntheticEvent('slot_duration', parseInt(duration)));
  };

  // Function to adjust time according to slot duration
  const handleTimeAdjustment = (field: string, timeValue: string) => {
    if (!timeValue) return;
    
    // Allowed minute values according to selected slot duration
    const allowedMinutes: { [key: string]: number[] } = {
      '60': [0],
      '30': [0, 30],
      '20': [0, 20, 40]
    };
    
    // Find the nearest allowed minute
    const findNearestAllowedMinute = (minutes: number): number => {
      const allowed = allowedMinutes[slotDuration];
      if (allowed.includes(minutes)) return minutes;
      
      let closest = allowed[0];
      let minDiff = Math.abs(minutes - allowed[0]);
      
      for (const allowedMin of allowed) {
      const diff = Math.abs(minutes - allowedMin);
      if (diff < minDiff) {
        minDiff = diff;
          closest = allowedMin;
        }
      }
      
      return closest;
    };
    
    const [hours, minutes] = timeValue.split(':').map(Number);
    const adjustedMinutes = findNearestAllowedMinute(minutes);
    const adjustedTime = `${hours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
    
    // Update if value has changed
    if (adjustedTime !== timeValue) {
      handleInputChange(createSyntheticEvent(field, adjustedTime));
    }
  };

  const handleDayChange = (day: string, type: 'regular' | 'emergency') => {
    const fieldName = type === 'regular' ? 'available_days' : 'emergency_available_days';
    const currentDays = formData[fieldName] || [];
    
    // Update working days
    // If day is selected, remove it, otherwise add it
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d: string) => d !== day)
      : [...currentDays, day];
      
    handleInputChange(createSyntheticEvent(fieldName, updatedDays));
  };

  // Handle time input changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // If 1 hour slot is selected (60 min), force minutes to be 00
    if (slotDuration === '60' && (name === 'opening_time' || name === 'closing_time')) {
      const hourPart = value.split(':')[0];
      const newValue = `${hourPart}:00`;
      handleInputChange(createSyntheticEvent(name, newValue));
    } else {
      handleInputChange(e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Working Hours</h2>
        <p className="text-sm text-gray-600">Set your clinic's regular and emergency working schedule</p>
      </div>
      
      {/* 24/7 Operation Option */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">24/7 Operation</h3>
          <div className="ml-2 text-gray-400 cursor-pointer relative group">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="absolute z-10 w-48 text-xs bg-gray-800 text-white rounded py-2 px-3 right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Is your clinic open 24 hours a day, 7 days a week?
            </div>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {isOpen24_7 ? 'Yes, our clinic is open 24/7' : 'No, our clinic has specific working hours'}
            </span>
            <button
              type="button"
              onClick={() => handle24_7Change(!isOpen24_7)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isOpen24_7 ? 'bg-blue-600' : 'bg-gray-200'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={isOpen24_7}
            >
              <span 
                aria-hidden="true" 
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOpen24_7 ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Regular Working Days Section */}
      <div className={`mb-8 ${isOpen24_7 ? 'opacity-75' : ''}`}>
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Regular Working Days</h3>
          <div className="ml-2 text-gray-400 cursor-pointer relative group">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="absolute z-10 w-48 text-xs bg-gray-800 text-white rounded py-2 px-3 right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Select the days when your clinic is open for regular appointments
            </div>
          </div>
        </div>
        
        {isOpen24_7 && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-300 text-blue-700 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">All days automatically selected with 24/7 operation.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Validasyon hatası mesajı */}
        {errors.days && !isOpen24_7 && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{errors.days}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-7 gap-2 mb-6">
          {daysOfWeek.map(day => (
            <button
              key={`regular-${day.id}`}
              type="button"
              onClick={() => handleDayChange(day.id, 'regular')}
              disabled={loading || isOpen24_7}
              className={`flex flex-col items-center justify-center h-24 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                ${formData.available_days.includes(day.id) 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }
                ${(loading || isOpen24_7) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-xs uppercase tracking-wider mb-1 font-semibold">{day.label}</span>
              <span className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center ${formData.available_days.includes(day.id) ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                {formData.available_days.includes(day.id) ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Emergency Service Option */}
      <div className={`mb-6 ${isOpen24_7 ? 'opacity-75' : ''}`}>
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Emergency Service</h3>
          <div className="ml-2 text-gray-400 cursor-pointer relative group">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="absolute z-10 w-48 text-xs bg-gray-800 text-white rounded py-2 px-3 right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Does your clinic offer emergency services outside regular hours?
            </div>
          </div>
        </div>
        
        {isOpen24_7 && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-300 text-blue-700 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Emergency service is automatically enabled with 24/7 operation.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {hasEmergencyService ? 'Yes, our clinic provides emergency services' : 'No, our clinic only operates during regular working hours'}
            </span>
            <button
              type="button"
              onClick={() => handleEmergencyServiceChange(!hasEmergencyService)}
              disabled={loading || isOpen24_7}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${hasEmergencyService ? 'bg-blue-600' : 'bg-gray-200'} ${(loading || isOpen24_7) ? 'opacity-70 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={hasEmergencyService}
            >
              <span 
                aria-hidden="true" 
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasEmergencyService ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Emergency Days Section - sadece acil servis varsa göster */}
      {hasEmergencyService && (
        <div className={`mb-8 ${isOpen24_7 ? 'opacity-75' : ''}`}>
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Emergency Availability</h3>
            <div className="ml-2 text-gray-400 cursor-pointer relative group">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="absolute z-10 w-48 text-xs bg-gray-800 text-white rounded py-2 px-3 right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                Select the days when your clinic is available for emergency care
              </div>
            </div>
          </div>
          
          {isOpen24_7 && (
            <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-300 text-blue-700 text-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">All days automatically selected for emergency care with 24/7 operation.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-7 gap-2 mb-6">
            {daysOfWeek.map(day => (
              <button
                key={`emergency-${day.id}`}
                type="button"
                onClick={() => handleDayChange(day.id, 'emergency')}
                disabled={loading || isOpen24_7}
                className={`flex flex-col items-center justify-center h-24 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                  ${formData.emergency_available_days.includes(day.id) 
                    ? 'bg-red-50 border-red-500 text-red-800' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }
                  ${(loading || isOpen24_7) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-xs uppercase tracking-wider mb-1 font-semibold">{day.label}</span>
                <span className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center ${formData.emergency_available_days.includes(day.id) ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>
                  {formData.emergency_available_days.includes(day.id) ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Appointment Slot Duration Section */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Appointment Details</h3>
          <div className="ml-2 text-gray-400 cursor-pointer relative group">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="absolute z-10 w-64 text-xs bg-gray-800 text-white rounded py-2 px-3 right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Select the duration of each appointment slot. This affects available time slots in your schedule.
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-3">Select appointment duration</legend>
            <div className="flex flex-row space-x-6">
              {slotDurations.map(duration => (
                <div key={duration.value} className="flex items-center">
                  <input
                    id={`duration-${duration.value}`}
                    name="slot-duration"
                    type="radio"
                    value={duration.value}
                    checked={slotDuration === duration.value}
                    onChange={() => handleSlotDurationChange(duration.value as SlotDuration)}
                    disabled={loading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <label htmlFor={`duration-${duration.value}`} className="ml-3 block text-sm font-medium text-gray-700">
                    {duration.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500">
              This selection determines how long the appointment intervals will be. The minute values of opening and closing times are adjusted according to this selection.
            </p>
            
            {/* Online Meeting Option */}
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allow_online_meetings"
                    name="allow_online_meetings"
                    type="checkbox"
                    checked={!!formData.allow_online_meetings}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allow_online_meetings" className="font-medium text-gray-700">Accept Online Appointments</label>
                  <p className="text-gray-500">Patients and pet owners can schedule online appointments with you via video calls.</p>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
      
      {/* Working Hours Section */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Appointments Hours</h3>
        </div>
        
        {isOpen24_7 && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-300 text-blue-700 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Your clinic is open 24/7, but you can still set specific hours for online appointments.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Saat validasyon hatası */}
        {errors.operatingHours && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{errors.operatingHours}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center" htmlFor="opening-time">
                <span>Opening Time</span>
                <svg className="w-4 h-4 ml-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {slotDuration === '60' ? (
                  <div className="relative">
                    <select
                      id="opening-hour"
                      name="opening_time"
                      value={formData.opening_time}
                      onChange={(e) => {
                        handleInputChange(createSyntheticEvent('opening_time', e.target.value));
                      }}
                      disabled={loading}
                      className="pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    >
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                ) : slotDuration === '30' ? (
                  <div className="relative">
                    <select
                      id="opening-hour"
                      name="opening_time"
                      value={formData.opening_time}
                      onChange={(e) => {
                        handleInputChange(createSyntheticEvent('opening_time', e.target.value));
                      }}
                      disabled={loading}
                      className="pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    >
                      {[...Array(24)].map((_, hour) => (
                        <>
                          <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour.toString().padStart(2, '0')}:00
                          </option>
                          <option key={`${hour}-30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                            {hour.toString().padStart(2, '0')}:30
                          </option>
                        </>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="opening-hour"
                  name="opening_time"
                  value={formData.opening_time}
                      onChange={(e) => {
                        handleInputChange(createSyntheticEvent('opening_time', e.target.value));
                      }}
                  disabled={loading}
                  className="pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    >
                      {[...Array(24)].map((_, hour) => (
                        <>
                          <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour.toString().padStart(2, '0')}:00
                          </option>
                          <option key={`${hour}-20`} value={`${hour.toString().padStart(2, '0')}:20`}>
                            {hour.toString().padStart(2, '0')}:20
                          </option>
                          <option key={`${hour}-40`} value={`${hour.toString().padStart(2, '0')}:40`}>
                            {hour.toString().padStart(2, '0')}:40
                          </option>
                        </>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">When your clinic accepts online appointments</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center" htmlFor="closing-time">
                <span>Closing Time</span>
                <svg className="w-4 h-4 ml-1 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {slotDuration === '60' ? (
                  <div className="relative">
                    <select
                      id="closing-hour"
                      name="closing_time"
                      value={formData.closing_time}
                      onChange={(e) => {
                        handleInputChange(createSyntheticEvent('closing_time', e.target.value));
                      }}
                      disabled={loading}
                      className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${errors.operatingHours ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    >
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                ) : slotDuration === '30' ? (
                  <div className="relative">
                    <select
                      id="closing-hour"
                      name="closing_time"
                      value={formData.closing_time}
                      onChange={(e) => {
                        handleInputChange(createSyntheticEvent('closing_time', e.target.value));
                      }}
                      disabled={loading}
                      className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${errors.operatingHours ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    >
                      {[...Array(24)].map((_, hour) => (
                        <>
                          <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour.toString().padStart(2, '0')}:00
                          </option>
                          <option key={`${hour}-30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                            {hour.toString().padStart(2, '0')}:30
                          </option>
                        </>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="closing-hour"
                  name="closing_time"
                  value={formData.closing_time}
                      onChange={(e) => {
                        handleInputChange(createSyntheticEvent('closing_time', e.target.value));
                      }}
                  disabled={loading}
                  className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${errors.operatingHours ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    >
                      {[...Array(24)].map((_, hour) => (
                        <>
                          <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour.toString().padStart(2, '0')}:00
                          </option>
                          <option key={`${hour}-20`} value={`${hour.toString().padStart(2, '0')}:20`}>
                            {hour.toString().padStart(2, '0')}:20
                          </option>
                          <option key={`${hour}-40`} value={`${hour.toString().padStart(2, '0')}:40`}>
                            {hour.toString().padStart(2, '0')}:40
                          </option>
                        </>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">When your clinic stops accepting online appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 