import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login with:', { email: formData.email });

            const response = await axios.post(
                'http://localhost:3000/api/users/login', 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': 'true'
                    },
                    withCredentials: true
                }
            );

            console.log('Login response:', response.data);
            
            if (!response.data.user) {
                throw new Error('No user data received');
            }

            // Double-check user type even if backend validates it
            if (response.data.user.userType !== 'admin') {
                console.log('User type mismatch:', response.data.user.userType);
                setError('Access denied. Admin privileges required.');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                return;
            }

            // Store the token and user info in localStorage
            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminUser', JSON.stringify(response.data.user));

            console.log('Login successful, redirecting to dashboard...');
            // Redirect to admin dashboard
            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error('Login Error Details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            
            setError(
                err.response?.data?.message || 
                'Login failed. Please check your credentials and try again.'
            );
            
            // Clear any existing admin data on error
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Admin Login
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Access restricted to administrators only
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Admin email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Admin password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                loading 
                                    ? 'bg-indigo-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                        >
                            {loading ? 'Signing in...' : 'Sign in to Admin Dashboard'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin; 