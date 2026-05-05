import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/dashboard';
import { VETERINARY_EXPERTISE_AREAS } from '../constants/VeterinaryExpertise';
import { VETERINARY_LANGUAGES } from '../constants/VeterinaryLanguages';
import { useAppSelector } from '../hooks/useAppSelector';
import { API_URL } from '../config/api';

// Veterinarian profile interfaces
interface VeterinarianProfile {
  user_id: number;
  user_name: string;
  user_surname: string;
  user_email: string;
  user_profile_photo: string | null;
  biography: string | null;
  preferred_languages: string[] | null;
  veterinarian_verification_status: string;
  education: Education[];
  certifications: Certification[];
  expertise: Expertise[];
  photos: Photo[];
  slug?: string;
}

// Add a new interface for the clinic data
interface ApprovedClinic {
  clinic_id: number;
  clinic_name: string;
  association_status: string;
  slug: string;
}

interface Education {
  education_id: number;
  school_name: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

interface Certification {
  certification_id: number;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  certification_number: string | null;
}

interface Expertise {
  expertise_id: number;
  expertise_area: string;
}

interface Photo {
  veterinarian_album_photo_id: number;
  veterinarian_album_photo_url: string;
}

const SingleVeterinarianPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<VeterinarianProfile | null>(null);
  const [approvedClinic, setApprovedClinic] = useState<ApprovedClinic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivateProfile, setIsPrivateProfile] = useState<boolean>(false);
  const [isProfileVisibilityUpdating, setIsProfileVisibilityUpdating] = useState<boolean>(false);
  
  // Get current user from redux store
  const { user, token } = useAppSelector(state => state.auth);
  
  // Check if the current user is the profile owner
  const [isProfileOwner, setIsProfileOwner] = useState<boolean>(false);

  // ... Later in the educations render block, fix the "More" functionality
  const [expandedSections, setExpandedSections] = useState<{
    education: boolean;
    certifications: boolean;
  }>({
    education: false,
    certifications: false
  });

  useEffect(() => {
    const fetchVeterinarianProfile = async () => {
      try {
        setLoading(true);
        
        // Auth token'ı her zaman gönderiyoruz (eğer varsa), böylece profil sahibi olabilir
        const response = await axios.get(`${API_ENDPOINTS.PUBLIC_PROFILE_BY_SLUG}/${slug}`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        
        if (response.data.success) {
          setProfile(response.data.profile);
          setIsPrivateProfile(response.data.is_private || false);
          
          // Backend'in gönderdiği is_owner bilgisini öncelikle kullan
          if (Object.prototype.hasOwnProperty.call(response.data, 'is_owner')) {
            setIsProfileOwner(response.data.is_owner);
            console.log("Using backend is_owner info:", response.data.is_owner);
          } 
          // Eğer backend is_owner bilgisi yoksa, client tarafında hesapla
          else if (user && response.data.profile) {
            // Farklı ID formatlarını destekle
            const userId = user.id || (user as any)?.user_id || (user as any)?.userId;
            const profileUserId = response.data.profile.user_id;
            
            // ID'leri string formatına çevirip karşılaştır
            const isOwner = userId && profileUserId && 
                           String(userId) === String(profileUserId);
                           
            console.log("Calculated is_owner client-side:", {
              userId,
              profileUserId,
              isOwner
            });
            
            setIsProfileOwner(isOwner);
          }
          
          // If we have a user_id, fetch the approved clinic
          if (response.data.profile && response.data.profile.user_id) {
            fetchApprovedClinic(response.data.profile.user_id);
          }
        } else {
          setError(response.data.message || 'Failed to load veterinarian profile');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          setError('This veterinarian profile is private');
        } else if (error.response && error.response.status === 404) {
          setError('Veterinarian profile not found');
        } else {
          setError('Failed to load veterinarian profile. Please try again later.');
        }
        console.error('Error fetching veterinarian profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchVeterinarianProfile();
    }
  }, [slug, user, token]);

  // Function to fetch the approved clinic for the veterinarian
  const fetchApprovedClinic = async (veterinarianId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/veterinarian/approved-clinic/${veterinarianId}`);
      
      if (response.data && response.data.success) {
        setApprovedClinic(response.data.clinic);
      }
    } catch (error) {
      // Just log the error, but don't show an error message to the user
      // since this is an enhancement, not a critical feature
      console.error('Error fetching approved clinic:', error);
    }
  };

  // Function to update profile visibility
  const updateProfileVisibility = async (makePublic: boolean) => {
    if (!token || !isProfileOwner) return;
    
    try {
      setIsProfileVisibilityUpdating(true);
      
      const response = await axios.put(
        API_ENDPOINTS.PROFILE_VISIBILITY, 
        { is_profile_public: makePublic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setIsPrivateProfile(!makePublic);
      }
    } catch (error) {
      console.error('Error updating profile visibility:', error);
    } finally {
      setIsProfileVisibilityUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Function to get expertise area name from ID
  const getExpertiseName = (expertiseId: string) => {
    const expertise = VETERINARY_EXPERTISE_AREAS.find(e => e.id === expertiseId);
    return expertise ? expertise.name : expertiseId;
  };

  // Function to get language name from ID
  const getLanguageName = (languageId: string) => {
    const language = VETERINARY_LANGUAGES.find(l => l.id === languageId);
    return language ? language.name : languageId;
  };

  // Render loading state with a simpler spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render profile not found state
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">The veterinarian profile you're looking for doesn't exist or may have been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Render the profile with a more compact layout
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Privacy CTA Banner */}
        {isProfileOwner && isPrivateProfile && (
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 mb-6 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between items-center">
                <div>
                  <p className="text-indigo-700 font-medium">Psst! Your profile is in stealth mode!</p>
                  <p className="text-indigo-600 text-sm mt-1">
                    Only you can see this amazing profile right now. It's like having a superpower, but a pretty useless one.
                  </p>
                </div>
                <div className="mt-3 md:mt-0 md:ml-6">
                  <button
                    onClick={() => updateProfileVisibility(true)}
                    disabled={isProfileVisibilityUpdating}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${isProfileVisibilityUpdating ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isProfileVisibilityUpdating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Show off to the world!'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Header Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="md:flex">
            {/* Profile header with image and basic info */}
            <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col justify-center items-center">
              <div className="w-40 h-40 relative mx-auto mb-4">
                {profile?.photos && profile.photos.length > 0 ? (
                  <img 
                    src={profile.photos[0].veterinarian_album_photo_url} 
                    alt={`Dr. ${profile?.user_name} ${profile?.user_surname}`}
                    className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md"
                  />
                ) : profile?.user_profile_photo ? (
                  <img 
                    src={profile.user_profile_photo} 
                    alt={`Dr. ${profile?.user_name} ${profile?.user_surname}`}
                    className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-200 to-indigo-200 rounded-2xl border-2 border-white shadow-md flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </div>
                )}
                {profile?.veterinarian_verification_status === 'verified' && (
                  <div className="absolute bottom-1 right-1 bg-green-100 rounded-xl p-1 border-2 border-white">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-center text-gray-900 mt-2">
                Dr. {profile?.user_name} {profile?.user_surname}
              </h1>
              
              {profile?.veterinarian_verification_status === 'verified' && (
                <div className="mt-1 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="mr-1 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Verified Veterinarian
                  </span>
                </div>
              )}
              
              {/* Contact Button */}
              <div className="mt-4 w-full">
                <a 
                  href={`mailto:${profile?.user_email}`}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Veterinarian
                </a>
              </div>
              
              {/* Languages */}
              {profile?.preferred_languages && profile.preferred_languages.length > 0 && (
                <div className="mt-6 w-full">
                  <h3 className="text-sm font-medium text-gray-500 text-center mb-2">Languages</h3>
                  <div className="flex flex-wrap justify-center gap-1">
                    {profile.preferred_languages.map(languageId => (
                      <span 
                        key={languageId} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {getLanguageName(languageId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Main profile details */}
            <div className="md:w-2/3 p-6">
              {/* Approved Clinic Information */}
              {approvedClinic && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center mb-3">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Works At
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex flex-row items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{approvedClinic.clinic_name}</h3>
                      </div>
                      <a
                        href={approvedClinic.slug ? `/clinics/${approvedClinic.slug}` : `/search?clinic=${approvedClinic.clinic_id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
                      >
                        <svg className="mr-1 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Clinic
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Biography */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 flex items-center mb-3">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Biography
                </h2>
                {profile?.biography ? (
                  <div className="prose prose-sm max-w-none text-gray-600">
                    {profile.biography.split('\n').map((paragraph, index) => (
                      paragraph ? <p key={index} className="mb-2">{paragraph}</p> : <br key={index} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No biography provided.</p>
                )}
              </div>
              
              {/* Expertise */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 flex items-center mb-3">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Areas of Expertise
                </h2>
                {profile?.expertise && profile.expertise.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profile.expertise.map(expertise => (
                      <div key={expertise.expertise_id} className="bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="font-medium text-sm text-gray-800">
                            {getExpertiseName(expertise.expertise_area)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No expertise information provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Details Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Education Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-800 flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
              Education
            </h2>
            {profile?.education && profile.education.length > 0 ? (
              <div className="space-y-4">
                {(expandedSections.education ? profile.education : profile.education.slice(0, 3)).map(education => (
                  <div key={education.education_id} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="font-medium text-gray-800">{education.school_name}</div>
                    <div className="text-gray-600 text-sm">{education.field_of_study}</div>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {formatDate(education.start_date)} - {education.is_current ? 
                          <span className="text-blue-600 font-medium">Present</span> : 
                          formatDate(education.end_date)
                        }
                      </span>
                    </div>
                  </div>
                ))}
                {profile.education.length > 3 && (
                  <button 
                    onClick={() => setExpandedSections({...expandedSections, education: !expandedSections.education})}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                  >
                    {expandedSections.education ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                        Show less
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        Show {profile.education.length - 3} more
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No education information provided.</p>
            )}
          </div>
          
          {/* Certifications Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-800 flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Certifications
            </h2>
            {profile?.certifications && profile.certifications.length > 0 ? (
              <div className="space-y-4">
                {(expandedSections.certifications ? profile.certifications : profile.certifications.slice(0, 3)).map(certification => (
                  <div key={certification.certification_id} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="font-medium text-gray-800">{certification.certification_name}</div>
                    <div className="text-gray-600 text-sm">{certification.issuing_organization}</div>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Issued: {formatDate(certification.issue_date)}</span>
                    </div>
                    {certification.certification_number && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="font-medium">Cert. No:</span> {certification.certification_number}
                      </div>
                    )}
                  </div>
                ))}
                {profile.certifications.length > 3 && (
                  <button
                    onClick={() => setExpandedSections({...expandedSections, certifications: !expandedSections.certifications})}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                  >
                    {expandedSections.certifications ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                        Show less
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        Show {profile.certifications.length - 3} more
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No certification information provided.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleVeterinarianPage;
