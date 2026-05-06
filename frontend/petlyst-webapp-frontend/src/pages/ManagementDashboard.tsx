import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import ClinicAppointments from '../components/clinic/management/ClinicAppointments';
import UpcomingAppointments from '../components/clinic/management/UpcomingAppointments';
import PastAppointments from '../components/clinic/management/PastAppointments';
import PetRecords from '../components/clinic/management/PetRecords';
import InventoryManagement from '../components/clinic/management/InventoryManagement';
import HospitalizationDashboard from '../components/clinic/management/hospitalization/HospitalizationDashboard';
import ExaminationList from '../components/clinic/management/examination/ExaminationList';
import DiagnosisList from '../components/clinic/management/diagnosis/DiagnosisList';
import Calendar from '../components/clinic/management/Calendar';
import ClinicReviews from '../components/clinic/management/review/ClinicReviews';
import { API_URL } from '../config/api';
import { getApiErrorMessage, getApiErrorStatus, getApiErrorResponse } from '../utils/errorMessage';
interface ClinicData {
  clinic_id: string;
  clinic_name: string;
  clinic_operator_id: string;
  clinic_verification_status?: 'pending' | 'verified' | 'archived';
  // Add other clinic fields as needed
}

// Define a custom sidebar menu item type
interface MenuItem {
  name: string;
  icon: JSX.Element;
  link?: string;
  onClick?: () => void;
  subItems?: MenuItem[];
  expanded?: boolean;
}

// Define interfaces for veterinarian data
interface VeterinarianData {
  id: string;
  veterinarian_id: string;
  clinic_id: string;
  status: string;
  user_name: string;
  user_surname: string;
  user_email: string;
  user_phone: string;
  is_clinic_creator: boolean;
  created_at: string;
}

// Interface for modal state
interface ConfirmModalState {
  isOpen: boolean;
  veterinarianId: string | null;
  veterinarianName: string | null;
}

// Added interfaces for approve and reject modal states
interface ApproveModalState {
  isOpen: boolean;
  veterinarianId: string | null;
  veterinarianName: string | null;
}

interface RejectModalState {
  isOpen: boolean;
  veterinarianId: string | null;
  veterinarianName: string | null;
}

// Interface for archive/restore modal
interface ArchiveModalState {
  isOpen: boolean;
  action: 'archive' | 'restore' | null;
}

const ManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Extract veterinarian name safely using a more generic approach.
  // Older payloads may carry snake_case aliases instead of the canonical
  // User shape; cast once into a permissive type for those fallbacks.
  type LegacyUser = { user_name?: string; user_surname?: string; name?: string; surname?: string };
  const getVetName = () => {
    if (!user) return '';
    const legacy = user as LegacyUser;
    return legacy.user_name || legacy.name || '';
  };

  const getVetSurname = () => {
    if (!user) return '';
    const legacy = user as LegacyUser;
    return legacy.user_surname || legacy.surname || '';
  };
  
  // Get clinicId from URL params, fallback to localStorage if not present
  const { clinicId: urlClinicId } = useParams<{ clinicId?: string }>();
  const storedClinicId = localStorage.getItem('selectedClinicId');
  const clinicId = urlClinicId || storedClinicId;
  
  // If clinicId from URL is different from stored one, update localStorage and redirect
  useEffect(() => {
    if (urlClinicId) {
      localStorage.setItem('selectedClinicId', urlClinicId);
      console.log('Updated selectedClinicId in localStorage:', urlClinicId);
      
      // Redirect to /management-dashboard without clinic ID in URL
      navigate('/management-dashboard', { replace: true });
    } else if (!storedClinicId) {
      // If no clinicId in URL or localStorage, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [urlClinicId, storedClinicId, navigate]);

  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Staff management states
  const [staffMembers, setStaffMembers] = useState<VeterinarianData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<VeterinarianData[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    veterinarianId: null,
    veterinarianName: null
  });
  
  // Added new modal states for approve and reject actions
  const [approveModal, setApproveModal] = useState<ApproveModalState>({
    isOpen: false,
    veterinarianId: null,
    veterinarianName: null
  });
  
  const [rejectModal, setRejectModal] = useState<RejectModalState>({
    isOpen: false,
    veterinarianId: null,
    veterinarianName: null
  });

  // State for archive/restore modal
  const [archiveModal, setArchiveModal] = useState<ArchiveModalState>({
    isOpen: false,
    action: null
  });

  // Get base clinic name without suffixes
  const getBaseClinicName = (name: string | undefined) => {
    if (!name) return 'Clinic Management Console';
    
    // Remove common suffixes
    return name
      .replace(/\s+Veterinary\s+Clinic$/i, '')
      .replace(/\s+Animal\s+Hospital$/i, '');
  };

  // Check for tab parameter in URL when component mounts
  useEffect(() => {
    try {
      // Get the tab parameter from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      
      console.log('Tab parameter in URL:', tabParam);
      
      // List of valid tabs
      const validTabs = [
        'dashboard', 'appointment-requests', 'upcoming-appointments', 'past-appointments', 
        'pet-records', 'inventory', 'hospitalization', 'examinations', 'staff', 
        'medical-history', 'diagnoses', 'trust-insight'
      ];
      
      // If tab parameter exists and it's a valid tab, set it as active
      if (tabParam && validTabs.includes(tabParam)) {
        console.log('Setting active tab to:', tabParam);
        setActiveTab(tabParam);
        
        // If the tab is examinations, ensure any data from localStorage is processed
        if (tabParam === 'examinations') {
          console.log('Tab is examinations, checking localStorage for pet ID');
          const petId = localStorage.getItem('startExamForPet');
          if (petId) {
            console.log('Found pet ID in localStorage for examination:', petId);
          }
        }
        
        // Clean URL by removing the tab parameter without refreshing the page
        // Use setTimeout to ensure the state is updated before changing the URL
        setTimeout(() => {
          try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('tab');
            window.history.replaceState({}, '', newUrl);
          } catch (e) {
            console.error('Error cleaning URL:', e);
          }
        }, 100);
      } else if (tabParam) {
        console.warn('Invalid tab parameter:', tabParam);
        // Redirect to default tab
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error handling tab parameter:', error);
    }
  }, []);

  // Listen for examination start event
  useEffect(() => {
    const handleStartExamination = (event: Event) => {
      const customEvent = event as CustomEvent;
      const petId = customEvent.detail?.petId;
      
      if (petId) {
        console.log('ManagementDashboard: Received startExamination event with pet ID:', petId);
        
        // Store petId securely in localStorage first
        localStorage.removeItem('startExamForPet');
        localStorage.setItem('startExamForPet', petId);
        console.log('ManagementDashboard: Stored petId in localStorage:', petId);
        
        // Set active tab with a small delay to ensure state update is processed
        setTimeout(() => {
          console.log('ManagementDashboard: Setting active tab to examinations');
          setActiveTab('examinations');
        }, 50);
      }
    };
    
    // Listen for the switchToExaminationsTab event
    const handleSwitchTab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { clinicId: eventClinicId, petId } = customEvent.detail;
      
      if (petId) {
        console.log('ManagementDashboard: Received switchToExaminationsTab event with pet ID:', petId);
        
        // Verify the clinic ID from the event if provided
        if (eventClinicId && eventClinicId !== clinicId) {
          console.warn('ManagementDashboard: Event clinic ID does not match current clinic ID');
          return;
        }
        
        // Store petId securely in localStorage first
        localStorage.removeItem('startExamForPet');
        localStorage.setItem('startExamForPet', petId);
        console.log('ManagementDashboard: Stored petId in localStorage from switchTab event:', petId);
        
        // Set active tab with a small delay to ensure state update is processed
        setTimeout(() => {
          console.log('ManagementDashboard: Setting active tab to examinations from switchTab event');
          setActiveTab('examinations');
        }, 50);
      }
    };
    
    // Listen for the startDiagnosis event
    const handleStartDiagnosis = (event: Event) => {
      const customEvent = event as CustomEvent;
      const petId = customEvent.detail?.petId;
      
      if (petId) {
        console.log('ManagementDashboard: Received startDiagnosis event with pet ID:', petId);
        
        // Store petId securely in localStorage
        localStorage.removeItem('currentPetId');
        localStorage.setItem('currentPetId', petId.toString());
        console.log('ManagementDashboard: Stored petId in localStorage for diagnosis:', petId);
        
        // Set active tab with a small delay to ensure state update is processed
        setTimeout(() => {
          console.log('ManagementDashboard: Setting active tab to diagnoses');
          setActiveTab('diagnoses');
          
          // Dispatch custom event to open the diagnosis form
          const openFormEvent = new CustomEvent('openDiagnosisForm', { 
            detail: { petId }
          });
          window.dispatchEvent(openFormEvent);
        }, 50);
      }
    };

    // Add event listeners
    window.addEventListener('startExamination', handleStartExamination);
    window.addEventListener('switchToExaminationsTab', handleSwitchTab);
    window.addEventListener('startDiagnosis', handleStartDiagnosis);
    
    console.log('ManagementDashboard: Added event listeners for examination and diagnosis events');
    
    return () => {
      window.removeEventListener('startExamination', handleStartExamination);
      window.removeEventListener('switchToExaminationsTab', handleSwitchTab);
      window.removeEventListener('startDiagnosis', handleStartDiagnosis);
      console.log('ManagementDashboard: Removed event listeners for examination and diagnosis events');
    };
  }, [clinicId]);

  // Define menu items with expanded state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => setActiveTab('dashboard'),
    },
    {
      name: 'Appointments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      expanded: false,
      subItems: [
        {
          name: 'Requests',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          ),
          onClick: () => setActiveTab('appointment-requests'),
        },
        {
          name: 'Upcoming',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          onClick: () => setActiveTab('upcoming-appointments'),
        },
        {
          name: 'Past',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          onClick: () => setActiveTab('past-appointments'),
        },
      ],
    },
    {
      name: 'Patients',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      expanded: false,
      subItems: [
        {
          name: 'Pet Records',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          onClick: () => setActiveTab('pet-records'),
        },
        {
          name: 'Examinations',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          onClick: () => setActiveTab('examinations'),
        },
        {
          name: 'Diagnoses',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          onClick: () => setActiveTab('diagnoses'),
        },
      ],
    },
    {
      name: 'Hospitalization',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      onClick: () => setActiveTab('hospitalization'),
    },
    {
      name: 'TrustInsight',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      onClick: () => setActiveTab('trust-insight'),
    },
    {
      name: 'Staff',
      icon: (
        <div className="flex items-center">
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          {pendingRequests && pendingRequests.length > 0 && (
            <div className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-400 text-yellow-800 rounded-full font-bold">
              {pendingRequests.length}
            </div>
          )}
        </div>
      ),
      onClick: () => setActiveTab('staff'),
    },
    {
      name: 'Inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      onClick: () => setActiveTab('inventory'),
    },
    {
      name: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => setActiveTab('settings'),
    },
    {
      name: 'Return to My Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
        </svg>
      ),
      onClick: () => navigate('/dashboard'),
    }
  ]);

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Toggle submenu expansion
  const toggleSubmenu = (index: number) => {
    const updatedMenuItems = [...menuItems];
    updatedMenuItems[index].expanded = !updatedMenuItems[index].expanded;
    setMenuItems(updatedMenuItems);
  };

  // Fetch clinic veterinarians
  const fetchClinicVeterinarians = async () => {
    if (!token || !clinicId) return;

    setStaffLoading(true);
    setStaffError(null);

    try {
      // Fetch all veterinarians (both approved and pending)
      const response = await axios.get(`${API_URL}/api/clinics/${clinicId}/veterinarians`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Fetched veterinarians:', response.data);

      if (response.data.success && response.data.veterinarians) {
        // Separate pending requests from approved staff members
        const allVets = response.data.veterinarians;
        const approved = allVets.filter((vet: VeterinarianData) => vet.status === 'approved');
        const pending = allVets.filter((vet: VeterinarianData) => vet.status === 'pending');
        
        console.log('Pending requests count:', pending.length);
        setStaffMembers(approved);
        setPendingRequests(pending);
      } else {
        setStaffError('Failed to load staff members');
      }
    } catch (err) {
      console.error('Error fetching clinic veterinarians:', err);
      setStaffError(getApiErrorMessage(err, 'Failed to fetch staff members'));
    } finally {
      setStaffLoading(false);
    }
  };

  // Handle veterinarian request approval/rejection
  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!token || !clinicId) return;

    setActionInProgress(requestId);

    try {
      const response = await axios.put(
        `${API_URL}/api/clinics/${clinicId}/veterinarian/${requestId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log(`Request ${status} response:`, response.data);

      if (response.data.success) {
        // Close the modal if open
        if (status === 'approved') {
          setApproveModal({
            isOpen: false,
            veterinarianId: null,
            veterinarianName: null
          });
        } else {
          setRejectModal({
            isOpen: false,
            veterinarianId: null,
            veterinarianName: null
          });
        }
        
        // Refresh the list
        fetchClinicVeterinarians();
      } else {
        setStaffError(`Failed to ${status === 'approved' ? 'approve' : 'reject'} request`);
      }
    } catch (err) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} request:`, err);
      setStaffError(getApiErrorResponse(err)?.data?.message || `Failed to ${status === 'approved' ? 'approve' : 'reject'} request`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle removing a veterinarian from the clinic
  const handleRemoveVeterinarian = async (vetId: string) => {
    if (!token || !clinicId) return;

    setActionInProgress(vetId);

    try {
      const response = await axios.delete(
        `${API_URL}/api/clinics/${clinicId}/veterinarian/${vetId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Remove veterinarian response:', response.data);

      if (response.data.success) {
        // Refresh the list
        fetchClinicVeterinarians();
        // Close the modal
        setConfirmModal({
          isOpen: false,
          veterinarianId: null,
          veterinarianName: null
        });
      } else {
        setStaffError('Failed to remove veterinarian');
      }
    } catch (err) {
      console.error('Error removing veterinarian:', err);
      setStaffError(getApiErrorMessage(err, 'Failed to remove veterinarian'));
    } finally {
      setActionInProgress(null);
    }
  };

  // Open the confirmation modal
  const openRemoveConfirmationModal = (staff: VeterinarianData) => {
    setConfirmModal({
      isOpen: true,
      veterinarianId: staff.id,
      veterinarianName: `${staff.user_name} ${staff.user_surname}`
    });
  };

  // Close the confirmation modal
  const closeConfirmationModal = () => {
    setConfirmModal({
      isOpen: false,
      veterinarianId: null,
      veterinarianName: null
    });
  };

  // Open the confirmation modal for approval
  const openApproveConfirmationModal = (request: VeterinarianData) => {
    setApproveModal({
      isOpen: true,
      veterinarianId: request.id,
      veterinarianName: `${request.user_name} ${request.user_surname}`
    });
  };

  // Open the confirmation modal for rejection
  const openRejectConfirmationModal = (request: VeterinarianData) => {
    setRejectModal({
      isOpen: true,
      veterinarianId: request.id,
      veterinarianName: `${request.user_name} ${request.user_surname}`
    });
  };

  // Close the approval confirmation modal
  const closeApproveModal = () => {
    setApproveModal({
      isOpen: false,
      veterinarianId: null,
      veterinarianName: null
    });
  };

  // Close the rejection confirmation modal
  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      veterinarianId: null,
      veterinarianName: null
    });
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!confirmModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center text-red-600 mb-4">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="text-xl font-bold">Remove Veterinarian</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to remove <span className="font-semibold">Dr. {confirmModal.veterinarianName}</span> from your clinic? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeConfirmationModal}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmModal.veterinarianId && handleRemoveVeterinarian(confirmModal.veterinarianId)}
              disabled={actionInProgress === confirmModal.veterinarianId}
              className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors ${
                actionInProgress === confirmModal.veterinarianId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {actionInProgress === confirmModal.veterinarianId ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Approval Confirmation Modal Component
  const ApproveConfirmationModal = () => {
    if (!approveModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center text-green-600 mb-4">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold">Approve Request</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to approve <span className="font-semibold">Dr. {approveModal.veterinarianName}</span>'s request to join your clinic? They will gain access to clinic information.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeApproveModal}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => approveModal.veterinarianId && handleRequestAction(approveModal.veterinarianId, 'approved')}
              disabled={actionInProgress === approveModal.veterinarianId}
              className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors ${
                actionInProgress === approveModal.veterinarianId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {actionInProgress === approveModal.veterinarianId ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rejection Confirmation Modal Component
  const RejectionConfirmationModal = () => {
    if (!rejectModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center text-red-600 mb-4">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold">Reject Request</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to reject <span className="font-semibold">Dr. {rejectModal.veterinarianName}</span>'s request to join your clinic? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeRejectModal}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => rejectModal.veterinarianId && handleRequestAction(rejectModal.veterinarianId, 'rejected')}
              disabled={actionInProgress === rejectModal.veterinarianId}
              className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors ${
                actionInProgress === rejectModal.veterinarianId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {actionInProgress === rejectModal.veterinarianId ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Archive/Restore Confirmation Modal Component
  const ArchiveRestoreModal = () => {
    if (!archiveModal.isOpen) return null;
    
    const isArchive = archiveModal.action === 'archive';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-modal-slide-in">
          <div className="flex items-center mb-4">
            {isArchive ? (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 border border-orange-100 mb-2">
                <svg className="h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 border border-green-100 mb-2">
                <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
            {isArchive ? 'Archive Clinic' : 'Restore Clinic'}
          </h3>
          
          <p className="text-gray-700 text-center mb-6">
            {isArchive 
              ? 'Are you sure you want to archive this clinic? It will be temporarily hidden from search results and appointments will be disabled.'
              : 'Are you sure you want to restore this clinic? It will become visible and operational again.'}
          </p>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setArchiveModal({ isOpen: false, action: null })}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => archiveModal.action && executeStatusChange(archiveModal.action)}
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                isArchive 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-green-600 hover:bg-green-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading 
                ? (isArchive ? 'Archiving...' : 'Restoring...') 
                : (isArchive ? 'Yes, Archive Clinic' : 'Yes, Restore Clinic')
              }
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchClinicData = async () => {
      if (!token || !clinicId) {
        console.error('Missing token or clinicId', { token: !!token, clinicId });
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching clinic data for clinic ID:', clinicId);
        console.log('Current user ID:', userId);
        
        const response = await axios.get(`${API_URL}/api/clinics/${clinicId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const clinicData = response.data.clinic;
        console.log('Clinic data received:', clinicData);
        
        // The owner of the clinic is stored in clinic_operator_id field, not owner_id
        // Convert IDs to strings for comparison to ensure proper type matching
        const clinicOwnerId = String(clinicData.clinic_operator_id);
        const currentUserId = String(userId);
        
        console.log('Comparing clinic operator ID vs current user ID:', { 
          clinicOwnerId, 
          currentUserId,
          isMatch: clinicOwnerId === currentUserId 
        });
        
        // Check if the current user is the operator/owner of the clinic
        if (clinicOwnerId !== currentUserId) {
          console.error('User is not the operator of this clinic');
          setUnauthorized(true);
        } else {
          console.log('User is the clinic operator - authorization successful');
          setClinic(clinicData);
        }
      } catch (err) {
        console.error('Error fetching clinic data:', err);
        if (getApiErrorResponse(err)) {
          console.error('API response error:', {
            status: getApiErrorStatus(err),
            data: getApiErrorResponse(err)?.data
          });
        }
        
        if (getApiErrorStatus(err) === 403) {
          setUnauthorized(true);
        } else {
          setError(getApiErrorMessage(err, 'Failed to fetch clinic data'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
    
    // Hide the default header when this component mounts
    document.body.classList.add('management-dashboard-page');
    
    // Clean up when unmounting
    return () => {
      document.body.classList.remove('management-dashboard-page');
    };
  }, [clinicId, token, userId]);

  // Fetch staff data when active tab changes to staff
  useEffect(() => {
    if (activeTab === 'staff' && clinicId && token) {
      fetchClinicVeterinarians();
    }
    // fetchClinicVeterinarians is in-component; adding it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clinicId, token]);

  // Redirect to home if unauthorized
  useEffect(() => {
    if (unauthorized) {
      console.error('User is not authorized to access this clinic management dashboard');
      navigate('/');
    }
  }, [unauthorized, navigate]);

  // Create styles to hide the DefaultHeader
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    // Hide the default header only on this page
    styleEl.textContent = `
      .management-dashboard-page header {
        display: none !important;
      }
      .management-dashboard-page {
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Handle clinic status change (archive/restore)
  const handleClinicStatusChange = async (action: 'archive' | 'restore') => {
    if (!token || !clinicId) return;
    
    // Open the confirmation modal instead of using browser confirm
    setArchiveModal({
      isOpen: true,
      action: action
    });
  };

  // New function to execute the status change after modal confirmation
  const executeStatusChange = async (action: 'archive' | 'restore') => {
    if (!token || !clinicId) return;
    
    setLoading(true);
    
    try {
      const response = await axios.put(
        `${API_URL}/api/clinics/${action}/${clinicId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log(`Clinic ${action} response:`, response.data);
      
      if (response.data.success) {
        // Update local clinic data
        setClinic(response.data.clinic);
        
        // Close modal
        setArchiveModal({
          isOpen: false,
          action: null
        });
        
        // Could show a success toast here if you have a toast system
      } else {
        setError(`Failed to ${action} clinic`);
      }
    } catch (err) {
      console.error(`Error ${action}ing clinic:`, err);
      setError(getApiErrorMessage(err, `Failed to ${action} clinic`));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
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
      </div>
    );
  }

  // Render different content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Calendar clinicId={clinicId || ''} token={token || ''} />
          </div>
        );
        
      case 'appointment-requests':
        return <ClinicAppointments clinicId={clinicId || ''} />;
        
      case 'upcoming-appointments':
        return <UpcomingAppointments />;
        
      case 'past-appointments':
        return <PastAppointments />;
        
      case 'pet-records':
        return <PetRecords />;
        
      case 'inventory':
        return <InventoryManagement />;
        
      case 'hospitalization':
        return <HospitalizationDashboard clinicId={clinicId || ''} />;
        
      case 'examinations':
        return <ExaminationList />;
      
      case 'diagnoses':
        return <DiagnosisList />;
        
      case 'trust-insight':
        return <ClinicReviews clinicId={clinicId || ''} />;
        
      case 'staff':
        return (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Staff Management</h2>
            </div>
            
            {staffError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{staffError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {staffLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-10 h-10 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Pending Join Requests</h3>
                      <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                        {pendingRequests.length}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="bg-yellow-50 rounded-lg transition-all duration-200 border-2 border-yellow-300 hover:border-yellow-400 overflow-hidden">
                          <div className="p-4 flex justify-between items-center">
                            <div className="flex flex-col">
                              <h3 className="font-medium text-yellow-800">Dr. {request.user_name} {request.user_surname}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800 border border-yellow-300">
                                  Pending Approval
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                                {request.user_phone && (
                                  <span className="inline-flex items-center text-xs text-gray-500">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {request.user_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openApproveConfirmationModal(request)}
                                disabled={actionInProgress === request.id}
                                className={`px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                  actionInProgress === request.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {actionInProgress === request.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => openRejectConfirmationModal(request)}
                                disabled={actionInProgress === request.id}
                                className={`px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                  actionInProgress === request.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {actionInProgress === request.id ? 'Processing...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Staff Members Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Staff Members</h3>
                  
                  {staffMembers.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Your clinic doesn't have any staff members yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staffMembers.map((staff) => (
                        <div key={staff.id} className={`rounded-lg transition-all duration-200 border-2 overflow-hidden ${
                          staff.is_clinic_creator 
                            ? 'bg-purple-50 border-purple-300 hover:border-purple-400' 
                            : 'bg-blue-50 border-blue-300 hover:border-blue-400'
                        }`}>
                          <div className="p-4 flex justify-between items-center">
                            <div className="flex flex-col">
                              <h3 className={`font-medium ${staff.is_clinic_creator ? 'text-purple-800' : 'text-blue-800'}`}>Dr. {staff.user_name} {staff.user_surname}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  staff.is_clinic_creator 
                                    ? 'bg-purple-200 text-purple-800 border border-purple-300' 
                                    : 'bg-blue-200 text-blue-800 border border-blue-300'
                                }`}>
                                  {staff.is_clinic_creator ? 'Clinic Owner' : 'Veterinarian'}
                                </span>
                                {staff.user_phone && (
                                  <span className="inline-flex items-center text-xs text-gray-500">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {staff.user_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!staff.is_clinic_creator && (
                                <button
                                  onClick={() => openRemoveConfirmationModal(staff)}
                                  className={`px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 ${
                                    actionInProgress === staff.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {actionInProgress === staff.id ? 'Removing...' : 'Remove'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
        
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-6">Clinic Settings</h2>
            
            {/* Settings content could be expanded with other options in the future */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Edit Clinic Information
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Update your clinic details, services, and other information
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/edit-clinic/${clinicId}`)}
                      className="flex items-center justify-center text-base font-medium px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Clinic
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="flex items-start p-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        You can update your clinic information such as operating hours, services, location, and contact details. 
                        Changes may require re-verification by administrators.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Danger Zone Section */}
            <div className="mt-10 space-y-6">
              <h3 className="text-lg font-semibold text-red-600 flex items-center">
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Danger Zone
              </h3>
              
              <div className="border border-red-200 rounded-lg overflow-hidden shadow-sm">
                {/* Header */}
                <div className="border-b border-red-200 bg-red-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {clinic?.clinic_verification_status === 'archived' ? 'Restore Clinic' : 'Archive Clinic'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {clinic?.clinic_verification_status === 'archived' 
                          ? 'Make your clinic visible and operational again.' 
                          : 'Temporarily hide your clinic from search results and disable appointments.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClinicStatusChange(clinic?.clinic_verification_status === 'archived' ? 'restore' : 'archive')}
                      className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow transition-all ${
                        clinic?.clinic_verification_status === 'archived'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {clinic?.clinic_verification_status === 'archived' ? 'Restore Clinic' : 'Archive Clinic'}
                    </button>
                  </div>
                </div>
                
                {/* Warning Box */}
                <div className="p-6 bg-white">
                  <div className="flex items-start bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <svg className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h5 className="text-sm font-medium text-yellow-800 mb-1">Important Note</h5>
                      <p className="text-sm text-yellow-700">
                        Frequently changing the clinic status may negatively impact search rankings and indexing. 
                        Use this option only when necessary.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      // Add more cases for other tabs
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/-/g, ' ')}</h3>
              <p className="text-gray-600 mb-4">
                This section is under development. Check back soon!
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Go to Overview
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`bg-white shadow-lg transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } flex flex-col relative`}
      >
        {/* Clinic logo and name */}
        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'items-center' : ''} flex flex-col`}>
          {/* Logo centered at the top */}
          <div className="flex justify-center w-full mb-3">
            <img 
              src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
              alt="Petlyst Logo" 
              className={`${sidebarCollapsed ? 'w-12 h-12' : 'w-16 h-16'} flex-shrink-0`}
            />
          </div>
          
          {/* Clinic name and vet name */}
          {!sidebarCollapsed && (
            <div className="flex flex-col items-center text-center w-full">
              <h1 className="text-lg font-semibold text-gray-800 break-words">
                {getBaseClinicName(clinic?.clinic_name)}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Dr. {getVetName()} {getVetSurname()}</p>
            </div>
          )}
        </div>
        
        {/* Collapse toggle - always visible at sidebar border */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md border border-gray-200 z-10"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d={sidebarCollapsed 
                ? "M13 5l7 7-7 7M5 5l7 7-7 7" 
                : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} 
            />
          </svg>
        </button>
        
        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {menuItems.filter(item => item.name !== 'Return to My Dashboard').map((item, index) => (
              <div key={index}>
                <button
                  onClick={item.subItems ? () => toggleSubmenu(index) : item.onClick}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === item.name.toLowerCase().replace(/\s+/g, '-')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center">
                    <span className={sidebarCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.name}</span>}
                    {!sidebarCollapsed && item.name === 'Staff' && pendingRequests && pendingRequests.length > 0 && activeTab !== 'staff' && (
                      <span className="ml-2 w-5 h-5 flex items-center justify-center bg-yellow-400 text-yellow-800 text-xs font-medium rounded-full">
                        {pendingRequests.length}
                      </span>
                    )}
                  </div>
                  
                  {!sidebarCollapsed && item.subItems && (
                    <svg 
                      className={`w-4 h-4 transition-transform ${item.expanded ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                
                {/* Submenu items */}
                {!sidebarCollapsed && item.expanded && item.subItems && (
                  <div className="mt-1 pl-10 space-y-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={subItem.onClick}
                        className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md ${
                          activeTab === subItem.name.toLowerCase().replace(/\s+/g, '-')
                            ? 'text-blue-700'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span className="mr-3">{subItem.icon}</span>
                        <span>{subItem.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Desktop App Download CTA */}
        <div className={`px-4 py-3 mx-3 my-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg shadow-sm ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          {sidebarCollapsed ? (
            <div className="p-1">
              <svg className="w-7 h-7 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white">Get Desktop App</h4>
                  <p className="text-xs text-blue-100">Offline Sync & Speed</p>
                </div>
              </div>
              <button 
                className="mt-2 w-full inline-flex justify-center items-center px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-xs text-white font-medium rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Now
              </button>
            </>
          )}
        </div>

        {/* User profile in sidebar */}
        <div className={`p-4 border-t border-gray-200 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center justify-center py-2 px-4 border border-red-600 text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-md ${
              sidebarCollapsed ? 'px-2' : ''
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            {!sidebarCollapsed && (
              <span className="ml-2">Return to Dashboard</span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              {activeTab === 'dashboard' 
                ? 'Management Console' 
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/-/g, ' ')}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveTab('settings')}
              className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Page content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {renderContent()}
        </div>
      </div>

      {/* Render the confirmation modals */}
      <ConfirmationModal />
      <ApproveConfirmationModal />
      <RejectionConfirmationModal />
      <ArchiveRestoreModal />
    </div>
  );
};

export default ManagementDashboard;
