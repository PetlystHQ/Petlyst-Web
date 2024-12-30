import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface VerificationRequest {
    user_id: string;
    tc_number: string;
    graduation_barcode: string;
    name: string;
    surname: string;
}

interface PendingClinic {
    id: string;
    name: string;
    address: string | null;
    phone_number: string | null;
    description: string | null;
    verification_status: 'pending' | 'verified' | 'not_verified' | 'archived';
    operator_name: string;
    operator_surname: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
    const [pendingClinics, setPendingClinics] = useState<PendingClinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [clinicsLoading, setClinicsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [clinicsError, setClinicsError] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [clinicActionLoading, setClinicActionLoading] = useState<string | null>(null);
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminToken = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchPendingRequests();
        fetchPendingClinics();
    }, [adminToken]);

    const fetchPendingClinics = async () => {
        try {
            const response = await axios.get(
                'http://localhost:3000/api/admin/pending-clinics',
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            setPendingClinics(response.data.pendingClinics);
        } catch (err: any) {
            setClinicsError(err.response?.data?.message || 'Failed to fetch pending clinics');
            console.error('Error fetching pending clinics:', err);
        } finally {
            setClinicsLoading(false);
        }
    };

    const handleClinicStatus = async (clinicId: string, action: 'approve' | 'reject') => {
        setClinicActionLoading(clinicId);
        try {
            const response = await axios.put(
                `http://localhost:3000/api/admin/update-clinic-status/${clinicId}`,
                { action },
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            
            // Update the pending clinics list with the new data from the response
            setPendingClinics(response.data.pendingClinics);
            
        } catch (err: any) {
            setClinicsError(err.response?.data?.message || 'Failed to update clinic status');
            console.error('Error updating clinic status:', err);
        } finally {
            setClinicActionLoading(null);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get(
                'http://localhost:3000/api/admin/pending-review-status',
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            setPendingRequests(response.data.pendingVerifications);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch pending requests');
            console.error('Error fetching pending requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, action: 'approve' | 'reject') => {
        setActionLoading(userId);
        try {
            await axios.put(
                `http://localhost:3000/api/admin/update-verification-status/${userId}`,
                { action },
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            
            // Refresh the list after successful update
            await fetchPendingRequests();
            
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update status');
            console.error('Error updating status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">Welcome, {adminUser.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Veterinarian Verification Requests</h2>
                        
                        {loading && (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
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
                        )}

                        {!loading && !error && pendingRequests.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No pending verification requests found.
                            </div>
                        )}

                        {!loading && !error && pendingRequests.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC Number</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Barcode</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingRequests.map((request) => (
                                            <tr key={request.user_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {request.name} {request.surname}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{request.tc_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{request.graduation_barcode}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(request.user_id, 'approve')}
                                                            disabled={actionLoading === request.user_id}
                                                            className={`inline-flex items-center px-3 py-1.5 ${
                                                                actionLoading === request.user_id
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                                                            } rounded-md text-sm font-medium transition-colors duration-150`}
                                                        >
                                                            {actionLoading === request.user_id ? (
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(request.user_id, 'reject')}
                                                            disabled={actionLoading === request.user_id}
                                                            className={`inline-flex items-center px-3 py-1.5 ${
                                                                actionLoading === request.user_id
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                                                            } rounded-md text-sm font-medium transition-colors duration-150`}
                                                        >
                                                            {actionLoading === request.user_id ? (
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            )}
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Clinic Verification Requests</h2>
                        
                        {clinicsLoading && (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {clinicsError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{clinicsError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!clinicsLoading && !clinicsError && pendingClinics.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No pending clinic verification requests found.
                            </div>
                        )}

                        {!clinicsLoading && !clinicsError && pendingClinics.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingClinics.map((clinic) => (
                                            <tr key={clinic.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {clinic.operator_name} {clinic.operator_surname}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{clinic.phone_number || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleClinicStatus(clinic.id, 'approve')}
                                                            disabled={clinicActionLoading === clinic.id}
                                                            className={`inline-flex items-center px-3 py-1.5 ${
                                                                clinicActionLoading === clinic.id
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                                                            } rounded-md text-sm font-medium transition-colors duration-150`}
                                                        >
                                                            {clinicActionLoading === clinic.id ? (
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleClinicStatus(clinic.id, 'reject')}
                                                            disabled={clinicActionLoading === clinic.id}
                                                            className={`inline-flex items-center px-3 py-1.5 ${
                                                                clinicActionLoading === clinic.id
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                                                            } rounded-md text-sm font-medium transition-colors duration-150`}
                                                        >
                                                            {clinicActionLoading === clinic.id ? (
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            )}
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 