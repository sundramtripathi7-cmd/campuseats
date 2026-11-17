const crypto = require('crypto');

let payments = new Map();
let paymentsByKey = new Map();
let nextPaymentId = 1;

function charge(cardToken, amount) {
  if (typeof cardToken === 'string' && cardToken.startsWith('tok_bad')) {
    return {
      declined: true,
      reason: 'Issuer refused the charge.',
    };
  }

  return {
    declined: false,
    txnId: 'tx_' + crypto.randomBytes(3).toString('hex'),
  };
}

function createPayment({ orderId, cardToken, amount, currency }, idempotencyKey = null) {
  if (idempotencyKey) {
    const existingId = paymentsByKey.get(idempotencyKey);
    if (existingId && payments.has(existingId)) {
      return {
        isIdempotent: true,
        payment: payments.get(existingId),
      };
    }
  }

  const chargeResult = charge(cardToken, amount);
  if (chargeResult.declined) {
    return {
      declined: true,
      reason: chargeResult.reason,
    };
  }

  const pid = nextPaymentId++;
  const payment = {
    id: pid,
    orderId,
    amount,
    currency,
    status: 'captured',
    txnId: chargeResult.txnId,
    createdAt: new Date().toISOString(),
  };

  payments.set(pid, payment);

  if (idempotencyKey) {
    paymentsByKey.set(idempotencyKey, pid);
  }

  return {
    payment,
    isIdempotent: false,
  };
}

function findPayment(id) {
  const numId = parseInt(id, 10);
  return payments.get(numId) || null;
}

function findPaymentsByOrder(orderId) {
  const numOrder = parseInt(orderId, 10);
  const results = [];
  for (const p of payments.values()) {
    if (p.orderId === numOrder) {
      results.push({ ...p });
    }
  }
  return results;
}

function refundPayment(id) {
  const numId = parseInt(id, 10);
  const payment = payments.get(numId);
  if (!payment) {
    return { error: 'not-found' };
  }

  if (payment.status !== 'captured') {
    return { error: 'not-refundable' };
  }

  payment.status = 'refund_pending';
  return { payment: { ...payment } };
}

function clearPayments() {
  payments.clear();
  paymentsByKey.clear();
  nextPaymentId = 1;
}

module.exports = {
  charge,
  createPayment,
  findPayment,
  findPaymentsByOrder,
  refundPayment,
  clearPayments,
};

