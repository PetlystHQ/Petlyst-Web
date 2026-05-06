const pool = require('../../config/db');
const logger = require('../../config/logger');

/**
 * Generate a unique diagnosis code based on species, category and timestamp
 * @param {string} species - The species (e.g., 'dog', 'cat')
 * @param {string} category - The category (optional)
 * @returns {Promise<string>} A unique diagnosis code
 */
async function generateUniqueCode(species, category = '') {
  try {
    // Get species prefix (first 3 letters)
    const speciesPrefix = species ? species.substring(0, 3).toUpperCase() : 'GEN';
    
    // Get category prefix (first 3 letters or 'GEN' if empty)
    const categoryPrefix = category 
      ? category.substring(0, 3).toUpperCase() 
      : 'GEN';
    
    // Base code without the counter
    const baseCode = `${speciesPrefix}-${categoryPrefix}`;
    
    // Find the highest existing code with this prefix pattern
    const result = await pool.query(
      `SELECT code FROM standard_diagnoses
       WHERE code LIKE $1
       ORDER BY code DESC
       LIMIT 1`,
      [`${baseCode}-%`]
    );
    
    let nextCounter = 1;
    
    // If we found existing codes with this prefix, extract the counter and increment
    if (result.rows.length > 0) {
      const lastCode = result.rows[0].code;
      const lastCounter = parseInt(lastCode.split('-')[2], 10);
      if (!isNaN(lastCounter)) {
        nextCounter = lastCounter + 1;
      }
    }
    
    // Format counter with leading zeros (e.g., 001, 012, 123)
    const counterStr = nextCounter.toString().padStart(3, '0');
    
    // Create the final unique code
    const uniqueCode = `${baseCode}-${counterStr}`;
    
    return uniqueCode;
  } catch (error) {
    logger.error('Error generating unique diagnosis code:', error);
    // Fallback to timestamp-based code if there's an error
    const timestamp = Date.now().toString().slice(-6);
    return `${species ? species.substring(0, 3).toUpperCase() : 'GEN'}-${timestamp}`;
  }
}

// Create a new standard diagnosis
async function createStandardDiagnosis(diagnosisData) {
  try {
    const {
      code,
      name,
      description,
      category,
      species,
      is_active,
      veterinarian_id
    } = diagnosisData;

    // Use provided code or generate a simple one based on timestamp if none provided
    const diagnosisCode = code || `${species.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    
    const result = await pool.query(
      `INSERT INTO standard_diagnoses (
        code,
        name,
        description,
        category,
        species,
        is_active,
        veterinarian_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        diagnosisCode,
        name,
        description,
        category,
        species,
        is_active !== undefined ? is_active : true,
        veterinarian_id
      ]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating standard diagnosis:', error);
    throw error;
  }
}

// Get a specific standard diagnosis by ID
async function getStandardDiagnosisById(diagnosisId) {
  try {
    const result = await pool.query(
      `SELECT * FROM standard_diagnoses WHERE diagnosis_id = $1`,
      [diagnosisId]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting standard diagnosis by ID:', error);
    throw error;
  }
}

// Get a specific standard diagnosis by code (for backward compatibility)
async function getStandardDiagnosis(code) {
  try {
    const result = await pool.query(
      `SELECT * FROM standard_diagnoses WHERE code = $1`,
      [code]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting standard diagnosis by code:', error);
    throw error;
  }
}

// List standard diagnoses with various filters
async function listStandardDiagnoses(filters = {}) {
  try {
    let query = `SELECT * FROM standard_diagnoses WHERE 1=1`;
    const queryParams = [];
    let paramIndex = 1;
    
    // Apply filters
    if (filters.species) {
      query += ` AND species = $${paramIndex}`;
      queryParams.push(filters.species);
      paramIndex++;
    }
    
    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      queryParams.push(filters.category);
      paramIndex++;
    }
    
    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      queryParams.push(filters.is_active);
      paramIndex++;
    }
    
    if (filters.veterinarian_id !== undefined) {
      query += ` AND (veterinarian_id = $${paramIndex} OR veterinarian_id IS NULL)`;
      queryParams.push(filters.veterinarian_id);
      paramIndex++;
    }
    
    // Add order by
    query += ` ORDER BY species ASC, category ASC, name ASC`;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('Error listing standard diagnoses:', error);
    throw error;
  }
}

// Update standard diagnosis by ID
async function updateStandardDiagnosisById(diagnosisId, updateData) {
  try {
    const {
      name,
      description,
      category,
      species,
      is_active,
      code
    } = updateData;
    
    // Only update fields that are provided
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(name);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(description);
      paramIndex++;
    }
    
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }
    
    if (species !== undefined) {
      updateFields.push(`species = $${paramIndex}`);
      queryParams.push(species);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active);
      paramIndex++;
    }
    
    if (code !== undefined) {
      updateFields.push(`code = $${paramIndex}`);
      queryParams.push(code);
      paramIndex++;
    }
    
    // If no fields to update, just return the current diagnosis
    if (updateFields.length === 0) {
      return getStandardDiagnosisById(diagnosisId);
    }
    
    queryParams.push(diagnosisId);
    
    const query = `
      UPDATE standard_diagnoses
      SET ${updateFields.join(', ')}
      WHERE diagnosis_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, queryParams);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating standard diagnosis by ID:', error);
    throw error;
  }
}

// Update standard diagnosis by code (for backward compatibility)
async function updateStandardDiagnosis(code, updateData) {
  try {
    const {
      name,
      description,
      category,
      species,
      is_active
    } = updateData;
    
    // Only update fields that are provided
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(name);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(description);
      paramIndex++;
    }
    
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }
    
    if (species !== undefined) {
      updateFields.push(`species = $${paramIndex}`);
      queryParams.push(species);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active);
      paramIndex++;
    }
    
    // If no fields to update, just return the current diagnosis
    if (updateFields.length === 0) {
      return getStandardDiagnosis(code);
    }
    
    queryParams.push(code);
    
    const query = `
      UPDATE standard_diagnoses
      SET ${updateFields.join(', ')}
      WHERE code = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, queryParams);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating standard diagnosis by code:', error);
    throw error;
  }
}

// Delete a standard diagnosis by ID
async function deleteStandardDiagnosisById(diagnosisId) {
  try {
    const result = await pool.query(
      'DELETE FROM standard_diagnoses WHERE diagnosis_id = $1 RETURNING *',
      [diagnosisId]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error deleting standard diagnosis by ID:', error);
    throw error;
  }
}

// Delete a standard diagnosis by code (for backward compatibility)
async function deleteStandardDiagnosis(code) {
  try {
    const result = await pool.query(
      'DELETE FROM standard_diagnoses WHERE code = $1 RETURNING *',
      [code]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error deleting standard diagnosis by code:', error);
    throw error;
  }
}

// Search standard diagnoses
async function searchStandardDiagnoses(term, species = null, veterinarianId = null) {
  try {
    let query = `
      SELECT * FROM standard_diagnoses
      WHERE (code ILIKE $1 OR name ILIKE $1 OR category ILIKE $1)
    `;
    
    const queryParams = [`%${term}%`];
    let paramIndex = 2;
    
    if (species) {
      query += ` AND species = $${paramIndex}`;
      queryParams.push(species);
      paramIndex++;
    }
    
    if (veterinarianId) {
      query += ` AND (veterinarian_id = $${paramIndex} OR veterinarian_id IS NULL)`;
      queryParams.push(veterinarianId);
      paramIndex++;
    }
    
    query += ` ORDER BY name ASC LIMIT 20`;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('Error searching standard diagnoses:', error);
    throw error;
  }
}

// Get diagnoses created by a specific veterinarian
async function getVeterinarianDiagnoses(veterinarianId) {
  try {
    const result = await pool.query(
      `SELECT * FROM standard_diagnoses 
       WHERE veterinarian_id = $1
       ORDER BY species ASC, category ASC, name ASC`,
      [veterinarianId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting veterinarian diagnoses:', error);
    throw error;
  }
}

module.exports = {
  generateUniqueCode,
  createStandardDiagnosis,
  getStandardDiagnosis,
  getStandardDiagnosisById,
  listStandardDiagnoses,
  updateStandardDiagnosis,
  updateStandardDiagnosisById,
  deleteStandardDiagnosis,
  deleteStandardDiagnosisById,
  searchStandardDiagnoses,
  getVeterinarianDiagnoses
};
