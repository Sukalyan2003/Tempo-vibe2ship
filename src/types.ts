export interface Subtask {
  title: string;
  estimatedMinutes?: number;
  completed?: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
  dueDate?: string;
  completedAt?: string;
  urgency: number;
  draft?: string;
  subtasks: (string | Subtask)[];
  snoozedUntil?: string;
  dismissed?: boolean;
  createdAt?: string;
  lastTouched?: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly';
  completedDates: string[]; // ISO date strings
  streak: number;
}

