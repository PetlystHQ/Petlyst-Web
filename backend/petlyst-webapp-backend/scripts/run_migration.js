const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../config/logger');

// Use the database configuration from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'petlyst',
});

async function runMigration() {
  try {
    logger.info('Running database migration...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/update_tc_number_column.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    logger.info('Migration completed successfully!');
  } catch (error) {
    logger.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 