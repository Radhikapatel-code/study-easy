import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DailyToDoList from '../DailyToDoList';
import { apiFetch } from '../api';

// Mock the API and Socket dependencies
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../socket', () => ({
  connectSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
  disconnectSocket: vi.fn(),
}));

describe('DailyToDoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the apiFetch implementation
    apiFetch.mockImplementation(async (url) => {
      if (url.includes('/migrate-tasks-category')) {
        return { ok: true, json: async () => ({ message: 'Migrated' }) };
      }
      if (url.includes('/sync-habits-to-tasks')) {
        return { ok: true, json: async () => ({ message: 'Synced' }) };
      }
      if (url.includes('/tasks') && !url.includes('POST') && !url.includes('PUT')) {
        return {
          ok: true,
          json: async () => [
            { _id: '1', text: 'Test Task', priority: 'medium', completed: false, category: 'Work' }
          ]
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('renders tasks and toggles completion', async () => {
    render(<DailyToDoList />);

    // Wait for the task to appear
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    // Mock the toggle API call
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: '1', completed: true })
    });

    // Find the task row (the div containing the text)
    const taskText = screen.getByText('Test Task');
    const taskRow = taskText.closest('.animate-slide-up');
    
    // Click to toggle
    fireEvent.click(taskRow);

    // Verify API was called with PUT
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/tasks/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ completed: true })
      }));
    });
  });
});
