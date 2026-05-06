import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import axiosInstance from '../../utils/axiosConfig';
import { API_ENDPOINTS, DASHBOARD_VIEWS } from '../../constants/dashboard';
import { DashboardView } from '../../types/dashboard';

interface ProfileCompletionCardProps {
  className?: string;
  onViewChange?: (view: DashboardView) => void;
}

interface ProfileCompletionStatus {
  percentage: number;
  incomplete: {
    biography: boolean;
    languages: boolean;
    education: boolean;
    certifications: boolean;
    expertise: boolean;
    photos: boolean;
  };
  isComplete: boolean;
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ className = '', onViewChange }) => {
  const { token } = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_ENDPOINTS.PROFILE_COMPLETION);
        
        if (response.data.success) {
          setCompletionStatus(response.data.completion);
        } else {
          setError(response.data.message || 'Failed to load profile completion status');
        }
      } catch (error) {
        console.error('Error fetching profile completion status:', error);
        setError('Failed to load profile completion status');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionStatus();
  }, [token]);

  const handleNavigateToProfile = () => {
    if (onViewChange) {
      onViewChange(DASHBOARD_VIEWS.profile);
    }
  };

  // If profile is complete, don't show the card
  if (!loading && completionStatus && completionStatus.isComplete) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        <div className="p-6 flex items-center justify-center">
          <div className="w-6 h-6 relative">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin"></div>
          </div>
          <span className="ml-2 text-sm text-gray-500">Checking profile status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg shadow-sm border border-red-100 overflow-hidden ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-800">Could not retrieve profile status</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // If no completion status is available yet
  if (!completionStatus) {
    return null;
  }

  // Incomplete profile state
  const { incomplete } = completionStatus;
  
  // Create the item list of incomplete profile sections
  const incompleteItems = [];
  
  if (incomplete.biography) incompleteItems.push({ 
    id: 'biography', 
    label: 'Biography',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  });
  
  if (incomplete.languages) incompleteItems.push({ 
    id: 'languages', 
    label: 'Languages',
    color: 'bg-green-100 text-green-800 border-green-200'
  });
  
  if (incomplete.education) incompleteItems.push({ 
    id: 'education', 
    label: 'Education',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  });
  
  if (incomplete.certifications) incompleteItems.push({ 
    id: 'certifications', 
    label: 'Certifications',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  });
  
  if (incomplete.expertise) incompleteItems.push({ 
    id: 'expertise', 
    label: 'Expertise',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  });
  
  if (incomplete.photos) incompleteItems.push({ 
    id: 'photos', 
    label: 'Photos',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  });

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-indigo-100 overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-indigo-800">Complete Your Profile</h3>
            <p className="mt-1 text-sm text-indigo-600">
              Complete your profile to enhance your professional presence
            </p>
          </div>
        </div>
        
        {incompleteItems.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-indigo-800 mb-3">Missing information:</p>
            <div className="flex flex-wrap gap-2">
              {incompleteItems.map(item => (
                <span 
                  key={item.id} 
                  className={`inline-flex items-center px-3 py-1.5 rounded-full border ${item.color} text-sm`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={handleNavigateToProfile}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Complete My Profile
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionCard; 