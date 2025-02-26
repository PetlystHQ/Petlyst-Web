const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { checkVerificationStatus } = require('../middleware/verificationMiddleware');
const Clinic = require('../models/clinicModel');
const pool = require('../config/db');
const multer = require('multer');
const s3Service = require('../aws/s3Service');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { deleteClinicPhoto } = require('../aws/s3Service');

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

// Archive clinic (change status from verified to archived)
router.patch('/archive/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);

    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found or you do not have permission to archive this clinic' 
      });
    }

    if (clinic.clinic_verification_status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Only verified clinics can be archived'
      });
    }

    // Update clinic status to archived
    const updatedClinic = await Clinic.updateClinic(clinicId, {
      clinic_verification_status: 'archived'
    });

    res.status(200).json({
      success: true,
      message: 'Clinic archived successfully',
      clinic: updatedClinic
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
    const clinic = await Clinic.getClinicById(clinicId);

    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found or you do not have permission to restore this clinic' 
      });
    }

    if (clinic.clinic_verification_status !== 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Only archived clinics can be restored'
      });
    }

    // Update clinic status to verified
    const updatedClinic = await Clinic.updateClinic(clinicId, {
      clinic_verification_status: 'verified'
    });

    res.status(200).json({
      success: true,
      message: 'Clinic restored successfully',
      clinic: updatedClinic
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
    
    const clinics = await Clinic.getClinicsByOperatorId(userId);
    
    res.status(200).json({
      message: "Clinics fetched successfully",
      clinics: clinics
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new clinic (requires verified veterinarian)
router.post('/add', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { 
      clinic_name, 
      clinic_address, 
      clinic_phone, 
      clinic_email, 
      clinic_description, 
      available_days, 
      emergency_available_days, 
      opening_time, 
      closing_time 
    } = req.body;
    
    const clinic_operator_id = req.user.userId;

    // Validate required fields
    if (!clinic_name || !clinic_address || !available_days || !opening_time || !closing_time) {
      return res.status(400).json({ 
        message: 'Clinic name, address, available days, opening time, and closing time are required' 
      });
    }

    // Create clinic in database
    const clinicData = {
      clinic_name,
      clinic_address,
      clinic_phone,
      clinic_email,
      clinic_operator_id,
      clinic_description,
      available_days,
      emergency_available_days,
      opening_time,
      closing_time
    };

    const newClinic = await Clinic.createClinic(clinicData);

    res.status(201).json({
      message: "Clinic added successfully",
      clinic: newClinic
    });
  } catch (error) {
    console.error('Error adding clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single clinic details
router.get('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Get the clinic
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }
    
    // Get the operator details
    const operatorQuery = `
      SELECT user_name, user_surname, user_email
      FROM "users"
      WHERE user_id = $1
    `;
    
    const operatorResult = await pool.query(operatorQuery, [clinic.clinic_operator_id]);
    
    const clinicWithOperator = {
      ...clinic,
      operator_name: operatorResult.rows[0]?.user_name,
      operator_surname: operatorResult.rows[0]?.user_surname,
      operator_email: operatorResult.rows[0]?.user_email
    };
    
    res.status(200).json({
      message: "Clinic details fetched successfully",
      clinic: clinicWithOperator
    });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update clinic details
router.put('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const updateData = req.body;
    const operator_id = req.user.userId;

    // Validate required field
    if (!updateData.clinic_name) {
      return res.status(400).json({ 
        success: false,
        message: 'Clinic name is required' 
      });
    }

    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);

    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to update this clinic'
      });
    }

    // Only update verification status to pending if it was verified or archived
    if (['verified', 'archived'].includes(clinic.clinic_verification_status)) {
      updateData.clinic_verification_status = 'pending';
    }

    // Update clinic
    const updatedClinic = await Clinic.updateClinic(clinicId, updateData);

    res.status(200).json({
      success: true,
      message: 'Clinic updated successfully',
      clinic: updatedClinic
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

// Delete clinic
router.delete('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;
    
    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to delete this clinic'
      });
    }
    
    // Delete clinic
    await Clinic.deleteClinic(clinicId);
    
    res.status(200).json({
      success: true,
      message: "Clinic deleted successfully"
    });
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
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic || clinic.clinic_operator_id !== operator_id) {
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

// Delete clinic photo by Tarık
router.delete('/:clinicId/photos/:photoDisplayId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId, photoDisplayId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT clinic_id, clinic_name, clinic_verification_status 
      FROM clinics 
      WHERE clinic_id = $1 AND clinic_operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to delete photos',
      });
    }

    const clinic = checkResult.rows[0];

    // Find the specific occurrence of clinic_id based on photoDisplayId
    const findPhotoQuery = `
      WITH RankedPhotos AS (
        SELECT photo_id, s3_url, ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY photo_id) AS occurrence
        FROM clinic_photos
        WHERE clinic_id = $1
      )
      SELECT photo_id, s3_url 
      FROM RankedPhotos
      WHERE occurrence = $2
    `;
    const photoResult = await pool.query(findPhotoQuery, [clinicId, photoDisplayId]);

    if (photoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found for the given display ID',
      });
    }

    const { photo_id, s3_url } = photoResult.rows[0];

    // Parse the S3 URL to get the key
    const s3Key = s3_url.split('.amazonaws.com/')[1];

    // Delete from S3
    try {
      await deleteClinicPhoto(s3Key);

      // Delete the record from the database
      const deletePhotoQuery = `
        DELETE FROM clinic_photos 
        WHERE photo_id = $1
      `;
      await pool.query(deletePhotoQuery, [photo_id]);

      // Update verification status to pending if it was verified or archived
      if (['verified', 'archived'].includes(clinic.clinic_verification_status)) {
        const updateQuery = `
          UPDATE clinics 
          SET clinic_verification_status = 'pending'
          WHERE clinic_id = $1 AND clinic_operator_id = $2
        `;
        await pool.query(updateQuery, [clinicId, operator_id]);
      }

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
    console.error('Error deleting clinic photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Delete clinic photo
// router.delete('/:clinicId/photos/:photoKey', authenticateToken, checkVerificationStatus, async (req, res) => {
//   try {
//     const { clinicId, photoKey } = req.params;
//     const operator_id = req.user.userId;

//     // Check if clinic exists and belongs to the operator
//     const checkQuery = `
//       SELECT clinic_id, clinic_name, clinic_verification_status 
//       FROM clinics 
//       WHERE clinic_id = $1 AND clinic_operator_id = $2
//     `;
//     const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

//     if (checkResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Clinic not found or you do not have permission to delete photos'
//       });
//     }

//     const clinic = checkResult.rows[0];

//     // Delete from S3
//     try {
//       await s3Service.deleteClinicPhoto(clinic.clinic_id, clinic.clinic_name, photoKey);

//       // Update verification status to pending if it was verified or archived
//       if (['verified', 'archived'].includes(clinic.clinic_verification_status)) {
//         const updateQuery = `
//           UPDATE clinics 
//           SET clinic_verification_status = 'pending'
//           WHERE clinic_id = $1 AND clinic_operator_id = $2
//           RETURNING *
//         `;
//         await pool.query(updateQuery, [clinicId, operator_id]);
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Photo deleted successfully'
//       });
//     } catch (s3Error) {
//       console.error('S3 delete error:', s3Error);
//       return res.status(500).json({
//         success: false,
//         message: `Failed to delete photo from storage: ${s3Error.message}`
//       });
//     }

//   } catch (error) {
//     console.error('Error deleting clinic photo:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Internal server error',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

module.exports = router; 