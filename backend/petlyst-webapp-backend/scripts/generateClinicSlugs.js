/**
 * Migration script to generate slugs for existing clinics
 * 
 * Bu script, slug alanı boş olan tüm klinikler için otomatik olarak slug oluşturur.
 * Sluglar, klinik adına dayanarak oluşturulur ve benzersiz olması sağlanır.
 * 
 * Usage: node generateClinicSlugs.js
 */

const { Pool } = require('pg');
const path = require('path');
// .env dosyasını doğru yoldan yükle
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment loaded. Database configuration:');
console.log(`  DB_HOST: ${process.env.DB_HOST}`);
console.log(`  DB_NAME: ${process.env.DB_NAME}`);
console.log(`  DB_USER: ${process.env.DB_USER}`);
console.log(`  DB_PORT: ${process.env.DB_PORT}`);
console.log('-----------------------------------');

// Database connection with SSL configuration for AWS RDS
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // AWS RDS için gerekli olabilir
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Slug oluşturma fonksiyonu (clinicRoutes.js'deki ile aynı)
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

// Ana fonksiyon
async function migrateClinicSlugs() {
  const client = await pool.connect();
  
  try {
    // Başlangıç zamanı
    const startTime = new Date();
    console.log(`Slug migration started at ${startTime.toLocaleString()}`);
    
    // Slug'ı olmayan klinikleri bul
    const findClinicsQuery = `
      SELECT clinic_id, clinic_name FROM clinics 
      WHERE slug IS NULL OR slug = ''
    `;
    
    const clinicsResult = await client.query(findClinicsQuery);
    const clinics = clinicsResult.rows;
    
    console.log(`Found ${clinics.length} clinics without slugs`);
    
    // Her klinik için slug oluştur ve güncelle
    let updatedCount = 0;
    let errorCount = 0;
    
    await client.query('BEGIN');
    
    for (const clinic of clinics) {
      try {
        const slug = await generateClinicSlug(client, clinic.clinic_name);
        
        const updateQuery = `
          UPDATE clinics 
          SET slug = $1
          WHERE clinic_id = $2
        `;
        
        await client.query(updateQuery, [slug, clinic.clinic_id]);
        
        console.log(`Updated clinic ${clinic.clinic_id} (${clinic.clinic_name}) with slug: ${slug}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating clinic ${clinic.clinic_id} (${clinic.clinic_name}):`, error.message);
        errorCount++;
      }
    }
    
    await client.query('COMMIT');
    
    // Bitiş ve özet
    const endTime = new Date();
    const durationMs = endTime - startTime;
    const durationSec = durationMs / 1000;
    
    console.log(`
Slug migration completed at ${endTime.toLocaleString()}
Duration: ${durationSec.toFixed(2)} seconds
Results:
  - Total clinics processed: ${clinics.length}
  - Successfully updated: ${updatedCount}
  - Errors: ${errorCount}
    `);
    
    if (errorCount > 0) {
      console.log('Please check the logs for error details');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Script'i çalıştır
migrateClinicSlugs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 