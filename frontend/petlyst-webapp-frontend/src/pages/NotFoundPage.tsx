import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-700">404</h1>
        <div className="w-full flex items-center justify-center my-4">
          <div className="h-1 w-16 bg-blue-500 mx-1"></div>
          <p className="text-lg font-medium text-blue-500 uppercase">Page Not Found</p>
          <div className="h-1 w-16 bg-blue-500 mx-1"></div>
        </div>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/"
            className="px-6 py-3 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </Link>
          <Link
            to="/contact-us"
            className="px-6 py-3 border border-blue-500 text-blue-500 rounded-md shadow hover:bg-blue-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 