import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';

interface UpcomingAppointment {
  appointment_id: string;
  pet_name: string;
  pet_owner_name: string;
  pet_owner_surname: string;
  pet_type?: string;
  pet_breed?: string;
  appointment_date: string;
  appointment_start_hour: string;
  appointment_end_hour: string;
  appointment_status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  video_meeting: boolean;
}

interface TimeSlot {
  hour: number;
  appointments: UpcomingAppointment[];
}

// Define time of day markers
interface TimeMarker {
  hour: number;
  label: string;
  icon: JSX.Element;
  color: string;
}

const timeMarkers: TimeMarker[] = [
  {
    hour: 0,
    label: 'Midnight',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    hour: 6,
    label: 'Morning',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    hour: 12,
    label: 'Noon',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    hour: 18,
    label: 'Evening',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
];

const UpcomingAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [clinicId, setClinicId] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<UpcomingAppointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  
  // Update current time periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get clinic ID from localStorage when component mounts
  useEffect(() => {
    const storedClinicId = localStorage.getItem('selectedClinicId');
    if (storedClinicId) {
      setClinicId(storedClinicId);
    }
  }, []);

  // Generate hours for the timeline (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Fetch upcoming appointments
  useEffect(() => {
    setLoading(true);
    
    if (!clinicId) {
      // If no clinic ID is available, show empty state
      setLoading(false);
      return;
    }
    
    const fetchUpcomingAppointments = async () => {
      try {
        // Fetch confirmed appointments for the next 24 hours using the endpoint
        const response = await axiosInstance.get(`/appointments/clinic/${clinicId}/upcoming-24h`);
        
        if (response.data.success) {
          const fetchedAppointments = response.data.appointments || [];
          setAppointments(fetchedAppointments);
          
          // Process appointments into time slots
          processAppointmentsIntoTimeSlots(fetchedAppointments);
        } else {
          setError('Failed to fetch appointments');
        }
      } catch (err) {
        console.error('Error fetching upcoming appointments:', err);
        setError('Failed to fetch appointments. Please try again.');
        setAppointments([]);
        processAppointmentsIntoTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingAppointments();
    // processAppointmentsIntoTimeSlots is in-component and used inside the
    // fetch function via closure; adding it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);
  
  // Process appointments into time slots
  const processAppointmentsIntoTimeSlots = (appointmentList: UpcomingAppointment[]) => {
    // Initialize time slots
    const slots: TimeSlot[] = hours.map(hour => ({
      hour,
      appointments: []
    }));
    
    // Current date/time
    const now = new Date();
    
    
    // Get only appointments in the next 24 hours
    const next24HoursAppointments = appointmentList.map(appointment => {
      // Create a properly formatted appointment object with correct datetime handling
      return {
        ...appointment,
        // No transformation needed - the API already returns properly formatted dates
      };
    }).filter(appointment => {
      // Ensure appointment has start hour
      if (!appointment.appointment_start_hour) {
        console.warn('Appointment missing start hour:', appointment);
        return false;
      }
      
      const appointmentDateTime = new Date(appointment.appointment_start_hour);
      
      // Check if date is valid
      if (isNaN(appointmentDateTime.getTime())) {
        console.warn('Invalid appointment date:', appointment.appointment_start_hour);
        return false;
      }
      
      const diffMs = appointmentDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Include if it's between now and the next 24 hours
      return diffHours >= -2 && diffHours <= 24; // Include appointments from the last 2 hours for demo purposes
    });
    
    
    // Distribute appointments to their respective time slots
    next24HoursAppointments.forEach(appointment => {
      try {
        const appointmentDateTime = new Date(appointment.appointment_start_hour);
        const hour = appointmentDateTime.getHours();
        
        // Add appointment to the corresponding hour slot
        const slotIndex = slots.findIndex(slot => slot.hour === hour);
        if (slotIndex !== -1) {
          slots[slotIndex].appointments.push(appointment);
        }
      } catch (error) {
        console.error('Error processing appointment:', appointment, error);
      }
    });
    
    setTimeSlots(slots);
  };
  
  // Format time display in 24-hour format (e.g., "09:00")
  const formatTime = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };
  
  // Format current time in 24-hour format (e.g., "14:35")
  const formatCurrentTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Get appointment time display in 24-hour format
  const getAppointmentTimeDisplay = (startHour: string, endHour: string): string => {
    try {
      // Function to format time from ISO string in 24-hour format
      const formatTimeFromIso = (isoString: string) => {
        const date = new Date(isoString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };
      
      return `${formatTimeFromIso(startHour)} - ${formatTimeFromIso(endHour)}`;
    } catch (error) {
      console.error('Error formatting appointment time:', error);
      return 'Invalid Time';
    }
  };
  
  // Calculate appointment position and height based on time
  const getAppointmentStyle = (startHour: string, endHour: string, index: number) => {
    try {
      const startDate = new Date(startHour);
      const endDate = new Date(endHour);
      
      // Calculate total minutes from start of the hour
      const startMinutes = startDate.getMinutes();
      const endMinutes = endDate.getMinutes();
      
      // Convert to percentage for positioning
      const topOffset = (startMinutes / 60) * 100;
      
      // Calculate height based on appointment duration
      const durationMinutes = ((endDate.getHours() - startDate.getHours()) * 60) + (endMinutes - startMinutes);
      const height = Math.max((durationMinutes / 60) * 100, 15); // Minimum height of 15%
      
      // For multiple appointments in the same time slot, add a horizontal offset
      const leftOffset = index * 5;
      
      return {
        top: `${topOffset}%`,
        height: `${height}%`,
        left: `${60 + leftOffset}px`, // Fixed left position plus offset for overlapping
        maxWidth: 'calc(100% - 70px)'
      };
    } catch (error) {
      console.error('Error calculating appointment style:', error);
      return {
        top: '0%',
        height: '15%',
        left: '60px',
        maxWidth: 'calc(100% - 70px)'
      };
    }
  };

  // Find time marker for a specific hour
  const getTimeMarker = (hour: number): TimeMarker | undefined => {
    return timeMarkers.find(marker => marker.hour === hour);
  };

  // Calculate current time position for the indicator
  const getCurrentTimePosition = () => {
    const now = currentDate;
    const totalMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const totalHeight = 24 * 80; // 24 hours * 80px (height of each hour slot)
    const position = (totalMinutesSinceMidnight / (24 * 60)) * totalHeight;
    return position;
  };
  
  // Generate additional information for pet display
  const getPetInfoDisplay = (appointment: UpcomingAppointment): string => {
    const petName = appointment.pet_name || 'Unknown Pet';
    const petType = appointment.pet_type || '';
    const ownerName = `${appointment.pet_owner_name} ${appointment.pet_owner_surname}`;
    
    // Format: Pet Name - Pet Type - Owner Name
    return `${petName} - ${petType} - ${ownerName}`;
  };

  // Open appointment details modal
  const openAppointmentModal = (appointment: UpcomingAppointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  // Close appointment details modal
  const closeAppointmentModal = () => {
    setSelectedAppointment(null);
    setIsModalOpen(false);
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setIsCanceling(true);
      
      // Using the same endpoint as in ClinicAppointments.tsx
      const response = await axiosInstance.put(`/appointments/${selectedAppointment.appointment_id}/status`, {
        status: 'canceled'
      });
      
      if (response.data.success) {
        // Update the local state: remove the appointment from the list
        const updatedAppointments = appointments.filter(
          app => app.appointment_id !== selectedAppointment.appointment_id
        );
        
        setAppointments(updatedAppointments);
        processAppointmentsIntoTimeSlots(updatedAppointments);
        
        // Close the modal
        closeAppointmentModal();
      } else {
        setError('Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error canceling appointment:', err);
      setError('An error occurred while canceling the appointment');
    } finally {
      setIsCanceling(false);
    }
  };

  // Handle marking appointment as completed
  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setIsCompleting(true);
      
      // Call the complete appointment endpoint
      const response = await axiosInstance.patch(`/appointments/${selectedAppointment.appointment_id}/complete`);
      
      if (response.data.message === 'Appointment marked as completed') {
        // Update the local state but keep appointment visible with completed status
        const updatedAppointments = appointments.map(app => 
          app.appointment_id === selectedAppointment.appointment_id 
            ? { ...app, appointment_status: 'completed' as const }
            : app
        );
        
        setAppointments(updatedAppointments);
        processAppointmentsIntoTimeSlots(updatedAppointments);
        
        // Close the modal
        closeAppointmentModal();
      } else {
        setError('Failed to mark appointment as completed');
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError('An error occurred while marking the appointment as completed');
    } finally {
      setIsCompleting(false);
    }
  };

  // Format a date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Get the CSS class for appointment card based on status
  const getAppointmentCardClass = (appointment: UpcomingAppointment) => {
    if (appointment.appointment_status === 'completed') {
      return 'absolute bg-gray-200 border-l-4 border-gray-500 rounded py-1 px-2 shadow-sm z-10 overflow-hidden text-xs cursor-pointer hover:bg-gray-300 transition-colors';
    }
    return 'absolute bg-blue-100 border-l-4 border-blue-500 rounded py-1 px-2 shadow-sm z-10 overflow-hidden text-xs cursor-pointer hover:bg-blue-200 transition-colors';
  };

  // Render appointment details modal
  const renderAppointmentModal = () => {
    if (!selectedAppointment) return null;
    
    const isPastAppointment = new Date(selectedAppointment.appointment_end_hour) < new Date();
    const isConfirmedAppointment = selectedAppointment.appointment_status === 'confirmed';
    const canComplete = isPastAppointment && isConfirmedAppointment;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-0 max-w-xl w-full shadow-xl overflow-hidden">
          {/* Modal Header */}
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">Appointment Details</h3>
              <button
                onClick={closeAppointmentModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Modal Body */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pet Owner</p>
                <p className="font-medium text-gray-800">
                  {selectedAppointment.pet_owner_name} {selectedAppointment.pet_owner_surname}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Pet</p>
                <p className="font-medium text-gray-800">
                  {selectedAppointment.pet_name}
                </p>
                {selectedAppointment.pet_type && (
                  <p className="text-xs text-gray-600">
                    {selectedAppointment.pet_type} {selectedAppointment.pet_breed ? `- ${selectedAppointment.pet_breed}` : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Appointment Time</p>
              <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-800">
                    {formatDate(selectedAppointment.appointment_date)}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-800">
                    {getAppointmentTimeDisplay(selectedAppointment.appointment_start_hour, selectedAppointment.appointment_end_hour)}
                  </span>
                </div>
              </div>
            </div>
            
            {selectedAppointment.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-md">
                  <p className="text-gray-800 whitespace-pre-line">{selectedAppointment.notes}</p>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Additional Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Video Meeting</p>
                  <p className="font-medium text-gray-800">
                    {selectedAppointment.video_meeting ? 'Yes' : 'No'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {selectedAppointment.appointment_status.charAt(0).toUpperCase() + selectedAppointment.appointment_status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Footer - wider buttons with better spacing */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={closeAppointmentModal}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            
            {isConfirmedAppointment && (
              <>
                {canComplete && (
                  <button
                    onClick={handleCompleteAppointment}
                    disabled={isCompleting}
                    className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 min-w-[160px] justify-center"
                  >
                    {isCompleting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Mark as Completed
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleCancelAppointment}
                  disabled={isCanceling}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 min-w-[160px] justify-center"
                >
                  {isCanceling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Canceling...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Cancel Appointment
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Next 24 Hours</h2>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline */}
          <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px] overflow-y-auto relative">
            {/* Current time indicator - positioned absolutely based on current time */}
            <div 
              className="absolute z-10 w-full pointer-events-none" 
              style={{ 
                top: `${getCurrentTimePosition()}px`,
                left: '0'
              }}
            >
              {/* Red line */}
              <div className="relative">
                {/* Time label now at the right */}
                <div className="absolute -top-4 right-4 z-10 flex items-center">
                  <span className="text-xs font-medium text-red-700">Current Time</span>
                  <span className="text-xs font-medium text-red-700 ml-1">{formatCurrentTime(currentDate)}</span>
                </div>
                
                {/* Red line across the timeline */}
                <div className="border-t border-red-500 w-full ml-14 mr-0"></div>
              </div>
            </div>
            
            {/* Time slots */}
            <div className="relative">
              {hours.map((hour) => {
                const timeMarker = getTimeMarker(hour);
                return (
                <div key={hour} className="flex border-t border-gray-200 relative" style={{ height: '80px' }}>
                  {/* Time label with special markers for specific times */}
                  <div className={`w-14 flex-shrink-0 border-r border-gray-200 py-2 px-2 bg-gray-50`}>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-gray-500">{formatTime(hour)}</span>
                    </div>
                  </div>
                  
                  {/* Appointment slot */}
                  <div className="flex-grow relative p-2">
                    {/* Half-hour line */}
                    <div className="absolute left-0 right-0 border-t border-dashed border-gray-200" style={{ top: '50%' }}></div>
                    
                    {/* Time of day marker centered in slot */}
                    {timeMarker && (
                      <div className="absolute left-0 right-0 flex justify-center items-center" style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 30 }}>
                        <div className={`flex items-center justify-center rounded-full px-3 py-1 border ${timeMarker.color} shadow-sm`}>
                          <span className="mr-1">{timeMarker.icon}</span>
                          <span className="text-xs whitespace-nowrap font-medium">{timeMarker.label}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Appointments in this slot */}
                    {timeSlots.find(slot => slot.hour === hour)?.appointments.map((appointment, index) => (
                      <div 
                        key={appointment.appointment_id}
                        className={getAppointmentCardClass(appointment)}
                        style={{
                          ...getAppointmentStyle(appointment.appointment_start_hour, appointment.appointment_end_hour, index),
                          maxWidth: 'calc(100% - 70px)',
                          width: 'calc(100% - 80px)'
                        }}
                        onClick={() => openAppointmentModal(appointment)}
                      >
                        <div className="flex items-center space-x-1.5">
                          <div className="truncate flex-1">
                            <span className={appointment.appointment_status === 'completed' ? "font-medium text-gray-600" : "font-medium text-blue-800"}>
                              {getPetInfoDisplay(appointment)}
                            </span>
                          </div>
                          
                          {/* Minimal time display */}
                          <div className={appointment.appointment_status === 'completed' ? "flex-shrink-0 text-gray-500" : "flex-shrink-0 text-gray-500"}>
                            {appointment.appointment_start_hour && new Date(appointment.appointment_start_hour).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          
                          {/* Video indicator if needed */}
                        {appointment.video_meeting && (
                            <div className="flex-shrink-0">
                              <span className={appointment.appointment_status === 'completed' 
                                ? "bg-gray-100 text-gray-700 text-xs px-1 py-0.5 rounded" 
                                : "bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded"}>
                                V
                          </span>
                            </div>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment Detail Modal */}
      {isModalOpen && renderAppointmentModal()}
    </div>
  );
};

export default UpcomingAppointments;
