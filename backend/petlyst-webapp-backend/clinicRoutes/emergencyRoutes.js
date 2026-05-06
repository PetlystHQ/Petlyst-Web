const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const pool = require('../config/db'); // Doğru veritabanı bağlantı yolu

/**
 * @route   GET /api/emergency/nearest-clinic
 * @desc    Kullanıcının mevcut konumuna en yakın kliniği bul
 * @access  Public
 */
router.get('/nearest-clinic', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Latitude ve longitude parametrelerini kontrol et
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude ve longitude parametreleri gerekli'
      });
    }

    // Haversine formülünü kullanarak en yakın kliniği bul
    // Bu formül, iki konum arasındaki kuş uçuşu mesafeyi hesaplar
    const query = `
      SELECT 
        cl.location_id,
        cl.clinic_id,
        cl.province,
        cl.district,
        cl.clinic_address,
        cl.latitude,
        cl.longitude,
        c.clinic_name,
        c.clinic_operator_id,
        c.slug,
        (
          6371 * acos(
            cos(radians($1)) * 
            cos(radians(cl.latitude)) * 
            cos(radians(cl.longitude) - radians($2)) + 
            sin(radians($1)) * 
            sin(radians(cl.latitude))
          )
        ) AS distance
      FROM clinic_locations cl
      JOIN clinics c ON cl.clinic_id = c.clinic_id
      WHERE cl.latitude IS NOT NULL AND cl.longitude IS NOT NULL
      ORDER BY distance
      LIMIT 5
    `;

    const result = await pool.query(query, [latitude, longitude]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Yakında klinik bulunamadı'
      });
    }

    // En yakın klinikler için detaylı bilgiler alalım
    const detailedClinics = await Promise.all(
      result.rows.map(async (clinic) => {
        // Klinik telefon numaralarını al
        const phoneQuery = `
          SELECT phone_number, phone_type
          FROM clinic_phone_numbers
          WHERE clinic_id = $1
        `;
        const phoneResult = await pool.query(phoneQuery, [clinic.clinic_id]);
        
        // Klinik operatörünün (veteriner) bilgilerini al
        const operatorQuery = `
          SELECT 
            u.user_name, 
            u.user_surname
          FROM veterinarians v
          JOIN users u ON v.veterinarian_id = u.user_id
          WHERE v.veterinarian_id = $1
        `;
        const operatorResult = await pool.query(operatorQuery, [clinic.clinic_operator_id]);
        
        // Sonuçları birleştir
        return {
          ...clinic,
          phones: phoneResult.rows,
          operator: operatorResult.rows[0] || null
        };
      })
    );

    // En yakın 5 kliniği detaylı bilgilerle döndür
    res.json({
      success: true,
      message: 'En yakın klinikler bulundu',
      clinics: detailedClinics
    });
  } catch (error) {
    logger.error('En yakın klinik bulma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

module.exports = router;
