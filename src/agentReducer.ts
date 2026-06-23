export function applyAgentActions(tasks: any[], actions: any[]) {
  const newTasks = [...tasks];
  const completedTaskIds = new Set<string>();

  actions.forEach(action => {
    if (action.name === 'createTask') {
      const { title, priority, dueDate, urgency } = action.args;
      newTasks.push({
        id: crypto.randomUUID(),
        title,
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        urgency: urgency || 5,
        subtasks: [],
        createdAt: new Date().toISOString(),
        lastTouched: new Date().toISOString()
      });
    } else if (action.name === 'rescheduleTask') {
      const { taskId, newDueDate } = action.args;
      const idx = newTasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        newTasks[idx] = { 
          ...newTasks[idx], 
          dueDate: newDueDate, 
          lastTouched: new Date().toISOString() 
        };
      }
    } else if (action.name === 'setPriority') {
      const { taskId, priority } = action.args;
      const idx = newTasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        newTasks[idx] = { 
          ...newTasks[idx], 
          priority, 
          lastTouched: new Date().toISOString() 
        };
      }
    } else if (action.name === 'completeTask') {
      const { taskId } = action.args;
      // We don't remove it here, we just mark it for completion. The caller (App.tsx)
      // will handle moving it to done.
      const idx = newTasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        completedTaskIds.add(taskId);
      }
    }
  });

  return { newTasks, completedTaskIds: Array.from(completedTaskIds) };
}
