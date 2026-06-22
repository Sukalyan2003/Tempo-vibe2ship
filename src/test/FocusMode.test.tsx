import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusMode } from '../components/FocusMode';
import { Task } from '../types';
import * as ToastContext from '../components/ToastContext';

const mockTask: Task = {
  id: 't1',
  title: 'Pay electricity bill',
  priority: 'High',
  urgency: 9,
  subtasks: [{ title: 'Find bill', estimatedMinutes: 5 }],
};

describe('FocusMode', () => {
  it('toggles subtask completion', () => {
    const onUpdateSubtask = vi.fn();
    render(
      <ToastContext.ToastProvider>
        <FocusMode task={mockTask} onClose={vi.fn()} onCompleteTask={vi.fn()} onUpdateSubtask={onUpdateSubtask} />
      </ToastContext.ToastProvider>
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onUpdateSubtask).toHaveBeenCalledWith('t1', 0, true);
  });
});
