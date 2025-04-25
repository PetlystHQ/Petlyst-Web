import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axiosInstance from '../../../utils/axiosConfig';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
}

interface TimeSlot {
  time: string;
  start: string;
  end: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: number;
  clinicName: string;
  availableDays?: boolean[]; // Add available_days array from clinic
  openingTime?: string; // HH:MM format
  closingTime?: string; // HH:MM format
  timeSlotDuration?: number; // Duration in minutes
  allowOnlineMeetings?: boolean; // Whether clinic allows online meetings
  onAppointmentCreated?: () => void; // Add callback for when an appointment is created
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, 
  onClose, 
  clinicId,
  clinicName,
  availableDays = [true, true, true, true, true, true, true], // Default to all days available if not provided
  openingTime = "09:00",
  closingTime = "17:00",
  timeSlotDuration = 30,
  allowOnlineMeetings = false,
  onAppointmentCreated
}) => {
  const [step, setStep] = useState<number>(1);
  const [pets, setPets] = useState<Pet[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Form states
  const [videoMeeting, setVideoMeeting] = useState<boolean>(false);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Close modal with escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  // Fetch user's pets when modal opens and generate date range
  useEffect(() => {
    if (isOpen && token) {
      fetchPets();
      generateDateRange();
    }
  }, [isOpen, token, clinicId, availableDays]);
  
  // Fetch available time slots or generate them when date is selected
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate]);
  
  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setVideoMeeting(false);
      setSelectedPet('');
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);
  
  // Auto-forward from step 1 if online meetings are not allowed
  useEffect(() => {
    if (isOpen && step === 1 && !allowOnlineMeetings) {
      setVideoMeeting(false);
      const timer = setTimeout(() => setStep(2), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, allowOnlineMeetings]);
  
  // Generate dates for the next 7 days starting from today
  const generateDateRange = () => {
    const dates: string[] = [];
    const today = new Date();
    let daysCount = 0;
    let daysChecked = 0;
    const maxDaysToCheck = 30; // Check up to 30 days ahead to find 7 open days
    
    // Check if today's closing time has already passed
    const isTodayClosingTimePassed = () => {
      const [closingHour, closingMinute] = closingTime.split(':').map(Number);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Compare as minutes since midnight
      const closingTimeMinutes = closingHour * 60 + closingMinute;
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      return currentTimeMinutes >= closingTimeMinutes;
    };
    
    // Skip today if closing time has passed
    const skipToday = isTodayClosingTimePassed();
    let startDayOffset = skipToday ? 1 : 0;
    
    // Find 7 open days starting from today or tomorrow
    while (daysCount < 7 && daysChecked < maxDaysToCheck) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + startDayOffset + daysChecked);
      daysChecked++;
      
      // Get day of week and convert to the index used in available_days array
      const jsDay = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const availableDaysIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0, Sun=6
      
      // Check if clinic is open on this day
      if (availableDays[availableDaysIndex]) {
        // Format date as YYYY-MM-DD
        const formattedDate = currentDate.toISOString().split('T')[0];
        dates.push(formattedDate);
        daysCount++;
      }
    }
    
    setAvailableDates(dates);
    
    // If we found any available dates, set the first one as selected by default
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  };
  
  // Generate time slots based on clinic's opening hours and slot duration
  const generateTimeSlots = async () => {
    try {
      setLoading(true);
      setSelectedTime(''); // Reset selected time when generating new time slots
      
      // First, check if we have any booked appointments for this day to avoid them
      let bookedSlots: { start: string, end: string }[] = [];
      
      // Try to fetch booked slots from API
      try {
        console.log(`Fetching booked slots for clinic ${clinicId} on date ${selectedDate}`);
        const response = await axiosInstance.get(`/appointments/booked-slots/${clinicId}/${selectedDate}`);
        
        if (response.data && response.data.success && response.data.bookedSlots) {
          console.log("Received booked slots:", response.data.bookedSlots);
          bookedSlots = response.data.bookedSlots;
        } else {
          console.log("No booked slots found or empty response");
        }
      } catch (err) {
        console.warn("Could not fetch booked slots, will show all available slots", err);
        // We'll continue without booked slots data - this is expected if the endpoint isn't implemented yet
        bookedSlots = []; // Ensure empty array if API fails
      }
      
      // Parse opening and closing times
      const [openingHour, openingMinute] = openingTime.split(':').map(Number);
      const [closingHour, closingMinute] = closingTime.split(':').map(Number);
      
      // Create slots for the selected date
      const slots: TimeSlot[] = [];
      const selectedDateObj = new Date(selectedDate);
      
      // Start time in minutes since midnight
      let startTimeMinutes = openingHour * 60 + openingMinute;
      const endTimeMinutes = closingHour * 60 + closingMinute;
      
      // Get current time if selected date is today
      const now = new Date();
      const isToday = isSelectedDateToday();
      const currentTimeInMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
      
      while (startTimeMinutes < endTimeMinutes) {
        const slotStartHour = Math.floor(startTimeMinutes / 60);
        const slotStartMinute = startTimeMinutes % 60;
        
        const slotEndMinutes = startTimeMinutes + timeSlotDuration;
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMinute = slotEndMinutes % 60;
        
        // Format as HH:MM
        const timeString = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
        
        // Fix timezone issue: Instead of using ISO string, create formatted datetime strings
        // that preserve the local time
        const startTimeStr = `${selectedDate}T${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}:00`;
        const endTimeStr = `${selectedDate}T${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}:00`;
        
        // Check if this slot is in the past (for today only)
        const isPastTime = isToday && startTimeMinutes <= currentTimeInMinutes;
        
        // Check if this slot overlaps with any booked slots
        const isBooked = bookedSlots.some(booked => {
          // Parse times to compare without timezone issues
          const bookedStartTime = new Date(booked.start).toTimeString().substring(0, 5);
          const bookedEndTime = new Date(booked.end).toTimeString().substring(0, 5);
          
          return (
            (timeString >= bookedStartTime && timeString < bookedEndTime) || 
            (`${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}` > bookedStartTime && 
             `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}` <= bookedEndTime)
          );
        });
        
        // Only add available future slots to the list
        if (!isBooked && !isPastTime) {
          slots.push({
            time: timeString,
            start: startTimeStr,
            end: endTimeStr
          });
        }
        
        // Move to next slot
        startTimeMinutes += timeSlotDuration;
      }
      
      setAvailableTimeSlots(slots);
      
      // Auto-select first available slot
      if (slots.length > 0) {
        setSelectedTime(slots[0].time);
      }
    } catch (err) {
      console.error('Error generating time slots:', err);
      setError('Failed to generate available time slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user's pets
  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/pets/my-pets');
      
      if (response.data.success) {
        setPets(response.data.pets || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch pets');
      }
    } catch (err: any) {
      console.error('Error fetching pets:', err);
      setError('Failed to fetch your pets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if selected date is today
  const isSelectedDateToday = () => {
    if (!selectedDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    return today.getTime() === selectedDateObj.getTime();
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!selectedPet || !selectedDate || !selectedTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Get the full time slot data
      const selectedSlot = availableTimeSlots.find(slot => slot.time === selectedTime);
      
      if (!selectedSlot) {
        setError('Selected time slot is not available');
        setLoading(false);
        return;
      }
      
      // Create appointment data
      const appointmentData = {
        petId: selectedPet,
        clinicId: clinicId,
        appointmentDate: selectedDate,
        appointmentStartHour: selectedSlot.start, // Already properly formatted to prevent timezone issues
        appointmentEndHour: selectedSlot.end, // Already properly formatted to prevent timezone issues
        videoMeeting: videoMeeting,
        notes: reason || null
      };
      
      console.log("Submitting appointment data:", appointmentData);
      
      try {
        // Make the API call to create appointment
        const response = await axiosInstance.post('/appointments', appointmentData);
        
        if (response.data) {
          console.log("Appointment created successfully:", response.data);
          setSuccess(true);
          // Call the callback if provided
          if (onAppointmentCreated) {
            onAppointmentCreated();
          }
        } else {
          throw new Error('Failed to create appointment - empty response');
        }
      } catch (apiError: any) {
        console.error("API error creating appointment:", apiError);
        
        // If we received a specific error message from the API, show it
        if (apiError.response?.data?.error) {
          throw new Error(apiError.response.data.error);
        }
        
        // For development mode: simulate success if API doesn't exist yet
        if (process.env.NODE_ENV === 'development') {
          console.warn("DEV MODE: Simulating successful appointment creation");
          setSuccess(true);
          // Call the callback if provided, even in dev mode
          if (onAppointmentCreated) {
            onAppointmentCreated();
          }
        } else {
          throw apiError; // Re-throw in production
        }
      }
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Render error message
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm mb-4">
        {error}
      </div>
    );
  };
  
  // Modal content based on step
  const renderStepContent = () => {
    if (success) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Appointment Booked!</h3>
          <p className="text-gray-600 mb-6">
            Your appointment at {clinicName} has been successfully scheduled.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
            <div className="mb-2">
              <span className="text-gray-500 text-sm">Pet:</span>
              <span className="text-gray-800 font-medium ml-2">
                {pets.find(pet => pet.pet_id === selectedPet)?.pet_name}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-gray-500 text-sm">Date:</span>
              <span className="text-gray-800 font-medium ml-2">{formatDate(selectedDate)}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-500 text-sm">Time:</span>
              <span className="text-gray-800 font-medium ml-2">{selectedTime}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Type:</span>
              <span className="text-gray-800 font-medium ml-2">{videoMeeting ? 'Online Meeting' : 'In-person Visit'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      );
    }
    
    switch (step) {
      case 1:
        // Appointment Type Selection (only show if online meetings are allowed)
        return allowOnlineMeetings ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Appointment Type</h3>
            
            {renderError()}
            
            <div className="space-y-3">
              <div 
                className={`border rounded-lg p-5 cursor-pointer transition-colors ${
                  !videoMeeting ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setVideoMeeting(false)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    !videoMeeting ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  } mr-3 flex-shrink-0`}>
                    {!videoMeeting && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">In-person Visit</h4>
                    <p className="text-sm text-gray-500">Visit the clinic in person for your appointment</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-5 cursor-pointer transition-colors ${
                  videoMeeting ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setVideoMeeting(true)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    videoMeeting ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  } mr-3 flex-shrink-0`}>
                    {videoMeeting && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Online Meeting</h4>
                    <p className="text-sm text-gray-500">Consult with the veterinarian via video call</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          // If online meetings are not allowed, show loading spinner while auto-forwarding
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Your Pet</h3>
            
            {renderError()}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No pets found</h3>
                <p className="text-gray-600 mb-4">Please add a pet to your profile first before booking an appointment.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pets.map(pet => (
                  <div 
                    key={pet.pet_id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPet === pet.pet_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPet(pet.pet_id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border ${
                        selectedPet === pet.pet_id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      } mr-3 flex-shrink-0`}>
                        {selectedPet === pet.pet_id && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{pet.pet_name}</h4>
                        <p className="text-sm text-gray-500">{pet.pet_type} · {pet.pet_breed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              {allowOnlineMeetings && (
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setStep(3)}
                disabled={!selectedPet || loading || pets.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        );
         
      case 3:
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date & Time</h3>
            
            {renderError()}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date selection - Now showing only open days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <div className="flex gap-2 pb-2 flex-wrap">
                    {availableDates.map(date => {
                      const dateObj = new Date(date);
                      const day = dateObj.getDate();
                      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                      
                      return (
                        <div 
                          key={date}
                          className={`w-20 text-center py-2 rounded-lg cursor-pointer transition-colors ${
                            selectedDate === date 
                              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="text-xs font-medium">{weekday}</div>
                          <div className="font-bold text-lg">{day}</div>
                          <div className="text-xs">{month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Time selection - only show if date is selected */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                    <div className="flex flex-wrap gap-2 max-w-full">
                      {availableTimeSlots.map(slot => (
                        <div 
                          key={slot.time}
                          className={`w-20 text-center py-2 rounded-lg cursor-pointer transition-colors ${
                            selectedTime === slot.time 
                              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedTime(slot.time)}
                        >
                          {slot.time}
                        </div>
                      ))}
                    </div>
                    
                    {/* Show message if no time slots available */}
                    {availableTimeSlots.length === 0 && (
                      <div className="mt-3 text-amber-600 text-sm">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          No available time slots for this date. Please select another date.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Details</h3>
            
            {renderError()}
            
            <div className="space-y-4">
              {/* Appointment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pet</p>
                    <p className="font-medium">
                      {pets.find(pet => pet.pet_id === selectedPet)?.pet_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-medium">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-medium">{videoMeeting ? 'Online Meeting' : 'In-person Visit'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Clinic</p>
                    <p className="font-medium">{clinicName}</p>
                  </div>
                </div>
              </div>
              
              {/* Reason for visit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please describe the reason for your visit, symptoms your pet is experiencing, or any other important details the veterinarian should know..."
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Book Appointment
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Book Appointment</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm">{clinicName}</p>
        </div>
        
        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
