import axios from 'axios';
import { store } from '../store';
import { API_URL } from '../config/api';

const axiosInstance = axios.create({
    baseURL: `${API_URL}/api`
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from localStorage first, then from Redux store as fallback
        const token = localStorage.getItem('token') || store.getState().auth.token;
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Debug log for token
        console.log('Request interceptor - Token:', token);
        console.log('Request interceptor - Headers:', config.headers);
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Debug log for error
        console.error('Response interceptor - Error:', error.response || error);
        
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 