const { validateOrder } = require('../models/orderModel');
const {
  getMenu,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require('../services/orderService');
const { toOrderXml } = require('../utils/xmlUtils');
const { createProblem } = require('../utils/problemDetails');

function sendOrderResponse(req, res, data, status = 200, location = null) {
  if (location) {
    res.setHeader('Location', location);
  }

  if (req.negotiatedFormat === 'xml') {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(status).send(toOrderXml(data));
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(data);
}

function sendOrderProblem(res, status, title, detail, type, extra = {}) {
  const payload = createProblem(status, title, detail, type, extra);
  res.setHeader('Content-Type', 'application/problem+json; charset=utf-8');
  return res.status(status).json(payload);
}

function getOrdersHandler(req, res) {
  const orders = listOrders();
  return sendOrderResponse(req, res, orders);
}

function createOrderHandler(req, res) {
  const errors = validateOrder(req.body, getMenu());

  if (errors.length > 0) {
    return sendOrderProblem(
      res,
      422,
      'Validation Failed',
      'One or more fields are invalid',
      'validation-error',
      { errors }
    );
  }

  try {
    const key = req.headers['idempotency-key'] || null;
    const result = createOrder(req.body, key);

    if (result.isIdempotent) {
      return sendOrderResponse(req, res, result.cached.body, result.cached.status, result.cached.location);
    }

    return sendOrderResponse(req, res, result.order, 201, result.location);
  } catch (err) {
    return sendOrderProblem(
      res,
      err.status || 500,
      err.title || 'Error',
      err.message,
      err.type || 'error'
    );
  }
}

function getOrderHandler(req, res) {
  const order = getOrder(req.params.id);
  if (!order) {
    return sendOrderProblem(
      res,
      404,
      'Order Not Found',
      'No order exists with this id',
      'order-not-found'
    );
  }
  return sendOrderResponse(req, res, order);
}

function updateOrderHandler(req, res) {
  const newStatus = req.body && typeof req.body === 'object' ? req.body.status : null;
  const simulatePayment = req.headers['x-simulate-payment'] || null;

  try {
    const updated = updateOrderStatus(req.params.id, newStatus, simulatePayment);
    return sendOrderResponse(req, res, updated);
  } catch (err) {
    if (err.retryAfter) {
      res.setHeader('Retry-After', String(err.retryAfter));
    }
    return sendOrderProblem(
      res,
      err.status || 500,
      err.title || 'Error',
      err.message,
      err.type || 'error'
    );
  }
}

function deleteOrderHandler(req, res) {
  try {
    deleteOrder(req.params.id);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(204).end();
  } catch (err) {
    return sendOrderProblem(
      res,
      err.status || 500,
      err.title || 'Error',
      err.message,
      err.type || 'error'
    );
  }
}

function healthCheck(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({ status: 'ok' });
}

module.exports = {
  getOrdersHandler,
  createOrderHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
  healthCheck,
};

