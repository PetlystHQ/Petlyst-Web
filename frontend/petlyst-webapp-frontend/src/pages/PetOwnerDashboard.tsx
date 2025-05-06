import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import axiosInstance from "../utils/axiosConfig";
import MyPets from "../components/petowner/MyPets";
import MyProfile from "../components/petowner/MyProfile";
import MyAppointments from "../components/petowner/MyAppointments";
import CreateReviewForm from "../components/petowner/reviews/CreateReviewForm";
import PetHealth from "../components/petowner/health/PetHealth";
import {
  ArrowLeftOnRectangleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeartIcon } from "@heroicons/react/24/solid";

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
  appointment_status: "pending" | "confirmed" | "completed" | "canceled";
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

// Replace Message interface with Review interface
interface Review {
  clinic_review_id: string;
  clinic_id: string;
  clinic_name: string;
  pet_id: string;
  pet_name: string;
  appointment_id: string;
  clinic_review_hygiene_rating: number;
  clinic_review_stuff_behaviour_rating: number;
  clinic_review_price_rating: number;
  comments: string;
  clinic_review_date: string;
  approval_status: "pending" | "approved" | "rejected";
}

// Add a new interface for countdown timer
interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
}

const PetOwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  // States
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [savedClinics, setSavedClinics] = useState<SavedClinic[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedAppointmentIds, setReviewedAppointmentIds] = useState<string[]>([]);
  
  // Add state for countdown timer
  const [timeUntilAppointment, setTimeUntilAppointment] =
    useState<CountdownTime | null>(null);
  const timerRef = useRef<number | null>(null);

  // State for the selected appointment (for review creation)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  
  // State for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  
  // Menu Items
  const menuItems: MenuItem[] = [
    {
      name: "Overview",
      onClick: () => setActiveTab("overview"),
    },
    {
      name: "My Profile",
      onClick: () => setActiveTab("profile"),
    },
    {
      name: "My Pets",
      onClick: () => setActiveTab("pets"),
    },
    {
      name: "Appointments",
      onClick: () => setActiveTab("appointments"),
    },
    {
      name: "Pet Health",
      onClick: () => setActiveTab("petHealth"),
    },
    {
      name: "Saved Clinics",
      onClick: () => setActiveTab("savedClinics"),
    },
    {
      name: "Reviews",
      onClick: () => setActiveTab("reviews"),
    },
  ];
  
  // Fetch data on component mount
  useEffect(() => {
    if (!token) {
      navigate("/login");
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
        case "overview":
          // For overview, fetch pets, appointments and reviews
          await fetchPets();
          await fetchAppointments();
          await fetchReviews();
          break;
        case "pets":
          await fetchPets();
          break;
        case "appointments":
          await fetchAppointments();
          await fetchReviews(); // Değerlendirilen randevuları bilmek için reviews da yükleyelim
          break;
        case "savedClinics":
          await fetchSavedClinics();
          break;
        case "reviews":
          await fetchReviews();
          break;
        case "petHealth":
          await fetchPetHealth();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch pets
  const fetchPets = async () => {
    try {
      const response = await axiosInstance.get("/pets/my-pets");
      if (response.data.success) {
        setPets(response.data.pets || []);
      }
    } catch (err) {
      console.error("Error fetching pets:", err);
      throw err;
    }
  };
  
  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      console.log("PetOwnerDashboard: Fetching appointments from API");
      const response = await axiosInstance.get("/appointments/pet-owner");
      
      if (response.data && response.data.success) {
        console.log(
          "PetOwnerDashboard: Successfully fetched appointments:",
          response.data.appointments.length,
        );
        setAppointments(response.data.appointments || []);
      } else {
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      throw err;
    }
  };
  
  // Fetch saved clinics
  const fetchSavedClinics = async () => {
    try {
      const response = await axiosInstance.get("/pet-owners/saved-clinics");
      if (response.data.success) {
        setSavedClinics(response.data.favorites || []);
      }
    } catch (err) {
      console.error("Error fetching saved clinics:", err);
      throw err;
    }
  };
  
  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get("/reviews/pet-owner");
      if (response.data) {
        setReviews(response.data || []);
        
        // Hangi randevuların değerlendirildiğini belirleyelim
        const reviewedIds = response.data.map((review: Review) => review.appointment_id);
        setReviewedAppointmentIds(reviewedIds);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      throw err;
    }
  };
  
  // Fetch pet health
  const fetchPetHealth = async () => {
    // PetHealth bileşeni kendi içinde veri çektiği için burada bir şey yapmaya gerek yok
    console.log('PetOwnerDashboard: Pet Health sekmesi açıldı');
  };
  
  // Handle removing a saved clinic
  const handleRemoveFavorite = async (clinicId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/pet-owners/saved-clinics/${clinicId}`,
      );
      
      if (response.data.success) {
        // Remove the clinic from the list
        setSavedClinics(
          savedClinics.filter((clinic) => clinic.clinic_id !== clinicId),
        );
      }
    } catch (err) {
      console.error("Error removing clinic from favorites:", err);
      setError("Failed to remove clinic from favorites. Please try again.");
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Dispatch the logout action to clear auth state
    dispatch(logout());
    // Navigate to home page instead of login
    navigate("/");
  };
  
  // Handle navigation to home
  const handleGoHome = () => {
    navigate("/");
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      return null; // Return null for invalid dates
    }
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };
  
  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    
    try {
      // Extract the time portion if it's a full ISO datetime
      const timePart = timeStr.includes("T")
        ? timeStr.split("T")[1].substring(0, 5)
        : timeStr.includes(":")
          ? timeStr.substring(0, 5)
          : timeStr;
        
      return timePart;
    } catch (e) {
      console.error("Error formatting time:", e);
      return "";
    }
  };
  
  // Render profile content
  const renderProfile = () => {
    return (
      <MyProfile 
        loading={loading && activeTab === "profile"}
        error={error && activeTab === "profile" ? error : null}
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
    return (
      <MyAppointments 
        appointments={appointments}
        reviewedAppointmentIds={reviewedAppointmentIds}
        loading={loading}
        error={error}
        onAppointmentCanceled={fetchAppointments}
        onLeaveReview={handleLeaveReview}
        setActiveTab={setActiveTab}
      />
    );
  };
  
  // Render saved clinics content
  const renderSavedClinics = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Saved Clinics
        </h2>
        
        {savedClinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedClinics.map((clinic) => (
              <div 
                key={clinic.clinic_id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  navigate(`/clinics/${clinic.slug || clinic.clinic_id}`)
                }
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {clinic.clinic_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {clinic.province}, {clinic.district}
                    </p>
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
                    {clinic.clinic_type
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clinics/${clinic.slug || clinic.clinic_id}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Clinic
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No saved clinics
            </h3>
            <p className="text-gray-600 mb-4">
              Explore clinics and save your favorites for quick access
            </p>
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              onClick={() => navigate("/")}
            >
              Explore Clinics
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Handler for when a user clicks "Leave Review" on an appointment
  const handleLeaveReview = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewForm(true);
    setActiveTab("reviews");
  };

  // Handler for when a review is successfully submitted
  const handleReviewSubmitSuccess = () => {
    setShowReviewForm(false);
    setSelectedAppointment(null);
    fetchReviews(); // Refresh the reviews list
  };

  // Handler for when a user cancels creating a review
  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setSelectedAppointment(null);
  };
  
  // Handler for deleting a review
  const handleDeleteReview = async (reviewId: string) => {
    // Show modal instead of using window.confirm
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  };
  
  // Confirm delete review
  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      setLoading(true);
      await axiosInstance.delete(`/reviews/${reviewToDelete}`);
      
      // Remove the deleted review from the state
      const deletedReview = reviews.find(review => review.clinic_review_id === reviewToDelete);
      setReviews(reviews.filter(review => review.clinic_review_id !== reviewToDelete));
      
      // Remove the appointment ID from the reviewed appointments
      if (deletedReview) {
        setReviewedAppointmentIds(reviewedAppointmentIds.filter(id => id !== deletedReview.appointment_id));
      }
      
      // Hide the modal
      setShowDeleteModal(false);
      setReviewToDelete(null);
      setLoading(false);
    } catch (error) {
      console.error("Error deleting review:", error);
      setError("Failed to delete review. Please try again.");
      setLoading(false);
    }
  };
  
  // Cancel delete review
  const cancelDeleteReview = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };
  
  // Handler for editing a review - we'll redirect to the review form and pre-fill it
  const handleEditReview = (review: Review) => {
    // Find the appointment associated with this review
    const appointment = appointments.find(app => app.appointment_id === review.appointment_id);
    
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowReviewForm(true);
      
      // We also need to pass the review data to pre-fill the form
      // This will be done in the renderReviews function
    } else {
      // If appointment isn't found in state, fetch it and then edit
      console.error("Appointment not found for review:", review);
      setError("Could not find the appointment details for this review.");
    }
  };

  // Render reviews content
  const renderReviews = () => {
    // If showing review form, render the form instead of the reviews list
    if (showReviewForm && selectedAppointment) {
      // Get the existing review if this is an edit operation
      const existingReview = reviews.find(
        review => review.appointment_id === selectedAppointment.appointment_id
      );
      
    return (
        <CreateReviewForm
          appointmentId={selectedAppointment.appointment_id}
          clinicId={selectedAppointment.clinic_id}
          clinicName={selectedAppointment.clinic_name}
          petId={selectedAppointment.pet_id}
          petName={selectedAppointment.pet_name}
          appointmentDate={selectedAppointment.appointment_date}
          appointmentStartHour={selectedAppointment.appointment_start_hour}
          appointmentEndHour={selectedAppointment.appointment_end_hour}
          existingReview={existingReview}
          onSubmitSuccess={handleReviewSubmitSuccess}
          onCancel={handleReviewCancel}
        />
      );
    }

    // Function to calculate average rating
    const calculateAverageRating = (review: Review) => {
      const sum =
        review.clinic_review_hygiene_rating +
        review.clinic_review_stuff_behaviour_rating +
        review.clinic_review_price_rating;
      return (sum / 3).toFixed(1);
    };

    // Function to get status badge details based on status
    const getStatusDetails = (status: string) => {
      switch (status) {
        case "approved":
          return {
            bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
            textColor: "text-green-800",
            borderColor: "border-green-200",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            icon: (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )
          };
        case "pending":
          return {
            bgColor: "bg-gradient-to-r from-yellow-50 to-amber-50",
            textColor: "text-amber-800",
            borderColor: "border-yellow-200",
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
            icon: (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )
          };
        case "rejected":
          return {
            bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
            textColor: "text-red-800",
            borderColor: "border-red-200",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            icon: (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )
          };
        default:
          return {
            bgColor: "bg-gray-50",
            textColor: "text-gray-800",
            borderColor: "border-gray-200",
            iconBg: "bg-gray-100",
            iconColor: "text-gray-600",
            icon: null
          };
      }
    };

    // For the Delete Confirmation Modal - ensure it covers the entire page with dark overlay
    const DeleteConfirmationModal = () => {
      if (!showDeleteModal) return null;
      
      const review = reviews.find(r => r.clinic_review_id === reviewToDelete);
      if (!review) return null;
      
      return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Dark overlay with animation */}
          <div className="fixed inset-0 bg-black opacity-75 transition-opacity duration-300"></div>
          
          {/* Modal container with animation - improved centering */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-lg transform transition-all duration-300 ease-out">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900">Delete Review</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete your review for <span className="font-semibold text-gray-700">{review.clinic_name}</span>? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button 
                  onClick={confirmDeleteReview}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Delete Review'
                  )}
                </button>
                <button 
                  onClick={cancelDeleteReview}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
                </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal />
        
        {/* Page Header with decorative elements */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <circle cx="400" cy="400" r="200" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="400" cy="400" r="300" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="400" cy="400" r="100" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="400" cy="400" r="50" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">My Reviews</h2>
              <p className="text-blue-100 mt-1">
                Share and manage your feedback for pet care services
              </p>
            </div>
            <button
              onClick={() => setActiveTab("appointments")}
              className="inline-flex items-center px-4 py-2 bg-white text-blue-700 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors duration-200 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Review
                  </button>
                </div>
              </div>

        {/* Content */}
        <div className="p-8">
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reviews.map((review) => {
                const statusDetails = getStatusDetails(review.approval_status);
                const avgRating = parseFloat(calculateAverageRating(review));
                
                return (
                  <div
                    key={review.clinic_review_id}
                    className="group bg-white border border-gray-200 hover:border-blue-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Card Header with gradient background based on status */}
                    <div className={`px-5 py-4 ${statusDetails.bgColor} border-b ${statusDetails.borderColor} flex justify-between items-center`}>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {review.clinic_name}
                        </h3>
                      </div>
                      <div className={`flex items-center rounded-full px-3 py-1 ${statusDetails.bgColor} ${statusDetails.textColor} text-xs font-medium border border-current`}>
                        <span className={`flex-shrink-0 mr-1.5 p-1 rounded-full ${statusDetails.iconBg} ${statusDetails.iconColor}`}>
                          {statusDetails.icon}
                        </span>
                        <span>{review.approval_status.charAt(0).toUpperCase() + review.approval_status.slice(1)}</span>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-5">
                      {/* Pet and date info */}
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <div className="bg-blue-50 rounded-full p-1.5 mr-2">
                          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-700">
                          Pet: {review.pet_name}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span>
                          {formatDate(review.clinic_review_date) || "No date"}
                        </span>
                      </div>
                      
                      {/* Overall Rating - with star animation on hover */}
                      <div className="mb-5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                          <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex items-center mr-2 group-hover:animate-pulse">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg 
                                      key={star}
                                      className={`h-5 w-5 ${star <= avgRating ? 'text-amber-400' : 'text-gray-300'}`} 
                                      fill="currentColor" 
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-lg font-bold text-gray-800">{avgRating}</span>
                              </div>
                              <span className="text-amber-600 text-sm font-medium">Overall Rating</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating Categories - with hover effects */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="flex flex-col items-center bg-gray-50 hover:bg-blue-50 p-3 rounded-lg transition-colors duration-200 cursor-default">
                          <span className="text-xs text-gray-500 mb-1">Hygiene</span>
                          <div className="flex items-center">
                            <span className="text-blue-500 mr-1">★</span>
                            <span className="font-medium">{review.clinic_review_hygiene_rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center bg-gray-50 hover:bg-purple-50 p-3 rounded-lg transition-colors duration-200 cursor-default">
                          <span className="text-xs text-gray-500 mb-1">Staff</span>
                          <div className="flex items-center">
                            <span className="text-purple-500 mr-1">★</span>
                            <span className="font-medium">{review.clinic_review_stuff_behaviour_rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center bg-gray-50 hover:bg-green-50 p-3 rounded-lg transition-colors duration-200 cursor-default">
                          <span className="text-xs text-gray-500 mb-1">Price</span>
                          <div className="flex items-center">
                            <span className="text-green-500 mr-1">★</span>
                            <span className="font-medium">{review.clinic_review_price_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Comments with decorative quote marks */}
                      {review.comments && (
                        <div className="relative bg-gradient-to-r from-gray-50 to-white px-5 py-4 rounded-lg mb-5 border-l-4 border-indigo-300">
                          <div className="absolute left-2 top-2 text-indigo-200 opacity-50">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                          </div>
                          <div className="text-gray-700 text-sm italic pl-5">
                            {review.comments}
                          </div>
                          <div className="absolute right-2 bottom-2 text-indigo-200 opacity-50">
                            <svg className="h-6 w-6 transform rotate-180" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Actions with improved hover effects */}
                      <div className="flex justify-end border-t border-gray-100 pt-4 mt-3">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="inline-flex items-center px-3 py-1.5 mr-3 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit Review
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.clinic_review_id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-ping"></div>
                <div className="relative bg-blue-50 rounded-full p-6 shadow-md">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">No Reviews Yet</h3>
              <p className="text-gray-600 text-center max-w-md mb-8 px-6">
                Share your feedback after appointments to help other pet owners find the best care for their pets. Your reviews make a difference!
              </p>
              <button
                onClick={() => setActiveTab("appointments")}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md transform hover:-translate-y-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Go to My Appointments
              </button>
          </div>
        )}
        </div>
      </div>
    );
  };
  
  // Add a function to calculate the time remaining until the next appointment
  const calculateTimeRemaining = (
    appointmentDate: string,
    appointmentTime: string,
  ): CountdownTime | null => {
    try {
      // For debugging
      console.log("Raw inputs:", { appointmentDate, appointmentTime });
      
      const now = new Date();
      
      // Use the appointmentTime as the canonical source since it contains the actual appointment time
      // This handles the UTC to local conversion automatically
      const appointmentDateTime = new Date(appointmentTime);
      
      console.log("Appointment datetime:", appointmentDateTime);
      
      // Check if valid
      if (isNaN(appointmentDateTime.getTime())) {
        console.error("Invalid appointment datetime");
        return { days: 0, hours: 0, minutes: 0 };
      }
      
      // If in past, return zeros
      if (appointmentDateTime <= now) {
        console.log("Appointment is in the past");
        return { days: 0, hours: 0, minutes: 0 };
      }
      
      // Calculate difference
      const diffMs = appointmentDateTime.getTime() - now.getTime();
      console.log("Time difference in ms:", diffMs);
      
      // Convert to days, hours, minutes
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log("Calculated time remaining:", { days, hours, minutes });
      return { days, hours, minutes };
    } catch (error) {
      console.error("Error in countdown calculation:", error);
      return { days: 0, hours: 0, minutes: 0 };
    }
  };
  
  // Update the timer every minute
  useEffect(() => {
    if (activeTab === "overview") {
      // Filter confirmed appointments
      const confirmedAppointments = appointments.filter(
        (app) => app.appointment_status === "confirmed",
      );
      
      // Sort by date
      const upcomingAppointments = [...confirmedAppointments].sort((a, b) => {
        const dateA = new Date(
          `${a.appointment_date}T${a.appointment_start_hour}`,
        );
        const dateB = new Date(
          `${b.appointment_date}T${b.appointment_start_hour}`,
        );
        return dateA.getTime() - dateB.getTime();
      });
      
      const nextAppointment =
        upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
      
      if (nextAppointment) {
        // Log appointment data for debugging
        console.log("Next appointment data:", {
          date: nextAppointment.appointment_date,
          startHour: nextAppointment.appointment_start_hour,
          fullData: nextAppointment,
        });
        
        // Initial calculation
        const initialCountdown = calculateTimeRemaining(
          nextAppointment.appointment_date, 
          nextAppointment.appointment_start_hour,
        );
        console.log("Initial countdown:", initialCountdown);
        setTimeUntilAppointment(initialCountdown);
        
        // Set up interval for updates
        const intervalId = window.setInterval(() => {
          setTimeUntilAppointment(
            calculateTimeRemaining(
              nextAppointment.appointment_date,
              nextAppointment.appointment_start_hour,
            ),
          );
        }, 60000); // Update every minute
        
        timerRef.current = intervalId as unknown as number;
        
        return () => {
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        };
      }
    }
    
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeTab, appointments]);
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "profile":
        return renderProfile();
      case "pets":
        return renderPets();
      case "appointments":
        return renderAppointments();
      case "savedClinics":
        return renderSavedClinics();
      case "reviews":
        return renderReviews();
      case "petHealth":
        return renderPetHealth();
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
    const randomPet =
      pets.length > 0 ? pets[Math.floor(Math.random() * pets.length)] : null;
    
    // Filter confirmed appointments
    const confirmedAppointments = appointments.filter(
      (app) => app.appointment_status === "confirmed",
    );
    
    // Sort confirmed appointments by date (earliest first)
    const upcomingAppointments = [...confirmedAppointments].sort((a, b) => {
      const dateA = new Date(
        `${a.appointment_date}T${a.appointment_start_hour}`,
      );
      const dateB = new Date(
        `${b.appointment_date}T${b.appointment_start_hour}`,
      );
      return dateA.getTime() - dateB.getTime();
    });
    
    // Get the next appointment (if any)
    const nextAppointment =
      upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Dashboard Overview
        </h2>
        
        {/* Pet Wellbeing Message - Now at the top */}
        {pets.length > 0 && (
          <div className="mb-8 border-l-4 border-emerald-400 pl-4 py-2">
            <div className="bg-gradient-to-r from-emerald-50 to-transparent p-4 rounded-r-lg">
              <h3 className="text-lg font-medium text-emerald-800 mb-2">
                {greeting}, {user?.name || "Friend"}!
              </h3>
              
              <p className="text-emerald-700 mb-3">
                {randomPet
                  ? `${randomPet.pet_name} wants to spend time with you today. Have you checked your furry friend's food and water bowls?`
                  : "Your furry friends might be missing you today. Would you like to spend some time with them?"}
              </p>
              
              <p className="text-emerald-600 italic text-sm">
                "The bond with animals is one of the most beautiful feelings
                that nourishes the love within us."
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {/* Confirmed Appointments Card - First and only show if there are confirmed appointments */}
          {confirmedAppointments.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Confirmed Appointments
              </h3>
              
              {/* Replace count with countdown timer */}
              {nextAppointment && timeUntilAppointment && (
                <div className="flex items-center space-x-4 mb-3">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-green-600">
                      {timeUntilAppointment.days}
                    </span>
                    <p className="text-xs text-gray-500">days</p>
                  </div>
                  <span className="text-green-600 font-bold">:</span>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-green-600">
                      {timeUntilAppointment.hours}
                    </span>
                    <p className="text-xs text-gray-500">hours</p>
                  </div>
                  <span className="text-green-600 font-bold">:</span>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-green-600">
                      {timeUntilAppointment.minutes}
                    </span>
                    <p className="text-xs text-gray-500">minutes</p>
                  </div>
                </div>
              )}
              
              {nextAppointment && (
                <div className="mt-2 bg-white p-3 rounded-md border border-green-100">
                  <p className="text-sm font-medium text-gray-700 flex items-center mb-1">
                    <span className="mr-2 text-lg">🗓️</span> Next appointment:
                  </p>
                  <p className="font-medium text-lg text-gray-800 mb-1">
                    {formatDate(nextAppointment.appointment_date)}{" "}
                    <span className="ml-2 text-gray-600">
                      {formatTime(nextAppointment.appointment_start_hour)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    {nextAppointment.clinic_name}
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => setActiveTab("appointments")}
                className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium"
              >
                View all appointments
              </button>
            </div>
          )}
          
          {/* Pets Card - Second */}
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-medium text-gray-800 mb-2">My Pets</h3>
            {pets.length === 1 ? (
              <>
                <p className="text-xl font-bold text-blue-600">
                  {pets[0].pet_name}
                </p>
                <p className="text-sm text-blue-500">
                  {pets[0].pet_type} - {pets[0].pet_breed}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-blue-600">{pets.length}</p>
            )}
            <button 
              onClick={() => setActiveTab("pets")}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all pets
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render pet health content
  const renderPetHealth = () => {
    return (
      <PetHealth 
        pets={pets}
        loading={loading && activeTab === "petHealth"}
        error={error && activeTab === "petHealth" ? error : null}
      />
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
            <h1 className="text-xl font-bold text-gray-800 mb-1">
              Pet Owner Dashboard
            </h1>
            <div className="bg-blue-50 w-full rounded-md p-2 mt-2 text-center border border-blue-100">
              <p className="font-medium text-blue-700">
                Welcome, {user?.name || "Guest"}!
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
                      ${
                        activeTab === item.name.toLowerCase().replace(" ", "")
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
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
                <span className="mr-2">
                  <HomeIcon className="w-5 h-5" />
                </span>
                <span className="font-medium">Home</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-3 py-2.5 rounded-md transition-colors
                  bg-red-50 text-red-700 hover:bg-red-100"
              >
                <span className="mr-2">
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                </span>
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
