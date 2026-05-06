import React, { useState, useEffect } from 'react';

// Appointment duration options
type SlotDuration = '60' | '30' | '20';

interface EditHoursProps {
  formData: {
    available_days: string[];
    emergency_available_days: string[];
    has_emergency_service: boolean;
    is_open_24_7: boolean;
    slot_duration: number;
    opening_time: string;
    closing_time: string;
    allow_online_meetings: boolean;
  };
  updateField: (name: string, value: unknown) => void;
  loading: boolean;
  isEditMode?: boolean;
  setFormModified?: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditHours: React.FC<EditHoursProps> = ({
  formData,
  updateField,
  loading,
  setFormModified
}) => {
  // State for emergency service status
  const [hasEmergencyService, setHasEmergencyService] = useState<boolean>(formData.has_emergency_service || false);
  const [isOpen24_7, setIsOpen24_7] = useState<boolean>(formData.is_open_24_7 || false);
  
  // Appointment duration state
  const [slotDuration, setSlotDuration] = useState<SlotDuration>(
    formData.slot_duration === 60 ? '60' : 
    formData.slot_duration === 30 ? '30' : 
    formData.slot_duration === 20 ? '20' : '60'
  );
  
  // Form validation errors state
  const [errors, setErrors] = useState<{ days?: string; operatingHours?: string; }>({});

  // Days list - Sunday first to match backend expectation
  const daysOfWeek = [
    { id: 'sunday', label: 'Sunday' },
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
  ];
  
  // Slot durations
  const slotDurations = [
    { value: '60', label: '1 Hour' },
    { value: '30', label: '30 Minutes' },
    { value: '20', label: '20 Minutes' }
  ];

  useEffect(() => {
    // Set initial values from formData
    setHasEmergencyService(formData.has_emergency_service);
    setIsOpen24_7(formData.is_open_24_7);
    setSlotDuration(
      formData.slot_duration === 60 ? '60' :
      formData.slot_duration === 30 ? '30' :
      formData.slot_duration === 20 ? '20' : '60'
    );

    validateWorkingHours();
    // validateWorkingHours is in-component and reads `formData` via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

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

  // When 24/7 status changes
  useEffect(() => {
    if (isOpen24_7) {
      // Eğer 24/7 açıksa, UI'da tüm günleri göster ama veritabanına gönderilen değerleri otomatik değiştirme
      updateField('is_open_24_7', true);
      
      // Not: Artık tüm günleri otomatik seçmiyoruz. Bu, kullanıcının istediği günleri seçmesine izin verir.
      // Bu değişiklik, başta True olan tüm günlerin kalmasını ve False olanların false kalmasını sağlar.
      // updateField('available_days', allDays);
      // updateField('emergency_available_days', allDays);
      
      // Emergency service'i de otomatik aktifleştirmiyoruz
      // updateField('has_emergency_service', true);
      // setHasEmergencyService(true);
    } else {
      updateField('is_open_24_7', false);
    }
    // updateField is a parent prop; including it would re-fire on every
    // parent render. Effect should fire only on the toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen24_7]);

  // When emergency service status changes
  useEffect(() => {
    // If emergency service is disabled, clear selected emergency days
    if (!hasEmergencyService && formData.emergency_available_days?.length > 0) {
      updateField('emergency_available_days', []);
    }
    // formData.emergency_available_days is a guard; updateField is a parent
    // prop. Effect should only react to hasEmergencyService transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Effect intentionally re-runs only when slotDuration toggles; current
    // opening/closing times are read inside via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotDuration]);

  // 24/7 toggle handler
  const handle24_7Change = (value: boolean) => {
    setIsOpen24_7(value);
    updateField('is_open_24_7', value);
  };

  // Emergency service radio button handler
  const handleEmergencyServiceChange = (value: boolean) => {
    setHasEmergencyService(value);
    updateField('has_emergency_service', value);
  };

  // Appointment duration change handler
  const handleSlotDurationChange = (duration: SlotDuration) => {
    setSlotDuration(duration);
    
    // Convert string duration to number explicitly
    const durationValue = parseInt(duration, 10);
    
    // Konsola tam olarak hangi değerin gönderildiğini yazdır
    console.log('Randevu süresi güncelleniyor:', {
      rawDuration: duration,
      parsedDuration: durationValue,
      type: typeof durationValue
    });
    
    // Ensure it's a number when passing it back
    updateField('slot_duration', durationValue);
    
    // Form değiştirildi olarak işaretle, querySelector hatasını düzelt
    setFormModified?.(true);
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
      updateField(field, adjustedTime);
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
      
    updateField(fieldName, updatedDays);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateField(name, checked);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Working Hours</h2>
        <p className="text-sm text-gray-600">Update your clinic's working schedule</p>
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
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOpen24_7 ? 'bg-blue-600' : 'bg-gray-200'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={isOpen24_7}
            >
              <span 
                aria-hidden="true" 
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isOpen24_7 ? 'translate-x-5' : 'translate-x-0'}`} 
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
        </div>
        
        {isOpen24_7 && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-300 text-blue-700 text-sm">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium">All days automatically selected with 24/7 operation.</p>
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
              className={`flex flex-col items-center justify-center h-24 rounded-lg border-2 transition-all duration-200
                ${(formData.available_days || []).includes(day.id) 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }
                ${(loading || isOpen24_7) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-xs uppercase tracking-wider mb-1 font-semibold">{day.label}</span>
              <span className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center ${(formData.available_days || []).includes(day.id) ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                {(formData.available_days || []).includes(day.id) ? (
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
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {hasEmergencyService ? 'Yes, our clinic provides emergency services' : 'No, our clinic only operates during regular working hours'}
            </span>
            <button
              type="button"
              onClick={() => handleEmergencyServiceChange(!hasEmergencyService)}
              disabled={loading || isOpen24_7}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasEmergencyService ? 'bg-blue-600' : 'bg-gray-200'} ${(loading || isOpen24_7) ? 'opacity-70 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={hasEmergencyService}
            >
              <span 
                aria-hidden="true" 
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${hasEmergencyService ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Emergency Days Section - only show if emergency service is enabled */}
      {hasEmergencyService && (
        <div className={`mb-8 ${isOpen24_7 ? 'opacity-75' : ''}`}>
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Emergency Availability</h3>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-6">
            {daysOfWeek.map(day => (
              <button
                key={`emergency-${day.id}`}
                type="button"
                onClick={() => handleDayChange(day.id, 'emergency')}
                disabled={loading || isOpen24_7}
                className={`flex flex-col items-center justify-center h-24 rounded-lg border-2 transition-all duration-200
                  ${(formData.emergency_available_days || []).includes(day.id) 
                    ? 'bg-red-50 border-red-500 text-red-800' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }
                  ${(loading || isOpen24_7) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-xs uppercase tracking-wider mb-1 font-semibold">{day.label}</span>
                <span className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center ${(formData.emergency_available_days || []).includes(day.id) ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>
                  {(formData.emergency_available_days || []).includes(day.id) ? (
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
            
            {/* Online Meeting Option */}
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allow_online_meetings"
                    name="allow_online_meetings"
                    type="checkbox"
                    checked={!!formData.allow_online_meetings}
                    onChange={handleCheckboxChange}
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
              </label>
              <div className="relative">
                <select
                  id="opening-hour"
                  name="opening_time"
                  value={formData.opening_time || ''}
                  onChange={(e) => updateField('opening_time', e.target.value)}
                  disabled={loading}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {slotDuration === '60' ? (
                    [...Array(24)].map((_, hour) => (
                      <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>
                    ))
                  ) : slotDuration === '30' ? (
                    [...Array(24)].flatMap((_, hour) => [
                      <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>,
                      <option key={`${hour}-30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                        {hour.toString().padStart(2, '0')}:30
                      </option>
                    ])
                  ) : (
                    [...Array(24)].flatMap((_, hour) => [
                      <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>,
                      <option key={`${hour}-20`} value={`${hour.toString().padStart(2, '0')}:20`}>
                        {hour.toString().padStart(2, '0')}:20
                      </option>,
                      <option key={`${hour}-40`} value={`${hour.toString().padStart(2, '0')}:40`}>
                        {hour.toString().padStart(2, '0')}:40
                      </option>
                    ])
                  )}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center" htmlFor="closing-time">
                <span>Closing Time</span>
              </label>
              <div className="relative">
                <select
                  id="closing-hour"
                  name="closing_time"
                  value={formData.closing_time || ''}
                  onChange={(e) => updateField('closing_time', e.target.value)}
                  disabled={loading}
                  className={`block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.operatingHours ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                >
                  {slotDuration === '60' ? (
                    [...Array(24)].map((_, hour) => (
                      <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>
                    ))
                  ) : slotDuration === '30' ? (
                    [...Array(24)].flatMap((_, hour) => [
                      <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>,
                      <option key={`${hour}-30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                        {hour.toString().padStart(2, '0')}:30
                      </option>
                    ])
                  ) : (
                    [...Array(24)].flatMap((_, hour) => [
                      <option key={`${hour}-00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>,
                      <option key={`${hour}-20`} value={`${hour.toString().padStart(2, '0')}:20`}>
                        {hour.toString().padStart(2, '0')}:20
                      </option>,
                      <option key={`${hour}-40`} value={`${hour.toString().padStart(2, '0')}:40`}>
                        {hour.toString().padStart(2, '0')}:40
                      </option>
                    ])
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHours;
