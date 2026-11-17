const path = require('path');
const express = require('express');
const cors = require('cors');
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// Common security and CORS headers
app.use((req, res, next) => {
  const origin = req.headers['origin'] || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// JSON and URL-encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter
app.use(rateLimiter);

// Serve frontend static assets
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use('/static', express.static(path.join(frontendDir, 'static')));

// Serve frontend home page
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Mount application routes
app.use(routes);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

