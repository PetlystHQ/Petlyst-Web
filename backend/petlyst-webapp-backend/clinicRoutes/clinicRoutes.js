const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { checkVerificationStatus } = require('../middleware/verificationMiddleware');
const pool = require('../config/db');
const multer = require('multer');
const s3Service = require('../aws/s3Service');

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

// Base route: /api/clinics

// Clinics verified to archived
router.patch('/archive/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT verification_status 
      FROM clinics 
      WHERE id = $1 AND operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found or you do not have permission to archive this clinic' 
      });
    }

    if (checkResult.rows[0].verification_status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Only verified clinics can be archived'
      });
    }

    // Update clinic status to archived
    const updateQuery = `
      UPDATE clinics 
      SET verification_status = 'archived'
      WHERE id = $1 AND operator_id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [clinicId, operator_id]);

    res.status(200).json({
      success: true,
      message: 'Clinic archived successfully',
      clinic: result.rows[0]
    });

  } catch (error) {
    console.error('Error archiving clinic:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Restore clinic (change status from archived to verified)
router.patch('/restore/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT verification_status 
      FROM clinics 
      WHERE id = $1 AND operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found or you do not have permission to restore this clinic' 
      });
    }

    if (checkResult.rows[0].verification_status !== 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Only archived clinics can be restored'
      });
    }

    // Update clinic status to verified
    const updateQuery = `
      UPDATE clinics 
      SET verification_status = 'verified'
      WHERE id = $1 AND operator_id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [clinicId, operator_id]);

    res.status(200).json({
      success: true,
      message: 'Clinic restored successfully',
      clinic: result.rows[0]
    });

  } catch (error) {
    console.error('Error restoring clinic:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get all clinics for a veterinarian
router.get('/my-clinics', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const query = `
      SELECT id, name, address, phone_number, description, verification_status
      FROM clinics 
      WHERE operator_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.status(200).json({
      message: "Clinics fetched successfully",
      clinics: result.rows
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new clinic (requires verified veterinarian)
router.post('/add', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { name, address, phone_number, description } = req.body;
    const operator_id = req.user.userId;

    // Validate required field
    if (!name) {
      return res.status(400).json({ message: 'Clinic name is required' });
    }

    // Insert clinic into database
    const query = `
      INSERT INTO clinics (
        name, 
        address, 
        phone_number,  
        description, 
        operator_id,
        verification_status
      ) 
      VALUES ($1, $2, $3, $4, $5, 'pending') 
      RETURNING *
    `;

    const values = [name, address || null, phone_number || null, description || null, operator_id];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Clinic added successfully",
      clinic: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single clinic details
router.get('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    // TODO: Implement get single clinic logic
    res.status(200).json({ message: "Get single clinic endpoint" });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update clinic details
router.put('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { name, address, phone_number, description } = req.body;
    const operator_id = req.user.userId;

    // Validate required field
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Clinic name is required' 
      });
    }

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT verification_status 
      FROM clinics 
      WHERE id = $1 AND operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to update this clinic'
      });
    }

    const currentStatus = checkResult.rows[0].verification_status;
    const newStatus = ['verified', 'archived'].includes(currentStatus) ? 'pending' : currentStatus;

    // Update clinic in database
    const updateQuery = `
      UPDATE clinics 
      SET 
        name = $1,
        address = $2,
        phone_number = $3,
        description = $4,
        verification_status = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND operator_id = $7
      RETURNING *
    `;

    const values = [
      name,
      address || null,
      phone_number || null,
      description || null,
      newStatus,
      clinicId,
      operator_id
    ];

    const result = await pool.query(updateQuery, values);

    res.status(200).json({
      success: true,
      message: 'Clinic updated successfully',
      clinic: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete clinic (requires verified status)
router.delete('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    // TODO: Implement delete clinic logic
    res.status(200).json({ message: "Delete clinic endpoint" });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload clinic photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { clinicId, clinicName } = req.body;
    const photo = req.file;
    const operator_id = req.user.userId;

    // Validate required fields
    if (!clinicId || !clinicName) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and name are required'
      });
    }

    if (!photo) {
      return res.status(400).json({
        success: false,
        message: 'No photo provided'
      });
    }

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT id 
      FROM clinics 
      WHERE id = $1 AND operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to upload photos'
      });
    }

    // Upload to S3
    try {
      console.log('Uploading photo:', {
        fileName: photo.originalname,
        fileSize: photo.size,
        mimeType: photo.mimetype,
        clinicId,
        clinicName
      });

      const result = await s3Service.uploadClinicPhoto(
        photo.buffer,
        photo.originalname,
        photo.mimetype,
        clinicId,
        clinicName
      );

      // Insert photo URL into clinic_photos table
      const insertPhotoQuery = `
        INSERT INTO clinic_photos (clinic_id, s3_url)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      await pool.query(insertPhotoQuery, [clinicId, result.url]);

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
    console.error('Error uploading clinic photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get clinic photos
router.get('/:clinicId/photos', authenticateToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT id, name 
      FROM clinics 
      WHERE id = $1 AND operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to view photos'
      });
    }

    const clinic = checkResult.rows[0];
    
    // Get photos from S3
    try {
      const photos = await s3Service.listClinicPhotos(clinic.id, clinic.name);
      
      res.status(200).json({
        success: true,
        message: 'Photos fetched successfully',
        photos: photos
      });
    } catch (s3Error) {
      console.error('S3 list error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch photos from storage: ${s3Error.message}`
      });
    }

  } catch (error) {
    console.error('Error fetching clinic photos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete clinic photo
router.delete('/:clinicId/photos/:photoKey', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId, photoKey } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT id, name, verification_status 
      FROM clinics 
      WHERE id = $1 AND operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to delete photos'
      });
    }

    const clinic = checkResult.rows[0];

    // Delete from S3
    try {
      await s3Service.deleteClinicPhoto(clinic.id, clinic.name, photoKey);

      // Update verification status to pending if it was verified or archived
      if (['verified', 'archived'].includes(clinic.verification_status)) {
        const updateQuery = `
          UPDATE clinics 
          SET verification_status = 'pending'
          WHERE id = $1 AND operator_id = $2
          RETURNING *
        `;
        await pool.query(updateQuery, [clinicId, operator_id]);
      }

      res.status(200).json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to delete photo from storage: ${s3Error.message}`
      });
    }

  } catch (error) {
    console.error('Error deleting clinic photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 