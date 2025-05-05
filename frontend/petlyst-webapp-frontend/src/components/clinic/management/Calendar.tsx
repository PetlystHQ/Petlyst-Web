import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

const Calendar: React.FC<CalendarProps> = ({ clinicId, token }) => {
  // State for calendar
  const [appointments, setAppointments] = useState<Record<string, CalendarAppointment[]>>({});
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  
  // Filter settings
  const [showPending, setShowPending] = useState(true);
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCanceled, setShowCanceled] = useState(false);

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
      
      // Get pending appointments
      const pendingResponse = await axios.get(
        `http://localhost:3000/api/appointments/clinic/${clinicId}/pending`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Get confirmed appointments
      const confirmedResponse = await axios.get(
        `http://localhost:3000/api/appointments/clinic/${clinicId}/confirmed`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Get completed appointments
      const completedResponse = await axios.get(
        `http://localhost:3000/api/appointments/clinic/${clinicId}/completed`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Get canceled appointments
      const canceledResponse = await axios.get(
        `http://localhost:3000/api/appointments/clinic/${clinicId}/canceled`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
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
        
        // Process all the appointments and group by date
        const processAppointments = (appointments: CalendarAppointment[], status: AppointmentStatus) => {
          if (!appointments || !Array.isArray(appointments)) {
            console.warn(`No appointments found for status: ${status}`);
            return;
          }
          
          appointments.forEach(appointment => {
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
        
        setAppointments(appointmentsByDate);
      } else {
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
                      className={`text-xs p-1 rounded truncate ${statusColors[appointment.appointment_status].bg} ${statusColors[appointment.appointment_status].text} ${statusColors[appointment.appointment_status].border} border`}
                      title={`${appointment.pet_name} - ${appointment.pet_owner_name} ${appointment.pet_owner_surname} - ${formatTime(appointment.appointment_start_hour)}`}
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
    </div>
  );
};

export default Calendar;
