const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { checkVerificationStatus } = require('../middleware/verificationMiddleware');
const Clinic = require('../models/clinicModel');
const ClinicVeterinarian = require('../models/clinicVeterinarianModel');
const pool = require('../config/db');
const multer = require('multer');
// Import S3Service instance with all methods
const s3Service = require('../aws/s3Service');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// Individual methods are already destructured from the same export
const { deleteClinicPhoto } = s3Service;

// Test route for S3 uploads - accessible without authentication for testing
router.get('/test-s3-upload', async (req, res) => {
  try {
    console.log('S3 test upload route called');
    const result = await s3Service.testS3Upload();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'S3 test upload successful',
        url: result.url,
        key: result.key
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'S3 test upload failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing S3 upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing S3 upload',
      error: error.message || 'Unknown error'
    });
  }
});

// Test route for specifically testing clinic photos folder structure
router.get('/test-clinic-folder', async (req, res) => {
  try {
    console.log('Testing clinic folder upload');
    
    // Test data
    const testClinicId = '123';
    const testClinicName = 'Test Clinic';
    const testContent = Buffer.from('Test clinic photo upload ' + new Date().toISOString());
    
    // Use the actual clinic photo path function
    const s3ServiceInstance = require('../aws/s3Service');
    const folderPath = s3ServiceInstance.getClinicPhotoPath(testClinicId, testClinicName);
    const fullPath = `${folderPath}/test-${Date.now()}.txt`;
    
    console.log('Attempting to upload to path:', fullPath);
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fullPath,
      Body: testContent,
      ContentType: 'text/plain'
    };
    
    // Import s3 directly to ensure we're using the correct instance
    const { s3 } = require('../aws/s3Config');
    const result = await s3.upload(params).promise();
    
    return res.status(200).json({
      success: true,
      message: 'Test file uploaded to clinic folder structure',
      path: fullPath,
      url: result.Location,
      expectedLocation: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fullPath}`
    });
  } catch (error) {
    console.error('Error in test-clinic-folder:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing clinic folder upload',
      error: error.message || 'Unknown error'
    });
  }
});

// Test route for listing S3 bucket contents
router.get('/list-s3-contents', async (req, res) => {
  try {
    console.log('Listing S3 bucket contents');
    
    // Import s3 directly to ensure we're using the correct instance
    const { s3, s3Config } = require('../aws/s3Config');
    
    // First, list the bucket contents at the root level
    const rootResult = await s3.listObjectsV2({
      Bucket: s3Config.bucket,
      Delimiter: '/'
    }).promise();
    
    console.log('Root level prefixes:', rootResult.CommonPrefixes?.map(p => p.Prefix) || []);
    console.log('Root level objects:', rootResult.Contents?.map(c => c.Key) || []);
    
    // Then specifically check the clinic-photos directory
    const clinicPhotosResult = await s3.listObjectsV2({
      Bucket: s3Config.bucket,
      Prefix: 'clinic-photos/',
      Delimiter: '/'
    }).promise();
    
    console.log('Clinic photos prefixes:', clinicPhotosResult.CommonPrefixes?.map(p => p.Prefix) || []);
    console.log('Clinic photos objects:', clinicPhotosResult.Contents?.map(c => c.Key) || []);
    
    return res.status(200).json({
      success: true,
      message: 'S3 bucket contents listed',
      rootLevel: {
        prefixes: rootResult.CommonPrefixes?.map(p => p.Prefix) || [],
        objects: rootResult.Contents?.map(c => c.Key) || []
      },
      clinicPhotos: {
        prefixes: clinicPhotosResult.CommonPrefixes?.map(p => p.Prefix) || [],
        objects: clinicPhotosResult.Contents?.map(c => c.Key) || []
      }
    });
  } catch (error) {
    console.error('Error listing S3 contents:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listing S3 contents',
      error: error.message || 'Unknown error'
    });
  }
});

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

// Base route: /api/clinics

// Archive clinic (change status from verified to archived)
router.put('/archive/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);

    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found or you do not have permission to archive this clinic' 
      });
    }

    if (clinic.clinic_verification_status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Only verified clinics can be archived'
      });
    }

    // Update clinic status to archived
    const updatedClinic = await Clinic.updateClinic(clinicId, {
      clinic_verification_status: 'archived'
    });

    res.status(200).json({
      success: true,
      message: 'Clinic archived successfully',
      clinic: updatedClinic
    });

  } catch (error) {
    console.error('Error archiving clinic:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Restore clinic (change status from archived to verified)
router.put('/restore/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);

    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found or you do not have permission to restore this clinic' 
      });
    }

    if (clinic.clinic_verification_status !== 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Only archived clinics can be restored'
      });
    }

    // Update clinic status to verified
    const updatedClinic = await Clinic.updateClinic(clinicId, {
      clinic_verification_status: 'verified'
    });

    res.status(200).json({
      success: true,
      message: 'Clinic restored successfully',
      clinic: updatedClinic
    });

  } catch (error) {
    console.error('Error restoring clinic:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get all clinics for a veterinarian
router.get('/my-clinics', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const clinics = await Clinic.getClinicsByOperatorId(userId);
    
    res.status(200).json({
      message: "Clinics fetched successfully",
      clinics: clinics
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Handle removed draft routes explicitly
router.post('/draft', authenticateToken, (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Draft functionality has been removed.'
  });
});

router.get('/draft', authenticateToken, (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Draft functionality has been removed.'
  });
});

router.delete('/draft', authenticateToken, (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Draft functionality has been removed.'
  });
});

// Function to convert day names to a boolean array
const convertDaysToArray = (daysArray) => {
  if (!daysArray || !Array.isArray(daysArray)) {
    return [false, false, false, false, false, false, false];
  }
  
  // If array already contains boolean values, return it directly
  if (daysArray.length === 7 && daysArray.every(item => typeof item === 'boolean')) {
    return daysArray;
  }
  
  // If it's a string array, convert to lowercase for consistency
  const lowerDays = daysArray.map(day => {
    if (typeof day === 'string') {
      return day.toLowerCase();
    }
    return null; // Handle non-string values safely
  });
  
  // Map to a boolean array [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
  return [
    lowerDays.includes('monday'),
    lowerDays.includes('tuesday'),
    lowerDays.includes('wednesday'),
    lowerDays.includes('thursday'),
    lowerDays.includes('friday'),
    lowerDays.includes('saturday'),
    lowerDays.includes('sunday')
  ];
};

// Hayvan türlerini kaydet
async function saveAnimalTypes(client, clinicId, animalTypes) {
  if (!animalTypes || animalTypes.length === 0) return;
  
  for (const animalType of animalTypes) {
    // Önce animal_types tablosunda bu türün var olup olmadığını kontrol et
    let animalTypeId;
    const checkTypeQuery = 'SELECT animal_type_id FROM animal_types WHERE animal_type_name = $1';
    const typeResult = await client.query(checkTypeQuery, [animalType]);
    
    if (typeResult.rows.length > 0) {
      animalTypeId = typeResult.rows[0].animal_type_id;
    } else {
      // Tür yoksa ekle
      const insertTypeQuery = 'INSERT INTO animal_types (animal_type_name) VALUES ($1) RETURNING animal_type_id';
      const newTypeResult = await client.query(insertTypeQuery, [animalType]);
      animalTypeId = newTypeResult.rows[0].animal_type_id;
    }
    
    // Klinik-hayvan türü ilişkisini kaydet
    const linkQuery = 'INSERT INTO clinic_animal_types (clinic_id, animal_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    await client.query(linkQuery, [clinicId, animalTypeId]);
  }
}

// Medikal hizmetleri kaydet
async function saveMedicalServices(client, clinicId, medicalServices) {
  if (!medicalServices || medicalServices.length === 0) return;
  
  for (const serviceName of medicalServices) {
    // Önce medical_services tablosunda bu hizmetin var olup olmadığını kontrol et
    let serviceId;
    const checkServiceQuery = 'SELECT medical_service_id FROM medical_services WHERE service_name = $1';
    const serviceResult = await client.query(checkServiceQuery, [serviceName]);
    
    if (serviceResult.rows.length > 0) {
      serviceId = serviceResult.rows[0].medical_service_id;
    } else {
      // Hizmet yoksa ekle (kategori olmadan)
      const insertServiceQuery = 'INSERT INTO medical_services (service_name) VALUES ($1) RETURNING medical_service_id';
      const newServiceResult = await client.query(insertServiceQuery, [serviceName]);
      serviceId = newServiceResult.rows[0].medical_service_id;
    }
    
    // Klinik-medikal hizmet ilişkisini kaydet
    const linkQuery = 'INSERT INTO clinic_medical_services (clinic_id, medical_service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    await client.query(linkQuery, [clinicId, serviceId]);
  }
}

// Ek hizmetleri kaydet
async function saveAdditionalServices(client, clinicId, additionalServices) {
  if (!additionalServices || additionalServices.length === 0) return;
  
  for (const serviceName of additionalServices) {
    // Önce additional_services tablosunda bu hizmetin var olup olmadığını kontrol et
    let serviceId;
    const checkServiceQuery = 'SELECT additional_service_id FROM additional_services WHERE service_name = $1';
    const serviceResult = await client.query(checkServiceQuery, [serviceName]);
    
    if (serviceResult.rows.length > 0) {
      serviceId = serviceResult.rows[0].additional_service_id;
    } else {
      // Hizmet yoksa ekle (açıklama olmadan)
      const insertServiceQuery = 'INSERT INTO additional_services (service_name) VALUES ($1) RETURNING additional_service_id';
      const newServiceResult = await client.query(insertServiceQuery, [serviceName]);
      serviceId = newServiceResult.rows[0].additional_service_id;
    }
    
    // Klinik-ek hizmet ilişkisini kaydet
    const linkQuery = 'INSERT INTO clinic_additional_services (clinic_id, additional_service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    await client.query(linkQuery, [clinicId, serviceId]);
  }
}

// Slug oluşturma fonksiyonu
const generateClinicSlug = async (client, clinicName) => {
  // İlk slug oluşturma (klinik adından)
  let baseSlug = clinicName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Sadece harfler, rakamlar, boşluklar ve tire bırak
    .replace(/[\s_-]+/g, '-')  // Boşlukları ve alt çizgileri tireye dönüştür
    .replace(/^-+|-+$/g, '')   // Baştaki ve sondaki tireleri kaldır
    .trim();
  
  // Türkçe karakterleri İngilizce karakterlere dönüştür
  baseSlug = baseSlug
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  
  // Slug uzunluğunu sınırla
  if (baseSlug.length > 50) {
    baseSlug = baseSlug.substring(0, 50);
  }
  
  // İlk slug'ı kontrol et (çakışma var mı)
  let slug = baseSlug;
  let suffix = 1;
  
  while (true) {
    // Veritabanında slug kontrolü yap
    const checkQuery = 'SELECT clinic_id FROM clinics WHERE slug = $1';
    const result = await client.query(checkQuery, [slug]);
    
    // Eğer bu slug kullanılmıyorsa, benzersizdir
    if (result.rows.length === 0) {
      return slug;
    }
    
    // Çakışma var, suffix ekleyip tekrar dene
    slug = `${baseSlug}-${suffix}`;
    suffix++;
    
    // Sonsuz döngü olmaması için limit koy
    if (suffix > 1000) {
      throw new Error('Could not generate a unique slug after multiple attempts');
    }
  }
};

// Add a new clinic (requires verified veterinarian)
router.post('/add', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const {
      clinic_name,
      clinic_type,
      clinic_address,
      clinic_phone,
      clinic_email,
      clinic_description,
      available_days,
      emergency_available_days,
      opening_time,
      closing_time,
      establishment_date,
      show_phone_number,
      show_mail_address,
      allow_direct_messages,
      allow_online_meetings,
      province,
      district,
      social_media_links,
      is_partial_submission,
      tax_identification_number,
      veterinary_license_number,
      // Yeni alanlar
      slot_duration,
      is_open_24_7,
      // Koordinat bilgileri
      latitude,
      longitude,
      // Servis bilgilerini al
      served_animal_types,
      medical_services,
      additional_services
    } = req.body;
    
    const clinic_operator_id = req.user.userId;

    // Validate required fields - Modified to allow partial submissions
    // Not changing establishment_date validation as it's the format that comes from frontend
    // We'll parse establishment_date into year and month later for database storage
    if (is_partial_submission) {
      // For partial submissions, only require name
      if (!clinic_name) {
        return res.status(400).json({ 
          success: false,
          message: 'Clinic name is required even for partial submissions' 
        });
      }
    } else {
      // For complete submissions, validate all required fields - artık address bilgisi district ve province üzerinden kontrol ediliyor
      if (!clinic_name || !province || !district || !clinic_address || !available_days || !opening_time || !closing_time || !establishment_date) {
        return res.status(400).json({ 
          success: false,
          message: 'Required fields are missing' 
        });
      }
    }

    // Determine clinic creation status
    const clinic_creation_status = is_partial_submission ? 'incomplete' : 'complete';

    // Map frontend clinic type to database enum format
    let clinic_type_enum = 'veterinary_clinic'; // default value
    if (clinic_type) {
      clinic_type_enum = clinic_type === 'Animal Hospital' ? 'animal_hospital' : 'veterinary_clinic';
    }

    // Convert is_open_24_7 to correct format based on its value
    const is_open_24_7_value = is_open_24_7 === true ? 'Yes' : 'No';

    // Create a clinic data object with proper defaults for required fields
    const clinicData = {
      clinic_name,
      clinic_type: clinic_type_enum,
      clinic_email,
      clinic_operator_id,
      clinic_verification_status: 'pending',
      clinic_description,
      establishment_year: establishment_date ? parseInt(establishment_date.split('-')[0], 10) : null,
      establishment_month: establishment_date ? parseInt(establishment_date.split('-')[1], 10) : null,
      show_phone_number,
      show_mail_address,
      allow_direct_messages,
      allow_online_meetings,
      clinic_creation_status,
      opening_time: opening_time || (is_partial_submission ? "09:00" : null),
      closing_time: closing_time || (is_partial_submission ? "18:00" : null),
      slot_duration: slot_duration ? parseInt(slot_duration, 10) : 60, // Ensure slot_duration is a number
      is_open_24_7: is_open_24_7_value,
      available_days: available_days || (is_partial_submission ? [false, false, false, false, false, false, false] : null),
      emergency_available_days: emergency_available_days || [false, false, false, false, false, false, false],
      tax_identification_number: tax_identification_number || null,
      veterinary_license_number: veterinary_license_number || null,
      latitude: latitude || null,
      longitude: longitude || null
    };

    // Begin a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate a unique slug for the clinic
      const slug = await generateClinicSlug(client, clinic_name);
      
      // Create a new clinic
      const newClinicQuery = `
        INSERT INTO clinics (
          clinic_name, 
          clinic_type,
          clinic_email, 
          clinic_operator_id, 
          clinic_description, 
          available_days, 
          emergency_available_days, 
          opening_time, 
          closing_time,
          establishment_year,
          establishment_month,
          show_phone_number,
          show_mail_address,
          allow_direct_messages,
          allow_online_meetings,
          clinic_creation_status,
          clinic_verification_status,
          tax_identification_number,
          veterinary_license_number,
          clinic_time_slots,
          is_open_24_7,
          slug
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
        RETURNING *
      `;
      
      const clinicResult = await client.query(newClinicQuery, [
        clinicData.clinic_name,
        clinicData.clinic_type,
        clinicData.clinic_email,
        clinicData.clinic_operator_id,
        clinicData.clinic_description,
        convertDaysToArray(clinicData.available_days),
        convertDaysToArray(clinicData.emergency_available_days),
        clinicData.opening_time,
        clinicData.closing_time,
        clinicData.establishment_year,
        clinicData.establishment_month,
        clinicData.show_phone_number,
        clinicData.show_mail_address,
        clinicData.allow_direct_messages,
        clinicData.allow_online_meetings,
        clinicData.clinic_creation_status,
        clinicData.clinic_verification_status,
        clinicData.tax_identification_number,
        clinicData.veterinary_license_number,
        clinicData.slot_duration,
        clinicData.is_open_24_7,
        slug
      ]);
      
      const newClinic = clinicResult.rows[0];
      
      // Add phone numbers if provided
      if (clinic_phone && Array.isArray(clinic_phone) && clinic_phone.length > 0) {
        for (const phoneEntry of clinic_phone) {
          // Only process phone entries with valid type and number
          if (phoneEntry.number && phoneEntry.type && phoneEntry.type !== '') {
            const phoneNumberQuery = `
              INSERT INTO clinic_phone_numbers (clinic_id, phone_number, phone_type)
              VALUES ($1, $2, $3)
            `;
            await client.query(phoneNumberQuery, [
              newClinic.clinic_id,
              phoneEntry.number,
              phoneEntry.type // 'fixed_line' or 'mobile_number'
            ]);
          }
        }
      }
      
      // Add social media links if provided
      if (social_media_links && social_media_links.length > 0) {
        for (const link of social_media_links) {
          if (link.platform && link.url) {
            const socialMediaQuery = `
              INSERT INTO clinic_social_media (clinic_id, platform, url)
              VALUES ($1, $2, $3)
            `;
            await client.query(socialMediaQuery, [newClinic.clinic_id, link.platform, link.url]);
          }
        }
      }
      
      // Add location information to clinic_locations table
      if (!is_partial_submission) {
        try {
          const locationQuery = `
            INSERT INTO clinic_locations (clinic_id, province, district, clinic_address, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          
          await client.query(locationQuery, [
            newClinic.clinic_id,
            province || null,
            district || null,
            clinic_address || null,  // req.body'den doğrudan alıyoruz
            latitude || null,
            longitude || null
          ]);
          
          console.log(`Location info saved for clinic ${newClinic.clinic_id}`);
        } catch (locationError) {
          console.error('Error saving clinic location:', locationError);
          // Continue processing even if location saving fails
        }
      } else {
        // For partial submissions, only save location if we have at least minimal location data
        if (province || district || clinic_address || latitude || longitude) {
          try {
            const locationQuery = `
              INSERT INTO clinic_locations (clinic_id, province, district, clinic_address, latitude, longitude)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `;
            
            await client.query(locationQuery, [
              newClinic.clinic_id,
              province || null,
              district || null,
              clinic_address || null,
              latitude || null,
              longitude || null
            ]);
            
            console.log(`Location info saved for partial submission of clinic ${newClinic.clinic_id}`);
          } catch (locationError) {
            console.error('Error saving clinic location for partial submission:', locationError);
            // Continue processing even if location saving fails
          }
        } else {
          console.log(`Skipping location info for partial submission of clinic ${newClinic.clinic_id} (no location data provided)`);
        }
      }
      
      // Add animal types
      await saveAnimalTypes(client, newClinic.clinic_id, served_animal_types);
      
      // Add medical services
      await saveMedicalServices(client, newClinic.clinic_id, medical_services);
      
      // Add additional services
      await saveAdditionalServices(client, newClinic.clinic_id, additional_services);
      
      // Klinik yaratıcısını otomatik olarak ekle
      try {
        // Klinik oluşturan veterineri otomatik olarak ekle
        await ClinicVeterinarian.addClinicCreator(clinicData.clinic_operator_id, newClinic.clinic_id);
        console.log(`Added clinic creator for new clinic ${newClinic.clinic_id}`);
      } catch (creatorError) {
        console.error('Error adding clinic creator:', creatorError);
        // Klinik oluşturma işlemine devam et, hata olsa bile
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: "Clinic added successfully",
        clinic: newClinic
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding clinic:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single clinic details
router.get('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Get the clinic
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }
    
    // Get the operator details
    const operatorQuery = `
      SELECT user_name, user_surname, user_email
      FROM "users"
      WHERE user_id = $1
    `;
    
    const operatorResult = await pool.query(operatorQuery, [clinic.clinic_operator_id]);
    
    // Get clinic location data
    const locationQuery = `
      SELECT province, district, clinic_address, latitude, longitude
      FROM clinic_locations
      WHERE clinic_id = $1
    `;
    
    const locationResult = await pool.query(locationQuery, [clinicId]);
    const locationData = locationResult.rows.length > 0 ? locationResult.rows[0] : null;
    
    // Get animal types
    const animalTypesQuery = `
      SELECT at.animal_type_name 
      FROM animal_types at
      JOIN clinic_animal_types cat ON at.animal_type_id = cat.animal_type_id
      WHERE cat.clinic_id = $1
    `;
    const animalTypesResult = await pool.query(animalTypesQuery, [clinicId]);
    const animalTypes = animalTypesResult.rows.map(row => row.animal_type_name);
    
    // Get medical services
    const medicalServicesQuery = `
      SELECT ms.service_name
      FROM medical_services ms
      JOIN clinic_medical_services cms ON ms.medical_service_id = cms.medical_service_id
      WHERE cms.clinic_id = $1
    `;
    const medicalServicesResult = await pool.query(medicalServicesQuery, [clinicId]);
    const medicalServices = medicalServicesResult.rows.map(row => row.service_name);
    
    // Get additional services
    const additionalServicesQuery = `
      SELECT ads.service_name
      FROM additional_services ads
      JOIN clinic_additional_services cas ON ads.additional_service_id = cas.additional_service_id
      WHERE cas.clinic_id = $1
    `;
    const additionalServicesResult = await pool.query(additionalServicesQuery, [clinicId]);
    const additionalServices = additionalServicesResult.rows.map(row => row.service_name);
    
    // Merge location data with clinic data
    const clinicWithOperator = {
      ...clinic,
      operator_name: operatorResult.rows[0]?.user_name,
      operator_surname: operatorResult.rows[0]?.user_surname,
      operator_email: operatorResult.rows[0]?.user_email,
      // Add location data to the clinic object if available
      ...(locationData && {
        province: locationData.province,
        district: locationData.district,
        clinic_address: locationData.clinic_address,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }),
      // Add services data
      animal_types: animalTypes,
      medical_services: medicalServices,
      additional_services: additionalServices
    };
    
    // Include separate clinic_locations for reference
    res.status(200).json({
      message: "Clinic details fetched successfully",
      clinic: clinicWithOperator,
      clinic_locations: locationResult.rows
    });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update clinic details
router.put('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const updateData = req.body;
    const operator_id = req.user.userId;

    // Validate required field
    if (!updateData.clinic_name) {
      return res.status(400).json({ 
        success: false,
        message: 'Clinic name is required' 
      });
    }

    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);

    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to update this clinic'
      });
    }

    // Only update verification status to pending if it was verified or archived
    if (['verified', 'archived'].includes(clinic.clinic_verification_status)) {
      updateData.clinic_verification_status = 'pending';
    }
    
    // Debug log: Randevu süresi değerini kontrol et
    console.log('Clinic update received. Raw data from frontend:', {
      clinicId,
      clinic_time_slots: updateData.clinic_time_slots,
      is_open_24_7: updateData.is_open_24_7
    });
    
    // clinic_time_slots değerinin sayı olduğundan emin olalım
    if (updateData.clinic_time_slots !== undefined) {
      if (typeof updateData.clinic_time_slots === 'string') {
        updateData.clinic_time_slots = parseInt(updateData.clinic_time_slots, 10);
      }
      
      if (isNaN(updateData.clinic_time_slots)) {
        updateData.clinic_time_slots = 60; // Varsayılan değer
      }
      
      console.log('Processed clinic_time_slots value:', updateData.clinic_time_slots);
    }

    // Check if the clinic name has changed. If it has, regenerate the slug
    if (updateData.clinic_name && updateData.clinic_name !== clinic.clinic_name) {
      const client = await pool.connect();
      try {
        // Generate a new unique slug for the clinic
        const newSlug = await generateClinicSlug(client, updateData.clinic_name);
        // Add the slug to the update data
        updateData.slug = newSlug;
      } catch (error) {
        console.error('Error generating slug:', error);
        // Continue with the update even if slug generation fails
      } finally {
        client.release();
      }
    }

    // Update clinic
    const updatedClinic = await Clinic.updateClinic(clinicId, updateData);

    // Extract location-related fields from the request
    const { province, district, address, latitude, longitude } = updateData;
    
    // If any location field is updated, also update the clinic_locations table
    if (province || district || address || latitude || longitude) {
      const client = await pool.connect();
      try {
        // Check if a location record exists for this clinic
        const checkLocationQuery = {
          text: 'SELECT location_id FROM clinic_locations WHERE clinic_id = $1',
          values: [clinicId]
        };
        
        const locationResult = await client.query(checkLocationQuery);
        
        if (locationResult.rows.length > 0) {
          // Update existing location record
          const updateLocationQuery = {
            text: `
              UPDATE clinic_locations 
              SET 
                province = COALESCE($1, province),
                district = COALESCE($2, district),
                clinic_address = COALESCE($3, clinic_address),
                latitude = COALESCE($4, latitude),
                longitude = COALESCE($5, longitude)
              WHERE clinic_id = $6
              RETURNING *
            `,
            values: [
              province || null,
              district || null,
              address || null,
              latitude || null,
              longitude || null,
              clinicId
            ]
          };
          
          await client.query(updateLocationQuery);
          console.log(`Location info updated for clinic ${clinicId}`);
        } else {
          // Insert new location record
          const insertLocationQuery = {
            text: `
              INSERT INTO clinic_locations (clinic_id, province, district, clinic_address, latitude, longitude)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `,
            values: [
              clinicId,
              province || null,
              district || null,
              address || null,
              latitude || null,
              longitude || null
            ]
          };
          
          await client.query(insertLocationQuery);
          console.log(`Location info created for clinic ${clinicId}`);
        }
      } catch (locationError) {
        console.error('Error updating clinic location:', locationError);
        // Continue processing even if location update fails
      } finally {
        client.release();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Clinic updated successfully',
      clinic: updatedClinic
    });

  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete clinic
router.delete('/:clinicId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;
    
    console.log('=== CLINIC DELETION REQUESTED ===');
    console.log('Clinic ID:', clinicId);
    console.log('Operator ID:', operator_id);
    
    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic) {
      console.log('Clinic not found in database');
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to delete this clinic'
      });
    }
    
    console.log('Clinic found:', {
      id: clinic.clinic_id,
      name: clinic.clinic_name,
      operatorId: clinic.clinic_operator_id,
      status: clinic.clinic_verification_status
    });
    
    if (clinic.clinic_operator_id !== operator_id) {
      console.log('Permission denied - user is not the clinic operator');
      console.log(`Clinic operator: ${clinic.clinic_operator_id}, Request operator: ${operator_id}`);
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to delete this clinic'
      });
    }
    
    // Verify that clinic is in a pending state before deletion
    if (clinic.clinic_verification_status !== 'pending') {
      console.log(`Invalid status for deletion: ${clinic.clinic_verification_status}`);
      return res.status(400).json({
        success: false,
        message: 'Only clinics with pending status can be deleted'
      });
    }
    
    // Delete all photos from S3 bucket before deleting from database
    try {
      console.log('=== STARTING S3 DELETION ===');
      console.log('Deleting all clinic photos from S3 for clinic:', {
        clinicId,
        clinicName: clinic.clinic_name
      });
      
      // Get the folder path for verification
      const folderPath = s3Service.getClinicPhotoPath(clinicId, clinic.clinic_name);
      console.log('S3 folder path to delete:', folderPath);
      
      const deleteResult = await s3Service.deleteClinicFolder(clinicId, clinic.clinic_name);
      console.log('S3 deletion result:', deleteResult);
    } catch (s3Error) {
      console.error('=== S3 DELETION ERROR ===');
      console.error('Error details:', {
        message: s3Error.message,
        code: s3Error.code,
        stack: s3Error.stack
      });
      // We'll continue with database deletion even if S3 deletion fails
      // This ensures the clinic gets deleted even if there's an issue with S3
    }
    
    console.log('=== STARTING DATABASE DELETION ===');
    // Delete clinic and all related data from database
    await Clinic.deleteClinic(clinicId);
    console.log('=== DATABASE DELETION COMPLETED ===');
    
    res.status(200).json({
      success: true,
      message: "Clinic and all associated data deleted successfully"
    });
  } catch (error) {
    console.error('=== CLINIC DELETION ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(error.message.includes('Only clinics with') ? 400 : 500).json({ 
      success: false,
      message: error.message || 'Internal server error' 
    });
  }
});

// Upload clinic photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('===== UPLOAD PHOTO REQUEST RECEIVED =====');
    console.log('Request body:', {
      clinicId: req.body.clinicId,
      clinicName: req.body.clinicName,
      clinicType: req.body.clinicType,
      operatorId: req.user?.userId
    });
    console.log('File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer (${req.file.buffer.length} bytes)` : 'No buffer'
    } : 'No file');
    console.log('Headers:', {
      contentType: req.headers['content-type'],
      authorization: req.headers['authorization'] ? 'Bearer token exists' : 'No token'
    });
    
    const { clinicId, clinicName, clinicType } = req.body;
    const photo = req.file;
    const operator_id = req.user.userId;

    // Validate required fields
    if (!clinicId || !clinicName) {
      console.error('Missing required fields:', { clinicId, clinicName });
      return res.status(400).json({
        success: false,
        message: 'Clinic ID and name are required'
      });
    }

    // Ensure clinicId is a valid number
    const numericClinicId = parseInt(clinicId, 10);
    if (isNaN(numericClinicId)) {
      console.error('Invalid clinic ID format:', { clinicId });
      return res.status(400).json({
        success: false,
        message: 'Invalid clinic ID format. Must be a numeric value.'
      });
    }

    if (!photo) {
      console.error('No photo provided in the request');
      return res.status(400).json({
        success: false,
        message: 'No photo provided'
      });
    }

    // Check if clinic exists and belongs to the operator
    const clinic = await Clinic.getClinicById(numericClinicId);
    
    if (!clinic || clinic.clinic_operator_id !== operator_id) {
      console.error('Clinic not found or permission denied:', { 
        clinicExists: !!clinic,
        clinicOperatorId: clinic?.clinic_operator_id,
        requestOperatorId: operator_id
      });
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to upload photos'
      });
    }

    // Upload to S3
    try {
      console.log('Uploading photo:', {
        fileName: photo.originalname,
        fileSize: photo.size,
        mimeType: photo.mimetype,
        clinicId: numericClinicId,
        clinicName,
        clinicType
      });

      // Get the clinic type from database if not provided in request
      let dbClinicType = clinicType;
      if (!dbClinicType) {
        const getClinicTypeQuery = `
          SELECT clinic_type FROM clinics WHERE clinic_id = $1
        `;
        const clinicTypeResult = await pool.query(getClinicTypeQuery, [numericClinicId]);
        dbClinicType = clinicTypeResult.rows[0]?.clinic_type || 'veterinary_clinic';
      }
      
      // Convert database clinic_type to display format
      const formattedClinicType = dbClinicType === 'animal_hospital' ? 'Animal Hospital' : 'Veterinary Clinic';
      
      // S3Service'in oluşturacağı path'i önceden hesaplayalım
      const s3ServiceInstance = require('../aws/s3Service');
      const predictedFolderPath = s3ServiceInstance.getClinicPhotoPath(
        numericClinicId.toString(), 
        clinicName,
        formattedClinicType
      );
      
      console.log('PREDICTED S3 PATH:', predictedFolderPath);
      console.log('Clinic name provided:', clinicName);
      console.log('Clinic type provided/fetched:', formattedClinicType);
      console.log('Clinic name after sanitization:', clinicName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''));

      const result = await s3Service.uploadClinicPhoto(
        photo.buffer,
        photo.originalname,
        photo.mimetype,
        numericClinicId.toString(),
        clinicName,
        formattedClinicType
      );

      console.log('S3 upload successful:', result);
      
      // Ensure we have a valid URL
      if (!result.url || !result.url.startsWith('http')) {
        console.warn('S3 returned invalid URL, constructing fallback URL');
        result.url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${result.key}`;
        console.log('Using fallback URL:', result.url);
      }

      // Insert photo URL into clinicalbum table instead of clinic_photos
      const insertPhotoQuery = `
        INSERT INTO clinic_albums (clinic_id, clinic_album_photo_url, clinic_type)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      // Ensure clinic_type is in the correct enum format for the database
      // The database expects 'veterinary_clinic' or 'animal_hospital', not 'Veterinary Clinic'
      let correctClinicType = dbClinicType;
      if (typeof dbClinicType === 'string') {
        if (dbClinicType === 'Veterinary Clinic') {
          correctClinicType = 'veterinary_clinic';
        } else if (dbClinicType === 'Animal Hospital') {
          correctClinicType = 'animal_hospital';
        }
      }
      
      console.log('Saving photo with clinic_type:', {
        original: dbClinicType,
        corrected: correctClinicType
      });
      
      const dbResult = await pool.query(insertPhotoQuery, [numericClinicId, result.url, correctClinicType]);
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
    console.error('Error uploading clinic photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get clinic photos
router.get('/:clinicId/photos', authenticateToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT clinic_id, clinic_name, clinic_type
      FROM clinics 
      WHERE clinic_id = $1 AND clinic_operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to view photos'
      });
    }

    const clinic = checkResult.rows[0];
    // Convert database clinic_type to display format for S3 folder path
    const formattedClinicType = clinic.clinic_type === 'animal_hospital' ? 'Animal Hospital' : 'Veterinary Clinic';
    
    // Get photos from clinic_albums table
    let photosResult = { rows: [] };
    try {
      const getPhotosQuery = `
        SELECT clinic_album_photo_id, clinic_album_photo_url, clinic_album_photo_url_created_at
        FROM clinic_albums
        WHERE clinic_id = $1
        ORDER BY clinic_album_photo_url_created_at DESC
      `;
      
      photosResult = await pool.query(getPhotosQuery, [clinicId]);
    } catch (photoError) {
      console.warn(`Could not fetch photos for clinic ${clinicId}:`, photoError.message);
      // Continue with empty photos array
    }
    
    // Log information about the clinic and photos
    console.log('Fetching photos for clinic:', {
      clinicId: clinic.clinic_id,
      clinicName: clinic.clinic_name,
      clinicType: clinic.clinic_type,
      formattedClinicType,
      photoCount: photosResult.rows.length
    });
    
    res.status(200).json({
      success: true,
      message: 'Photos fetched successfully',
      photos: photosResult.rows
    });

  } catch (error) {
    console.error('Error fetching clinic photos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete clinic photo
router.delete('/:clinicId/photos/:photoId', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId, photoId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT clinic_id, clinic_name, clinic_type, clinic_verification_status 
      FROM clinics 
      WHERE clinic_id = $1 AND clinic_operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to delete photos',
      });
    }

    const clinic = checkResult.rows[0];
    // Convert database clinic_type to display format for S3 folder path
    const formattedClinicType = clinic.clinic_type === 'animal_hospital' ? 'Animal Hospital' : 'Veterinary Clinic';

    // Find the photo in clinic_albums
    const findPhotoQuery = `
      SELECT clinic_album_photo_id, clinic_album_photo_url 
      FROM "clinic_albums"
      WHERE clinic_album_photo_id = $1 AND clinic_id = $2
    `;
    
    const photoResult = await pool.query(findPhotoQuery, [photoId, clinicId]);

    if (photoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    const { clinic_album_photo_url } = photoResult.rows[0];

    // Parse the S3 URL to get the key
    const s3Key = clinic_album_photo_url.split('.amazonaws.com/')[1];
    
    console.log('Deleting photo:', {
      photoId,
      clinicId,
      clinicName: clinic.clinic_name,
      clinicType: clinic.clinic_type,
      formattedClinicType,
      s3Key
    });

    // Delete from S3
    try {
      await deleteClinicPhoto(s3Key);

      // Delete the record from the database
      const deletePhotoQuery = `
        DELETE FROM clinic_albums 
        WHERE clinic_album_photo_id = $1
      `;
      await pool.query(deletePhotoQuery, [photoId]);

      // Update verification status to pending if it was verified or archived
      if (['verified', 'archived'].includes(clinic.clinic_verification_status)) {
        const updateQuery = `
          UPDATE clinics 
          SET clinic_verification_status = 'pending'
          WHERE clinic_id = $1 AND clinic_operator_id = $2
        `;
        await pool.query(updateQuery, [clinicId, operator_id]);
      }

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
    console.error('Error deleting clinic photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Get incomplete clinics for a veterinarian
router.get('/incomplete', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const incompleteClinicsQuery = `
      SELECT clinic_id, clinic_name, clinic_creation_status, clinic_created_at
      FROM clinics
      WHERE clinic_operator_id = $1 
      AND clinic_creation_status = 'incomplete'
      ORDER BY clinic_created_at DESC
    `;
    
    const result = await pool.query(incompleteClinicsQuery, [userId]);
    
    res.status(200).json({
      success: true,
      message: "Incomplete clinics fetched successfully",
      clinics: result.rows
    });
  } catch (error) {
    console.error('Error fetching incomplete clinics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get clinic services (animal types, medical services, additional services)
router.get('/:clinicId/services', authenticateToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const operator_id = req.user.userId;

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT clinic_id FROM clinics 
      WHERE clinic_id = $1 AND clinic_operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to view services'
      });
    }

    // Get animal types
    const animalTypesQuery = `
      SELECT at.animal_type_name 
      FROM animal_types at
      JOIN clinic_animal_types cat ON at.animal_type_id = cat.animal_type_id
      WHERE cat.clinic_id = $1
    `;
    const animalTypesResult = await pool.query(animalTypesQuery, [clinicId]);
    const animalTypes = animalTypesResult.rows.map(row => row.animal_type_name);

    // Get medical services
    const medicalServicesQuery = `
      SELECT ms.service_name 
      FROM medical_services ms
      JOIN clinic_medical_services cms ON ms.medical_service_id = cms.medical_service_id
      WHERE cms.clinic_id = $1
    `;
    const medicalServicesResult = await pool.query(medicalServicesQuery, [clinicId]);
    const medicalServices = medicalServicesResult.rows.map(row => row.service_name);

    // Get additional services
    const additionalServicesQuery = `
      SELECT ads.service_name 
      FROM additional_services ads
      JOIN clinic_additional_services cas ON ads.additional_service_id = cas.additional_service_id
      WHERE cas.clinic_id = $1
    `;
    const additionalServicesResult = await pool.query(additionalServicesQuery, [clinicId]);
    const additionalServices = additionalServicesResult.rows.map(row => row.service_name);

    // Get all available animal types from the database
    const allAnimalTypesQuery = `SELECT animal_type_name FROM animal_types ORDER BY animal_type_name`;
    const allAnimalTypesResult = await pool.query(allAnimalTypesQuery);
    const allAnimalTypes = allAnimalTypesResult.rows.map(row => row.animal_type_name);

    // Get all available medical services from the database
    const allMedicalServicesQuery = `SELECT service_name FROM medical_services ORDER BY service_name`;
    const allMedicalServicesResult = await pool.query(allMedicalServicesQuery);
    const allMedicalServices = allMedicalServicesResult.rows.map(row => row.service_name);

    // Get all available additional services from the database
    const allAdditionalServicesQuery = `SELECT service_name FROM additional_services ORDER BY service_name`;
    const allAdditionalServicesResult = await pool.query(allAdditionalServicesQuery);
    const allAdditionalServices = allAdditionalServicesResult.rows.map(row => row.service_name);

    res.status(200).json({
      success: true,
      message: 'Services fetched successfully',
      services: {
        animalTypes: animalTypes,
        medicalServices: medicalServices,
        additionalServices: additionalServices
      },
      availableOptions: {
        animalTypes: allAnimalTypes,
        medicalServices: allMedicalServices,
        additionalServices: allAdditionalServices
      }
    });
  } catch (error) {
    console.error('Error fetching clinic services:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update clinic services
router.put('/:clinicId/services', authenticateToken, checkVerificationStatus, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { clinicId } = req.params;
    const { animalTypes, medicalServices, additionalServices } = req.body;
    const operator_id = req.user.userId;

    // Validate required fields
    if (!animalTypes || !medicalServices || !additionalServices) {
      return res.status(400).json({
        success: false,
        message: 'Animal types, medical services, and additional services are required'
      });
    }

    // Ensure each category has at least one item
    if (animalTypes.length === 0 || medicalServices.length === 0 || additionalServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Each service category must have at least one item'
      });
    }

    // Check if clinic exists and belongs to the operator
    const checkQuery = `
      SELECT clinic_id, clinic_verification_status 
      FROM clinics 
      WHERE clinic_id = $1 AND clinic_operator_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [clinicId, operator_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or you do not have permission to update services'
      });
    }

    await client.query('BEGIN');

    // Delete existing animal types
    await client.query('DELETE FROM clinic_animal_types WHERE clinic_id = $1', [clinicId]);
    
    // Delete existing medical services
    await client.query('DELETE FROM clinic_medical_services WHERE clinic_id = $1', [clinicId]);
    
    // Delete existing additional services
    await client.query('DELETE FROM clinic_additional_services WHERE clinic_id = $1', [clinicId]);

    // Save new animal types
    await saveAnimalTypes(client, clinicId, animalTypes);
    
    // Save new medical services
    await saveMedicalServices(client, clinicId, medicalServices);
    
    // Save new additional services
    await saveAdditionalServices(client, clinicId, additionalServices);

    // Update clinic verification status to pending if it was verified or archived
    const clinic = checkResult.rows[0];
    if (['verified', 'archived'].includes(clinic.clinic_verification_status)) {
      const updateQuery = `
        UPDATE clinics 
        SET clinic_verification_status = 'pending'
        WHERE clinic_id = $1 AND clinic_operator_id = $2
      `;
      await client.query(updateQuery, [clinicId, operator_id]);
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Clinic services updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating clinic services:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
});

// Kliniğe bağlı veterinerleri listeler
router.get('/:clinicId/veterinarians', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { status } = req.query;
    const operatorId = req.user.userId;
    
    // Yetkilendirme: Sadece klinik sahibi görebilir
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic || clinic.clinic_operator_id !== operatorId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kliniğin veterinerlerini görüntüleme yetkiniz yok'
      });
    }
    
    const veterinarians = await ClinicVeterinarian.getClinicVeterinarians(clinicId, status);
    
    res.status(200).json({
      success: true,
      veterinarians
    });
  } catch (error) {
    console.error('Error getting clinic veterinarians:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Veteriner isteğini onaylama/reddetme
router.put('/:clinicId/veterinarian/:id/status', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId, id } = req.params;
    const { status } = req.body;
    const operatorId = req.user.userId;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri. "approved" veya "rejected" olmalıdır.'
      });
    }
    
    // Yetkilendirme: Sadece klinik sahibi işlem yapabilir
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic || clinic.clinic_operator_id !== operatorId) {
      return res.status(403).json({
        success: false,
        message: 'Bu klinikte veteriner taleplerini yönetme yetkiniz yok'
      });
    }
    
    const result = await ClinicVeterinarian.updateRequestStatus(id, status);
    
    res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Veteriner talebi onaylandı' : 'Veteriner talebi reddedildi',
      veterinarianRequest: result
    });
  } catch (error) {
    console.error('Error updating veterinarian request:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Veterineri klinikten çıkarma (Klinik tarafından)
router.delete('/:clinicId/veterinarian/:id', authenticateToken, checkVerificationStatus, async (req, res) => {
  try {
    const { clinicId, id } = req.params;
    const operatorId = req.user.userId;
    
    // Yetkilendirme: Sadece klinik sahibi işlem yapabilir
    const clinic = await Clinic.getClinicById(clinicId);
    
    if (!clinic || clinic.clinic_operator_id !== operatorId) {
      return res.status(403).json({
        success: false,
        message: 'Bu klinikte veteriner çıkarma yetkiniz yok'
      });
    }
    
    // Klinik yaratıcısı silinemez kontrolü
    const requestDetails = await pool.query(
      'SELECT id, is_clinic_creator FROM clinic_veterinarians WHERE id = $1',
      [id]
    );
    
    if (requestDetails.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Veteriner bulunamadı'
      });
    }
    
    if (requestDetails.rows[0].is_clinic_creator) {
      return res.status(400).json({
        success: false,
        message: 'Klinik sahibi klinikten çıkarılamaz'
      });
    }
    
    await ClinicVeterinarian.removeVeterinarianFromClinic(id);
    
    res.status(200).json({
      success: true,
      message: 'Veteriner klinikten başarıyla çıkarıldı'
    });
  } catch (error) {
    console.error('Error removing veterinarian from clinic:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get clinic by slug (authenticated route)
router.get('/by-slug/:slug', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ 
        success: false,
        message: 'Slug is required' 
      });
    }
    
    // Query to get clinic by slug
    const query = {
      text: 'SELECT * FROM clinics WHERE slug = $1',
      values: [slug]
    };
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found' 
      });
    }
    
    const clinic = result.rows[0];
    
    // Get additional clinic data like location, services, etc.
    // Get clinic location data
    const locationQuery = {
      text: `
        SELECT province, district, clinic_address, latitude, longitude
        FROM clinic_locations
        WHERE clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const locationResult = await pool.query(locationQuery);
    const locationData = locationResult.rows.length > 0 ? locationResult.rows[0] : null;
    
    // Get animal types
    const animalTypesQuery = {
      text: `
        SELECT at.animal_type_name 
        FROM animal_types at
        JOIN clinic_animal_types cat ON at.animal_type_id = cat.animal_type_id
        WHERE cat.clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const animalTypesResult = await pool.query(animalTypesQuery);
    const animalTypes = animalTypesResult.rows.map(row => row.animal_type_name);
    
    // Get medical services
    const medicalServicesQuery = {
      text: `
        SELECT ms.service_name
        FROM medical_services ms
        JOIN clinic_medical_services cms ON ms.medical_service_id = cms.medical_service_id
        WHERE cms.clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const medicalServicesResult = await pool.query(medicalServicesQuery);
    const medicalServices = medicalServicesResult.rows.map(row => row.service_name);
    
    // Get additional services
    const additionalServicesQuery = {
      text: `
        SELECT ads.service_name
        FROM additional_services ads
        JOIN clinic_additional_services cas ON ads.additional_service_id = cas.additional_service_id
        WHERE cas.clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const additionalServicesResult = await pool.query(additionalServicesQuery);
    const additionalServices = additionalServicesResult.rows.map(row => row.service_name);
    
    // Get operator details
    const operatorQuery = {
      text: `
        SELECT user_name, user_surname, user_email
        FROM users
        WHERE user_id = $1
      `,
      values: [clinic.clinic_operator_id]
    };
    
    const operatorResult = await pool.query(operatorQuery);
    
    // Build complete clinic data
    const completeClinicData = {
      ...clinic,
      operator_name: operatorResult.rows[0]?.user_name || null,
      operator_surname: operatorResult.rows[0]?.user_surname || null,
      operator_email: operatorResult.rows[0]?.user_email || null,
      // Add location data
      ...(locationData && {
        province: locationData.province,
        district: locationData.district,
        clinic_address: locationData.clinic_address,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }),
      // Add services data
      animal_types: animalTypes,
      medical_services: medicalServices,
      additional_services: additionalServices
    };
    
    res.status(200).json({
      success: true,
      clinic: completeClinicData
    });
  } catch (error) {
    console.error('Error fetching clinic by slug:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get clinic by slug (public route, no authentication required)
router.get('/public/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ 
        success: false,
        message: 'Slug is required' 
      });
    }
    
    // Query to get clinic by slug (only verified clinics for public access)
    const query = {
      text: 'SELECT * FROM clinics WHERE slug = $1 AND clinic_verification_status = $2',
      values: [slug, 'verified']
    };
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Clinic not found' 
      });
    }
    
    const clinic = result.rows[0];
    
    // Get clinic location data
    const locationQuery = {
      text: `
        SELECT province, district, clinic_address, latitude, longitude
        FROM clinic_locations
        WHERE clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const locationResult = await pool.query(locationQuery);
    const locationData = locationResult.rows.length > 0 ? locationResult.rows[0] : null;
    
    // Get animal types
    const animalTypesQuery = {
      text: `
        SELECT at.animal_type_name 
        FROM animal_types at
        JOIN clinic_animal_types cat ON at.animal_type_id = cat.animal_type_id
        WHERE cat.clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const animalTypesResult = await pool.query(animalTypesQuery);
    const animalTypes = animalTypesResult.rows.map(row => row.animal_type_name);
    
    // Get medical services
    const medicalServicesQuery = {
      text: `
        SELECT ms.service_name
        FROM medical_services ms
        JOIN clinic_medical_services cms ON ms.medical_service_id = cms.medical_service_id
        WHERE cms.clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const medicalServicesResult = await pool.query(medicalServicesQuery);
    const medicalServices = medicalServicesResult.rows.map(row => row.service_name);
    
    // Get additional services
    const additionalServicesQuery = {
      text: `
        SELECT ads.service_name
        FROM additional_services ads
        JOIN clinic_additional_services cas ON ads.additional_service_id = cas.additional_service_id
        WHERE cas.clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const additionalServicesResult = await pool.query(additionalServicesQuery);
    const additionalServices = additionalServicesResult.rows.map(row => row.service_name);
    
    // Build public clinic data (excluding sensitive information)
    const publicClinicData = {
      clinic_id: clinic.clinic_id,
      clinic_name: clinic.clinic_name,
      clinic_description: clinic.clinic_description,
      clinic_type: clinic.clinic_type,
      opening_time: clinic.opening_time,
      closing_time: clinic.closing_time,
      establishment_year: clinic.establishment_year,
      establishment_month: clinic.establishment_month,
      available_days: clinic.available_days,
      emergency_available_days: clinic.emergency_available_days,
      clinic_time_slots: clinic.clinic_time_slots,
      is_open_24_7: clinic.is_open_24_7,
      slug: clinic.slug,
      // Add location data if settings allow
      ...(locationData && {
        province: locationData.province,
        district: locationData.district,
        clinic_address: locationData.clinic_address,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }),
      // Add services data
      animal_types: animalTypes,
      medical_services: medicalServices,
      additional_services: additionalServices,
      // Conditionally include contact information based on clinic settings
      ...(clinic.show_mail_address && { clinic_email: clinic.clinic_email })
    };
    
    // Include phone numbers if clinic allows
    if (clinic.show_phone_number) {
      const phoneNumbersQuery = {
        text: `
          SELECT phone_number, phone_type
          FROM clinic_phone_numbers
          WHERE clinic_id = $1
        `,
        values: [clinic.clinic_id]
      };
      
      const phoneNumbersResult = await pool.query(phoneNumbersQuery);
      publicClinicData.phone_numbers = phoneNumbersResult.rows;
    }
    
    // Get social media links
    const socialMediaQuery = {
      text: `
        SELECT platform, url
        FROM clinic_social_media
        WHERE clinic_id = $1
      `,
      values: [clinic.clinic_id]
    };
    
    const socialMediaResult = await pool.query(socialMediaQuery);
    publicClinicData.social_media = socialMediaResult.rows;
    
    res.status(200).json({
      success: true,
      clinic: publicClinicData
    });
  } catch (error) {
    console.error('Error fetching public clinic by slug:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;