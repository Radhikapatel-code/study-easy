import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  StickyNote, 
  LogOut, 
  Box, 
  X,
  Menu,       
  PanelLeftClose, 
  GripHorizontal,
  User,
  Clock,      // New Icon
  Play,       // New Icon
  Pause,      // New Icon
  RotateCcw   // New Icon
} from 'lucide-react';
import Profile from './ProfilePage';

// Import your pages
import WelcomePage from './WelcomePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import HabitTracker from './HabitTracker';
import DailyToDoList from './DailyToDoList';
import MonthlyPlanner from './MonthlyPlanner';

const SystemShell = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // --- STATE: GLOBAL TOOLS (Initially OFF) ---
  const [showNote, setShowNote] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  // profile is now a full page route

  // --- LOGIC: STICKY NOTE DRAGGING ---
  const [notePos, setNotePos] = useState({ x: window.innerWidth - 350, y: 100 });
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const noteDragOffset = useRef({ x: 0, y: 0 });

  // --- LOGIC: FOCUS TIMER DRAGGING ---
  const [timerPos, setTimerPos] = useState({ x: window.innerWidth - 400, y: 200 });
  const [isDraggingTimer, setIsDraggingTimer] = useState(false);
  const timerDragOffset = useRef({ x: 0, y: 0 });

  // --- LOGIC: FOCUS TIMER FUNCTIONALITY ---
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsRunning(false);
            clearInterval(interval);
            // THE COMMANDER ALERT
            alert("Take a break, Commander."); 
          } else {
            setMinutes((m) => m - 1);
            setSeconds(59);
          }
        } else {
          setSeconds((s) => s - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds]);

  // Drag Handlers (Generic-ish)
  const handleMouseDown = (e, type) => {
    if (type === 'note') {
      setIsDraggingNote(true);
      noteDragOffset.current = { x: e.clientX - notePos.x, y: e.clientY - notePos.y };
    } else if (type === 'timer') {
      setIsDraggingTimer(true);
      timerDragOffset.current = { x: e.clientX - timerPos.x, y: e.clientY - timerPos.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingNote) {
      setNotePos({ x: e.clientX - noteDragOffset.current.x, y: e.clientY - noteDragOffset.current.y });
    }
    if (isDraggingTimer) {
      setTimerPos({ x: e.clientX - timerDragOffset.current.x, y: e.clientY - timerDragOffset.current.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNote(false);
    setIsDraggingTimer(false);
  };

  useEffect(() => {
    if (isDraggingNote || isDraggingTimer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingNote, isDraggingTimer]);


  const navItems = [
    { path: '/daily-todo', label: 'Daily Tasks', icon: CheckSquare },
    { path: '/habit-tracker', label: 'Habit Log', icon: LayoutDashboard },
    { path: '/monthly-planner', label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black opacity-80"></div>

      {/* SIDEBAR */}
      <aside className={`relative z-20 bg-black border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'} hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.4)]`}>
        <div className="p-8 pb-6 flex justify-between items-start">
          <div className="min-w-0"> 
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm shadow-white/20 shadow-lg"><Box size={20} strokeWidth={3} /></div>
              Study-Easy
            </h1>
            <p className="text-[10px] text-zinc-500 mt-3 uppercase tracking-widest pl-11">Workspace v2.0</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-600 hover:text-white ml-2"><PanelLeftClose size={18} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-300 border rounded-md group ${isActive ? 'bg-zinc-900 text-white border-zinc-700 font-medium shadow-md shadow-black/50' : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'}`}>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-indigo-400" : "group-hover:text-indigo-300 transition-colors"}/>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM ACTIONS (Memo + Timer) */}
        <div className="p-6 border-t border-zinc-900 space-y-2 bg-black/50">
          <Link to="/profile" className={`w-full flex items-center gap-3 text-sm font-medium transition-all p-2 rounded-md hover:bg-zinc-900 text-zinc-400`}> 
            <User size={18} /> <span>Profile</span>
          </Link>
          <button onClick={() => setShowNote(!showNote)} className={`w-full flex items-center gap-3 text-sm font-medium transition-all p-2 rounded-md hover:bg-zinc-900 ${showNote ? 'text-indigo-400 bg-zinc-900' : 'text-zinc-400'}`}>
            <StickyNote size={18} /> <span>{showNote ? 'Close Memo' : 'Quick Memo'}</span>
          </button>
          
          <button onClick={() => setShowTimer(!showTimer)} className={`w-full flex items-center gap-3 text-sm font-medium transition-all p-2 rounded-md hover:bg-zinc-900 ${showTimer ? 'text-indigo-400 bg-zinc-900' : 'text-zinc-400'}`}>
            <Clock size={18} /> <span>{showTimer ? 'Close Timer' : 'Focus Timer'}</span>
          </button>

          <Link to="/" className="w-full flex items-center gap-3 text-sm font-medium text-red-900 hover:text-red-400 transition-colors pt-4 px-2">
            <LogOut size={18} /> <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 scrollbar-hide">
        {!isSidebarOpen && (
          <div className="sticky top-0 z-30 p-6 flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-md text-white hover:bg-zinc-800 shadow-lg hover:border-zinc-600 transition-all ml-1">
              <Menu size={20} />
            </button>
          </div>
        )}
        <div className="p-0 text-zinc-100 w-full min-h-full">{children}</div>

        {/* --- GLOBAL TOOL: STICKY NOTE --- */}
        {showNote && (
          <div style={{ left: notePos.x, top: notePos.y, position: 'fixed' }} className="z-[50] w-80 bg-[#121212] border border-zinc-700 shadow-2xl shadow-black rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div onMouseDown={(e) => handleMouseDown(e, 'note')} className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 cursor-grab active:cursor-grabbing select-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2"><GripHorizontal size={14} className="opacity-50"/> Scratchpad</span>
              <button onClick={() => setShowNote(false)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
            </div>
            <textarea className="w-full h-72 bg-transparent p-5 font-pixel text-sm text-zinc-300 resize-none focus:outline-none placeholder-zinc-700 leading-relaxed custom-scrollbar" placeholder="// Drag me around..." defaultValue="> Update gradient background&#10;> Fix navbar contrast&#10;> Implemented drag feature!" onMouseDown={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* --- GLOBAL TOOL: FOCUS TIMER (EDITABLE) --- */}
        {showTimer && (
          <div style={{ left: timerPos.x, top: timerPos.y, position: 'fixed' }} className="z-[60] w-72 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 shadow-2xl shadow-black rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div onMouseDown={(e) => handleMouseDown(e, 'timer')} className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 cursor-grab active:cursor-grabbing select-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2"><Clock size={14}/> Focus Protocol</span>
              <button onClick={() => setShowTimer(false)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center">
              {/* EDITABLE TIME DISPLAY */}
              <div className="flex items-center text-5xl font-pixel font-bold text-white mb-6 tracking-tighter" onMouseDown={(e) => e.stopPropagation()}>
                <input 
                  type="number" 
                  value={String(minutes).padStart(2, '0')} 
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 bg-transparent text-center focus:outline-none focus:text-indigo-400 selection:bg-zinc-800 font-pixel"
                />
                <span className="pb-2">:</span>
                <input 
                  type="number" 
                  value={String(seconds).padStart(2, '0')} 
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-20 bg-transparent text-center focus:outline-none focus:text-indigo-400 selection:bg-zinc-800 font-pixel"
                />
              </div>

              <div className="flex gap-2 w-full">
                <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 py-3 rounded-md text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isRunning ? 'bg-red-500/10 text-red-500 border border-red-900/50 hover:bg-red-500/20' : 'bg-white text-black hover:bg-zinc-200'}`}>
                  {isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Start</>}
                </button>
                <button onClick={() => { setIsRunning(false); setMinutes(25); setSeconds(0); }} className="px-4 bg-zinc-800 text-zinc-400 rounded-md hover:text-white hover:bg-zinc-700 border border-zinc-700">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Profile is a full page at /profile */}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/habit-tracker" element={<SystemShell><HabitTracker /></SystemShell>} />
        <Route path="/daily-todo" element={<SystemShell><DailyToDoList /></SystemShell>} />
        <Route path="/monthly-planner" element={<SystemShell><MonthlyPlanner /></SystemShell>} />
        <Route path="/profile" element={<SystemShell><Profile /></SystemShell>} />
      </Routes>
    </Router>
  );
}

export default App;