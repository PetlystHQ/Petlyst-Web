import React, { useState } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';

const PetOwnerHomePage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section with Search */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Find the Perfect Care for Your Pet
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Search for veterinarians, pet services, and more to keep your furry friends happy and healthy
        </p>
        
        {/* Fancy Search Bar */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  <circle cx="10" cy="10" r="7" fill="none" strokeOpacity="0.3"></circle>
                </svg>
              </div>
              
              {/* Input field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for veterinarians, services, or pet care..."
                className="w-full pl-16 pr-20 py-6 text-lg rounded-full border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all duration-300 shadow-lg group-hover:shadow-xl"
              />
              
              {/* Animated gradient border on hover/focus */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
            </div>
            
            {/* Search button */}
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 bg-white border-2 border-blue-500 text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-md flex items-center"
            >
              <span>Search</span>
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Popular categories section */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-center mb-8">Popular Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Veterinarians</h3>
            <p className="text-gray-600">Find trusted veterinarians near you</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Pet Shops</h3>
            <p className="text-gray-600">Quality products for your pets</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Pet Services</h3>
            <p className="text-gray-600">Grooming, training and more</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetOwnerHomePage;
