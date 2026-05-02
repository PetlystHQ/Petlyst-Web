import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config/api';

// Define interface for calendar appointments
interface CalendarAppointment {
  appointment_id: string;
  pet_id: string;
  pet_owner_id: string;
  pet_owner_name: string;
  pet_owner_surname: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  appointment_date: string;
  appointment_start_hour: string;
  appointment_end_hour: string;
  appointment_status: string;
  video_meeting: boolean;
  notes: string;
  meeting_url?: string;
}

// Map for appointment status colors
const statusColors: Record<string, { bg: string; text: string; border: string; filterBg: string }> = {
  pending: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800', 
    border: 'border-yellow-200',
    filterBg: 'bg-yellow-50' 
  },
  confirmed: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    border: 'border-green-200',
    filterBg: 'bg-green-50' 
  },
  completed: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-200',
    filterBg: 'bg-blue-50' 
  },
  canceled: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-200',
    filterBg: 'bg-red-50' 
  },
};

interface CalendarProps {
  clinicId: string;
  token: string;
}

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';

// Modal states interface
interface AppointmentModal {
  isOpen: boolean;
  appointment: CalendarAppointment | null;
  isLoading: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ clinicId, token }) => {
  // State for calendar
  const [appointments, setAppointments] = useState<Record<string, CalendarAppointment[]>>({});
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Filter settings
  const [showPending, setShowPending] = useState(true);
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCanceled, setShowCanceled] = useState(false);
  
  // Modal state for appointment actions
  const [appointmentModal, setAppointmentModal] = useState<AppointmentModal>({
    isOpen: false,
    appointment: null,
    isLoading: false
  });

  // Function to get all days in a month
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    
    // Find the first day of the week for this month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Add days from previous month to fill the first week
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; i > 0; i--) {
      days.push(new Date(prevMonthYear, prevMonth, daysInPrevMonth - i + 1));
    }
    
    // Add all days in current month
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    // Add days from next month to complete the last week
    const lastDay = new Date(year, month + 1, 0);
    const endingDayOfWeek = lastDay.getDay();
    
    const daysToAdd = endingDayOfWeek === 0 ? 0 : 7 - endingDayOfWeek;
    
    for (let i = 1; i <= daysToAdd; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  // Format time from ISO string
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to normalize date format
  const normalizeDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // Try to parse the date string to handle different formats
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error parsing date:', dateString, e);
      return dateString;
    }
  };

  // Fetch all appointments with different statuses
  const fetchAllAppointments = async () => {
    if (!token || !clinicId) return;
    
    try {
      setLoadingAppointments(true);
      setAppointmentError(null);
      
      const appointmentsByDate: Record<string, CalendarAppointment[]> = {};
      let sampleAppointment: CalendarAppointment | null = null;
      
      console.log('Fetching appointments for clinic:', clinicId);
      
      // Get pending appointments
      const pendingResponse = await axios.get(
        `${API_URL}/api/appointments/clinic/${clinicId}/pending`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Pending appointments received:', pendingResponse.data.appointments?.length || 0);
      
      // Get confirmed appointments
      const confirmedResponse = await axios.get(
        `${API_URL}/api/appointments/clinic/${clinicId}/confirmed`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Confirmed appointments received:', confirmedResponse.data.appointments?.length || 0);
      
      // Debug online meetings
      if (confirmedResponse.data.appointments?.length > 0) {
        const onlineMeetings = confirmedResponse.data.appointments.filter((a: CalendarAppointment) => a.video_meeting === true);
        if (onlineMeetings.length > 0) {
          console.log('Online meetings found:', onlineMeetings.length);
          console.log('First online meeting sample:', {
            id: onlineMeetings[0].appointment_id,
            isVideoMeeting: onlineMeetings[0].video_meeting,
            meetingUrl: onlineMeetings[0].meeting_url
          });
        } else {
          console.log('No online meetings found among confirmed appointments');
        }
      }
      
      // Get completed appointments
      const completedResponse = await axios.get(
        `${API_URL}/api/appointments/clinic/${clinicId}/completed`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Completed appointments received:', completedResponse.data.appointments?.length || 0);
      
      // Get canceled appointments
      const canceledResponse = await axios.get(
        `${API_URL}/api/appointments/clinic/${clinicId}/canceled`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Canceled appointments received:', canceledResponse.data.appointments?.length || 0);
      
      // Check that all responses are successful
      if (pendingResponse.data.success && 
          confirmedResponse.data.success && 
          completedResponse.data.success &&
          canceledResponse.data.success) {
        
        // Get current month's start and end dates
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        
        console.log('Filtering appointments for date range:', startDate, 'to', endDate);
        
        // Our additional client-side filter to handle potential issues with deleted pets
        // In case backend filters aren't working as expected
        const filterAppointment = (appointment: CalendarAppointment): boolean => {
          // Skip appointments without pet data
          if (!appointment.pet_id || !appointment.pet_name) {
            console.log('Skipping appointment missing pet data:', appointment.appointment_id);
            return false;
          }
          
          // Skip appointments where pet name contains "[DELETED]" or similar markers
          if (appointment.pet_name.includes("[DELETED]") || 
              appointment.pet_name.includes("(DELETED)") ||
              appointment.pet_name.toLowerCase().includes("deleted")) {
            console.log('Skipping appointment for deleted pet:', appointment.pet_id, appointment.pet_name);
            return false;
          }
          
          // Skip if pet owner info is missing (might indicate deleted data)
          if (!appointment.pet_owner_id || 
              !appointment.pet_owner_name ||
              !appointment.pet_owner_surname) {
            console.log('Skipping appointment with missing owner data:', appointment.appointment_id);
            return false;
          }
          
          return true;
        };
        
        // Process all the appointments and group by date
        const processAppointments = (appointments: CalendarAppointment[], status: AppointmentStatus) => {
          if (!appointments || !Array.isArray(appointments)) {
            console.warn(`No appointments found for status: ${status}`);
            return;
          }
          
          console.log(`Processing ${appointments.length} ${status} appointments`);
          
          // Apply our client-side filter
          const validAppointments = appointments.filter(filterAppointment);
          
          if (validAppointments.length !== appointments.length) {
            console.log(`Filtered out ${appointments.length - validAppointments.length} invalid appointments for ${status}`);
          }
          
          validAppointments.forEach(appointment => {
            // Save sample appointment for debugging
            if (!sampleAppointment && appointment) {
              sampleAppointment = appointment;
            }
            
            // Normalize the date format to ensure consistent comparison
            const normalizedDate = normalizeDate(appointment.appointment_date);
            
            if (!normalizedDate) {
              console.warn('Invalid date format for appointment:', appointment);
              return;
            }
            
            // Only include appointments for the current month
            if (normalizedDate >= startDate && normalizedDate <= endDate) {
              if (!appointmentsByDate[normalizedDate]) {
                appointmentsByDate[normalizedDate] = [];
              }
              
              // Set the correct status (in case it's not already set)
              appointment.appointment_status = status;
              appointmentsByDate[normalizedDate].push(appointment);
            }
          });
        };
        
        processAppointments(pendingResponse.data.appointments, 'pending');
        processAppointments(confirmedResponse.data.appointments, 'confirmed');
        processAppointments(completedResponse.data.appointments, 'completed');
        processAppointments(canceledResponse.data.appointments, 'canceled');
        
        // Sort appointments for each date by time
        Object.keys(appointmentsByDate).forEach(date => {
          appointmentsByDate[date].sort((a, b) => {
            return new Date(a.appointment_start_hour).getTime() - new Date(b.appointment_start_hour).getTime();
          });
        });
        
        // Count total appointments for logging
        let totalAppointments = 0;
        Object.keys(appointmentsByDate).forEach(date => {
          totalAppointments += appointmentsByDate[date].length;
        });
        console.log(`Total appointments for calendar: ${totalAppointments}`);
        
        setAppointments(appointmentsByDate);
      } else {
        console.error('One or more appointment requests failed:', {
          pending: pendingResponse.data.success,
          confirmed: confirmedResponse.data.success,
          completed: completedResponse.data.success,
          canceled: canceledResponse.data.success
        });
        setAppointmentError('Failed to fetch some appointments');
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setAppointmentError(error.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Load calendar data when the component mounts or currentMonth changes
  useEffect(() => {
    if (clinicId && token) {
      // Get the year and month from currentMonth
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Get days for current month
      setCalendarDays(getDaysInMonth(year, month));
      
      // Fetch all appointments for the current month
      fetchAllAppointments();
    }
  }, [clinicId, token, currentMonth]);

  // Function to determine if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Function to determine if a date is in the current month
  const isCurrentMonth = (date: Date, baseMonth: Date) => {
    return date.getMonth() === baseMonth.getMonth();
  };

  // Function to get filtered appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    // Format the date as YYYY-MM-DD for lookup
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Get appointments for this date
    const allAppointmentsForDate = appointments[dateString] || [];
    
    // Apply status filters
    return allAppointmentsForDate.filter(appointment => {
      if (appointment.appointment_status === 'pending' && showPending) return true;
      if (appointment.appointment_status === 'confirmed' && showConfirmed) return true;
      if (appointment.appointment_status === 'completed' && showCompleted) return true;
      if (appointment.appointment_status === 'canceled' && showCanceled) return true;
      return false;
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // Navigate to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Refresh all appointments
  const refreshAppointments = () => {
    fetchAllAppointments();
  };
  
  // Open appointment modal
  const openAppointmentModal = (appointment: CalendarAppointment) => {
    setAppointmentModal({
      isOpen: true,
      appointment,
      isLoading: false
    });
    setActionError(null);
  };
  
  // Close appointment modal
  const closeAppointmentModal = () => {
    setAppointmentModal({
      isOpen: false,
      appointment: null,
      isLoading: false
    });
  };
  
  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    if (!token || !appointmentId) return;
    
    setAppointmentModal(prev => ({ ...prev, isLoading: true }));
    setActionError(null);
    
    try {
      let response;
      
      if (newStatus === 'completed') {
        // Use the complete endpoint for marking as completed
        response = await axios.patch(
          `${API_URL}/api/appointments/${appointmentId}/complete`,
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      } else {
        // Use the status update endpoint for other status changes
        response = await axios.put(
          `${API_URL}/api/appointments/${appointmentId}/status`,
          { status: newStatus },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      }
      
      if (response.data.success || response.status === 200) {
        // Close the modal and refresh appointments
        closeAppointmentModal();
        fetchAllAppointments();
      } else {
        setActionError('Failed to update appointment status');
      }
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      setActionError(error.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setAppointmentModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Render calendar for the current month
  const renderCalendar = () => {
    const monthName = currentMonth.toLocaleString('en-US', { month: 'long' });
    const year = currentMonth.getFullYear();
    
    // Array of day names
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        {/* Calendar header with navigation and refresh button */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={goToPreviousMonth} 
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-center">{monthName} {year}</h2>
            <div className="flex mt-1">
              <button 
                onClick={goToCurrentMonth} 
                className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                aria-label="Go to current month"
              >
                Today
              </button>
              <button 
                onClick={refreshAppointments}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          <button 
            onClick={goToNextMonth} 
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Status filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 px-4">
          <button 
            onClick={() => setShowPending(!showPending)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
              showPending 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                : `${statusColors.pending.filterBg} text-yellow-600 border border-transparent`
            }`}
          >
            {showPending ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Pending
          </button>
          
          <button 
            onClick={() => setShowConfirmed(!showConfirmed)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
              showConfirmed 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : `${statusColors.confirmed.filterBg} text-green-600 border border-transparent`
            }`}
          >
            {showConfirmed ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Confirmed
          </button>
          
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
              showCompleted 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : `${statusColors.completed.filterBg} text-blue-600 border border-transparent`
            }`}
          >
            {showCompleted ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Completed
          </button>
          
          <button 
            onClick={() => setShowCanceled(!showCanceled)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
              showCanceled 
                ? 'bg-red-100 text-red-800 border border-red-300' 
                : `${statusColors.canceled.filterBg} text-red-600 border border-transparent`
            }`}
          >
            {showCanceled ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Canceled
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Day name headers */}
          {dayNames.map((day, index) => (
            <div key={index} className="text-center font-medium text-gray-500 text-sm py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date, currentMonth);
            
            return (
              <div 
                key={index} 
                className={`min-h-[6rem] border p-1 ${
                  isToday(date) 
                    ? 'bg-blue-50 border-blue-200' 
                    : isCurrentMonthDay 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${isToday(date) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                    {date.getDate()}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-xs font-medium bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[5rem]">
                  {dayAppointments.slice(0, 3).map((appointment, i) => (
                    <div 
                      key={i}
                      className={`text-xs p-1 rounded truncate ${statusColors[appointment.appointment_status].bg} ${statusColors[appointment.appointment_status].text} ${statusColors[appointment.appointment_status].border} border cursor-pointer transition-all hover:shadow-md`}
                      title={`${appointment.pet_name} - ${appointment.pet_owner_name} ${appointment.pet_owner_surname} - ${formatTime(appointment.appointment_start_hour)}`}
                      onClick={() => openAppointmentModal(appointment)}
                    >
                      <div className="font-medium truncate">{formatTime(appointment.appointment_start_hour)}</div>
                      <div className="truncate">{appointment.pet_name}</div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Appointment Modal
  const AppointmentDetailModal = () => {
    // Warning message for appointments that can't be completed yet.
    // Hook must run before any early return (rules-of-hooks).
    const [showTimeWarning, setShowTimeWarning] = useState(false);

    if (!appointmentModal.isOpen || !appointmentModal.appointment) return null;

    const appointment = appointmentModal.appointment;
    const appointmentStatus = appointment.appointment_status;
    const appointmentDate = new Date(appointment.appointment_date);
    const startTime = formatTime(appointment.appointment_start_hour);
    const endTime = formatTime(appointment.appointment_end_hour);

    // Debug appointment data
    console.log('Appointment modal data:', {
      id: appointment.appointment_id,
      status: appointmentStatus,
      isVideoMeeting: appointment.video_meeting,
      meetingUrl: appointment.meeting_url,
      date: appointmentDate
    });

    // Check if appointment end time has passed
    const now = new Date();
    const appointmentEndTime = new Date(appointment.appointment_end_hour);
    const appointmentHasPassed = appointmentEndTime < now;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="appointment-modal" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeAppointmentModal}></div>
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <span>Appointment Details</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full 
                      ${statusColors[appointmentStatus].bg} 
                      ${statusColors[appointmentStatus].text}`}
                    >
                      {appointmentStatus.charAt(0).toUpperCase() + appointmentStatus.slice(1)}
                    </span>
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700">Patient</h4>
                          <p className="text-gray-900 font-medium">{appointment.pet_name}</p>
                          <p className="text-gray-500 text-sm">{appointment.pet_type} - {appointment.pet_breed}</p>
                        </div>
                        <div className="text-right">
                          <h4 className="font-semibold text-sm text-gray-700">Owner</h4>
                          <p className="text-gray-900">{appointment.pet_owner_name} {appointment.pet_owner_surname}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700">Date & Time</h4>
                        <p className="text-gray-900">
                          {appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-gray-700">{startTime} - {endTime}</p>
                      </div>
                      {appointment.video_meeting && (
                        <div className="bg-indigo-50 text-indigo-700 rounded-md px-2 py-1 text-xs font-medium">
                          <svg className="inline-block w-4 h-4 mr-1 align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Video Meeting
                        </div>
                      )}
                    </div>
                    
                    {appointment.notes && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700">Notes</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{appointment.notes}</p>
                      </div>
                    )}
                    
                    {/* Show warning message when user tries to complete a future appointment */}
                    {showTimeWarning && !appointmentHasPassed && (
                      <div className="text-amber-600 text-sm py-2 px-3 bg-amber-50 rounded-md border border-amber-200">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>You cannot mark this appointment as completed because the appointment time has not passed yet.</span>
                        </div>
                      </div>
                    )}
                    
                    {actionError && (
                      <div className="text-red-600 text-sm py-2 px-3 bg-red-50 rounded-md">
                        {actionError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {/* Action buttons based on appointment status */}
              {appointmentStatus === 'pending' && (
                <>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => updateAppointmentStatus(appointment.appointment_id, 'confirmed')}
                    disabled={appointmentModal.isLoading}
                  >
                    {appointmentModal.isLoading ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => updateAppointmentStatus(appointment.appointment_id, 'canceled')}
                    disabled={appointmentModal.isLoading}
                  >
                    {appointmentModal.isLoading ? 'Canceling...' : 'Cancel Appointment'}
                  </button>
                </>
              )}
              
              {appointmentStatus === 'confirmed' && (
                <>
                  {appointment.video_meeting && (
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => {
                        console.log('Join Meeting clicked:', {
                          url: appointment.meeting_url,
                          videoMeeting: appointment.video_meeting
                        });
                        if (appointment.meeting_url) {
                          // Kullanıcının istediği şekilde protokol ekleyelim
                          const meetingUrl = appointment.meeting_url.startsWith('http') 
                            ? appointment.meeting_url 
                            : `https://${appointment.meeting_url}`;
                          window.open(meetingUrl, "_blank");
                        } else {
                          alert("Meeting URL is not available. Please contact support.");
                        }
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Online Meeting
                    </button>
                  )}
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                      appointmentHasPassed 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-300 text-white cursor-not-allowed'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm`}
                    onClick={() => {
                      if (appointmentHasPassed) {
                        updateAppointmentStatus(appointment.appointment_id, 'completed');
                      } else {
                        setShowTimeWarning(true);
                      }
                    }}
                    disabled={appointmentModal.isLoading || !appointmentHasPassed}
                  >
                    {appointmentModal.isLoading ? 'Marking as Completed...' : 'Mark as Completed'}
                  </button>
                </>
              )}
              
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={closeAppointmentModal}
                disabled={appointmentModal.isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {appointmentError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{appointmentError}</p>
            </div>
          </div>
        </div>
      )}
      
      {loadingAppointments ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
        </div>
      ) : (
        renderCalendar()
      )}
      
      {/* Render appointment modal */}
      <AppointmentDetailModal />
    </div>
  );
};

export default Calendar;
