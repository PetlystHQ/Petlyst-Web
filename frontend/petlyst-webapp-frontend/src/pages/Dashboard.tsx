import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';

type DashboardView = 'overview' | 'appointments' | 'patients' | 'schedule' | 'settings';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [currentView, setCurrentView] = useState<DashboardView>('overview');

  const renderContent = () => {
    switch (currentView) {
      case 'appointments':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Appointments</h2>
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
          </div>
        );
      case 'patients':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Patient Records</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">No patient records found</p>
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Weekly Schedule</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">Your schedule is empty</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Name</label>
                    <input type="text" value={user?.name} readOnly className="mt-1 block w-full px-3 py-2 border rounded-md bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Email</label>
                    <input type="email" value={user?.email} readOnly className="mt-1 block w-full px-3 py-2 border rounded-md bg-gray-50" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Notification Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2">SMS notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Appointments</h2>
                <p className="text-gray-600">No appointments scheduled for today.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
                <div className="space-y-2">
                  <p className="text-gray-600">Total Patients: 0</p>
                  <p className="text-gray-600">This Week's Appointments: 0</p>
                  <p className="text-gray-600">Pending Reviews: 0</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Add Appointment
                  </button>
                  <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                    View Calendar
                  </button>
                  <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        {/* Logo */}
        <div className="p-4 border-b">
          <img 
            src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
            alt="Petlyst Logo" 
            className="h-8 w-auto mb-4"
          />
        </div>
        {/* User Info */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Dr. {user?.name}</h2>
          <p className="text-sm text-gray-600">Veterinarian</p>
        </div>
        <nav className="mt-4">
          <button
            onClick={() => setCurrentView('overview')}
            className={`w-full text-left px-4 py-2 ${currentView === 'overview' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentView('appointments')}
            className={`w-full text-left px-4 py-2 ${currentView === 'appointments' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Appointments
          </button>
          <button
            onClick={() => setCurrentView('patients')}
            className={`w-full text-left px-4 py-2 ${currentView === 'patients' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Patients
          </button>
          <button
            onClick={() => setCurrentView('schedule')}
            className={`w-full text-left px-4 py-2 ${currentView === 'schedule' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Schedule
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full text-left px-4 py-2 ${currentView === 'settings' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-end p-4">
          <Link
            to="/"
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to Petlyst
          </Link>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard; 