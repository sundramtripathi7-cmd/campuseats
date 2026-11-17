/**
 * Build RFC 7807 / 9457 Problem Details object
 */
function createProblem(status, title, detail, problemType = null, extra = {}) {
  const type = problemType || `https://campuseats.example/problems/${status}`;
  const response = {
    type,
    title,
    status,
    detail,
    ...extra,
  };
  return response;
}

function sendProblem(res, status, title, detail, problemType = null, extra = {}) {
  const payload = createProblem(status, title, detail, problemType, extra);
  return res.status(status).json(payload);
}

module.exports = {
  createProblem,
  sendProblem,
};

