import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;  // Maps to user_id
  name: string;  // Maps to user_name
  surname: string;  // Maps to user_surname
  email: string;  // Maps to user_email
  user_type: string;
  phone?: string;  // Maps to user_phone
  address?: string;  // Maps to user_address
  profile_photo?: string;  // Maps to user_profile_photo
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  profileVisibility: boolean | null;
}

// Get stored values
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
  profileVisibility: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Store in localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      
      // Debug log
      console.log('setCredentials - Token:', action.payload.token);
      console.log('setCredentials - User:', action.payload.user);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Debug log
      console.log('logout - Clearing credentials');
    },
    setProfileVisibility: (state, action: PayloadAction<boolean>) => {
      state.profileVisibility = action.payload;
    },
  },
});

export const { setCredentials, logout, setProfileVisibility } = authSlice.actions;
export default authSlice.reducer; 