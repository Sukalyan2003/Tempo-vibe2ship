import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentChat } from '../components/AgentChat';
import { ToastProvider } from '../components/ToastContext';

describe('AgentChat', () => {
  it('holds multi-action results pending until approval, not calling reducer beforehand', async () => {
    // Mock fetch to return a mutative action
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        calls: [
          { name: 'createTask', args: { title: 'First task' } },
          { name: 'createTask', args: { title: 'Second task' } }
        ]
      })
    });

    const mockExecute = vi.fn();
    const mockPlanDay = vi.fn();

    render(
      <ToastProvider>
        <AgentChat tasks={[]} onExecuteAgentActions={mockExecute} onPlanDay={mockPlanDay} />
      </ToastProvider>
    );

    // Send a prompt
    const input = screen.getByPlaceholderText(/e\.g\./i);
    fireEvent.change(input, { target: { value: 'Create two tasks' } });
    fireEvent.click(screen.getByRole('button', { name: /send command/i }));

    // Wait for the API to resolve and pending UI to show
    await waitFor(() => {
      expect(screen.getByText(/Tempo proposes the following actions/i)).toBeInTheDocument();
    });

    // The execute callback should NOT have been called yet!
    expect(mockExecute).not.toHaveBeenCalled();

    // Now approve it
    fireEvent.click(screen.getByText(/Approve All/i));

    // Now it should be called
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledWith([
      { name: 'createTask', args: { title: 'First task' } },
      { name: 'createTask', args: { title: 'Second task' } }
    ]);
  });
});
