require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const { body, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
// luxon is optional if you just use native Date, but keeping it as you had it
const { DateTime } = require('luxon');

const authenticate = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/focus_os_db';

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Socket.io auth middleware — verify JWT on connection
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join a room scoped to the user so only their clients get updates
  socket.join(`user:${socket.userEmail}`);
  console.log(`🔌 Socket connected: ${socket.userEmail}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.userEmail}`);
  });
});

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- RATE LIMITING (for auth routes) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: { error: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- VALIDATION HELPER ---
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// --- SCHEMAS ---

const taskSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'Work' }, // Task category
  date: { type: String }, // Format: YYYY-MM-DD
  time: { type: String, default: '00:00' }, // Optional reminder time (HH:MM)
  details: { type: String, default: '' },
  isHabit: { type: Boolean, default: false }, 
  linkedHabitId: { type: String, default: null }, // CRITICAL FOR SYNC
  focusSessions: { type: Number, default: 0 } // Tracks Pomodoro sessions
});

const habitSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Health' },
  streak: [{
    date: String,
    completed: Boolean
  }]
});

const Task = mongoose.model('Task', taskSchema);
const Habit = mongoose.model('Habit', habitSchema);

// --- AUTH ROUTES (Register / Login) --- (Rate limited, no auth middleware needed)
try {
  const authRoutes = require('./routes/auth');
  app.use('/', authLimiter, authRoutes); // mount at root so client can call /register and /login
} catch (err) {
  console.warn('Auth routes not available:', err.message);
}

// --- ROUTES: TASKS (All protected by authenticate middleware) ---

// 1. GET Tasks (Filtered by Date)
app.get('/tasks', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    // Identity derived from JWT token, NOT from query params
    const userEmail = req.userEmail;
    
    const query = { userEmail };
    if (date) query.date = date; 

    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Task (Manual Task Creation) — with input validation
app.post('/tasks', authenticate, [
  body('text').trim().notEmpty().withMessage('Task text is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('category').optional().trim().escape(),
  body('date').optional().isISO8601().withMessage('Date must be YYYY-MM-DD format'),
  body('time').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:MM format'),
], handleValidationErrors, async (req, res) => {
  try {
    const { text, priority, category, date, time, details, isHabit, linkedHabitId } = req.body;
    // Identity derived from JWT token, NOT from request body
    const userEmail = req.userEmail;

    const newTask = new Task({
      userEmail,
      text,
      priority: priority || 'medium',
      category: category || 'Work',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '00:00',
      details: details || '',
      isHabit: !!isHabit,
      linkedHabitId: linkedHabitId || null
    });
    await newTask.save();

    // Emit real-time event
    io.to(`user:${userEmail}`).emit('task:created', newTask);

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Task (Toggle Complete + Update Linked Habit)
app.put('/tasks/:id', authenticate, async (req, res) => {
  try {
    const { completed } = req.body;
    // Verify the task belongs to this user
    const task = await Task.findOne({ _id: req.params.id, userEmail: req.userEmail });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.completed = completed;
    await task.save();

    // SYNC LOGIC: If this task is linked to a habit, update the habit streak!
    if (task.linkedHabitId) {
      const today = task.date; 
      const habit = await Habit.findById(task.linkedHabitId);
      
      if (habit) {
        // Update existing streak entry or push new one
        const entryIdx = habit.streak.findIndex(s => s.date === today);
        if (entryIdx >= 0) {
          habit.streak[entryIdx].completed = completed;
        } else {
          habit.streak.push({ date: today, completed });
        }
        // Keep streak sorted
        habit.streak.sort((a, b) => new Date(a.date) - new Date(b.date));
        await habit.save();

        // Emit habit update event
        io.to(`user:${req.userEmail}`).emit('habit:updated', habit);
      }
    }

    // Emit task update event
    io.to(`user:${req.userEmail}`).emit('task:updated', task);

    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3.5 POST Focus Session (Increment focusSessions)
app.post('/tasks/:id/focus', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userEmail: req.userEmail });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.focusSessions = (task.focusSessions || 0) + 1;
    await task.save();

    // Emit real-time event
    io.to(`user:${req.userEmail}`).emit('task:updated', task);

    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. DELETE Task
app.delete('/tasks/:id', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`🗑️  Deleting task: ${taskId}`);
    // Verify the task belongs to this user
    const deleted = await Task.findOneAndDelete({ _id: taskId, userEmail: req.userEmail });
    if (!deleted) {
      console.log(`❌ Task not found: ${taskId}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log(`✅ Task deleted successfully: ${taskId}`);

    // Emit real-time event
    io.to(`user:${req.userEmail}`).emit('task:deleted', { _id: taskId });

    res.json({ message: 'Task deleted', _id: taskId });
  } catch (error) {
    console.error(`❌ Delete error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: HABITS (All protected by authenticate middleware) ---

// 1. GET Habits
app.get('/habits', authenticate, async (req, res) => {
  try {
    // Identity derived from JWT token
    const userEmail = req.userEmail;
    const habits = await Habit.find({ userEmail });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Habit (Create Habit + Linked Task) — with input validation
app.post('/habits', authenticate, [
  body('name').trim().notEmpty().withMessage('Habit name is required'),
  body('category').optional().trim().escape(),
], handleValidationErrors, async (req, res) => {
  try {
    const { name, category } = req.body;
    // Identity derived from JWT token
    const userEmail = req.userEmail;

    // A. Create the Habit
    const newHabit = new Habit({
      userEmail,
      name,
      category,
      streak: [] 
    });
    const savedHabit = await newHabit.save();

    // B. Automatically Create a Task for Today (FIXED LINKING)
    const today = new Date().toISOString().split('T')[0];
    
    const newTask = new Task({
      userEmail,
      text: `Habit: ${name}`,
      priority: 'high',
      date: today,
      isHabit: true,
      linkedHabitId: savedHabit._id.toString() // <--- THIS WAS MISSING BEFORE!
    });
    await newTask.save();

    // Emit real-time events
    io.to(`user:${userEmail}`).emit('habit:updated', savedHabit);
    io.to(`user:${userEmail}`).emit('task:created', newTask);

    res.status(201).json({ 
      message: 'Habit and linked task created', 
      habit: savedHabit 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Habit (Update Streak + Update Linked Task)
app.put('/habits/:id', authenticate, async (req, res) => {
  try {
    const { date, completed } = req.body;
    // Verify the habit belongs to this user
    const habit = await Habit.findOne({ _id: req.params.id, userEmail: req.userEmail });
    if (!habit) return res.status(404).json({ error: 'Not found' });

    // A. Update Habit Streak
    const entryIdx = habit.streak.findIndex(s => s.date === date);
    if (entryIdx >= 0) habit.streak[entryIdx].completed = completed;
    else habit.streak.push({ date, completed });
    habit.streak.sort((a, b) => new Date(a.date) - new Date(b.date));
    await habit.save();

    // B. Update Linked Task (Sync back to To-Do List)
    const updatedTask = await Task.findOneAndUpdate(
      { linkedHabitId: habit._id.toString(), date: date },
      { completed: completed },
      { new: true }
    );

    // Emit real-time events
    io.to(`user:${req.userEmail}`).emit('habit:updated', habit);
    if (updatedTask) {
      io.to(`user:${req.userEmail}`).emit('task:updated', updatedTask);
    }

    res.json({ habit });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. DELETE Habit (Remove habit and linked tasks)
app.delete('/habits/:id', authenticate, async (req, res) => {
  try {
    const habitId = req.params.id;
    console.log(`🗑️  Deleting habit: ${habitId}`);
    
    // Delete linked tasks first (only for this user)
    const tasksResult = await Task.deleteMany({ linkedHabitId: habitId, userEmail: req.userEmail });
    console.log(`Deleted ${tasksResult.deletedCount} linked tasks`);
    
    // Delete the habit (verify ownership)
    const deleted = await Habit.findOneAndDelete({ _id: habitId, userEmail: req.userEmail });
    if (!deleted) return res.status(404).json({ error: 'Habit not found' });
    
    console.log(`✅ Habit deleted successfully`);

    // Emit real-time event
    io.to(`user:${req.userEmail}`).emit('habit:deleted', { _id: habitId });

    res.json({ message: 'Habit and linked tasks deleted' });
  } catch (error) { 
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message }); 
  }
});

// --- ROUTE: SYNC ---

// Migration: Add category to tasks that don't have it
app.post('/migrate-tasks-category', authenticate, async (req, res) => {
  try {
    const result = await Task.updateMany(
      { category: { $exists: false }, userEmail: req.userEmail },
      { $set: { category: 'Work' } }
    );
    console.log(`✅ Migrated ${result.modifiedCount} tasks with category field`);
    res.json({ message: `Updated ${result.modifiedCount} tasks with category 'Work'` });
  } catch (error) { 
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: error.message }); 
  }
});

// --- ROUTE: SYNC ---

// Run this when Daily Page loads to ensure habits appear as tasks
app.post('/sync-habits-to-tasks', authenticate, async (req, res) => {
  try {
    // Identity derived from JWT token
    const userEmail = req.userEmail;
    const today = new Date().toISOString().split('T')[0];

    const habits = await Habit.find({ userEmail });
    let count = 0;

    for (const habit of habits) {
      // 1. Check if habit is already done today in streak
      const isDoneToday = habit.streak.some(s => s.date === today && s.completed);

      // 2. Check if task exists (Match by LINKED ID)
      const existingTask = await Task.findOne({
        userEmail,
        date: today,
        linkedHabitId: habit._id.toString()
      });

      if (!existingTask) {
        const newTask = await new Task({
          userEmail,
          text: `Habit: ${habit.name}`,
          priority: 'high',
          date: today,
          isHabit: true,
          linkedHabitId: habit._id.toString(), // Ensure connection
          completed: isDoneToday // Respect existing status
        }).save();
        count++;

        // Emit real-time event for new synced task
        io.to(`user:${userEmail}`).emit('task:created', newTask);
      }
    }
    res.json({ message: `Synced ${count} habits` });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// --- MONGODB CONNECTION & SERVER START ---
// Only start listening if this file is run directly (not imported by tests)
if (require.main === module) {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io ready`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    console.error('Make sure MONGO_URI is set (or MongoDB is running locally).');
    process.exit(1);
  });
}

// Export for testing
module.exports = { app, Task, Habit };