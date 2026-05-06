// diagnosesRoutes.js
const express = require('express');
const logger = require('../../config/logger');
const router = express.Router();
const diagnosesModel = require('./diagnosesModel');
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

// Middleware to validate examination for diagnosis creation
const validateExaminationForDiagnosis = async (req, res, next) => {
  try {
    const { examination_id } = req.body;
    
    if (!examination_id) {
      return res.status(400).json({ message: 'Examination ID is required' });
    }
    
    // Fetch the examination with pet details
    const examinationQuery = `
      SELECT e.*, p.pet_id, p.pet_owner_id, p.pet_name 
      FROM examinations e
      JOIN pets p ON e.pet_id = p.pet_id
      WHERE e.examination_id = $1
    `;
    const examinationResult = await pool.query(examinationQuery, [examination_id]);
    
    if (examinationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Examination not found' });
    }
    
    const examination = examinationResult.rows[0];
    
    // Check examination status - only allow diagnoses for in_progress or completed examinations
    if (examination.status === 'scheduled' || examination.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cannot add diagnosis to a scheduled or cancelled examination. Examination must be in progress or completed.'
      });
    }
    
    // Add examination to request for use in route handler
    req.examination = examination;
    
    // If we have a pet_id in the body, verify it matches the examination's pet_id
    if (req.body.pet_id && req.body.pet_id != examination.pet_id) {
      return res.status(400).json({ 
        message: 'The provided pet ID does not match the pet ID associated with this examination'
      });
    }
    
    // Check if the veterinarian has permission to add a diagnosis to this examination
    const vetId = req.vet_id;
    const examVetId = examination.vet_id;
    
    if (examVetId !== vetId) {
      // Check if they're in the same clinic
      const clinicCheck = await pool.query(`
        SELECT cv1.clinic_id 
        FROM clinic_veterinarians cv1
        JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
        WHERE cv1.veterinarian_id = $1 AND cv2.veterinarian_id = $2
        AND cv1.status = 'approved' AND cv2.status = 'approved'
      `, [examVetId, vetId]);
      
      if (clinicCheck.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied. You did not perform this examination and are not in the same clinic.' 
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error validating examination for diagnosis:', error);
    res.status(500).json({ message: 'Server error during examination validation', error: error.message });
  }
};

// Create a new diagnosis
router.post('/', authenticateToken, checkVerificationStatus, veterinarianMiddleware, validateExaminationForDiagnosis, async (req, res) => {
  try {
    const diagnosisData = req.body;
    
    // Validate required fields
    if (!diagnosisData.diagnosis_name) {
      return res.status(400).json({ message: 'Diagnosis name is required' });
    }
    
    // Set default diagnosis date to current date if not provided
    if (!diagnosisData.diagnosis_date) {
      diagnosisData.diagnosis_date = new Date();
    }
    
    const diagnosis = await diagnosesModel.createDiagnosis(diagnosisData);
    res.status(201).json(diagnosis);
  } catch (error) {
    logger.error('Error creating diagnosis:', error);
    res.status(500).json({ message: 'Error creating diagnosis', error: error.message });
  }
});

// Get a specific diagnosis
router.get('/:diagnosisId', authenticateToken, async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const diagnosis = await diagnosesModel.getDiagnosis(diagnosisId);
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }
    
    // Check if user has access to this diagnosis
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    if (userType === 'veterinarian') {
      // If veterinarian, check if they performed the exam or are in the same clinic
      if (diagnosis.vet_id !== userId) {
        // Check if they're in the same clinic
        const clinicCheck = await pool.query(`
          SELECT cv1.clinic_id 
          FROM clinic_veterinarians cv1
          JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
          WHERE cv1.veterinarian_id = $1 AND cv2.veterinarian_id = $2
          AND cv1.status = 'approved' AND cv2.status = 'approved'
        `, [diagnosis.vet_id, userId]);
        
        if (clinicCheck.rows.length === 0) {
          return res.status(403).json({ 
            message: 'Access denied. You did not perform this examination and are not in the same clinic.' 
          });
        }
      }
    } else if (userType === 'pet_owner') {
      // If pet owner, check if they own the pet
      const petOwnerCheck = await pool.query(
        'SELECT pet_id FROM pets WHERE pet_owner_id = $1 AND pet_id = $2',
        [userId, diagnosis.pet_id]
      );
      
      if (petOwnerCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied. You do not own this pet.' });
      }
    } else if (userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    res.json(diagnosis);
  } catch (error) {
    logger.error('Error getting diagnosis:', error);
    res.status(500).json({ message: 'Error getting diagnosis', error: error.message });
  }
});

// List diagnoses with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      examination_id, diagnosis_type, diagnosis_name, pet_id, 
      vet_id, severity, start_date, end_date, 
      limit = 20, offset = 0 
    } = req.query;
    
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    // Construct filters based on query parameters
    const filters = {};
    
    if (examination_id) filters.examination_id = examination_id;
    if (diagnosis_type) filters.diagnosis_type = diagnosis_type;
    if (diagnosis_name) filters.diagnosis_name = diagnosis_name;
    if (severity) filters.severity = severity;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);
    
    // Handle user-specific access restrictions
    if (userType === 'veterinarian') {
      // Veterinarians can see their own diagnoses or those from their clinic
      if (vet_id) {
        // If specific vet_id is requested, check if they're in the same clinic
        if (vet_id !== userId) {
          const clinicCheck = await pool.query(`
            SELECT cv1.clinic_id 
            FROM clinic_veterinarians cv1
            JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
            WHERE cv1.veterinarian_id = $1 AND cv2.veterinarian_id = $2
            AND cv1.status = 'approved' AND cv2.status = 'approved'
          `, [vet_id, userId]);
          
          if (clinicCheck.rows.length === 0) {
            return res.status(403).json({ 
              message: 'Access denied. You can only view diagnoses from your clinic.' 
            });
          }
          
          filters.vet_id = vet_id;
        } else {
          filters.vet_id = userId;
        }
      } else {
        // Get all clinics this vet is part of
        const clinicsResult = await pool.query(
          'SELECT clinic_id FROM clinic_veterinarians WHERE veterinarian_id = $1 AND status = $2',
          [userId, 'approved']
        );
        
        if (clinicsResult.rows.length > 0) {
          // TODO: filter by these clinic IDs once the model supports it.
          // For now we let them see all diagnoses (no filtering).
          // const clinicIds = clinicsResult.rows.map(row => row.clinic_id);
        } else {
          // If not in any clinic, only see own diagnoses
          filters.vet_id = userId;
        }
      }
    } else if (userType === 'pet_owner') {
      // Pet owners can only see diagnoses for their own pets
      if (pet_id) {
        // Verify ownership
        const petOwnerCheck = await pool.query(
          'SELECT pet_id FROM pets WHERE pet_owner_id = $1 AND pet_id = $2',
          [userId, pet_id]
        );
        
        if (petOwnerCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Access denied. You do not own this pet.' });
        }
        
        filters.pet_id = pet_id;
      } else {
        // Get all pets owned by this user
        const petsResult = await pool.query(
          'SELECT pet_id FROM pets WHERE pet_owner_id = $1',
          [userId]
        );
        
        if (petsResult.rows.length === 0) {
          // No pets, return empty array
          return res.json([]);
        }
        
        // For now, just return the first pet's diagnoses
        // A proper implementation would use an array of pet IDs
        filters.pet_id = petsResult.rows[0].pet_id;
      }
    } else if (userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    // Admin can see all diagnoses, no filtering needed
    
    const diagnoses = await diagnosesModel.listDiagnoses(filters, parseInt(limit), parseInt(offset));
    res.json(diagnoses);
  } catch (error) {
    logger.error('Error listing diagnoses:', error);
    res.status(500).json({ message: 'Error listing diagnoses', error: error.message });
  }
});

// Update a diagnosis
router.put('/:diagnosisId', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const updateData = req.body;
    
    // Check if diagnosis exists and get the examination's vet_id
    const diagnosisCheck = await pool.query(`
      SELECT d.diagnosis_id, e.vet_id
      FROM diagnoses d
      JOIN examinations e ON d.examination_id = e.examination_id
      WHERE d.diagnosis_id = $1
    `, [diagnosisId]);
    
    if (diagnosisCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }
    
    // Only the veterinarian who performed the exam or those in the same clinic can update diagnoses
    const examVetId = diagnosisCheck.rows[0].vet_id;
    
    if (examVetId !== req.vet_id) {
      // Check if they're in the same clinic
      const clinicCheck = await pool.query(`
        SELECT cv1.clinic_id 
        FROM clinic_veterinarians cv1
        JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
        WHERE cv1.veterinarian_id = $1 AND cv2.veterinarian_id = $2
        AND cv1.status = 'approved' AND cv2.status = 'approved'
      `, [examVetId, req.vet_id]);
      
      if (clinicCheck.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied. You did not perform this examination and are not in the same clinic.' 
        });
      }
    }
    
    const updatedDiagnosis = await diagnosesModel.updateDiagnosis(diagnosisId, updateData);
    
    if (!updatedDiagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found after update' });
    }
    
    res.json(updatedDiagnosis);
  } catch (error) {
    logger.error('Error updating diagnosis:', error);
    res.status(500).json({ message: 'Error updating diagnosis', error: error.message });
  }
});

// Delete a diagnosis
router.delete('/:diagnosisId', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    
    // Check if diagnosis exists and get the examination's vet_id
    const diagnosisCheck = await pool.query(`
      SELECT d.diagnosis_id, e.vet_id
      FROM diagnoses d
      JOIN examinations e ON d.examination_id = e.examination_id
      WHERE d.diagnosis_id = $1
    `, [diagnosisId]);
    
    if (diagnosisCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }
    
    // Only the veterinarian who performed the exam or those in the same clinic can delete diagnoses
    const examVetId = diagnosisCheck.rows[0].vet_id;
    
    if (examVetId !== req.vet_id) {
      // Check if they're in the same clinic
      const clinicCheck = await pool.query(`
        SELECT cv1.clinic_id 
        FROM clinic_veterinarians cv1
        JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
        WHERE cv1.veterinarian_id = $1 AND cv2.veterinarian_id = $2
        AND cv1.status = 'approved' AND cv2.status = 'approved'
      `, [examVetId, req.vet_id]);
      
      if (clinicCheck.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied. You did not perform this examination and are not in the same clinic.' 
        });
      }
    }
    
    // Check if there are treatments associated with this diagnosis
    try {
      const deletedDiagnosis = await diagnosesModel.deleteDiagnosis(diagnosisId);
      
      if (!deletedDiagnosis) {
        return res.status(404).json({ message: 'Diagnosis not found after delete attempt' });
      }
      
      res.json({ message: 'Diagnosis deleted successfully', diagnosis: deletedDiagnosis });
    } catch (error) {
      if (error.message === 'Cannot delete diagnosis with associated treatments') {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error deleting diagnosis:', error);
    res.status(500).json({ message: 'Error deleting diagnosis', error: error.message });
  }
});

// Get diagnoses for a specific pet
router.get('/pet/:petId', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    // Check access permission
    if (userType === 'pet_owner') {
      // Verify pet ownership
      const petOwnerCheck = await pool.query(
        'SELECT pet_id FROM pets WHERE pet_owner_id = $1 AND pet_id = $2',
        [userId, petId]
      );
      
      if (petOwnerCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied. You do not own this pet.' });
      }
    } else if (userType === 'veterinarian') {
      // Veterinarians can see pet diagnoses if they have examined the pet or are in a clinic that has
      const vetAccessCheck = await pool.query(`
        SELECT DISTINCT e.examination_id
        FROM examinations e
        WHERE e.pet_id = $1 AND e.vet_id = $2
        UNION
        SELECT DISTINCT e.examination_id
        FROM examinations e
        JOIN clinic_veterinarians cv1 ON e.vet_id = cv1.veterinarian_id
        JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
        WHERE e.pet_id = $3 AND cv2.veterinarian_id = $4
        AND cv1.status = 'approved' AND cv2.status = 'approved'
      `, [petId, userId, petId, userId]);
      
      if (vetAccessCheck.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied. You have not examined this pet and are not in a clinic that has.' 
        });
      }
    } else if (userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    const diagnoses = await diagnosesModel.getPetDiagnoses(petId);
    res.json(diagnoses);
  } catch (error) {
    logger.error('Error getting pet diagnoses:', error);
    res.status(500).json({ message: 'Error getting pet diagnoses', error: error.message });
  }
});

// Get diagnoses for a specific examination
router.get('/examination/:examinationId', authenticateToken, async (req, res) => {
  try {
    const { examinationId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    // Get examination details for access control
    const examinationQuery = await pool.query(`
      SELECT e.pet_id, e.vet_id, p.pet_owner_id
      FROM examinations e
      JOIN pets p ON e.pet_id = p.pet_id
      WHERE e.examination_id = $1
    `, [examinationId]);
    
    if (examinationQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Examination not found' });
    }
    
    const examination = examinationQuery.rows[0];
    
    // Check access permission
    if (userType === 'pet_owner') {
      // Verify pet ownership
      if (examination.pet_owner_id !== userId) {
        return res.status(403).json({ message: 'Access denied. You do not own this pet.' });
      }
    } else if (userType === 'veterinarian') {
      // Veterinarians can see if they performed the exam or are in the same clinic
      if (examination.vet_id !== userId) {
        // Check if they're in the same clinic
        const clinicCheck = await pool.query(`
          SELECT cv1.clinic_id 
          FROM clinic_veterinarians cv1
          JOIN clinic_veterinarians cv2 ON cv1.clinic_id = cv2.clinic_id
          WHERE cv1.veterinarian_id = $1 AND cv2.veterinarian_id = $2
          AND cv1.status = 'approved' AND cv2.status = 'approved'
        `, [examination.vet_id, userId]);
        
        if (clinicCheck.rows.length === 0) {
          return res.status(403).json({ 
            message: 'Access denied. You did not perform this examination and are not in the same clinic.' 
          });
        }
      }
    } else if (userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    const diagnoses = await diagnosesModel.getExaminationDiagnoses(examinationId);
    res.json(diagnoses);
  } catch (error) {
    logger.error('Error getting examination diagnoses:', error);
    res.status(500).json({ message: 'Error getting examination diagnoses', error: error.message });
  }
});

// New endpoint to get available examinations for diagnosis
router.get('/available-examinations/:petId', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { petId } = req.params;
    
    if (!petId) {
      return res.status(400).json({ message: 'Pet ID is required' });
    }
    
    // Verify the pet exists
    const petCheck = await pool.query('SELECT pet_id FROM pets WHERE pet_id = $1', [petId]);
    
    if (petCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // Get examinations for the pet that are in progress or completed
    const query = `
      SELECT e.examination_id, e.status, e.created_at, e.updated_at, e.examination_date,
             CONCAT(u.user_name, ' ', u.user_surname) as veterinarian_name,
             p.pet_id, p.pet_name, p.pet_species, p.pet_breed
      FROM examinations e
      JOIN pets p ON e.pet_id = p.pet_id
      JOIN users u ON e.vet_id = u.user_id
      WHERE e.pet_id = $1 
      AND e.status IN ('in_progress', 'completed')
      ORDER BY e.examination_date DESC, e.created_at DESC
    `;
    
    const result = await pool.query(query, [petId]);
    
    // Return the examinations
    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting available examinations for diagnosis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get standard diagnoses (for dropdown selection)
// This route is now handled by standardDiagnosisRoutes.js
/*
router.get('/standard/list', authenticateToken, checkVerificationStatus, veterinarianMiddleware, async (req, res) => {
  try {
    const { species } = req.query;
    const standardDiagnoses = await diagnosesModel.getStandardDiagnoses(species);
    res.json(standardDiagnoses);
  } catch (error) {
    logger.error('Error getting standard diagnoses:', error);
    res.status(500).json({ message: 'Error getting standard diagnoses', error: error.message });
  }
});
*/

module.exports = router;
