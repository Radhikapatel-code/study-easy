const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongoServer;
let app, Task, Habit;
let authToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Import app after connecting to in-memory DB
  const server = require('../server');
  app = server.app;
  Task = server.Task;
  Habit = server.Habit;

  // Register and login a test user to get a token
  const registerRes = await request(app)
    .post('/register')
    .send({ name: 'Task Tester', email: 'tester@gmail.com', password: 'password123' });
  
  authToken = registerRes.body.token;
  userId = registerRes.body.user.id;
}, 30000); // 30s timeout for first-time binary download

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // Clean up tasks and habits between tests (but keep the user)
  await Task.deleteMany({});
  await Habit.deleteMany({});
});

describe('Tasks Routes', () => {
  describe('GET /tasks', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('should return tasks for authenticated user', async () => {
      // Create a task first
      await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Test Task', priority: 'high' });

      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].text).toBe('Test Task');
    });
  });

  describe('POST /tasks', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ text: 'Unauthorized Task' });
      
      expect(res.status).toBe(401);
    });

    it('should create a task with correct shape', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'New Task', priority: 'high', category: 'Work' });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.text).toBe('New Task');
      expect(res.body.priority).toBe('high');
      expect(res.body.category).toBe('Work');
      expect(res.body.completed).toBe(false);
      expect(res.body.userEmail).toBe('tester@gmail.com');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should toggle task completion', async () => {
      // Create a task
      const createRes = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Toggle Me', priority: 'medium' });
      
      const taskId = createRes.body._id;

      // Toggle to completed
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });
      
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it('should sync linked habit when toggling task', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Create a habit
      const habitRes = await request(app)
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Habit', category: 'Health' });
      
      const habitId = habitRes.body.habit._id;

      // Find the auto-created linked task
      const tasksRes = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      
      const linkedTask = tasksRes.body.find(t => t.linkedHabitId === habitId);
      expect(linkedTask).toBeDefined();

      // Toggle the linked task to completed
      await request(app)
        .put(`/tasks/${linkedTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });

      // Verify the habit streak was updated
      const habitsRes = await request(app)
        .get('/habits')
        .set('Authorization', `Bearer ${authToken}`);
      
      const updatedHabit = habitsRes.body.find(h => h._id === habitId);
      const streakEntry = updatedHabit.streak.find(s => s.date === today);
      expect(streakEntry).toBeDefined();
      expect(streakEntry.completed).toBe(true);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      // Create a task
      const createRes = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Delete Me' });
      
      const taskId = createRes.body._id;

      // Delete it
      const res = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Task deleted');

      // Verify it's gone
      const getRes = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getRes.body.length).toBe(0);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(404);
    });
  });
});
