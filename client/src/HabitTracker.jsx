import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { 
  Play, 
  RotateCcw, 
  X, 
  Plus, 
  Flame, 
  Clock,
  MoreVertical,
  CheckCircle2,
  Calendar
} from 'lucide-react';

function HabitTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = location.state?.email || localStorage.getItem('userEmail') || '';
  
  const [habits, setHabits] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: 'Health' });
  const [errors, setErrors] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // --- LOGIC SECTION (Unchanged logic, just hooks) ---

  useEffect(() => {
    if (!userEmail) {
      console.log('No userEmail, redirecting to login');
      navigate('/login');
    } else {
      localStorage.setItem('userEmail', userEmail);
    }
  }, [userEmail, navigate]);

  useEffect(() => {
    const fetchHabits = async () => {
      if (!userEmail) return;
      try {
        const response = await fetch(`/habits?userEmail=${encodeURIComponent(userEmail)}`);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setHabits(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Habit fetch error:', error);
      }
    };

    fetchHabits();

    // Listen for task updates (when tasks toggle, server may update habits)
    const onTasksUpdated = () => fetchHabits();
    window.addEventListener('app:tasks-updated', onTasksUpdated);
    window.addEventListener('app:habits-updated', onTasksUpdated);
    return () => {
      window.removeEventListener('app:tasks-updated', onTasksUpdated);
      window.removeEventListener('app:habits-updated', onTasksUpdated);
    };
  }, [userEmail]);

  useEffect(() => {
    const syncHabits = async () => {
      if (!userEmail) return;
      try {
        await fetch('/sync-habits-to-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail }),
        });
      } catch (error) {
        console.error('Sync error:', error);
      }
    };
    syncHabits();
  }, [userEmail, habits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      const response = await fetch('/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userEmail }),
      });
      const data = await response.json();
      setHabits([...habits, data.habit]);
      // Notify other components (DailyToDoList) that habits changed
      window.dispatchEvent(new Event('app:habits-updated'));
      setFormData({ name: '', category: 'Health' });
    } catch (error) {
      console.error('Add error:', error);
    }
  };

  const deleteHabit = async (habitId) => {
    if (!confirm('Delete this habit and its linked daily task?')) return;
    try {
      console.log(`Deleting habit: ${habitId}`);
      const res = await fetch(`/habits/${habitId}`, { method: 'DELETE' });
      console.log(`Delete response status: ${res.status}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Delete failed');
      }
      const data = await res.json();
      console.log('Delete response:', data);
      setHabits(habits.filter(h => h._id !== habitId));
      // Notify other components to refresh tasks/habits
      window.dispatchEvent(new Event('app:habits-updated'));
      window.dispatchEvent(new Event('app:tasks-updated'));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete habit: ' + err.message);
    }
  };

  const updateStreak = async (habitId, date, completed) => {
    const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
    if (date > today) return;

    try {
      const response = await fetch(`/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, completed }),
      });
      const data = await response.json();
      setHabits(habits.map(h => h._id === habitId ? data.habit : h));
      // Inform other parts of the app (DailyToDoList) to refresh tasks
      window.dispatchEvent(new Event('app:habits-updated'));
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  

  // Render Streak Dots
  const renderStreak = (habit) => {
    const today = DateTime.now().setZone('Asia/Kolkata');
    const startDate = habit.streak.length > 0
      ? DateTime.fromISO(habit.streak[0].date, { zone: 'Asia/Kolkata' })
      : today;
    
    // We'll show last 7 days + next 7 days for a cleaner UI, or kept 21 as per your code
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = startDate.plus({ days: i });
      return date.toISODate();
    });

    return days.map((date) => {
      const entry = habit.streak?.find(e => e.date === date);
      const isMissed = entry && !entry.completed;
      const isFuture = date > today.toISODate();
      
      let dotColor = "bg-zinc-800 border-zinc-700"; // Default/Future
      if (!isFuture) {
        if (entry?.completed) dotColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border-emerald-500";
        else if (isMissed) dotColor = "bg-red-500/20 border-red-500/50";
        else dotColor = "bg-zinc-800 border-zinc-600 hover:border-zinc-400 cursor-pointer"; // Today/Past Empty
      }

      return (
        <div
          key={date}
          onClick={() => !isFuture && updateStreak(habit._id, date, !entry?.completed)}
          title={date}
          className={`w-3 h-3 rounded-full border transition-all duration-200 ${dotColor}`}
        ></div>
      );
    });
  };

  // --- RENDER SECTION ---
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden p-6 md:p-12">
      
      {/* 1. BACKGROUND: Starfield Animation */}
      <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none"></div>
      
      {/* Decorative Planet Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-4xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-widest flex items-center gap-4">
            <CheckCircle2 className="text-cyan-400" size={36} />
            Habit Protocol
          </h2>
          <p className="text-cyan-200/70 font-mono text-lg mt-2 tracking-wider">
            COMMANDER: {userEmail.split('@')[0].toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="px-3 py-2 bg-cyan-900/20 border border-cyan-500/30 rounded flex items-center gap-3">
            <Calendar className="text-cyan-300" size={18} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-cyan-300 font-pixel uppercase">TODAY</span>
              <span className="text-sm font-pixel text-white">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-6 mb-8 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">New Protocol</label>
            <input
              type="text"
              placeholder="e.g. Read 10 pages..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-transparent border border-cyan-700 rounded p-3 text-white placeholder-cyan-800 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="w-48 space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-transparent border border-cyan-700 rounded p-3 text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="Health">Health</option>
              <option value="Productivity">Productivity</option>
              <option value="Learning">Learning</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-3 rounded font-bold transition-colors flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} /> Add
          </button>
        </form>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 gap-4">
        {habits.length === 0 ? (
          <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
            No active protocols initialized.
          </div>
        ) : (
          habits.map(habit => (
            <div key={habit._id} className="bg-black/40 border border-cyan-700/40 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500 transition-all group">
              {/* Left: Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                    ${habit.category === 'Health' ? 'border-cyan-700 text-cyan-300 bg-cyan-900/10' : 
                      habit.category === 'Productivity' ? 'border-purple-700 text-purple-300 bg-purple-900/10' :
                      'border-cyan-700 text-cyan-300'}`
                  }>
                    {habit.category}
                  </span>
                  <h3 className="text-lg font-medium text-zinc-100 group-hover:text-white">{habit.name}</h3>
                </div>
                <div className="flex items-center gap-6 text-xs text-zinc-500 font-mono">
                  <span className="flex items-center gap-1"><Flame size={12} className="text-cyan-400"/> Streak: {habit.streak?.filter(e => e.completed).length || 0}</span>
                  <span>Target: 21 Days</span>
                </div>
              </div>

              {/* Right: Dots */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">{renderStreak(habit)}</div>
                <button
                  onClick={() => deleteHabit(habit._id)}
                  title="Delete habit"
                  className="text-red-500 hover:text-red-400 ml-2 p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HabitTracker;