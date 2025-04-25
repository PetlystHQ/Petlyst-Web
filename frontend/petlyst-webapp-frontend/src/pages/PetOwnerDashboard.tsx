import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';
import axiosInstance from '../utils/axiosConfig';
import MyPets from '../components/petowner/MyPets';
import MyProfile from '../components/petowner/MyProfile';
import MyAppointments from '../components/petowner/MyAppointments';
import {
  ArrowLeftOnRectangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';

// Interfaces
interface MenuItem {
  name: string;
  onClick?: () => void;
  subItems?: MenuItem[];
  expanded?: boolean;
}

interface Pet {
  pet_id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  pet_birth_date: string;
  pet_gender: string;
  pet_owner_id: string;
  pet_profile_photo?: string;
}

interface Appointment {
  appointment_id: string;
  clinic_id: string;
  clinic_name: string;
  pet_id: string;
  pet_name: string;
  appointment_date: string;
  appointment_start_hour: string;
  appointment_end_hour: string;
  appointment_status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  video_meeting: boolean;
  meeting_url?: string;
  meeting_password?: string;
  veterinarian_name?: string;
  veterinarian_surname?: string;
}

interface SavedClinic {
  clinic_id: string;
  clinic_name: string;
  clinic_type: string;
  province: string;
  district: string;
  saved_at: string;
  clinic_verification_status: string;
  slug?: string;
}

interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  message_content: string;
  created_at: string;
  read_at?: string;
  sender_name?: string;
  sender_type?: string;
  clinic_name?: string;
}

const PetOwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  // States
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [savedClinics, setSavedClinics] = useState<SavedClinic[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Menu Items
  const menuItems: MenuItem[] = [
    {
      name: 'Overview',
      onClick: () => setActiveTab('overview')
    },
    {
      name: 'My Profile',
      onClick: () => setActiveTab('profile')
    },
    {
      name: 'My Pets',
      onClick: () => setActiveTab('pets')
    },
    {
      name: 'Appointments',
      onClick: () => setActiveTab('appointments')
    },
    {
      name: 'Saved Clinics',
      onClick: () => setActiveTab('savedClinics')
    },
    {
      name: 'Messages',
      onClick: () => setActiveTab('messages')
    }
  ];
  
  // Fetch data on component mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [token, activeTab]);
  
  // Fetch relevant data based on active tab
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data based on active tab
      switch (activeTab) {
        case 'overview':
          // For overview, only fetch pets which we know works
          await fetchPets();
          break;
        case 'pets':
          await fetchPets();
          break;
        case 'appointments':
          await fetchAppointments();
          break;
        case 'savedClinics':
          await fetchSavedClinics();
          break;
        case 'messages':
          await fetchMessages();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch pets
  const fetchPets = async () => {
    try {
      const response = await axiosInstance.get('/pets/my-pets');
      if (response.data.success) {
        setPets(response.data.pets || []);
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
      throw err;
    }
  };
  
  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      console.log('PetOwnerDashboard: Fetching appointments from API');
      const response = await axiosInstance.get('/appointments/pet-owner');
      
      if (response.data && response.data.success) {
        console.log('PetOwnerDashboard: Successfully fetched appointments:', response.data.appointments.length);
        setAppointments(response.data.appointments || []);
      } else {
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      throw err;
    }
  };
  
  // Fetch saved clinics
  const fetchSavedClinics = async () => {
    try {
      const response = await axiosInstance.get('/pet-owners/saved-clinics');
      if (response.data.success) {
        setSavedClinics(response.data.favorites || []);
      }
    } catch (err) {
      console.error('Error fetching saved clinics:', err);
      throw err;
    }
  };
  
  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get('/pet-owners/messages');
      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw err;
    }
  };
  
  // Handle removing a saved clinic
  const handleRemoveFavorite = async (clinicId: string) => {
    try {
      const response = await axiosInstance.delete(`/pet-owners/saved-clinics/${clinicId}`);
      
      if (response.data.success) {
        // Remove the clinic from the list
        setSavedClinics(savedClinics.filter(clinic => clinic.clinic_id !== clinicId));
      }
    } catch (err) {
      console.error('Error removing clinic from favorites:', err);
      setError('Failed to remove clinic from favorites. Please try again.');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Dispatch the logout action to clear auth state
    dispatch(logout());
    // Navigate to home page instead of login
    navigate('/');
  };
  
  // Handle navigation to home
  const handleGoHome = () => {
    navigate('/');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      return null; // Return null for invalid dates
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Render profile content
  const renderProfile = () => {
    return (
      <MyProfile 
        loading={loading && activeTab === 'profile'}
        error={error && activeTab === 'profile' ? error : null}
      />
    );
  };
  
  // Render pets content
  const renderPets = () => {
    return (
      <MyPets 
        pets={pets}
        loading={loading}
        error={error}
        onPetAdded={fetchPets}
      />
    );
  };
  
  // Render appointments content
  const renderAppointments = () => {
    console.log('PetOwnerDashboard: Rendering appointments tab, appointments count:', appointments.length);
    
    return (
      <MyAppointments 
        appointments={appointments}
        loading={loading && activeTab === 'appointments'}
        error={error && activeTab === 'appointments' ? error : null}
        onAppointmentCanceled={fetchAppointments}
      />
    );
  };
  
  // Render saved clinics content
  const renderSavedClinics = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Saved Clinics</h2>
        
        {savedClinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedClinics.map(clinic => (
              <div 
                key={clinic.clinic_id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/clinics/${clinic.slug || clinic.clinic_id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{clinic.clinic_name}</h3>
                    <p className="text-sm text-gray-600">{clinic.province}, {clinic.district}</p>
                    {formatDate(clinic.saved_at) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Saved on {formatDate(clinic.saved_at)}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(clinic.clinic_id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <SolidHeartIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {clinic.clinic_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/booking/${clinic.clinic_id}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No saved clinics</h3>
            <p className="text-gray-600 mb-4">Explore clinics and save your favorites for quick access</p>
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              onClick={() => navigate('/')}
            >
              Explore Clinics
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Render messages content
  const renderMessages = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Messages</h2>
        
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map(message => (
              <div key={message.message_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {message.sender_type === 'veterinarian' 
                        ? `Dr. ${message.sender_name}` 
                        : message.clinic_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!message.read_at && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">New</span>
                  )}
                </div>
                <p className="text-gray-600">{message.message_content}</p>
                <div className="mt-3 flex justify-end">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No messages</h3>
            <p className="text-gray-600">When you receive messages from clinics or veterinarians, they will appear here</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'profile':
        return renderProfile();
      case 'pets':
        return renderPets();
      case 'appointments':
        return renderAppointments();
      case 'savedClinics':
        return renderSavedClinics();
      case 'messages':
        return renderMessages();
      default:
        return renderOverview();
    }
  };
  
  // Render overview content
  const renderOverview = () => {
    // Get current time to personalize greeting
    const currentHour = new Date().getHours();
    let greeting = "Good Morning";
    if (currentHour >= 12 && currentHour < 18) {
      greeting = "Good Afternoon";
    } else if (currentHour >= 18) {
      greeting = "Good Evening";
    }
    
    // Get random pet for wellbeing message
    const randomPet = pets.length > 0 ? pets[Math.floor(Math.random() * pets.length)] : null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-medium text-gray-800 mb-2">My Pets</h3>
            <p className="text-3xl font-bold text-blue-600">{pets.length}</p>
            <button 
              onClick={() => setActiveTab('pets')}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all pets
            </button>
          </div>
        </div>
        
        {/* Pet Wellbeing Message - Simplified Design */}
        {pets.length > 0 && (
          <div className="mt-8 border-l-4 border-emerald-400 pl-4 py-2">
            <div className="bg-gradient-to-r from-emerald-50 to-transparent p-4 rounded-r-lg">
              <h3 className="text-lg font-medium text-emerald-800 mb-2">{greeting}, {user?.name || 'Friend'}!</h3>
              
              <p className="text-emerald-700 mb-3">
                {randomPet ? 
                  `${randomPet.pet_name} wants to spend time with you today. Have you checked your furry friend's food and water bowls?` : 
                  'Your furry friends might be missing you today. Would you like to spend some time with them?'
                }
              </p>
              
              <p className="text-emerald-600 italic text-sm">
                "The bond with animals is one of the most beautiful feelings that nourishes the love within us."
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Main component render
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="bg-white shadow-md w-64 min-h-screen flex flex-col">
          <div className="p-4 flex flex-col items-center justify-center border-b border-gray-200">
            <img 
              src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
              alt="Petlyst Logo" 
              className="h-10 w-auto mb-3"
            />
            <h1 className="text-xl font-bold text-gray-800 mb-1">Pet Owner Dashboard</h1>
            <div className="bg-blue-50 w-full rounded-md p-2 mt-2 text-center border border-blue-100">
              <p className="font-medium text-blue-700">
                Welcome, {user?.name || 'Guest'}!
              </p>
            </div>
          </div>
          
          <nav className="mt-5 flex-grow">
            <ul className="space-y-1 px-3">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={item.onClick}
                    className={`flex items-center w-full px-4 py-2.5 rounded-md transition-colors
                      ${activeTab === item.name.toLowerCase().replace(' ', '') 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Bottom buttons */}
          <div className="mt-auto mb-6 px-3">
            <div className="border-t border-gray-200 pt-4 mb-3"></div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center w-full px-3 py-2.5 rounded-md transition-colors
                  bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <span className="mr-2"><HomeIcon className="w-5 h-5" /></span>
                <span className="font-medium">Home</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-3 py-2.5 rounded-md transition-colors
                  bg-red-50 text-red-700 hover:bg-red-100"
              >
                <span className="mr-2"><ArrowLeftOnRectangleIcon className="w-5 h-5" /></span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-4 rounded-md">
              <p>{error}</p>
              <button 
                onClick={fetchData}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default PetOwnerDashboard;
