import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import { Clinic } from '../../../types/dashboard';

interface ClinicsProps {
  isLoading?: boolean;
  onAddClinic?: () => void;
  onEditClinic?: (clinic: Clinic) => void;
  onViewClinicDetails?: (clinic: Clinic) => void;
  refreshKey?: number;
}

export const Clinics: React.FC<ClinicsProps> = ({
  isLoading: propIsLoading,
  onAddClinic,
  onEditClinic,
  onViewClinicDetails,
  refreshKey
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchClinics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/api/clinics/my-clinics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data.clinics)) {
        console.log('Fetched clinics:', response.data.clinics);
        setClinics(response.data.clinics);
      } else {
        console.error('Invalid API response:', response.data);
        setError('Invalid data received from server');
      }
    } catch (err: any) {
      console.error('Error fetching clinics:', err);
      setError(err.response?.data?.message || 'Failed to fetch clinics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveClinic = async (clinicId: string) => {
    setActionLoading(clinicId);
    try {
      await axios.patch(`http://localhost:3000/api/clinics/archive/${clinicId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchClinics(); // Refresh the list after archiving
    } catch (err: any) {
      console.error('Error archiving clinic:', err);
      setError(err.response?.data?.message || 'Failed to archive clinic');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreClinic = async (clinicId: string) => {
    setActionLoading(clinicId);
    try {
      await axios.patch(`http://localhost:3000/api/clinics/restore/${clinicId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchClinics(); // Refresh the list after restoring
    } catch (err: any) {
      console.error('Error restoring clinic:', err);
      setError(err.response?.data?.message || 'Failed to restore clinic');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClinics();
    }
  }, [token]);

  useEffect(() => {
    if (refreshKey !== undefined) {
      fetchClinics();
    }
  }, [refreshKey]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Active
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            Archive
          </span>
        );
      case 'not_verified':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending
          </span>
        );
    }
  };

  if (propIsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        onClick={onAddClinic}
        className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group h-[250px]"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Add New Clinic</h3>
        <p className="text-sm text-gray-500 text-center group-hover:text-blue-600">
          Add another clinic to your practice
        </p>
      </div>

      {clinics && clinics.map(clinic => (
        <div 
          key={clinic.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col justify-between h-[250px] hover:border-blue-500 hover:shadow-md transition-all duration-200"
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
              {getStatusBadge(clinic.verification_status)}
            </div>
            <p className="text-sm text-gray-600">{clinic.address || 'Address not specified'}</p>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={() => onEditClinic?.(clinic)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onViewClinicDetails?.(clinic)}
                className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                View Details
              </button>
            </div>
            {clinic.verification_status === 'verified' && (
              <button
                onClick={() => handleArchiveClinic(clinic.id)}
                disabled={actionLoading === clinic.id}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                  actionLoading === clinic.id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                }`}
              >
                {actionLoading === clinic.id ? 'Archiving...' : 'Archive Clinic'}
              </button>
            )}
            {clinic.verification_status === 'archived' && (
              <button
                onClick={() => handleRestoreClinic(clinic.id)}
                disabled={actionLoading === clinic.id}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                  actionLoading === clinic.id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {actionLoading === clinic.id ? 'Restoring...' : 'Restore Clinic'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 