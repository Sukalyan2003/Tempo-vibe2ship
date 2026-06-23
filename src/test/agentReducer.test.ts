import { describe, it, expect } from 'vitest';
import { applyAgentActions } from '../agentReducer';

describe('agentReducer', () => {
  it('handles createTask by generating uuid and defaults', () => {
    const { newTasks } = applyAgentActions([], [
      { name: 'createTask', args: { title: 'New Task' } }
    ]);
    expect(newTasks.length).toBe(1);
    expect(newTasks[0].id).toBeDefined();
    expect(newTasks[0].title).toBe('New Task');
    expect(newTasks[0].priority).toBe('Medium');
    expect(newTasks[0].urgency).toBe(5);
    expect(newTasks[0].subtasks).toEqual([]);
    expect(newTasks[0].dueDate).toBeNull();
  });

  it('handles rescheduleTask by updating the target task and skipping unknown', () => {
    const initialTasks = [
      { id: '1', title: 'Task 1', dueDate: null }
    ];
    const { newTasks } = applyAgentActions(initialTasks, [
      { name: 'rescheduleTask', args: { taskId: '1', newDueDate: '2025-01-01T00:00:00Z' } },
      { name: 'rescheduleTask', args: { taskId: 'non-existent', newDueDate: '2025-01-01T00:00:00Z' } }
    ]);
    expect(newTasks[0].dueDate).toBe('2025-01-01T00:00:00Z');
    expect(newTasks.length).toBe(1);
  });

  it('handles completeTask by adding it to completedTaskIds and not deleting it immediately', () => {
    const initialTasks = [
      { id: '1', title: 'Task 1' }
    ];
    const { newTasks, completedTaskIds } = applyAgentActions(initialTasks, [
      { name: 'completeTask', args: { taskId: '1' } }
    ]);
    expect(newTasks.length).toBe(1);
    expect(completedTaskIds).toContain('1');
  });
});
