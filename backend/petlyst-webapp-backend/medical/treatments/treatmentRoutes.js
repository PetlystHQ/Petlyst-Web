const express = require('express');
const router = express.Router();
const treatmentsModel = require('./treatmentsModel');
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
 * Treatment Routes
 */

// Create a new treatment
router.post('/', async (req, res) => {
  try {
    const treatmentData = req.body;
    
    // Validate required fields
    if (!treatmentData.diagnosis_id) {
      return res.status(400).json({ message: 'Diagnosis ID is required' });
    }
    
    // Add default values if not provided
    if (!treatmentData.status) {
      treatmentData.status = 'planned';
    }
    
    if (!treatmentData.start_date) {
      treatmentData.start_date = new Date();
    }
    
    // Create the treatment
    const treatment = await treatmentsModel.createTreatment(treatmentData);
    
    res.status(201).json(treatment);
  } catch (error) {
    console.error('Error creating treatment:', error);
    res.status(500).json({ message: 'Error creating treatment', error: error.message });
  }
});

// Get a specific treatment by ID
router.get('/:id', async (req, res) => {
  try {
    const treatmentId = req.params.id;
    const treatment = await treatmentsModel.getTreatment(treatmentId);
    
    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json(treatment);
  } catch (error) {
    console.error('Error retrieving treatment:', error);
    res.status(500).json({ message: 'Error retrieving treatment', error: error.message });
  }
});

// List treatments with filters
router.get('/', async (req, res) => {
  try {
    const {
      treatment_id,
      diagnosis_id,
      pet_id,
      vet_id,
      examination_id,
      treatment_type,
      treatment_name,
      status,
      outcome,
      protocol_id,
      start_date,
      end_date,
      limit,
      offset
    } = req.query;
    
    // Build filters object
    const filters = {};
    
    if (treatment_id) filters.treatment_id = treatment_id;
    if (diagnosis_id) filters.diagnosis_id = diagnosis_id;
    if (pet_id) filters.pet_id = pet_id;
    if (vet_id) filters.vet_id = vet_id;
    if (examination_id) filters.examination_id = examination_id;
    if (treatment_type) filters.treatment_type = treatment_type;
    if (treatment_name) filters.treatment_name = treatment_name;
    if (status) filters.status = status;
    if (outcome) filters.outcome = outcome;
    if (protocol_id) filters.protocol_id = protocol_id;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);
    
    // Get treatments
    const treatments = await treatmentsModel.listTreatments(
      filters,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0
    );
    
    res.json(treatments);
  } catch (error) {
    console.error('Error listing treatments:', error);
    res.status(500).json({ message: 'Error listing treatments', error: error.message });
  }
});

// Update treatment
router.put('/:id', async (req, res) => {
  try {
    const treatmentId = req.params.id;
    const updateData = req.body;
    
    // Prevent updating diagnosis_id
    if (updateData.diagnosis_id) {
      delete updateData.diagnosis_id;
    }
    
    const updatedTreatment = await treatmentsModel.updateTreatment(treatmentId, updateData);
    
    if (!updatedTreatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json(updatedTreatment);
  } catch (error) {
    console.error('Error updating treatment:', error);
    res.status(500).json({ message: 'Error updating treatment', error: error.message });
  }
});

// Update treatment status
router.patch('/:id/status', async (req, res) => {
  try {
    const treatmentId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status value
    const validStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status value', 
        validValues: validStatuses 
      });
    }
    
    const updatedTreatment = await treatmentsModel.updateTreatmentStatus(treatmentId, status);
    
    if (!updatedTreatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json(updatedTreatment);
  } catch (error) {
    console.error('Error updating treatment status:', error);
    res.status(500).json({ message: 'Error updating treatment status', error: error.message });
  }
});

// Update treatment outcome
router.patch('/:id/outcome', async (req, res) => {
  try {
    const treatmentId = req.params.id;
    const { outcome } = req.body;
    
    if (!outcome) {
      return res.status(400).json({ message: 'Outcome is required' });
    }
    
    // Validate outcome value
    const validOutcomes = ['successful', 'unsuccessful', 'monitoring'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({ 
        message: 'Invalid outcome value', 
        validValues: validOutcomes 
      });
    }
    
    const updatedTreatment = await treatmentsModel.updateTreatmentOutcome(treatmentId, outcome);
    
    if (!updatedTreatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json(updatedTreatment);
  } catch (error) {
    console.error('Error updating treatment outcome:', error);
    res.status(500).json({ message: 'Error updating treatment outcome', error: error.message });
  }
});

// Delete treatment
router.delete('/:id', async (req, res) => {
  try {
    const treatmentId = req.params.id;
    const deletedTreatment = await treatmentsModel.deleteTreatment(treatmentId);
    
    if (!deletedTreatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }
    
    res.json({ message: 'Treatment deleted successfully', treatment: deletedTreatment });
  } catch (error) {
    console.error('Error deleting treatment:', error);
    res.status(500).json({ message: 'Error deleting treatment', error: error.message });
  }
});

// Get all treatments for a diagnosis
router.get('/diagnosis/:diagnosisId', async (req, res) => {
  try {
    const diagnosisId = req.params.diagnosisId;
    const treatments = await treatmentsModel.getDiagnosisTreatments(diagnosisId);
    
    res.json(treatments);
  } catch (error) {
    console.error('Error retrieving diagnosis treatments:', error);
    res.status(500).json({ message: 'Error retrieving diagnosis treatments', error: error.message });
  }
});

// Get all treatments for a pet
router.get('/pet/:petId', async (req, res) => {
  try {
    const petId = req.params.petId;
    const treatments = await treatmentsModel.getPetTreatments(petId);
    
    res.json(treatments);
  } catch (error) {
    console.error('Error retrieving pet treatments:', error);
    res.status(500).json({ message: 'Error retrieving pet treatments', error: error.message });
  }
});

/**
 * Medication Routes
 */

// Add medication to treatment
router.post('/:id/medications', async (req, res) => {
  try {
    const treatmentId = req.params.id;
    const medicationData = req.body;
    
    // Validate required fields
    if (!medicationData.inventory_item_id) {
      return res.status(400).json({ message: 'Inventory item ID is required' });
    }
    
    // Add current user ID for inventory transactions
    medicationData.performed_by_user_id = req.user.userId;
    
    const medication = await treatmentsModel.addMedicationToTreatment(treatmentId, medicationData);
    
    res.status(201).json(medication);
  } catch (error) {
    console.error('Error adding medication to treatment:', error);
    res.status(500).json({ message: 'Error adding medication to treatment', error: error.message });
  }
});

// Update medication
router.put('/medications/:medicationId', async (req, res) => {
  try {
    const medicationId = req.params.medicationId;
    const updateData = req.body;
    
    // Add current user ID for inventory transactions
    updateData.performed_by_user_id = req.user.userId;
    
    const updatedMedication = await treatmentsModel.updateMedication(medicationId, updateData);
    
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
router.delete('/medications/:medicationId', async (req, res) => {
  try {
    const medicationId = req.params.medicationId;
    
    // Add current user ID for inventory transactions
    const performed_by_user_id = req.user.userId;
    
    const deletedMedication = await treatmentsModel.deleteMedication(medicationId, performed_by_user_id);
    
    if (!deletedMedication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.json({ message: 'Medication deleted successfully', medication: deletedMedication });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ message: 'Error deleting medication', error: error.message });
  }
});

/**
 * Protocol Routes
 */

// Get treatment protocols
router.get('/protocols/list', async (req, res) => {
  try {
    const { species } = req.query;
    const protocols = await treatmentsModel.getTreatmentProtocols(species);
    
    res.json(protocols);
  } catch (error) {
    console.error('Error getting treatment protocols:', error);
    res.status(500).json({ message: 'Error getting treatment protocols', error: error.message });
  }
});

// Get treatment protocol details
router.get('/protocols/:protocolId', async (req, res) => {
  try {
    const protocolId = req.params.protocolId;
    const protocol = await treatmentsModel.getTreatmentProtocolDetails(protocolId);
    
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('Error getting protocol details:', error);
    res.status(500).json({ message: 'Error getting protocol details', error: error.message });
  }
});

module.exports = router;
