import { useState, FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axiosInstance from '../../utils/axiosConfig';
import axios from 'axios';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const VerificationModal: FC<VerificationModalProps> = ({ isOpen, onClose, onSubmitSuccess }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    graduation_barcode: '',
    tc_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await axios.get(
          'http://localhost:3000/api/veterinarian/verification-status',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setVerificationStatus(response.data.verification_status);
      } catch (error) {
        console.error('Error fetching verification status:', error);
      }
    };

    if (isOpen) {
      checkVerificationStatus();
    }
  }, [isOpen, token]);

  // If verification is pending, show message and disable form
  if (verificationStatus === 'pending') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Verification Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 mb-4">
              <svg className="w-full h-full text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Verification In Progress</h4>
            <p className="text-gray-600">
              Your verification request is currently being reviewed. We'll notify you once the process is complete.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For TC number, only allow digits and max 11 characters
    if (name === 'tc_number') {
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!token) {
        // Check localStorage as fallback
        const storedToken = localStorage.getItem('token');
        console.log('Stored token from localStorage:', storedToken);
        
        if (!storedToken) {
          setError('Authentication token not found. Please try logging in again.');
          return;
        }
      }

      await axiosInstance.post(
        '/veterinarian/submit-verification',
        formData
      );

      setSuccess(true);
      // Reset form
      setFormData({
        graduation_barcode: '',
        tc_number: ''
      });

      // Call the onSubmitSuccess callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Verification error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to submit verification details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // If success, show success message
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Submitted Successfully!</h3>
            <div className="bg-green-50 p-4 rounded-md mb-6">
              <p className="text-sm text-green-800 mb-2">
                Your verification request has been submitted and is now under review.
              </p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Our team will review your credentials</li>
                <li>You'll receive an email notification about the decision</li>
                <li>The review process typically takes up to 24 hours</li>
                <li>You can check your verification status in the dashboard</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              This window will close automatically in a few seconds...
            </p>
            <div className="mt-5">
              <button
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Verify Your Account</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Security Information */}
          <div className="mb-8 bg-blue-50 p-6 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Why We Need This Information</h4>
            <p className="text-sm text-blue-700 mb-3">
              To ensure the highest standards of veterinary care and maintain the trust of pet owners, we need to verify your professional credentials.
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>Your graduation barcode number helps us verify your veterinary degree</li>
              <li>Your identity number is used to confirm your professional registration</li>
              <li>This information is encrypted and securely stored</li>
              <li>We comply with all data protection regulations</li>
            </ul>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graduation Certificate Barcode Number
              </label>
              <input
                type="text"
                name="graduation_barcode"
                value={formData.graduation_barcode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your graduation certificate barcode"
                required
                disabled={loading || success}
              />
              <p className="mt-1 text-xs text-gray-500">
                You can find this number on your graduation certificate from E-Devlet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identity Number (TC Kimlik No)
              </label>
              <input
                type="text"
                name="tc_number"
                value={formData.tc_number}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your TC Kimlik No"
                maxLength={11}
                pattern="[0-9]{11}"
                required
                disabled={loading || success}
              />
              <p className="mt-1 text-xs text-gray-500">
                Your 11-digit Turkish identity number
              </p>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading || success}
                className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading || success
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors duration-150 flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
              <p className="mt-2 text-xs text-center text-gray-500">
                Verification process may take up to 24 hours
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal; 