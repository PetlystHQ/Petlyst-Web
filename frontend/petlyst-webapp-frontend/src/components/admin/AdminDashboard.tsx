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

interface PendingReview {
    clinic_review_id: string;
    clinic_id: string;
    clinic_name: string;
    pet_id: string;
    pet_name: string;
    pet_owner_name: string;
    appointment_id: string;
    clinic_review_hygiene_rating: number;
    clinic_review_stuff_behaviour_rating: number;
    clinic_review_price_rating: number;
    comments: string;
    clinic_review_date: string;
    approval_status: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
    const [pendingClinics, setPendingClinics] = useState<PendingClinic[]>([]);
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewError, setReviewError] = useState<string>('');
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminToken = localStorage.getItem('adminToken');
    
    // Handle inconsistency in field naming
    const adminName = adminUser.name || adminUser.user_name || 'Admin';

    useEffect(() => {
        console.log('Admin dashboard mounted with user:', adminUser);
        fetchPendingRequests();
        fetchPendingClinics();
        fetchPendingReviews();
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

    const fetchPendingReviews = async () => {
        try {
            setReviewsLoading(true);
            const response = await axios.get(
                'http://localhost:3000/api/reviews/admin/pending',
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            setPendingReviews(response.data.reviews || []);
        } catch (err: any) {
            setReviewError(err.response?.data?.message || 'Failed to fetch pending reviews');
            console.error('Error fetching pending reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, action: 'approve') => {
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

    const handleClinicStatus = async (clinicId: string, action: 'approve') => {
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

    const handleReviewAction = async (reviewId: string, action: 'approve' | 'delete') => {
        setActionLoading(reviewId);
        try {
            let endpoint;
            let method;
            
            switch (action) {
                case 'approve':
                    endpoint = `http://localhost:3000/api/reviews/admin/${reviewId}/approve`;
                    method = 'put';
                    break;
                case 'delete':
                    endpoint = `http://localhost:3000/api/reviews/admin/${reviewId}`;
                    method = 'delete';
                    break;
            }
            
            if (method === 'put') {
                await axios.put(endpoint, {}, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });
            } else if (method === 'delete') {
                await axios.delete(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });
            }
            
            // Refresh the list after successful update
            await fetchPendingReviews();
            
        } catch (err: any) {
            setReviewError(err.response?.data?.message || `Failed to ${action} review`);
            console.error(`Error ${action} review:`, err);
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

    // Helper function to calculate average rating
    const calculateAverageRating = (review: PendingReview) => {
        const sum =
            review.clinic_review_hygiene_rating +
            review.clinic_review_stuff_behaviour_rating +
            review.clinic_review_price_rating;
        return (sum / 3).toFixed(1);
    };

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Add this component to render star ratings
    const StarRating = ({ rating }: { rating: number }) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg 
                        key={i}
                        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="ml-1 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
            </div>
        );
    };

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
                            <span className="text-sm md:text-base text-gray-600 hidden sm:inline-block">Welcome, {adminName}</span>
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
                            <span className="text-gray-600">Welcome, {adminName}</span>
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
                                                                onClick={() => navigate(`/clinic-preview/${clinic.id}`)}
                                                                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150"
                                                            >
                                                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                View Details
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
                                            </div>
                                            <button
                                                onClick={() => navigate(`/clinic-preview/${clinic.id}`)}
                                                className="w-full mt-2 py-2 px-3 rounded text-center text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-12 sm:mt-16">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Pending Reviews</h2>
                        
                        {reviewsLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : reviewError ? (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{reviewError}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!reviewsLoading && !reviewError && pendingReviews.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No pending reviews found.
                            </div>
                        )}

                        {!reviewsLoading && !reviewError && pendingReviews.length > 0 && (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                {/* Desktop View - Table */}
                                <div className="hidden sm:block">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet Owner</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratings</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pendingReviews.map((review) => (
                                                <tr key={review.clinic_review_id}>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {review.clinic_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Pet: {review.pet_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{review.pet_owner_name}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="mb-1">
                                                            <span className="text-xs text-gray-500 mr-2">Overall:</span>
                                                            <span className="font-medium">{calculateAverageRating(review)}</span>
                                                        </div>
                                                        <div className="flex flex-col space-y-1">
                                                            <div className="flex items-center">
                                                                <span className="text-xs text-gray-500 w-14">Hygiene:</span>
                                                                <StarRating rating={review.clinic_review_hygiene_rating} />
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-xs text-gray-500 w-14">Staff:</span>
                                                                <StarRating rating={review.clinic_review_stuff_behaviour_rating} />
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-xs text-gray-500 w-14">Price:</span>
                                                                <StarRating rating={review.clinic_review_price_rating} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{formatDate(review.clinic_review_date)}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleReviewAction(review.clinic_review_id, 'approve')}
                                                                disabled={actionLoading === review.clinic_review_id}
                                                                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 ${
                                                                    actionLoading === review.clinic_review_id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                                                                } rounded-md text-xs sm:text-sm font-medium transition-colors duration-150`}
                                                            >
                                                                {actionLoading === review.clinic_review_id ? (
                                                                    <div className="flex items-center">
                                                                        <div className="w-4 h-4 relative mr-2">
                                                                            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                                                                            <div className="absolute inset-0 rounded-full border-2 border-t-green-700 animate-spin"></div>
                                                                        </div>
                                                                        Processing...
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Approve
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReviewAction(review.clinic_review_id, 'delete')}
                                                                disabled={actionLoading === review.clinic_review_id}
                                                                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 ${
                                                                    actionLoading === review.clinic_review_id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                                } rounded-md text-xs sm:text-sm font-medium transition-colors duration-150`}
                                                            >
                                                                {actionLoading === review.clinic_review_id ? (
                                                                    <div className="flex items-center">
                                                                        <div className="w-4 h-4 relative mr-2">
                                                                            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                                                                            <div className="absolute inset-0 rounded-full border-2 border-t-gray-700 animate-spin"></div>
                                                                        </div>
                                                                        Processing...
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete
                                                                    </>
                                                                )}
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
                                    {pendingReviews.map((review) => (
                                        <div key={review.clinic_review_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="mb-3">
                                                <h3 className="text-lg font-medium text-gray-900">{review.clinic_name}</h3>
                                                <p className="text-sm text-gray-600">Pet: {review.pet_name}</p>
                                                <p className="text-sm text-gray-600">Owner: {review.pet_owner_name}</p>
                                                <p className="text-sm text-gray-600">Date: {formatDate(review.clinic_review_date)}</p>
                                            </div>
                                            
                                            <div className="mb-3 bg-gray-50 p-3 rounded-md">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">Ratings</span>
                                                    <div className="flex items-center">
                                                        <span className="text-yellow-500 mr-1">★</span>
                                                        <span className="font-bold">{calculateAverageRating(review)}</span>
                                                        <span className="text-xs text-gray-500 ml-1">overall</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Hygiene</p>
                                                        <StarRating rating={review.clinic_review_hygiene_rating} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Staff</p>
                                                        <StarRating rating={review.clinic_review_stuff_behaviour_rating} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Price</p>
                                                        <StarRating rating={review.clinic_review_price_rating} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {review.comments && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Comment:</p>
                                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">"{review.comments}"</p>
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col space-y-2 mt-3">
                                                <button
                                                    onClick={() => handleReviewAction(review.clinic_review_id, 'approve')}
                                                    disabled={actionLoading === review.clinic_review_id}
                                                    className={`py-2 px-3 rounded text-center text-sm flex items-center justify-center ${
                                                        actionLoading === review.clinic_review_id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}
                                                >
                                                    {actionLoading === review.clinic_review_id ? 'Processing...' : (
                                                        <>
                                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReviewAction(review.clinic_review_id, 'delete')}
                                                    disabled={actionLoading === review.clinic_review_id}
                                                    className={`py-2 px-3 rounded text-center text-sm flex items-center justify-center ${
                                                        actionLoading === review.clinic_review_id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {actionLoading === review.clinic_review_id ? 'Processing...' : (
                                                        <>
                                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete Review
                                                        </>
                                                    )}
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