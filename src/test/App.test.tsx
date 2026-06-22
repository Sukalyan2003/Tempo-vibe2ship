import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import * as ToastContext from '../components/ToastContext';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'Notification', { value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') } });

describe('App Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(ToastContext, 'useToast').mockReturnValue({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handleUpdateSubtask toggles completion for both string and object subtasks', () => {
    const taskId = 'test-id-1';
    window.localStorage.setItem('tempo_tasks', JSON.stringify([{
      id: taskId,
      title: 'Test',
      urgency: 5,
      priority: 'Medium',
      subtasks: ['Str Sub', { title: 'Obj Sub', estimatedMinutes: 10, completed: false }]
    }]));

    render(
      <ToastContext.ToastProvider>
        <App />
      </ToastContext.ToastProvider>
    );

    // Click "Focus Now" to open FocusMode
    const focusBtn = screen.getByText('Focus', { selector: 'button' });
    fireEvent.click(focusBtn);

    // Should render checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);

    // Click both
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // FocusMode checkbox now reflects state
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });
});
