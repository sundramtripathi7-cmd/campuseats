const request = require('supertest');
const app = require('../src/app');
const { clearStore } = require('../src/services/catalogService');
const { clearRateState } = require('../src/middleware/rateLimiter');

const TOKEN = 'campuseats-demo-token';
const AUTH = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/json',
};

beforeEach(() => {
  clearStore();
  clearRateState();
});

function createItem(key = 'test-create-001') {
  return request(app)
    .post('/menu-items')
    .set({ ...AUTH, 'Idempotency-Key': key })
    .send({
      name: 'Veg Burger',
      category: 'Fast Food',
      price: 80,
      available: true,
    });
}

describe('Catalog Service REST API', () => {
  test('test_create_returns_201_location_and_etag', async () => {
    const res = await createItem();
    expect(res.status).toBe(201);
    expect(res.headers['location']).toBe('/menu-items/1');
    expect(res.headers['etag']).toBeDefined();
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.name).toBe('Veg Burger');
    expect(res.body.price).toBe(80);
    expect(res.body.available).toBe(true);
  });

  test('test_idempotency_returns_original_result', async () => {
    const first = await createItem('same-key');
    const second = await createItem('same-key');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body).toEqual(second.body);
    expect(first.headers['location']).toBe(second.headers['location']);
    expect(first.headers['etag']).toBe(second.headers['etag']);
  });

  test('test_conditional_get_returns_304', async () => {
    await createItem();
    const first = await request(app).get('/menu-items/1').set(AUTH);
    const etag = first.headers['etag'];

    const second = await request(app)
      .get('/menu-items/1')
      .set({ ...AUTH, 'If-None-Match': etag });

    expect(first.status).toBe(200);
    expect(second.status).toBe(304);
    expect(second.text).toBe('');
    expect(second.headers['etag']).toBe(etag);
  });

  test('test_conditional_write_returns_412_for_stale_etag', async () => {
    await createItem();
    const current = (await request(app).get('/menu-items/1').set(AUTH)).headers['etag'];

    // Change the representation so the old ETag is stale
    const changed = await request(app)
      .post('/menu-items/1/availability')
      .set({ ...AUTH, 'If-Match': current })
      .send({ available: false });
    expect(changed.status).toBe(200);

    const stale = await request(app)
      .post('/menu-items/1/availability')
      .set({ ...AUTH, 'If-Match': current })
      .send({ available: true });
    expect(stale.status).toBe(412);
  });

  test('test_bad_request', async () => {
    const res = await request(app)
      .post('/menu-items')
      .set({ ...AUTH, 'Idempotency-Key': 'bad-001' })
      .send({ name: 'Only Name' });
    expect(res.status).toBe(400);
  });

  test('test_unknown_resource_returns_404', async () => {
    const res = await request(app).get('/menu-items/99999').set(AUTH);
    expect(res.status).toBe(404);
  });

  test('test_missing_auth_returns_401', async () => {
    const res = await request(app).get('/menu-items/1');
    expect(res.status).toBe(401);
  });

  test('test_unsupported_accept_returns_406', async () => {
    const res = await request(app)
      .get('/menu-items')
      .set({
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/xml',
      });
    expect(res.status).toBe(406);
  });

  test('test_options_returns_allow_and_cors', async () => {
    const res = await request(app)
      .options('/menu-items')
      .set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(204);
    expect(res.headers['allow']).toBe('GET, POST, OPTIONS');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('test_list_uses_query_filter_sort_and_pagination', async () => {
    await createItem('item-1');
    await request(app)
      .post('/menu-items')
      .set({ ...AUTH, 'Idempotency-Key': 'item-2' })
      .send({
        name: 'Paneer Roll',
        category: 'Indian',
        price: 100,
        available: true,
      });

    const res = await request(app)
      .get('/menu-items?category=Fast%20Food&sort=price&order=desc&page=1&limit=1')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe('Fast Food');
  });

  test('test_crud_update_and_delete', async () => {
    await createItem('crud-item');
    const updateRes = await request(app)
      .put('/menu-items/1')
      .set(AUTH)
      .send({
        name: 'Deluxe Veg Burger',
        category: 'Fast Food',
        price: 95,
        available: true,
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Deluxe Veg Burger');

    const delRes = await request(app).delete('/menu-items/1').set(AUTH);
    expect(delRes.status).toBe(204);

    const getRes = await request(app).get('/menu-items/1').set(AUTH);
    expect(getRes.status).toBe(404);
  });
});

