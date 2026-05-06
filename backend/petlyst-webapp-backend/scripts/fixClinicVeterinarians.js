/**
 * Migration script to fix clinic-veterinarian associations
 * 
 * This script will:
 * 1. Find all clinics without a proper clinic_veterinarians relation
 * 2. Ensure the clinic operator is properly registered as a veterinarian
 * 3. Create the proper clinic_veterinarians relation
 * 
 * Usage:
 * node scripts/fixClinicVeterinarians.js
 */

const pool = require('../config/db');
const ClinicVeterinarian = require('../models/clinicVeterinarianModel');
const logger = require('../config/logger');

async function fixClinicVeterinarians() {
  logger.info('Starting migration to fix clinic-veterinarian associations...');
  const client = await pool.connect();
  
  try {
    // Get all clinics
    const getClinicsQuery = `
      SELECT c.clinic_id, c.clinic_name, c.clinic_operator_id, u.user_name, u.user_surname, u.user_type
      FROM clinics c
      JOIN users u ON c.clinic_operator_id = u.user_id
    `;
    
    logger.info('Fetching all clinics...');
    const clinicsResult = await client.query(getClinicsQuery);
    logger.info(`Found ${clinicsResult.rows.length} clinics total.`);
    
    // For each clinic, check if there's a clinic_veterinarians relation with is_clinic_creator = true
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const clinic of clinicsResult.rows) {
      try {
        logger.info(`Processing clinic: ${clinic.clinic_id} - ${clinic.clinic_name}`);
        
        if (clinic.user_type !== 'veterinarian') {
          logger.warn(`  WARNING: Clinic operator (${clinic.clinic_operator_id}: ${clinic.user_name} ${clinic.user_surname}) is not a veterinarian (type: ${clinic.user_type}). Skipping.`);
          continue;
        }
        
        // Check if a creator relation exists
        const checkRelationQuery = `
          SELECT id, status, is_clinic_creator 
          FROM clinic_veterinarians
          WHERE clinic_id = $1 AND veterinarian_id = $2 AND is_clinic_creator = true
        `;
        
        const relationResult = await client.query(checkRelationQuery, [
          clinic.clinic_id, clinic.clinic_operator_id
        ]);
        
        if (relationResult.rows.length > 0) {
          logger.info(`  Clinic already has a creator relation: ${JSON.stringify(relationResult.rows[0])}`);
          continue;
        }
        
        // Check if the operator is properly registered as a veterinarian
        try {
          logger.info(`  Ensuring veterinarian record for operator ${clinic.clinic_operator_id}...`);
          await ClinicVeterinarian.ensureVeterinarianRecord(clinic.clinic_operator_id);
        } catch (vetError) {
          logger.error(`  Error ensuring veterinarian record: ${vetError.message}`);
          errorCount++;
          continue;
        }
        
        // Create the clinic-veterinarian relation
        logger.info(`  Creating clinic creator relation for clinic ${clinic.clinic_id} and veterinarian ${clinic.clinic_operator_id}...`);
        const result = await ClinicVeterinarian.addClinicCreator(clinic.clinic_operator_id, clinic.clinic_id);
        logger.info(`  Successfully created clinic creator relation: ${JSON.stringify(result)}`);
        fixedCount++;
      } catch (error) {
        logger.error(`Error processing clinic ${clinic.clinic_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    logger.info('\nMigration summary:');
    logger.info(`  Total clinics: ${clinicsResult.rows.length}`);
    logger.info(`  Fixed clinics: ${fixedCount}`);
    logger.info(`  Errors: ${errorCount}`);
    logger.info('Migration completed.');
    
  } catch (error) {
    logger.error('Migration error:', error);
  } finally {
    client.release();
  }
}

// Run the migration when this script is executed directly
if (require.main === module) {
  fixClinicVeterinarians()
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { fixClinicVeterinarians }; 