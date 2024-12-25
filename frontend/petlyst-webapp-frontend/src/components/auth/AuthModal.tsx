import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues {
  userType: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FormValues = LoginValues | RegisterValues;

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    surname: string;
    userType: string;
  };
}

const API_BASE_URL = 'http://localhost:3000/api/users';

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const registerValidationSchema = Yup.object().shape({
  userType: Yup.string().required('User type selection is required'),
  name: Yup.string().required('Name is required'),
  surname: Yup.string().required('Surname is required'),
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
});

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (values: LoginValues) => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/login`, values);
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    try {
      // Map the userType value
      const mappedUserType = values.userType === 'veterinary' ? 'veterinarian' : 'petOwner';
      
      const registerData = {
        name: values.name,
        surname: values.surname,
        email: values.email,
        password: values.password,
        user_type: mappedUserType // Backend expects user_type
      };

      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/register`, registerData);
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm, setFieldError }: FormikHelpers<FormValues>
  ) => {
    try {
      if (isLogin) {
        await handleLogin(values as LoginValues);
      } else {
        await handleRegister(values as RegisterValues);
      }

      resetForm();
      onClose();
      // Optionally refresh the page or update the app state
      window.location.reload();
    } catch (error: any) {
      console.error('Authentication error:', error);
      setFieldError('email', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues = isLogin
    ? {
        email: '',
        password: '',
      }
    : {
        userType: '',
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
      };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              isLogin ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              !isLogin ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={isLogin ? loginValidationSchema : registerValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, touched, errors, handleBlur }) => (
            <Form className="space-y-4">
              {!isLogin && (
                <>
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Field
                          type="radio"
                          name="userType"
                          value="veterinary"
                          className="form-radio text-indigo-600"
                        />
                        <span className="text-gray-700">Veterinarian</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Field
                          type="radio"
                          name="userType"
                          value="petParent"
                          className="form-radio text-indigo-600"
                        />
                        <span className="text-gray-700">Pet Parent</span>
                      </label>
                    </div>
                  </div>
                  <ErrorMessage name="userType">
                    {msg => <div className="text-red-500 text-sm mt-1">{msg}</div>}
                  </ErrorMessage>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Field name="name">
                        {({ field }: any) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Name"
                            className={`w-full px-3 py-2 border ${
                              touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="name">
                        {msg => <div className="text-red-500 text-sm mt-1">{msg}</div>}
                      </ErrorMessage>
                    </div>
                    <div>
                      <Field name="surname">
                        {({ field }: any) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Surname"
                            className={`w-full px-3 py-2 border ${
                              touched.surname && errors.surname ? 'border-red-500' : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="surname">
                        {msg => <div className="text-red-500 text-sm mt-1">{msg}</div>}
                      </ErrorMessage>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Field name="email">
                  {({ field }: any) => (
                    <input
                      {...field}
                      type="email"
                      placeholder="Email"
                      className={`w-full px-3 py-2 border ${
                        touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                  )}
                </Field>
                <ErrorMessage name="email">
                  {msg => <div className="text-red-500 text-sm mt-1">{msg}</div>}
                </ErrorMessage>
              </div>

              <div className="relative">
                <Field name="password">
                  {({ field }: any) => (
                    <input
                      {...field}
                      type="password"
                      placeholder="Password"
                      className={`w-full px-3 py-2 border ${
                        touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      onFocus={() => !isLogin && setShowPasswordTooltip(true)}
                      onBlur={(e) => {
                        handleBlur(e);
                        setShowPasswordTooltip(false);
                      }}
                    />
                  )}
                </Field>
                <ErrorMessage name="password">
                  {msg => <div className="text-red-500 text-sm mt-1">{msg}</div>}
                </ErrorMessage>

                {!isLogin && showPasswordTooltip && (
                  <div className="absolute left-0 top-full mt-2 p-3 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                    <h4 className="font-semibold mb-2">Password Requirements:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Minimum 8 characters</li>
                      <li>At least one uppercase letter</li>
                      <li>At least one lowercase letter</li>
                      <li>At least one number</li>
                    </ul>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <Field name="confirmPassword">
                    {({ field }: any) => (
                      <input
                        {...field}
                        type="password"
                        placeholder="Confirm Password"
                        className={`w-full px-3 py-2 border ${
                          touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="confirmPassword">
                    {msg => <div className="text-red-500 text-sm mt-1">{msg}</div>}
                  </ErrorMessage>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                )}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AuthModal;
