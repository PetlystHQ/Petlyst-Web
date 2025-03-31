const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { encrypt } = require('../utils/encryption');
// Multer ve S3 servislerini ekleyelim
const multer = require('multer');
const s3Service = require('../aws/s3Service');
const { uploadVeterinarianPhoto, deleteVeterinarianPhoto } = s3Service;
const jwt = require('jsonwebtoken');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Bu fonksiyon bir isimden benzersiz slug oluşturur
async function generateUniqueSlug(name, surname) {
  // Temel slug oluştur
  let baseSlug = `dr-${name.toLowerCase()}-${surname.toLowerCase()}`
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  
  // Slug'un benzersiz olup olmadığını kontrol et
  let slug = baseSlug;
  let isUnique = false;
  let counter = 0;
  
  while (!isUnique) {
    // Veritabanında bu slug'ın var olup olmadığını kontrol et
    const checkQuery = `
      SELECT veterinarian_id FROM veterinarians 
      WHERE slug = $1
    `;
    const result = await pool.query(checkQuery, [slug]);
    
    if (result.rows.length === 0) {
      isUnique = true;
    } else {
      // Eğer slug zaten varsa, 6 karakterli rastgele bir belirteç ekle
      const randomStr = Math.random().toString(36).substring(2, 8);
      slug = `${baseSlug}-${randomStr}`;
      counter++;
      
      // Sonsuz döngüyü önlemek için maksimum 5 deneme yap
      if (counter > 5) {
        // Son çare olarak timestamp ekle
        slug = `${baseSlug}-${Date.now()}`;
        isUnique = true;
      }
    }
  }
  
  return slug;
}

// ELLE ÇAĞIRILACAK olan initializeSlugColumn fonksiyonu
async function initializeSlugColumn() {
  try {
    console.log("[SLUG MIGRATION] Başlangıç: Veterinarians tablosuna slug sütunu ekleniyor...");
    
    // Önce ALTER TABLE komutuyla sütun ekle (eğer yoksa)
    try {
      const addColumnQuery = `
        ALTER TABLE veterinarians 
        ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
      `;
      await pool.query(addColumnQuery);
      console.log("[SLUG MIGRATION] Slug sütunu eklendi.");
    } catch (err) {
      console.error("[SLUG MIGRATION] Slug sütunu eklenirken hata:", err);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[SLUG MIGRATION] Slug sütunu oluşturma hatası:", error);
    return false;
  }
}

// Admin için slug oluşturma API'si
router.post('/admin/generate-slugs', authenticateToken, async (req, res) => {
  try {
    // Sadece adminler veya yetkililer kullanabilir
    if (req.user.userType !== 'admin' && req.user.userType !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlemi sadece admin veya yetkili personel yapabilir' 
      });
    }
    
    // İlk olarak sütunu ekle
    const columnCreated = await initializeSlugColumn();
    if (!columnCreated) {
      return res.status(500).json({
        success: false,
        message: 'Slug sütunu oluşturulamadı'
      });
    }
    
    // Slug değeri olmayan veya boş olan tüm veterinerleri bul
    const findVetsQuery = `
      SELECT v.veterinarian_id, u.user_name, u.user_surname
      FROM veterinarians v
      JOIN users u ON v.veterinarian_id = u.user_id
      WHERE v.slug IS NULL OR v.slug = ''
    `;
    
    const vetsToUpdate = await pool.query(findVetsQuery);
    console.log(`[SLUG MIGRATION] ${vetsToUpdate.rows.length} veteriner için slug oluşturulacak.`);
    
    const updates = [];
    
    // Her biri için slug oluştur ve güncelle
    for (const vet of vetsToUpdate.rows) {
      try {
        const slug = await generateUniqueSlug(vet.user_name, vet.user_surname);
        
        const updateQuery = `
          UPDATE veterinarians
          SET slug = $1
          WHERE veterinarian_id = $2
          RETURNING veterinarian_id, slug
        `;
        
        const result = await pool.query(updateQuery, [slug, vet.veterinarian_id]);
        
        if (result.rows.length > 0) {
          updates.push({
            id: vet.veterinarian_id,
            name: `${vet.user_name} ${vet.user_surname}`,
            slug: result.rows[0].slug
          });
          console.log(`[SLUG MIGRATION] Veteriner ID ${vet.veterinarian_id} için slug oluşturuldu: ${slug}`);
        }
      } catch (err) {
        console.error(`[SLUG MIGRATION] ID ${vet.veterinarian_id} için slug güncellenirken hata:`, err);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `${updates.length} veteriner için slug oluşturuldu`,
      updates
    });
  } catch (error) {
    console.error('Slug oluşturma hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// Get Veterinarian Verification Status for Authenticated Veterinary
router.get('/verification-status', authenticateToken, async (req, res) => {
    try {
        // Check if the user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const userId = req.user.userId;

        // Query to get verification status from veterinarians table
        const query = `
            SELECT veterinarian_verification_status 
            FROM veterinarians 
            WHERE veterinarian_id = $1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }

        res.json({ 
            verification_status: result.rows[0].veterinarian_verification_status,
        });
    } catch (error) {
        console.error('Error checking verification status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Submit Verification Modal for Authenticated Veterinary
router.post('/submit-verification', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const userId = req.user.userId;
        const { graduation_barcode, tc_number } = req.body;

        // Validate input
        if (!graduation_barcode || !tc_number) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate TC number format
        if (!/^\d{11}$/.test(tc_number)) {
            return res.status(400).json({ message: 'Invalid TC Kimlik No format.' });
        }

        // Encrypt the TC number before storing
        const encryptedTcNumber = encrypt(tc_number);

        // First, check if a profile already exists
        const checkQuery = `
            SELECT veterinarian_id 
            FROM veterinarians 
            WHERE veterinarian_id = $1
        `;
        const existingProfile = await pool.query(checkQuery, [userId]);

        if (existingProfile.rows.length > 0) {
            // Update existing profile
            const updateQuery = `
                UPDATE veterinarians 
                SET 
                    veterinarian_graduate_barcode = $1,
                    veterinarian_tc_number = $2,
                    veterinarian_verification_status = 'pending'
                WHERE veterinarian_id = $3
                RETURNING *
            `;
            await pool.query(updateQuery, [graduation_barcode, encryptedTcNumber, userId]);
        } else {
            // Create new profile
            const insertQuery = `
                INSERT INTO veterinarians 
                (veterinarian_id, veterinarian_graduate_barcode, veterinarian_tc_number, veterinarian_verification_status)
                VALUES ($1, $2, $3, 'pending')
                RETURNING *
            `;
            await pool.query(insertQuery, [userId, graduation_barcode, encryptedTcNumber]);
        }

        res.status(200).json({ 
            message: 'Verification details submitted successfully. Your application is under review.',
            status: 'pending'
        });

    } catch (error) {
        console.error('Error submitting verification details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET all education records for authenticated veterinarian
router.get('/education', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT * FROM veterinarian_education 
            WHERE veterinarian_id = $1
            ORDER BY start_date DESC
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching education records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new education record
router.post('/education', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { school_name, field_of_study, start_date, end_date, is_current } = req.body;

        // Validate required fields
        if (!school_name || !field_of_study || !start_date) {
            return res.status(400).json({ message: 'School name, field of study, and start date are required.' });
        }

        // Validate logical date consistency
        if (end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
        }

        // Validate is_current and end_date logic
        if (is_current && end_date) {
            return res.status(400).json({ message: 'Current education cannot have an end date.' });
        }

        if (!is_current && !end_date) {
            return res.status(400).json({ message: 'Completed education must have an end date.' });
        }

        const query = `
            INSERT INTO veterinarian_education 
            (veterinarian_id, school_name, field_of_study, start_date, end_date, is_current)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [veterinarianId, school_name, field_of_study, start_date, end_date, is_current];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding education record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT update education record
router.put('/education/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const educationId = req.params.id;
        const { school_name, field_of_study, start_date, end_date, is_current } = req.body;

        // Validate required fields
        if (!school_name || !field_of_study || !start_date) {
            return res.status(400).json({ message: 'School name, field of study, and start date are required.' });
        }

        // Validate logical date consistency
        if (end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
        }

        // Validate is_current and end_date logic
        if (is_current && end_date) {
            return res.status(400).json({ message: 'Current education cannot have an end date.' });
        }

        if (!is_current && !end_date) {
            return res.status(400).json({ message: 'Completed education must have an end date.' });
        }

        // First verify the education record belongs to this veterinarian
        const checkQuery = `
            SELECT education_id FROM veterinarian_education
            WHERE education_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [educationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Education record not found or you do not have permission to edit it.' });
        }

        const updateQuery = `
            UPDATE veterinarian_education
            SET 
                school_name = $1,
                field_of_study = $2,
                start_date = $3,
                end_date = $4,
                is_current = $5
            WHERE education_id = $6 AND veterinarian_id = $7
            RETURNING *
        `;

        const values = [school_name, field_of_study, start_date, end_date, is_current, educationId, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating education record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE education record
router.delete('/education/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const educationId = req.params.id;

        // First verify the education record belongs to this veterinarian
        const checkQuery = `
            SELECT education_id FROM veterinarian_education
            WHERE education_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [educationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Education record not found or you do not have permission to delete it.' });
        }

        const deleteQuery = `
            DELETE FROM veterinarian_education
            WHERE education_id = $1 AND veterinarian_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(deleteQuery, [educationId, veterinarianId]);
        
        res.status(200).json({ message: 'Education record deleted successfully', deletedRecord: result.rows[0] });
    } catch (error) {
        console.error('Error deleting education record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET all certifications for authenticated veterinarian
router.get('/certifications', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT * FROM veterinarian_certifications 
            WHERE veterinarian_id = $1
            ORDER BY issue_date DESC
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching certification records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new certification record
router.post('/certifications', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { certification_name, issuing_organization, issue_date, certification_number } = req.body;

        // Validate required fields
        if (!certification_name || !issuing_organization || !issue_date) {
            return res.status(400).json({ message: 'Certification name, issuing organization, and issue date are required.' });
        }

        const query = `
            INSERT INTO veterinarian_certifications 
            (veterinarian_id, certification_name, issuing_organization, issue_date, certification_number, created_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [veterinarianId, certification_name, issuing_organization, issue_date, certification_number];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding certification record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT update certification record
router.put('/certifications/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const certificationId = req.params.id;
        const { certification_name, issuing_organization, issue_date, certification_number } = req.body;

        // Validate required fields
        if (!certification_name || !issuing_organization || !issue_date) {
            return res.status(400).json({ message: 'Certification name, issuing organization, and issue date are required.' });
        }

        // First verify the certification record belongs to this veterinarian
        const checkQuery = `
            SELECT certification_id FROM veterinarian_certifications
            WHERE certification_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [certificationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Certification record not found or you do not have permission to edit it.' });
        }

        const updateQuery = `
            UPDATE veterinarian_certifications
            SET 
                certification_name = $1,
                issuing_organization = $2,
                issue_date = $3,
                certification_number = $4
            WHERE certification_id = $5 AND veterinarian_id = $6
            RETURNING *
        `;

        const values = [certification_name, issuing_organization, issue_date, certification_number, certificationId, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating certification record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE certification record
router.delete('/certifications/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const certificationId = req.params.id;

        // First verify the certification record belongs to this veterinarian
        const checkQuery = `
            SELECT certification_id FROM veterinarian_certifications
            WHERE certification_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [certificationId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Certification record not found or you do not have permission to delete it.' });
        }

        const deleteQuery = `
            DELETE FROM veterinarian_certifications
            WHERE certification_id = $1 AND veterinarian_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(deleteQuery, [certificationId, veterinarianId]);
        
        res.status(200).json({ message: 'Certification record deleted successfully', deletedRecord: result.rows[0] });
    } catch (error) {
        console.error('Error deleting certification record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET all expertise areas for authenticated veterinarian
router.get('/expertise', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT * FROM veterinarian_expertise 
            WHERE veterinarian_id = $1
            ORDER BY expertise_area ASC
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching expertise records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new expertise area
router.post('/expertise', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { expertise_area } = req.body;

        // Validate required fields
        if (!expertise_area) {
            return res.status(400).json({ message: 'Expertise area is required.' });
        }
        
        // Validate that expertise_area is a valid ID from our predefined list
        // This validation is enforced in the frontend with the dropdown, but we do basic validation here as well
        if (!expertise_area.match(/^[a-z_]+$/)) {
            return res.status(400).json({ message: 'Invalid expertise area format.' });
        }

        const query = `
            INSERT INTO veterinarian_expertise 
            (veterinarian_id, expertise_area, created_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [veterinarianId, expertise_area];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding expertise record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT update expertise area
router.put('/expertise/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const expertiseId = req.params.id;
        const { expertise_area } = req.body;

        // Validate required fields
        if (!expertise_area) {
            return res.status(400).json({ message: 'Expertise area is required.' });
        }
        
        // Validate that expertise_area is a valid ID from our predefined list
        // This validation is enforced in the frontend with the dropdown, but we do basic validation here as well
        if (!expertise_area.match(/^[a-z_]+$/)) {
            return res.status(400).json({ message: 'Invalid expertise area format.' });
        }

        // First verify the expertise record belongs to this veterinarian
        const checkQuery = `
            SELECT expertise_id FROM veterinarian_expertise
            WHERE expertise_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [expertiseId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Expertise record not found or you do not have permission to edit it.' });
        }

        const updateQuery = `
            UPDATE veterinarian_expertise
            SET expertise_area = $1
            WHERE expertise_id = $2 AND veterinarian_id = $3
            RETURNING *
        `;

        const values = [expertise_area, expertiseId, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating expertise record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE expertise area
router.delete('/expertise/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const expertiseId = req.params.id;

        // First verify the expertise record belongs to this veterinarian
        const checkQuery = `
            SELECT expertise_id FROM veterinarian_expertise
            WHERE expertise_id = $1 AND veterinarian_id = $2
        `;
        
        const checkResult = await pool.query(checkQuery, [expertiseId, veterinarianId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Expertise record not found or you do not have permission to delete it.' });
        }

        const deleteQuery = `
            DELETE FROM veterinarian_expertise
            WHERE expertise_id = $1 AND veterinarian_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(deleteQuery, [expertiseId, veterinarianId]);
        
        res.status(200).json({ message: 'Expertise record deleted successfully', deletedRecord: result.rows[0] });
    } catch (error) {
        console.error('Error deleting expertise record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET veterinarian profile details including biography and preferred languages
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        
        const query = `
            SELECT v.biography, v.preferred_languages, 
                   u.user_name, u.user_surname, u.user_email, u.user_phone, u.user_profile_photo
            FROM veterinarians v
            JOIN users u ON v.veterinarian_id = u.user_id
            WHERE v.veterinarian_id = $1
        `;
        
        const result = await pool.query(query, [veterinarianId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching veterinarian profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// UPDATE veterinarian biography and preferred languages
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        // Check if user is a veterinarian
        if (req.user.userType !== 'veterinarian') {
            return res.status(403).json({ message: 'Access denied. User is not a veterinarian.' });
        }

        const veterinarianId = req.user.userId;
        const { biography, preferred_languages } = req.body;
        
        // Validation
        if (biography && biography.length > 2000) {
            return res.status(400).json({ message: 'Biography must be 2000 characters or less.' });
        }
        
        // Check if languages array is valid
        if (preferred_languages && !Array.isArray(preferred_languages)) {
            return res.status(400).json({ message: 'Preferred languages must be an array.' });
        }
        
        // Check if all languages are strings with reasonable length
        if (preferred_languages && Array.isArray(preferred_languages)) {
            for (const lang of preferred_languages) {
                if (typeof lang !== 'string' || lang.length > 50) {
                    return res.status(400).json({ message: 'Each language must be a string with 50 characters or less.' });
                }
            }
        }
        
        const updateQuery = `
            UPDATE veterinarians
            SET 
                biography = $1,
                preferred_languages = $2,
                veterinarian_updated_at = CURRENT_TIMESTAMP
            WHERE veterinarian_id = $3
            RETURNING biography, preferred_languages
        `;
        
        const values = [biography || null, preferred_languages || null, veterinarianId];
        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Veterinarian profile not found.' });
        }
        
        res.status(200).json({
            message: 'Profile updated successfully',
            profile: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating veterinarian profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Upload veterinarian photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('===== UPLOAD VETERINARIAN PHOTO REQUEST RECEIVED =====');
    console.log('Request body:', {
      veterinarianName: req.body.veterinarianName,
      userId: req.user?.userId
    });
    console.log('File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer (${req.file.buffer.length} bytes)` : 'No buffer'
    } : 'No file');
    
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      console.error('Access denied - user is not a veterinarian');
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    const photo = req.file;
    const { veterinarianName } = req.body;

    // Validate required fields
    if (!veterinarianName) {
      console.error('Missing required field: veterinarianName');
      return res.status(400).json({
        success: false,
        message: 'Veterinarian name is required'
      });
    }

    if (!photo) {
      console.error('No photo provided in the request');
      return res.status(400).json({
        success: false,
        message: 'No photo provided'
      });
    }

    // Upload to S3
    try {
      console.log('Uploading veterinarian photo:', {
        fileName: photo.originalname,
        fileSize: photo.size,
        mimeType: photo.mimetype,
        veterinarianId,
        veterinarianName
      });

      const result = await uploadVeterinarianPhoto(
        photo.buffer,
        photo.originalname,
        photo.mimetype,
        veterinarianId.toString(),
        veterinarianName
      );

      console.log('S3 upload successful:', result);
      
      // Ensure we have a valid URL
      if (!result.url || !result.url.startsWith('http')) {
        console.warn('S3 returned invalid URL, constructing fallback URL');
        result.url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${result.key}`;
        console.log('Using fallback URL:', result.url);
      }

      // Insert photo URL into veterinarian_albums table
      const insertPhotoQuery = `
        INSERT INTO veterinarian_albums (veterinarian_id, veterinarian_album_photo_url)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const dbResult = await pool.query(insertPhotoQuery, [veterinarianId, result.url]);
      console.log('Database insert successful:', dbResult.rows[0]);

      res.status(200).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          url: result.url,
          key: result.key
        }
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to upload photo to storage: ${s3Error.message}`
      });
    }
  } catch (error) {
    console.error('Error uploading veterinarian photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get veterinarian photos
router.get('/photos', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    
    // Get user's name for logging purposes
    const userQuery = `
      SELECT user_name, user_surname
      FROM users 
      WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [veterinarianId]);
    const veterinarianName = userResult.rows.length > 0 
      ? `${userResult.rows[0].user_name} ${userResult.rows[0].user_surname}`
      : 'Unknown';
    
    // Get photos from veterinarian_albums table
    let photosResult = { rows: [] };
    try {
      const getPhotosQuery = `
        SELECT veterinarian_album_photo_id, veterinarian_album_photo_url, veterinarian_album_photo_url_created_at
        FROM "veterinarian_albums"
        WHERE veterinarian_id = $1
        ORDER BY veterinarian_album_photo_url_created_at DESC
      `;
      
      photosResult = await pool.query(getPhotosQuery, [veterinarianId]);
    } catch (photoError) {
      console.warn(`Could not fetch photos for veterinarian ${veterinarianId}:`, photoError.message);
      // Continue with empty photos array
    }
    
    // Log information about the veterinarian and photos
    console.log('Fetching photos for veterinarian:', {
      veterinarianId,
      veterinarianName,
      photoCount: photosResult.rows.length
    });
    
    res.status(200).json({
      success: true,
      message: 'Photos fetched successfully',
      photos: photosResult.rows
    });
  } catch (error) {
    console.error('Error fetching veterinarian photos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete veterinarian photo
router.delete('/photos/:photoId', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    const { photoId } = req.params;

    // Get user's name for S3 path
    const userQuery = `
      SELECT user_name, user_surname
      FROM users 
      WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [veterinarianId]);
    const veterinarianName = userResult.rows.length > 0 
      ? `${userResult.rows[0].user_name} ${userResult.rows[0].user_surname}`
      : 'Unknown';

    // Find the photo in veterinarian_albums
    const findPhotoQuery = `
      SELECT veterinarian_album_photo_id, veterinarian_album_photo_url 
      FROM "veterinarian_albums"
      WHERE veterinarian_album_photo_id = $1 AND veterinarian_id = $2
    `;
    
    const photoResult = await pool.query(findPhotoQuery, [photoId, veterinarianId]);

    if (photoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    const { veterinarian_album_photo_url } = photoResult.rows[0];

    // Parse the S3 URL to get the key
    const s3Key = veterinarian_album_photo_url.split('.amazonaws.com/')[1];
    
    console.log('Deleting photo:', {
      photoId,
      veterinarianId,
      veterinarianName,
      s3Key
    });

    // Delete from S3
    try {
      await deleteVeterinarianPhoto(s3Key);

      // Delete the record from the database
      const deletePhotoQuery = `
        DELETE FROM veterinarian_albums 
        WHERE veterinarian_album_photo_id = $1
      `;
      await pool.query(deletePhotoQuery, [photoId]);

      res.status(200).json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to delete photo from storage: ${s3Error.message}`,
      });
    }
  } catch (error) {
    console.error('Error deleting veterinarian photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// GET veterinarian profile visibility status
router.get('/profile-visibility', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    
    const query = `
      SELECT is_profile_public 
      FROM veterinarians 
      WHERE veterinarian_id = $1
    `;
    
    const result = await pool.query(query, [veterinarianId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      is_profile_public: result.rows[0].is_profile_public || false
    });
  } catch (error) {
    console.error('Error fetching profile visibility status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// UPDATE veterinarian profile visibility
router.put('/profile-visibility', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    const { is_profile_public } = req.body;
    
    // Validate input
    if (typeof is_profile_public !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_profile_public must be a boolean value'
      });
    }
    
    const query = `
      UPDATE veterinarians
      SET is_profile_public = $1
      WHERE veterinarian_id = $2
      RETURNING is_profile_public
    `;
    
    const result = await pool.query(query, [is_profile_public, veterinarianId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile visibility updated successfully',
      is_profile_public: result.rows[0].is_profile_public
    });
  } catch (error) {
    console.error('Error updating profile visibility status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Slug-by-name endpoint yerine slug-by-slug endpoint ile değiştirelim
router.get('/public-profile-by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let userId = null;
    let isProfileOwner = false;
    
    // Check if the requester is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Doğru şekilde ID'yi çıkarıyoruz - JWT token yapısındaki farklı fieldlar destekleniyor
        userId = decoded.id || decoded.userId || decoded.user_id;
        console.log("Authenticated user ID:", userId);
      } catch (error) {
        // Invalid token, continue as unauthenticated
        console.error('Error verifying token:', error);
      }
    }
    
    // Find the veterinarian by slug
    const veterinarianQuery = `
      SELECT v.veterinarian_id, v.is_profile_public, v.veterinarian_verification_status, v.slug
      FROM veterinarians v
      WHERE v.slug = $1
      LIMIT 1
    `;
    
    const veterinarians = await pool.query(veterinarianQuery, [slug]);
    
    if (veterinarians.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Veterinarian not found' });
    }
    
    const veterinarian = veterinarians.rows[0];
    
    // ID formatları farklı olabileceği için string formatına çevirip karşılaştırıyoruz
    isProfileOwner = userId && (String(userId) === String(veterinarian.veterinarian_id));
    console.log("Profile owner check:", { 
      userId: userId, 
      vet_id: veterinarian.veterinarian_id, 
      isOwner: isProfileOwner 
    });
    
    // Check if the profile is public or the requester is the profile owner
    if (!veterinarian.is_profile_public && !isProfileOwner) {
      return res.status(403).json({ success: false, message: 'This profile is private' });
    }
    
    // Get the complete profile data
    const userDataQuery = `
      SELECT u.user_name as user_name, u.user_surname as user_surname, 
             u.user_email as user_email, u.user_profile_photo as user_profile_photo,
             v.biography, v.preferred_languages, v.veterinarian_verification_status
      FROM users u
      JOIN veterinarians v ON u.user_id = v.veterinarian_id
      WHERE u.user_id = $1
    `;
    
    const userData = await pool.query(userDataQuery, [veterinarian.veterinarian_id]);
    
    if (userData.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User data not found' });
    }
    
    // Fetch education data
    const educationQuery = `
      SELECT e.education_id, e.school_name, e.field_of_study, e.start_date, e.end_date, e.is_current
      FROM veterinarian_education e
      WHERE e.veterinarian_id = $1
      ORDER BY e.is_current DESC, e.end_date DESC, e.start_date DESC
    `;
    
    const educationData = await pool.query(educationQuery, [veterinarian.veterinarian_id]);
    
    // Fetch certification data
    const certificationQuery = `
      SELECT c.certification_id, c.certification_name, c.issuing_organization, 
             c.issue_date, c.certification_number
      FROM veterinarian_certifications c
      WHERE c.veterinarian_id = $1
      ORDER BY c.issue_date DESC
    `;
    
    const certificationData = await pool.query(certificationQuery, [veterinarian.veterinarian_id]);
    
    // Fetch expertise data
    const expertiseQuery = `
      SELECT e.expertise_id, e.expertise_area
      FROM veterinarian_expertise e
      WHERE e.veterinarian_id = $1
    `;
    
    const expertiseData = await pool.query(expertiseQuery, [veterinarian.veterinarian_id]);
    
    // Fetch photos
    const photosQuery = `
      SELECT p.veterinarian_album_photo_id, p.veterinarian_album_photo_url
      FROM veterinarian_albums p
      WHERE p.veterinarian_id = $1
    `;
    
    const photosData = await pool.query(photosQuery, [veterinarian.veterinarian_id]);
    
    // Generate slug from the user's name (for compatibility)
    const generatedSlug = `dr-${userData.rows[0].user_name.toLowerCase()}-${userData.rows[0].user_surname.toLowerCase()}`
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    
    // Return the complete profile with the slug
    const profile = {
      user_id: veterinarian.veterinarian_id,
      ...userData.rows[0],
      education: educationData.rows || [],
      certifications: certificationData.rows || [],
      expertise: expertiseData.rows || [],
      photos: photosData.rows || [],
      slug: veterinarian.slug || generatedSlug // Use the stored slug from DB, fallback to generated slug
    };
    
    return res.json({
      success: true,
      profile,
      is_private: !veterinarian.is_profile_public, 
      is_owner: isProfileOwner
    });
    
  } catch (error) {
    console.error('Error fetching veterinarian profile by slug:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check profile completion status
router.get('/profile-completion', authenticateToken, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'veterinarian') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. User is not a veterinarian.'
      });
    }

    const veterinarianId = req.user.userId;
    
    // Get profile data
    const profileQuery = `
      SELECT v.biography, v.preferred_languages
      FROM veterinarians v
      WHERE v.veterinarian_id = $1
    `;
    
    const profileResult = await pool.query(profileQuery, [veterinarianId]);
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian profile not found'
      });
    }
    
    // Check education
    const educationQuery = `
      SELECT COUNT(*) as count
      FROM veterinarian_education
      WHERE veterinarian_id = $1
    `;
    
    const educationResult = await pool.query(educationQuery, [veterinarianId]);
    
    // Check certifications
    const certificationsQuery = `
      SELECT COUNT(*) as count
      FROM veterinarian_certifications
      WHERE veterinarian_id = $1
    `;
    
    const certificationsResult = await pool.query(certificationsQuery, [veterinarianId]);
    
    // Check expertise
    const expertiseQuery = `
      SELECT COUNT(*) as count
      FROM veterinarian_expertise
      WHERE veterinarian_id = $1
    `;
    
    const expertiseResult = await pool.query(expertiseQuery, [veterinarianId]);
    
    // Check photos
    const photosQuery = `
      SELECT COUNT(*) as count
      FROM veterinarian_albums
      WHERE veterinarian_id = $1
    `;
    
    const photosResult = await pool.query(photosQuery, [veterinarianId]);
    
    // Determine what's incomplete
    const incomplete = {
      biography: !profileResult.rows[0].biography || profileResult.rows[0].biography.trim() === '',
      languages: !profileResult.rows[0].preferred_languages || profileResult.rows[0].preferred_languages.length === 0,
      education: parseInt(educationResult.rows[0].count) === 0,
      certifications: parseInt(certificationsResult.rows[0].count) === 0,
      expertise: parseInt(expertiseResult.rows[0].count) === 0,
      photos: parseInt(photosResult.rows[0].count) === 0
    };
    
    // Calculate completion percentage
    const totalFields = Object.keys(incomplete).length;
    const completedFields = Object.values(incomplete).filter(value => !value).length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    
    // Return status
    res.status(200).json({
      success: true,
      completion: {
        percentage: completionPercentage,
        incomplete: incomplete,
        isComplete: completionPercentage === 100
      }
    });
  } catch (error) {
    console.error('Error checking profile completion status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router; 