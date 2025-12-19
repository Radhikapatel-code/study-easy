import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Crosshair, 
  Shield,
  Clock,
  CheckCircle2
} from 'lucide-react';

function MonthlyPlanner() {
  const userEmail = localStorage.getItem('userEmail') || "radhika@demo.com";
  
  // STATE
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allTasks, setAllTasks] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. FETCH ALL TASKS ---
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://study-easy.onrender.com/tasks?userEmail=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const data = await response.json();
          setAllTasks(data);
        }
      } catch (error) {
        console.error("Radar malfunction:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllTasks();
  }, [userEmail]);

  // --- 2. CALENDAR MATH ---
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];
  let week = Array(7).fill(null);
  
  for (let i = 0; i < firstDay; i++) week[i] = null;
  
  days.forEach((day, i) => {
    week[(i + firstDay) % 7] = day;
    if ((i + firstDay) % 7 === 6 || i === days.length - 1) {
      weeks.push([...week]);
      week = Array(7).fill(null);
    }
  });

  // --- 3. HANDLERS ---
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const selectDate = (day) => {
    if (!day) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const offset = newDate.getTimezoneOffset();
    const correctedDate = new Date(newDate.getTime() - (offset*60*1000));
    
    setSelectedDate(correctedDate.toISOString().split('T')[0]);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    // --- NEW: Ask for extra details ---
    const timeInput = prompt("ENTER TIME (e.g. 14:00). Leave empty for no reminder:");
    if (timeInput === null) return; // User cancelled
    const timeTrim = (timeInput || '').trim();
    // Validate HH:MM 24-hour format if provided
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (timeTrim !== '' && !timeRegex.test(timeTrim)) {
      alert('Invalid time format. Please use HH:MM (24-hour). Entry aborted.');
      return;
    }
    
    const categoryInput = prompt("ENTER CATEGORY (e.g. Work, Health):");
    const detailsInput = prompt("ANY EXTRA DETAILS/NOTES?");
    // ----------------------------------

    try {
      const response = await fetch('https://study-easy.onrender.com/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          text: newTaskText,
          date: selectedDate,
          priority: 'medium',
          // Add new fields to payload
          time: timeTrim || '00:00',
          category: categoryInput || 'General',
          details: detailsInput || ''
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        setAllTasks([...allTasks, newTask]); 
        setNewTaskText('');
      }
    } catch (error) {
      console.error("Transmission failed:", error);
    }
  };

  // We intentionally do not consider regular daily tasks for calendar indicators here — only timed reminders
  const hasTaskOnDay = (day) => {
    if (!day) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const offset = checkDate.getTimezoneOffset();
    const correctedDate = new Date(checkDate.getTime() - (offset*60*1000)).toISOString().split('T')[0];
    return allTasks.some(t => t.date === correctedDate && t.time && t.time !== '00:00');
  };

  // Reminders: tasks with a specific time (not '00:00')
  const hasReminderOnDay = (day) => hasTaskOnDay(day); // alias — reminders are timed tasks

  // Only show reminders (timed entries) in the Monthly Planner logs
  const tasksForSelectedDate = allTasks.filter(t => t.date === selectedDate && t.time && t.time !== '00:00');

  return (
    // Added 'font-pixel' class (defined in style tag)
    <div 
      className="min-h-screen bg-[#050505] relative overflow-hidden p-6 md:p-12 text-white font-pixel"
    >
      {/* breathing hue overlay */}
      <div className="breathing-hue"></div>
      
      {/* INJECT PIXEL FONT */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        .font-pixel { font-family: 'VT323', monospace; font-size: 1.2rem; }
        /* Custom scrollbar for webkit */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1a1a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666; }
      `}</style>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-widest flex items-center gap-4">
              <CheckCircle2 className="text-cyan-400" size={40} /> 
              MISSION CALENDAR
            </h1>
            <p className="text-cyan-200/60 text-lg mt-2 tracking-widest">
              MONTHLY PLANNER // {currentMonth.getFullYear()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-cyan-900/20 border border-cyan-500/30 rounded flex items-center gap-3">
              <Calendar className="text-cyan-300" size={18} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-cyan-300 font-pixel uppercase">TODAY</span>
                <span className="text-sm font-pixel text-white">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT: THE CALENDAR --- */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 border border-purple-500/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              
              {/* Calendar Controls */}
              <div className="flex justify-between items-center mb-6">
                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full text-cyan-400 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-3xl text-white uppercase tracking-widest">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full text-cyan-400 transition-colors">
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="text-center text-lg text-purple-500/70 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {weeks.map((week, wIndex) => (
                  week.map((day, dIndex) => {
                    if (!day) return <div key={`empty-${wIndex}-${dIndex}`} className="aspect-square"></div>;
                    
                    const isSelected = selectedDate.endsWith(String(day).padStart(2, '0')) && 
                                       new Date(selectedDate).getMonth() === currentMonth.getMonth();
                    const hasTask = hasTaskOnDay(day);

                    return (
                      <div 
                        key={`day-${day}`}
                        onClick={() => selectDate(day)}
                        className={`
                          aspect-square relative border rounded-lg cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-2
                          ${isSelected 
                            ? 'bg-black/60 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                            : 'bg-black/30 border-white/5 hover:border-cyan-500/30 hover:bg-white/5'
                          }
                        `}
                      >
                        <span className={`text-2xl ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                          {day}
                        </span>
                        
                        {/* Reminder/Task Indicator */}
                        {hasReminderOnDay(day) ? (
                          <div className="mt-2 flex items-center gap-1">
                            <Clock size={12} className="text-purple-400" />
                            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.45)]"></div>
                          </div>
                        ) : hasTask && (
                          <div className="mt-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.25)] animate-pulse"></div>
                        )}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          </div>

          {/* --- RIGHT: SELECTED DATE LOGS --- */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-md rounded-xl p-6 flex-1 flex flex-col">
              
              <h3 className="text-2xl text-cyan-300 mb-4 border-b border-white/10 pb-4 font-pixel">
                LOGS — <span className="text-white">{selectedDate}</span>
              </h3>

              {/* Task List for Date */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-6 custom-scrollbar pr-2 max-h-[400px]">
                {tasksForSelectedDate.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <Shield size={32} className="mx-auto mb-2 text-zinc-600"/>
                    <p className="text-lg text-zinc-500">SECTOR CLEAR</p>
                  </div>
                ) : (
                  tasksForSelectedDate.map(task => (
                    <div key={task._id} className="bg-white/5 border border-white/10 p-3 rounded flex items-start gap-3 group hover:border-cyan-500/50 transition-colors">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${task.completed ? 'bg-cyan-400' : 'bg-purple-500'}`}></div>
                      <div className="w-full">
                        {/* Header: Time & Category */}
                        <div className="flex justify-between items-center text-sm mb-1 opacity-70">
                            <span className="text-cyan-300">[{task.time || '--:--'}]</span>
                            <span className="text-purple-300 uppercase">[{task.category || 'GEN'}]</span>
                        </div>
                        
                        {/* Main Text */}
                        <p className={`text-xl leading-none mb-1 ${task.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                          {task.text}
                        </p>

                        {/* Extra Details */}
                        {task.details && (
                             <p className="text-sm text-zinc-500 border-l-2 border-zinc-700 pl-2 mt-1 italic">
                                 {">"} {task.details}
                             </p>
                        )}

                        {task.isHabit && (
                          <span className="text-sm bg-purple-900/50 text-purple-300 px-1 rounded mt-2 inline-block">
                            HABIT_PROTOCOL
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Input */}
              <form onSubmit={handleAddTask} className="mt-auto">
                <div className="relative group">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="INITIATE NEW ENTRY..."
                    className="w-full bg-black/50 border border-cyan-900/50 rounded p-3 pl-10 text-xl text-cyan-100 placeholder-cyan-900 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <Crosshair size={20} className="absolute left-3 top-3.5 text-cyan-700 group-hover:text-cyan-400 transition-colors" />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 p-1.5 bg-cyan-900/30 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="text-xs text-center mt-2 text-zinc-600">
                    * PRESS ENTER FOR DETAILS CONFIGURATION
                </div>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MonthlyPlanner;