const SUPPORTED_CURRENCIES = new Set(['INR']);

function validatePayment(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return [['body', 'must be a JSON object']];
  }

  if (typeof body.orderId !== 'number' || !Number.isInteger(body.orderId)) {
    errors.push(['orderId', 'required integer']);
  }

  if (!body.cardToken || typeof body.cardToken !== 'string') {
    errors.push(['cardToken', 'required']);
  }

  const amount = body.amount;
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    errors.push(['amount', 'positive integer, in paise']);
  }

  if (!SUPPORTED_CURRENCIES.has(body.currency)) {
    errors.push(['currency', 'not supported']);
  }

  return errors;
}

module.exports = {
  validatePayment,
  SUPPORTED_CURRENCIES,
};

