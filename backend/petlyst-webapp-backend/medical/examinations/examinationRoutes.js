// examinationRoutes.js
const express = require('express');
const router = express.Router();
const examinationModel = require('./examinationModel');
const authenticateToken = require('../../middleware/authenticateToken');
const { checkVerificationStatus } = require('../../middleware/verificationMiddleware');
const pool = require('../../config/db');

// Middleware for checking if the user is a veterinarian
const veterinarianMiddleware = async (req, res, next) => {
  try {
    // User ID should be available from authenticateToken middleware
    const userId = req.user.userId;
    
    // Check if user is a veterinarian
    const userQuery = `
      SELECT user_type FROM users WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    
    if (!userResult.rows.length || userResult.rows[0].user_type !== 'veterinarian') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only veterinarians can perform this action.'
      });
    }
    
    // Get veterinarian details for later use
    const vetQuery = `
      SELECT * FROM veterinarians WHERE veterinarian_id = $1
    `;
    const vetResult = await pool.query(vetQuery, [userId]);
    
    if (!vetResult.rows.length) {
      return res.status(403).json({
        success: false,
        message: 'Veterinarian profile not found.'
      });
    }
    
    // Attach veterinarian info to request
    req.veterinarian = vetResult.rows[0];
    next();
  } catch (error) {
    console.error('Error in veterinarian middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Middleware for general authentication
const authMiddleware = [authenticateToken];

// Middleware for veterinarian-specific actions
const vetAuthMiddleware = [authenticateToken, veterinarianMiddleware];

// Tüm muayeneleri listele (filtreli)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Examination list requested with params:', req.query);
    
    const { 
      pet_id, 
      vet_id, 
      status,
      start_date,
      end_date,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    // Make sure we have proper defaults and type handling
    const filters = {
      pet_id: pet_id ? parseInt(pet_id) : undefined,
      vet_id: vet_id ? parseInt(vet_id) : undefined,
      status,
      start_date,
      end_date
    };
    
    // NOTE: We've removed the clinic_id filter and query since the column doesn't exist
    
    // Convert to numbers
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    console.log('Final examination filters:', filters);
    
    const examinations = await examinationModel.listExaminations(
      filters, 
      limitNum, 
      offsetNum
    );
    
    console.log(`Found ${examinations.length} examinations`);
    
    res.json({
      success: true,
      examinations,
      count: examinations.length
    });
  } catch (error) {
    console.error('Error listing examinations:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing examinations',
      error: error.message
    });
  }
});

// Belirli bir muayeneyi getir
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const examinationId = parseInt(req.params.id);
    const examination = await examinationModel.getExamination(examinationId);
    
    if (!examination) {
      return res.status(404).json({
        success: false,
        message: 'Examination not found'
      });
    }
    
    res.json({
      success: true,
      examination
    });
  } catch (error) {
    console.error('Error fetching examination:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching examination',
      error: error.message
    });
  }
});

// Yeni muayene oluştur
router.post('/', vetAuthMiddleware, async (req, res) => {
  try {
    const {
      pet_id,
      appointment_id,
      temperature,
      heart_rate,
      respiratory_rate,
      weight,
      notes
    } = req.body;
    
    // Veteriner ID'si current-user'dan alınıyor
    const vet_id = req.veterinarian.veterinarian_id;
    
    // Gerekli alanların doğrulanması
    if (!pet_id) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID is required'
      });
    }
    
    const examinationData = {
      pet_id: parseInt(pet_id),
      vet_id,
      appointment_id: appointment_id ? parseInt(appointment_id) : null,
      status: 'started',
      temperature,
      heart_rate,
      respiratory_rate,
      weight,
      notes
    };
    
    const newExamination = await examinationModel.createExamination(examinationData);
    
    res.status(201).json({
      success: true,
      message: 'Examination created successfully',
      examination: newExamination
    });
  } catch (error) {
    console.error('Error creating examination:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating examination',
      error: error.message
    });
  }
});

// Muayene güncelle
router.put('/:id', vetAuthMiddleware, async (req, res) => {
  try {
    const examinationId = parseInt(req.params.id);
    const {
      status,
      temperature,
      heart_rate,
      respiratory_rate,
      weight,
      notes
    } = req.body;
    
    // Önce muayenenin mevcut olduğunu kontrol et
    const existingExamination = await examinationModel.getExamination(examinationId);
    
    if (!existingExamination) {
      return res.status(404).json({
        success: false,
        message: 'Examination not found'
      });
    }
    
    // Sadece muayeneyi yapan veteriner güncelleme yapabilir
    if (existingExamination.vet_id !== req.veterinarian.veterinarian_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this examination'
      });
    }
    
    const updateData = {
      status,
      temperature,
      heart_rate,
      respiratory_rate,
      weight,
      notes
    };
    
    const updatedExamination = await examinationModel.updateExamination(examinationId, updateData);
    
    res.json({
      success: true,
      message: 'Examination updated successfully',
      examination: updatedExamination
    });
  } catch (error) {
    console.error('Error updating examination:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating examination',
      error: error.message
    });
  }
});

// Muayene durumunu güncelle
router.put('/:id/status', vetAuthMiddleware, async (req, res) => {
  try {
    const examinationId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Status doğrulaması
    if (!status || !['started', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Önce muayenenin mevcut olduğunu kontrol et
    const existingExamination = await examinationModel.getExamination(examinationId);
    
    if (!existingExamination) {
      return res.status(404).json({
        success: false,
        message: 'Examination not found'
      });
    }
    
    // Sadece muayeneyi yapan veteriner güncelleme yapabilir
    if (existingExamination.vet_id !== req.veterinarian.veterinarian_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this examination'
      });
    }
    
    const updatedExamination = await examinationModel.updateExaminationStatus(examinationId, status);
    
    res.json({
      success: true,
      message: 'Examination status updated successfully',
      examination: updatedExamination
    });
  } catch (error) {
    console.error('Error updating examination status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating examination status',
      error: error.message
    });
  }
});

// Bir hayvanın muayene geçmişini getir
router.get('/pet/:petId', authMiddleware, async (req, res) => {
  try {
    const petId = parseInt(req.params.petId);
    const examinations = await examinationModel.getPetExaminationHistory(petId);
    
    res.json({
      success: true,
      examinations,
      count: examinations.length
    });
  } catch (error) {
    console.error('Error fetching pet examination history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet examination history',
      error: error.message
    });
  }
});

// Muayeneyi sil (sadece admin veya veri temizliği için)
router.delete('/:id', vetAuthMiddleware, async (req, res) => {
  try {
    const examinationId = parseInt(req.params.id);
    
    // Önce muayenenin mevcut olduğunu kontrol et
    const existingExamination = await examinationModel.getExamination(examinationId);
    
    if (!existingExamination) {
      return res.status(404).json({
        success: false,
        message: 'Examination not found'
      });
    }
    
    // Sadece muayeneyi yapan veteriner silebilir
    if (existingExamination.vet_id !== req.veterinarian.veterinarian_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this examination'
      });
    }
    
    const deletedExamination = await examinationModel.deleteExamination(examinationId);
    
    res.json({
      success: true,
      message: 'Examination deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting examination:', error);
    
    // Eğer teşhisler bağlı olduğu için silinemeyen durum
    if (error.message === 'Cannot delete examination with associated diagnoses') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting examination',
      error: error.message
    });
  }
});

// Bir hayvanın (pet) randevularını getiren endpoint
router.get('/pet-appointments/:petId', authMiddleware, async (req, res) => {
  try {
    const petId = parseInt(req.params.petId);
    
    // Veritabanından pet_id'ye göre randevuları çek
    const query = `
      SELECT 
        appointment_id, 
        appointment_date,
        appointment_start_hour,
        appointment_end_hour,
        appointment_status AS status,
        notes,
        clinic_id,
        video_meeting,
        meeting_url,
        meeting_password
      FROM appointments 
      WHERE pet_id = $1 
      AND (appointment_status = 'confirmed' OR appointment_status = 'completed') 
      ORDER BY appointment_date DESC, appointment_start_hour DESC
    `;
    
    const result = await pool.query(query, [petId]);
    
    res.json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching pet appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet appointments',
      error: error.message
    });
  }
});

module.exports = router;