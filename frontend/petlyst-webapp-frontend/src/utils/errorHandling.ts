import { NavigateFunction } from 'react-router-dom';

/**
 * Navigate to the appropriate error page based on error status
 * @param navigate - React Router's navigate function
 * @param status - HTTP status code or error status
 * @param error - Optional error object or message
 */
export const handleErrorNavigation = (
  navigate: NavigateFunction,
  status: number = 500,
  error?: any
): void => {
  console.error('Error occurred:', error);
  
  switch (status) {
    case 404:
      navigate('/404');
      break;
    case 403:
      navigate('/403');
      break;
    case 401:
      // Unauthorized - could redirect to login page
      navigate('/admin/login');
      break;
    default:
      // For 500 and other error codes
      navigate('/500');
      break;
  }
};

/**
 * Handle error responses from API calls
 * @param error - Error object from catch block
 * @param navigate - React Router's navigate function
 */
export const handleApiError = (error: any, navigate: NavigateFunction): void => {
  if (!error.response) {
    // Network error or server not responding
    handleErrorNavigation(navigate, 500, error);
    return;
  }

  const status = error.response.status;
  handleErrorNavigation(navigate, status, error);
}; 