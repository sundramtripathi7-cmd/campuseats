const request = require('supertest');
const app = require('./server');

beforeEach(() => {
  app.resetStore();
});

describe('Assignment 8 - Menu REST API', () => {
  test('GET /items returns 200 and all menu items', async () => {
    const res = await request(app).get('/items');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('price');
  });

  test('GET /items/:id returns 200 when item exists', async () => {
    const res = await request(app).get('/items/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.name).toBe('Veg Burger');
    expect(res.body.price).toBe(80.0);
  });

  test('GET /items/:id returns 404 when item does not exist', async () => {
    const res = await request(app).get('/items/9999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('POST /items returns 201 and creates item when payload is valid', async () => {
    const newItem = {
      name: 'Chole Bhature',
      category: 'North Indian',
      price: 110,
      available: true,
    };

    const res = await request(app)
      .post('/items')
      .send(newItem);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(6);
    expect(res.body.name).toBe('Chole Bhature');
    expect(res.body.category).toBe('North Indian');
    expect(res.body.price).toBe(110.0);
    expect(res.body.available).toBe(true);

    // Verify it is in list
    const listRes = await request(app).get('/items');
    expect(listRes.body.length).toBe(6);
  });

  test('POST /items returns 422 when name is missing or empty', async () => {
    const invalidItem = {
      category: 'Fast Food',
      price: 50,
    };

    const res = await request(app)
      .post('/items')
      .send(invalidItem);

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/name is required/i);
  });

  test('POST /items returns 422 when name is whitespace', async () => {
    const res = await request(app)
      .post('/items')
      .send({ name: '   ', price: 50 });

    expect(res.status).toBe(422);
  });
});

