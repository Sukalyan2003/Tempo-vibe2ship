import React, { useEffect, useState } from 'react';
import { Task } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Sun, X, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface DailyBriefProps {
  tasks: Task[];
  onApplyPlan?: () => void;
}

export function DailyBrief({ tasks }: DailyBriefProps) {
  const [lastBriefDate, setLastBriefDate] = useLocalStorage('tempo_last_brief_date', '');
  const [brief, setBrief] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastBriefDate !== today && tasks.length > 0) {
      generateBrief(today);
    }
  }, [lastBriefDate, tasks]);

  const generateBrief = async (todayStr: string) => {
    if (import.meta.env.MODE === 'test') return;
    
    setIsOpen(true);
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Generate a daily brief. Summarize at-risk deadlines, propose a reflowed plan for today, and list 3 precise next actions. Use markdown.",
          tasks
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setBrief(data.result.text || "Daily brief ready.");
        setLastBriefDate(todayStr); // Only save on success
      }
    } catch (e) {
      console.error("Daily brief error", e);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        <button onClick={() => setIsOpen(false)} title="Close Daily Brief" aria-label="Close Daily Brief" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Sun className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Your Daily Brief</h2>
        </div>
        
        <div className="overflow-y-auto pr-2 flex-1 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-medium">Assembing your day...</p>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base prose-amber max-w-none markdown-body">
              <Markdown>{brief}</Markdown>
            </div>
          )}
        </div>
        
        {!isLoading && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition"
            >
              Let's do this
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
