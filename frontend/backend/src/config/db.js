const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'Passer@2026#',
  database: 'samalocation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
