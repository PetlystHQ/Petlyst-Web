const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const hospitalizationModel = require('./hospitalizationModel');
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');

// Helper function to check if a veterinarian has access to a clinic
async function isClinicVeterinarian(veterinarianId, clinicId) {
  try {
    const query = `
      SELECT 1 FROM clinic_veterinarians
      WHERE veterinarian_id = $1 AND clinic_id = $2 AND status = 'approved'
    `;
    
    const result = await pool.query(query, [parseInt(veterinarianId), parseInt(clinicId)]);
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking clinic access:', error);
    return false;
  }
}

// Helper function to check if a user is the owner of a pet
async function isPetOwner(userId, petId) {
  try {
    const query = `
      SELECT 1 FROM pets
      WHERE id = $1 AND owner_id = $2
    `;
    
    const result = await pool.query(query, [petId, parseInt(userId)]);
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking pet ownership:', error);
    return false;
  }
}

/**
 * Room Management Routes
 */

// Get all rooms for a clinic
router.get('/clinics/:clinicId/hospitalization/rooms', authenticateToken, async (req, res) => {
    try {
        // Validate user type
        if (req.user.userType !== 'veterinarian') {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied. Veterinarian access only.' 
          });
        }

        const { clinicId } = req.params;
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, clinicId);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        const rooms = await hospitalizationModel.getRoomsByClinic(clinicId);
        
        res.json({
            success: true,
            rooms
        });
    } catch (error) {
        logger.error('Error fetching rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rooms',
            error: error.message
        });
    }
});

// Get room by ID
router.get('/hospitalization/rooms/:roomId', authenticateToken, async (req, res) => {
    try {
        // Validate user type
        if (req.user.userType !== 'veterinarian') {
          return res.status(403).json({ 
            success: false,
            error: 'Access denied. Veterinarian access only.' 
          });
        }

        const { roomId } = req.params;
        const room = await hospitalizationModel.getRoomById(roomId);
        
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, room.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        res.json({
            success: true,
            room
        });
    } catch (error) {
        logger.error('Error fetching room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room',
            error: error.message
        });
    }
});

// Create a new room
router.post('/clinics/:clinicId/hospitalization/rooms', authenticateToken, async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { roomName, roomType } = req.body;
        
        if (!roomName || !roomType) {
            return res.status(400).json({
                success: false,
                message: 'Room name and type are required'
            });
        }
        
        // Validate room type
        const validRoomTypes = ['intensive_care', 'observation', 'standard', 'isolation'];
        if (!validRoomTypes.includes(roomType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room type. Must be one of: intensive_care, observation, standard, isolation'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, clinicId);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        const room = await hospitalizationModel.createRoom(clinicId, roomName, roomType);
        
        res.status(201).json({
            success: true,
            room,
            message: 'Room created successfully'
        });
    } catch (error) {
        logger.error('Error creating room:', error);
        
        // Handle duplicate room name error
        if (error.code === '23505') { // PostgreSQL unique violation code
            return res.status(409).json({
                success: false,
                message: 'A room with this name already exists in this clinic'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: error.message
        });
    }
});

// Update room details
router.put('/hospitalization/rooms/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { roomName, roomType } = req.body;
        
        if (!roomName || !roomType) {
            return res.status(400).json({
                success: false,
                message: 'Room name and type are required'
            });
        }
        
        // Validate room type
        const validRoomTypes = ['intensive_care', 'observation', 'standard', 'isolation'];
        if (!validRoomTypes.includes(roomType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room type. Must be one of: intensive_care, observation, standard, isolation'
            });
        }
        
        // Get current room data to check authorization
        const currentRoom = await hospitalizationModel.getRoomById(roomId);
        if (!currentRoom) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, currentRoom.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        const updatedRoom = await hospitalizationModel.updateRoom(roomId, roomName, roomType);
        
        res.json({
            success: true,
            room: updatedRoom,
            message: 'Room updated successfully'
        });
    } catch (error) {
        logger.error('Error updating room:', error);
        
        // Handle duplicate room name error
        if (error.code === '23505') { // PostgreSQL unique violation code
            return res.status(409).json({
                success: false,
                message: 'A room with this name already exists in this clinic'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update room',
            error: error.message
        });
    }
});

// Update room status
router.put('/hospitalization/rooms/:roomId/status', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        // Validate status
        const validStatuses = ['vacant', 'occupied', 'maintenance'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: vacant, occupied, maintenance'
            });
        }
        
        // Get current room data to check authorization
        const currentRoom = await hospitalizationModel.getRoomById(roomId);
        if (!currentRoom) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, currentRoom.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        // Check if room has active hospitalizations before marking as vacant/maintenance
        if ((status === 'vacant' || status === 'maintenance') && currentRoom.room_status === 'occupied') {
            // Check if there are active hospitalizations
            const activeHospitalizations = await hospitalizationModel.getCurrentHospitalizationsByClinic(currentRoom.clinic_id);
            const roomHasActiveHospitalization = activeHospitalizations.some(h => h.room_id === parseInt(roomId));
            
            if (roomHasActiveHospitalization) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change room status while a pet is hospitalized. Discharge the pet first.'
                });
            }
        }
        
        const updatedRoom = await hospitalizationModel.updateRoomStatus(roomId, status);
        
        res.json({
            success: true,
            room: updatedRoom,
            message: 'Room status updated successfully'
        });
    } catch (error) {
        logger.error('Error updating room status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update room status',
            error: error.message
        });
    }
});

// Delete a room
router.delete('/hospitalization/rooms/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        
        // Get current room data to check authorization
        const currentRoom = await hospitalizationModel.getRoomById(roomId);
        if (!currentRoom) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, currentRoom.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        await hospitalizationModel.deleteRoom(roomId);
        
        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting room:', error);
        
        // If error is about active hospitalizations
        if (error.message === 'Cannot delete room with active hospitalizations') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: error.message
        });
    }
});

/**
 * Hospitalization Management Routes
 */

// Admit a pet to a room
router.post('/hospitalization/admit', authenticateToken, async (req, res) => {
    try {
        const { roomId, petId, admissionDate, expectedDischargeDate } = req.body;
        
        if (!roomId || !petId || !admissionDate) {
            return res.status(400).json({
                success: false,
                message: 'Room ID, pet ID, and admission date are required'
            });
        }
        
        // Check if room exists and get clinic ID
        const room = await hospitalizationModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, room.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        // Check if pet is already hospitalized
        const currentHospitalization = await hospitalizationModel.getCurrentHospitalization(petId);
        if (currentHospitalization) {
            return res.status(400).json({
                success: false,
                message: 'Pet is already hospitalized in another room'
            });
        }
        
        const hospitalization = await hospitalizationModel.admitPet(roomId, petId, admissionDate, expectedDischargeDate);
        
        res.status(201).json({
            success: true,
            hospitalization,
            message: 'Pet admitted successfully'
        });
    } catch (error) {
        logger.error('Error admitting pet:', error);
        
        // Handle specific errors
        if (error.message === 'Room not found' || error.message === 'Room is not available for admission') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to admit pet',
            error: error.message
        });
    }
});

// Discharge a pet
router.put('/hospitalization/:hospitalizationId/discharge', authenticateToken, async (req, res) => {
    try {
        const { hospitalizationId } = req.params;
        const { actualDischargeDate } = req.body;
        
        if (!actualDischargeDate) {
            return res.status(400).json({
                success: false,
                message: 'Actual discharge date is required'
            });
        }
        
        // Get hospitalization details to check authorization
        const hospitalization = await hospitalizationModel.getHospitalizationById(hospitalizationId);
        if (!hospitalization) {
            return res.status(404).json({
                success: false,
                message: 'Hospitalization record not found'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, hospitalization.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        // Check if already discharged
        if (hospitalization.actual_discharge_date) {
            return res.status(400).json({
                success: false,
                message: 'Pet has already been discharged'
            });
        }
        
        const updatedHospitalization = await hospitalizationModel.dischargePet(hospitalizationId, actualDischargeDate);
        
        res.json({
            success: true,
            hospitalization: updatedHospitalization,
            message: 'Pet discharged successfully'
        });
    } catch (error) {
        logger.error('Error discharging pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to discharge pet',
            error: error.message
        });
    }
});

// Get current hospitalization for a pet
router.get('/pets/:petId/hospitalization/current', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const hospitalization = await hospitalizationModel.getCurrentHospitalization(petId);
        
        if (!hospitalization) {
            return res.json({
                success: true,
                hospitalization: null,
                message: 'Pet is not currently hospitalized'
            });
        }
        
        // If user is not a veterinarian, check if they are the pet owner
        if (req.user.userType !== 'veterinarian') {
            // Check if the logged-in user is the pet owner
            const isOwner = await isPetOwner(req.user.userId, petId);
            if (!isOwner) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this pet data' });
            }
        } else {
            // For veterinarians, check if they belong to the clinic
            const isAuthorized = await isClinicVeterinarian(req.user.userId, hospitalization.clinic_id);
            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
            }
        }
        
        res.json({
            success: true,
            hospitalization
        });
    } catch (error) {
        logger.error('Error fetching current hospitalization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current hospitalization',
            error: error.message
        });
    }
});

// Get hospitalization history for a pet
router.get('/pets/:petId/hospitalization/history', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const hospitalizationHistory = await hospitalizationModel.getPetHospitalizationHistory(petId);
        
        // If user is not a veterinarian, check if they are the pet owner
        if (req.user.userType !== 'veterinarian' && hospitalizationHistory.length > 0) {
            // Check if the logged-in user is the pet owner
            const isOwner = await isPetOwner(req.user.userId, petId);
            if (!isOwner) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this pet data' });
            }
        }
        
        res.json({
            success: true,
            hospitalizationHistory
        });
    } catch (error) {
        logger.error('Error fetching hospitalization history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hospitalization history',
            error: error.message
        });
    }
});

// Get all current hospitalizations for a clinic
router.get('/clinics/:clinicId/hospitalization/current', authenticateToken, async (req, res) => {
    try {
        const { clinicId } = req.params;
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, clinicId);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        const hospitalizations = await hospitalizationModel.getCurrentHospitalizationsByClinic(clinicId);
        
        res.json({
            success: true,
            hospitalizations
        });
    } catch (error) {
        logger.error('Error fetching current hospitalizations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current hospitalizations',
            error: error.message
        });
    }
});

// Get specific hospitalization details
router.get('/hospitalization/:hospitalizationId', authenticateToken, async (req, res) => {
    try {
        const { hospitalizationId } = req.params;
        const hospitalization = await hospitalizationModel.getHospitalizationById(hospitalizationId);
        
        if (!hospitalization) {
            return res.status(404).json({
                success: false,
                message: 'Hospitalization record not found'
            });
        }
        
        // If user is not a veterinarian, check if they are the pet owner
        if (req.user.userType !== 'veterinarian') {
            // Check if the logged-in user is the pet owner
            const isOwner = await isPetOwner(req.user.userId, hospitalization.pet_id);
            if (!isOwner) {
                return res.status(403).json({ success: false, message: 'Not authorized to view this hospitalization data' });
            }
        } else {
            // For veterinarians, check if they belong to the clinic
            const isAuthorized = await isClinicVeterinarian(req.user.userId, hospitalization.clinic_id);
            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
            }
        }
        
        res.json({
            success: true,
            hospitalization
        });
    } catch (error) {
        logger.error('Error fetching hospitalization details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hospitalization details',
            error: error.message
        });
    }
});

// Update expected discharge date
router.put('/hospitalization/:hospitalizationId/discharge-date', authenticateToken, async (req, res) => {
    try {
        const { hospitalizationId } = req.params;
        const { expectedDischargeDate } = req.body;
        
        if (!expectedDischargeDate) {
            return res.status(400).json({
                success: false,
                message: 'Expected discharge date is required'
            });
        }
        
        // Get hospitalization details to check authorization
        const hospitalization = await hospitalizationModel.getHospitalizationById(hospitalizationId);
        if (!hospitalization) {
            return res.status(404).json({
                success: false,
                message: 'Hospitalization record not found'
            });
        }
        
        // Check if already discharged
        if (hospitalization.actual_discharge_date) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update expected discharge date for a discharged pet'
            });
        }
        
        // Check if user is authorized for this clinic
        const isAuthorized = await isClinicVeterinarian(req.user.userId, hospitalization.clinic_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized for this clinic' });
        }
        
        const updatedHospitalization = await hospitalizationModel.updateExpectedDischargeDate(hospitalizationId, expectedDischargeDate);
        
        res.json({
            success: true,
            hospitalization: updatedHospitalization,
            message: 'Expected discharge date updated successfully'
        });
    } catch (error) {
        logger.error('Error updating expected discharge date:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expected discharge date',
            error: error.message
        });
    }
});

// Auto-discharge a pet's hospitalization when deleted
router.post('/pets/:petId/auto-discharge', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        
        // Only authenticated users (both pet owners and veterinarians) can trigger this
        if (!req.user || !req.user.userId) {
            return res.status(403).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }
        
        // Check if user is authorized (either pet owner or veterinarian with access)
        let isAuthorized = false;
        
        if (req.user.userType === 'pet_owner') {
            // Check if the user is the pet owner
            isAuthorized = await isPetOwner(req.user.userId, petId);
        } else if (req.user.userType === 'veterinarian') {
            // For veterinarians, need to check clinical access
            // First get any active hospitalization to determine the clinic
            const activeHospitalization = await pool.query(
                `SELECT h.id, r.clinic_id
                 FROM pet_hospitalizations h
                 JOIN clinic_hospitalization_rooms r ON h.room_id = r.id
                 WHERE h.pet_id = $1 AND h.actual_discharge_date IS NULL
                 LIMIT 1`,
                [petId]
            );
            
            if (activeHospitalization.rows.length > 0) {
                isAuthorized = await isClinicVeterinarian(req.user.userId, activeHospitalization.rows[0].clinic_id);
            }
        }
        
        if (!isAuthorized) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to discharge this pet' 
            });
        }
        
        // Call the function to discharge the pet
        const results = await hospitalizationModel.dischargeDeletedPet(petId);
        
        return res.json({
            success: true,
            message: results ? `Successfully discharged ${Array.isArray(results) ? results.length : 0} hospitalizations` : 'No active hospitalizations found',
            results
        });
    } catch (error) {
        logger.error('Error auto-discharging pet:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to auto-discharge pet',
            error: error.message
        });
    }
});

module.exports = router;
