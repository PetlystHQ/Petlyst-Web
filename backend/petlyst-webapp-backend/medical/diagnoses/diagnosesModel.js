const pool = require('../../config/db');

/**
 * Diagnoses operations
 */

// Create a new diagnosis
async function createDiagnosis(diagnosisData) {
    try {
        const {
            examination_id,
            diagnosis_type,
            diagnosis_code,
            diagnosis_name,
            description,
            diagnosis_date,
            severity,
            notes
        } = diagnosisData;

        // Verify examination exists and is in a valid status for diagnosis
        const examinationCheck = await pool.query(
            `SELECT examination_id, status FROM examinations WHERE examination_id = $1`,
            [examination_id]
        );
        
        if (examinationCheck.rows.length === 0) {
            throw new Error(`Examination with ID ${examination_id} not found`);
        }
        
        const examination = examinationCheck.rows[0];
        if (examination.status === 'scheduled' || examination.status === 'cancelled') {
            throw new Error('Cannot add diagnosis to a scheduled or cancelled examination');
        }

        const result = await pool.query(
            `INSERT INTO diagnoses (
                examination_id,
                diagnosis_type,
                diagnosis_code,
                diagnosis_name,
                description,
                diagnosis_date,
                severity,
                notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                examination_id,
                diagnosis_type,
                diagnosis_code,
                diagnosis_name,
                description,
                diagnosis_date || new Date(),
                severity,
                notes
            ]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating diagnosis:', error);
        throw error;
    }
}

// Get a specific diagnosis by ID
async function getDiagnosis(diagnosisId) {
    try {
        const result = await pool.query(
            `SELECT d.*, 
                    e.pet_id, e.vet_id, e.examination_date,
                    p.pet_name, p.pet_species, p.pet_breed,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM diagnoses d
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN pets p ON e.pet_id = p.pet_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             WHERE d.diagnosis_id = $1
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)`,
            [diagnosisId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error getting diagnosis:', error);
        throw error;
    }
}

// List diagnoses with various filters
async function listDiagnoses(filters, limit = 20, offset = 0) {
    try {
        let query = `
            SELECT d.*, 
                   e.pet_id, e.vet_id, e.examination_date,
                   p.pet_name, p.pet_species, p.pet_breed,
                   CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
            FROM diagnoses d
            JOIN examinations e ON d.examination_id = e.examination_id
            JOIN pets p ON e.pet_id = p.pet_id
            JOIN veterinarians v ON e.vet_id = v.veterinarian_id
            JOIN users u ON v.veterinarian_id = u.user_id
            WHERE 1=1
            AND (p.pet_status = 'active' OR p.pet_status IS NULL)
        `;
        
        const queryParams = [];
        let paramIndex = 1;
        
        // Apply filters
        if (filters.examination_id) {
            query += ` AND d.examination_id = $${paramIndex}`;
            queryParams.push(filters.examination_id);
            paramIndex++;
        }
        
        if (filters.diagnosis_type) {
            query += ` AND d.diagnosis_type = $${paramIndex}`;
            queryParams.push(filters.diagnosis_type);
            paramIndex++;
        }
        
        if (filters.diagnosis_code) {
            query += ` AND d.diagnosis_code = $${paramIndex}`;
            queryParams.push(filters.diagnosis_code);
            paramIndex++;
        }
        
        if (filters.diagnosis_name) {
            query += ` AND d.diagnosis_name ILIKE $${paramIndex}`;
            queryParams.push(`%${filters.diagnosis_name}%`);
            paramIndex++;
        }
        
        if (filters.pet_id) {
            query += ` AND e.pet_id = $${paramIndex}`;
            queryParams.push(filters.pet_id);
            paramIndex++;
        }
        
        if (filters.vet_id) {
            query += ` AND e.vet_id = $${paramIndex}`;
            queryParams.push(filters.vet_id);
            paramIndex++;
        }
        
        if (filters.severity) {
            query += ` AND d.severity = $${paramIndex}`;
            queryParams.push(filters.severity);
            paramIndex++;
        }
        
        // Date range filters
        if (filters.start_date) {
            query += ` AND d.diagnosis_date >= $${paramIndex}`;
            queryParams.push(filters.start_date);
            paramIndex++;
        }
        
        if (filters.end_date) {
            query += ` AND d.diagnosis_date <= $${paramIndex}`;
            queryParams.push(filters.end_date);
            paramIndex++;
        }
        
        // Add order by, limit and offset
        query += ` ORDER BY d.diagnosis_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex+1}`;
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        return result.rows;
    } catch (error) {
        console.error('Error listing diagnoses:', error);
        throw error;
    }
}

// Update diagnosis
async function updateDiagnosis(diagnosisId, updateData) {
    try {
        const {
            diagnosis_type,
            diagnosis_code,
            diagnosis_name,
            description,
            severity,
            notes
        } = updateData;
        
        // Only update fields that are provided
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;
        
        if (diagnosis_type !== undefined) {
            updateFields.push(`diagnosis_type = $${paramIndex}`);
            queryParams.push(diagnosis_type);
            paramIndex++;
        }
        
        if (diagnosis_code !== undefined) {
            updateFields.push(`diagnosis_code = $${paramIndex}`);
            queryParams.push(diagnosis_code);
            paramIndex++;
        }
        
        if (diagnosis_name !== undefined) {
            updateFields.push(`diagnosis_name = $${paramIndex}`);
            queryParams.push(diagnosis_name);
            paramIndex++;
        }
        
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            queryParams.push(description);
            paramIndex++;
        }
        
        if (severity !== undefined) {
            updateFields.push(`severity = $${paramIndex}`);
            queryParams.push(severity);
            paramIndex++;
        }
        
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            queryParams.push(notes);
            paramIndex++;
        }
        
        // Add updated_at
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // If no fields to update, just return the current diagnosis
        if (updateFields.length === 1) {
            return getDiagnosis(diagnosisId);
        }
        
        queryParams.push(diagnosisId);
        
        const query = `
            UPDATE diagnoses
            SET ${updateFields.join(', ')}
            WHERE diagnosis_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(query, queryParams);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating diagnosis:', error);
        throw error;
    }
}

// Delete a diagnosis (for admin purposes or data cleanup)
async function deleteDiagnosis(diagnosisId) {
    try {
        // Skip treatments check since table doesn't exist
        // Uncomment this when treatments table is implemented
        /*
        const treatmentsCheck = await pool.query(
            'SELECT COUNT(*) FROM treatments WHERE diagnosis_id = $1',
            [diagnosisId]
        );
        
        if (parseInt(treatmentsCheck.rows[0].count) > 0) {
            throw new Error('Cannot delete diagnosis with associated treatments');
        }
        */
        
        const result = await pool.query(
            'DELETE FROM diagnoses WHERE diagnosis_id = $1 RETURNING *',
            [diagnosisId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting diagnosis:', error);
        throw error;
    }
}

// Get all diagnoses for a specific pet
async function getPetDiagnoses(petId) {
    try {
        const result = await pool.query(
            `SELECT d.*, 
                    e.examination_date,
                    CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name
             FROM diagnoses d
             JOIN examinations e ON d.examination_id = e.examination_id
             JOIN veterinarians v ON e.vet_id = v.veterinarian_id
             JOIN users u ON v.veterinarian_id = u.user_id
             JOIN pets p ON e.pet_id = p.pet_id
             WHERE e.pet_id = $1
             AND (p.pet_status = 'active' OR p.pet_status IS NULL)
             ORDER BY d.diagnosis_date DESC`,
            [petId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting pet diagnoses:', error);
        throw error;
    }
}

// Get all diagnoses for a specific examination
async function getExaminationDiagnoses(examinationId) {
    try {
        const result = await pool.query(
            `SELECT d.* 
             FROM diagnoses d
             WHERE d.examination_id = $1
             ORDER BY d.diagnosis_date DESC`,
            [examinationId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting examination diagnoses:', error);
        throw error;
    }
}

// Get standard diagnoses (for dropdown selection)
async function getStandardDiagnoses(species = null) {
    try {
        let query = `
            SELECT code, name, description, category 
            FROM standard_diagnoses 
            WHERE is_active = true
        `;
        
        const queryParams = [];
        
        if (species) {
            query += ` AND (species = $1 OR species IS NULL)`;
            queryParams.push(species);
        }
        
        query += ` ORDER BY category, name`;
        
        const result = await pool.query(query, queryParams);
        return result.rows;
    } catch (error) {
        console.error('Error getting standard diagnoses:', error);
        throw error;
    }
}

module.exports = {
    createDiagnosis,
    getDiagnosis,
    listDiagnoses,
    updateDiagnosis,
    deleteDiagnosis,
    getPetDiagnoses,
    getExaminationDiagnoses,
    getStandardDiagnoses
};
