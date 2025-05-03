// examinationRoutes.js
const express = require('express');
const router = express.Router();
const examinationModel = require('./examinationModel');
const authMiddleware = require('../../middleware/authMiddleware');
const veterinarianMiddleware = require('../../middleware/veterinarianMiddleware');

// Tüm muayeneleri listele (filtreli)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      pet_id, 
      vet_id, 
      status, 
      clinic_id,
      start_date,
      end_date,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    const filters = {
      pet_id: pet_id ? parseInt(pet_id) : undefined,
      vet_id: vet_id ? parseInt(vet_id) : undefined,
      status,
      clinic_id: clinic_id ? parseInt(clinic_id) : undefined,
      start_date,
      end_date
    };
    
    const examinations = await examinationModel.listExaminations(
      filters, 
      parseInt(limit), 
      parseInt(offset)
    );
    
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
router.post('/', authMiddleware, veterinarianMiddleware, async (req, res) => {
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
router.put('/:id', authMiddleware, veterinarianMiddleware, async (req, res) => {
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
router.put('/:id/status', authMiddleware, veterinarianMiddleware, async (req, res) => {
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

module.exports = router;