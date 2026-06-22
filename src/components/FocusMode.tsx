import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Play, Pause, X, CheckCircle, Coffee } from 'lucide-react';
import { useToast } from './ToastContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface FocusModeProps {
  task: Task | null;
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
  onUpdateSubtask: (taskId: string, subtaskIdx: number, completed: boolean) => void;
}

export function FocusMode({ task, onClose, onCompleteTask, onUpdateSubtask }: FocusModeProps) {
  const { addToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeSubtaskIdx, setActiveSubtaskIdx] = useState<number>(0);
  const [sprintComplete, setSprintComplete] = useState(false);
  const [sprintCount, setSprintCount] = useLocalStorage('tempo_sprints', 0);

  const subtasks = task?.subtasks || [];
  const firstIncompleteIdx = subtasks.findIndex(s => typeof s === 'string' ? true : !s.completed);
  const targetIdx = firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0;
  const currentSubtask = subtasks[targetIdx];
  const subtaskTitle = currentSubtask ? (typeof currentSubtask === 'string' ? currentSubtask : currentSubtask.title) : null;

  useEffect(() => {
    if (task && task.id !== activeTaskId) {
      setActiveTaskId(task.id);
      setActiveSubtaskIdx(targetIdx);
      const mins = (typeof currentSubtask === 'object' && currentSubtask.estimatedMinutes) ? currentSubtask.estimatedMinutes : 25;
      setTimeLeft(mins * 60);
      setIsActive(false);
      setSprintComplete(false);
    } else if (task && targetIdx !== activeSubtaskIdx) {
      setActiveSubtaskIdx(targetIdx);
    }
  }, [task, activeTaskId, activeSubtaskIdx, targetIdx, currentSubtask]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (!sprintComplete) {
        setSprintComplete(true);
        setSprintCount(c => c + 1);
        addToast('Sprint complete! Time for a short break.', 'success');
        if (Notification.permission === 'granted') {
          new Notification('Sprint Complete', { body: 'Time for a short break (eyes/stretch/water)!' });
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, sprintComplete, setSprintCount, addToast]);

  if (!task) return null;

  const toggleTimer = () => {
    if (!isActive && timeLeft === 0) {
      const mins = (typeof currentSubtask === 'object' && currentSubtask.estimatedMinutes) ? Math.max(1, currentSubtask.estimatedMinutes) : 25;
      setTimeLeft(mins * 60);
      setSprintComplete(false);
      setIsActive(true);
      return;
    }
    setIsActive(!isActive);
  };
  const finishTask = () => {
    onCompleteTask(task.id);
    onClose();
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md">
      <button onClick={onClose} title="Close Focus Mode" aria-label="Close Focus Mode" className="absolute top-4 right-4 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors z-10">
        <X className="w-8 h-8" />
      </button>

      <div className="max-w-xl w-full text-center space-y-6 md:space-y-8 overflow-y-auto max-h-screen py-16 px-2 scrollbar-hide">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-4 uppercase tracking-widest">
            Focus Mode
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">{task.title}</h2>
          <p className="text-gray-400 text-lg">
            {subtaskTitle ? `Current focus: ${subtaskTitle}` : 'Remove all distractions. Focus on the task at hand.'}
          </p>
        </div>

        <div className="py-8">
          <div className="text-7xl md:text-[8rem] font-mono font-bold text-white tracking-tight tabular-nums">
            {minutes}:{seconds}
          </div>
          {sprintComplete && (
            <div className="mt-6 flex items-center justify-center gap-2 text-green-400 font-medium animate-pulse">
              <Coffee className="w-5 h-5" />
              <span>Sprint complete. Take a short 5m break (eyes / stretch / water).</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            title={isActive ? 'Pause timer' : 'Start timer'}
            aria-label={isActive ? 'Pause timer' : 'Start timer'}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-gray-900 hover:scale-105'
            }`}
          >
            {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
          
          <button
            onClick={finishTask}
            className="h-16 px-8 rounded-full flex items-center gap-2 bg-green-500 hover:bg-green-400 text-gray-900 font-bold transition-all hover:scale-105"
          >
            <CheckCircle className="w-5 h-5" />
            Mark Done
          </button>
        </div>

        {subtasks.length > 0 && (
          <div className="mt-12 text-left bg-white/5 rounded-3xl p-6 border border-white/10">
            <h3 className="text-white/70 text-sm uppercase tracking-wider font-semibold mb-4">Checklist</h3>
            <div className="space-y-3">
              {subtasks.map((sub, i) => {
                const title = typeof sub === 'string' ? sub : sub.title;
                const completed = typeof sub === 'object' ? sub.completed : false;
                return (
                  <label key={i} className="flex items-start gap-3 text-white/90 group cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-offset-gray-900 transition-all cursor-pointer shrink-0" 
                      checked={!!completed}
                      onChange={(e) => onUpdateSubtask(task.id, i, e.target.checked)}
                    />
                    <span className={`group-hover:text-white transition-colors ${completed ? 'line-through text-white/50' : ''}`}>{title}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
