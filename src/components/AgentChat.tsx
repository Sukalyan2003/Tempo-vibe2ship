import React, { useState } from 'react';
import { Send, Loader2, Bot, Check, X } from 'lucide-react';
import { useToast } from './ToastContext';
import { Task } from '../types';

interface AgentChatProps {
  tasks: Task[];
  onExecuteAgentActions: (actions: any[]) => void;
  onPlanDay: () => void;
}

export function AgentChat({ tasks, onExecuteAgentActions, onPlanDay }: AgentChatProps) {
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [agentResponse, setAgentResponse] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setAgentResponse('');
    setPendingActions([]);
    try {
      const res = await fetch('/api/gemini/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tasks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const { functionCalls, text } = data.result;
      
      let answerMsg = text;
      
      // Handle the actions
      const actions = functionCalls || [];
      const mutativeActions = actions.filter((a: any) => a.name !== 'answerQuestion');
      const answerAction = actions.find((a: any) => a.name === 'answerQuestion');
      
      if (answerAction && answerAction.args?.answer) {
        answerMsg = answerAction.args.answer;
      }
      
      setAgentResponse(answerMsg || "Here is what I found.");
      
      if (mutativeActions.length > 1) {
        setPendingActions(mutativeActions);
      } else if (mutativeActions.length === 1) {
        // Single mutating action -> execute directly, or gate all mutations? The prompt says "mutates >1 task shows a proposed action list". So single mutation applies directly. 
        executeActions(mutativeActions);
        setPrompt('');
      } else {
        setPrompt('');
      }
      
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const executeActions = (actions: any[]) => {
    onExecuteAgentActions(actions);
    const planDayAction = actions.find(a => a.name === 'planDay');
    if (planDayAction) {
      onPlanDay();
    }
    setPendingActions([]);
    setPrompt('');
  };
  
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-indigo-600" />
        <h2 className="font-bold text-gray-900 tracking-tight">Ask Tempo</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 'Move my report to Friday' or 'What's most urgent?'"
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-4 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
        />
        <button
          type="submit"
          title="Send command"
          aria-label="Send command"
          disabled={!prompt.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>

      {agentResponse && !pendingActions.length && (
        <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl text-sm text-indigo-900 border border-indigo-100">
          {agentResponse}
        </div>
      )}

      {pendingActions.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <p className="text-sm text-amber-900 font-medium mb-3">Tempo proposes the following actions:</p>
          <ul className="space-y-2 mb-4">
            {pendingActions.map((action, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2 bg-white/50 p-2 rounded-lg">
                <span className="font-mono text-xs font-bold text-amber-600 mt-0.5">{action.name}</span>
                <span className="truncate">{JSON.stringify(action.args || {})}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button
              onClick={() => executeActions(pendingActions)}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" /> Approve All
            </button>
            <button
              onClick={() => { setPendingActions([]); setAgentResponse(''); }}
              className="flex-1 px-4 py-2 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-200 transition flex items-center justify-center gap-2 text-sm"
            >
              <X className="w-4 h-4" /> Reject All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
