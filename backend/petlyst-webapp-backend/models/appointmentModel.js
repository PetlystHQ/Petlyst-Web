const pool = require('../config/db');

// Get all appointments for a pet owner
const getAppointmentsByPetOwner = async (petOwnerId) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.clinic_name, p.pet_name 
       FROM appointments a
       JOIN clinics c ON a.clinic_id = c.clinic_id
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.pet_owner_id = $1
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
      `SELECT a.*, po.first_name, po.last_name, p.pet_name, p.animal_type_id
       FROM appointments a
       JOIN pet_owners po ON a.pet_owner_id = po.pet_owner_id
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.clinic_id = $1
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
      `SELECT a.*, c.clinic_name, po.first_name, po.last_name, p.pet_name
       FROM appointments a
       JOIN clinics c ON a.clinic_id = c.clinic_id
       JOIN pet_owners po ON a.pet_owner_id = po.pet_owner_id
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.appointment_id = $1`,
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
  const {
    petId,
    clinicId,
    petOwnerId,
    appointmentDate,
    appointmentStartHour,
    appointmentEndHour,
    videoMeeting,
    meetingUrl,
    meetingPassword,
    notes
  } = appointmentData;

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
        appointment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *`,
      [
        petId,
        clinicId,
        petOwnerId,
        appointmentDate,
        appointmentStartHour,
        appointmentEndHour,
        videoMeeting || false,
        meetingUrl || null,
        meetingPassword || null,
        notes || null
      ]
    );
    
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

// Get available time slots for a clinic on a specific date
const getAvailableTimeSlots = async (clinicId, date) => {
  try {
    // Get clinic's working hours (assuming there's a table for this)
    // For now, using a default 9 AM - 5 PM schedule with 30-minute slots
    const workingHours = {
      start: '09:00',
      end: '17:00',
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
        slots.push({
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

module.exports = {
  getAppointmentsByPetOwner,
  getAppointmentsByClinic,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableTimeSlots,
  isAppointmentSlotAvailable
};
