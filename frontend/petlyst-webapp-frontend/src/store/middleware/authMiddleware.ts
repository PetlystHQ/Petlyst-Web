import { Middleware } from '@reduxjs/toolkit';
import { setCredentials, logout } from '../slices/authSlice';

export const authMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (setCredentials.match(action)) {
    localStorage.setItem('token', action.payload.token);
    localStorage.setItem('user', JSON.stringify(action.payload.user));
  } else if (logout.match(action)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return result;
}; 