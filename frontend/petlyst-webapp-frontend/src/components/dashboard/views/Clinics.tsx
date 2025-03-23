import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../store';
import axios from 'axios';
import { Clinic } from '../../../types/dashboard';

interface ClinicsProps {
  isLoading?: boolean;
  onAddClinic?: () => void;
  onEditClinic?: (clinic: Clinic) => void;
  refreshKey?: number;
}

export const Clinics: React.FC<ClinicsProps> = ({
  isLoading: propIsLoading,
  onEditClinic,
  refreshKey
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const navigate = useNavigate();

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
        console.log('API Response:', response.data);
        console.log('Clinics details:', response.data.clinics.map((clinic: Clinic) => ({
          id: clinic.clinic_id,
          name: clinic.clinic_name,
          status: clinic.clinic_verification_status
        })));
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

  const handleDeleteClinic = async (clinicId: string) => {
    setActionLoading(clinicId);
    try {
      await axios.delete(`http://localhost:3000/api/clinics/${clinicId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchClinics(); // Refresh the list after deleting
    } catch (err: any) {
      console.error('Error deleting clinic:', err);
      setError(err.response?.data?.message || 'Failed to Delete Clinic Submission');
    } finally {
      setActionLoading(null);
    }
  };

  // Show delete confirmation popup
  const showDeleteConfirmation = (clinicId: string) => {
    setDeleteConfirmationId(clinicId);
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setDeleteConfirmationId(null);
  };

  // Confirm and execute delete operation
  const confirmDelete = () => {
    if (deleteConfirmationId) {
      handleDeleteClinic(deleteConfirmationId);
      setDeleteConfirmationId(null);
    }
  };

  const handleAddClinicClick = () => {
    navigate('/add-clinic');
  };

  useEffect(() => {
    if (token) {
      fetchClinics();
    }
  }, [token, refreshKey]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Active
          </span>
        );
      case 'archived':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            Archive
          </span>
        );
      case 'not_verified':
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending Admin Approval
          </span>
        );
    }
  };

  if (propIsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
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
    <div className="w-full">
      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-modal-slide-in border border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border border-red-100 mb-5">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Clinic Submission</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                Are you sure you want to delete this clinic submission? This action cannot be undone.
              </p>
            </div>
            <div className="flex w-full gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm hover:shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {clinics.length === 0 ? (
      <div 
          onClick={handleAddClinicClick}
          className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group h-[320px] w-full"
      >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600">Add New Clinic</h3>
          <p className="text-base text-gray-500 text-center group-hover:text-blue-600 max-w-md">
            Add a clinic to your practice to start managing your clinic
          </p>
        </div>
      ) : (
        clinics.map(clinic => (
          <div 
            key={clinic.clinic_id}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-8 flex flex-col h-auto w-full"
          >
            <div className="flex flex-col space-y-6 mb-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{clinic.clinic_name}</h2>
                {getStatusBadge(clinic.clinic_verification_status)}
      </div>

              {/* Status Information Banner */}
              {clinic.clinic_verification_status === 'pending' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Clinic Registration Pending</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Your clinic registration is pending verification. Please note:</p>
                        <ul className="list-disc list-inside mt-1.5 space-y-1">
                          <li>Unverified clinics will be automatically removed after 72 hours</li>
                          <li>Make sure all required information is complete and accurate</li>
                          <li>You can edit your clinic details while waiting for verification</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {clinic.clinic_verification_status === 'verified' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Clinic Verified</h3>
                      <div className="mt-2 text-sm text-green-700">
                        Your clinic has been verified and is fully operational. You can now manage appointments and access all features.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {clinic.clinic_verification_status === 'not_verified' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Your clinic verification was not successful. Please:</p>
                        <ul className="list-disc list-inside mt-1.5 space-y-1">
                          <li>Review and update your clinic information</li>
                          <li>Ensure all required documents are provided</li>
                          <li>Contact support if you need assistance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {clinic.clinic_verification_status === 'archived' && (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-800">Clinic Archived</h3>
                      <div className="mt-2 text-sm text-gray-700">
                        This clinic is currently archived. You can restore it at any time to resume operations.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
            {/* View Submission Button */}
            <button
              onClick={() => navigate(`/clinic-preview/${clinic.clinic_id}`)}
              className="flex-1 flex items-center justify-center text-base font-medium px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Submission
            </button>
            
            {/* Edit Clinic Button */}
            <button
              onClick={() => navigate(`/edit-clinic/${clinic.clinic_id}`)}
              className="flex-1 flex items-center justify-center text-base font-medium px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Clinic
            </button>
            
              {clinic.clinic_verification_status === 'verified' && (
              <button
                  onClick={() => handleArchiveClinic(clinic.clinic_id)}
                  disabled={actionLoading === clinic.clinic_id}
                  className={`flex-1 flex items-center justify-center text-base font-medium px-4 py-3 rounded-lg transition-colors ${
                    actionLoading === clinic.clinic_id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                }`}
              >
                  {actionLoading === clinic.clinic_id ? 'Archiving...' : 'Archive Clinic'}
              </button>
            )}
              {clinic.clinic_verification_status === 'archived' && (
            <button
                  onClick={() => handleRestoreClinic(clinic.clinic_id)}
                  disabled={actionLoading === clinic.clinic_id}
                  className={`flex-1 flex items-center justify-center text-base font-medium px-4 py-3 rounded-lg transition-colors ${
                    actionLoading === clinic.clinic_id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                  {actionLoading === clinic.clinic_id ? 'Restoring...' : 'Restore Clinic'}
                </button>
              )}
              {clinic.clinic_verification_status === 'pending' && (
                <button
                  onClick={() => showDeleteConfirmation(clinic.clinic_id)}
                  disabled={actionLoading === clinic.clinic_id}
                  className={`flex-1 flex items-center justify-center text-base font-medium px-4 py-3 rounded-lg transition-colors ${
                    actionLoading === clinic.clinic_id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <svg 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                  >
                    <path 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                  Delete Submission
                </button>
              )}
            </div>
        </div>
        ))
      )}
    </div>
  );
}; 