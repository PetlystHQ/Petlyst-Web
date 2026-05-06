const pool = require('../config/db');
const logger = require('../config/logger');

class PetOwner {
    static async createPetOwner(userId) {
        try {
            const query = {
                text: `INSERT INTO "pet_owners" (pet_owner_id) 
                       VALUES ($1) 
                       RETURNING pet_owner_id`,
                values: [userId]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Pet owner profile creation failed');
            }
            
            return {
                id: result.rows[0].pet_owner_id
            };
            
        } catch (error) {
            logger.error('Error in createPetOwner:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const query = {
                text: 'SELECT * FROM "pet_owners" WHERE pet_owner_id = $1',
                values: [userId]
            };
            const result = await pool.query(query);
            
            if (result.rows[0]) {
                return {
                    id: result.rows[0].pet_owner_id
                };
            }
            return null;
        } catch (error) {
            logger.error('Error in findByUserId:', error);
            throw error;
        }
    }

    static async updateProfile(userId, userData) {
        try {
            logger.info('Updating profile for user:', userId);
            logger.info('With data:', userData);
            
            const { phone, address, profilePhoto } = userData;
            
            let query;
            
            if (profilePhoto === null) {
                logger.info('Explicitly setting profile photo to NULL in database');
                query = {
                    text: `UPDATE users
                           SET user_phone = COALESCE($1, user_phone),
                               user_address = COALESCE($2, user_address),
                               user_profile_photo = NULL,
                               user_updated_at = CURRENT_TIMESTAMP
                           WHERE user_id = $3
                           RETURNING user_id, user_name, user_surname, user_email, 
                                     user_phone, user_address, user_profile_photo, user_type`,
                    values: [phone, address, userId]
                };
            } else {
                logger.info('Using COALESCE for profile photo update');
                query = {
                    text: `UPDATE users
                           SET user_phone = COALESCE($1, user_phone),
                               user_address = COALESCE($2, user_address),
                               user_profile_photo = COALESCE($3, user_profile_photo),
                               user_updated_at = CURRENT_TIMESTAMP
                           WHERE user_id = $4
                           RETURNING user_id, user_name, user_surname, user_email, 
                                     user_phone, user_address, user_profile_photo, user_type`,
                    values: [phone, address, profilePhoto, userId]
                };
            }
            
            logger.info('Executing SQL query:', query.text);
            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('Profile update failed - no rows returned');
            }
            
            logger.info('Profile updated successfully:', result.rows[0]);
            
            return {
                id: result.rows[0].user_id,
                name: result.rows[0].user_name,
                surname: result.rows[0].user_surname,
                email: result.rows[0].user_email,
                phone: result.rows[0].user_phone,
                address: result.rows[0].user_address,
                profile_photo: result.rows[0].user_profile_photo,
                user_type: result.rows[0].user_type
            };
        } catch (error) {
            logger.error('Error in updateProfile:', error);
            throw error;
        }
    }
}

module.exports = PetOwner; 