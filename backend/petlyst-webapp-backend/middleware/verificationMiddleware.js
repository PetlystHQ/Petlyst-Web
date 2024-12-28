const pool = require('../config/db');

const checkVerificationStatus = async (req, res, next) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ 
                message: 'Access denied. User is not a veterinarian.' 
            });
        }

        const userId = req.user.userId;

        // Query to get verification status from veterinarianprofile table
        const query = `
            SELECT verification_status 
            FROM veterinarianprofile 
            WHERE user_id = $1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Veterinarian profile not found.' 
            });
        }

        if (result.rows[0].verification_status !== 'verified') {
            return res.status(403).json({ 
                message: 'Access denied. Veterinarian must be verified to perform this action.' 
            });
        }

        next();
    } catch (error) {
        console.error('Error checking verification status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    checkVerificationStatus
}; 