import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(API_BASE, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    // Update token in case it changed (e.g., fresh login)
    s.auth = { token: localStorage.getItem('token') };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  socket = null;
}
