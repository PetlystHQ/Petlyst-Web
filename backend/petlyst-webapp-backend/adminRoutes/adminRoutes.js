const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { decrypt, encrypt } = require('../utils/encryption');

// Test route - no authentication required
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes are working!' });
});

// Middleware - isAdmin
const isAdmin = (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Get All Clinics with "Pending" Status
router.get('/pending-clinics', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.*,
                u.user_name as operator_name,
                u.user_surname as operator_surname
            FROM clinics c
            JOIN "users" u ON c.clinic_operator_id = u.user_id
            WHERE c.clinic_verification_status = 'pending'
            ORDER BY c.clinic_created_at DESC
        `;

        const result = await pool.query(query);

        res.json({
            message: 'Showing All Pending Clinics',
            pendingClinics: result.rows
        });

    } catch (error) {
        logger.error('Error Fetching Pending Clinics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update Clinic status (approve/reject) and also return rest "pendings"
router.put('/update-clinic-status/:clinicId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { action } = req.body;

        // Validate action
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Action must be either "approve" or "reject"'
            });
        }

        // Check if the clinic exists and is pending
        const checkQuery = `
            SELECT clinic_verification_status 
            FROM clinics 
            WHERE clinic_id = $1
        `;
        const checkResult = await pool.query(checkQuery, [clinicId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clinic not found'
            });
        }

        if (checkResult.rows[0].clinic_verification_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only update pending verification requests'
            });
        }

        // Set the new status based on action
        const newStatus = action === 'approve' ? 'verified' : 'not_verified';

        // Update the clinic status
        const updateQuery = `
            UPDATE clinics 
            SET clinic_verification_status = $1
            WHERE clinic_id = $2 
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [newStatus, clinicId]);

        // Get updated list of pending clinics
        const pendingQuery = `
            SELECT 
                c.*,
                u.user_name as operator_name,
                u.user_surname as operator_surname
            FROM clinics c
            JOIN "users" u ON c.clinic_operator_id = u.user_id
            WHERE c.clinic_verification_status = 'pending'
            ORDER BY c.clinic_created_at DESC
        `;

        const pendingResult = await pool.query(pendingQuery);

        // Send response
        res.json({
            success: true,
            message: `Clinic verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            updatedClinic: updateResult.rows[0],
            pendingClinics: pendingResult.rows
        });

    } catch (error) {
        logger.error('Error updating clinic verification status:', error);
        
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Invalid clinic ID: Clinic does not exist'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update clinic verification status',
            error: error.message
        });
    }
});

// Get All Veterinarians with "Pending" Status
router.get('/pending-review-status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                v.veterinarian_id,
                v.veterinarian_tc_number,
                v.veterinarian_graduate_barcode,
                v.veterinarian_verification_status,
                u.user_name as name,
                u.user_surname as surname
            FROM veterinarians v
            JOIN "users" u ON v.veterinarian_id = u.user_id
            WHERE v.veterinarian_verification_status = 'pending'
        `;

        const result = await pool.query(query);
        
        // Decrypt TC numbers for admin review
        const pendingVerifications = result.rows.map(vet => ({
            ...vet,
            veterinarian_tc_number: decrypt(vet.veterinarian_tc_number)
        }));

        res.json({
            message: 'Showing All Pending Veterinarians',
            pendingVerifications
        });

    } catch (error) {
        logger.error('Error Fetching Pending Veterinarians:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update User status (approve/reject) and also return rest "pendings"
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
            SELECT veterinarian_verification_status 
            FROM veterinarians 
            WHERE veterinarian_id = $1
        `;
        const checkResult = await pool.query(checkQuery, [userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Veterinarian profile not found'
            });
        }

        if (checkResult.rows[0].veterinarian_verification_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only update pending verification requests'
            });
        }

        // Set the new status based on action
        const newStatus = action === 'approve' ? 'verified' : 'not_verified';

        // Update the profile
        const updateQuery = `
            UPDATE veterinarians 
            SET veterinarian_verification_status = $1
            WHERE veterinarian_id = $2 
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [newStatus, userId]);

        // Get updated list of pending verifications
        const pendingQuery = `
            SELECT 
                v.veterinarian_id,
                v.veterinarian_tc_number,
                v.veterinarian_graduate_barcode,
                v.veterinarian_verification_status,
                u.user_name as name,
                u.user_surname as surname
            FROM veterinarians v
            JOIN "users" u ON v.veterinarian_id = u.user_id
            WHERE v.veterinarian_verification_status = 'pending'
        `;

        const pendingResult = await pool.query(pendingQuery);

        // Decrypt TC numbers for admin review
        const pendingVerifications = pendingResult.rows.map(vet => ({
            ...vet,
            veterinarian_tc_number: decrypt(vet.veterinarian_tc_number)
        }));

        // Send response
        res.json({
            success: true,
            message: `Veterinarian verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            updatedProfile: updateResult.rows[0],
            pendingVerifications
        });

    } catch (error) {
        logger.error('Error updating verification status:', error);
        
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

// Check if all TC numbers are encrypted
router.get('/check-tc-encryption', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT veterinarian_id, veterinarian_tc_number 
            FROM veterinarians 
            WHERE veterinarian_tc_number IS NOT NULL
        `;
        
        const result = await pool.query(query);
        
        const unencryptedTcNumbers = result.rows.filter(vet => {
            const tcNumber = vet.veterinarian_tc_number;
            // Check if it's not encrypted (doesn't contain a colon which separates IV and encrypted data)
            return !tcNumber.includes(':');
        });
        
        if (unencryptedTcNumbers.length > 0) {
            return res.json({
                allEncrypted: false,
                message: `Found ${unencryptedTcNumbers.length} unencrypted TC numbers`,
                unencryptedCount: unencryptedTcNumbers.length,
                totalCount: result.rows.length
            });
        }
        
        res.json({
            allEncrypted: true,
            message: 'All TC numbers are encrypted',
            totalCount: result.rows.length
        });
        
    } catch (error) {
        logger.error('Error checking TC number encryption:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Re-encrypt any unencrypted TC numbers
router.post('/encrypt-tc-numbers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT veterinarian_id, veterinarian_tc_number 
            FROM veterinarians 
            WHERE veterinarian_tc_number IS NOT NULL
        `;
        
        const result = await pool.query(query);
        
        let encryptedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // Process each veterinarian
        for (const vet of result.rows) {
            const tcNumber = vet.veterinarian_tc_number;
            
            // Skip if already encrypted
            if (tcNumber.includes(':')) {
                skippedCount++;
                continue;
            }
            
            try {
                // Only encrypt if it looks like a TC number (11 digits)
                if (/^\d{11}$/.test(tcNumber)) {
                    const encryptedTcNumber = encrypt(tcNumber);
                    
                    // Update the database with the encrypted value
                    const updateQuery = `
                        UPDATE veterinarians 
                        SET veterinarian_tc_number = $1 
                        WHERE veterinarian_id = $2
                    `;
                    
                    await pool.query(updateQuery, [encryptedTcNumber, vet.veterinarian_id]);
                    encryptedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                logger.error(`Error encrypting TC number for veterinarian ID ${vet.veterinarian_id}:`, error);
                errorCount++;
            }
        }
        
        res.json({
            success: true,
            message: 'TC number encryption process completed',
            encryptedCount,
            skippedCount,
            errorCount,
            totalProcessed: result.rows.length
        });
        
    } catch (error) {
        logger.error('Error encrypting TC numbers:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router; 