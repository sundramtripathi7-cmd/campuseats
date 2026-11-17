const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;
let isConnected = false;
let initAttempted = false;

async function getPool() {
  if (pool) return pool;

  // If memory backend requested or test environment without explicit DB, return null
  if (config.storeBackend === 'memory' || process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Test connectivity
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`[DB] Connected successfully to MySQL database "${config.db.database}" at ${config.db.host}:${config.db.port}`);
    return pool;
  } catch (error) {
    console.warn(`[DB] Warning: MySQL connection failed (${error.message}). Falling back to in-memory store.`);
    if (pool) {
      try { await pool.end(); } catch (e) {}
    }
    pool = null;
    isConnected = false;
    return null;
  }
}

async function initDatabase() {
  if (initAttempted) return isConnected;
  initAttempted = true;

  const currentPool = await getPool();
  if (!currentPool) return false;

  try {
    // Create menu_items table if not exists (matching Assignment 5 schema)
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        available BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // Create users table for Identity Service if not exists
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table if not exists
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        items JSON NOT NULL,
        address VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table if not exists
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        card_token VARCHAR(100) NOT NULL,
        amount INT NOT NULL,
        currency VARCHAR(10) NOT NULL,
        status VARCHAR(50) NOT NULL,
        txn_id VARCHAR(100),
        idempotency_key VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[DB] Database tables initialized and verified.');
    return true;
  } catch (err) {
    console.error('[DB] Error initializing database tables:', err.message);
    return false;
  }
}

function isUsingMySQL() {
  return isConnected && pool !== null;
}

module.exports = {
  getPool,
  initDatabase,
  isUsingMySQL,
};

