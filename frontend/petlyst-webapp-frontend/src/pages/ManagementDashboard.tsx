import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';

interface ClinicData {
  clinic_id: string;
  clinic_name: string;
  owner_id: string;
  // Add other clinic fields as needed
}

const ManagementDashboard: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClinicData = async () => {
      if (!token || !clinicId) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3000/api/clinics/${clinicId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const clinicData = response.data.clinic;
        
        // Check if the current user is the owner of the clinic
        if (clinicData.owner_id !== userId) {
          setUnauthorized(true);
        } else {
          setClinic(clinicData);
        }
      } catch (err: any) {
        console.error('Error fetching clinic data:', err);
        if (err.response?.status === 403) {
          setUnauthorized(true);
        } else {
          setError(err.response?.data?.message || 'Failed to fetch clinic data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, [clinicId, token, userId]);

  // Redirect to home if unauthorized
  useEffect(() => {
    if (unauthorized) {
      navigate('/');
    }
  }, [unauthorized, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {clinic?.clinic_name} Management Dashboard
          </h1>
          <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Owner Access
          </span>
        </div>
        
        <p className="text-gray-600 mb-8">
          Welcome to your clinic management dashboard. Here you can manage appointments, 
          staff, services, and other aspects of your clinic.
        </p>
        
        {/* Dashboard content will be added here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
            <h2 className="text-lg font-semibold text-indigo-800 mb-3">Appointments</h2>
            <p className="text-indigo-600 mb-4">Manage your clinic's appointments and schedule.</p>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
              Manage Appointments
            </button>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">Staff</h2>
            <p className="text-blue-600 mb-4">Manage veterinarians and staff members.</p>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Manage Staff
            </button>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800 mb-3">Services</h2>
            <p className="text-purple-600 mb-4">Update services and treatments offered by your clinic.</p>
            <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
              Manage Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
