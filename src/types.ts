export interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
  urgency: number;
  subtasks: string[];
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly';
  completedDates: string[]; // ISO date strings
  streak: number;
}

