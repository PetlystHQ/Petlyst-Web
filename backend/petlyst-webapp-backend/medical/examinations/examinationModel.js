const pool = require('../../config/db');
const logger = require('../../config/logger');

/**
 * Examination operations
 */

// Create a new examination
async function createExamination(examinationData) {
    try {
        const {
            pet_id,
            vet_id,
            appointment_id,
            status,
            temperature,
            heart_rate,
            respiratory_rate,
            weight,
            notes
        } = examinationData;

        const result = await pool.query(
            `INSERT INTO examinations (
                pet_id, 
                vet_id, 
                appointment_id, 
                status, 
                temperature, 
                heart_rate, 
                respiratory_rate, 
                weight, 
                notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                pet_id,
                vet_id,
                appointment_id,
                status,
                temperature,
                heart_rate,
                respiratory_rate,
                weight,
                notes
            ]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error creating examination:', error);
        throw error;
    }
}

// Get a specific examination by ID
async function getExamination(examinationId) {
    try {
        const result = await pool.query(
            `SELECT e.*, 
                    p.pet_name, p.pet_species, p.pet_breed,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM examinations e
             JOIN pets p ON e.pet_id = p.pet_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             WHERE e.examination_id = $1
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)`,
            [examinationId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting examination:', error);
        throw error;
    }
}

// List examinations with various filters
async function listExaminations(filters, limit, offset) {
    try {
        logger.info('=== ExaminationModel.listExaminations STARTED ===');
        logger.info('Incoming filters:', JSON.stringify(filters, null, 2));
        logger.info('Limit:', limit, 'Offset:', offset);
        
        // Limit and offset default values if not provided
        limit = limit || 20;
        offset = offset || 0;
        logger.info('Final limit:', limit, 'Final offset:', offset);
        
        let query = `
            SELECT e.*, 
                   p.pet_name, p.pet_species, p.pet_breed,
                   CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
            FROM examinations e
            LEFT JOIN pets p ON e.pet_id = p.pet_id
            LEFT JOIN veterinarians v ON e.vet_id = v.veterinarian_id
            LEFT JOIN users u ON v.veterinarian_id = u.user_id
            WHERE 1=1
            AND (p.pet_status = 'active' OR p.pet_status IS NULL)
        `;
        
        const queryParams = [];
        let paramIndex = 1;
        
        // Apply filters
        if (filters.pet_id) {
            logger.info('Adding pet_id filter:', filters.pet_id);
            query += ` AND e.pet_id = $${paramIndex}`;
            queryParams.push(filters.pet_id);
            paramIndex++;
        }
        
        if (filters.vet_id) {
            logger.info('Adding vet_id filter:', filters.vet_id);
            query += ` AND e.vet_id = $${paramIndex}`;
            queryParams.push(filters.vet_id);
            paramIndex++;
        }
        
        if (filters.status) {
            logger.info('Processing status filter:', filters.status);
            // Check if it's a comma-separated list of statuses
            if (filters.status.includes(',')) {
                const statuses = filters.status.split(',').map(s => s.trim());
                logger.info('Status list after splitting:', statuses);
                query += ` AND e.status IN (${statuses.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
                queryParams.push(...statuses);
                logger.info('Status parameters added to query:', statuses);
                paramIndex += statuses.length;
            } else {
                query += ` AND e.status = $${paramIndex}`;
                queryParams.push(filters.status);
                logger.info('Single status parameter added:', filters.status);
                paramIndex++;
            }
        }
        
        // Date filters
        if (filters.start_date) {
            logger.info('Adding start_date filter:', filters.start_date);
            query += ` AND e.created_at >= $${paramIndex}`;
            queryParams.push(filters.start_date);
            paramIndex++;
        }
        
        if (filters.end_date) {
            logger.info('Adding end_date filter:', filters.end_date);
            query += ` AND e.created_at <= $${paramIndex}`;
            queryParams.push(filters.end_date);
            paramIndex++;
        }
        
        // Get the total count before applying limit and offset for pagination
        const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
        logger.info('Count query:', countQuery);
        logger.info('Count query params:', queryParams);
        
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].count);
        logger.info('Total count before pagination:', totalCount);
        
        // Add order by, limit and offset
        query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex+1}`;
        queryParams.push(limit, offset);
        
        logger.info('Final SQL query:', {
            text: query,
            params: queryParams
        });
        
        logger.info('Executing query...');
        const result = await pool.query(query, queryParams);
        logger.info(`Query executed. Examinations found: ${result.rows.length}`);
        
        // Log examination IDs for debugging
        if (result.rows.length > 0) {
            logger.info('Found examination IDs:', result.rows.map(row => row.examination_id));
            logger.info('Statuses of found examinations:', result.rows.map(row => row.status));
            // Log pet names to verify they're being returned
            logger.info('Pet names of found examinations:', result.rows.map(row => row.pet_name || 'NOT FOUND'));
            // Log the first complete row to check all fields
            logger.info('Sample examination data:', result.rows[0]);
        } else {
            logger.info('No examinations matched the query criteria');
        }
        
        logger.info('=== ExaminationModel.listExaminations COMPLETED ===');
        return result.rows;
    } catch (error) {
        logger.error('ERROR in ExaminationModel.listExaminations:', error);
        logger.error('Error stack:', error.stack);
        // Return empty array instead of throwing to prevent frontend from crashing
        return [];
    }
}

// Update examination
async function updateExamination(examinationId, updateData) {
    try {
        const {
            status,
            temperature,
            heart_rate,
            respiratory_rate,
            weight,
            notes
        } = updateData;
        
        // Only update fields that are provided
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        
        if (temperature !== undefined) {
            updateFields.push(`temperature = $${paramIndex}`);
            queryParams.push(temperature);
            paramIndex++;
        }
        
        if (heart_rate !== undefined) {
            updateFields.push(`heart_rate = $${paramIndex}`);
            queryParams.push(heart_rate);
            paramIndex++;
        }
        
        if (respiratory_rate !== undefined) {
            updateFields.push(`respiratory_rate = $${paramIndex}`);
            queryParams.push(respiratory_rate);
            paramIndex++;
        }
        
        if (weight !== undefined) {
            updateFields.push(`weight = $${paramIndex}`);
            queryParams.push(weight);
            paramIndex++;
        }
        
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            queryParams.push(notes);
            paramIndex++;
        }
        
        // Add updated_at
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // If no fields to update, just return the current examination
        if (updateFields.length === 1) {
            return getExamination(examinationId);
        }
        
        queryParams.push(examinationId);
        
        const query = `
            UPDATE examinations
            SET ${updateFields.join(', ')}
            WHERE examination_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(query, queryParams);
        return result.rows[0];
    } catch (error) {
        logger.error('Error updating examination:', error);
        throw error;
    }
}

// Update examination status
async function updateExaminationStatus(examinationId, status) {
    try {
        const result = await pool.query(
            `UPDATE examinations 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE examination_id = $2 
             RETURNING *`,
            [status, examinationId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error updating examination status:', error);
        throw error;
    }
}

// Get examination history for a pet
async function getPetExaminationHistory(petId) {
    try {
        const result = await pool.query(
            `SELECT e.*, 
                    p.pet_name, p.pet_species, p.pet_breed,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM examinations e
             JOIN pets p ON e.pet_id = p.pet_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             WHERE e.pet_id = $1
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)
             ORDER BY e.created_at DESC`,
            [petId]
        );
        return result.rows;
    } catch (error) {
        logger.error('Error getting pet examination history:', error);
        throw error;
    }
}

// Delete an examination (for admin purposes or data cleanup)
async function deleteExamination(examinationId) {
    try {
        // Check if any diagnoses are associated with this examination
        const diagnosesCheck = await pool.query(
            'SELECT COUNT(*) FROM diagnoses WHERE examination_id = $1',
            [examinationId]
        );
        
        if (parseInt(diagnosesCheck.rows[0].count) > 0) {
            throw new Error('Cannot delete examination with associated diagnoses');
        }
        
        const result = await pool.query(
            'DELETE FROM examinations WHERE examination_id = $1 RETURNING *',
            [examinationId]
        );
        return result.rows[0];
    } catch (error) {
        logger.error('Error deleting examination:', error);
        throw error;
    }
}

module.exports = {
    createExamination,
    getExamination,
    listExaminations,
    updateExamination,
    updateExaminationStatus,
    getPetExaminationHistory,
    deleteExamination
};
