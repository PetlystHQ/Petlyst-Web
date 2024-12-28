const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { checkVerificationStatus } = require('../middleware/verificationMiddleware');
const pool = require('../config/db');

// Base route: /api/clinics

// Get all clinics for a veterinarian
router.get('/my-clinics', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    // TODO: Implement get clinics logic
    res.status(200).json({ message: "Get clinics endpoint" });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new clinic (requires verified veterinarian)
router.post('/add', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { name, address, phone_number, location, description } = req.body;
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
        location, 
        description, 
        operator_id,
        verification_status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
      RETURNING *
    `;

    const values = [name, address || null, phone_number || null, location || null, description || null, operator_id];
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

// Update clinic details (requires verified status)
router.put('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    // TODO: Implement update clinic logic
    res.status(200).json({ message: "Update clinic endpoint" });
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
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

// Update clinic status (active/inactive)
router.patch('/:clinicId/status', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    // TODO: Implement status update logic
    res.status(200).json({ message: "Update clinic status endpoint" });
  } catch (error) {
    console.error('Error updating clinic status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 