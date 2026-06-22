import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../components/TaskCard';
import { Task } from '../types';

const mockTask: Task = {
  id: 't1',
  title: 'Pay electricity bill',
  priority: 'High',
  urgency: 9,
  subtasks: ['Find bill', 'Log into portal'],
  deadline: 'Friday',
};

describe('TaskCard', () => {
  it('renders task details correctly', () => {
    const onExecute = vi.fn();
    const onComplete = vi.fn();
    
    render(<TaskCard task={mockTask} onExecute={onExecute} onComplete={onComplete} />);
    
    expect(screen.getByText('Pay electricity bill')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Find bill')).toBeInTheDocument();
  });

  it('calls onExecute when action button is clicked', () => {
    const onExecute = vi.fn();
    const onComplete = vi.fn();
    
    render(<TaskCard task={mockTask} onExecute={onExecute} onComplete={onComplete} />);
    
    const execBtn = screen.getByText('Proactive Execute');
    fireEvent.click(execBtn);
    
    expect(onExecute).toHaveBeenCalledWith(mockTask);
  });
});
