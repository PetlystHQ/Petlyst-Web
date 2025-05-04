const { Sequelize, DataTypes } = require('sequelize');
const db = require('../../../config/database');

// Standard Diagnosis Model Definition
const StandardDiagnosis = db.define('standard_diagnosis', {
  code: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  species: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['dog', 'cat', 'bird', 'reptile', 'small_mammal', 'large_animal', 'exotic', 'other']]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'standard_diagnoses',
  timestamps: false,
  underscored: true
});

/**
 * Generate a unique diagnosis code based on species, category and timestamp
 * @param {string} species - The species (e.g., 'dog', 'cat')
 * @param {string} category - The category (optional)
 * @returns {Promise<string>} A unique diagnosis code
 */
StandardDiagnosis.generateUniqueCode = async (species, category = '') => {
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
    const existingCodes = await StandardDiagnosis.findAll({
      where: {
        code: {
          [Sequelize.Op.like]: `${baseCode}-%`
        }
      },
      order: [['code', 'DESC']],
      limit: 1
    });
    
    let nextCounter = 1;
    
    // If we found existing codes with this prefix, extract the counter and increment
    if (existingCodes && existingCodes.length > 0) {
      const lastCode = existingCodes[0].code;
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
};

module.exports = StandardDiagnosis;
