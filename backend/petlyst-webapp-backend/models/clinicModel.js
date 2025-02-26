const pool = require('../config/db');

class Clinic {
    // Create a new clinic
    static async createClinic(clinicData) {
        const { 
            clinic_name, 
            clinic_address, 
            clinic_phone, 
            clinic_email, 
            clinic_operator_id, 
            clinic_description, 
            available_days, 
            emergency_available_days, 
            opening_time, 
            closing_time 
        } = clinicData;

        try {
            const query = {
                text: `INSERT INTO "clinics" (
                    clinic_name, 
                    clinic_address, 
                    clinic_phone, 
                    clinic_email, 
                    clinic_operator_id, 
                    clinic_description, 
                    available_days, 
                    emergency_available_days, 
                    opening_time, 
                    closing_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`,
                values: [
                    clinic_name, 
                    clinic_address, 
                    clinic_phone || null, 
                    clinic_email || null, 
                    clinic_operator_id, 
                    clinic_description || null, 
                    available_days, 
                    emergency_available_days || null, 
                    opening_time, 
                    closing_time
                ]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Clinic creation failed');
            }
            
            return result.rows[0];
            
        } catch (error) {
            console.error('Error in createClinic:', error);
            throw error;
        }
    }

    // Get clinic by id
    static async getClinicById(clinicId) {
        try {
            const query = {
                text: 'SELECT * FROM "clinics" WHERE clinic_id = $1',
                values: [clinicId]
            };
            const result = await pool.query(query);
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error in getClinicById:', error);
            throw error;
        }
    }

    // Get all clinics for a specific operator (veterinarian)
    static async getClinicsByOperatorId(operatorId) {
        try {
            const query = {
                text: 'SELECT * FROM "clinics" WHERE clinic_operator_id = $1 ORDER BY clinic_created_at DESC',
                values: [operatorId]
            };
            const result = await pool.query(query);
            
            return result.rows;
        } catch (error) {
            console.error('Error in getClinicsByOperatorId:', error);
            throw error;
        }
    }

    // Get all pending clinics (for admin)
    static async getPendingClinics() {
        try {
            const query = {
                text: `
                    SELECT c.*, u.user_name as operator_name, u.user_surname as operator_surname
                    FROM clinics c
                    JOIN "users" u ON c.clinic_operator_id = u.user_id
                    WHERE c.clinic_verification_status = 'pending'
                    ORDER BY c.clinic_created_at DESC
                `
            };
            const result = await pool.query(query);
            
            return result.rows;
        } catch (error) {
            console.error('Error in getPendingClinics:', error);
            throw error;
        }
    }

    // Update clinic information
    static async updateClinic(clinicId, updateData) {
        try {
            // Construct the update query dynamically based on the fields to update
            const updateFields = [];
            const values = [];
            let valueCounter = 1;

            // Map of field names to database column names
            const fieldMap = {
                clinic_name: 'clinic_name',
                clinic_address: 'clinic_address',
                clinic_phone: 'clinic_phone',
                clinic_email: 'clinic_email',
                clinic_description: 'clinic_description',
                available_days: 'available_days',
                emergency_available_days: 'emergency_available_days',
                opening_time: 'opening_time',
                closing_time: 'closing_time',
                clinic_verification_status: 'clinic_verification_status'
            };

            // Build update fields and values arrays
            Object.entries(updateData).forEach(([key, value]) => {
                if (fieldMap[key] && value !== undefined) {
                    updateFields.push(`${fieldMap[key]} = $${valueCounter}`);
                    values.push(value);
                    valueCounter++;
                }
            });

            // Always update the updated_at timestamp
            updateFields.push(`clinic_updated_at = CURRENT_TIMESTAMP`);

            // If no fields to update, return the current clinic data
            if (updateFields.length === 0) {
                return await this.getClinicById(clinicId);
            }

            // Add the clinicId as the last parameter
            values.push(clinicId);

            const query = {
                text: `UPDATE "clinics" 
                       SET ${updateFields.join(', ')} 
                       WHERE clinic_id = $${valueCounter} 
                       RETURNING *`,
                values: values
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Clinic update failed');
            }
            
            return result.rows[0];
            
        } catch (error) {
            console.error('Error in updateClinic:', error);
            throw error;
        }
    }

    // Update clinic verification status (for admin)
    static async updateVerificationStatus(clinicId, newStatus) {
        try {
            const validStatuses = ['pending', 'verified', 'not_verified'];
            
            if (!validStatuses.includes(newStatus)) {
                throw new Error('Invalid verification status');
            }
            
            const query = {
                text: `
                    UPDATE clinics 
                    SET clinic_verification_status = $1
                    WHERE clinic_id = $2 
                    RETURNING *
                `,
                values: [newStatus, clinicId]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Clinic status update failed');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error in updateVerificationStatus:', error);
            throw error;
        }
    }

    // Delete a clinic
    static async deleteClinic(clinicId) {
        try {
            const query = {
                text: 'DELETE FROM "clinics" WHERE clinic_id = $1 RETURNING clinic_id',
                values: [clinicId]
            };
            
            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Clinic deletion failed - Clinic not found');
            }
            
            return { id: result.rows[0].clinic_id };
        } catch (error) {
            console.error('Error in deleteClinic:', error);
            throw error;
        }
    }
}

module.exports = Clinic; 