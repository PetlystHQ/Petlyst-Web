const pool = require('../config/db');

class ClinicVeterinarian {
  // Veterinerin kliniğe katılma isteği göndermesi
  static async requestToJoinClinic(veterinarianId, clinicId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Veterinerin zaten bir klinikte çalışıp çalışmadığını kontrol et
      const checkExistingQuery = `
        SELECT id, status FROM clinic_veterinarians 
        WHERE veterinarian_id = $1
      `;
      const existingResult = await client.query(checkExistingQuery, [veterinarianId]);
      
      // Eğer bir ilişki varsa ve status 'rejected' değilse, işlemi reddet
      if (existingResult.rows.length > 0 && existingResult.rows[0].status !== 'rejected') {
        throw new Error('Veteriner zaten bir klinikte çalışıyor veya bekleyen bir isteği var');
      }
      
      // Eğer reddedilmiş bir istek varsa, güncelle
      if (existingResult.rows.length > 0 && existingResult.rows[0].status === 'rejected') {
        const updateQuery = `
          UPDATE clinic_veterinarians
          SET clinic_id = $1, status = 'pending', updated_at = CURRENT_TIMESTAMP
          WHERE veterinarian_id = $2
          RETURNING *
        `;
        const result = await client.query(updateQuery, [clinicId, veterinarianId]);
        await client.query('COMMIT');
        return result.rows[0];
      }
      
      // Yeni istek oluştur
      const insertQuery = `
        INSERT INTO clinic_veterinarians (
          clinic_id, veterinarian_id, status, is_clinic_creator, created_at, updated_at
        ) VALUES ($1, $2, 'pending', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const result = await client.query(insertQuery, [clinicId, veterinarianId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Klinik oluşturulduğunda veteriner otomatik olarak eklenecek
  static async addClinicCreator(veterinarianId, clinicId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertQuery = `
        INSERT INTO clinic_veterinarians (
          clinic_id, veterinarian_id, status, is_clinic_creator, created_at, updated_at
        ) VALUES ($1, $2, 'approved', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const result = await client.query(insertQuery, [clinicId, veterinarianId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Kliniğe bağlı veterinerleri listelemek için
  static async getClinicVeterinarians(clinicId, status = null) {
    let query = `
      SELECT cv.id, cv.clinic_id, cv.veterinarian_id, cv.status, cv.is_clinic_creator, 
             cv.created_at, cv.updated_at, v.slug, u.user_name, u.user_surname, u.user_email
      FROM clinic_veterinarians cv
      JOIN veterinarians v ON cv.veterinarian_id = v.veterinarian_id
      JOIN users u ON v.veterinarian_id = u.user_id
      WHERE cv.clinic_id = $1
    `;
    
    const queryParams = [clinicId];
    
    if (status) {
      query += ` AND cv.status = $2`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY cv.is_clinic_creator DESC, cv.created_at DESC`;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  }
  
  // Veterinerin gönderdiği istekleri görüntülemesi
  static async getVeterinarianRequests(veterinarianId) {
    const query = `
      SELECT cv.id, cv.clinic_id, cv.veterinarian_id, cv.status, cv.is_clinic_creator, 
             cv.created_at, cv.updated_at, c.clinic_name
      FROM clinic_veterinarians cv
      JOIN clinics c ON cv.clinic_id = c.clinic_id
      WHERE cv.veterinarian_id = $1
      ORDER BY cv.created_at DESC
    `;
    
    const result = await pool.query(query, [veterinarianId]);
    return result.rows;
  }
  
  // İsteğin onaylanması/reddedilmesi
  static async updateRequestStatus(id, status) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('Geçersiz durum değeri');
    }
    
    const query = `
      UPDATE clinic_veterinarians
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      throw new Error('İstek bulunamadı');
    }
    
    return result.rows[0];
  }
  
  // İlişkinin sonlandırılması (Klinik veya Veteriner tarafından)
  static async removeVeterinarianFromClinic(id) {
    const query = `
      DELETE FROM clinic_veterinarians
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('İlişki bulunamadı');
    }
    
    return { message: 'İlişki başarıyla silindi' };
  }
  
  // Veterinerin çalıştığı kliniği bulmak için
  static async getVeterinarianClinic(veterinarianId) {
    const query = `
      SELECT cv.id, cv.clinic_id, cv.veterinarian_id, cv.status, cv.is_clinic_creator, 
             cv.created_at, cv.updated_at, c.clinic_name, c.clinic_verification_status
      FROM clinic_veterinarians cv
      JOIN clinics c ON cv.clinic_id = c.clinic_id
      WHERE cv.veterinarian_id = $1 AND cv.status = 'approved'
    `;
    
    const result = await pool.query(query, [veterinarianId]);
    return result.rows[0] || null;
  }
  
  // Mevcut klinikler için creatorları ekleme (migration script)
  static async migrateExistingClinics() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Tüm klinikleri ve operatör ID'lerini al
      const getClinicsQuery = `
        SELECT clinic_id, clinic_operator_id 
        FROM clinics
      `;
      
      const clinicsResult = await client.query(getClinicsQuery);
      
      for (const clinic of clinicsResult.rows) {
        // Her klinik için, klinik creator kaydı oluştur
        const checkExistingQuery = `
          SELECT id FROM clinic_veterinarians
          WHERE clinic_id = $1 AND veterinarian_id = $2
        `;
        
        const existingResult = await client.query(checkExistingQuery, [
          clinic.clinic_id, clinic.clinic_operator_id
        ]);
        
        // Eğer kayıt yoksa oluştur
        if (existingResult.rows.length === 0) {
          const insertQuery = `
            INSERT INTO clinic_veterinarians (
              clinic_id, veterinarian_id, status, is_clinic_creator, created_at, updated_at
            ) VALUES ($1, $2, 'approved', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;
          
          await client.query(insertQuery, [clinic.clinic_id, clinic.clinic_operator_id]);
          console.log(`Added clinic creator for clinic ${clinic.clinic_id}`);
        }
      }
      
      await client.query('COMMIT');
      return { message: 'Migration completed successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ClinicVeterinarian; 