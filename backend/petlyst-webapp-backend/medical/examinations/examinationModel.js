// examinationModel.js
const pool = require('../../db');
const { v4: uuidv4 } = require('uuid');

const examinationModel = {
  /**
   * Yeni bir muayene oluşturur
   * @param {Object} examinationData - Muayene verileri
   * @returns {Promise<Object>} Oluşturulan muayene
   */
  async createExamination(examinationData) {
    try {
      const {
        pet_id,
        vet_id,
        appointment_id,
        status = 'started',
        temperature,
        heart_rate,
        respiratory_rate,
        weight,
        notes
      } = examinationData;

      const query = `
        INSERT INTO examinations (
          pet_id, vet_id, status, temperature, heart_rate, 
          respiratory_rate, weight, notes, appointment_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        pet_id, 
        vet_id, 
        status, 
        temperature || null, 
        heart_rate || null, 
        respiratory_rate || null, 
        weight || null, 
        notes || null,
        appointment_id || null
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating examination:', error);
      throw error;
    }
  },

  /**
   * ID'ye göre muayene getirir
   * @param {number} examinationId - Muayene ID
   * @returns {Promise<Object>} Muayene detayları
   */
  async getExamination(examinationId) {
    try {
      const query = `
        SELECT e.*, 
               p.pet_name, p.pet_type, p.pet_breed, p.pet_gender,
               u.user_name as vet_name, u.user_surname as vet_surname,
               o.user_name as owner_name, o.user_surname as owner_surname
        FROM examinations e
        JOIN pets p ON e.pet_id = p.pet_id
        JOIN veterinarians v ON e.vet_id = v.veterinarian_id
        JOIN users u ON v.user_id = u.user_id
        JOIN users o ON p.user_id = o.user_id
        WHERE e.examination_id = $1
      `;
      
      const result = await pool.query(query, [examinationId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching examination:', error);
      throw error;
    }
  },

  /**
   * Muayene listesi getirir
   * @param {Object} filters - Filtreler (pet_id, vet_id, status)
   * @param {number} limit - Sayfa başına kayıt sayısı
   * @param {number} offset - Atlanacak kayıt sayısı
   * @returns {Promise<Array>} Muayene listesi
   */
  async listExaminations(filters = {}, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT e.*, 
               p.pet_name, p.pet_type, p.pet_breed,
               u.user_name as vet_name, u.user_surname as vet_surname
        FROM examinations e
        JOIN pets p ON e.pet_id = p.pet_id
        JOIN veterinarians v ON e.vet_id = v.veterinarian_id
        JOIN users u ON v.user_id = u.user_id
        WHERE 1=1
      `;
      
      const values = [];
      let paramCount = 1;
      
      if (filters.pet_id) {
        query += ` AND e.pet_id = $${paramCount}`;
        values.push(filters.pet_id);
        paramCount++;
      }
      
      if (filters.vet_id) {
        query += ` AND e.vet_id = $${paramCount}`;
        values.push(filters.vet_id);
        paramCount++;
      }
      
      if (filters.status) {
        query += ` AND e.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
      }

      if (filters.clinic_id) {
        query += ` AND v.clinic_id = $${paramCount}`;
        values.push(filters.clinic_id);
        paramCount++;
      }
      
      // Tarih aralığı filtresi
      if (filters.start_date && filters.end_date) {
        query += ` AND e.examination_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
        values.push(filters.start_date, filters.end_date);
        paramCount += 2;
      }
      
      query += ` ORDER BY e.examination_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);
      
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error listing examinations:', error);
      throw error;
    }
  },

  /**
   * Muayene bilgilerini günceller
   * @param {number} examinationId - Muayene ID
   * @param {Object} updateData - Güncellenecek veriler
   * @returns {Promise<Object>} Güncellenmiş muayene
   */
  async updateExamination(examinationId, updateData) {
    try {
      const {
        status,
        temperature,
        heart_rate,
        respiratory_rate,
        weight,
        notes
      } = updateData;

      let query = 'UPDATE examinations SET updated_at = CURRENT_TIMESTAMP';
      const values = [];
      let paramCount = 1;

      if (status !== undefined) {
        query += `, status = $${paramCount}`;
        values.push(status);
        paramCount++;
      }

      if (temperature !== undefined) {
        query += `, temperature = $${paramCount}`;
        values.push(temperature);
        paramCount++;
      }

      if (heart_rate !== undefined) {
        query += `, heart_rate = $${paramCount}`;
        values.push(heart_rate);
        paramCount++;
      }

      if (respiratory_rate !== undefined) {
        query += `, respiratory_rate = $${paramCount}`;
        values.push(respiratory_rate);
        paramCount++;
      }

      if (weight !== undefined) {
        query += `, weight = $${paramCount}`;
        values.push(weight);
        paramCount++;
      }

      if (notes !== undefined) {
        query += `, notes = $${paramCount}`;
        values.push(notes);
        paramCount++;
      }

      query += ` WHERE examination_id = $${paramCount} RETURNING *`;
      values.push(examinationId);

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating examination:', error);
      throw error;
    }
  },

  /**
   * Sadece muayene durumunu günceller
   * @param {number} examinationId - Muayene ID
   * @param {string} status - Yeni durum
   * @returns {Promise<Object>} Güncellenmiş muayene
   */
  async updateExaminationStatus(examinationId, status) {
    try {
      const query = `
        UPDATE examinations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE examination_id = $2 
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, examinationId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating examination status:', error);
      throw error;
    }
  },

  /**
   * Belirli bir hayvanın muayene geçmişini getirir
   * @param {number} petId - Hayvan ID
   * @returns {Promise<Array>} Muayene geçmişi
   */
  async getPetExaminationHistory(petId) {
    try {
      const query = `
        SELECT e.*, 
               u.user_name as vet_name, u.user_surname as vet_surname
        FROM examinations e
        JOIN veterinarians v ON e.vet_id = v.veterinarian_id
        JOIN users u ON v.user_id = u.user_id
        WHERE e.pet_id = $1
        ORDER BY e.examination_date DESC
      `;
      
      const result = await pool.query(query, [petId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching pet examination history:', error);
      throw error;
    }
  }
};

module.exports = examinationModel;