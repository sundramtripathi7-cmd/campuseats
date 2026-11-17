const { sendProblem } = require('../utils/problemDetails');

function requireJsonAccept(req, res, next) {
  const accept = (req.headers['accept'] || '*/*').toLowerCase();
  const parts = accept.split(',').map(p => p.split(';')[0].trim());

  const isAccepted = parts.includes('*/*') || parts.includes('application/json') || parts.includes('application/problem+json');

  if (!isAccepted) {
    return sendProblem(
      res,
      406,
      'Not Acceptable',
      'Only application/json responses are supported',
      'https://campuseats.example/problems/406'
    );
  }

  next();
}

function orderContentNegotiation(req, res, next) {
  const accept = (req.headers['accept'] || '*/*').toLowerCase();

  if (accept.includes('*/*') || accept.includes('application/json') || accept.includes('application/problem+json')) {
    req.negotiatedFormat = 'json';
    return next();
  }

  if (accept.includes('application/xml') || accept.includes('text/xml')) {
    req.negotiatedFormat = 'xml';
    return next();
  }

  return sendProblem(
    res,
    406,
    'Not Acceptable',
    'Supported response types are application/json and application/xml',
    'not-acceptable'
  );
}

module.exports = {
  requireJsonAccept,
  orderContentNegotiation,
};

