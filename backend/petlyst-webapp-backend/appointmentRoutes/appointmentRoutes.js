const express = require('express');
const router = express.Router();
const appointmentModel = require('../models/appointmentModel');
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');

// Get all appointments for authenticated pet owner
router.get('/pet-owner', authenticateToken, async (req, res) => {
  try {
    // Only pet owners can access this route
    if (req.user.userType !== 'pet_owner') {
      return res.status(403).json({ error: 'Access denied. Pet owner access only.' });
    }

    const appointments = await appointmentModel.getAppointmentsByPetOwner(req.user.userId);
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching pet owner appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get all appointments for authenticated clinic
router.get('/clinic', authenticateToken, async (req, res) => {
  try {
    // Validate user type (assuming clinics use veterinarian user type)
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ error: 'Access denied. Clinic/veterinarian access only.' });
    }

    const clinicId = req.user.clinicId;
    const appointments = await appointmentModel.getAppointmentsByClinic(clinicId);
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching clinic appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get a specific appointment by ID
router.get('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentModel.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Ensure user has access to this appointment (either pet owner or clinic)
    if (
      (req.user.userType === 'pet_owner' && appointment.pet_owner_id !== req.user.userId) &&
      (req.user.userType === 'veterinarian' && appointment.clinic_id !== req.user.clinicId)
    ) {
      return res.status(403).json({ error: 'Access denied. Not authorized to view this appointment.' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
});

// Create a new appointment
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only pet owners can create appointments
    if (req.user.userType !== 'pet_owner') {
      return res.status(403).json({ error: 'Access denied. Only pet owners can create appointments.' });
    }

    const {
      petId,
      clinicId,
      appointmentDate,
      appointmentStartHour,
      appointmentEndHour,
      videoMeeting,
      notes
    } = req.body;

    console.log("Received appointment data:", { 
      petId, clinicId, appointmentDate, 
      appointmentStartHour, appointmentEndHour, 
      videoMeeting, notes 
    });

    // Validate required fields
    if (!petId || !clinicId || !appointmentDate || !appointmentStartHour || !appointmentEndHour) {
      return res.status(400).json({ error: 'Missing required appointment information' });
    }

    // Check if the selected time slot is available
    const isAvailable = await appointmentModel.isAppointmentSlotAvailable(
      clinicId,
      appointmentDate,
      appointmentStartHour,
      appointmentEndHour
    );

    if (!isAvailable) {
      return res.status(409).json({ error: 'Selected appointment slot is not available' });
    }

    // Create appointment with the pet owner ID from authenticated user
    const appointmentData = {
      petId,
      clinicId,
      petOwnerId: req.user.userId,
      appointmentDate,
      appointmentStartHour,
      appointmentEndHour,
      videoMeeting,
      meetingUrl: null,  // Will be set by clinic later if needed
      meetingPassword: null, // Will be set by clinic later if needed
      notes
    };

    const newAppointment = await appointmentModel.createAppointment(appointmentData);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update an appointment
router.put('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentModel.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Determine if user has permission to update this appointment
    let canUpdate = false;
    
    // Pet owners can update their own appointments but only certain fields
    if (req.user.userType === 'pet_owner' && appointment.pet_owner_id === req.user.userId) {
      canUpdate = true;
      
      // Pet owners can only update these fields
      const allowedFields = ['notes', 'videoMeeting'];
      const updateFields = Object.keys(req.body);
      
      // Check if trying to update restricted fields
      const hasRestrictedField = updateFields.some(field => !allowedFields.includes(field));
      
      if (hasRestrictedField) {
        return res.status(403).json({ 
          error: 'Pet owners can only update notes and video meeting preferences'
        });
      }
    }
    
    // Clinics/veterinarians can update appointment status and other fields
    if (req.user.userType === 'veterinarian' && appointment.clinic_id === req.user.clinicId) {
      canUpdate = true;
    }
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    // If changing date/time, check availability (for clinic users only)
    if (
      req.user.userType === 'veterinarian' && 
      (req.body.appointmentDate || req.body.appointmentStartHour || req.body.appointmentEndHour)
    ) {
      const isAvailable = await appointmentModel.isAppointmentSlotAvailable(
        appointment.clinic_id,
        req.body.appointmentDate || appointment.appointment_date,
        req.body.appointmentStartHour || appointment.appointment_start_hour,
        req.body.appointmentEndHour || appointment.appointment_end_hour
      );

      if (!isAvailable) {
        return res.status(409).json({ error: 'Selected appointment slot is not available' });
      }
    }

    const updatedAppointment = await appointmentModel.updateAppointment(appointmentId, req.body);
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel an appointment
router.patch('/:appointmentId/cancel', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentModel.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Both pet owners and clinics can cancel appointments
    if (
      (req.user.userType === 'pet_owner' && appointment.pet_owner_id !== req.user.userId) &&
      (req.user.userType === 'veterinarian' && appointment.clinic_id !== req.user.clinicId)
    ) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    // Update appointment status to 'canceled'
    const updatedAppointment = await appointmentModel.updateAppointment(appointmentId, {
      appointmentStatus: 'canceled'
    });

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Delete an appointment (Administrative purposes only)
router.delete('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    // Only admin users can completely delete appointments
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin access only.' });
    }

    const { appointmentId } = req.params;
    const deletedAppointment = await appointmentModel.deleteAppointment(appointmentId);

    if (!deletedAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment successfully deleted' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Get available appointment slots for a clinic on a specific date
router.get('/available-slots/:clinicId/:date', async (req, res) => {
  try {
    const { clinicId, date } = req.params;
    
    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const availableSlots = await appointmentModel.getAvailableTimeSlots(clinicId, date);
    
    res.status(200).json({
      success: true,
      slots: availableSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available appointment slots'
    });
  }
});

// Mark appointment as completed
router.patch('/:appointmentId/complete', authenticateToken, async (req, res) => {
  try {
    // Only clinic/veterinarian users can mark appointments as completed
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ error: 'Access denied. Clinic/veterinarian access only.' });
    }

    const { appointmentId } = req.params;
    const appointment = await appointmentModel.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Ensure the clinic user belongs to the clinic associated with the appointment
    if (appointment.clinic_id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    // Update appointment status to 'completed'
    const updatedAppointment = await appointmentModel.updateAppointment(appointmentId, {
      appointmentStatus: 'completed'
    });

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ error: 'Failed to mark appointment as completed' });
  }
});

// Get available appointment dates for a clinic
router.get('/available-dates/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const numberOfDays = req.query.days ? parseInt(req.query.days) : 14;
    const includeToday = req.query.includeToday === 'true';
    
    // Validate numberOfDays
    if (isNaN(numberOfDays) || numberOfDays < 1 || numberOfDays > 60) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid number of days. Must be between 1 and 60.' 
      });
    }

    const availableDates = await appointmentModel.getAvailableDates(clinicId, numberOfDays, includeToday);
    
    res.status(200).json({
      success: true,
      dates: availableDates
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available appointment dates'
    });
  }
});

// Get booked slots for a specific clinic and date
router.get('/booked-slots/:clinicId/:date', async (req, res) => {
  try {
    const { clinicId, date } = req.params;
    
    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    // Get all appointments for the clinic on the specified date
    const result = await pool.query(
      `SELECT appointment_start_hour AS start, appointment_end_hour AS end
       FROM appointments 
       WHERE clinic_id = $1 
       AND appointment_date = $2
       AND appointment_status NOT IN ('canceled')`,
      [clinicId, date]
    );
    
    res.status(200).json({
      success: true,
      bookedSlots: result.rows
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booked slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
