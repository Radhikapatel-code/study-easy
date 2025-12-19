import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Crosshair, 
  Zap, 
  Shield, 
  Calendar, 
  Activity, 
  Award, 
  Target, 
  ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming you use react-router for navigation

function Profile() {
  const userEmail = localStorage.getItem('userEmail') || "radhika@demo.com";
  
  // STATE: Stats instead of Tasks
  const [stats, setStats] = useState({ 
    habits: 0, 
    tasksTotal: 0, 
    tasksDoneToday: 0, 
    habitsDoneToday: 0, 
    completionRate: 0 
  });
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH LOGIC ---
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Parallel Fetch
        const [habRes, tasksTodayRes, tasksAllRes] = await Promise.all([
          fetch(`https://study-easy.onrender.com/habits?userEmail=${encodeURIComponent(userEmail)}`),
          fetch(`https://study-easy.onrender.com/tasks?userEmail=${encodeURIComponent(userEmail)}&date=${today}`),
          fetch(`https://study-easy.onrender.com/tasks?userEmail=${encodeURIComponent(userEmail)}`),
        ]);

        const habitsAll = habRes.ok ? await habRes.json() : [];
        const tasksToday = tasksTodayRes.ok ? await tasksTodayRes.json() : [];
        const tasksAll = tasksAllRes.ok ? await tasksAllRes.json() : [];

        const tasksDoneToday = tasksToday.filter(t => t.completed).length;
        const habitsDoneToday = tasksToday.filter(t => t.isHabit && t.completed).length;
        const tasksTotal = tasksAll.length;
        
        // Calculate Completion Rate
        const completionRate = tasksTotal === 0 ? 0 : Math.round((tasksAll.filter(t => t.completed).length / tasksTotal) * 100);

        setStats({ habits: habitsAll.length, tasksTotal, tasksDoneToday, habitsDoneToday, completionRate });
      } catch (err) {
        console.error('Profile fetch error', err);
        // Fallback for preview if server is offline
        setStats({ habits: 5, tasksTotal: 120, tasksDoneToday: 8, habitsDoneToday: 4, completionRate: 85 });
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [userEmail]);

  // --- 2. RANK LOGIC ---
  const rate = stats.completionRate;
  let rank = 'BRONZE';
  let rankColorClass = 'border-orange-700/50 bg-orange-900/10 text-orange-400';
  
  if (rate >= 90) { 
    rank = 'PLATINUM'; 
    rankColorClass = 'border-cyan-400/60 bg-cyan-900/10 text-cyan-300'; 
  } else if (rate >= 75) { 
    rank = 'GOLD'; 
    rankColorClass = 'border-yellow-500/60 bg-yellow-900/10 text-yellow-300'; 
  } else if (rate >= 50) { 
    rank = 'SILVER'; 
    rankColorClass = 'border-slate-400/60 bg-slate-900/10 text-slate-300'; 
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden p-6 md:p-12">
      
      {/* 1. BACKGROUND (Exact same as DailyToDoList) */}
      <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* 2. HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-widest flex items-center gap-4 animate-hologram">
              <Activity className="text-cyan-400" size={48} /> 
              PILOT PROFILE
            </h1>
            <p className="text-cyan-200/70 font-mono text-xl mt-2 tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 animate-ping rounded-full"></span>
              ID: {userEmail.split('@')[0].toUpperCase()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/">
                <button className="bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 px-6 py-2 rounded font-pixel uppercase flex items-center gap-2 transition-all">
                    <ArrowLeft size={18} /> DASHBOARD
                </button>
            </Link>
          </div>
        </div>

        {/* 3. PROFILE STATS GRID (Styled exactly like Task List Items) */}
        <div className="space-y-6">

          {/* ITEM 1: RANK CARD */}
          <div className={`group relative flex items-center justify-between p-6 border-2 transition-all duration-300 laser-border ${rankColorClass}`}>
             <div className="flex items-center gap-6">
                <div className={`w-16 h-16 flex items-center justify-center border-2 rounded-full ${rankColorClass.split(' ')[0]} bg-black/40`}>
                   <Award size={32} />
                </div>

                <div>
                   <h3 className="text-3xl font-pixel tracking-wider uppercase text-white">
                      CURRENT RANK: {rank}
                   </h3>
                   <div className="flex items-center gap-3 mt-1">
                      <span className={`text-sm font-mono tracking-widest uppercase ${rankColorClass.split(' ')[2]}`}>
                         [COMPLETION RATE: {stats.completionRate}%]
                      </span>
                   </div>
                   {/* Progress Bar styled as text underline or separate element */}
                   <div className="w-64 h-2 bg-black/50 mt-2 border border-white/10 relative overflow-hidden">
                      <div className={`h-full ${rank === 'PLATINUM' ? 'bg-cyan-400' : rank === 'GOLD' ? 'bg-yellow-400' : 'bg-orange-600'}`} style={{ width: `${stats.completionRate}%` }}></div>
                   </div>
                </div>
             </div>

             {/* Corner Accents */}
             <div className={`absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 opacity-50 group-hover:opacity-100 ${rank === 'PLATINUM' ? 'border-cyan-500' : 'border-yellow-500'}`}></div>
             <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 opacity-50 group-hover:opacity-100 ${rank === 'PLATINUM' ? 'border-cyan-500' : 'border-yellow-500'}`}></div>
          </div>

          {/* ITEM 2: MISSION STATS (Tasks) */}
          <div className="group relative flex items-center justify-between p-6 border-2 border-red-500/60 bg-red-900/10 hover:border-red-400 hover:bg-red-900/20 transition-all duration-300 laser-border">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 flex items-center justify-center border-2 border-red-500 bg-transparent text-red-500">
                   <Target size={24} />
                </div>

                <div>
                   <h3 className="text-2xl font-pixel tracking-wider uppercase text-white">
                      MISSION LOG
                   </h3>
                   <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-mono text-red-300 tracking-widest flex items-center gap-2">
                         [DAILY OPS: {stats.tasksDoneToday}]
                      </span>
                      <span className="text-sm font-mono text-red-300 tracking-widest flex items-center gap-2">
                         [TOTAL: {stats.tasksTotal}]
                      </span>
                   </div>
                </div>
             </div>
             
             {/* Corner Accents */}
             <div className="absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 border-red-500 opacity-50 group-hover:opacity-100"></div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 border-red-500 opacity-50 group-hover:opacity-100"></div>
          </div>

          {/* ITEM 3: HABIT STATS */}
          <div className="group relative flex items-center justify-between p-6 border-2 border-purple-500/50 bg-purple-900/10 hover:border-purple-400 hover:bg-purple-900/20 transition-all duration-300 laser-border">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 flex items-center justify-center border-2 border-purple-600 bg-transparent text-purple-400">
                   <Zap size={24} />
                </div>

                <div>
                   <h3 className="text-2xl font-pixel tracking-wider uppercase text-white">
                      HABIT PROTOCOLS
                   </h3>
                   <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-mono text-purple-300 tracking-widest flex items-center gap-2">
                         [ACTIVE: {stats.habits}]
                      </span>
                      <span className="text-sm font-mono text-purple-300 tracking-widest flex items-center gap-2">
                         [COMPLETED TODAY: {stats.habitsDoneToday}]
                      </span>
                   </div>
                </div>
             </div>

             {/* Corner Accents */}
             <div className="absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 border-purple-500 opacity-50 group-hover:opacity-100"></div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 border-purple-500 opacity-50 group-hover:opacity-100"></div>
          </div>

          {/* ITEM 4: ACHIEVEMENTS (Static placeholder matching style) */}
          <div className="group relative flex items-center justify-between p-6 border-2 border-cyan-400/60 bg-cyan-900/10 hover:border-cyan-300 hover:bg-cyan-900/20 transition-all duration-300 laser-border">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 flex items-center justify-center border-2 border-cyan-800 bg-transparent text-cyan-400">
                   <Shield size={24} />
                </div>

                <div>
                   <h3 className="text-2xl font-pixel tracking-wider uppercase text-white">
                      DATA CHIPS ACQUIRED
                   </h3>
                   <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-pixel bg-cyan-900/40 text-cyan-300 border border-cyan-600 px-2 py-0.5 rounded uppercase">
                        TASK_MASTER
                      </span>
                      <span className="text-xs font-pixel bg-purple-900/40 text-purple-300 border border-purple-600 px-2 py-0.5 rounded uppercase">
                        STREAK_KEEPER
                      </span>
                      <span className="text-xs font-pixel bg-green-900/40 text-green-300 border border-green-600 px-2 py-0.5 rounded uppercase">
                        EARLY_BIRD
                      </span>
                   </div>
                </div>
             </div>

             {/* Corner Accents */}
             <div className="absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 border-cyan-500 opacity-50 group-hover:opacity-100"></div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 border-cyan-500 opacity-50 group-hover:opacity-100"></div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;