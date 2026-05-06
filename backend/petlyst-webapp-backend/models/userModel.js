const pool = require('../config/db');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');

class User {
    static async createUser(name, surname, email, password, user_type) {
        try {
            logger.info('Creating user with:', { name, surname, email, user_type });
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const query = {
                text: `INSERT INTO "users" (user_name, user_surname, user_email, user_password, user_type) 
                       VALUES ($1, $2, $3, $4, $5) 
                       RETURNING user_id, user_name, user_surname, user_email, user_type`,
                values: [name, surname, email, hashedPassword, user_type]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('User creation failed');
            }
            
            // Map the returned columns to the expected format
            const user = {
                id: result.rows[0].user_id,
                name: result.rows[0].user_name,
                surname: result.rows[0].user_surname,
                email: result.rows[0].user_email,
                user_type: result.rows[0].user_type
            };
            
            return user;
            
        } catch (error) {
            logger.error('Error in createUser:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        const query = {
            text: 'SELECT * FROM "users" WHERE user_email = $1',
            values: [email]
        };
        const result = await pool.query(query);
        
        if (result.rows[0]) {
            // Map the returned columns to the expected format
            return {
                id: result.rows[0].user_id,
                name: result.rows[0].user_name,
                surname: result.rows[0].user_surname,
                email: result.rows[0].user_email,
                password: result.rows[0].user_password,
                user_type: result.rows[0].user_type
            };
        }
        return null;
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User; 