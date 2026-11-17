const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { orderContentNegotiation } = require('../middleware/contentNegotiation');
const {
  getOrdersHandler,
  createOrderHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
  healthCheck,
} = require('../controllers/orderController');

const router = express.Router();

router.get('/health', healthCheck);

router.get('/orders', orderContentNegotiation, requireAuth, getOrdersHandler);
router.post('/orders', orderContentNegotiation, requireAuth, createOrderHandler);

router.get('/orders/:id', orderContentNegotiation, requireAuth, getOrderHandler);
router.patch('/orders/:id', orderContentNegotiation, requireAuth, updateOrderHandler);
router.delete('/orders/:id', orderContentNegotiation, requireAuth, deleteOrderHandler);

module.exports = router;

