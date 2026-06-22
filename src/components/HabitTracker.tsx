import React, { useState } from 'react';
import { Habit } from '../types';
import { Plus, Check, Flame } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function HabitTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('tempo_habits', [
    { id: '1', title: 'Drink Water', frequency: 'Daily', completedDates: [], streak: 3 },
    { id: '2', title: 'Read 20 Mins', frequency: 'Daily', completedDates: [], streak: 1 },
  ]);
  const [newTitle, setNewTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      frequency: 'Daily',
      completedDates: [],
      streak: 0,
    };
    setHabits([...habits, newHabit]);
    setNewTitle('');
  };

  const toggleToday = (habitId: string) => {
    setHabits((prev) => 
      prev.map(h => {
        if (h.id !== habitId) return h;
        const isCompletedToday = h.completedDates.includes(todayStr);
        let newStreak = h.streak;
        
        let newCompletedDates = [...h.completedDates];
        if (isCompletedToday) {
          newCompletedDates = newCompletedDates.filter(d => d !== todayStr);
          newStreak = Math.max(0, newStreak - 1);
        } else {
          newCompletedDates.push(todayStr);
          newStreak += 1;
        }

        return { ...h, completedDates: newCompletedDates, streak: newStreak };
      })
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <Flame className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Habits</h2>
      </div>

      <div className="space-y-3 mb-6">
        {habits.map(habit => {
          const isDone = habit.completedDates.includes(todayStr);
          return (
            <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleToday(habit.id)}
                  title={isDone ? "Mark habit not done" : "Mark habit done"}
                  aria-label={isDone ? "Mark habit not done" : "Mark habit done"}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    isDone ? 'bg-orange-500 text-white' : 'border-2 border-gray-300 text-transparent hover:border-orange-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <span className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {habit.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                <Flame className="w-4 h-4" />
                {habit.streak}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddHabit} className="flex flex-col sm:flex-row gap-2">
        <input 
          type="text" 
          placeholder="New habit..." 
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="flex-1 rounded-xl border-gray-200 border px-3 py-3 sm:py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-gray-50 text-gray-900"
        />
        <button 
          type="submit"
          title="Add Habit"
          aria-label="Add Habit"
          disabled={!newTitle.trim()}
          className="bg-orange-500 text-white p-3 sm:p-2 rounded-xl flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-5 h-5 md:w-5 md:h-5" />
          <span className="sm:hidden font-medium ml-2">Add Habit</span>
        </button>
      </form>
    </div>
  );
}
