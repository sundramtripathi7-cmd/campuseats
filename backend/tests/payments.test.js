const request = require('supertest');
const app = require('../src/app');
const { clearPayments } = require('../src/services/paymentService');
const { clearRateState } = require('../src/middleware/rateLimiter');

beforeEach(() => {
  clearPayments();
  clearRateState();
});

describe('Payment Service API', () => {
  test('creates payment with 201 and Location', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Idempotency-Key', 'pay-001')
      .send({
        orderId: 101,
        cardToken: 'tok_visa_valid',
        amount: 8000,
        currency: 'INR',
      });

    expect(res.status).toBe(201);
    expect(res.headers['location']).toBe('/payments/1');
    expect(res.body.orderId).toBe(101);
    expect(res.body.amount).toBe(8000);
    expect(res.body.status).toBe('captured');
    expect(res.body.txnId).toBeDefined();
  });

  test('declines card starting with tok_bad returning 422', async () => {
    const res = await request(app)
      .post('/payments')
      .send({
        orderId: 102,
        cardToken: 'tok_bad_card',
        amount: 5000,
        currency: 'INR',
      });

    expect(res.status).toBe(422);
    expect(res.body.type).toBe('/errors/card-declined');
  });

  test('idempotency returns existing payment', async () => {
    const payload = {
      orderId: 103,
      cardToken: 'tok_valid',
      amount: 1500,
      currency: 'INR',
    };

    const first = await request(app).post('/payments').set('Idempotency-Key', 'key-abc').send(payload);
    const second = await request(app).post('/payments').set('Idempotency-Key', 'key-abc').send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.id).toBe(second.body.id);
  });

  test('get payment by id and list by order', async () => {
    await request(app).post('/payments').send({
      orderId: 200,
      cardToken: 'tok_valid',
      amount: 2500,
      currency: 'INR',
    });

    const getRes = await request(app).get('/payments/1');
    expect(getRes.status).toBe(200);
    expect(getRes.body.amount).toBe(2500);

    const listRes = await request(app).get('/payments?order=200');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
  });

  test('refunds payment with 202 status and rejects double refund with 409', async () => {
    await request(app).post('/payments').send({
      orderId: 300,
      cardToken: 'tok_valid',
      amount: 4000,
      currency: 'INR',
    });

    const refundRes = await request(app).post('/payments/1/refund');
    expect(refundRes.status).toBe(202);
    expect(refundRes.body.status).toBe('refund_pending');

    const secondRefund = await request(app).post('/payments/1/refund');
    expect(secondRefund.status).toBe(409);
  });
});

