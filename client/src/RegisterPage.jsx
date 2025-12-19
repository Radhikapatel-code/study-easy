import './index.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import Header from './components/Header';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|ac\.in|edu\.in|org|edu)$/;
    const phoneRegex = /^\d{10}$/;

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Phone number must be 10 digits';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.password = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      console.log('Sending request with data:', formData);
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response. Is the backend running?');
      }
      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        setErrors(data.errors || { server: `Registration failed: ${response.status} ${response.statusText}` });
        return;
      }

      alert(data.message);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ server: 'Registration failed: ' + error.message });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col p-6 font-pixel text-white">
      {/* Header with Branding */}
      <Header />
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto mt-10 flex flex-1 items-center justify-center">
        <div className="bg-black/60 border border-cyan-700/20 rounded-lg p-8 w-full max-w-md text-center relative z-10">
          <div className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-500/30">
            <CheckCircle2 className="text-cyan-400" size={56} />
          </div>
          <h2 className="text-2xl mb-4 text-white">REGISTER</h2>
          <div className="mb-4 text-left">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
          <div className="mb-4 text-left">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          <div className="mb-4 text-left">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
              pattern="[0-9]*"
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
              }}
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>
          <div className="mb-4 text-left">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>
          <div className="mb-4 text-left">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 rounded bg-transparent border border-cyan-700 text-white placeholder-cyan-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          {errors.server && <p className="text-red-500 text-sm mb-4">{errors.server}</p>}
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold mb-3 hover:scale-[1.01] transition-transform"
          >
            SUBMIT
          </button>
          <p className="text-sm text-cyan-300">
            Already a user? <Link to="/login" className="underline text-white">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;