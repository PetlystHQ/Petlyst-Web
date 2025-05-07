import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import axios from 'axios';

type AnalysisType = 'timeline' | 'threshold' | null;

// Define interfaces for API response structures
interface TimelineResponse {
  title?: string;
  code?: string;
  raw?: string;
  stockDays?: any;
  [key: string]: any; // For any other properties
}

interface ThresholdResponse {
  title?: string;
  code?: string;
  raw?: string;
  [key: string]: any; // For any other properties
}

type ResponseData = TimelineResponse | ThresholdResponse | string | null;

// Define storage keys
const STORAGE_KEY_ANALYSIS_TYPE = 'idss_analysis_type';
const STORAGE_KEY_RESPONSE_DATA = 'idss_response_data';

const iDSS: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<ResponseData>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    try {
      // Get saved analysis type
      const savedAnalysisType = localStorage.getItem(STORAGE_KEY_ANALYSIS_TYPE);
      if (savedAnalysisType === 'timeline' || savedAnalysisType === 'threshold') {
        setSelectedAnalysis(savedAnalysisType);
      }
      
      // Get saved response data
      const savedResponseData = localStorage.getItem(STORAGE_KEY_RESPONSE_DATA);
      if (savedResponseData) {
        try {
          setResponseData(JSON.parse(savedResponseData));
        } catch (e) {
          // If parsing fails, use as string
          setResponseData(savedResponseData);
        }
      }
    } catch (err) {
      console.error('Error restoring saved state:', err);
      // Clear potentially corrupted storage
      localStorage.removeItem(STORAGE_KEY_ANALYSIS_TYPE);
      localStorage.removeItem(STORAGE_KEY_RESPONSE_DATA);
    }
  }, []);
  
  const handleAnalysisSelect = async (type: AnalysisType) => {
    setSelectedAnalysis(type);
    setIsLoading(true);
    setError(null);
    setResponseData(null);
    
    // Save the selected analysis type
    if (type) {
      localStorage.setItem(STORAGE_KEY_ANALYSIS_TYPE, type);
    }
    
    try {
      // Determine which API endpoint to call based on the selected analysis
      const endpoint = type === 'timeline'
        ? 'https://llama.petlyst.com:3001/api/stock-days'
        : 'https://llama.petlyst.com:3001/api/check-reorder';
      
      // Make the API call
      const response = await axios.post(
        endpoint,
        {}, // Empty body since we're only sending the token
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store the response data
      const apiResponse = response.data || 'Analysis completed successfully, but no data was returned.';
      setResponseData(apiResponse);
      
      // Save response to localStorage
      localStorage.setItem(STORAGE_KEY_RESPONSE_DATA, JSON.stringify(apiResponse));
      
      console.log('API Response:', apiResponse);
    } catch (err: any) {
      console.error(`Error fetching ${type} analysis:`, err);
      setError(err.response?.data?.message || `Failed to get ${type} analysis. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeAnalysis = () => {
    // Clear saved state when explicitly closed
    localStorage.removeItem(STORAGE_KEY_ANALYSIS_TYPE);
    localStorage.removeItem(STORAGE_KEY_RESPONSE_DATA);
    
    setSelectedAnalysis(null);
    setResponseData(null);
  };
  
  // Function to format the response data for display
  const formatResponseData = (data: ResponseData): string => {
    if (!data) return 'No data available';
    
    // If it's already a string, return it
    if (typeof data === 'string') return data;
    
    // If it has a raw property that's a string, use that
    if (data.raw && typeof data.raw === 'string') return data.raw;
    
    // Otherwise stringify the entire object
    try {
      return JSON.stringify(data, null, 2);
    } catch (err) {
      console.error('Error stringifying data:', err);
      return 'Error displaying response data';
    }
  };
  
  return (
    <div className="w-full py-10">
      {!selectedAnalysis ? (
        // Main selection screen
        <>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Intelligent Decision Support System
            </h2>
            <p className="text-gray-600 mt-2">
              AI-powered inventory analytics and decision support
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 px-4">
            {/* Remaining Supply Timeline Button */}
            <button 
              onClick={() => handleAnalysisSelect('timeline')}
              className="w-full md:w-1/2 max-w-md group"
            >
              <div className="bg-white rounded-xl shadow-xl transition-all duration-300 group-hover:shadow-2xl transform group-hover:-translate-y-1 border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="w-16 h-16 mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                    Remaining Supply Timeline
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Visualize how long your current inventory will last based on historical usage patterns
                  </p>
                </div>
                <div className="h-2 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
              </div>
            </button>
            
            {/* Stock Below Threshold Button */}
            <button 
              onClick={() => handleAnalysisSelect('threshold')}
              className="w-full md:w-1/2 max-w-md group"
            >
              <div className="bg-white rounded-xl shadow-xl transition-all duration-300 group-hover:shadow-2xl transform group-hover:-translate-y-1 border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="w-16 h-16 mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                    Stock Below Threshold
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Identify items that are running low and need immediate attention
                  </p>
                </div>
                <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
              </div>
            </button>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Select an option to continue</p>
          </div>
        </>
      ) : (
        // Response display panel - same height as the selection screen
        <div className="max-w-4xl mx-auto h-full bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all flex flex-col">
          {/* Header */}
          <div className={`p-5 flex items-center justify-between ${
            selectedAnalysis === 'timeline' 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
              : 'bg-gradient-to-r from-red-500 to-orange-500'
          }`}>
            <div className="flex items-center">
              <div className="bg-white/20 rounded-full p-2.5 mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {selectedAnalysis === 'timeline' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedAnalysis === 'timeline' ? 'Remaining Supply Timeline' : 'Stock Below Threshold'}
                </h3>
                <p className="text-white/80 text-sm">
                  {selectedAnalysis === 'timeline' 
                    ? 'Projection based on historical usage patterns' 
                    : 'Inventory items requiring immediate attention'}
                </p>
              </div>
            </div>
            <button 
              onClick={closeAnalysis}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors"
              aria-label="Close analysis"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Response content - flex-grow to fill available space */}
          <div className="p-8 bg-gray-50 flex-grow flex flex-col">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`w-16 h-16 mb-4 rounded-full border-4 border-t-transparent animate-spin ${
                  selectedAnalysis === 'timeline' ? 'border-purple-500' : 'border-orange-500'
                }`}></div>
                <p className="text-gray-600 font-medium">
                  Analyzing inventory data...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  This may take a few moments
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Analysis Error</h3>
                <p className="text-red-600 text-center max-w-md">
                  {error}
                </p>
                <button
                  onClick={() => handleAnalysisSelect(selectedAnalysis)}
                  className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : responseData ? (
              <div className="ai-response font-light leading-relaxed text-gray-800 h-full">
                <div className={`p-4 mb-5 rounded-lg border-l-4 ${
                  selectedAnalysis === 'timeline' ? 'border-l-purple-500 bg-purple-50' : 'border-l-orange-500 bg-orange-50'
                }`}>
                  <p className="text-sm text-gray-600">
                    {selectedAnalysis === 'timeline' 
                      ? 'Based on current inventory levels and historical usage, here\'s your projected supply timeline:' 
                      : 'The following items are below their recommended threshold levels:'}
                  </p>
                </div>
                
                <div className="whitespace-pre-wrap rounded-lg bg-white p-5 border border-gray-200 shadow-sm">
                  {/* Use the formatted response data */}
                  {formatResponseData(responseData)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>
          
          {/* Footer with timestamp */}
          <div className="px-6 py-3 bg-white border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Powered by Petlyst iDSS
            </div>
            <div className="text-xs text-gray-500">
              {responseData && !isLoading ? (
                <>Analysis completed at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
              ) : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default iDSS;
