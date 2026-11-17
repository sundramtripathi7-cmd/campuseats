const request = require('supertest');
const app = require('../src/app');
const { clearOrders } = require('../src/services/orderService');
const { clearRateState } = require('../src/middleware/rateLimiter');

const TOKEN = 'campuseats-demo-token';
const H = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

beforeEach(() => {
  clearOrders();
  clearRateState();
});

function create(payload = null, headers = {}) {
  const h = { ...H, ...headers };
  const body = payload || {
    items: [{ menuItemId: '1', qty: 2 }],
    address: 'Hostel A, Room 12',
  };
  return request(app).post('/orders').set(h).send(body);
}

describe('Order Service API', () => {
  test('test_create_201_location_and_content_type', async () => {
    const r = await create(null, { 'Idempotency-Key': 'order-1' });
    expect(r.status).toBe(201);
    expect(r.headers['location']).toMatch(/^\/orders\//);
    expect(r.headers['content-type']).toMatch(/application\/json/);
  });

  test('test_validation_collects_multiple_errors', async () => {
    const r = await create({ items: [{ menuItemId: '1', qty: 0 }], address: '' });
    expect(r.status).toBe(422);
    expect(r.body.errors.length).toBe(2);
    expect(r.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  test('test_empty_cart_422', async () => {
    const r = await create({ items: [], address: 'Hostel' });
    expect(r.status).toBe(422);
    expect(r.body.type).toBe('validation-error');
  });

  test('test_unknown_order_404', async () => {
    const r = await request(app).get('/orders/nope').set(H);
    expect(r.status).toBe(404);
  });

  test('test_illegal_transition_409', async () => {
    const r1 = await create();
    const oid = r1.body.id;
    const r2 = await request(app)
      .patch(`/orders/${oid}`)
      .set(H)
      .send({ status: 'completed' });

    expect(r2.status).toBe(409);
    expect(r2.body.type).toBe('illegal-transition');
  });

  test('test_payment_declined_402', async () => {
    const r1 = await create();
    const oid = r1.body.id;
    const r2 = await request(app)
      .patch(`/orders/${oid}`)
      .set({ ...H, 'X-Simulate-Payment': 'declined' })
      .send({ status: 'paid' });

    expect(r2.status).toBe(402);
    expect(r2.body.type).toBe('payment-declined');
  });

  test('test_idempotency', async () => {
    const a = await create(null, { 'Idempotency-Key': 'same' });
    const b = await create(null, { 'Idempotency-Key': 'same' });
    expect(a.body.id).toBe(b.body.id);
  });

  test('test_xml_negotiation', async () => {
    const r = await create(null, { Accept: 'application/xml' });
    expect(r.status).toBe(201);
    expect(r.headers['content-type']).toMatch(/application\/xml/);
    expect(r.text).toContain('<order>');
  });

  test('test_unsupported_accept_406', async () => {
    const r = await request(app).get('/orders').set({ ...H, Accept: 'image/png' });
    expect(r.status).toBe(406);
  });

  test('test_delete_created_order_204', async () => {
    const r1 = await create();
    const oid = r1.body.id;
    const d = await request(app).delete(`/orders/${oid}`).set(H);
    expect(d.status).toBe(204);
  });

  test('test_payment_service_unavailable_has_retry_after', async () => {
    const r1 = await create();
    const oid = r1.body.id;
    const out = await request(app)
      .patch(`/orders/${oid}`)
      .set({ ...H, 'X-Simulate-Payment': 'unavailable' })
      .send({ status: 'paid' });

    expect(out.status).toBe(503);
    expect(out.headers['retry-after']).toBe('5');
  });
});

