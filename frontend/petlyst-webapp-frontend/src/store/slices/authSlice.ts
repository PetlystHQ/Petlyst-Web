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

interface ProfileUpdatePayload {
  phone?: string;
  address?: string;
  profile_photo?: string;
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
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Debug log
    },
    setProfileVisibility: (state, action: PayloadAction<boolean>) => {
      state.profileVisibility = action.payload;
    },
    updateProfile: (state, action: PayloadAction<ProfileUpdatePayload>) => {
      if (state.user) {
        // Update user profile data
        state.user = {
          ...state.user,
          ...action.payload
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
        
      }
    },
  },
});

export const { setCredentials, logout, setProfileVisibility, updateProfile } = authSlice.actions;
export default authSlice.reducer; 