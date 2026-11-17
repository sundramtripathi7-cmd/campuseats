const path = require('path');
const dotenv = require('dotenv');

// Load .env file from backend directory if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  token: process.env.CAMPUSEATS_TOKEN || 'campuseats-demo-token',
  jwtSecret: process.env.JWT_SECRET || 'campuseats-super-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  rateLimit: parseInt(process.env.RATE_LIMIT, 10) || 20,
  rateWindowSeconds: parseInt(process.env.RATE_WINDOW_SECONDS, 10) || 60,
  storeBackend: (process.env.STORE_BACKEND || 'mysql').toLowerCase(),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuseats_db',
  },
  paymentsUrl: process.env.PAYMENTS_URL || 'http://127.0.0.1:8080',
};

module.exports = config;

