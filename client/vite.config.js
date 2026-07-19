import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
  },
  server: {
    proxy: {
      '/habits': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/sync-habits-to-tasks': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/cleanup-daily-tasks': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});