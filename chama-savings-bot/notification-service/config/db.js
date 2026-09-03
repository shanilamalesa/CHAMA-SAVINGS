// notification-service/config/db.js
const { Pool } = require('pg');

// This uses your system's .env variables to connect
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallbacks if you don't have a single DATABASE_URL string:
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
