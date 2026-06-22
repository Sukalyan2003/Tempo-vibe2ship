import React, { useState } from 'react';
import { Task } from '../types';
import { Clock, CalendarDays, Loader2, Sparkles } from 'lucide-react';

interface ScheduledBlock {
  timeFrame: string;
  taskId: string;
  taskTitle: string;
  advice: string;
}

interface DailyPlannerProps {
  tasks: Task[];
}

export function DailyPlanner({ tasks }: DailyPlannerProps) {
  const [schedule, setSchedule] = useState<ScheduledBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSchedule = async () => {
    if (tasks.length === 0) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setSchedule(data.result);
      } else {
        throw new Error(data.error || 'Failed to generate schedule');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Schedule generation failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">AI Daily Planner</h2>
        </div>
        
        <button
          onClick={generateSchedule}
          disabled={isGenerating || tasks.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {schedule.length > 0 ? "Regenerate" : "Auto-plan day"}
        </button>
      </div>

      {schedule.length > 0 ? (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {schedule.map((block, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Clock className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{block.timeFrame}</span>
                </div>
                <div className="font-semibold text-gray-900 mb-1 leading-tight">{block.taskTitle}</div>
                <div className="text-sm text-gray-500">{block.advice}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm mb-2">Let AI figure out when you should do what.</p>
        </div>
      )}
    </div>
  );
}
