import { Task } from '../types';
import { Play, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';
import React from 'react';
import { useToast } from './ToastContext';

interface TaskCardProps {
  task: Task;
  onExecute: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onFocus?: (task: Task) => void;
  onUpdate?: (task: Task) => void;
}

export function TaskCard({ task, onExecute, onComplete, onFocus, onUpdate }: TaskCardProps) {
  const { addToast } = useToast();
  const [isBreakingDown, setIsBreakingDown] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleBreakdown = async (subtask: any) => {
    if (!onUpdate) return;
    const subtaskTitle = typeof subtask === 'string' ? subtask : subtask.title;
    setIsBreakingDown(subtaskTitle);
    try {
      const response = await fetch('/api/gemini/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: task.title, subtaskTitle })
      });
      const data = await response.json();
      if (response.ok && data.result) {
        // Replace this subtask with the new subtasks
        const newSubtasks = [...(task.subtasks || [])];
        const idx = newSubtasks.findIndex(s => (typeof s === 'string' ? s : s.title) === subtaskTitle);
        if (idx !== -1) {
          newSubtasks.splice(idx, 1, ...data.result);
          onUpdate({ ...task, subtasks: newSubtasks });
        }
      } else {
        throw new Error(data.error || 'Failed to breakdown subtask');
      }
    } catch (e: any) {
      console.error(e);
      addToast(`Breakdown failed: ${e.message}`, 'error');
    } finally {
      setIsBreakingDown(null);
    }
  };

  const isHighPriority = task.priority === 'High';
  const subtasks = task.subtasks || [];
  const displaySubtasks = isExpanded ? subtasks : subtasks.slice(0, 3);
  const hasMoreSubtasks = subtasks.length > 3;
  
  return (
    <div className={`p-5 rounded-2xl border h-fit ${isHighPriority ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'} shadow-sm transition-all hover:shadow-md flex flex-col gap-4`}>
      <div className="flex justify-between items-start gap-4 w-full">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight break-words">{task.title}</h3>
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

      {subtasks.length > 0 && (
        <div className="bg-white/60 p-3 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Suggested Steps</p>
          <ul className="space-y-1">
            {displaySubtasks.map((sub, idx) => {
              const title = typeof sub === 'string' ? sub : sub.title;
              const mins = typeof sub === 'object' && sub.estimatedMinutes ? sub.estimatedMinutes : null;
              return (
                <li key={idx} className="text-sm text-gray-700 flex flex-col gap-1 items-start group">
                  <div className="flex items-start gap-2 w-full">
                    <span className="text-gray-400 text-xs mt-0.5 shrink-0">•</span>
                    <span className="flex-1 leading-snug">{title}</span>
                    {mins && <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{mins}m</span>}
                  </div>
                  <button 
                    onClick={() => handleBreakdown(sub)}
                    disabled={isBreakingDown !== null}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium ml-4 md:opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {isBreakingDown === title ? 'Breaking down...' : 'Break down further'}
                  </button>
                </li>
              );
            })}
          </ul>
          {hasMoreSubtasks && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mt-3 w-full text-center"
            >
              {isExpanded ? 'View Less' : `View ${subtasks.length - 3} More`}
            </button>
          )}
        </div>
      )}

      <div className="pt-2 flex flex-wrap gap-2">
        <button
          onClick={() => onExecute(task)}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${task.draft ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
        >
          {task.draft ? <FileText className="w-4 h-4 fill-current shrink-0" /> : <Play className="w-4 h-4 fill-current shrink-0" />}
          <span className="truncate">{task.draft ? 'View Draft' : 'Proactive Execute & Enrich'}</span>
        </button>
        <button
          onClick={() => onFocus && onFocus(task)}
          className="flex-1 min-w-[80px] sm:flex-none flex items-center justify-center py-2.5 px-4 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 border border-indigo-100 transition-colors"
          title="Enter Focus Mode"
        >
          Focus
        </button>
      </div>
    </div>
  );
}
