const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { encrypt } = require('../utils/encryption');

// Get Veterinarian Verification Status for Authenticated Veterinary
router.get('/verification-status', authenticateToken, async (req, res) => {
    try {
        // Check if the user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const userId = req.user.userId;

        // Query to get verification status from veterinarians table
        const query = `
            SELECT veterinarian_verification_status 
            FROM veterinarians 
            WHERE veterinarian_id = $1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }

        res.json({ 
            verification_status: result.rows[0].veterinarian_verification_status,
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

        // Encrypt the TC number before storing
        const encryptedTcNumber = encrypt(tc_number);

        // First, check if a profile already exists
        const checkQuery = `
            SELECT veterinarian_id 
            FROM veterinarians 
            WHERE veterinarian_id = $1
        `;
        const existingProfile = await pool.query(checkQuery, [userId]);

        if (existingProfile.rows.length > 0) {
            // Update existing profile
            const updateQuery = `
                UPDATE veterinarians 
                SET 
                    veterinarian_graduate_barcode = $1,
                    veterinarian_tc_number = $2,
                    veterinarian_verification_status = 'pending'
                WHERE veterinarian_id = $3
                RETURNING *
            `;
            await pool.query(updateQuery, [graduation_barcode, encryptedTcNumber, userId]);
        } else {
            // Create new profile
            const insertQuery = `
                INSERT INTO veterinarians 
                (veterinarian_id, veterinarian_graduate_barcode, veterinarian_tc_number, veterinarian_verification_status)
                VALUES ($1, $2, $3, 'pending')
                RETURNING *
            `;
            await pool.query(insertQuery, [userId, graduation_barcode, encryptedTcNumber]);
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

// GET all education records for authenticated veterinarian
router.get('/education', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT * FROM veterinarian_education 
            WHERE veterinarian_id = $1
            ORDER BY start_date DESC
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching education records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new education record
router.post('/education', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { school_name, field_of_study, start_date, end_date, is_current } = req.body;

        // Validate required fields
        if (!school_name || !field_of_study || !start_date) {
            return res.status(400).json({ message: 'School name, field of study, and start date are required.' });
        }

        // Validate logical date consistency
        if (end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
        }

        // Validate is_current and end_date logic
        if (is_current && end_date) {
            return res.status(400).json({ message: 'Current education cannot have an end date.' });
        }

        if (!is_current && !end_date) {
            return res.status(400).json({ message: 'Completed education must have an end date.' });
        }

        const query = `
            INSERT INTO veterinarian_education 
            (veterinarian_id, school_name, field_of_study, start_date, end_date, is_current)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [veterinarianId, school_name, field_of_study, start_date, end_date, is_current];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding education record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT update education record
router.put('/education/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const educationId = req.params.id;
        const { school_name, field_of_study, start_date, end_date, is_current } = req.body;

        // Validate required fields
        if (!school_name || !field_of_study || !start_date) {
            return res.status(400).json({ message: 'School name, field of study, and start date are required.' });
        }

        // Validate logical date consistency
        if (end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
        }

        // Validate is_current and end_date logic
        if (is_current && end_date) {
            return res.status(400).json({ message: 'Current education cannot have an end date.' });
        }

        if (!is_current && !end_date) {
            return res.status(400).json({ message: 'Completed education must have an end date.' });
        }

        // First verify the education record belongs to this veterinarian
        const checkQuery = `
            SELECT education_id FROM veterinarian_education
            WHERE education_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [educationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Education record not found or you do not have permission to edit it.' });
        }

        const updateQuery = `
            UPDATE veterinarian_education
            SET 
                school_name = $1,
                field_of_study = $2,
                start_date = $3,
                end_date = $4,
                is_current = $5
            WHERE education_id = $6 AND veterinarian_id = $7
            RETURNING *
        `;

        const values = [school_name, field_of_study, start_date, end_date, is_current, educationId, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating education record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE education record
router.delete('/education/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const educationId = req.params.id;

        // First verify the education record belongs to this veterinarian
        const checkQuery = `
            SELECT education_id FROM veterinarian_education
            WHERE education_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [educationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Education record not found or you do not have permission to delete it.' });
        }

        const deleteQuery = `
            DELETE FROM veterinarian_education
            WHERE education_id = $1 AND veterinarian_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(deleteQuery, [educationId, veterinarianId]);
        
        res.status(200).json({ message: 'Education record deleted successfully', deletedRecord: result.rows[0] });
    } catch (error) {
        console.error('Error deleting education record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET all certifications for authenticated veterinarian
router.get('/certifications', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT * FROM veterinarian_certifications 
            WHERE veterinarian_id = $1
            ORDER BY issue_date DESC
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching certification records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new certification record
router.post('/certifications', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { certification_name, issuing_organization, issue_date, certification_number } = req.body;

        // Validate required fields
        if (!certification_name || !issuing_organization || !issue_date) {
            return res.status(400).json({ message: 'Certification name, issuing organization, and issue date are required.' });
        }

        const query = `
            INSERT INTO veterinarian_certifications 
            (veterinarian_id, certification_name, issuing_organization, issue_date, certification_number, created_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [veterinarianId, certification_name, issuing_organization, issue_date, certification_number];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding certification record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT update certification record
router.put('/certifications/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const certificationId = req.params.id;
        const { certification_name, issuing_organization, issue_date, certification_number } = req.body;

        // Validate required fields
        if (!certification_name || !issuing_organization || !issue_date) {
            return res.status(400).json({ message: 'Certification name, issuing organization, and issue date are required.' });
        }

        // First verify the certification record belongs to this veterinarian
        const checkQuery = `
            SELECT certification_id FROM veterinarian_certifications
            WHERE certification_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [certificationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Certification record not found or you do not have permission to edit it.' });
        }

        const updateQuery = `
            UPDATE veterinarian_certifications
            SET 
                certification_name = $1,
                issuing_organization = $2,
                issue_date = $3,
                certification_number = $4
            WHERE certification_id = $5 AND veterinarian_id = $6
            RETURNING *
        `;

        const values = [certification_name, issuing_organization, issue_date, certification_number, certificationId, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating certification record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE certification record
router.delete('/certifications/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const certificationId = req.params.id;

        // First verify the certification record belongs to this veterinarian
        const checkQuery = `
            SELECT certification_id FROM veterinarian_certifications
            WHERE certification_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [certificationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Certification record not found or you do not have permission to delete it.' });
        }

        const deleteQuery = `
            DELETE FROM veterinarian_certifications
            WHERE certification_id = $1 AND veterinarian_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(deleteQuery, [certificationId, veterinarianId]);
        
        res.status(200).json({ message: 'Certification record deleted successfully', deletedRecord: result.rows[0] });
    } catch (error) {
        console.error('Error deleting certification record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET all expertise areas for authenticated veterinarian
router.get('/expertise', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT * FROM veterinarian_expertise 
            WHERE veterinarian_id = $1
            ORDER BY expertise_area ASC
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching expertise records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new expertise area
router.post('/expertise', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { expertise_area } = req.body;

        // Validate required fields
        if (!expertise_area) {
            return res.status(400).json({ message: 'Expertise area is required.' });
        }
        
        // Validate that expertise_area is a valid ID from our predefined list
        // This validation is enforced in the frontend with the dropdown, but we do basic validation here as well
        if (!expertise_area.match(/^[a-z_]+$/)) {
            return res.status(400).json({ message: 'Invalid expertise area format.' });
        }

        const query = `
            INSERT INTO veterinarian_expertise 
            (veterinarian_id, expertise_area, created_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [veterinarianId, expertise_area];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding expertise record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT update expertise area
router.put('/expertise/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const expertiseId = req.params.id;
        const { expertise_area } = req.body;

        // Validate required fields
        if (!expertise_area) {
            return res.status(400).json({ message: 'Expertise area is required.' });
        }
        
        // Validate that expertise_area is a valid ID from our predefined list
        // This validation is enforced in the frontend with the dropdown, but we do basic validation here as well
        if (!expertise_area.match(/^[a-z_]+$/)) {
            return res.status(400).json({ message: 'Invalid expertise area format.' });
        }

        // First verify the expertise record belongs to this veterinarian
        const checkQuery = `
            SELECT expertise_id FROM veterinarian_expertise
            WHERE expertise_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [expertiseId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Expertise record not found or you do not have permission to edit it.' });
        }

        const updateQuery = `
            UPDATE veterinarian_expertise
            SET expertise_area = $1
            WHERE expertise_id = $2 AND veterinarian_id = $3
            RETURNING *
        `;

        const values = [expertise_area, expertiseId, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating expertise record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE expertise area
router.delete('/expertise/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const expertiseId = req.params.id;

        // First verify the expertise record belongs to this veterinarian
        const checkQuery = `
            SELECT expertise_id FROM veterinarian_expertise
            WHERE expertise_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [expertiseId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Expertise record not found or you do not have permission to delete it.' });
        }

        const deleteQuery = `
            DELETE FROM veterinarian_expertise
            WHERE expertise_id = $1 AND veterinarian_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(deleteQuery, [expertiseId, veterinarianId]);
        
        res.status(200).json({ message: 'Expertise record deleted successfully', deletedRecord: result.rows[0] });
    } catch (error) {
        console.error('Error deleting expertise record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 