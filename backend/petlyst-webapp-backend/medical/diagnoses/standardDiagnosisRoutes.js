const express = require('express');
const logger = require('../../config/logger');
const router = express.Router();
const standardDiagnosisModel = require('./standardDiagnosisModel');
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
    
    if (userResult.rows[0].user_type !== 'veterinarian') {
      return res.status(403).json({ message: 'Access denied. Only veterinarians can perform this action.' });
    }
    
    // Add vet_id to request
    req.vet_id = userId;
    next();
  } catch (error) {
    logger.error('Error in veterinarian middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/diagnoses/standard
 * @desc    Get all standard diagnoses, optionally filtered by species
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { species } = req.query;
    const filters = {};
    
    // Add species filter if provided
    if (species) {
      filters.species = species;
    }
    
    // Add veterinarian_id filter for non-admin users to see only their custom diagnoses plus system defaults
    if (req.user.userType === 'veterinarian') {
      filters.veterinarian_id = req.user.userId;
    }
    
    const standardDiagnoses = await standardDiagnosisModel.listStandardDiagnoses(filters);
    res.json(standardDiagnoses);
  } catch (error) {
    logger.error('Error fetching standard diagnoses:', error);
    res.status(500).json({ message: 'Failed to fetch standard diagnoses' });
  }
});

/**
 * @route   GET /api/diagnoses/standard/id/:id
 * @desc    Get a standard diagnosis by ID
 * @access  Private
 */
router.get('/id/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const standardDiagnosis = await standardDiagnosisModel.getStandardDiagnosisById(id);
    
    if (!standardDiagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Check if user has access to this diagnosis
    if (req.user.userType === 'veterinarian' && 
        standardDiagnosis.veterinarian_id !== null && 
        standardDiagnosis.veterinarian_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. This diagnosis belongs to another veterinarian.' });
    }
    
    res.json(standardDiagnosis);
  } catch (error) {
    logger.error('Error fetching standard diagnosis:', error);
    res.status(500).json({ message: 'Failed to fetch standard diagnosis' });
  }
});

/**
 * @route   GET /api/diagnoses/standard/:code
 * @desc    Get a standard diagnosis by code (for backward compatibility)
 * @access  Private
 */
router.get('/code/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    
    const standardDiagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
    
    if (!standardDiagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Check if user has access to this diagnosis
    if (req.user.userType === 'veterinarian' && 
        standardDiagnosis.veterinarian_id !== null && 
        standardDiagnosis.veterinarian_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. This diagnosis belongs to another veterinarian.' });
    }
    
    res.json(standardDiagnosis);
  } catch (error) {
    logger.error('Error fetching standard diagnosis:', error);
    res.status(500).json({ message: 'Failed to fetch standard diagnosis' });
  }
});

/**
 * @route   POST /api/diagnoses/standard
 * @desc    Create a new standard diagnosis
 * @access  Private
 */
router.post('/', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { code, name, description, category, species, is_active } = req.body;
    
    // If code is provided, check if it's unique
    if (code) {
      const existingDiagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
      if (existingDiagnosis) {
        return res.status(400).json({ message: 'Diagnosis code already exists' });
      }
    }
    
    // Validate required fields
    if (!name || !species) {
      return res.status(400).json({ message: 'Name and species are required fields' });
    }
    
    // Create the diagnosis
    const newDiagnosis = await standardDiagnosisModel.createStandardDiagnosis({
      code,
      name,
      description,
      category,
      species,
      is_active,
      veterinarian_id: req.vet_id // Add the veterinarian ID
    });
    
    res.status(201).json(newDiagnosis);
  } catch (error) {
    logger.error('Error creating standard diagnosis:', error);
    
    // Handle validation errors
    if (error.constraint) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.detail 
      });
    }
    
    res.status(500).json({ message: 'Failed to create standard diagnosis' });
  }
});

/**
 * @route   PUT /api/diagnoses/standard/id/:id
 * @desc    Update a standard diagnosis by ID
 * @access  Private
 */
router.put('/id/:id', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, species, is_active, code } = req.body;
    
    // Find the diagnosis
    const diagnosis = await standardDiagnosisModel.getStandardDiagnosisById(id);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Check if veterinarian has permission to update this diagnosis
    if (diagnosis.veterinarian_id !== null && diagnosis.veterinarian_id !== req.vet_id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own diagnoses.' 
      });
    }
    
    // Update the diagnosis
    const updatedDiagnosis = await standardDiagnosisModel.updateStandardDiagnosisById(id, {
      name,
      description,
      category,
      species,
      is_active,
      code
    });
    
    res.json(updatedDiagnosis);
  } catch (error) {
    logger.error('Error updating standard diagnosis:', error);
    
    // Handle validation errors
    if (error.constraint) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.detail
      });
    }
    
    res.status(500).json({ message: 'Failed to update standard diagnosis' });
  }
});

/**
 * @route   PUT /api/diagnoses/standard/code/:code
 * @desc    Update a standard diagnosis by code (for backward compatibility)
 * @access  Private
 */
router.put('/code/:code', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, description, category, species, is_active } = req.body;
    
    // Find the diagnosis
    const diagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Check if veterinarian has permission to update this diagnosis
    if (diagnosis.veterinarian_id !== null && diagnosis.veterinarian_id !== req.vet_id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own diagnoses.' 
      });
    }
    
    // Update the diagnosis
    const updatedDiagnosis = await standardDiagnosisModel.updateStandardDiagnosis(code, {
      name,
      description,
      category,
      species,
      is_active
    });
    
    res.json(updatedDiagnosis);
  } catch (error) {
    logger.error('Error updating standard diagnosis:', error);
    
    // Handle validation errors
    if (error.constraint) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.detail
      });
    }
    
    res.status(500).json({ message: 'Failed to update standard diagnosis' });
  }
});

/**
 * @route   DELETE /api/diagnoses/standard/id/:id
 * @desc    Delete a standard diagnosis by ID
 * @access  Private
 */
router.delete('/id/:id', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the diagnosis
    const diagnosis = await standardDiagnosisModel.getStandardDiagnosisById(id);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Check if veterinarian has permission to delete this diagnosis
    if (diagnosis.veterinarian_id !== null && diagnosis.veterinarian_id !== req.vet_id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own diagnoses.' 
      });
    }
    
    // Delete the diagnosis
    await standardDiagnosisModel.deleteStandardDiagnosisById(id);
    
    res.json({ message: 'Standard diagnosis deleted successfully' });
  } catch (error) {
    logger.error('Error deleting standard diagnosis:', error);
    res.status(500).json({ message: 'Failed to delete standard diagnosis' });
  }
});

/**
 * @route   DELETE /api/diagnoses/standard/code/:code
 * @desc    Delete a standard diagnosis by code (for backward compatibility)
 * @access  Private
 */
router.delete('/code/:code', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the diagnosis
    const diagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Check if veterinarian has permission to delete this diagnosis
    if (diagnosis.veterinarian_id !== null && diagnosis.veterinarian_id !== req.vet_id) {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own diagnoses.' 
      });
    }
    
    // Delete the diagnosis
    await standardDiagnosisModel.deleteStandardDiagnosis(code);
    
    res.json({ message: 'Standard diagnosis deleted successfully' });
  } catch (error) {
    logger.error('Error deleting standard diagnosis:', error);
    res.status(500).json({ message: 'Failed to delete standard diagnosis' });
  }
});

/**
 * @route   GET /api/diagnoses/standard/search
 * @desc    Search standard diagnoses by name, code or category
 * @access  Private
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { term, species } = req.query;
    
    if (!term) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    
    // Include veterinarian_id for filtering if user is a veterinarian
    const veterinarianId = req.user.userType === 'veterinarian' ? req.user.userId : null;
    
    const standardDiagnoses = await standardDiagnosisModel.searchStandardDiagnoses(term, species, veterinarianId);
    
    res.json(standardDiagnoses);
  } catch (error) {
    logger.error('Error searching standard diagnoses:', error);
    res.status(500).json({ message: 'Failed to search standard diagnoses' });
  }
});

/**
 * @route   GET /api/diagnoses/standard/veterinarian
 * @desc    Get diagnoses created by the logged-in veterinarian
 * @access  Private
 */
router.get('/veterinarian', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const diagnoses = await standardDiagnosisModel.getVeterinarianDiagnoses(req.vet_id);
    res.json(diagnoses);
  } catch (error) {
    logger.error('Error fetching veterinarian diagnoses:', error);
    res.status(500).json({ message: 'Failed to fetch veterinarian diagnoses' });
  }
});

module.exports = router;
