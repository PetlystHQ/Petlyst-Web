const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const checkVerificationStatus = async (req, res, next) => {
    try {
        // Check if token exists and is valid
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token is required' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            console.log('Decoded token:', decoded); // Debug log
        } catch (error) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        const userId = req.user.userId;
        console.log('Checking verification for userId:', userId); // Debug log

        // First check if user is a veterinarian in users table
        const userQuery = `
            SELECT user_type 
            FROM users 
            WHERE id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);
        console.log('User type result:', userResult.rows[0]); // Debug log

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

        // Then check verification status in veterinarianprofile table
        const verificationQuery = `
            SELECT verification_status 
            FROM veterinarianprofile 
            WHERE user_id = $1
        `;
        const verificationResult = await pool.query(verificationQuery, [userId]);
        console.log('Verification status result:', verificationResult.rows[0]); // Debug log

        if (!verificationResult.rows.length) {
            return res.status(404).json({ 
                message: 'Veterinarian profile not found.' 
            });
        }

        if (verificationResult.rows[0].verification_status !== 'verified') {
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