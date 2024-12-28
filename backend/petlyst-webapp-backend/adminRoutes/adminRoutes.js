const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');

// Middleware - isAdmin
const isAdmin = (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Get All Veterinarians with "Pending" Status
router.get('/pending-review-status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                v.user_id,
                v.tc_number,
                v.graduation_barcode,
                v.verification_status,
                u.name,
                u.surname
            FROM veterinarianprofile v
            JOIN users u ON v.user_id = u.id
            WHERE v.verification_status = 'pending'
        `;

        const result = await pool.query(query);

        res.json({
            message: 'Showing All Pending Veterinarians',
            pendingVerifications: result.rows
        });

    } catch (error) {
        console.error('Error Fetching Pending Veterinarians:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update verification status (approve/reject) and also return rest "pendings"
router.put('/update-verification-status/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { action } = req.body;

        // Validate action
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Action must be either "approve" or "reject"'
            });
        }

        // Check if the profile exists and is pending
        const checkQuery = `
            SELECT verification_status 
            FROM veterinarianprofile 
            WHERE user_id = $1
        `;
        const checkResult = await pool.query(checkQuery, [userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Veterinarian profile not found'
            });
        }

        if (checkResult.rows[0].verification_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only update pending verification requests'
            });
        }

        // Set the new status based on action
        const newStatus = action === 'approve' ? 'verified' : 'not_verified';

        // Update the profile
        const updateQuery = `
            UPDATE veterinarianprofile 
            SET verification_status = $1
            WHERE user_id = $2 
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [newStatus, userId]);

        // Get updated list of pending verifications
        const pendingQuery = `
            SELECT 
                v.user_id,
                v.tc_number,
                v.graduation_barcode,
                v.verification_status,
                u.name,
                u.surname
            FROM veterinarianprofile v
            JOIN users u ON v.user_id = u.id
            WHERE v.verification_status = 'pending'
        `;

        const pendingResult = await pool.query(pendingQuery);

        // Send response
        res.json({
            success: true,
            message: `Veterinarian verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            updatedProfile: updateResult.rows[0],
            pendingVerifications: pendingResult.rows
        });

    } catch (error) {
        console.error('Error updating verification status:', error);
        
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID: User does not exist'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update verification status',
            error: error.message
        });
    }
});

module.exports = router; 