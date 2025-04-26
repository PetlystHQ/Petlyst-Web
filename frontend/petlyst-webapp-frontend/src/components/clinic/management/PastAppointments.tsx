import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';

interface PastAppointment {
  appointment_id: string;
  pet_name: string;
  pet_owner_name: string;
  pet_owner_surname: string;
  pet_type?: string;
  pet_breed?: string;
  appointment_date: string;
  appointment_start_hour: string;
  appointment_end_hour: string;
  appointment_status: 'completed';
  notes?: string;
  video_meeting: boolean;
}

const PastAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<PastAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<PastAppointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  // Get clinic ID from localStorage when component mounts
  useEffect(() => {
    const storedClinicId = localStorage.getItem('selectedClinicId');
    if (storedClinicId) {
      setClinicId(storedClinicId);
    }
  }, []);

  // Fetch completed appointments
  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const fetchCompletedAppointments = async () => {
      try {
        setLoading(true);
        
        // Call the completed appointments endpoint
        const response = await axiosInstance.get(`/appointments/clinic/${clinicId}/completed`);
        
        if (response.data.success) {
          const fetchedAppointments = response.data.appointments || [];
          console.log('Fetched completed appointments:', fetchedAppointments);
          setAppointments(fetchedAppointments);
        } else {
          setError('Failed to fetch appointments');
        }
      } catch (err) {
        console.error('Error fetching completed appointments:', err);
        setError('Failed to fetch appointments. Please try again.');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedAppointments();
  }, [clinicId]);

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => {
    const searchString = searchTerm.toLowerCase();
    return (
      appointment.pet_name.toLowerCase().includes(searchString) ||
      `${appointment.pet_owner_name} ${appointment.pet_owner_surname}`.toLowerCase().includes(searchString) ||
      (appointment.pet_type && appointment.pet_type.toLowerCase().includes(searchString)) ||
      new Date(appointment.appointment_date).toLocaleDateString().includes(searchString)
    );
  });

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      case 'date_desc':
        return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
      case 'pet_name':
        return a.pet_name.localeCompare(b.pet_name);
      case 'owner_name':
        return `${a.pet_owner_name} ${a.pet_owner_surname}`.localeCompare(`${b.pet_owner_name} ${b.pet_owner_surname}`);
      default:
        return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
    }
  });

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Format time from ISO string to HH:MM
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Open appointment details modal
  const openAppointmentModal = (appointment: PastAppointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  // Close appointment details modal
  const closeAppointmentModal = () => {
    setSelectedAppointment(null);
    setIsModalOpen(false);
  };

  // Render appointment details modal
  const renderAppointmentModal = () => {
    if (!selectedAppointment) return null;
    
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
                    {formatTime(selectedAppointment.appointment_start_hour)} - {formatTime(selectedAppointment.appointment_end_hour)}
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
                      Completed
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={closeAppointmentModal}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Completed Appointments</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:min-w-[300px]">
            <input
              type="text"
              placeholder="Search appointments..."
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="pet_name">Pet Name</option>
            <option value="owner_name">Owner Name</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : sortedAppointments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-gray-800 font-medium text-lg mb-2">No completed appointments found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Completed appointments will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAppointments.map((appointment) => (
                <tr 
                  key={appointment.appointment_id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openAppointmentModal(appointment)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatDate(appointment.appointment_date)}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(appointment.appointment_start_hour)} - {formatTime(appointment.appointment_end_hour)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{appointment.pet_name}</div>
                    {appointment.pet_type && (
                      <div className="text-sm text-gray-500">{appointment.pet_type} {appointment.pet_breed ? `- ${appointment.pet_breed}` : ''}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.pet_owner_name} {appointment.pet_owner_surname}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.notes ? (
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Has notes
                      </span>
                    ) : 'No notes'}
                    {appointment.video_meeting && (
                      <span className="ml-3 inline-flex items-center text-sm text-blue-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Appointment Detail Modal */}
      {isModalOpen && renderAppointmentModal()}
    </div>
  );
};

export default PastAppointments;
