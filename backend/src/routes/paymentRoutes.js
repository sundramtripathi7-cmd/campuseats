const express = require('express');
const {
  createPaymentHandler,
  getPaymentHandler,
  listPaymentsHandler,
  refundPaymentHandler,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/payments', createPaymentHandler);
router.get('/payments', listPaymentsHandler);
router.get('/payments/:id', getPaymentHandler);
router.post('/payments/:id/refund', refundPaymentHandler);

module.exports = router;

