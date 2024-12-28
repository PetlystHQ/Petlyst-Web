const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');

// Get Veterinarian Verification Status for Authenticated Veterinary
router.get('/verification-status', authenticateToken, async (req, res) => {
    try {
        // Check if the user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
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
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }

        res.json({ 
            verification_status: result.rows[0].verification_status,
        });
    } catch (error) {
        console.error('Error checking verification status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Submit Verification Modal for Authenticated Veterinary
router.post('/submit-verification', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const userId = req.user.userId;
        const { graduation_barcode, tc_number } = req.body;

        // Validate input
        if (!graduation_barcode || !tc_number) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate TC number format
        if (!/^\d{11}$/.test(tc_number)) {
            return res.status(400).json({ message: 'Invalid TC Kimlik No format.' });
        }

        // First, check if a profile already exists
        const checkQuery = `
            SELECT user_id 
            FROM veterinarianprofile 
            WHERE user_id = $1
        `;
        const existingProfile = await pool.query(checkQuery, [userId]);

        if (existingProfile.rows.length > 0) {
            // Update existing profile
            const updateQuery = `
                UPDATE veterinarianprofile 
                SET 
                    graduation_barcode = $1,
                    tc_number = $2,
                    verification_status = 'pending'
                WHERE user_id = $3
                RETURNING *
            `;
            await pool.query(updateQuery, [graduation_barcode, tc_number, userId]);
        } else {
            // Create new profile
            const insertQuery = `
                INSERT INTO veterinarianprofile 
                (user_id, graduation_barcode, tc_number, verification_status)
                VALUES ($1, $2, $3, 'pending')
                RETURNING *
            `;
            await pool.query(insertQuery, [userId, graduation_barcode, tc_number]);
        }

        res.status(200).json({ 
            message: 'Verification details submitted successfully. Your application is under review.',
            status: 'pending'
        });

    } catch (error) {
        console.error('Error submitting verification details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 