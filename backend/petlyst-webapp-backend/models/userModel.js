const pool = require('../config/db');
const bcrypt = require('bcrypt');

class User {
    static async createUser(name, surname, email, password, user_type) {
        try {
            console.log('Creating user with:', { name, surname, email, user_type });
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const query = {
                text: `INSERT INTO users (name, surname, email, password, user_type) 
                       VALUES ($1, $2, $3, $4, $5) 
                       RETURNING id, name, surname, email, user_type`,
                values: [name, surname, email, hashedPassword, user_type]
            };

            const result = await pool.query(query);
            
            if (!result.rows[0]) {
                throw new Error('User creation failed');
            }
            
            return result.rows[0];
            
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User; 