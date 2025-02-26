const pool = require('../config/db');

class PetOwner {
    static async createPetOwner(userId) {
        try {
            const query = {
                text: `INSERT INTO "petowners" (pet_owner_id) 
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
            console.error('Error in createPetOwner:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const query = {
                text: 'SELECT * FROM "petowners" WHERE pet_owner_id = $1',
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
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }
}

module.exports = PetOwner; 