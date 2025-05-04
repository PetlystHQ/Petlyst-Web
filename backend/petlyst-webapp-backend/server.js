const express = require('express');
const cors = require('cors');
require('dotenv').config();
// Use the existing pool from config/db.js instead of creating a new one
const pool = require('./config/db');
const { encrypt } = require('./utils/encryption');

const app = express();

// CORS options - Allow frontend application to connect
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Request', 'cache-control', 'pragma']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const userRoutes = require('./userRoutes/userRoutes');
const veterinarianRoutes = require('./veterinarianRoutes/veterinaryRoutes');
const clinicRoutes = require('./clinicRoutes/clinicRoutes');
const adminRoutes = require('./adminRoutes/adminRoutes');
const petRoutes = require('./petRoutes/petRoutes');
const petOwnerRoutes = require('./petOwnerRoutes/petOwnerRoutes');
const appointmentRoutes = require('./appointmentRoutes/appointmentRoutes');
const inventoryRoutes = require('./inventoryRoutes/inventoryRoutes');
const hospitalizationRoutes = require('./hospitalization/hospitalizationRoutes');
const examinationRoutes = require('./medical/examinations/examinationRoutes');
const diagnosesRoutes = require('./medical/diagnoses/diagnosesRoutes');
const treatmentRoutes = require('./medical/treatments/treatmentRoutes');
const medicationRoutes = require('./medical/medications/medicationRoutes');
const reportsRoutes = require('./medical/reports/reportsRoutes');


// Use routes
app.use('/api/users', userRoutes);
app.use('/api/veterinarian', veterinarianRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/pet-owners', petOwnerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinics', inventoryRoutes);
app.use('/api', hospitalizationRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/diagnoses', diagnosesRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/reports', reportsRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Petlyst API' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        availableRoutes: [
            '/api/users',
            '/api/veterinarian',
            '/api/clinics',
            '/api/admin',
            '/api/pets',
            '/api/pet-owners',
            '/api/appointments',
            '/api/clinics/[clinicId]/inventory',
            '/api/clinics/[clinicId]/hospitalization/rooms',
            '/api/hospitalization/admit',
            '/api/hospitalization/[hospitalizationId]/discharge',
            '/api/examinations',
            '/api/diagnoses',
            '/api/treatments',
            '/api/medications',
            '/api/reports'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Check database schema for veterinarians table
pool.query(`
    SELECT column_name, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'veterinarians' 
    AND column_name = 'veterinarian_verification_status'
`).then(result => {
    console.log('Veterinarian verification status column schema:', result.rows);
    
    // Force update the default value to 'not_verified' regardless of current value
    console.log('Updating default value to not_verified');
    return pool.query(`
        ALTER TABLE veterinarians 
        ALTER COLUMN veterinarian_verification_status 
        SET DEFAULT 'not_verified'
    `);
}).then(() => {
    console.log('Database schema check completed');
    
    // Update ALL existing veterinarians with 'pending' status who haven't submitted verification details
    return pool.query(`
        UPDATE veterinarians 
        SET veterinarian_verification_status = 'not_verified' 
        WHERE veterinarian_verification_status = 'pending' 
        AND (veterinarian_graduate_barcode IS NULL OR veterinarian_tc_number IS NULL)
    `);
}).then(result => {
    if (result && result.rowCount) {
        console.log(`Updated ${result.rowCount} veterinarians from 'pending' to 'not_verified'`);
    }
    
    // Also ensure that all new veterinarians without verification details have not_verified status
    return pool.query(`
        UPDATE veterinarians 
        SET veterinarian_verification_status = 'not_verified' 
        WHERE (veterinarian_graduate_barcode IS NULL OR veterinarian_tc_number IS NULL)
    `);
}).then(result => {
    if (result && result.rowCount) {
        console.log(`Ensured ${result.rowCount} veterinarians have 'not_verified' status`);
    }
    
    // Check for unencrypted TC numbers and encrypt them
    return pool.query(`
        SELECT veterinarian_id, veterinarian_tc_number 
        FROM veterinarians 
        WHERE veterinarian_tc_number IS NOT NULL
    `);
}).then(result => {
    console.log(`Found ${result.rows.length} veterinarians with TC numbers`);
    
    let encryptedCount = 0;
    let alreadyEncryptedCount = 0;
    let invalidFormatCount = 0;
    
    // Process each veterinarian
    const promises = result.rows.map(async (vet) => {
        const tcNumber = vet.veterinarian_tc_number;
        
        // Skip if already encrypted (contains a colon which separates IV and encrypted data)
        if (tcNumber.includes(':')) {
            alreadyEncryptedCount++;
            return;
        }
        
        // Only encrypt if it looks like a TC number (11 digits)
        if (/^\d{11}$/.test(tcNumber)) {
            try {
                const encryptedTcNumber = encrypt(tcNumber);
                
                // Update the database with the encrypted value
                const updateQuery = `
                    UPDATE veterinarians 
                    SET veterinarian_tc_number = $1 
                    WHERE veterinarian_id = $2
                `;
                
                await pool.query(updateQuery, [encryptedTcNumber, vet.veterinarian_id]);
                encryptedCount++;
            } catch (error) {
                console.error(`Error encrypting TC number for veterinarian ID ${vet.veterinarian_id}:`, error);
            }
        } else {
            invalidFormatCount++;
        }
    });
    
    return Promise.all(promises).then(() => {
        console.log('TC number encryption check completed:');
        console.log(`- Encrypted: ${encryptedCount} TC numbers`);
        console.log(`- Already encrypted: ${alreadyEncryptedCount} TC numbers`);
        console.log(`- Invalid format: ${invalidFormatCount} TC numbers`);
    });
}).catch(err => {
    console.error('Error checking database schema:', err);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- /api/users');
    console.log('- /api/veterinarian');
    console.log('- /api/clinics');
    console.log('- /api/admin');
    console.log('- /api/pets');
    console.log('- /api/pet-owners');
    console.log('- /api/appointments');
    console.log('- /api/clinics/[clinicId]/inventory');
    console.log('- /api/examinations');
    console.log('- /api/diagnoses');
    console.log('- /api/treatments');
    console.log('- /api/medications');
    console.log('- /api/reports');
});