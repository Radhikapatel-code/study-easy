import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './index.css';
import { User } from 'lucide-react';
import Header from './components/Header';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const response = await fetch('https://study-easy.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        // Likely an HTML error page (server down or proxy issue)
        throw new Error('Server returned non-JSON response. Is the backend running?');
      }
      const data = await response.json();
      if (response.ok) {
        // Save email and navigate to Daily To-Do after successful login
        try { localStorage.setItem('userEmail', formData.email); } catch (e) { /* ignore */ }
        navigate('/daily-todo', { state: { email: formData.email } });
      } else {
        setErrors({ server: data.msg || data.error || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ server: 'Login failed: ' + error.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] relative flex flex-col items-center p-6 font-pixel text-white">
      <Header />
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto mt-10 flex items-center justify-center">
          <div className="bg-black/60 border border-cyan-700/20 rounded-lg p-6 w-full max-w-md relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center border-2 border-cyan-500/30 rounded-full">
            <User className="text-cyan-400" size={40} />
          </div>
          <h2 className="text-2xl text-center mb-4 text-white">Login</h2>
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>
          {errors.server && <p className="text-red-500 text-sm mb-4">{errors.server}</p>}
          <button
            type="submit"
            className="w-full px-6 py-3 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold mb-2 hover:scale-[1.01] transition-transform"
          >
            Login
          </button>
          </form>
          <p className="text-center text-sm text-cyan-300">
            Don't have an account? <Link to="/register" className="text-white underline">Register</Link>
          </p>
        </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;