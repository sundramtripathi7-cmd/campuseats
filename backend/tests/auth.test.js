const request = require('supertest');
const app = require('../src/app');
const { clearUsers } = require('../src/services/authService');
const { clearRateState } = require('../src/middleware/rateLimiter');

beforeEach(() => {
  clearUsers();
  clearRateState();
});

describe('Authentication & Identity Service', () => {
  test('registers a new user and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sundram Tripathi',
        email: 'sundram@campuseats.edu',
        password: 'securepassword123',
        role: 'student',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('sundram@campuseats.edu');
    expect(res.body.token).toBeDefined();
  });

  test('rejects duplicate user email with 409 Conflict', async () => {
    const payload = {
      name: 'Akshay Kumar',
      email: 'akshay@campuseats.edu',
      password: 'password123',
      role: 'student',
    };

    await request(app).post('/api/auth/register').send(payload);
    const dupRes = await request(app).post('/api/auth/register').send(payload);

    expect(dupRes.status).toBe(409);
  });

  test('logs in existing user and accesses protected route', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ankit Kumar',
        email: 'ankit@campuseats.edu',
        password: 'mypassword',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ankit@campuseats.edu',
        password: 'mypassword',
      });

    expect(loginRes.status).toBe(200);
    const jwtToken = loginRes.body.token;

    // Access /api/auth/me with JWT token
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('ankit@campuseats.edu');
  });

  test('rejects invalid password with 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Abhinav Chandravanshi',
        email: 'abhinav@campuseats.edu',
        password: 'correctpassword',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'abhinav@campuseats.edu',
        password: 'wrongpassword',
      });

    expect(loginRes.status).toBe(401);
  });

  test('allows access to protected routes with legacy demo token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer campuseats-demo-token');

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Demo User');
  });
});

