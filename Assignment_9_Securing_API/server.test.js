const request = require('supertest');
const app = require('./server');

beforeEach(() => {
  app.resetStore();
});

describe('Assignment 9 - Securing the API', () => {
  let customerToken;
  let restaurantToken;
  let adminToken;

  beforeAll(async () => {
    // Acquire tokens for demo users
    const customerLogin = await request(app)
      .post('/login')
      .send({ username: 'customer', password: 'customer123' });
    customerToken = customerLogin.body.token;

    const restaurantLogin = await request(app)
      .post('/login')
      .send({ username: 'restaurant', password: 'restaurant123' });
    restaurantToken = restaurantLogin.body.token;

    const adminLogin = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.token;
  });

  describe('Authentication (POST /login)', () => {
    test('successful login returns 200 and JWT token', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'customer', password: 'customer123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        id: 1,
        username: 'customer',
        role: 'customer',
      });
    });

    test('login with incorrect password returns 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'customer', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid username or password/i);
    });

    test('login with non-existent user returns 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'unknownuser', password: 'somepassword' });

      expect(res.status).toBe(401);
    });

    test('login missing fields returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'customer' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });
  });

  describe('Public Routes (GET /items)', () => {
    test('GET /items is accessible without token (200 OK)', async () => {
      const res = await request(app).get('/items');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);
    });

    test('GET /items/:id returns 200 when found, 404 when not found', async () => {
      const found = await request(app).get('/items/1');
      expect(found.status).toBe(200);
      expect(found.body.name).toBe('Veg Burger');

      const notFound = await request(app).get('/items/999');
      expect(notFound.status).toBe(404);
    });
  });

  describe('Protected Routes (POST /items & GET /me)', () => {
    test('POST /items without token returns 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/items')
        .send({ name: 'Veg Hakka Noodles', price: 90 });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/access token is missing/i);
    });

    test('POST /items with invalid token returns 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/items')
        .set('Authorization', 'Bearer invalid_garbage_token')
        .send({ name: 'Veg Hakka Noodles', price: 90 });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired token/i);
    });

    test('POST /items with customer token returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Veg Hakka Noodles', price: 90 });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/forbidden/i);
    });

    test('POST /items with restaurant token and missing name returns 422', async () => {
      const res = await request(app)
        .post('/items')
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ category: 'Chinese', price: 90 });

      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/name is required/i);
    });

    test('POST /items with restaurant token creates item (201 Created)', async () => {
      const res = await request(app)
        .post('/items')
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({
          name: 'Veg Hakka Noodles',
          category: 'Chinese',
          price: 90,
          available: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(6);
      expect(res.body.name).toBe('Veg Hakka Noodles');
      expect(res.body.createdBy).toBe('restaurant');
    });

    test('POST /items with admin token creates item (201 Created)', async () => {
      const res = await request(app)
        .post('/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Executive Lunch Thali',
          category: 'Meals',
          price: 150,
        });

      expect(res.status).toBe(201);
      expect(res.body.createdBy).toBe('admin');
    });

    test('GET /me returns authenticated user identity with token', async () => {
      const res = await request(app)
        .get('/me')
        .set('Authorization', `Bearer ${restaurantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('restaurant');
      expect(res.body.user.role).toBe('restaurant');
    });
  });
});

