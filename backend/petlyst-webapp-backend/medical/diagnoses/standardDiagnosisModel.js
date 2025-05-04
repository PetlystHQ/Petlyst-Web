const pool = require('../../config/db');

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
    console.error('Error generating unique diagnosis code:', error);
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
      is_active
    } = diagnosisData;

    // Generate unique code if not provided
    const diagnosisCode = code || await generateUniqueCode(species, category);
    
    const result = await pool.query(
      `INSERT INTO standard_diagnoses (
        code,
        name,
        description,
        category,
        species,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        diagnosisCode,
        name,
        description,
        category,
        species,
        is_active !== undefined ? is_active : true
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating standard diagnosis:', error);
    throw error;
  }
}

// Get a specific standard diagnosis by code
async function getStandardDiagnosis(code) {
  try {
    const result = await pool.query(
      `SELECT * FROM standard_diagnoses WHERE code = $1`,
      [code]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting standard diagnosis:', error);
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
    
    // Add order by
    query += ` ORDER BY species ASC, category ASC, name ASC`;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error listing standard diagnoses:', error);
    throw error;
  }
}

// Update standard diagnosis
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
    console.error('Error updating standard diagnosis:', error);
    throw error;
  }
}

// Delete a standard diagnosis
async function deleteStandardDiagnosis(code) {
  try {
    const result = await pool.query(
      'DELETE FROM standard_diagnoses WHERE code = $1 RETURNING *',
      [code]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting standard diagnosis:', error);
    throw error;
  }
}

// Search standard diagnoses
async function searchStandardDiagnoses(term, species = null) {
  try {
    let query = `
      SELECT * FROM standard_diagnoses
      WHERE (code ILIKE $1 OR name ILIKE $1 OR category ILIKE $1)
    `;
    
    const queryParams = [`%${term}%`];
    
    if (species) {
      query += ` AND species = $2`;
      queryParams.push(species);
    }
    
    query += ` ORDER BY name ASC LIMIT 20`;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error searching standard diagnoses:', error);
    throw error;
  }
}

module.exports = {
  generateUniqueCode,
  createStandardDiagnosis,
  getStandardDiagnosis,
  listStandardDiagnoses,
  updateStandardDiagnosis,
  deleteStandardDiagnosis,
  searchStandardDiagnoses
};
