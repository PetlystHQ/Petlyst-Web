const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const pool = require('../config/db');

router.post('/upload-clinic-photo', async (req, res) => {
  try {
    const { url, clinicId } = req.body;

    const query = `
      INSERT INTO clinic_photos (clinic_id, s3_url)
      VALUES ($1::integer, $2::varchar)
      RETURNING *
    `;
    
    await pool.query(query, [clinicId, url]);

    res.status(200).json({
      success: true,
      message: 'Photo URL saved successfully'
    });

  } catch (error) {
    logger.error('Error saving photo URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save photo URL'
    });
  }
});

module.exports = router;
