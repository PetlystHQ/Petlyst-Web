const pool = require('../config/db');

class Clinic {
    // Create a new clinic
    static async createClinic(clinicData) {
        const { 
            clinic_name, 
            clinic_address, 
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
                    clinic_email, 
                    clinic_operator_id, 
                    clinic_description, 
                    available_days, 
                    emergency_available_days, 
                    opening_time, 
                    closing_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *`,
                values: [
                    clinic_name, 
                    clinic_address, 
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
            // Validate and convert clinicId to a number if it's not already
            if (clinicId === undefined || clinicId === null) {
                console.error("getClinicById called with undefined or null clinicId");
                return null;
            }
            
            // Convert to integer if it's a string
            const numericClinicId = typeof clinicId === 'string' ? parseInt(clinicId, 10) : clinicId;
            
            // Check if valid number after conversion
            if (isNaN(numericClinicId)) {
                console.error(`getClinicById received invalid clinicId: ${clinicId}`);
                return null;
            }
            
            const query = {
                text: 'SELECT * FROM "clinics" WHERE clinic_id = $1',
                values: [numericClinicId]
            };
            const result = await pool.query(query);
            
            if (!result.rows[0]) return null;
            
            // Process the result - convert string arrays back to actual arrays
            const clinic = result.rows[0];
            
            // Parse available_days and emergency_available_days from string to array
            if (clinic.available_days) {
                try {
                    // Check if it's already a boolean array
                    if (Array.isArray(clinic.available_days) && 
                        clinic.available_days.length === 7 && 
                        clinic.available_days.every(item => typeof item === 'boolean')) {
                        // It's already a boolean array, no need to parse
                    } 
                    // Check if it's a stringified array but not standard JSON (PostgreSQL array format)
                    else if (typeof clinic.available_days === 'string' && 
                            clinic.available_days.startsWith('{') && 
                            clinic.available_days.endsWith('}')) {
                        // Handle PostgreSQL array format: {t,f,t,f,t,f,t}
                        clinic.available_days = clinic.available_days
                            .replace('{', '')
                            .replace('}', '')
                            .split(',')
                            .map(val => val.trim() === 't' || val.trim() === 'true');
                    }
                    // Try JSON parse for standard JSON format
                    else if (typeof clinic.available_days === 'string') {
                    clinic.available_days = JSON.parse(clinic.available_days);
                    }
                } catch (parseError) {
                    console.error('Error parsing available_days:', parseError);
                    clinic.available_days = [false, false, false, false, false, false, false]; // Default to all false if parsing fails
                }
            }
            
            if (clinic.emergency_available_days) {
                try {
                    // Check if it's already a boolean array
                    if (Array.isArray(clinic.emergency_available_days) && 
                        clinic.emergency_available_days.length === 7 && 
                        clinic.emergency_available_days.every(item => typeof item === 'boolean')) {
                        // It's already a boolean array, no need to parse
                    } 
                    // Check if it's a stringified array but not standard JSON (PostgreSQL array format)
                    else if (typeof clinic.emergency_available_days === 'string' && 
                            clinic.emergency_available_days.startsWith('{') && 
                            clinic.emergency_available_days.endsWith('}')) {
                        // Handle PostgreSQL array format: {t,f,t,f,t,f,t}
                        clinic.emergency_available_days = clinic.emergency_available_days
                            .replace('{', '')
                            .replace('}', '')
                            .split(',')
                            .map(val => val.trim() === 't' || val.trim() === 'true');
                    }
                    // Try JSON parse for standard JSON format
                    else if (typeof clinic.emergency_available_days === 'string') {
                    clinic.emergency_available_days = JSON.parse(clinic.emergency_available_days);
                    }
                } catch (parseError) {
                    console.error('Error parsing emergency_available_days:', parseError);
                    clinic.emergency_available_days = [false, false, false, false, false, false, false]; // Default to all false if parsing fails
                }
            }
            
            // Fetch phone numbers from clinic_phone_numbers table
            const phoneQuery = {
                text: 'SELECT phone_number, phone_type FROM clinic_phone_numbers WHERE clinic_id = $1',
                values: [numericClinicId]
            };
            const phoneResult = await pool.query(phoneQuery);
            
            // Add phone numbers to clinic object
            clinic.phone_numbers = phoneResult.rows.map(row => ({
                type: row.phone_type,
                number: row.phone_number
            }));
            
            // Fetch social media links from clinic_social_media table
            const socialMediaQuery = {
                text: 'SELECT platform, url FROM clinic_social_media WHERE clinic_id = $1',
                values: [numericClinicId]
            };
            const socialMediaResult = await pool.query(socialMediaQuery);
            
            // Add social media links to clinic object
            clinic.social_media = socialMediaResult.rows.map(row => ({
                platform: row.platform,
                url: row.url
            }));
            
            return clinic;
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
            
            // Process the results - convert string arrays back to actual arrays
            const clinics = result.rows.map(clinic => {
                // Parse available_days and emergency_available_days from string to array
                if (clinic.available_days) {
                    try {
                        // Check if it's already a boolean array
                        if (Array.isArray(clinic.available_days) && 
                            clinic.available_days.length === 7 && 
                            clinic.available_days.every(item => typeof item === 'boolean')) {
                            // It's already a boolean array, no need to parse
                        } 
                        // Check if it's a stringified array but not standard JSON (PostgreSQL array format)
                        else if (typeof clinic.available_days === 'string' && 
                                clinic.available_days.startsWith('{') && 
                                clinic.available_days.endsWith('}')) {
                            // Handle PostgreSQL array format: {t,f,t,f,t,f,t}
                            clinic.available_days = clinic.available_days
                                .replace('{', '')
                                .replace('}', '')
                                .split(',')
                                .map(val => val.trim() === 't' || val.trim() === 'true');
                        }
                        // Try JSON parse for standard JSON format
                        else if (typeof clinic.available_days === 'string') {
                        clinic.available_days = JSON.parse(clinic.available_days);
                        }
                    } catch (parseError) {
                        console.error('Error parsing available_days:', parseError);
                        clinic.available_days = [false, false, false, false, false, false, false]; // Default to all false if parsing fails
                    }
                }
                
                if (clinic.emergency_available_days) {
                    try {
                        // Check if it's already a boolean array
                        if (Array.isArray(clinic.emergency_available_days) && 
                            clinic.emergency_available_days.length === 7 && 
                            clinic.emergency_available_days.every(item => typeof item === 'boolean')) {
                            // It's already a boolean array, no need to parse
                        } 
                        // Check if it's a stringified array but not standard JSON (PostgreSQL array format)
                        else if (typeof clinic.emergency_available_days === 'string' && 
                                clinic.emergency_available_days.startsWith('{') && 
                                clinic.emergency_available_days.endsWith('}')) {
                            // Handle PostgreSQL array format: {t,f,t,f,t,f,t}
                            clinic.emergency_available_days = clinic.emergency_available_days
                                .replace('{', '')
                                .replace('}', '')
                                .split(',')
                                .map(val => val.trim() === 't' || val.trim() === 'true');
                        }
                        // Try JSON parse for standard JSON format
                        else if (typeof clinic.emergency_available_days === 'string') {
                        clinic.emergency_available_days = JSON.parse(clinic.emergency_available_days);
                        }
                    } catch (parseError) {
                        console.error('Error parsing emergency_available_days:', parseError);
                        clinic.emergency_available_days = [false, false, false, false, false, false, false]; // Default to all false if parsing fails
                    }
                }
                
                return clinic;
            });
            
            // Fetch phone numbers for each clinic
            for (const clinic of clinics) {
                const phoneQuery = {
                    text: 'SELECT phone_number, phone_type FROM clinic_phone_numbers WHERE clinic_id = $1',
                    values: [clinic.clinic_id]
                };
                const phoneResult = await pool.query(phoneQuery);
                
                // Add phone numbers to clinic object
                clinic.phone_numbers = phoneResult.rows.map(row => ({
                    type: row.phone_type,
                    number: row.phone_number
                }));
                
                // Fetch social media links for each clinic
                const socialMediaQuery = {
                    text: 'SELECT platform, url FROM clinic_social_media WHERE clinic_id = $1',
                    values: [clinic.clinic_id]
                };
                const socialMediaResult = await pool.query(socialMediaQuery);
                
                // Add social media links to clinic object
                clinic.social_media = socialMediaResult.rows.map(row => ({
                    platform: row.platform,
                    url: row.url
                }));
            }
            
            return clinics;
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
                `
            };
            const result = await pool.query(query);
            
            // Process the results - convert string arrays back to actual arrays
            const clinics = result.rows.map(clinic => {
                // Parse available_days and emergency_available_days from string to array
                if (clinic.available_days) {
                    try {
                        clinic.available_days = JSON.parse(clinic.available_days);
                    } catch (parseError) {
                        console.error('Error parsing available_days:', parseError);
                        clinic.available_days = []; // Default to empty array if parsing fails
                    }
                }
                
                if (clinic.emergency_available_days) {
                    try {
                        clinic.emergency_available_days = JSON.parse(clinic.emergency_available_days);
                    } catch (parseError) {
                        console.error('Error parsing emergency_available_days:', parseError);
                        clinic.emergency_available_days = []; // Default to empty array if parsing fails
                    }
                }
                
                return clinic;
            });
            
            return clinics;
        } catch (error) {
            console.error('Error getting pending clinics:', error);
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
                clinic_type: 'clinic_type',
                clinic_email: 'clinic_email',
                clinic_description: 'clinic_description',
                available_days: 'available_days',
                emergency_available_days: 'emergency_available_days',
                opening_time: 'opening_time',
                closing_time: 'closing_time',
                clinic_verification_status: 'clinic_verification_status',
                establishment_year: 'establishment_year',
                establishment_month: 'establishment_month',
                show_phone_number: 'show_phone_number',
                show_mail_address: 'show_mail_address',
                allow_direct_messages: 'allow_direct_messages',
                clinic_creation_status: 'clinic_creation_status',
                tax_identification_number: 'tax_identification_number',
                veterinary_license_number: 'veterinary_license_number',
                allow_online_meetings: 'allow_online_meetings'
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
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // First check if clinic exists and has a pending status
            const checkQuery = {
                text: 'SELECT clinic_id, clinic_verification_status FROM "clinics" WHERE clinic_id = $1',
                values: [clinicId]
            };
            
            const checkResult = await client.query(checkQuery);
            
            if (!checkResult.rows[0]) {
                throw new Error('Clinic not found');
            }
            
            const clinic = checkResult.rows[0];
            if (clinic.clinic_verification_status !== 'pending') {
                throw new Error('Only clinics with "pending" status can be deleted');
            }

            // Delete related records in dependent tables in correct order to avoid foreign key constraints
            
            // 1. First delete from clinic_locations table (this was causing the constraint error)
            await client.query(
                'DELETE FROM clinic_locations WHERE clinic_id = $1',
                [clinicId]
            );
            
            // 2. Delete related appointments and their dependent records
            // First, get all appointments for this clinic
            const getAppointmentsQuery = {
                text: 'SELECT appointment_id FROM appointments WHERE clinic_id = $1',
                values: [clinicId]
            };
            
            const appointmentsResult = await client.query(getAppointmentsQuery);
            
            for (const appointment of appointmentsResult.rows) {
                const appointmentId = appointment.appointment_id;
                
                // Delete treatments related to this appointment
                await client.query(
                    'DELETE FROM treatments WHERE appointment_id = $1',
                    [appointmentId]
                );
                
                // Delete clinic reviews related to this appointment
                await client.query(
                    'DELETE FROM clinicreviews WHERE appointment_id = $1',
                    [appointmentId]
                );
                
                // Delete veterinarian reviews related to this appointment
                await client.query(
                    'DELETE FROM veterinarianreviews WHERE appointment_id = $1',
                    [appointmentId]
                );
            }
            
            // Now delete all appointments for this clinic
            await client.query(
                'DELETE FROM appointments WHERE clinic_id = $1',
                [clinicId]
            );
            
            // 3. Delete related records in other tables
            // Delete clinic photos
            await client.query(
                'DELETE FROM clinicalbum WHERE clinic_id = $1',
                [clinicId]
            );
            
            // Delete clinic social media links
            await client.query(
                'DELETE FROM clinic_social_media WHERE clinic_id = $1',
                [clinicId]
            );
            
            // Delete clinic animal types
            await client.query(
                'DELETE FROM clinic_animal_types WHERE clinic_id = $1',
                [clinicId]
            );
            
            // Delete clinic medical services
            await client.query(
                'DELETE FROM clinic_medical_services WHERE clinic_id = $1',
                [clinicId]
            );
            
            // Delete clinic additional services
            await client.query(
                'DELETE FROM clinic_additional_services WHERE clinic_id = $1',
                [clinicId]
            );
            
            // Delete clinic phone numbers
            await client.query(
                'DELETE FROM clinic_phone_numbers WHERE clinic_id = $1',
                [clinicId]
            );
            
            // Finally, delete the clinic itself
            const deleteClinicQuery = {
                text: 'DELETE FROM "clinics" WHERE clinic_id = $1 RETURNING clinic_id',
                values: [clinicId]
            };
            
            const result = await client.query(deleteClinicQuery);
            
            if (!result.rows[0]) {
                throw new Error('Clinic deletion failed');
            }
            
            await client.query('COMMIT');
            return { id: result.rows[0].clinic_id };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in deleteClinic:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Clinic; 