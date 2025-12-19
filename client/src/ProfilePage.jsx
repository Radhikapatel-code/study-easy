import { useEffect, useState } from 'react';
import { CheckCircle2, Shield, Calendar, User, ArrowLeft, Activity, Award, Star } from 'lucide-react';

export default function ProfilePage() {
  const userEmail = localStorage.getItem('userEmail') || 'guest@demo.com';
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ habits: 0, tasksTotal: 0, tasksDoneToday: 0, habitsDoneToday: 0, completionRate: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
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
        const completionRate = tasksTotal === 0 ? 0 : Math.round((tasksAll.filter(t => t.completed).length / tasksTotal) * 100);

        setStats({ habits: habitsAll.length, tasksTotal, tasksDoneToday, habitsDoneToday, completionRate });
      } catch (err) {
        console.error('Profile fetch error', err);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [userEmail]);

  const belt = stats.completionRate >= 90 ? 'PLATINUM' : stats.completionRate >= 75 ? 'GOLD' : stats.completionRate >= 50 ? 'SILVER' : 'BRONZE';

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden p-6 md:p-12 text-white font-pixel">
      <div className="absolute inset-0 bg-starfield opacity-40 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
              <User size={34} className="text-black" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">COMMANDER {userEmail.split('@')[0].toUpperCase()}</h1>
              <p className="text-sm text-cyan-300 mt-1">Pilot log · STREAK & PERFORMANCE</p>
            </div>
          </div>
          <a href="/" className="px-3 py-2 rounded-md bg-black/50 border border-zinc-800 hover:bg-cyan-900/10 flex items-center gap-2 text-sm text-cyan-200"><ArrowLeft size={14}/> Dashboard</a>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/60 border border-zinc-800 rounded-xl p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-widest">Habits</div>
                <div className="text-3xl font-bold mt-2">{stats.habits}</div>
                <div className="text-sm text-zinc-400 mt-2">Completed today: <span className="text-white ml-2">{stats.habitsDoneToday}</span></div>
              </div>
              <div className="text-cyan-400"><CheckCircle2 size={36} /></div>
            </div>
          </div>

          <div className="bg-black/60 border border-zinc-800 rounded-xl p-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-widest">Tasks</div>
                <div className="text-3xl font-bold mt-2">{stats.tasksDoneToday}</div>
                <div className="text-sm text-zinc-400 mt-2">Total tasks: <span className="text-white ml-2">{stats.tasksTotal}</span></div>
              </div>
              <div className="text-purple-400"><Activity size={36} /></div>
            </div>
          </div>

          <div className="bg-black/60 border border-zinc-800 rounded-xl p-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400 uppercase tracking-widest">Belt</div>
                <div className="text-3xl font-bold mt-2">{belt}</div>
                <div className="text-sm text-zinc-400 mt-2">Completion: <span className="text-white ml-2">{stats.completionRate}%</span></div>
              </div>
              <div className="text-yellow-400"><Award size={36} /></div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-zinc-400 mb-2">Progress</div>
              <div className="w-full bg-white/5 h-3 rounded overflow-hidden">
                <div style={{ width: `${stats.completionRate}%` }} className="h-3 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black/60 border border-zinc-800 rounded-xl p-6 animate-slide-up">
          <h3 className="text-cyan-300 uppercase tracking-widest text-sm mb-4">Mission Log — Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-purple-400"><Star /></div>
              <div>
                <div className="text-sm text-white font-bold">Daily Focus secured</div>
                <div className="text-xs text-zinc-500">You completed 5 tasks this morning — excellent precision.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 text-cyan-400"><Calendar /></div>
              <div>
                <div className="text-sm text-white font-bold">Streak maintained</div>
                <div className="text-xs text-zinc-500">Habit streak extended by 1 day.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 text-amber-400"><Shield /></div>
              <div>
                <div className="text-sm text-white font-bold">Tasks completed</div>
                <div className="text-xs text-zinc-500">Overall completion rate: {stats.completionRate}%</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
