import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface VerificationRequest {
    veterinarian_id: string;
    veterinarian_tc_number: string;
    veterinarian_graduate_barcode: string;
    veterinarian_verification_status: string;
    name: string;  // This comes from user_name
    surname: string;  // This comes from user_surname
}

interface PendingClinic {
    id: string;
    name: string;
    address: string;
    phone_number: string;
    description: string;
    verification_status: string;
    operator_name: string;  // This comes from user_name
    operator_surname: string;  // This comes from user_surname
    tax_identification_number: string;  // Added field
    veterinary_license_number: string;  // Added field
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
    const [pendingClinics, setPendingClinics] = useState<PendingClinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminToken = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchPendingRequests();
        fetchPendingClinics();
    }, [adminToken]);

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
            
            // Map the clinic data from new column names to the ones expected by the component
            const mappedClinics = response.data.pendingClinics.map((clinic: any) => ({
                id: clinic.clinic_id,
                name: clinic.clinic_name,
                address: clinic.clinic_address,
                phone_number: clinic.clinic_phone,
                description: clinic.clinic_description,
                verification_status: clinic.clinic_verification_status,
                operator_name: clinic.operator_name,
                operator_surname: clinic.operator_surname,
                tax_identification_number: clinic.tax_identification_number || clinic.clinic_tax_id,
                veterinary_license_number: clinic.veterinary_license_number || clinic.clinic_license_number
            }));
            
            setPendingClinics(mappedClinics);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch pending clinics');
            console.error('Error fetching pending clinics:', err);
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

    const handleClinicStatus = async (clinicId: string, action: 'approve' | 'reject') => {
        setActionLoading(clinicId);
        try {
            await axios.put(
                `http://localhost:3000/api/admin/update-clinic-status/${clinicId}`,
                { action },
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            
            // Refresh the list after successful update
            await fetchPendingClinics();
            
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update clinic status');
            console.error('Error updating clinic status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
    };

    const toggleMobileMenu = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('Admin dashboard toggle called directly, current state:', mobileMenuOpen);
        setMobileMenuOpen(prevState => {
            const newState = !prevState;
            console.log('New mobile menu state in admin dashboard:', newState);
            return newState;
        });
    };

    useEffect(() => {
        console.log('Mobile menu state changed in admin dashboard:', mobileMenuOpen);
        
        if (mobileMenuOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [mobileMenuOpen]);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button 
                                onClick={toggleMobileMenu}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="button"
                                aria-label="Toggle mobile menu"
                                aria-expanded={mobileMenuOpen}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>
                            <h1 className="text-lg md:text-xl font-bold text-gray-800 ml-2 md:ml-0">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <span className="text-sm md:text-base text-gray-600 hidden sm:inline-block">Welcome, {adminUser.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition duration-150 ease-in-out"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div 
                className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
                    mobileMenuOpen ? 'bg-opacity-50 pointer-events-auto' : 'bg-opacity-0 pointer-events-none'
                } md:hidden`}
                onClick={toggleMobileMenu}
                aria-hidden={!mobileMenuOpen}
            >
                <div 
                    className={`fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl p-4 transform transition-transform duration-300 ease-in-out ${
                        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Admin Menu</h2>
                        <button 
                            onClick={toggleMobileMenu} 
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100"
                            type="button"
                            aria-label="Close menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <div className="p-2 border-b border-gray-200">
                            <span className="text-gray-600">Welcome, {adminUser.name}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 pt-48">
                <div className="px-2 py-4 sm:px-0">
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8 sm:mb-10 mt-10 sm:mt-12">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Pending Verification Requests</h2>
                        
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="w-8 h-8 relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                                </div>
                            </div>
                        ) : (
                            error && (
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
                            )
                        )}

                        {!loading && !error && pendingRequests.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No pending verification requests found.
                            </div>
                        )}

                        {!loading && !error && pendingRequests.length > 0 && (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                {/* Desktop View - Table */}
                                <div className="hidden sm:block">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC Number</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Barcode</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pendingRequests.map((request) => (
                                                <tr key={request.veterinarian_id}>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {request.name} {request.surname}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{request.veterinarian_tc_number}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{request.veterinarian_graduate_barcode}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus(request.veterinarian_id, 'approve')}
                                                                disabled={actionLoading === request.veterinarian_id}
                                                                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 ${
                                                                    actionLoading === request.veterinarian_id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                                                                } rounded-md text-xs sm:text-sm font-medium transition-colors duration-150`}
                                                            >
                                                                {actionLoading === request.veterinarian_id ? (
                                                                    <div className="flex items-center">
                                                                        <div className="w-4 h-4 relative mr-2">
                                                                            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                                                                            <div className="absolute inset-0 rounded-full border-2 border-t-green-700 animate-spin"></div>
                                                                        </div>
                                                                        Approving...
                                                                    </div>
                                                                ) : (
                                                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(request.veterinarian_id, 'reject')}
                                                                disabled={actionLoading === request.veterinarian_id}
                                                                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 ${
                                                                    actionLoading === request.veterinarian_id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                                                                } rounded-md text-xs sm:text-sm font-medium transition-colors duration-150`}
                                                            >
                                                                {actionLoading === request.veterinarian_id ? (
                                                                    <div className="flex items-center">
                                                                        <div className="w-4 h-4 relative mr-2">
                                                                            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                                                                            <div className="absolute inset-0 rounded-full border-2 border-t-red-700 animate-spin"></div>
                                                                        </div>
                                                                        Rejecting...
                                                                    </div>
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

                                {/* Mobile View - Cards */}
                                <div className="sm:hidden space-y-4 px-4">
                                    {pendingRequests.map((request) => (
                                        <div key={request.veterinarian_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="mb-3">
                                                <h3 className="text-lg font-medium text-gray-900">{request.name} {request.surname}</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                                <div>
                                                    <span className="font-medium text-gray-500">TC Number:</span>
                                                    <p className="text-gray-900">{request.veterinarian_tc_number}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-500">Graduation Barcode:</span>
                                                    <p className="text-gray-900">{request.veterinarian_graduate_barcode}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between mt-2 gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(request.veterinarian_id, 'approve')}
                                                    disabled={actionLoading === request.veterinarian_id}
                                                    className={`flex-1 py-2 px-3 rounded text-center text-sm ${
                                                        actionLoading === request.veterinarian_id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}
                                                >
                                                    {actionLoading === request.veterinarian_id ? 'Processing...' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(request.veterinarian_id, 'reject')}
                                                    disabled={actionLoading === request.veterinarian_id}
                                                    className={`flex-1 py-2 px-3 rounded text-center text-sm ${
                                                        actionLoading === request.veterinarian_id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {actionLoading === request.veterinarian_id ? 'Processing...' : 'Reject'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-12 sm:mt-16">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Pending Clinic Approvals</h2>
                        
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

                        {!loading && !error && pendingClinics.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No pending clinic approvals found.
                            </div>
                        )}

                        {!loading && !error && pendingClinics.length > 0 && (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                {/* Desktop View - Table */}
                                <div className="hidden sm:block">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic Name</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax ID Number</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinary License Number</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pendingClinics.map((clinic) => (
                                                <tr key={clinic.id}>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {clinic.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{clinic.tax_identification_number || 'Not specified'}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{clinic.veterinary_license_number || 'Not specified'}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleClinicStatus(clinic.id, 'approve')}
                                                                disabled={actionLoading === clinic.id}
                                                                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 ${
                                                                    actionLoading === clinic.id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                                                                } rounded-md text-xs sm:text-sm font-medium transition-colors duration-150`}
                                                            >
                                                                {actionLoading === clinic.id ? (
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
                                                                disabled={actionLoading === clinic.id}
                                                                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 ${
                                                                    actionLoading === clinic.id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                                                                } rounded-md text-xs sm:text-sm font-medium transition-colors duration-150`}
                                                            >
                                                                {actionLoading === clinic.id ? (
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

                                {/* Mobile View - Cards */}
                                <div className="sm:hidden space-y-4 px-4">
                                    {pendingClinics.map((clinic) => (
                                        <div key={clinic.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="mb-3">
                                                <h3 className="text-lg font-medium text-gray-900">{clinic.name}</h3>
                                                <p className="text-sm text-gray-500">Operator: {clinic.operator_name} {clinic.operator_surname}</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                                                <div>
                                                    <span className="font-medium text-gray-500">Tax ID Number:</span>
                                                    <p className="text-gray-900">{clinic.tax_identification_number || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-500">Veterinary License Number:</span>
                                                    <p className="text-gray-900">{clinic.veterinary_license_number || 'Not specified'}</p>
                                                </div>
                                                {clinic.description && (
                                                    <div>
                                                        <span className="font-medium text-gray-500">Description:</span>
                                                        <p className="text-gray-900">{clinic.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between mt-2 gap-2">
                                                <button
                                                    onClick={() => handleClinicStatus(clinic.id, 'approve')}
                                                    disabled={actionLoading === clinic.id}
                                                    className={`flex-1 py-2 px-3 rounded text-center text-sm ${
                                                        actionLoading === clinic.id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}
                                                >
                                                    {actionLoading === clinic.id ? 'Processing...' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleClinicStatus(clinic.id, 'reject')}
                                                    disabled={actionLoading === clinic.id}
                                                    className={`flex-1 py-2 px-3 rounded text-center text-sm ${
                                                        actionLoading === clinic.id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {actionLoading === clinic.id ? 'Processing...' : 'Reject'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 