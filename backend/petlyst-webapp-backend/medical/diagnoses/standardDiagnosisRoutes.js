const express = require('express');
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
    console.error('Error in veterinarian middleware:', error);
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
    
    const standardDiagnoses = await standardDiagnosisModel.listStandardDiagnoses(filters);
    res.json(standardDiagnoses);
  } catch (error) {
    console.error('Error fetching standard diagnoses:', error);
    res.status(500).json({ message: 'Failed to fetch standard diagnoses' });
  }
});

/**
 * @route   GET /api/diagnoses/standard/:code
 * @desc    Get a standard diagnosis by code
 * @access  Private
 */
router.get('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    
    const standardDiagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
    
    if (!standardDiagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    res.json(standardDiagnosis);
  } catch (error) {
    console.error('Error fetching standard diagnosis:', error);
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
      is_active
    });
    
    res.status(201).json(newDiagnosis);
  } catch (error) {
    console.error('Error creating standard diagnosis:', error);
    
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
 * @route   PUT /api/diagnoses/standard/:code
 * @desc    Update a standard diagnosis
 * @access  Private
 */
router.put('/:code', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, description, category, species, is_active } = req.body;
    
    // Find the diagnosis
    const diagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
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
    console.error('Error updating standard diagnosis:', error);
    
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
 * @route   DELETE /api/diagnoses/standard/:code
 * @desc    Delete a standard diagnosis
 * @access  Private
 */
router.delete('/:code', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the diagnosis
    const diagnosis = await standardDiagnosisModel.getStandardDiagnosis(code);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Delete the diagnosis
    await standardDiagnosisModel.deleteStandardDiagnosis(code);
    
    res.json({ message: 'Standard diagnosis deleted successfully' });
  } catch (error) {
    console.error('Error deleting standard diagnosis:', error);
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
    
    const standardDiagnoses = await standardDiagnosisModel.searchStandardDiagnoses(term, species);
    
    res.json(standardDiagnoses);
  } catch (error) {
    console.error('Error searching standard diagnoses:', error);
    res.status(500).json({ message: 'Failed to search standard diagnoses' });
  }
});

module.exports = router;
