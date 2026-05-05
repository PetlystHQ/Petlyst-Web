import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getApiErrorResponse } from '../../utils/errorMessage';


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

interface MyAppointmentsProps {
  appointments?: Appointment[];
  reviewedAppointmentIds?: string[];
  loading?: boolean;
  error?: string | null;
  onAppointmentCanceled?: () => void;
  onLeaveReview?: (appointment: Appointment) => void;
  setActiveTab?: (tab: string) => void;
}

const MyAppointments: React.FC<MyAppointmentsProps> = ({
  appointments: externalAppointments,
  reviewedAppointmentIds = [],
  loading: externalLoading,
  error: externalError,
  onAppointmentCanceled,
  onLeaveReview,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);

  // States
  const [appointments, setAppointments] = useState<Appointment[]>(
    externalAppointments || [],
  );
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState<boolean>(externalLoading || false);
  const [error, setError] = useState<string | null>(externalError || null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // Update internal state when external appointments change
  useEffect(() => {
    if (externalAppointments) {
      console.log(
        "Received external appointments:",
        externalAppointments.length,
      );
      setAppointments(externalAppointments);
    }
  }, [externalAppointments]);

  // Fetch appointments
  useEffect(() => {
    console.log("MyAppointments component mounted");
    console.log("Current token:", token);

    if (!token) {
      console.warn("No token found, redirecting to login");
      navigate("/login");
      return;
    }

    fetchAppointments();
  }, [token]);

  // Apply filters and sorting
  useEffect(() => {
    console.log(
      "Applying filters and sorting to appointments:",
      appointments.length,
    );

    let filtered = [...appointments];

    // Apply status filter
    if (statusFilter !== "all") {
      console.log("Filtering by status:", statusFilter);
      filtered = filtered.filter(
        (appointment) => appointment.appointment_status === statusFilter,
      );
    }

    // Apply sorting (by date and time)
    filtered.sort((a, b) => {
      // Create Date objects with the appointment date and time
      const dateTimeA = new Date(
        `${a.appointment_date}T${a.appointment_start_hour}`,
      );
      const dateTimeB = new Date(
        `${b.appointment_date}T${b.appointment_start_hour}`,
      );

      // Check if the date objects are valid
      const isValidDateA = !isNaN(dateTimeA.getTime());
      const isValidDateB = !isNaN(dateTimeB.getTime());

      // If both dates are valid, compare them
      if (isValidDateA && isValidDateB) {
        return sortOrder === "asc"
          ? dateTimeA.getTime() - dateTimeB.getTime()
          : dateTimeB.getTime() - dateTimeA.getTime();
      }

      // If one or both dates are invalid, fall back to string comparison
      const stringA = `${a.appointment_date} ${a.appointment_start_hour}`;
      const stringB = `${b.appointment_date} ${b.appointment_start_hour}`;
      return sortOrder === "asc"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });

    console.log("Filtered appointments count:", filtered.length);
    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, sortOrder]);

  // Fetch appointments
  const fetchAppointments = async () => {
    // If appointments are provided externally, don't fetch
    if (externalAppointments && externalAppointments.length > 0) {
      console.log("Using externally provided appointments, skipping fetch");
      return;
    }

    if (externalLoading !== undefined) {
      console.log("External loading is defined, skipping fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        "Fetching appointments from /appointments/pet-owner endpoint",
      );
      const response = await axiosInstance.get("/appointments/pet-owner");
      console.log("Raw response:", response);
      console.log("Response status:", response.status);
      console.log("Response from appointments API:", response.data);

      // Check if response contains data and is successful
      if (response.data && response.data.success) {
        const appointmentsData = response.data.appointments || [];
        console.log("Number of appointments found:", appointmentsData.length);

        // Log the first appointment for debugging if available
        if (appointmentsData.length > 0) {
          console.log("First appointment data:", appointmentsData[0]);
        }

        setAppointments(appointmentsData);
      } else {
        console.warn(
          "No appointments found or invalid response format:",
          response.data,
        );
        setAppointments([]);
        // If response is not successful but has an error message
        if (response.data && !response.data.success && response.data.error) {
          setError(response.data.error);
        }
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      console.error("Error response:", getApiErrorResponse(err)?.data);
      setError(getApiErrorResponse(err)?.data?.error || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (timeStr: string) => {
    // Check if timeStr is a properly formatted ISO time string
    if (!timeStr) return "N/A";

    try {
      // Extract the time portion if it's a full ISO datetime
      const timePart = timeStr.includes("T")
        ? timeStr.split("T")[1].substring(0, 5)
        : timeStr.substring(0, 5);

      return timePart;
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeStr;
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async (appointmentId: string) => {
    setCancelingId(appointmentId);

    try {
      const response = await axiosInstance.patch(
        `/appointments/${appointmentId}/cancel`,
      );

      if (response.data) {
        // Yeni bir dizi oluştur, sadece iptal edilen randevuyu güncelle
        const updatedAppointments = appointments.map((appointment) =>
          appointment.appointment_id === appointmentId
            ? { ...appointment, appointment_status: "canceled" as const }
            : appointment,
        );

        // State'i güncelle
        setAppointments(updatedAppointments);

        // Filtered appointments'ı da güncelle
        const updatedFilteredAppointments = filteredAppointments.map(
          (appointment) =>
            appointment.appointment_id === appointmentId
              ? { ...appointment, appointment_status: "canceled" as const }
              : appointment,
        );

        setFilteredAppointments(updatedFilteredAppointments);

        // Debug log
        console.log("Appointment canceled:", appointmentId);
        console.log("Updated appointments count:", updatedAppointments.length);

        // Notify parent component if needed
        if (onAppointmentCanceled) {
          onAppointmentCanceled();
        }
      }
    } catch (err) {
      console.error("Error canceling appointment:", err);
      setError(getApiErrorResponse(err)?.data?.error || "Failed to cancel appointment");
    } finally {
      setCancelingId(null);
      setShowCancelModal(false);
      setSelectedAppointment(null);
    }
  };

  // Open cancel modal
  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  // Join online meeting
  const joinMeeting = (appointment: Appointment) => {
    if (appointment.meeting_url) {
      // URL protokolü kontrolü
      const meetingUrl = appointment.meeting_url.startsWith('http') 
        ? appointment.meeting_url 
        : `https://${appointment.meeting_url}`;
      
      console.log('Opening meeting URL:', meetingUrl);
      window.open(meetingUrl, "_blank");
    } else {
      alert("No meeting URL available. Please contact the clinic.");
    }
  };

  // Handle leave review
  const handleLeaveReview = (appointment: Appointment) => {
    if (onLeaveReview) {
      onLeaveReview(appointment);
    }

    // Navigate to reviews tab if setActiveTab is provided
    if (setActiveTab) {
      setActiveTab("reviews");
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = "";

    switch (status) {
      case "confirmed":
        colorClass = "bg-green-100 text-green-800";
        break;
      case "pending":
        colorClass = "bg-yellow-100 text-yellow-800";
        break;
      case "completed":
        colorClass = "bg-blue-100 text-blue-800";
        break;
      case "canceled":
        colorClass = "bg-red-100 text-red-800";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        <p>{error}</p>
        <button
          onClick={fetchAppointments}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">My Appointments</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-gray-700 leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Sort button */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <span>
              Sort: {sortOrder === "asc" ? "Earliest First" : "Latest First"}
            </span>
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Appointment
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your appointment at{" "}
              <span className="font-medium">
                {selectedAppointment.clinic_name}
              </span>{" "}
              on{" "}
              <span className="font-medium">
                {formatDate(selectedAppointment.appointment_date)}
              </span>{" "}
              at{" "}
              <span className="font-medium">
                {formatTime(selectedAppointment.appointment_start_hour)}
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                No, Keep It
              </button>
              <button
                onClick={() =>
                  handleCancelAppointment(selectedAppointment.appointment_id)
                }
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                disabled={cancelingId === selectedAppointment.appointment_id}
              >
                {cancelingId === selectedAppointment.appointment_id ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Canceling...
                  </div>
                ) : (
                  "Yes, Cancel Appointment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredAppointments.length > 0 ? (
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full px-4 sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Clinic
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pet
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment, index) => (
                    <tr key={`${appointment.appointment_id}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.clinic_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {appointment.pet_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {formatDate(appointment.appointment_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(appointment.appointment_start_hour)} -{" "}
                          {formatTime(appointment.appointment_end_hour)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={appointment.appointment_status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.video_meeting
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {appointment.video_meeting ? "Online" : "In-person"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          {/* Join online meeting - only for confirmed online meetings */}
                          {appointment.appointment_status === "confirmed" &&
                            appointment.video_meeting && (
                              <button
                                onClick={() => joinMeeting(appointment)}
                                className="text-purple-600 hover:text-purple-900 transition-colors mx-2 bg-purple-100 px-3 py-1 rounded-md text-sm font-medium"
                                title="Join online meeting"
                              >
                                Join
                              </button>
                            )}

                          {/* Cancel appointment - only for pending or confirmed appointments */}
                          {(appointment.appointment_status === "pending" ||
                            appointment.appointment_status === "confirmed") && (
                            <button
                              onClick={() => openCancelModal(appointment)}
                              className="text-red-600 hover:text-white hover:bg-red-600 transition-colors bg-red-100 px-3 py-1 rounded-md text-sm font-medium"
                              title="Cancel appointment"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Leave review button - only for completed appointments that haven't been reviewed yet */}
                          {appointment.appointment_status === "completed" && 
                           !reviewedAppointmentIds.includes(appointment.appointment_id) && (
                            <button
                              onClick={() => handleLeaveReview(appointment)}
                              className="text-green-600 hover:text-white hover:bg-green-600 transition-colors bg-green-100 px-3 py-1 rounded-md text-sm font-medium"
                              title="Leave a review for this appointment"
                            >
                              Leave Review
                            </button>
                          )}

                          {/* Show "Already Reviewed" indicator for completed appointments that have been reviewed */}
                          {appointment.appointment_status === "completed" && 
                           reviewedAppointmentIds.includes(appointment.appointment_id) && (
                            <span className="text-gray-600 px-3 py-1 rounded-md text-sm font-medium bg-gray-100">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No appointments found
            </h3>

            {statusFilter !== "all" ? (
              <div className="text-center">
                <p className="text-gray-600 mb-3">
                  You don't have any {statusFilter} appointments
                </p>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Show all appointments
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-center">
                Your appointment schedule is currently empty. You can schedule
                an appointment by visiting a clinic page.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
