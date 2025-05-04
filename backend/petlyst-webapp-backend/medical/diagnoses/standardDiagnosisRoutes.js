const express = require('express');
const router = express.Router();
const StandardDiagnosis = require('./standardDiagnosisModel');
const { Op } = require('sequelize');
const authMiddleware = require('../../../middleware/authMiddleware');

/**
 * @route   GET /api/diagnoses/standard/list
 * @desc    Get all standard diagnoses, optionally filtered by species
 * @access  Private
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { species } = req.query;
    const whereClause = {};
    
    // Add species filter if provided
    if (species) {
      whereClause.species = species;
    }
    
    const standardDiagnoses = await StandardDiagnosis.findAll({
      where: whereClause,
      order: [
        ['species', 'ASC'],
        ['category', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
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
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    
    const standardDiagnosis = await StandardDiagnosis.findByPk(code);
    
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
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, name, description, category, species, is_active } = req.body;
    
    // If code is provided, check if it's unique
    if (code) {
      const existingDiagnosis = await StandardDiagnosis.findByPk(code);
      if (existingDiagnosis) {
        return res.status(400).json({ message: 'Diagnosis code already exists' });
      }
    }
    
    // Validate required fields
    if (!name || !species) {
      return res.status(400).json({ message: 'Name and species are required fields' });
    }
    
    // Generate unique code if not provided
    const diagnosisCode = code || await StandardDiagnosis.generateUniqueCode(species, category);
    
    // Create the diagnosis
    const newDiagnosis = await StandardDiagnosis.create({
      code: diagnosisCode,
      name,
      description,
      category,
      species,
      is_active: is_active !== undefined ? is_active : true
    });
    
    res.status(201).json(newDiagnosis);
  } catch (error) {
    console.error('Error creating standard diagnosis:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => ({ field: e.path, message: e.message })) 
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
router.put('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, description, category, species, is_active } = req.body;
    
    // Find the diagnosis
    const diagnosis = await StandardDiagnosis.findByPk(code);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Update the diagnosis
    await diagnosis.update({
      name: name || diagnosis.name,
      description: description !== undefined ? description : diagnosis.description,
      category: category !== undefined ? category : diagnosis.category,
      species: species || diagnosis.species,
      is_active: is_active !== undefined ? is_active : diagnosis.is_active
    });
    
    res.json(diagnosis);
  } catch (error) {
    console.error('Error updating standard diagnosis:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => ({ field: e.path, message: e.message })) 
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
router.delete('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    
    // Find the diagnosis
    const diagnosis = await StandardDiagnosis.findByPk(code);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Standard diagnosis not found' });
    }
    
    // Delete the diagnosis
    await diagnosis.destroy();
    
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
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { term, species } = req.query;
    
    if (!term) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    
    const whereClause = {
      [Op.or]: [
        { code: { [Op.iLike]: `%${term}%` } },
        { name: { [Op.iLike]: `%${term}%` } },
        { category: { [Op.iLike]: `%${term}%` } }
      ]
    };
    
    // Add species filter if provided
    if (species) {
      whereClause.species = species;
    }
    
    const standardDiagnoses = await StandardDiagnosis.findAll({
      where: whereClause,
      order: [
        ['name', 'ASC']
      ],
      limit: 20
    });
    
    res.json(standardDiagnoses);
  } catch (error) {
    console.error('Error searching standard diagnoses:', error);
    res.status(500).json({ message: 'Failed to search standard diagnoses' });
  }
});

module.exports = router;
