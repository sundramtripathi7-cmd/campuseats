const { validatePayment } = require('../models/paymentModel');
const {
  createPayment,
  findPayment,
  findPaymentsByOrder,
  refundPayment,
} = require('../services/paymentService');

const TITLES = {
  'invalid-request': 'Invalid request',
  'card-declined': 'Card declined',
  'payment-not-found': 'Payment not found',
  'not-refundable': 'Not refundable',
};

function paymentProblem(res, status, code, detail = '', errors = null) {
  const body = {
    type: `/errors/${code}`,
    title: TITLES[code] || 'Payment Error',
    status,
    detail,
  };
  if (errors) {
    body.errors = errors;
  }
  return res.status(status).json(body);
}

function createPaymentHandler(req, res) {
  const body = req.body || {};
  const errors = validatePayment(body);

  if (errors.length > 0) {
    return paymentProblem(res, 400, 'invalid-request', 'Request validation failed', errors);
  }

  const idempotencyKey = req.headers['idempotency-key'] || null;
  const result = createPayment(body, idempotencyKey);

  if (result.declined) {
    return paymentProblem(res, 422, 'card-declined', result.reason);
  }

  const payment = result.payment;
  res.setHeader('Location', `/payments/${payment.id}`);
  return res.status(201).json(payment);
}

function getPaymentHandler(req, res) {
  const payment = findPayment(req.params.id);
  if (!payment) {
    return paymentProblem(res, 404, 'payment-not-found', 'Payment not found');
  }
  return res.status(200).json(payment);
}

function listPaymentsHandler(req, res) {
  const orderParam = req.query.order;

  if (orderParam === undefined) {
    return paymentProblem(res, 400, 'invalid-request', 'order query parameter is required');
  }

  const orderId = parseInt(orderParam, 10);
  if (isNaN(orderId) || String(orderId) !== String(orderParam).trim()) {
    return paymentProblem(res, 400, 'invalid-request', 'order must be an integer');
  }

  const payments = findPaymentsByOrder(orderId);
  return res.status(200).json(payments);
}

function refundPaymentHandler(req, res) {
  const result = refundPayment(req.params.id);

  if (result.error === 'not-found') {
    return paymentProblem(res, 404, 'payment-not-found', 'Payment not found');
  }

  if (result.error === 'not-refundable') {
    return paymentProblem(res, 409, 'not-refundable', 'Payment is not refundable');
  }

  return res.status(202).json(result.payment);
}

module.exports = {
  createPaymentHandler,
  getPaymentHandler,
  listPaymentsHandler,
  refundPaymentHandler,
};

