const { sendProblem } = require('../utils/problemDetails');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const title = err.title || (status === 500 ? 'Internal Server Error' : 'Request Error');
  const detail = err.message || 'An unexpected error occurred';
  const type = err.type || `https://campuseats.example/problems/${status}`;

  const extra = {};
  if (err.errors) {
    extra.errors = err.errors;
  }

  sendProblem(res, status, title, detail, type, extra);
}

module.exports = {
  errorHandler,
};

