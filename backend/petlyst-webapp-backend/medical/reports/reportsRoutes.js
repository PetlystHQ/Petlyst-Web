// reportsRoutes.js
const express = require('express');
const router = express.Router();
const reportsModel = require('./reportsModel');
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
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userType = userResult.rows[0].user_type;
    
    if (userType !== 'veterinarian') {
      return res.status(403).json({ message: 'Access denied. Only veterinarians can perform this operation.' });
    }
    
    // Store veterinarian ID in request for future use
    req.vetId = userId;
    next();
  } catch (error) {
    console.error('Error in veterinarian middleware:', error);
    res.status(500).json({ message: 'Server error in authorization check' });
  }
};

// Apply middleware to all routes
router.use(authenticateToken);
router.use(checkVerificationStatus);
router.use(veterinarianMiddleware);

/**
 * Medical Reports Routes
 */

// Get complete pet medical history
router.get('/pet/:petId/history', async (req, res) => {
  try {
    const petId = req.params.petId;
    const history = await reportsModel.getPetMedicalHistory(petId);
    
    if (!history) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    res.json(history);
  } catch (error) {
    console.error('Error retrieving pet medical history:', error);
    res.status(500).json({ message: 'Error retrieving pet medical history', error: error.message });
  }
});

// Get examination summary
router.get('/examination/:examinationId/summary', async (req, res) => {
  try {
    const examinationId = req.params.examinationId;
    const summary = await reportsModel.getExaminationSummary(examinationId);
    
    if (!summary) {
      return res.status(404).json({ message: 'Examination not found' });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error retrieving examination summary:', error);
    res.status(500).json({ message: 'Error retrieving examination summary', error: error.message });
  }
});

// Get treatment report
router.get('/treatment/:treatmentId/report', async (req, res) => {
  try {
    const treatmentId = req.params.treatmentId;
    const report = await reportsModel.getTreatmentReport(treatmentId);
    
    if (!report) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error retrieving treatment report:', error);
    res.status(500).json({ message: 'Error retrieving treatment report', error: error.message });
  }
});

// Get examination PDF data
router.get('/examination/:examinationId/pdf', async (req, res) => {
  try {
    const examinationId = req.params.examinationId;
    const pdfData = await reportsModel.generateExaminationPdfData(examinationId);
    
    if (!pdfData) {
      return res.status(404).json({ message: 'Examination not found' });
    }
    
    res.json(pdfData);
  } catch (error) {
    console.error('Error generating examination PDF data:', error);
    res.status(500).json({ message: 'Error generating examination PDF data', error: error.message });
  }
});

// Get treatment PDF data
router.get('/treatment/:treatmentId/pdf', async (req, res) => {
  try {
    const treatmentId = req.params.treatmentId;
    const pdfData = await reportsModel.generateTreatmentPdfData(treatmentId);
    
    if (!pdfData) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json(pdfData);
  } catch (error) {
    console.error('Error generating treatment PDF data:', error);
    res.status(500).json({ message: 'Error generating treatment PDF data', error: error.message });
  }
});

// Get pet health summary for dashboard
router.get('/pet/:petId/summary', async (req, res) => {
  try {
    const petId = req.params.petId;
    const summary = await reportsModel.getPetHealthSummary(petId);
    
    if (!summary) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error retrieving pet health summary:', error);
    res.status(500).json({ message: 'Error retrieving pet health summary', error: error.message });
  }
});

// Get clinic medical dashboard
router.get('/clinic/:clinicId/dashboard', async (req, res) => {
  try {
    const clinicId = req.params.clinicId;
    const { start_date, end_date } = req.query;
    
    const dashboard = await reportsModel.getClinicMedicalDashboard(
      clinicId,
      start_date || null,
      end_date || null
    );
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error retrieving clinic medical dashboard:', error);
    res.status(500).json({ message: 'Error retrieving clinic medical dashboard', error: error.message });
  }
});

// Complete examination
router.patch('/examination/:examinationId/complete', async (req, res) => {
  try {
    const examinationId = req.params.examinationId;
    const updatedExamination = await reportsModel.completeExamination(examinationId);
    
    if (!updatedExamination) {
      return res.status(404).json({ message: 'Examination not found' });
    }
    
    res.json(updatedExamination);
  } catch (error) {
    console.error('Error completing examination:', error);
    res.status(500).json({ message: 'Error completing examination', error: error.message });
  }
});

module.exports = router;
