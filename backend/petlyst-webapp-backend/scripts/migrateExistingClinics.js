const ClinicVeterinarian = require('../models/clinicVeterinarianModel');
const logger = require('../config/logger');

// Migration script to add clinic-veterinarian relationships for existing clinics
async function migrateExistingClinics() {
  try {
    logger.info('Starting migration of existing clinics to add clinic creators...');
    
    // Mevcut klinik-veteriner ilişkilerini oluştur
    const result = await ClinicVeterinarian.migrateExistingClinics();
    
    logger.info('Migration completed successfully');
    logger.info(result.message);
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  }
}

// Scripti doğrudan çalıştır
migrateExistingClinics();

// Usage: node scripts/migrateExistingClinics.js 