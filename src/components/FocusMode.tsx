import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Play, Pause, X, CheckCircle } from 'lucide-react';

interface FocusModeProps {
  task: Task | null;
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
}

export function FocusMode({ task, onClose, onCompleteTask }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (task) {
      setTimeLeft(25 * 60);
      setIsActive(false);
    }
  }, [task]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  if (!task) return null;

  const toggleTimer = () => setIsActive(!isActive);
  const finishTask = () => {
    onCompleteTask(task.id);
    onClose();
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md">
      <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
        <X className="w-8 h-8" />
      </button>

      <div className="max-w-xl w-full text-center space-y-8 animate-in zoom-in fade-in duration-300">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-4 uppercase tracking-widest">
            Focus Mode
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">{task.title}</h2>
          <p className="text-gray-400 text-lg">Remove all distractions. Focus on the task at hand.</p>
        </div>

        <div className="py-8">
          <div className="text-7xl md:text-[8rem] font-mono font-bold text-white tracking-tight tabular-nums">
            {minutes}:{seconds}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
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

        {task.subtasks.length > 0 && (
          <div className="mt-12 text-left bg-white/5 rounded-3xl p-6 border border-white/10">
            <h3 className="text-white/70 text-sm uppercase tracking-wider font-semibold mb-4">Checklist</h3>
            <div className="space-y-3">
              {task.subtasks.map((sub, i) => (
                <label key={i} className="flex items-start gap-3 text-white/90 group cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-offset-gray-900 transition-all cursor-pointer" />
                  <span className="group-hover:text-white transition-colors">{sub}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
