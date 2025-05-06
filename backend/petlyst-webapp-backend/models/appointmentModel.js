const pool = require('../config/db');
const generator = require('generate-password')
const {
  notifyUserAppointmentStatusChanged,
  notifyClinicVeterinarians
} = require('../utils/notificationHelper');

// Get all appointments for a pet owner
const getAppointmentsByPetOwner = async (petOwnerId) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.clinic_name, p.pet_name 
       FROM appointments a
       JOIN clinics c ON a.clinic_id = c.clinic_id
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.pet_owner_id = $1
       AND (p.pet_status = 'active' OR p.pet_status IS NULL)
       ORDER BY a.appointment_date, a.appointment_start_hour`,
      [petOwnerId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching pet owner appointments:', error);
    throw error;
  }
};

// Get all appointments for a clinic
const getAppointmentsByClinic = async (clinicId) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.user_name as first_name, u.user_surname as last_name, p.pet_name, p.animal_type_id
       FROM appointments a
       JOIN users u ON a.pet_owner_id = u.user_id
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.clinic_id = $1
       AND (p.pet_status = 'active' OR p.pet_status IS NULL)
       ORDER BY a.appointment_date, a.appointment_start_hour`,
      [clinicId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching clinic appointments:', error);
    throw error;
  }
};

// Get a specific appointment by ID
const getAppointmentById = async (appointmentId) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.clinic_name, u.user_name as first_name, u.user_surname as last_name, p.pet_name
       FROM appointments a
       JOIN clinics c ON a.clinic_id = c.clinic_id
       JOIN users u ON a.pet_owner_id = u.user_id
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.appointment_id = $1
       AND (p.pet_status = 'active' OR p.pet_status IS NULL)`,
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    throw error;
  }
};

// Create a new appointment
const createAppointment = async (appointmentData) => {

const meeting_url = generator.generate({
        length: 15,
        numbers: true,
        uppercase: false,
        lowercase: false,
      }).match(/.{1,3}/g)?.join('-') ?? '';

  const {
    petId,
    clinicId,
    petOwnerId,
    appointmentDate,
    appointmentStartHour,
    appointmentEndHour,
    videoMeeting,
    meetingPassword,
    notes
  } = appointmentData;

  console.log("Creating appointment with data:", {
    petId, clinicId, petOwnerId, appointmentDate,
    appointmentStartHour, appointmentEndHour, videoMeeting, notes
  });

  try {
    const result = await pool.query(
      `INSERT INTO appointments (
        pet_id,
        clinic_id,
        pet_owner_id,
        appointment_date,
        appointment_start_hour,
        appointment_end_hour,
        video_meeting,
        meeting_url,
        meeting_password,
        notes,
        appointment_status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        petId,
        clinicId,
        petOwnerId,
        appointmentDate,
        appointmentStartHour,
        appointmentEndHour,
        videoMeeting || false,
        "Room-ID-" + meeting_url,
        meetingPassword || null,
        notes || null
      ]
    );

    try {
      await notifyClinicVeterinarians(clinicId, 'new', {
        appointmentId: result.rows[0].appointment_id
      });
    } catch (notificationError) {
      console.error('Error sending notification to veterinarians:', notificationError);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

// Update an appointment
const updateAppointment = async (appointmentId, updateData) => {
  const {
    appointmentDate,
    appointmentStartHour,
    appointmentEndHour,
    videoMeeting,
    meetingUrl,
    meetingPassword,
    notes,
    appointmentStatus
  } = updateData;

  try {
    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    // Build dynamic update query
    if (appointmentDate !== undefined) {
      updateFields.push(`appointment_date = $${paramCounter}`);
      values.push(appointmentDate);
      paramCounter++;
    }
    
    if (appointmentStartHour !== undefined) {
      updateFields.push(`appointment_start_hour = $${paramCounter}`);
      values.push(appointmentStartHour);
      paramCounter++;
    }
    
    if (appointmentEndHour !== undefined) {
      updateFields.push(`appointment_end_hour = $${paramCounter}`);
      values.push(appointmentEndHour);
      paramCounter++;
    }
    
    if (videoMeeting !== undefined) {
      updateFields.push(`video_meeting = $${paramCounter}`);
      values.push(videoMeeting);
      paramCounter++;
    }
    
    if (meetingUrl !== undefined) {
      updateFields.push(`meeting_url = $${paramCounter}`);
      values.push(meetingUrl);
      paramCounter++;
    }
    
    if (meetingPassword !== undefined) {
      updateFields.push(`meeting_password = $${paramCounter}`);
      values.push(meetingPassword);
      paramCounter++;
    }
    
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCounter}`);
      values.push(notes);
      paramCounter++;
    }
    
    if (appointmentStatus !== undefined) {
      updateFields.push(`appointment_status = $${paramCounter}`);
      values.push(appointmentStatus);
      paramCounter++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(appointmentId);
    
    const query = `
      UPDATE appointments 
      SET ${updateFields.join(', ')} 
      WHERE appointment_id = $${paramCounter}
      RETURNING *
    `;
    
    try {
      await notifyUserAppointmentStatusChanged(
        userId,
        appointment_status,
        {
          appointmentId: appointment_id,
          clinicId: appointmentDetails.clinic_id,
          petId: appointmentDetails.pet_id
        }
      );
    } catch (notificationError) {
      console.error('Error sending cancellation notification to user:', notificationError);
    }

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Delete an appointment
const deleteAppointment = async (appointmentId) => {
  try {
    const result = await pool.query(
      'DELETE FROM appointments WHERE appointment_id = $1 RETURNING *',
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// Get available dates for a clinic
const getAvailableDates = async (clinicId, numberOfDays = 7, includeToday = false) => {
  try {
    // Get clinic's available days
    const clinicResult = await pool.query(
      `SELECT available_days, is_open_24_7 FROM clinics WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (clinicResult.rows.length === 0) {
      throw new Error('Clinic not found');
    }
    
    const { available_days } = clinicResult.rows[0];
    
    if (!available_days || !Array.isArray(available_days)) {
      throw new Error('Clinic available days not properly configured');
    }
    
    // Generate dates until we find the required number of available days
    const availableDates = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day
    
    // Determine the starting day offset (0 if including today, 1 if starting tomorrow)
    const startOffset = includeToday ? 0 : 1;
    
    // Start from today/tomorrow
    let dayCounter = startOffset;
    
    // Continue searching until we find the required number of available days
    // Limit to a reasonable number of days to prevent infinite loop (e.g., 100 days)
    const maxDaysToCheck = 100;
    
    while (availableDates.length < numberOfDays && dayCounter < maxDaysToCheck) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + dayCounter);
      
      // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      let dayOfWeek = date.getDay();
      
      // Convert JavaScript day to our array index (0 = Monday, ..., 6 = Sunday)
      // In JavaScript, Sunday is 0, but in our array, Monday is 0
      // So we need to convert: JavaScript's 0 (Sunday) becomes our 6, and 1-6 becomes 0-5
      const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Check if clinic is open on this day
      if (available_days[arrayIndex]) {
        availableDates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      }
      
      dayCounter++;
    }
    
    return availableDates;
  } catch (error) {
    console.error('Error getting available dates:', error);
    throw error;
  }
};

// Get available time slots for a clinic on a specific date
const getAvailableTimeSlots = async (clinicId, date) => {
  try {
    // Check if the clinic is open on this day
    const clinicResult = await pool.query(
      `SELECT available_days, opening_time, closing_time, is_open_24_7 FROM clinics WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (clinicResult.rows.length === 0) {
      throw new Error('Clinic not found');
    }
    
    const { available_days, opening_time, closing_time, is_open_24_7 } = clinicResult.rows[0];
    
    // Parse the date to check if it's in available days
    const dateObj = new Date(date);
    let dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Convert to array index (0 = Monday, ..., 6 = Sunday)
    const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Check if clinic is open on this day
    if (!available_days[arrayIndex] && is_open_24_7 !== 'Yes') {
      return []; // Clinic is not open on this day
    }
    
    // Use clinic's actual opening and closing times
    const workingHours = {
      start: is_open_24_7 === 'Yes' ? '00:00' : opening_time || '09:00',
      end: is_open_24_7 === 'Yes' ? '23:30' : closing_time || '17:00',
      slotDuration: 30 // minutes
    };
    
    // Get all appointments for the clinic on the specified date
    const bookedAppointments = await pool.query(
      `SELECT appointment_start_hour, appointment_end_hour 
       FROM appointments 
       WHERE clinic_id = $1 
       AND appointment_date = $2
       AND appointment_status NOT IN ('canceled')`,
      [clinicId, date]
    );
    
    // Generate all possible time slots
    const slots = [];
    const startTime = new Date(`${date}T${workingHours.start}`);
    const endTime = new Date(`${date}T${workingHours.end}`);
    
    let currentSlot = new Date(startTime);
    
    while (currentSlot < endTime) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + workingHours.slotDuration * 60000);
      
      // Check if slot is available (not overlapping with any booked appointment)
      const isAvailable = !bookedAppointments.rows.some(appointment => {
        const appointmentStart = new Date(appointment.appointment_start_hour);
        const appointmentEnd = new Date(appointment.appointment_end_hour);
        
        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        );
      });
      
      if (isAvailable) {
        // Format time as HH:MM
        const startHour = slotStart.getHours().toString().padStart(2, '0');
        const startMinute = slotStart.getMinutes().toString().padStart(2, '0');
        
        slots.push({
          time: `${startHour}:${startMinute}`,
          start: slotStart.toISOString(),
          end: slotEnd.toISOString()
        });
      }
      
      currentSlot = slotEnd;
    }
    
    return slots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

// Check if appointment slot is available
const isAppointmentSlotAvailable = async (clinicId, date, startTime, endTime) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) 
       FROM appointments 
       WHERE clinic_id = $1 
       AND appointment_date = $2
       AND appointment_status NOT IN ('canceled')
       AND (
         (appointment_start_hour <= $3 AND appointment_end_hour > $3) OR
         (appointment_start_hour < $4 AND appointment_end_hour >= $4) OR
         (appointment_start_hour >= $3 AND appointment_end_hour <= $4)
       )`,
      [clinicId, date, startTime, endTime]
    );
    
    return parseInt(result.rows[0].count) === 0;
  } catch (error) {
    console.error('Error checking appointment slot availability:', error);
    throw error;
  }
};

// Check if a veterinarian has access to a specific clinic
async function doesVeterinarianHaveClinicAccess(vetId, clinicId) {
  try {
    console.log(`Checking clinic access for vet ID: ${vetId} and clinic ID: ${clinicId}`);
    
    // If the clinicIds are strings, convert both to numbers for comparison
    const numericVetId = typeof vetId === 'string' ? parseInt(vetId, 10) : vetId;
    const numericClinicId = typeof clinicId === 'string' ? parseInt(clinicId, 10) : clinicId;
    
    console.log(`Using numeric IDs: vetId=${numericVetId}, clinicId=${numericClinicId}`);
    
    const result = await pool.query(
      `SELECT * FROM clinic_veterinarians 
       WHERE veterinarian_id = $1 AND clinic_id = $2 AND status = 'approved'`,
      [numericVetId, numericClinicId]
    );
    
    console.log('Query result:', result.rows);
    const hasAccess = result.rows.length > 0;
    console.log(`Veterinarian has access: ${hasAccess}`);
    
    return hasAccess;
  } catch (error) {
    console.error('Error checking veterinarian clinic access:', error);
    throw error;
  }
}

module.exports = {
  getAppointmentsByPetOwner,
  getAppointmentsByClinic,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableTimeSlots,
  isAppointmentSlotAvailable,
  getAvailableDates,
  doesVeterinarianHaveClinicAccess
};
