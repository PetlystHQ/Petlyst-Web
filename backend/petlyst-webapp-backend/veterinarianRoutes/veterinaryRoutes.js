const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { encrypt } = require('../utils/encryption');
// Multer ve S3 servislerini ekleyelim
const multer = require('multer');
const s3Service = require('../aws/s3Service');
const { uploadVeterinarianPhoto, deleteVeterinarianPhoto } = s3Service;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// GET veterinarian profile details including biography and preferred languages
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT v.biography, v.preferred_languages, 
                   u.user_name, u.user_surname, u.user_email, u.user_phone, u.user_profile_photo
            FROM veterinarians v
            JOIN users u ON v.veterinarian_id = u.user_id
            WHERE v.veterinarian_id = $1
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching veterinarian profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// UPDATE veterinarian biography and preferred languages
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { biography, preferred_languages } = req.body;
        
        // Validation
        if (biography && biography.length > 2000) {
            return res.status(400).json({ message: 'Biography must be 2000 characters or less.' });
        }
        
        // Check if languages array is valid
        if (preferred_languages && !Array.isArray(preferred_languages)) {
            return res.status(400).json({ message: 'Preferred languages must be an array.' });
        }
        
        // Check if all languages are strings with reasonable length
        if (preferred_languages && Array.isArray(preferred_languages)) {
            for (const lang of preferred_languages) {
                if (typeof lang !== 'string' || lang.length > 50) {
                    return res.status(400).json({ message: 'Each language must be a string with 50 characters or less.' });
                }
            }
        }
        
        const updateQuery = `
            UPDATE veterinarians
            SET 
                biography = $1,
                preferred_languages = $2,
                veterinarian_updated_at = CURRENT_TIMESTAMP
            WHERE veterinarian_id = $3
            RETURNING biography, preferred_languages
        `;
        
        const values = [biography || null, preferred_languages || null, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }
        
        res.status(200).json({
            message: 'Profile updated successfully',
            profile: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating veterinarian profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Upload veterinarian photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('===== UPLOAD VETERINARIAN PHOTO REQUEST RECEIVED =====');
    console.log('Request body:', {
      veterinarianName: req.body.veterinarianName,
      userId: req.user?.userId
    });
    console.log('File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer (${req.file.buffer.length} bytes)` : 'No buffer'
    } : 'No file');
    
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      console.error('Access denied - user is not a veterinarian');
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    const photo = req.file;
    const { veterinarianName } = req.body;

    // Validate required fields
    if (!veterinarianName) {
      console.error('Missing required field: veterinarianName');
      return res.status(400).json({
        success: false,
        message: 'Veterinarian name is required'
      });
    }

    if (!photo) {
      console.error('No photo provided in the request');
      return res.status(400).json({
        success: false,
        message: 'No photo provided'
      });
    }

    // Upload to S3
    try {
      console.log('Uploading veterinarian photo:', {
        fileName: photo.originalname,
        fileSize: photo.size,
        mimeType: photo.mimetype,
        veterinarianId,
        veterinarianName
      });

      const result = await uploadVeterinarianPhoto(
        photo.buffer,
        photo.originalname,
        photo.mimetype,
        veterinarianId.toString(),
        veterinarianName
      );

      console.log('S3 upload successful:', result);
      
      // Ensure we have a valid URL
      if (!result.url || !result.url.startsWith('http')) {
        console.warn('S3 returned invalid URL, constructing fallback URL');
        result.url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${result.key}`;
        console.log('Using fallback URL:', result.url);
      }

      // Insert photo URL into veterinarian_albums table
      const insertPhotoQuery = `
        INSERT INTO veterinarian_albums (veterinarian_id, veterinarian_album_photo_url)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const dbResult = await pool.query(insertPhotoQuery, [veterinarianId, result.url]);
      console.log('Database insert successful:', dbResult.rows[0]);

      res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          url: result.url,
          key: result.key
        }
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to upload photo to storage: ${s3Error.message}`
      });
    }
  } catch (error) {
    console.error('Error uploading veterinarian photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get veterinarian photos
router.get('/photos', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    
    // Get user's name for logging purposes
    const userQuery = `
      SELECT user_name, user_surname
      FROM users 
      WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [veterinarianId]);
    const veterinarianName = userResult.rows.length > 0 
      ? `${userResult.rows[0].user_name} ${userResult.rows[0].user_surname}`
      : 'Unknown';
    
    // Get photos from veterinarian_albums table
    let photosResult = { rows: [] };
    try {
      const getPhotosQuery = `
        SELECT veterinarian_album_photo_id, veterinarian_album_photo_url, veterinarian_album_photo_url_created_at
        FROM "veterinarian_albums"
        WHERE veterinarian_id = $1
        ORDER BY veterinarian_album_photo_url_created_at DESC
      `;
      
      photosResult = await pool.query(getPhotosQuery, [veterinarianId]);
    } catch (photoError) {
      console.warn(`Could not fetch photos for veterinarian ${veterinarianId}:`, photoError.message);
      // Continue with empty photos array
    }
    
    // Log information about the veterinarian and photos
    console.log('Fetching photos for veterinarian:', {
      veterinarianId,
      veterinarianName,
      photoCount: photosResult.rows.length
    });
    
    res.status(200).json({
      success: true,
      message: 'Photos fetched successfully',
      photos: photosResult.rows
    });
  } catch (error) {
    console.error('Error fetching veterinarian photos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete veterinarian photo
router.delete('/photos/:photoId', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    const { photoId } = req.params;

    // Get user's name for S3 path
    const userQuery = `
      SELECT user_name, user_surname
      FROM users 
      WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [veterinarianId]);
    const veterinarianName = userResult.rows.length > 0 
      ? `${userResult.rows[0].user_name} ${userResult.rows[0].user_surname}`
      : 'Unknown';

    // Find the photo in veterinarian_albums
    const findPhotoQuery = `
      SELECT veterinarian_album_photo_id, veterinarian_album_photo_url 
      FROM "veterinarian_albums"
      WHERE veterinarian_album_photo_id = $1 AND veterinarian_id = $2
    `;
    
    const photoResult = await pool.query(findPhotoQuery, [photoId, veterinarianId]);

    if (photoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    const { veterinarian_album_photo_url } = photoResult.rows[0];

    // Parse the S3 URL to get the key
    const s3Key = veterinarian_album_photo_url.split('.amazonaws.com/')[1];
    
    console.log('Deleting photo:', {
      photoId,
      veterinarianId,
      veterinarianName,
      s3Key
    });

    // Delete from S3
    try {
      await deleteVeterinarianPhoto(s3Key);

      // Delete the record from the database
      const deletePhotoQuery = `
        DELETE FROM veterinarian_albums 
        WHERE veterinarian_album_photo_id = $1
      `;
      await pool.query(deletePhotoQuery, [photoId]);

      res.status(200).json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to delete photo from storage: ${s3Error.message}`,
      });
    }
  } catch (error) {
    console.error('Error deleting veterinarian photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router; 