const pool = require('../config/db');
const { encrypt } = require('../utils/encryption');
require('dotenv').config();

async function encryptExistingTcNumbers() {
  try {
    console.log('Starting encryption of existing TC numbers...');
    
    // First, get all veterinarians with non-encrypted TC numbers
    const selectQuery = `
      SELECT veterinarian_id, veterinarian_tc_number 
      FROM veterinarians 
      WHERE veterinarian_tc_number IS NOT NULL
    `;
    
    const result = await pool.query(selectQuery);
    console.log(`Found ${result.rows.length} veterinarians with TC numbers to process`);
    
    let encryptedCount = 0;
    let skippedCount = 0;
    
    // Process each veterinarian
    for (const vet of result.rows) {
      const tcNumber = vet.veterinarian_tc_number;
      
      // Skip if already encrypted (contains a colon which separates IV and encrypted data)
      if (tcNumber.includes(':')) {
        console.log(`Skipping already encrypted TC number for veterinarian ID: ${vet.veterinarian_id}`);
        skippedCount++;
        continue;
      }
      
      // Only encrypt if it looks like a TC number (11 digits)
      if (/^\d{11}$/.test(tcNumber)) {
        const encryptedTcNumber = encrypt(tcNumber);
        
        // Update the database with the encrypted value
        const updateQuery = `
          UPDATE veterinarians 
          SET veterinarian_tc_number = $1 
          WHERE veterinarian_id = $2
        `;
        
        await pool.query(updateQuery, [encryptedTcNumber, vet.veterinarian_id]);
        console.log(`Encrypted TC number for veterinarian ID: ${vet.veterinarian_id}`);
        encryptedCount++;
      } else {
        console.log(`Skipping invalid TC number format for veterinarian ID: ${vet.veterinarian_id}`);
        skippedCount++;
      }
    }
    
    console.log('Encryption process completed!');
    console.log(`Encrypted: ${encryptedCount} TC numbers`);
    console.log(`Skipped: ${skippedCount} TC numbers (already encrypted or invalid format)`);
    
  } catch (error) {
    console.error('Error encrypting TC numbers:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the encryption process
encryptExistingTcNumbers(); 