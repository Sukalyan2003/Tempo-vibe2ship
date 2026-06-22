import { Task } from '../types';
import { Play, Calendar, CheckCircle, Clock } from 'lucide-react';
import React from 'react';

interface TaskCardProps {
  task: Task;
  onExecute: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onFocus?: (task: Task) => void;
}

export function TaskCard({ task, onExecute, onComplete, onFocus }: TaskCardProps) {
  const isHighPriority = task.priority === 'High';
  
  return (
    <div className={`p-5 rounded-2xl border ${isHighPriority ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'} shadow-sm transition-all hover:shadow-md flex flex-col gap-4`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{task.title}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                task.priority === 'High' ? 'bg-red-100 text-red-700' :
                task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
             }`}>
               {task.priority} Priority
             </span>
             {task.deadline && (
               <span className="flex items-center gap-1">
                 <Calendar className="w-3.5 h-3.5" />
                 {task.deadline}
               </span>
             )}
             <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Urgency: {task.urgency}/10
             </span>
          </div>
        </div>
        <button 
          onClick={() => onComplete(task.id)}
          className="text-gray-400 hover:text-green-600 transition-colors p-1"
          title="Mark complete"
        >
          <CheckCircle className="w-6 h-6" />
        </button>
      </div>

      {task.subtasks.length > 0 && (
        <div className="bg-white/60 p-3 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Suggested Steps</p>
          <ul className="space-y-1">
            {task.subtasks.map((sub, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-gray-400 text-xs mt-0.5">•</span>
                {sub}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-2 flex gap-2">
        <button
          onClick={() => onExecute(task)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Play className="w-4 h-4 fill-current" />
          Proactive Execute
        </button>
        <button
          onClick={() => onFocus && onFocus(task)}
          className="flex items-center justify-center py-2.5 px-4 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 border border-indigo-100 transition-colors"
          title="Enter Focus Mode"
        >
          Focus
        </button>
      </div>
    </div>
  );
}
