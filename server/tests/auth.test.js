const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongoServer;
let app, Task, Habit;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Import app after connecting to in-memory DB
  const server = require('../server');
  app = server.app;
  Task = server.Task;
  Habit = server.Habit;
}, 30000); // 30s timeout for first-time binary download

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // Clean up collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth Routes', () => {
  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/register')
        .send({ name: 'Test User', email: 'test@gmail.com', password: 'password123' });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@gmail.com');
      expect(res.body.msg).toBe('User registered successfully');
    });

    it('should fail when registering with duplicate email', async () => {
      // Register first
      await request(app)
        .post('/register')
        .send({ name: 'User 1', email: 'dupe@gmail.com', password: 'password123' });
      
      // Try to register again with same email
      const res = await request(app)
        .post('/register')
        .send({ name: 'User 2', email: 'dupe@gmail.com', password: 'password456' });
      
      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('User already exists');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await request(app)
        .post('/register')
        .send({ name: 'Login Test', email: 'login@gmail.com', password: 'password123' });
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'login@gmail.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    it('should succeed and return a token', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'login@gmail.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login@gmail.com');
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'nobody@gmail.com', password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });
  });
});
