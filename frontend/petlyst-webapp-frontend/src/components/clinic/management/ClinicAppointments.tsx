import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';
import { format, parseISO } from 'date-fns';

interface AppointmentRequest {
  appointment_id: string;
  pet_owner_id: string;
  pet_owner_name: string;
  pet_owner_surname: string;
  pet_id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  appointment_date: string;
  appointment_start_hour: string;
  appointment_end_hour: string;
  appointment_status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  video_meeting: boolean;
  meeting_url?: string;
  created_at?: string;
}

interface ClinicAppointmentsProps {
  clinicId: string;
}

type AppointmentTab = 'pending' | 'confirmed' | 'completed' | 'canceled';

const ClinicAppointments: React.FC<ClinicAppointmentsProps> = ({ clinicId }) => {
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState<AppointmentRequest[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<AppointmentRequest[]>([]);
  const [canceledAppointments, setCanceledAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppointmentTab>('pending');
  const [currentTime] = useState<Date>(new Date());  // Current time for comparing appointment times

  useEffect(() => {
    fetchAppointments();
    // fetchAppointments is in-component; adding it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get pending appointments
      const pendingResponse = await axiosInstance.get(`/appointments/clinic/${clinicId}/pending`);
      
      if (pendingResponse.data.success) {
        setAppointmentRequests(pendingResponse.data.appointments || []);
      }
      
      // Get all confirmed appointments
      const confirmedResponse = await axiosInstance.get(`/appointments/clinic/${clinicId}/confirmed`);
      
      if (confirmedResponse.data.success) {
        setConfirmedAppointments(confirmedResponse.data.appointments || []);
      }
      
      // Get all completed appointments
      try {
        const completedResponse = await axiosInstance.get(`/appointments/clinic/${clinicId}/completed`);
        
        if (completedResponse.data.success) {
          setCompletedAppointments(completedResponse.data.appointments || []);
        }
      } catch (completedErr) {
        console.error('Error fetching completed appointments:', completedErr);
        setCompletedAppointments([]);
      }
      
      // Get all canceled appointments
      const canceledResponse = await axiosInstance.get(`/appointments/clinic/${clinicId}/canceled`);
      
      if (canceledResponse.data.success) {
        setCanceledAppointments(canceledResponse.data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('An error occurred while fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      const response = await axiosInstance.put(`/appointments/${appointmentId}/status`, {
        status: 'confirmed'
      });
      
      if (response.data.success) {
        // Move appointment from pending to confirmed
        const approvedAppointment = appointmentRequests.find(
          req => req.appointment_id === appointmentId
        );
        
        if (approvedAppointment) {
          const updatedAppointment = {
            ...approvedAppointment,
            appointment_status: 'confirmed' as const
          };
          
          setConfirmedAppointments(prev => [...prev, updatedAppointment]);
          setAppointmentRequests(prev => 
            prev.filter(req => req.appointment_id !== appointmentId)
          );
        }
        
        setIsModalOpen(false);
      } else {
        setError('Failed to approve appointment');
      }
    } catch (err) {
      console.error('Error approving appointment:', err);
      setError('An error occurred while approving the appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      const response = await axiosInstance.put(`/appointments/${appointmentId}/status`, {
        status: 'canceled'
      });
      
      if (response.data.success) {
        // Check if the appointment was in pending status
        const pendingAppointment = appointmentRequests.find(
          req => req.appointment_id === appointmentId
        );
        
        if (pendingAppointment) {
          // Move appointment from pending to canceled
          const updatedAppointment = {
            ...pendingAppointment,
            appointment_status: 'canceled' as const
          };
          
          setCanceledAppointments(prev => [...prev, updatedAppointment]);
          setAppointmentRequests(prev => 
            prev.filter(req => req.appointment_id !== appointmentId)
          );
        } else {
          // Check if the appointment was in confirmed status
          const confirmedAppointment = confirmedAppointments.find(
            req => req.appointment_id === appointmentId
          );
          
          if (confirmedAppointment) {
            // Move appointment from confirmed to canceled
            const updatedAppointment = {
              ...confirmedAppointment,
              appointment_status: 'canceled' as const
            };
            
            setCanceledAppointments(prev => [...prev, updatedAppointment]);
            setConfirmedAppointments(prev => 
              prev.filter(req => req.appointment_id !== appointmentId)
            );
          }
        }
        
        setIsModalOpen(false);
      } else {
        setError('Failed to reject appointment');
      }
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      setError('An error occurred while rejecting the appointment');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const response = await axiosInstance.patch(`/appointments/${appointmentId}/complete`);
      
      if (response.data) {
        // Move appointment from confirmed to completed
        const confirmedAppointment = confirmedAppointments.find(
          req => req.appointment_id === appointmentId
        );
        
        if (confirmedAppointment) {
          const updatedAppointment = {
            ...confirmedAppointment,
            appointment_status: 'completed' as const
          };
          
          setCompletedAppointments(prev => [...prev, updatedAppointment]);
          setConfirmedAppointments(prev => 
            prev.filter(req => req.appointment_id !== appointmentId)
          );
        }
        
        setIsModalOpen(false);
      } else {
        setError('Failed to complete appointment');
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError('An error occurred while completing the appointment');
    }
  };

  const openModal = (appointment: AppointmentRequest) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy');
    } catch {
      return dateString;
    }
  };

  // Saat formatı için yeni fonksiyon
  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  // Check if appointment end time has passed
  const isAppointmentPast = (endHour: string): boolean => {
    try {
      const endTime = new Date(endHour);
      return endTime < currentTime;
    } catch (error) {
      console.error('Error parsing appointment time:', error);
      return false;
    }
  };

  // Render the appointment details modal
  const renderAppointmentModal = () => {
    if (!selectedAppointment) return null;
    
    // Check if the appointment is past its end time
    const isPastAppointment = isAppointmentPast(selectedAppointment.appointment_end_hour);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-0 max-w-md w-full shadow-xl overflow-hidden">
          {/* Modal Header */}
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">Appointment Details</h3>
              <button
                onClick={closeModal}
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
                <p className="text-xs text-gray-600">
                  {selectedAppointment.pet_type} - {selectedAppointment.pet_breed}
                </p>
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
                    {formatTime(selectedAppointment.appointment_start_hour)} - {formatTime(selectedAppointment.appointment_end_hour)}
                  </span>
                </div>
              </div>
            </div>
            
            {selectedAppointment.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Notes from Pet Owner</p>
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
                    {selectedAppointment.video_meeting ? 'Requested' : 'Not Requested'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedAppointment.appointment_status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedAppointment.appointment_status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : selectedAppointment.appointment_status === 'canceled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedAppointment.appointment_status.charAt(0).toUpperCase() + selectedAppointment.appointment_status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2 border-t border-gray-200">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            
            {selectedAppointment.appointment_status === 'pending' && (
              <>
                <button
                  onClick={() => handleRejectAppointment(selectedAppointment.appointment_id)}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Reject
                </button>
                <button
                  onClick={() => handleApproveAppointment(selectedAppointment.appointment_id)}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Approve
                </button>
              </>
            )}
            
            {selectedAppointment.appointment_status === 'confirmed' && (
              <>
                {selectedAppointment.video_meeting && (
                  <button
                    onClick={() => {
                      console.log('Join Meeting clicked:', {
                        url: selectedAppointment.meeting_url,
                        videoMeeting: selectedAppointment.video_meeting
                      });
                      if (selectedAppointment.meeting_url) {
                        const meetingUrl = selectedAppointment.meeting_url.startsWith('http') 
                          ? selectedAppointment.meeting_url 
                          : `https://${selectedAppointment.meeting_url}`;
                        window.open(meetingUrl, "_blank");
                      } else {
                        alert("Meeting URL is not available. Please contact support.");
                      }
                    }}
                    className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                    title="Join Online Meeting"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                {isPastAppointment && (
                  <button
                    onClick={() => handleCompleteAppointment(selectedAppointment.appointment_id)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => handleRejectAppointment(selectedAppointment.appointment_id)}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Cancel Appointment
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    let appointments: AppointmentRequest[] = [];
    let emptyMessage = "";
    
    switch (activeTab) {
      case 'pending':
        appointments = appointmentRequests;
        emptyMessage = "No pending appointment requests";
        break;
      case 'confirmed':
        appointments = confirmedAppointments;
        emptyMessage = "No confirmed appointments";
        break;
      case 'completed':
        appointments = completedAppointments;
        emptyMessage = "No completed appointments";
        break;
      case 'canceled':
        appointments = canceledAppointments;
        emptyMessage = "No canceled appointments";
        break;
    }
    
    if (appointments.length === 0) {
      return (
        <div className="text-center py-10">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">{emptyMessage}</h3>
          <p className="text-gray-600">
            {activeTab === 'pending'
              ? "When pet owners request appointments, they will appear here"
              : activeTab === 'confirmed'
              ? "Approved appointments will appear here"
              : activeTab === 'completed'
              ? "Completed appointments will appear here"
              : "Canceled appointments will appear here"}
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Pet Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Pet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Date & Time
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => {
              // Check if the appointment is past its end time
              const isPastAppointment = 
                activeTab === 'confirmed' && 
                isAppointmentPast(appointment.appointment_end_hour);
                
              return (
                <tr 
                  key={appointment.appointment_id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.pet_owner_name} {appointment.pet_owner_surname}
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeof appointment.pet_owner_id === 'string' 
                        ? `ID: ${appointment.pet_owner_id.substring(0, 8)}...` 
                        : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.pet_name}</div>
                    <div className="text-xs text-gray-500">{appointment.pet_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(appointment.appointment_date)}</div>
                    <div className="text-xs text-gray-500">
                      {formatTime(appointment.appointment_start_hour)} - {formatTime(appointment.appointment_end_hour)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-block">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.appointment_status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : appointment.appointment_status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.appointment_status === 'canceled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.appointment_status.charAt(0).toUpperCase() + appointment.appointment_status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveAppointment(appointment.appointment_id)}
                            className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRejectAppointment(appointment.appointment_id)}
                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      {activeTab === 'confirmed' && (
                        <>
                          {appointment && appointment.video_meeting && (
                            <button
                              onClick={() => {
                                console.log('Join Meeting clicked:', {
                                  url: appointment.meeting_url,
                                  videoMeeting: appointment.video_meeting
                                });
                                if (appointment.meeting_url) {
                                  const meetingUrl = appointment.meeting_url.startsWith('http') 
                                    ? appointment.meeting_url 
                                    : `https://${appointment.meeting_url}`;
                                  window.open(meetingUrl, "_blank");
                                } else {
                                  alert("Meeting URL is not available. Please contact support.");
                                }
                              }}
                              className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                              title="Join Online Meeting"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          {isPastAppointment && (
                            <button
                              onClick={() => handleCompleteAppointment(appointment.appointment_id)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              title="Mark as Completed"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleRejectAppointment(appointment.appointment_id)}
                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="Cancel Appointment"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => openModal(appointment)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Appointment Management</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center">
              Pending
              {appointmentRequests.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs font-medium">
                  {appointmentRequests.length}
                </span>
              )}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'confirmed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center">
              Confirmed
              {confirmedAppointments.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 py-0.5 px-2 rounded-full text-xs font-medium">
                  {confirmedAppointments.length}
                </span>
              )}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('completed')}
            className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center">
              Completed
              {completedAppointments.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs font-medium">
                  {completedAppointments.length}
                </span>
              )}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('canceled')}
            className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'canceled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center">
              Canceled
              {canceledAppointments.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs font-medium">
                  {canceledAppointments.length}
                </span>
              )}
            </span>
          </button>
        </nav>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          <p>{error}</p>
          <button 
            onClick={fetchAppointments}
            className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
          >
            Try Again
          </button>
        </div>
      ) : (
        renderAppointments()
      )}
      
      {isModalOpen && renderAppointmentModal()}
    </div>
  );
};

export default ClinicAppointments;
