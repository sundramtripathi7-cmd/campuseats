const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { sendProblem } = require('../utils/problemDetails');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendProblem(
      res,
      401,
      'Unauthorized',
      'Authorization: Bearer <token> is required',
      'https://campuseats.example/problems/401'
    );
  }

  const token = authHeader.slice(7).trim();

  // Check against static demo token
  if (token === config.token) {
    req.user = { id: 1, name: 'Demo User', role: 'student', email: 'demo@campuseats.edu' };
    return next();
  }

  // Otherwise verify JWT token
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return sendProblem(
      res,
      401,
      'Unauthorized',
      'A valid Bearer token is required',
      'https://campuseats.example/problems/401'
    );
  }
}

module.exports = {
  requireAuth,
};

