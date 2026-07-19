const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return res;
}
