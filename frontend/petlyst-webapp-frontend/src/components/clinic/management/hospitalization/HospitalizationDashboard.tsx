import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import RoomManagement from './RoomManagement';
import PatientHospitalization from './PatientHospitalization';
import RoomHistory from './RoomHistory';
import { API_URL } from '../../../../config/api';
import { getApiErrorMessage } from '../../../../utils/errorMessage';

interface HospitalizationStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  currentHospitalizations: number;
}

const HospitalizationDashboard: React.FC<{ clinicId: string }> = ({ clinicId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'patients' | 'history'>('overview');
  const [stats, setStats] = useState<HospitalizationStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    currentHospitalizations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const token = useSelector((state: RootState) => state.auth.token);

  // Sekme değiştiğinde veya ilk yüklemede verileri çek
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchHospitalizationStats();
    }
  }, [activeTab, clinicId, token]);
  
  const fetchHospitalizationStats = async () => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch rooms for statistics
      const roomsResponse = await axios.get(
        `${API_URL}/api/clinics/${clinicId}/hospitalization/rooms`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Fetch current hospitalizations
      const hospitalizationsResponse = await axios.get(
        `${API_URL}/api/clinics/${clinicId}/hospitalization/current`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (roomsResponse.data.success && hospitalizationsResponse.data.success) {
        const rooms = roomsResponse.data.rooms;
        const hospitalizations = hospitalizationsResponse.data.hospitalizations;
        
        // Calculate statistics
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter((room: any) => room.room_status === 'occupied').length;
        const maintenanceRooms = rooms.filter((room: any) => room.room_status === 'maintenance').length;
        const availableRooms = rooms.filter((room: any) => room.room_status === 'vacant').length;
        const currentHospitalizations = hospitalizations.length;
        
        setStats({
          totalRooms,
          occupiedRooms,
          availableRooms,
          maintenanceRooms,
          currentHospitalizations
        });
      }
    } catch (err) {
      console.error('Error fetching hospitalization stats:', err);
      setError(getApiErrorMessage(err, 'Failed to fetch hospitalization statistics'));
    } finally {
      setLoading(false);
    }
  };
  
  // Diğer sekmelerden Overview'e geri dönüldüğünde verileri yenileme
  const handleTabChange = (tab: 'overview' | 'rooms' | 'patients' | 'history') => {
    setActiveTab(tab);
    if (tab === 'overview') {
      fetchHospitalizationStats();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="mt-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Hospitalization Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Total Rooms */}
                <div className="bg-white p-6 rounded-lg shadow border border-blue-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-50 mr-4">
                      <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Rooms</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.totalRooms}</p>
                    </div>
                  </div>
                </div>
                
                {/* Available Rooms */}
                <div className="bg-white p-6 rounded-lg shadow border border-green-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-50 mr-4">
                      <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Available Rooms</p>
                      <p className="text-3xl font-bold text-green-600">{stats.availableRooms}</p>
                    </div>
                  </div>
                </div>
                
                {/* Occupied Rooms */}
                <div className="bg-white p-6 rounded-lg shadow border border-orange-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-orange-50 mr-4">
                      <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Occupied Rooms</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.occupiedRooms}</p>
                    </div>
                  </div>
                </div>
                
                {/* Maintenance Rooms */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gray-50 mr-4">
                      <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Maintenance</p>
                      <p className="text-3xl font-bold text-gray-600">{stats.maintenanceRooms}</p>
                    </div>
                  </div>
                </div>
                
                {/* Current Hospitalizations */}
                <div className="bg-white p-6 rounded-lg shadow border border-purple-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-50 mr-4">
                      <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Current Patients</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.currentHospitalizations}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Access Cards */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => handleTabChange('rooms')}
                  className="bg-white p-6 rounded-lg shadow border border-blue-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-blue-50 mr-3">
                      <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Manage Rooms</h3>
                  </div>
                  <p className="text-gray-600">Add, update, or manage hospitalization rooms and their status.</p>
                </div>
                
                <div 
                  onClick={() => handleTabChange('patients')}
                  className="bg-white p-6 rounded-lg shadow border border-green-100 hover:border-green-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-green-50 mr-3">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Admit Patient</h3>
                  </div>
                  <p className="text-gray-600">Admit a new patient to hospitalization or manage current patients.</p>
                </div>
                
                <div 
                  onClick={() => handleTabChange('history')}
                  className="bg-white p-6 rounded-lg shadow border border-purple-100 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-purple-50 mr-3">
                      <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Hospitalization History</h3>
                  </div>
                  <p className="text-gray-600">View past hospitalizations, discharge records, and patient history.</p>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      case 'rooms':
        return <RoomManagement clinicId={clinicId} onDataChanged={fetchHospitalizationStats} />;
      case 'patients':
        return <PatientHospitalization clinicId={clinicId} onDataChanged={fetchHospitalizationStats} />;
      case 'history':
        return <RoomHistory clinicId={clinicId} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hospitalization Management</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Overview
          </button>
          
          <button
            onClick={() => handleTabChange('rooms')}
            className={`${
              activeTab === 'rooms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Rooms
          </button>
          
          <button
            onClick={() => handleTabChange('patients')}
            className={`${
              activeTab === 'patients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Patients
          </button>
          
          <button
            onClick={() => handleTabChange('history')}
            className={`${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </nav>
      </div>

      {/* Content */}
      {renderTabContent()}
    </div>
  );
};

export default HospitalizationDashboard; 