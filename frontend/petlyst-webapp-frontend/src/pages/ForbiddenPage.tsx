import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-700">403</h1>
        <div className="w-full flex items-center justify-center my-4">
          <div className="h-1 w-16 bg-yellow-500 mx-1"></div>
          <p className="text-lg font-medium text-yellow-500 uppercase">Access Denied</p>
          <div className="h-1 w-16 bg-yellow-500 mx-1"></div>
        </div>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-500 text-white rounded-md shadow hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
          <Link 
            to="/"
            className="px-6 py-3 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 transition-colors"
          >
            Go to Home
          </Link>
          <Link
            to="/contact-us"
            className="px-6 py-3 border border-yellow-500 text-yellow-500 rounded-md shadow hover:bg-yellow-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage; 