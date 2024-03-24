const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.MARIA_HOST,
  user: process.env.MARIA_USER,
  password: process.env.MARIA_PW,
  database: process.env.MARIA_DB,
  connectTimeout : 10000,
  multipleStatements: true,
  connectionLimit: 100,
  waitForConnections: true,
  debug: false,
  charset: 'utf8mb4',
});

module.exports = pool;