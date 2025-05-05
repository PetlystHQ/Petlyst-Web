const express = require('express');
const router = express.Router();
const appointmentModel = require('../models/appointmentModel');
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');

// Get all appointments for authenticated pet owner with detailed information
router.get('/pet-owner', authenticateToken, async (req, res) => {
  try {
    console.log('Pet owner appointments endpoint called');
    console.log('User info:', { userId: req.user.userId, userType: req.user.userType });
    
    // Only pet owners can access this route
    if (req.user.userType !== 'pet_owner') {
      console.warn('Access denied: User is not a pet owner');
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Pet owner access only.' 
      });
    }

    // Get appointments with detailed information
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.clinic_id,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.meeting_url,
        a.meeting_password,
        a.notes,
        c.clinic_name,
        p.pet_name,
        (
          SELECT u.user_name 
          FROM clinic_veterinarians cv
          JOIN users u ON cv.veterinarian_id = u.user_id
          WHERE cv.clinic_id = a.clinic_id AND cv.status = 'approved'
          LIMIT 1
        ) as veterinarian_name,
        (
          SELECT u.user_surname 
          FROM clinic_veterinarians cv
          JOIN users u ON cv.veterinarian_id = u.user_id
          WHERE cv.clinic_id = a.clinic_id AND cv.status = 'approved'
          LIMIT 1
        ) as veterinarian_surname
      FROM 
        appointments a
      JOIN 
        clinics c ON a.clinic_id = c.clinic_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.pet_owner_id = $1
      ORDER BY 
        CASE
          WHEN a.appointment_status = 'pending' THEN 1
          WHEN a.appointment_status = 'confirmed' THEN 2
          WHEN a.appointment_status = 'completed' THEN 3
          WHEN a.appointment_status = 'canceled' THEN 4
          ELSE 5
        END,
        a.appointment_date,
        a.appointment_start_hour
    `;

    console.log('Executing query for user ID:', req.user.userId);
    const result = await pool.query(query, [req.user.userId]);
    console.log('Found appointments:', result.rows.length);
    
    // Debug output for first result if any
    if (result.rows.length > 0) {
      console.log('First appointment sample:', {
        id: result.rows[0].appointment_id,
        status: result.rows[0].appointment_status,
        clinic: result.rows[0].clinic_name,
        pet: result.rows[0].pet_name,
        date: result.rows[0].appointment_date
      });
    }
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching pet owner appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    console.log('=== DEBUG: Mark Appointment as Completed ===');
    const appointmentId = req.params.appointmentId;
    console.log(`Appointment ID: ${appointmentId}`);
    console.log(`User type: ${req.user.userType}`);
    console.log(`User ID: ${req.user.userId}`);

    // Get appointment details
    const appointment = await appointmentModel.getAppointmentById(appointmentId);
    console.log('Appointment details:', appointment);

    if (!appointment) {
      console.log('Appointment not found');
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      console.log('User is not a veterinarian');
      return res.status(403).json({ message: 'Only veterinarians can mark appointments as completed' });
    }

    // Get the clinic ID from the appointment
    const clinicId = appointment.clinic_id;
    console.log(`Clinic ID from appointment: ${clinicId}`);

    // Check if the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    console.log(`Clinic access check result: ${hasAccess}`);

    if (!hasAccess) {
      console.log('Veterinarian does not have access to this clinic');
      return res.status(403).json({ message: 'You do not have access to this clinic' });
    }

    // Mark the appointment as completed
    console.log('Updating appointment status to completed');
    const updatedAppointment = await appointmentModel.updateAppointment(appointmentId, {
      appointmentStatus: 'completed'
    });
    console.log('Updated appointment:', updatedAppointment);
    
    // Add the pet to clinic_patients table if not already there
    try {
      console.log(`[DEBUG-APIROUTE] Randevu tamamlandı. clinic_patients tablosu güncelleniyor...`);
      console.log(`[DEBUG-APIROUTE] Klinik ID: ${appointment.clinic_id}, Hayvan ID: ${appointment.pet_id}`);
      
      // Check if the pet is already in the clinic_patients table
      const checkResult = await pool.query(
        `SELECT id FROM clinic_patients WHERE clinic_id = $1 AND pet_id = $2`,
        [appointment.clinic_id, appointment.pet_id]
      );
      
      console.log(`[DEBUG-APIROUTE] clinic_patients tablosunda arama sonucu: ${checkResult.rowCount} kayıt bulundu`);
      
      // If the pet is not already in the clinic_patients table, add it
      if (checkResult.rowCount === 0) {
        console.log(`[DEBUG-APIROUTE] Hayvan clinic_patients tablosunda bulunamadı. Yeni kayıt ekleniyor.`);
        await pool.query(
          `INSERT INTO clinic_patients (clinic_id, pet_id, created_at, updated_at) 
           VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [appointment.clinic_id, appointment.pet_id]
        );
        console.log(`[DEBUG-APIROUTE] Hayvan clinic_patients tablosuna eklendi (tamamlama endpointi).`);
      } else {
        console.log(`[DEBUG-APIROUTE] Hayvan zaten clinic_patients tablosunda mevcut. Kayıt güncelleniyor.`);
        await pool.query(
          `UPDATE clinic_patients 
           SET updated_at = CURRENT_TIMESTAMP 
           WHERE clinic_id = $1 AND pet_id = $2`,
          [appointment.clinic_id, appointment.pet_id]
        );
        console.log(`[DEBUG-APIROUTE] Hayvan clinic_patients kaydı güncellendi (tamamlama endpointi).`);
      }
    } catch (error) {
      console.error('Error updating clinic_patients table:', error);
      // Don't fail the request if this part fails
    }
    
    res.status(200).json({ 
      message: 'Appointment marked as completed', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error('Error marking appointment as completed:', error);
    res.status(500).json({ message: 'Error marking appointment as completed', error: error.message });
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

// Get pending appointments for a specific clinic
router.get('/clinic/:clinicId/pending', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get all pending appointments for this clinic with detailed information
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        a.appointment_status = 'pending'
      ORDER BY 
        a.appointment_date, 
        a.appointment_start_hour
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update appointment status (approve/reject)
router.put('/:appointmentId/status', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can update appointment status
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { appointmentId } = req.params;
    const { status } = req.body;
    
    // Validate status value
    if (!status || !['confirmed', 'canceled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "confirmed" or "canceled".'
      });
    }
    
    // Get appointment details to verify clinic
    const appointment = await appointmentModel.getAppointmentById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    // Verify that the veterinarian has access to the clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, appointment.clinic_id);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }
    
    // Check if status change is valid based on current appointment status
    if (appointment.appointment_status === 'pending') {
      // Pending appointments can be changed to confirmed or canceled
    } else if (appointment.appointment_status === 'confirmed' && status === 'canceled') {
      // Confirmed appointments can only be canceled
    } else {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${appointment.appointment_status} to ${status}.`
      });
    }
    
    // Update the appointment status
    const updatedAppointment = await appointmentModel.updateAppointment(appointmentId, {
      appointmentStatus: status
    });
    
    // If status is confirmed, add the pet to clinic_patients table if not already there
    if (status === 'confirmed') {
      try {
        console.log(`[DEBUG-APIROUTE-STATUS] Randevu onaylandı. clinic_patients tablosu güncelleniyor...`);
        console.log(`[DEBUG-APIROUTE-STATUS] Klinik ID: ${appointment.clinic_id}, Hayvan ID: ${appointment.pet_id}`);
        
        // Check if the pet is already in the clinic_patients table
        const checkResult = await pool.query(
          `SELECT id FROM clinic_patients WHERE clinic_id = $1 AND pet_id = $2`,
          [appointment.clinic_id, appointment.pet_id]
        );
        
        console.log(`[DEBUG-APIROUTE-STATUS] clinic_patients tablosunda arama sonucu: ${checkResult.rowCount} kayıt bulundu`);
        
        // If the pet is not already in the clinic_patients table, add it
        if (checkResult.rowCount === 0) {
          console.log(`[DEBUG-APIROUTE-STATUS] Hayvan clinic_patients tablosunda bulunamadı. Yeni kayıt ekleniyor.`);
          await pool.query(
            `INSERT INTO clinic_patients (clinic_id, pet_id, created_at, updated_at) 
             VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [appointment.clinic_id, appointment.pet_id]
          );
          console.log(`[DEBUG-APIROUTE-STATUS] Hayvan clinic_patients tablosuna eklendi (onaylama endpointi).`);
        } else {
          console.log(`[DEBUG-APIROUTE-STATUS] Hayvan zaten clinic_patients tablosunda mevcut. Kayıt güncelleniyor.`);
          await pool.query(
            `UPDATE clinic_patients 
             SET updated_at = CURRENT_TIMESTAMP 
             WHERE clinic_id = $1 AND pet_id = $2`,
            [appointment.clinic_id, appointment.pet_id]
          );
          console.log(`[DEBUG-APIROUTE-STATUS] Hayvan clinic_patients kaydı güncellendi (onaylama endpointi).`);
        }
      } catch (error) {
        console.error('Error updating clinic_patients table:', error);
        // Don't fail the request if this part fails
      }
    } else {
      console.log(`[DEBUG-APIROUTE-STATUS] Randevu durumu ${status} olduğu için clinic_patients tablosu güncellenmedi.`);
    }
    
    res.status(200).json({
      success: true,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update appointment status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get confirmed appointments for a specific clinic
router.get('/clinic/:clinicId/confirmed', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get all confirmed appointments for this clinic with detailed information
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        a.appointment_status = 'confirmed'
      ORDER BY 
        a.appointment_date, 
        a.appointment_start_hour
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching confirmed appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch confirmed appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get canceled appointments for a specific clinic
router.get('/clinic/:clinicId/canceled', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get all canceled appointments for this clinic with detailed information
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        a.appointment_status = 'canceled'
      ORDER BY 
        a.appointment_date, 
        a.appointment_start_hour
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching canceled appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch canceled appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get completed appointments for a specific clinic
router.get('/clinic/:clinicId/completed', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get all completed appointments for this clinic with detailed information
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        a.appointment_status = 'completed'
      ORDER BY 
        a.appointment_date DESC, 
        a.appointment_start_hour DESC
    `;

    const result = await pool.query(query, [clinicId]);
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching completed appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch completed appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get upcoming appointments for a specific clinic for the next 24 hours
router.get('/clinic/:clinicId/upcoming-24h', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get current date and time
    const now = new Date();
    
    // Calculate date 24 hours from now
    const nextDay = new Date(now);
    nextDay.setHours(now.getHours() + 24);
    
    // Convert to ISO strings for database comparison
    const nowISO = now.toISOString();
    const nextDayISO = nextDay.toISOString();
    
    console.log('Timezone diagnostics:', {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: now.getTimezoneOffset(),
      currentTime: now.toISOString(),
      now: nowISO,
      nextDay: nextDayISO,
      clinic: clinicId
    });

    // Get appointments for this clinic in the next 24 hours (both confirmed and completed)
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        (a.appointment_status = 'confirmed' OR a.appointment_status = 'completed') AND
        a.appointment_start_hour >= $2 AND
        a.appointment_start_hour <= $3
      ORDER BY 
        a.appointment_date, 
        a.appointment_start_hour
    `;

    const result = await pool.query(query, [clinicId, nowISO, nextDayISO]);
    
    console.log('Found upcoming appointments:', result.rows.length);
    
    res.status(200).json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch upcoming appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get past confirmed appointments that can be marked as completed
router.get('/clinic/:clinicId/past-confirmed', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Get current date and time
    const now = new Date();
    const currentTime = now.toISOString();
    
    console.log('Fetching past confirmed appointments:', {
      clinicId,
      currentTime
    });

    // Find all confirmed appointments with end time in the past
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        a.appointment_status = 'confirmed' AND
        a.appointment_end_hour < $2
      ORDER BY 
        a.appointment_date DESC, 
        a.appointment_start_hour DESC
    `;

    const result = await pool.query(query, [clinicId, currentTime]);
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No past confirmed appointments to display',
        appointments: []
      });
    }
    
    console.log(`Found ${result.rows.length} past confirmed appointments that can be marked as completed`);
    
    res.status(200).json({
      success: true,
      message: `Found ${result.rows.length} past confirmed appointments`,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching past confirmed appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch past confirmed appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all appointments for a specific clinic for a given month
router.get('/clinic/:clinicId/monthly', authenticateToken, async (req, res) => {
  try {
    // Only veterinarians can access this route
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Veterinarian access only.' 
      });
    }

    const { clinicId } = req.params;
    const { year, month } = req.query;
    
    // Validate year and month parameters
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month parameters are required'
      });
    }
    
    const numYear = parseInt(year);
    const numMonth = parseInt(month);
    
    if (isNaN(numYear) || isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month values'
      });
    }
    
    // Verify that the veterinarian has access to this clinic
    const hasAccess = await appointmentModel.doesVeterinarianHaveClinicAccess(req.user.userId, clinicId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have access to this clinic.'
      });
    }

    // Calculate the start and end dates for the month
    const startDate = new Date(numYear, numMonth - 1, 1).toISOString().split('T')[0]; // First day of month
    const endDate = new Date(numYear, numMonth, 0).toISOString().split('T')[0]; // Last day of month
    
    console.log(`Fetching appointments for clinic ${clinicId} from ${startDate} to ${endDate}`);
    
    // Get all appointments for this clinic within the specified month
    const query = `
      SELECT 
        a.appointment_id,
        a.pet_id,
        a.pet_owner_id,
        u.user_name as pet_owner_name,
        u.user_surname as pet_owner_surname,
        p.pet_name,
        p.pet_species as pet_type,
        p.pet_breed,
        a.appointment_date,
        a.appointment_start_hour,
        a.appointment_end_hour,
        a.appointment_status,
        a.video_meeting,
        a.notes
      FROM 
        appointments a
      JOIN 
        users u ON a.pet_owner_id = u.user_id
      JOIN 
        pets p ON a.pet_id = p.pet_id
      WHERE 
        a.clinic_id = $1 AND
        a.appointment_date BETWEEN $2 AND $3
      ORDER BY 
        a.appointment_date, 
        a.appointment_start_hour
    `;

    const result = await pool.query(query, [clinicId, startDate, endDate]);
    
    // Group appointments by date for easier calendar rendering
    const appointmentsByDate = {};
    
    result.rows.forEach(appointment => {
      const date = appointment.appointment_date;
      if (!appointmentsByDate[date]) {
        appointmentsByDate[date] = [];
      }
      appointmentsByDate[date].push(appointment);
    });
    
    res.status(200).json({
      success: true,
      month: numMonth,
      year: numYear,
      appointmentsByDate,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching monthly appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch monthly appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
