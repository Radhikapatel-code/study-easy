require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
// luxon is optional if you just use native Date, but keeping it as you had it
const { DateTime } = require('luxon');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/focus_os_db';

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- MONGODB CONNECTION ---
// Ensure your MongoDB is running locally
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  console.error('Make sure MONGO_URI is set (or MongoDB is running locally).');
  process.exit(1);
});

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
  linkedHabitId: { type: String, default: null } // CRITICAL FOR SYNC
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

// --- AUTH ROUTES (Register / Login) ---
try {
  const authRoutes = require('./routes/auth');
  app.use('/', authRoutes); // mount at root so client can call /register and /login
} catch (err) {
  console.warn('Auth routes not available:', err.message);
}

// --- ROUTES: TASKS ---

// 1. GET Tasks (Filtered by Date)
app.get('/tasks', async (req, res) => {
  try {
    const { userEmail, date } = req.query;
    if (!userEmail) return res.status(400).json({ error: 'User email required' });
    
    const query = { userEmail };
    if (date) query.date = date; 

    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Task (Manual Task Creation)
app.post('/tasks', async (req, res) => {
  try {
    const { userEmail, text, priority, category, date, time, details, isHabit, linkedHabitId } = req.body;
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
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Task (Toggle Complete + Update Linked Habit)
app.put('/tasks/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { completed }, { new: true });

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
      }
    }
    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. DELETE Task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`🗑️  Deleting task: ${taskId}`);
    const deleted = await Task.findByIdAndDelete(taskId);
    if (!deleted) {
      console.log(`❌ Task not found: ${taskId}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log(`✅ Task deleted successfully: ${taskId}`);
    res.json({ message: 'Task deleted', _id: taskId });
  } catch (error) {
    console.error(`❌ Delete error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: HABITS ---

// 1. GET Habits
app.get('/habits', async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ error: 'User email required' });
    const habits = await Habit.find({ userEmail });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Habit (Create Habit + Linked Task)
app.post('/habits', async (req, res) => {
  try {
    const { userEmail, name, category } = req.body;

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

    res.status(201).json({ 
      message: 'Habit and linked task created', 
      habit: savedHabit 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Habit (Update Streak + Update Linked Task)
app.put('/habits/:id', async (req, res) => {
  try {
    const { date, completed } = req.body;
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Not found' });

    // A. Update Habit Streak
    const entryIdx = habit.streak.findIndex(s => s.date === date);
    if (entryIdx >= 0) habit.streak[entryIdx].completed = completed;
    else habit.streak.push({ date, completed });
    habit.streak.sort((a, b) => new Date(a.date) - new Date(b.date));
    await habit.save();

    // B. Update Linked Task (Sync back to To-Do List)
    await Task.findOneAndUpdate(
      { linkedHabitId: habit._id.toString(), date: date },
      { completed: completed }
    );

    res.json({ habit });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. DELETE Habit (Remove habit and linked tasks)
app.delete('/habits/:id', async (req, res) => {
  try {
    const habitId = req.params.id;
    console.log(`🗑️  Deleting habit: ${habitId}`);
    
    // Delete linked tasks first
    const tasksResult = await Task.deleteMany({ linkedHabitId: habitId });
    console.log(`Deleted ${tasksResult.deletedCount} linked tasks`);
    
    // Delete the habit
    const deleted = await Habit.findByIdAndDelete(habitId);
    if (!deleted) return res.status(404).json({ error: 'Habit not found' });
    
    console.log(`✅ Habit deleted successfully`);
    res.json({ message: 'Habit and linked tasks deleted' });
  } catch (error) { 
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message }); 
  }
});

// --- ROUTE: SYNC ---

// Migration: Add category to tasks that don't have it
app.post('/migrate-tasks-category', async (req, res) => {
  try {
    const result = await Task.updateMany(
      { category: { $exists: false } },
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
app.post('/sync-habits-to-tasks', async (req, res) => {
  try {
    const { userEmail } = req.body;
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
        await new Task({
          userEmail,
          text: `Habit: ${habit.name}`,
          priority: 'high',
          date: today,
          isHabit: true,
          linkedHabitId: habit._id.toString(), // Ensure connection
          completed: isDoneToday // Respect existing status
        }).save();
        count++;
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

// Server is started after successful DB connection above