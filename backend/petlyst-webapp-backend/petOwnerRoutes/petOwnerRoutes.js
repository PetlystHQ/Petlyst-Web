const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');

// Base route: /api/pet-owners

// Search clinics by name, type, description, location, or services
router.get('/search-clinics', async (req, res) => {
  try {
    const {
      query,              // Text search across name and description
      province,           // Filter by province
      district,           // Filter by district
      animalType,         // Filter by animal type (e.g. "Dog", "Cat")
      medicalService,     // Filter by medical service
      additionalService,  // Filter by additional service
      clinicType,         // Filter by clinic_type
      page = 1,           // Pagination support
      limit = 10          // Results per page
    } = req.query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the query dynamically
    let queryText = `
      SELECT DISTINCT c.clinic_id, c.clinic_name, c.clinic_type, c.clinic_description, 
             c.opening_time, c.closing_time, c.available_days, 
             cl.province, cl.district, cl.clinic_address, cl.latitude, cl.longitude
      FROM clinics c
      LEFT JOIN clinic_locations cl ON c.clinic_id = cl.clinic_id
    `;
    
    const queryParams = [];
    const conditions = [];
    let paramCount = 1;

    // Only include verified clinics
    conditions.push(`c.clinic_verification_status = 'verified'`);
    
    // Text search condition
    if (query) {
      conditions.push(`(
        c.clinic_name ILIKE $${paramCount} 
        OR c.clinic_description ILIKE $${paramCount}
      )`);
      queryParams.push(`%${query}%`);
      paramCount++;
    }
    
    // Province filter
    if (province) {
      conditions.push(`cl.province ILIKE $${paramCount}`);
      queryParams.push(`%${province}%`);
      paramCount++;
    }
    
    // District filter
    if (district) {
      conditions.push(`cl.district ILIKE $${paramCount}`);
      queryParams.push(`%${district}%`);
      paramCount++;
    }
    
    // Clinic type filter
    if (clinicType) {
      // Map frontend names to database enum values if needed
      const typeValue = clinicType === 'Animal Hospital' ? 'animal_hospital' : 
                       (clinicType === 'Veterinary Clinic' ? 'veterinary_clinic' : clinicType);
      conditions.push(`c.clinic_type = $${paramCount}`);
      queryParams.push(typeValue);
      paramCount++;
    }
    
    // Animal type filter
    let animalTypeJoinAdded = false;
    let medicalServiceJoinAdded = false;
    let additionalServiceJoinAdded = false;
    
    if (animalType) {
      queryText += `
        LEFT JOIN clinic_animal_types cat ON c.clinic_id = cat.clinic_id
        LEFT JOIN animal_types at ON cat.animal_type_id = at.animal_type_id
      `;
      animalTypeJoinAdded = true;
      conditions.push(`at.animal_type_name ILIKE $${paramCount}`);
      queryParams.push(`%${animalType}%`);
      paramCount++;
    }
    
    // Medical service filter
    if (medicalService) {
      if (!animalTypeJoinAdded) {
        queryText += `
          LEFT JOIN clinic_medical_services cms ON c.clinic_id = cms.clinic_id
          LEFT JOIN medical_services ms ON cms.medical_service_id = ms.medical_service_id
        `;
        medicalServiceJoinAdded = true;
      }
      conditions.push(`ms.service_name ILIKE $${paramCount}`);
      queryParams.push(`%${medicalService}%`);
      paramCount++;
    }
    
    // Additional service filter
    if (additionalService) {
      if (!animalTypeJoinAdded && !medicalServiceJoinAdded) {
        queryText += `
          LEFT JOIN clinic_additional_services cas ON c.clinic_id = cas.clinic_id
          LEFT JOIN additional_services ads ON cas.additional_service_id = ads.additional_service_id
        `;
        additionalServiceJoinAdded = true;
      }
      conditions.push(`ads.service_name ILIKE $${paramCount}`);
      queryParams.push(`%${additionalService}%`);
      paramCount++;
    }
    
    // Combine all conditions with AND
    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ordering
    queryText += ` ORDER BY c.clinic_name ASC`;
    
    // Add pagination
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    console.log('Executing SQL query:', queryText);
    console.log('With parameters:', queryParams);
    
    // Execute the main query
    const result = await pool.query(queryText, queryParams);
    
    // For count query, we need to rebuild it with the same conditions but without pagination
    let countQueryText = `
      SELECT COUNT(DISTINCT c.clinic_id) 
      FROM clinics c
      LEFT JOIN clinic_locations cl ON c.clinic_id = cl.clinic_id
    `;
    
    // Add the same joins as the main query
    if (animalTypeJoinAdded) {
      countQueryText += `
        LEFT JOIN clinic_animal_types cat ON c.clinic_id = cat.clinic_id
        LEFT JOIN animal_types at ON cat.animal_type_id = at.animal_type_id
      `;
    }
    
    if (medicalServiceJoinAdded) {
      countQueryText += `
        LEFT JOIN clinic_medical_services cms ON c.clinic_id = cms.clinic_id
        LEFT JOIN medical_services ms ON cms.medical_service_id = ms.medical_service_id
      `;
    }
    
    if (additionalServiceJoinAdded) {
      countQueryText += `
        LEFT JOIN clinic_additional_services cas ON c.clinic_id = cas.clinic_id
        LEFT JOIN additional_services ads ON cas.additional_service_id = ads.additional_service_id
      `;
    }
    
    // Add the same conditions
    if (conditions.length > 0) {
      countQueryText += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    console.log('Executing count SQL query:', countQueryText);
    
    // Ensure we're including the query parameter(s) but excluding limit/offset
    let countParams = [];
    if (conditions.length > 0) {
      // Copy all parameters except the last two (limit and offset)
      countParams = queryParams.slice(0, queryParams.length - 2);
    }
    console.log('With count parameters:', countParams);
    
    // Only pass parameters if we actually have conditions that need them
    const countResult = await pool.query(countQueryText, countParams);
    
    // Process clinic photos for each clinic
    const clinics = result.rows;
    for (const clinic of clinics) {
      try {
        // Fetch photos for this clinic
        const photosQuery = `
          SELECT clinic_album_photo_url
          FROM "clinic_albums"
          WHERE clinic_id = $1
          LIMIT 1
        `;
        const photosResult = await pool.query(photosQuery, [clinic.clinic_id]);
        clinic.photos = photosResult.rows.map(row => row.clinic_album_photo_url);
      } catch (error) {
        console.warn(`Could not fetch photos for clinic ${clinic.clinic_id}:`, error.message);
        clinic.photos = []; // Set empty photos array so the app doesn't crash
      }
      
      // Parse available_days if it's in PostgreSQL array format
      if (clinic.available_days && typeof clinic.available_days === 'string' && 
          clinic.available_days.startsWith('{') && clinic.available_days.endsWith('}')) {
        clinic.available_days = clinic.available_days
          .replace('{', '')
          .replace('}', '')
          .split(',')
          .map(val => val.trim() === 't' || val.trim() === 'true');
      }
    }
    
    res.status(200).json({
      success: true,
      clinics: clinics,
      pagination: {
        total: parseInt(countResult.rows[0].count || 0),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count || 0) / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error searching clinics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get popular animal types for search suggestions
router.get('/popular-animal-types', async (req, res) => {
  try {
    const query = `
      SELECT at.animal_type_name, COUNT(cat.clinic_id) as clinic_count
      FROM animal_types at
      JOIN clinic_animal_types cat ON at.animal_type_id = cat.animal_type_id
      JOIN clinics c ON cat.clinic_id = c.clinic_id
      WHERE c.clinic_verification_status = 'verified'
      GROUP BY at.animal_type_name
      ORDER BY clinic_count DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      animalTypes: result.rows
    });
  } catch (error) {
    console.error('Error fetching popular animal types:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get popular services for search suggestions
router.get('/popular-services', async (req, res) => {
  try {
    // Query for popular medical services
    const medicalServicesQuery = `
      SELECT ms.service_name, COUNT(cms.clinic_id) as clinic_count, 'medical' as service_type
      FROM medical_services ms
      JOIN clinic_medical_services cms ON ms.medical_service_id = cms.medical_service_id
      JOIN clinics c ON cms.clinic_id = c.clinic_id
      WHERE c.clinic_verification_status = 'verified'
      GROUP BY ms.service_name
      ORDER BY clinic_count DESC
      LIMIT 5
    `;
    
    // Query for popular additional services
    const additionalServicesQuery = `
      SELECT ads.service_name, COUNT(cas.clinic_id) as clinic_count, 'additional' as service_type
      FROM additional_services ads
      JOIN clinic_additional_services cas ON ads.additional_service_id = cas.additional_service_id
      JOIN clinics c ON cas.clinic_id = c.clinic_id
      WHERE c.clinic_verification_status = 'verified'
      GROUP BY ads.service_name
      ORDER BY clinic_count DESC
      LIMIT 5
    `;
    
    const medicalServicesResult = await pool.query(medicalServicesQuery);
    const additionalServicesResult = await pool.query(additionalServicesQuery);
    
    res.status(200).json({
      success: true,
      services: {
        medical: medicalServicesResult.rows,
        additional: additionalServicesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching popular services:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get locations (provinces and districts) for search filters
router.get('/locations', async (req, res) => {
  try {
    // Query distinct provinces
    const provincesQuery = `
      SELECT DISTINCT province 
      FROM clinic_locations
      WHERE province IS NOT NULL
      ORDER BY province
    `;
    
    // Query districts if province is specified
    const { province } = req.query;
    let districts = [];
    
    if (province) {
      const districtsQuery = `
        SELECT DISTINCT district
        FROM clinic_locations
        WHERE province = $1 AND district IS NOT NULL
        ORDER BY district
      `;
      const districtsResult = await pool.query(districtsQuery, [province]);
      districts = districtsResult.rows.map(row => row.district);
    }
    
    const provincesResult = await pool.query(provincesQuery);
    const provinces = provincesResult.rows.map(row => row.province);
    
    res.status(200).json({
      success: true,
      locations: {
        provinces,
        districts
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get clinic details by ID
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Get basic clinic info
    const clinicQuery = `
      SELECT c.*, cl.province, cl.district, cl.clinic_address, cl.latitude, cl.longitude
      FROM clinics c
      LEFT JOIN clinic_locations cl ON c.clinic_id = cl.clinic_id
      WHERE c.clinic_id = $1 AND c.clinic_verification_status = 'verified'
    `;
    
    const clinicResult = await pool.query(clinicQuery, [clinicId]);
    
    if (clinicResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or not verified'
      });
    }
    
    const clinic = clinicResult.rows[0];
    
    // Get operator details
    const operatorQuery = `
      SELECT user_name, user_surname
      FROM "users"
      WHERE user_id = $1
    `;
    
    const operatorResult = await pool.query(operatorQuery, [clinic.clinic_operator_id]);
    clinic.operator_name = operatorResult.rows[0]?.user_name;
    clinic.operator_surname = operatorResult.rows[0]?.user_surname;
    
    // Get clinic photos
    try {
      const photosQuery = `
        SELECT clinic_album_photo_url
        FROM "clinic_albums"
        WHERE clinic_id = $1
      `;
      const photosResult = await pool.query(photosQuery, [clinicId]);
      clinic.photos = photosResult.rows.map(row => row.clinic_album_photo_url);
    } catch (error) {
      console.warn(`Could not fetch photos for clinic ${clinicId}:`, error.message);
      clinic.photos = []; // Set empty photos array so the app doesn't crash
    }
    
    // Get animal types
    const animalTypesQuery = `
      SELECT at.animal_type_name 
      FROM animal_types at
      JOIN clinic_animal_types cat ON at.animal_type_id = cat.animal_type_id
      WHERE cat.clinic_id = $1
    `;
    const animalTypesResult = await pool.query(animalTypesQuery, [clinicId]);
    clinic.animal_types = animalTypesResult.rows.map(row => row.animal_type_name);
    
    // Get medical services
    const medicalServicesQuery = `
      SELECT ms.service_name
      FROM medical_services ms
      JOIN clinic_medical_services cms ON ms.medical_service_id = cms.medical_service_id
      WHERE cms.clinic_id = $1
    `;
    const medicalServicesResult = await pool.query(medicalServicesQuery, [clinicId]);
    clinic.medical_services = medicalServicesResult.rows.map(row => row.service_name);
    
    // Get additional services
    const additionalServicesQuery = `
      SELECT ads.service_name
      FROM additional_services ads
      JOIN clinic_additional_services cas ON ads.additional_service_id = cas.additional_service_id
      WHERE cas.clinic_id = $1
    `;
    const additionalServicesResult = await pool.query(additionalServicesQuery, [clinicId]);
    clinic.additional_services = additionalServicesResult.rows.map(row => row.service_name);
    
    // Get phone numbers if allowed
    if (clinic.show_phone_number) {
      const phoneQuery = `
        SELECT phone_number, phone_type
        FROM clinic_phone_numbers
        WHERE clinic_id = $1
      `;
      const phoneResult = await pool.query(phoneQuery, [clinicId]);
      clinic.phone_numbers = phoneResult.rows;
    }
    
    // Get email if allowed
    if (!clinic.show_mail_address) {
      delete clinic.clinic_email;
    }
    
    // Get social media links
    const socialMediaQuery = `
      SELECT platform, url
      FROM clinic_social_media
      WHERE clinic_id = $1
    `;
    const socialMediaResult = await pool.query(socialMediaQuery, [clinicId]);
    clinic.social_media = socialMediaResult.rows;
    
    // Parse available_days if it's in PostgreSQL array format
    if (clinic.available_days && typeof clinic.available_days === 'string' && 
        clinic.available_days.startsWith('{') && clinic.available_days.endsWith('}')) {
      clinic.available_days = clinic.available_days
        .replace('{', '')
        .replace('}', '')
        .split(',')
        .map(val => val.trim() === 't' || val.trim() === 'true');
    }
    
    // Parse emergency_available_days if it's in PostgreSQL array format
    if (clinic.emergency_available_days && typeof clinic.emergency_available_days === 'string' && 
        clinic.emergency_available_days.startsWith('{') && clinic.emergency_available_days.endsWith('}')) {
      clinic.emergency_available_days = clinic.emergency_available_days
        .replace('{', '')
        .replace('}', '')
        .split(',')
        .map(val => val.trim() === 't' || val.trim() === 'true');
    }
    
    res.status(200).json({
      success: true,
      clinic: clinic
    });
  } catch (error) {
    console.error('Error fetching clinic details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Search autocomplete suggestions
router.get('/search-suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }
    
    // Get clinic name suggestions
    const clinicQuery = `
      SELECT clinic_name AS text, 'clinic' AS type
      FROM clinics
      WHERE clinic_verification_status = 'verified'
      AND clinic_name ILIKE $1
      LIMIT 5
    `;
    
    // Get animal type suggestions
    const animalTypeQuery = `
      SELECT animal_type_name AS text, 'animal_type' AS type
      FROM animal_types
      WHERE animal_type_name ILIKE $1
      LIMIT 3
    `;
    
    // Get service suggestions
    const serviceQuery = `
    SELECT * FROM (
      SELECT service_name AS text, 'medical_service' AS type
      FROM medical_services
      WHERE service_name ILIKE $1
      LIMIT 3
    ) AS medical_services
    UNION
    SELECT * FROM (
      SELECT service_name AS text, 'additional_service' AS type
      FROM additional_services
      WHERE service_name ILIKE $1
      LIMIT 3
    ) AS additional_services
`;
    
    // Get veterinarian suggestions
    const veterinarianQuery = `
      SELECT 
        CONCAT(u.user_name, ' ', u.user_surname) AS text, 
        'veterinarian' AS type
      FROM users u
      JOIN veterinarians v ON u.user_id = v.veterinarian_id
      WHERE v.is_profile_public = true
      AND CONCAT(u.user_name, ' ', u.user_surname) ILIKE $1
      LIMIT 3
    `;
    
    const likePattern = `%${query}%`;
    
    const [clinicResults, animalTypeResults, serviceResults, veterinarianResults] = await Promise.all([
      pool.query(clinicQuery, [likePattern]),
      pool.query(animalTypeQuery, [likePattern]),
      pool.query(serviceQuery, [likePattern]),
      pool.query(veterinarianQuery, [likePattern])
    ]);
    
    // Combine all suggestions
    const suggestions = [
      ...clinicResults.rows,
      ...animalTypeResults.rows,
      ...serviceResults.rows,
      ...veterinarianResults.rows
    ];
    
    res.status(200).json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Search for veterinarians
router.get('/search-veterinarians', async (req, res) => {
  try {
    // Extract query parameters
    const {
      query,
      province,
      expertise,
      page = 1,
      limit = 10,
      veterinarian,
      veterinarianName
    } = req.query;
    
    // Convert page and limit to integers
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    
    // Calculate offset
    const offset = (pageInt - 1) * limitInt;
    
    // Base query
    let sql = `
      SELECT 
        v.veterinarian_id,
        u.user_id,
        u.user_name,
        u.user_surname,
        u.user_email,
        u.user_profile_photo,
        v.slug,
        v.biography,
        v.preferred_languages,
        ve.expertise_area,
        c.clinic_id,
        c.clinic_name,
        cl.province,
        cl.district
      FROM veterinarians v
      JOIN users u ON v.veterinarian_id = u.user_id
      LEFT JOIN veterinarian_expertise ve ON v.veterinarian_id = ve.veterinarian_id
      LEFT JOIN clinic_veterinarians cv ON v.veterinarian_id = cv.veterinarian_id
      LEFT JOIN clinics c ON cv.clinic_id = c.clinic_id
      LEFT JOIN clinic_locations cl ON c.clinic_id = cl.clinic_id
      WHERE v.is_profile_public = true
    `;
    
    const queryParams = [];
    const conditions = [];
    
    // Add query conditions
    if (query) {
      queryParams.push(`%${query}%`);
      conditions.push(`(u.user_name ILIKE $${queryParams.length} OR u.user_surname ILIKE $${queryParams.length})`);
    }
    
    // Specific veterinarian search
    if (veterinarianName) {
      queryParams.push(`%${veterinarianName}%`);
      conditions.push(`CONCAT(u.user_name, ' ', u.user_surname) ILIKE $${queryParams.length}`);
    }
    else if (veterinarian && veterinarian.toLowerCase() !== 'any') {
      queryParams.push(`%${veterinarian}%`);
      conditions.push(`CONCAT(u.user_name, ' ', u.user_surname) ILIKE $${queryParams.length}`);
    }
    
    // Filter by province
    if (province) {
      queryParams.push(`%${province}%`);
      conditions.push(`cl.province ILIKE $${queryParams.length}`);
    }
    
    // Filter by expertise
    if (expertise) {
      queryParams.push(`%${expertise}%`);
      conditions.push(`ve.expertise_area ILIKE $${queryParams.length}`);
    }
    
    // Add conditions to query
    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }
    
    // Group by to avoid duplicates
    sql += ` GROUP BY v.veterinarian_id, u.user_id, u.user_name, u.user_surname, u.user_email, u.user_profile_photo, v.slug, v.biography, v.preferred_languages, ve.expertise_area, c.clinic_id, c.clinic_name, cl.province, cl.district`;
    
    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT veterinarian_id) as total 
      FROM veterinarians
      WHERE is_profile_public = true
    `;
    
    let total = 0;
    
    // Add expertise condition separately if needed
    if (expertise) {
      countQuery = `
        SELECT COUNT(DISTINCT v.veterinarian_id) as total 
        FROM veterinarians v
        JOIN veterinarian_expertise ve ON v.veterinarian_id = ve.veterinarian_id
        WHERE v.is_profile_public = true AND ve.expertise_area ILIKE $1
      `;
      // If only expertise filter is used
      if (conditions.length === 1) {
        const countResult = await pool.query(countQuery, [`%${expertise}%`]);
        total = parseInt(countResult.rows[0]?.total || '0');
      } else {
        // Use the more complex count query with all conditions
        countQuery = `
          SELECT COUNT(DISTINCT v.veterinarian_id) as total 
          FROM veterinarians v
          JOIN users u ON v.veterinarian_id = u.user_id
          JOIN veterinarian_expertise ve ON v.veterinarian_id = ve.veterinarian_id
          LEFT JOIN clinic_veterinarians cv ON v.veterinarian_id = cv.veterinarian_id
          LEFT JOIN clinics c ON cv.clinic_id = c.clinic_id
          LEFT JOIN clinic_locations cl ON c.clinic_id = cl.clinic_id
          WHERE v.is_profile_public = true AND ${conditions.join(' AND ')}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        total = parseInt(countResult.rows[0]?.total || '0');
      }
    } else if (conditions.length > 0) {
      // Handle other conditions without expertise
      countQuery = `
        SELECT COUNT(DISTINCT v.veterinarian_id) as total 
        FROM veterinarians v
        JOIN users u ON v.veterinarian_id = u.user_id
        LEFT JOIN clinic_veterinarians cv ON v.veterinarian_id = cv.veterinarian_id
        LEFT JOIN clinics c ON cv.clinic_id = c.clinic_id
        LEFT JOIN clinic_locations cl ON c.clinic_id = cl.clinic_id
        WHERE v.is_profile_public = true AND ${conditions.join(' AND ')}
      `;
      const countResult = await pool.query(countQuery, queryParams);
      total = parseInt(countResult.rows[0]?.total || '0');
    } else {
      // Basic count query without any conditions
      const countResult = await pool.query(countQuery);
      total = parseInt(countResult.rows[0]?.total || '0');
    }
    
    // Add order by and pagination
    sql += ` ORDER BY u.user_name, u.user_surname LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limitInt, offset);
    
    // Add useful debug logging
    console.log('Executing SQL query for veterinarians:');
    console.log('SQL:', sql);
    console.log('Parameters:', queryParams);
    
    // Execute query
    const result = await pool.query(sql, queryParams);
    
    // Format results - group expertise for each veterinarian
    const veterinariansMap = new Map();
    
    result.rows.forEach(row => {
      const veterinarianId = row.veterinarian_id;
      
      if (!veterinariansMap.has(veterinarianId)) {
        veterinariansMap.set(veterinarianId, {
          veterinarian_id: row.veterinarian_id,
          user_id: row.user_id,
          user_name: row.user_name,
          user_surname: row.user_surname,
          user_email: row.user_email,
          user_profile_photo: row.user_profile_photo,
          slug: row.slug,
          biography: row.biography,
          preferred_languages: row.preferred_languages,
          clinic: row.clinic_id ? {
            clinic_id: row.clinic_id,
            clinic_name: row.clinic_name,
            province: row.province,
            district: row.district
          } : null,
          expertise: []
        });
      }
      
      // Add expertise if it exists and isn't already in the array
      if (row.expertise_area && !veterinariansMap.get(veterinarianId).expertise.includes(row.expertise_area)) {
        veterinariansMap.get(veterinarianId).expertise.push(row.expertise_area);
      }
    });
    
    // Convert map to array
    const veterinarians = Array.from(veterinariansMap.values());
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limitInt);
    
    res.status(200).json({
      success: true,
      veterinarians,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error searching veterinarians:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get veterinarian expertise areas
router.get('/veterinarian-expertise-areas', async (req, res) => {
  try {
    const query = `
      SELECT 
        ve.expertise_area,
        COUNT(DISTINCT v.veterinarian_id) as count
      FROM veterinarian_expertise ve
      JOIN veterinarians v ON ve.veterinarian_id = v.veterinarian_id
      WHERE v.is_profile_public = true
      GROUP BY ve.expertise_area
      ORDER BY count DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      expertiseAreas: result.rows
    });
  } catch (error) {
    console.error('Error fetching veterinarian expertise areas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;