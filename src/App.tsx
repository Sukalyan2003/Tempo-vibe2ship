import React, { useState } from 'react';
import { Task } from './types';
import { BrainDump } from './components/BrainDump';
import { TaskCard } from './components/TaskCard';
import { ActionModal } from './components/ActionModal';
import { HabitTracker } from './components/HabitTracker';
import { DailyPlanner } from './components/DailyPlanner';
import { FocusMode } from './components/FocusMode';
import { Target, CheckCircle2, Calendar as CalendarIcon, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tempo_tasks', []);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; taskTile: string; content: string; isLoading: boolean }>({
    isOpen: false,
    taskTile: '',
    content: '',
    isLoading: false,
  });

  const handleBrainDumpSubmit = async (text: string) => {
    try {
      const response = await fetch('/api/gemini/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setTasks((prev) => [...prev, ...data.result]);
      } else {
        throw new Error(data.error || 'Failed to parse tasks');
      }
    } catch (e: any) {
      console.error(e);
      alert(`API Error: ${e.message}\nMake sure your Gemini API key is active. Note: It's completely free to use via AI Studio, no credit card required.`);
    }
  };

  const handleExecute = async (task: Task) => {
    setActionModal({ isOpen: true, taskTile: task.title, content: '', isLoading: true });
    try {
      const response = await fetch('/api/gemini/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task: task.title, 
          action: `Draft a solution, outline, or quick start guide based on the subtasks: ${task.subtasks.join(', ')}` 
        }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setActionModal((prev) => ({ ...prev, content: data.result, isLoading: false }));
      } else {
        throw new Error(data.error || 'Action failed to execute');
      }
    } catch (e: any) {
      console.error(e);
      setActionModal((prev) => ({ ...prev, content: `Error: ${e.message}`, isLoading: false }));
    }
  };

  const handleComplete = (taskId: string) => {
    setTasks((prev) => prev.filter(t => t.id !== taskId));
  };

  const sortedTasks = [...tasks].sort((a, b) => b.urgency - a.urgency);
  const urgentTasks = sortedTasks.filter(t => t.urgency >= 7 || t.priority === 'High');
  const normalTasks = sortedTasks.filter(t => t.urgency < 7 && t.priority !== 'High');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-24">
      <header className="px-6 py-8 md:py-12 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Target className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tempo</h1>
          </div>
          <p className="text-gray-500 font-medium">Your proactive priority assistant.</p>
        </div>
        
        <button
          onClick={() => setIsCalendarConnected(!isCalendarConnected)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isCalendarConnected 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          {isCalendarConnected ? (
            <>
              <CalendarIcon className="w-4 h-4 text-green-600" />
              Calendar Synced
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Connect Google Calendar
            </>
          )}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-12">
          <section>
            <BrainDump onSubmit={handleBrainDumpSubmit} />
          </section>

          {tasks.length > 0 ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {urgentTasks.length > 0 && (
                <section>
                   <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 rounded-full h-6 bg-red-500 mr-2"></div>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Urgent & High Priority</h2>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {urgentTasks.map(task => (
                        <TaskCard key={task.id} task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={setFocusTask} />
                      ))}
                   </div>
                </section>
              )}

              {normalTasks.length > 0 && (
                <section>
                   <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 rounded-full h-6 bg-indigo-500 mr-2"></div>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Up Next</h2>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {normalTasks.map(task => (
                        <TaskCard key={task.id} task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={setFocusTask} />
                      ))}
                   </div>
                </section>
              )}
            </div>
          ) : (
            <div className="py-24 text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-indigo-500" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">Inbox Zero Achieved</h3>
               <p className="text-gray-500 max-w-sm mx-auto">Drop your thoughts in the brain dump above when you're ready to plan your next moves.</p>
            </div>
          )}
        </div>
        
        <aside>
          <div className="sticky top-8 space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Productivity Score</div>
                <div className="text-3xl font-bold text-gray-900">{tasks.length === 0 ? '100' : Math.max(0, 100 - (tasks.length * 5))}%</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            {isCalendarConnected && (
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 border border-indigo-100 shadow-sm">
                <div className="text-sm font-medium text-indigo-800 mb-1">Up Next on Calendar</div>
                <div className="text-lg font-bold text-gray-900 break-words mb-2">Project Check-in</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  In 45 minutes
                </div>
              </div>
            )}
            <HabitTracker />
            <DailyPlanner tasks={tasks} />
          </div>
        </aside>
      </main>

      <ActionModal 
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        title={actionModal.taskTile}
        content={actionModal.content}
        isLoading={actionModal.isLoading}
      />
      
      <FocusMode 
        task={focusTask}
        onClose={() => setFocusTask(null)}
        onCompleteTask={handleComplete}
      />
    </div>
  );
}
