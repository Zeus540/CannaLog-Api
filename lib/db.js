const { createPool } = require('mysql')

const db = createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 20000,
    timezone: 'SAST',
    charset:'utf8mb4'
  });

module.exports = db