const ClinicVeterinarian = require('../models/clinicVeterinarianModel');

// Migration script to add clinic-veterinarian relationships for existing clinics
async function migrateExistingClinics() {
  try {
    console.log('Starting migration of existing clinics to add clinic creators...');
    
    // Mevcut klinik-veteriner ilişkilerini oluştur
    const result = await ClinicVeterinarian.migrateExistingClinics();
    
    console.log('Migration completed successfully');
    console.log(result.message);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Scripti doğrudan çalıştır
migrateExistingClinics();

// Usage: node scripts/migrateExistingClinics.js 