import { useState, useEffect } from 'react';
import { CheckCircle2, Crosshair, Check, Zap, Trash2, Shield, Calendar } from 'lucide-react';

function DailyToDoList() {
  const userEmail = localStorage.getItem('userEmail') || "radhika@demo.com";
  
  // FIX 1: We need a state for the selected date to filter tasks correctly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ title: '', category: 'Work', priority: 'medium' });
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH & SYNC LOGIC ---
  useEffect(() => {
    fetchTasks();
  }, [userEmail, selectedDate]); // Refetch when date changes

  // Run migration on component mount to add category to old tasks
  useEffect(() => {
    const runMigration = async () => {
      try {
        const res = await fetch('/migrate-tasks-category', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          console.log('Migration result:', data);
        }
      } catch (err) {
        console.error('Migration error (non-critical):', err);
      }
    };
    runMigration();
  }, []);

  // Listen for habit/task updates coming from other components
  useEffect(() => {
    const onHabitsUpdated = () => fetchTasks();
    window.addEventListener('app:habits-updated', onHabitsUpdated);
    window.addEventListener('app:tasks-updated', onHabitsUpdated);
    return () => {
      window.removeEventListener('app:habits-updated', onHabitsUpdated);
      window.removeEventListener('app:tasks-updated', onHabitsUpdated);
    };
  }, [userEmail, selectedDate]);

  // --- 2. CREATE TASK LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    // Always use today's date for daily to-do list
    const dateToSend = new Date().toISOString().split('T')[0];
    
    try {
      const response = await fetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                text: formData.title, // Backend expects 'text'
                date: dateToSend,     // Always today
                category: formData.category || 'Work',
                priority: formData.priority || 'medium'
            })
        });

        if (response.ok) {
            const newTask = await response.json();
            // Refetch tasks to ensure sorting is applied
            await fetchTasks();
            // Notify habits/habit-tracker that tasks changed (in case it's a linked habit)
            window.dispatchEvent(new Event('app:tasks-updated'));
            setFormData({ title: '', category: 'Work', priority: 'medium' });
        }
    } catch (err) { console.error("Save failed", err); }
  };

  // --- 3. TOGGLE/SYNC LOGIC ---
  const toggleTask = async (id, currentStatus) => {
    // Optimistic Update (Instant feedback)
    setTasks(tasks.map(t => t._id === id ? { ...t, completed: !currentStatus } : t));

    try {
        // This PUT request triggers the Server Sync Logic we wrote!
      await fetch(`/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !currentStatus })
        });
      // Inform habit tracker that a linked habit may have been updated
      window.dispatchEvent(new Event('app:tasks-updated'));
    } catch (err) {
        console.error("Toggle failed", err);
        // Revert on error
        setTasks(tasks.map(t => t._id === id ? { ...t, completed: currentStatus } : t));
    }
  };

  // --- 4. DELETE LOGIC ---
  const deleteTask = async (id, e) => {
    e.stopPropagation(); // Stop the click from toggling the task
    // Optimistic update
    setTasks(tasks.filter(t => t._id !== id));
    try {
        console.log(`Deleting task: ${id}`);
        const response = await fetch(`/tasks/${id}`, { method: 'DELETE' });
        console.log(`Delete response status: ${response.status}`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log('Task deleted from DB:', data);
        window.dispatchEvent(new Event('app:tasks-updated'));
    } catch (err) { 
        console.error('Delete failed:', err);
        // Refetch to restore UI if delete failed
        await fetchTasks();
    }
  };

  // FETCH function extracted so it can be invoked by events
  async function fetchTasks() {
    try {
      setLoading(true);

      // A. Trigger the Sync (Creates daily tasks for your habits)
      await fetch('/sync-habits-to-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail })
      });

      // B. Fetch Tasks for the specific date
      const response = await fetch(`/tasks?userEmail=${encodeURIComponent(userEmail)}&date=${selectedDate}`);
      if (response.ok) {
         const data = await response.json();
         setTasks(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  // Sort tasks: incomplete at top (sorted by priority), completed at bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Both completed or both incomplete: sort by priority (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityA = priorityOrder[a.priority] || 2;
    const priorityB = priorityOrder[b.priority] || 2;
    return priorityB - priorityA;
  });

  // Get color classes based on priority
  const getPriorityColor = (priority, completed) => {
    if (completed) return 'border-green-900/50 bg-black/60';
    if (priority === 'high') return 'border-red-500/60 bg-red-900/10 hover:border-red-400 hover:bg-red-900/20';
    if (priority === 'medium') return 'border-cyan-400/60 bg-cyan-900/10 hover:border-cyan-300 hover:bg-cyan-900/20';
    return 'border-purple-500/50 bg-purple-900/10 hover:border-purple-400 hover:bg-purple-900/20';
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden p-6 md:p-12">
      
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* 2. HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-widest flex items-center gap-4 animate-hologram">
              <CheckCircle2 className="text-cyan-400" size={48} /> 
              Mission Board
            </h1>
            <p className="text-cyan-200/70 font-mono text-xl mt-2 tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 animate-ping rounded-full"></span>
              COMMANDER: {userEmail.split('@')[0].toUpperCase()}
            </p>
          </div>
          {/* Today's Date Display (standardized) */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-cyan-900/20 border border-cyan-500/30 rounded flex items-center gap-3">
              <Calendar className="text-cyan-300" size={18} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-cyan-300 font-pixel uppercase">TODAY</span>
                <span className="text-sm font-pixel text-white">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. INPUT BAR */}
        <form onSubmit={handleSubmit} className="mb-16">
          <div className="space-y-3">
            <div className="relative flex items-center bg-white/5 border border-cyan-500/50 p-1 rounded-none backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-500 group">
              <div className="pl-4 pr-2 text-cyan-500 animate-pulse">
                 <Crosshair size={24} />
              </div>

              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="ENTER MISSION OBJECTIVE..."
                className="flex-1 bg-transparent px-2 py-3 text-xl font-pixel text-white placeholder-cyan-800 focus:outline-none uppercase tracking-widest"
              />
            </div>
            
            <div className="flex items-center gap-2 justify-end">
               <select 
                 value={formData.category}
                 onChange={(e) => setFormData({...formData, category: e.target.value})}
                 className="bg-black/50 text-cyan-300 text-sm focus:outline-none font-mono cursor-pointer px-3 py-2 border border-cyan-600 rounded hover:border-cyan-500 transition-colors"
                 title="Select task category"
               >
                 <option value="Work">WORK</option>
                 <option value="Health">HEALTH</option>
                 <option value="Learning">LEARNING</option>
                 <option value="Personal">PERSONAL</option>
                 <option value="Other">OTHER</option>
               </select>
               <select 
                 value={formData.priority}
                 onChange={(e) => setFormData({...formData, priority: e.target.value})}
                 className="bg-black/50 text-cyan-300 text-sm focus:outline-none font-mono cursor-pointer px-3 py-2 border border-cyan-600 rounded hover:border-cyan-500 transition-colors"
                 title="Select task priority"
               >
                 <option value="low">LOW</option>
                 <option value="medium">MEDIUM</option>
                 <option value="high">HIGH</option>
               </select>
               <button 
                 type="submit"
                 className="bg-cyan-600 hover:bg-cyan-500 text-black px-8 py-2 font-pixel text-sm uppercase transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
               >
                 ENGAGE
               </button>
            </div>
          </div>
        </form>

        {/* 4. TASK LIST */}
        <div className="space-y-6">
          {sortedTasks.map((task, index) => (
            <div 
              key={task._id}
              onClick={() => toggleTask(task._id, task.completed)}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`
                animate-slide-up group relative flex items-center justify-between p-6 border-2 cursor-pointer transition-all duration-300 laser-border
                ${task.completed 
                  ? 'border-green-900/50 opacity-50 grayscale' 
                  : getPriorityColor(task.priority, false)
                }
              `}
            >
              <div className="flex items-center gap-6">
                <div className={`
                  w-8 h-8 flex items-center justify-center border-2 transition-all duration-300
                  ${task.completed 
                    ? 'bg-green-500 border-green-500 text-black shadow-[0_0_15px_#22c55e]' 
                    : task.priority === 'high'
                    ? 'bg-transparent border-red-500 text-transparent group-hover:border-red-400'
                    : task.priority === 'low'
                    ? 'bg-transparent border-purple-600 text-transparent group-hover:border-purple-400'
                    : 'bg-transparent border-cyan-800 text-transparent group-hover:border-cyan-400'
                  }
                `}>
                  {task.completed ? <Check size={20} strokeWidth={4} /> : null}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-2xl font-pixel tracking-wider uppercase transition-all ${task.completed ? 'text-green-800 line-through' : 'text-white'}`}>
                      {task.text || task.title} 
                    </h3>
                    <span className={`text-xs font-pixel px-2 py-0.5 rounded uppercase tracking-wider ${
                      task.priority === 'high' ? 'bg-red-900/40 text-red-300 border border-red-600' :
                      task.priority === 'low' ? 'bg-purple-900/40 text-purple-300 border border-purple-600' :
                      'bg-cyan-900/40 text-cyan-300 border border-cyan-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    {task.category && (
                      <span className="text-sm font-mono text-blue-400 tracking-widest flex items-center gap-2">
                        [{(task.category || 'Work').toUpperCase()}]
                      </span>
                    )}
                    {!task.category && (
                      <span className="text-sm font-mono text-blue-400 tracking-widest flex items-center gap-2">
                        [WORK]
                      </span>
                    )}
                    {task.isHabit && (
                      <span className="text-xs font-pixel bg-pink-600 text-black px-2 py-0.5 flex items-center gap-1">
                        <Zap size={12} fill="black" /> RECURRING_HABIT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button (Now Functional) */}
              <button 
                 onClick={(e) => deleteTask(task._id, e)}
                 className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 hover:scale-110 duration-200"
              >
                <Trash2 size={24} />
              </button>

              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 border-cyan-500 opacity-50 group-hover:opacity-100"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 border-cyan-500 opacity-50 group-hover:opacity-100"></div>
            </div>
          ))}

          {!loading && tasks.length === 0 && (
             <div className="text-center py-24 border-2 border-dashed border-cyan-900/50 bg-black/30">
                <Shield className="mx-auto text-cyan-900 mb-4" size={48} />
                <p className="text-cyan-700 font-pixel text-xl animate-pulse">NO ACTIVE THREATS DETECTED</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DailyToDoList;