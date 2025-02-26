const { Pool } = require('pg');
require('dotenv').config();


// DB connection requests .env credentials
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT,
    ssl: { rejectUnauthorized: false },
});

module.exports = pool; 