const config = require('../config/env');
const { sendProblem } = require('../utils/problemDetails');

const rateState = new Map();

function rateLimiter(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const clientId = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = config.rateWindowSeconds * 1000;

  let state = rateState.get(clientId);

  if (!state || now - state.start >= windowMs) {
    state = {
      start: now,
      count: 0,
    };
    rateState.set(clientId, state);
  }

  if (state.count >= config.rateLimit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - state.start)) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return sendProblem(
      res,
      429,
      'Too Many Requests',
      'Per-client request limit exceeded',
      'https://campuseats.example/problems/429'
    );
  }

  state.count += 1;
  const remaining = Math.max(0, config.rateLimit - state.count);

  res.setHeader('X-RateLimit-Limit', String(config.rateLimit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));

  next();
}

function clearRateState() {
  rateState.clear();
}

module.exports = {
  rateLimiter,
  clearRateState,
};

