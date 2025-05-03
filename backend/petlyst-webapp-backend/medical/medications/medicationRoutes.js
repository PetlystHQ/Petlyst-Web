// medicationRoutes.js
const express = require('express');
const router = express.Router();
const medicationsModel = require('./medicationsModel');
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
 * Medication Routes
 */

// Get medication by ID
router.get('/:id', async (req, res) => {
  try {
    const medicationId = req.params.id;
    const medication = await medicationsModel.getMedication(medicationId);
    
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.json(medication);
  } catch (error) {
    console.error('Error retrieving medication:', error);
    res.status(500).json({ message: 'Error retrieving medication', error: error.message });
  }
});

// List medications with filters
router.get('/', async (req, res) => {
  try {
    const {
      medication_id,
      treatment_id,
      inventory_item_id,
      diagnosis_id,
      examination_id,
      pet_id,
      medication_name,
      route,
      start_date,
      end_date,
      limit,
      offset
    } = req.query;
    
    // Build filters object
    const filters = {};
    
    if (medication_id) filters.medication_id = medication_id;
    if (treatment_id) filters.treatment_id = treatment_id;
    if (inventory_item_id) filters.inventory_item_id = inventory_item_id;
    if (diagnosis_id) filters.diagnosis_id = diagnosis_id;
    if (examination_id) filters.examination_id = examination_id;
    if (pet_id) filters.pet_id = pet_id;
    if (medication_name) filters.medication_name = medication_name;
    if (route) filters.route = route;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);
    
    // Get medications
    const medications = await medicationsModel.listMedications(
      filters,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0
    );
    
    res.json(medications);
  } catch (error) {
    console.error('Error listing medications:', error);
    res.status(500).json({ message: 'Error listing medications', error: error.message });
  }
});

// Add medication to treatment
router.post('/treatment/:treatmentId', async (req, res) => {
  try {
    const treatmentId = req.params.treatmentId;
    const medicationData = req.body;
    
    // Validate required fields
    if (!medicationData.inventory_item_id) {
      return res.status(400).json({ message: 'Inventory item ID is required' });
    }
    
    // Add current user ID for inventory transactions
    medicationData.performed_by_user_id = req.user.userId;
    
    const medication = await medicationsModel.addMedicationToTreatment(treatmentId, medicationData);
    
    res.status(201).json(medication);
  } catch (error) {
    console.error('Error adding medication to treatment:', error);
    res.status(500).json({ message: 'Error adding medication to treatment', error: error.message });
  }
});

// Update medication
router.put('/:id', async (req, res) => {
  try {
    const medicationId = req.params.id;
    const updateData = req.body;
    
    // Add current user ID for inventory transactions
    updateData.performed_by_user_id = req.user.userId;
    
    const updatedMedication = await medicationsModel.updateMedication(medicationId, updateData);
    
    if (!updatedMedication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.json(updatedMedication);
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ message: 'Error updating medication', error: error.message });
  }
});

// Delete medication
router.delete('/:id', async (req, res) => {
  try {
    const medicationId = req.params.id;
    
    // Add current user ID for inventory transactions
    const performed_by_user_id = req.user.userId;
    
    const deletedMedication = await medicationsModel.deleteMedication(medicationId, performed_by_user_id);
    
    if (!deletedMedication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.json({ message: 'Medication deleted successfully', medication: deletedMedication });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ message: 'Error deleting medication', error: error.message });
  }
});

// Get all medications for a treatment
router.get('/treatment/:treatmentId', async (req, res) => {
  try {
    const treatmentId = req.params.treatmentId;
    const medications = await medicationsModel.getTreatmentMedications(treatmentId);
    
    res.json(medications);
  } catch (error) {
    console.error('Error retrieving treatment medications:', error);
    res.status(500).json({ message: 'Error retrieving treatment medications', error: error.message });
  }
});

// Get all medications for a pet
router.get('/pet/:petId', async (req, res) => {
  try {
    const petId = req.params.petId;
    const medications = await medicationsModel.getPetMedications(petId);
    
    res.json(medications);
  } catch (error) {
    console.error('Error retrieving pet medications:', error);
    res.status(500).json({ message: 'Error retrieving pet medications', error: error.message });
  }
});

// Get inventory medications
router.get('/inventory/:clinicId', async (req, res) => {
  try {
    const clinicId = req.params.clinicId;
    const medications = await medicationsModel.getInventoryMedications(clinicId);
    
    res.json(medications);
  } catch (error) {
    console.error('Error retrieving inventory medications:', error);
    res.status(500).json({ message: 'Error retrieving inventory medications', error: error.message });
  }
});

module.exports = router;
