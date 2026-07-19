/**
 * Seed Script — Creates demo accounts with pre-populated tasks and habits
 * Run: node seed.js
 * Requires MONGO_URI environment variable or defaults to local MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/focus_os_db';

// Import models
const User = require('./models/User');

const taskSchema = new mongoose.Schema({
  userEmail: String,
  text: String,
  completed: Boolean,
  priority: String,
  category: String,
  date: String,
  time: { type: String, default: '00:00' },
  details: { type: String, default: '' },
  isHabit: Boolean,
  linkedHabitId: String
});

const habitSchema = new mongoose.Schema({
  userEmail: String,
  name: String,
  category: String,
  streak: [{ date: String, completed: Boolean }]
});

const Task = mongoose.model('Task', taskSchema);
const Habit = mongoose.model('Habit', habitSchema);

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

const demoAccounts = [
  {
    user: { name: 'Demo Commander', email: 'demo@gmail.com', password: 'demo1234' },
    habits: [
      { name: 'Read 10 pages', category: 'Learning', streak: [
        { date: twoDaysAgo, completed: true },
        { date: yesterday, completed: true },
        { date: today, completed: false }
      ]},
      { name: 'Exercise 30 min', category: 'Health', streak: [
        { date: twoDaysAgo, completed: true },
        { date: yesterday, completed: false },
        { date: today, completed: false }
      ]},
    ],
    tasks: [
      { text: 'Complete math assignment', priority: 'high', category: 'Learning', date: today, completed: false },
      { text: 'Review lecture notes', priority: 'medium', category: 'Learning', date: today, completed: true },
      { text: 'Grocery shopping', priority: 'low', category: 'Personal', date: today, completed: false },
      { text: 'Study group meeting', priority: 'high', category: 'Work', date: today, time: '14:00', completed: false, details: 'Library room 203' },
      { text: 'Morning jog', priority: 'medium', category: 'Health', date: yesterday, completed: true },
    ]
  },
  {
    user: { name: 'Reviewer', email: 'reviewer@gmail.com', password: 'review1234' },
    habits: [
      { name: 'Meditate 10 min', category: 'Health', streak: [
        { date: twoDaysAgo, completed: true },
        { date: yesterday, completed: true },
        { date: today, completed: true }
      ]},
    ],
    tasks: [
      { text: 'Code review PR #42', priority: 'high', category: 'Work', date: today, completed: true },
      { text: 'Write unit tests', priority: 'high', category: 'Work', date: today, completed: false },
      { text: 'Update documentation', priority: 'medium', category: 'Work', date: today, completed: false },
    ]
  },
  {
    user: { name: 'Guest Pilot', email: 'guest@gmail.com', password: 'guest1234' },
    habits: [],
    tasks: [
      { text: 'Explore the app', priority: 'low', category: 'Personal', date: today, completed: false },
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const account of demoAccounts) {
      // Check if user already exists
      const existing = await User.findOne({ email: account.user.email });
      if (existing) {
        console.log(`⏭️  User ${account.user.email} already exists, skipping...`);
        continue;
      }

      // Create user
      const hashedPass = await bcrypt.hash(account.user.password, 10);
      const user = new User({ name: account.user.name, email: account.user.email, password: hashedPass });
      await user.save();
      console.log(`👤 Created user: ${account.user.email} (password: ${account.user.password})`);

      // Create habits
      for (const habitData of account.habits) {
        const habit = new Habit({
          userEmail: account.user.email,
          name: habitData.name,
          category: habitData.category,
          streak: habitData.streak || []
        });
        await habit.save();
        console.log(`  ⚡ Created habit: ${habitData.name}`);
      }

      // Create tasks
      for (const taskData of account.tasks) {
        const task = new Task({
          userEmail: account.user.email,
          text: taskData.text,
          priority: taskData.priority || 'medium',
          category: taskData.category || 'Work',
          date: taskData.date || today,
          time: taskData.time || '00:00',
          details: taskData.details || '',
          completed: taskData.completed || false,
          isHabit: false,
          linkedHabitId: null
        });
        await task.save();
        console.log(`  📋 Created task: ${taskData.text}`);
      }
    }

    console.log('\n✅ Seed complete! Demo accounts:');
    console.log('  demo@gmail.com    / demo1234');
    console.log('  reviewer@gmail.com / review1234');
    console.log('  guest@gmail.com    / guest1234');

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
