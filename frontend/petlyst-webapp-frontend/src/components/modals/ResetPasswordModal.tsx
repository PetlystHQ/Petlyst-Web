import React, { useState, useEffect } from 'react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError(null);
      setSuccess(null);
      setIsLoading(false);
      setCurrentStep(1);
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Add refs for code inputs
  const codeInputs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ];

  // Handle code input change
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]; // Only take the first character if multiple are pasted
    }

    // Update verification code
    const newCode = verificationCode.split('');
    newCode[index] = value;
    setVerificationCode(newCode.join(''));

    // Move to next input if value is entered and next input exists
    if (value !== '' && index < 3) {
      codeInputs[index + 1].current?.focus();
    }
  };

  // Handle backspace in code inputs
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && !verificationCode[index]) {
      codeInputs[index - 1].current?.focus();
    }
  };

  // Handle paste for code inputs
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      setVerificationCode(pastedData);
      pastedData.split('').forEach((char, index) => {
        if (codeInputs[index].current) {
          codeInputs[index].current!.value = char;
        }
      });
      // Focus the next empty input or the last input if all are filled
      const nextEmptyIndex = pastedData.length < 4 ? pastedData.length : 3;
      codeInputs[nextEmptyIndex].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (currentStep === 1) {
      // Validate email format
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/users/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess('Verification code has been sent to your email.');
          setTimeout(() => {
            setSuccess(null);
            setCurrentStep(2);
          }, 2000);
        } else {
          setError(data.message || 'Failed to send verification code');
        }
      } catch (err) {
        setError('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 2) {
      // Verify the code first
      if (verificationCode.length !== 4) {
        setError('Please enter the 4-digit verification code');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/users/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            code: verificationCode
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess('Code verified successfully!');
          setTimeout(() => {
            setSuccess(null);
            setCurrentStep(3);
          }, 2000);
        } else {
          setError(data.message || 'Invalid verification code');
        }
      } catch (err) {
        setError('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Step 3: Set new password
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/users/verify-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            code: verificationCode,
            newPassword
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess('Password has been reset successfully!');
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(data.message || 'Failed to reset password');
        }
      } catch (err) {
        setError('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reset all states when modal is closed
  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(null);
    setIsLoading(false);
    setCurrentStep(1);
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h2>

          {/* Stepper with animated progress bars */}
          <div className="flex justify-center items-center mb-8 relative">
            {/* First dot */}
            <div className={`w-3 h-3 rounded-full z-10 transition-colors duration-200 ${
              currentStep === 1 ? 'bg-blue-600' : currentStep > 1 ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            
            {/* First progress bar */}
            <div className="w-16 h-0.5 bg-gray-200 mx-2 relative">
              <div className={`absolute top-0 left-0 h-full transition-all duration-500 ease-in-out ${
                currentStep > 1 ? 'bg-green-500' : 'w-0'
              } ${currentStep > 1 ? 'w-full' : 'w-0'}`} />
            </div>

            {/* Middle dot */}
            <div className={`w-3 h-3 rounded-full z-10 transition-colors duration-200 ${
              currentStep === 2 ? 'bg-blue-600' : currentStep > 2 ? 'bg-green-500' : 'bg-gray-300'
            }`} />

            {/* Second progress bar */}
            <div className="w-16 h-0.5 bg-gray-200 mx-2 relative">
              <div className={`absolute top-0 left-0 h-full transition-all duration-500 ease-in-out ${
                currentStep > 2 ? 'bg-green-500' : 'w-0'
              } ${currentStep > 2 ? 'w-full' : 'w-0'}`} />
            </div>

            {/* Last dot */}
            <div className={`w-3 h-3 rounded-full z-10 transition-colors duration-200 ${
              currentStep === 3 ? 'bg-blue-600' : currentStep > 3 ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentStep === 1 ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            ) : currentStep === 2 ? (
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  We've sent a 4-digit code to your email
                </p>
                <div className="flex justify-center gap-3 mx-auto max-w-xs">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={codeInputs[index]}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={verificationCode[index] || ''}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-16 h-16 text-center text-3xl font-bold border-2 border-gray-300 rounded-xl 
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none 
                        transition-all duration-200 shadow-sm
                        hover:border-blue-400"
                      required
                    />
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-6 flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Code expires in 15 minutes
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <label htmlFor="newPassword" className="flex items-center text-sm font-medium text-gray-700 group">
                    New Password
                    <div className="ml-1 group relative">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 top-6 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded p-2 w-52">
                          Password must contain:
                          <ul className="mt-1 space-y-1">
                            <li className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              At least 8 characters
                            </li>
                            <li className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              One uppercase letter
                            </li>
                            <li className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              One lowercase letter
                            </li>
                            <li className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              One number
                            </li>
                          </ul>
                        </div>
                        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 -top-1"></div>
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Login
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : currentStep === 1 ? (
                  'Send Code'
                ) : currentStep === 2 ? (
                  'Verify Code'
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal; 