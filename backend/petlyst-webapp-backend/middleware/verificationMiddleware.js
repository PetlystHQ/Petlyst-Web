const pool = require('../config/db');
const logger = require('../config/logger');

// Returns 404 if user not found
// Returns 403 if user is not a veterinarian
// Returns 403 if veterinarian is not verified  

const checkVerificationStatus = async (req, res, next) => {
    try {
        // Assumes authenticateToken middleware has already run and req.user is available
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = req.user.userId;

        // First check if user is a veterinarian in users table
        const userQuery = `
            SELECT user_type 
            FROM users 
            WHERE user_id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);

        if (!userResult.rows.length) {
            return res.status(404).json({ 
                message: 'User not found.' 
            });
        }

        if (userResult.rows[0].user_type !== 'veterinarian') {
            return res.status(403).json({ 
                message: 'Access denied. User is not a veterinarian.' 
            });
        }

        // Then check verification status in veterinarians table
        const verificationQuery = `
            SELECT veterinarian_verification_status 
            FROM veterinarians 
            WHERE veterinarian_id = $1
        `;
        const verificationResult = await pool.query(verificationQuery, [userId]);

        if (!verificationResult.rows.length) {
            return res.status(404).json({ 
                message: 'Veterinarian profile not found.' 
            });
        }

        if (verificationResult.rows[0].veterinarian_verification_status !== 'verified') {
            return res.status(403).json({ 
                message: 'Access denied. Veterinarian must be verified to perform this action.' 
            });
        }

        next();
    } catch (error) {
        logger.error('Error checking verification status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    checkVerificationStatus
}; 