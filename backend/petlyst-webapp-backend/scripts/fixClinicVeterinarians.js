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

async function fixClinicVeterinarians() {
  console.log('Starting migration to fix clinic-veterinarian associations...');
  const client = await pool.connect();
  
  try {
    // Get all clinics
    const getClinicsQuery = `
      SELECT c.clinic_id, c.clinic_name, c.clinic_operator_id, u.user_name, u.user_surname, u.user_type
      FROM clinics c
      JOIN users u ON c.clinic_operator_id = u.user_id
    `;
    
    console.log('Fetching all clinics...');
    const clinicsResult = await client.query(getClinicsQuery);
    console.log(`Found ${clinicsResult.rows.length} clinics total.`);
    
    // For each clinic, check if there's a clinic_veterinarians relation with is_clinic_creator = true
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const clinic of clinicsResult.rows) {
      try {
        console.log(`Processing clinic: ${clinic.clinic_id} - ${clinic.clinic_name}`);
        
        if (clinic.user_type !== 'veterinarian') {
          console.warn(`  WARNING: Clinic operator (${clinic.clinic_operator_id}: ${clinic.user_name} ${clinic.user_surname}) is not a veterinarian (type: ${clinic.user_type}). Skipping.`);
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
          console.log(`  Clinic already has a creator relation: ${JSON.stringify(relationResult.rows[0])}`);
          continue;
        }
        
        // Check if the operator is properly registered as a veterinarian
        try {
          console.log(`  Ensuring veterinarian record for operator ${clinic.clinic_operator_id}...`);
          await ClinicVeterinarian.ensureVeterinarianRecord(clinic.clinic_operator_id);
        } catch (vetError) {
          console.error(`  Error ensuring veterinarian record: ${vetError.message}`);
          errorCount++;
          continue;
        }
        
        // Create the clinic-veterinarian relation
        console.log(`  Creating clinic creator relation for clinic ${clinic.clinic_id} and veterinarian ${clinic.clinic_operator_id}...`);
        const result = await ClinicVeterinarian.addClinicCreator(clinic.clinic_operator_id, clinic.clinic_id);
        console.log(`  Successfully created clinic creator relation: ${JSON.stringify(result)}`);
        fixedCount++;
      } catch (error) {
        console.error(`Error processing clinic ${clinic.clinic_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\nMigration summary:');
    console.log(`  Total clinics: ${clinicsResult.rows.length}`);
    console.log(`  Fixed clinics: ${fixedCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log('Migration completed.');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
  }
}

// Run the migration when this script is executed directly
if (require.main === module) {
  fixClinicVeterinarians()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { fixClinicVeterinarians }; 