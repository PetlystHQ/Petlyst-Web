import React from 'react';
import { Appointment } from '../../../types/dashboard';

interface AppointmentsProps {
  appointments?: Appointment[];
  isLoading?: boolean;
}

export const Appointments: React.FC<AppointmentsProps> = ({ appointments = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Today's Appointments</h3>
          <p className="text-gray-600">No appointments for today</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Upcoming Appointments</h3>
          <p className="text-gray-600">No upcoming appointments</p>
        </div>
      </div>
    );
  }

  const todayAppointments = appointments.filter(
    appointment => new Date(appointment.date).toDateString() === new Date().toDateString()
  );

  const upcomingAppointments = appointments.filter(
    appointment => new Date(appointment.date) > new Date()
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
        {todayAppointments.length > 0 ? (
          <div className="space-y-4">
            {todayAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{appointment.patientName}</h4>
                    <p className="text-sm text-gray-600">{appointment.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    appointment.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : appointment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No appointments for today</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{appointment.patientName}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No upcoming appointments</p>
        )}
      </div>
    </div>
  );
}; 