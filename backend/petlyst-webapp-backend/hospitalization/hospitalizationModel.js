const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * Room operations
 */

// Create a new hospitalization room
async function createRoom(clinicId, roomName, roomType) {
    try {
        const result = await pool.query(
            'INSERT INTO clinic_hospitalization_rooms (clinic_id, room_name, room_type) VALUES ($1, $2, $3) RETURNING *',
            [clinicId, roomName, roomType]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error creating hospitalization room:', error);
        throw error;
    }
}

// Get all rooms for a clinic
async function getRoomsByClinic(clinicId) {
    try {
        const result = await pool.query(
            'SELECT * FROM clinic_hospitalization_rooms WHERE clinic_id = $1 ORDER BY created_at',
            [clinicId]
        );
        return result.rows;
    } catch (error) {
        logger.error('Error getting hospitalization rooms:', error);
        throw error;
    }
}

// Get a specific room by ID
async function getRoomById(roomId) {
    try {
        const result = await pool.query(
            'SELECT * FROM clinic_hospitalization_rooms WHERE id = $1',
            [roomId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting hospitalization room:', error);
        throw error;
    }
}

// Update room details
async function updateRoom(roomId, roomName, roomType) {
    try {
        const result = await pool.query(
            'UPDATE clinic_hospitalization_rooms SET room_name = $1, room_type = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [roomName, roomType, roomId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error updating hospitalization room:', error);
        throw error;
    }
}

// Update room status
async function updateRoomStatus(roomId, status) {
    try {
        const result = await pool.query(
            'UPDATE clinic_hospitalization_rooms SET room_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, roomId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error updating room status:', error);
        throw error;
    }
}

// Delete a room
async function deleteRoom(roomId) {
    try {
        // Check if room has any active hospitalizations
        const activeHospitalizations = await pool.query(
            'SELECT COUNT(*) FROM pet_hospitalizations WHERE room_id = $1 AND actual_discharge_date IS NULL',
            [roomId]
        );
        
        if (parseInt(activeHospitalizations.rows[0].count) > 0) {
            throw new Error('Cannot delete room with active hospitalizations');
        }
        
        const result = await pool.query(
            'DELETE FROM clinic_hospitalization_rooms WHERE id = $1 RETURNING *',
            [roomId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error deleting hospitalization room:', error);
        throw error;
    }
}

/**
 * Hospitalization operations
 */

// Admit a pet to a room
async function admitPet(roomId, petId, admissionDate, expectedDischargeDate) {
    try {
        // First check if the room is available
        const roomCheck = await pool.query(
            'SELECT room_status FROM clinic_hospitalization_rooms WHERE id = $1',
            [roomId]
        );
        
        if (!roomCheck.rows[0]) {
            throw new Error('Room not found');
        }
        
        if (roomCheck.rows[0].room_status !== 'vacant') {
            throw new Error('Room is not available for admission');
        }
        
        // Check if pet exists and is not deleted
        const petCheck = await pool.query(
            'SELECT pet_id, pet_status FROM pets WHERE pet_id = $1',
            [petId]
        );
        
        if (!petCheck.rows[0]) {
            throw new Error('Pet not found');
        }
        
        if (petCheck.rows[0].pet_status === 'deleted') {
            throw new Error('Cannot admit a deleted pet');
        }
        
        // Begin transaction
        await pool.query('BEGIN');
        
        // Create hospitalization record
        const hospitalizationResult = await pool.query(
            'INSERT INTO pet_hospitalizations (room_id, pet_id, admission_date, expected_discharge_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [roomId, petId, admissionDate, expectedDischargeDate]
        );
        
        // Update room status to occupied
        await pool.query(
            'UPDATE clinic_hospitalization_rooms SET room_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['occupied', roomId]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        return hospitalizationResult.rows[0];
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        logger.error('Error admitting pet:', error);
        throw error;
    }
}

// Discharge a pet from hospitalization
async function dischargePet(hospitalizationId, actualDischargeDate) {
    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        // Get the room_id from the hospitalization
        const roomResult = await pool.query(
            'SELECT room_id FROM pet_hospitalizations WHERE id = $1',
            [hospitalizationId]
        );
        
        if (!roomResult.rows[0]) {
            throw new Error('Hospitalization record not found');
        }
        
        const roomId = roomResult.rows[0].room_id;
        
        // Update hospitalization record with discharge date
        const dischargeResult = await pool.query(
            'UPDATE pet_hospitalizations SET actual_discharge_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [actualDischargeDate, hospitalizationId]
        );
        
        // Update room status back to vacant
        await pool.query(
            'UPDATE clinic_hospitalization_rooms SET room_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['vacant', roomId]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        return dischargeResult.rows[0];
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        logger.error('Error discharging pet:', error);
        throw error;
    }
}

// Get current hospitalization for a pet
async function getCurrentHospitalization(petId) {
    try {
        const result = await pool.query(
            `SELECT h.*, r.room_name, r.room_type, r.clinic_id
             FROM pet_hospitalizations h
             JOIN clinic_hospitalization_rooms r ON h.room_id = r.id
             JOIN pets p ON h.pet_id = p.pet_id
             WHERE h.pet_id = $1 AND h.actual_discharge_date IS NULL
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)`,
            [petId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting current hospitalization:', error);
        throw error;
    }
}

// Get hospitalization history for a pet
async function getPetHospitalizationHistory(petId) {
    try {
        const result = await pool.query(
            `SELECT h.*, r.room_name, r.room_type, r.clinic_id
             FROM pet_hospitalizations h
             JOIN clinic_hospitalization_rooms r ON h.room_id = r.id
             JOIN pets p ON h.pet_id = p.pet_id
             WHERE h.pet_id = $1
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)
             ORDER BY h.admission_date DESC`,
            [petId]
        );
        return result.rows;
    } catch (error) {
        logger.error('Error getting pet hospitalization history:', error);
        throw error;
    }
}

// Get all current hospitalizations for a clinic
async function getCurrentHospitalizationsByClinic(clinicId) {
    try {
        const result = await pool.query(
            `SELECT h.*, r.room_name, r.room_type, p.pet_name, p.pet_species, p.pet_breed
             FROM pet_hospitalizations h
             JOIN clinic_hospitalization_rooms r ON h.room_id = r.id
             JOIN pets p ON h.pet_id = p.pet_id
             WHERE r.clinic_id = $1 AND h.actual_discharge_date IS NULL
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)
             ORDER BY h.admission_date`,
            [clinicId]
        );
        return result.rows;
    } catch (error) {
        logger.error('Error getting current hospitalizations:', error);
        throw error;
    }
}

// Get hospitalization details
async function getHospitalizationById(hospitalizationId) {
    try {
        const result = await pool.query(
            `SELECT h.*, r.room_name, r.room_type, r.clinic_id, p.pet_name, p.pet_species, p.pet_breed
             FROM pet_hospitalizations h
             JOIN clinic_hospitalization_rooms r ON h.room_id = r.id
             JOIN pets p ON h.pet_id = p.pet_id
             WHERE h.id = $1
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)`,
            [hospitalizationId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting hospitalization details:', error);
        throw error;
    }
}

// Update expected discharge date
async function updateExpectedDischargeDate(hospitalizationId, expectedDischargeDate) {
    try {
        const result = await pool.query(
            'UPDATE pet_hospitalizations SET expected_discharge_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [expectedDischargeDate, hospitalizationId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error updating expected discharge date:', error);
        throw error;
    }
}

// Automatically discharge a pet when it is deleted
async function dischargeDeletedPet(petId) {
    try {
        logger.info(`Auto-discharging hospitalization for deleted pet ID: ${petId}`);
        
        // Begin transaction
        await pool.query('BEGIN');
        
        // Get current hospitalizations for this pet
        const activeHospitalizations = await pool.query(
            'SELECT id, room_id FROM pet_hospitalizations WHERE pet_id = $1 AND actual_discharge_date IS NULL',
            [petId]
        );
        
        if (activeHospitalizations.rows.length === 0) {
            logger.info('No active hospitalizations found for this pet');
            await pool.query('COMMIT');
            return null;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const results = [];
        
        // Process each active hospitalization
        for (const hospitalization of activeHospitalizations.rows) {
            logger.info(`Discharging hospitalization ID: ${hospitalization.id}, Room ID: ${hospitalization.room_id}`);
            
            // Update hospitalization record with discharge date
            const dischargeResult = await pool.query(
                'UPDATE pet_hospitalizations SET actual_discharge_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [today, hospitalization.id]
            );
            
            // Update room status back to vacant
            await pool.query(
                'UPDATE clinic_hospitalization_rooms SET room_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['vacant', hospitalization.room_id]
            );
            
            results.push(dischargeResult.rows[0]);
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        logger.info(`Successfully discharged ${results.length} hospitalizations for deleted pet`);
        
        return results;
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        logger.error('Error auto-discharging deleted pet:', error);
        throw error;
    }
}

module.exports = {
    // Room operations
    createRoom,
    getRoomsByClinic,
    getRoomById,
    updateRoom,
    updateRoomStatus,
    deleteRoom,
    
    // Hospitalization operations
    admitPet,
    dischargePet,
    getCurrentHospitalization,
    getPetHospitalizationHistory,
    getCurrentHospitalizationsByClinic,
    getHospitalizationById,
    updateExpectedDischargeDate,
    dischargeDeletedPet
};
