import React, { useState, useEffect } from 'react';
import { Task, Subtask } from './types';
import { BrainDump } from './components/BrainDump';
import { TaskCard } from './components/TaskCard';
import { ActionModal } from './components/ActionModal';
import { HabitTracker } from './components/HabitTracker';
import { DailyPlanner } from './components/DailyPlanner';
import { FocusMode } from './components/FocusMode';
import { Target, CheckCircle2, BarChart3, AlertTriangle, LayoutGrid, List, Clock, X } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useToast } from './components/ToastContext';

import { AgentChat } from './components/AgentChat';
import { DailyBrief } from './components/DailyBrief';

export default function App() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useLocalStorage<Task[]>('tempo_tasks', []);
  const [completedTasks, setCompletedTasks] = useLocalStorage<Task[]>('tempo_done', []);
  const [isMatrixView, setIsMatrixView] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const focusTask = tasks.find(t => t.id === focusTaskId) ?? null;
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; taskTile: string; content: string; isLoading: boolean; taskId?: string }>({
    isOpen: false,
    taskTile: '',
    content: '',
    isLoading: false,
  });
  const [escalationReasons, setEscalationReasons] = useLocalStorage<Record<string, string>>('tempo_escalations', {});
  const [sprintCount] = useLocalStorage('tempo_sprints', 0);
  const [habits] = useLocalStorage<any[]>('tempo_habits', []);
  const [agentLogs, setAgentLogs] = useLocalStorage<{timestamp: string, note: string}[]>('tempo_agent_logs', []);
  const activeHabitsCount = habits.filter(h => h.streak > 0).length;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  useEffect(() => {
    let changed = false;
    const now = new Date();
    
    // Prune stale reasons and clone
    const existingTaskIds = new Set(tasks.map(t => t.id));
    const newReasons = Object.keys(escalationReasons).reduce((acc, key) => {
      if (existingTaskIds.has(key)) acc[key] = escalationReasons[key];
      else changed = true;
      return acc;
    }, {} as Record<string, string>);
    
    const updatedTasks = tasks.map(t => {
      if (!t.dueDate) return t;
      if (t.dismissed || (t.snoozedUntil && new Date(t.snoozedUntil).getTime() > now.getTime())) {
        if (newReasons[t.id]) {
          delete newReasons[t.id];
          changed = true;
        }
        return t;
      }
      
      const due = new Date(t.dueDate);
      const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      const isPastDue = hoursLeft < 0;
      const overdueMsg = `Overdue by ${Math.floor(Math.abs(hoursLeft))} hours. Urgency maximized.`;
      
      if (isPastDue && (t.urgency < 10 || newReasons[t.id] !== overdueMsg)) {
        changed = true;
        if (newReasons[t.id] !== overdueMsg) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Overdue', { body: `${t.title} is overdue!` });
          }
        }
        newReasons[t.id] = overdueMsg;
        return { ...t, urgency: 10, priority: 'High' as const };
      }
      
      const soonMsg = `Due within 24h. Urgency escalated.`;
      if (hoursLeft >= 0 && hoursLeft <= 24 && (t.urgency < 8 || newReasons[t.id] !== soonMsg)) {
        changed = true;
        if (newReasons[t.id] !== soonMsg) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Due Soon', { body: `${t.title} is due within 24 hours.` });
          }
        }
        newReasons[t.id] = soonMsg;
        return { ...t, urgency: Math.max(8, t.urgency + 3), priority: 'High' as const };
      }
      return t;
    });

    if (changed) {
      setTasks(updatedTasks);
      setEscalationReasons(newReasons);
    }
  }, [tasks, setTasks, escalationReasons, setEscalationReasons]);

  const atRiskTasks = tasks.filter(t => {
    if (t.dismissed) return false;
    if (t.snoozedUntil && new Date(t.snoozedUntil).getTime() > new Date().getTime()) return false;
    if (!t.dueDate) return false;
    const hoursLeft = (new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return hoursLeft <= 24;
  }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const lingeringTasks = tasks.filter(t => {
    if (t.dismissed) return false;
    if (t.dueDate) return false;
    if (t.urgency >= 7 || t.priority === 'High') return false;
    if (!t.lastTouched) return false;
    // For test capability we might need a shorter span if needed, but 7 days is good
    const daysSinceTouch = (new Date().getTime() - new Date(t.lastTouched).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceTouch >= 7;
  }).sort((a, b) => new Date(a.lastTouched!).getTime() - new Date(b.lastTouched!).getTime()).slice(0, 3);

  const handleSnooze = (taskId: string, hours: number) => {
    const until = new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, snoozedUntil: until } : t));
  };

  const handleDismiss = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dismissed: true } : t));
  };

  const handleTouch = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, lastTouched: new Date().toISOString() } : t));
  };

  const addAgentLog = (note: string) => {
    setAgentLogs(prev => {
      const next = [{ timestamp: new Date().toISOString(), note }, ...prev];
      return next.slice(0, 50); // Keep last 50 logs
    });
  };

  const handleAgentActions = async (actions: any[]) => {
    let tasksChanged = false;
    let nextTasks = [...tasks];
    
    for (const action of actions) {
      const { name, args } = action;
      if (name === 'createTask') {
         nextTasks.push({
            id: crypto.randomUUID(),
            title: args.title,
            priority: args.priority || 'Medium',
            urgency: 5,
            dueDate: args.dueDate || undefined,
            subtasks: [],
            createdAt: new Date().toISOString(),
            lastTouched: new Date().toISOString()
         });
         tasksChanged = true;
         addAgentLog(`Created task: ${args.title}`);
      } else if (name === 'rescheduleTask') {
         nextTasks = nextTasks.map(t => t.id === args.taskId ? { ...t, dueDate: args.newDueDate, lastTouched: new Date().toISOString() } : t);
         tasksChanged = true;
         addAgentLog(`Rescheduled task ${args.taskId.slice(0,4)}... to ${args.newDueDate}`);
      } else if (name === 'completeTask') {
         const taskToComplete = nextTasks.find(t => t.id === args.taskId);
         if (taskToComplete) {
            setCompletedTasks(prev => {
              const next = [...prev, { ...taskToComplete, completedAt: new Date().toISOString().split('T')[0] }];
              if (next.length > 50) return next.slice(next.length - 50);
              return next;
            });
            nextTasks = nextTasks.filter(t => t.id !== args.taskId);
            tasksChanged = true;
            addAgentLog(`Completed task: ${taskToComplete.title}`);
         }
      } else if (name === 'breakdownTask') {
         const tIdx = nextTasks.findIndex(t => t.id === args.taskId);
         if (tIdx !== -1) {
             const t = nextTasks[tIdx];
             try {
                const res = await fetch('/api/gemini/breakdown', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ taskTitle: t.title, subtaskTitle: 'Main Task Breakdown' })
                });
                const data = await res.json();
                if (res.ok && data.result) {
                   nextTasks[tIdx] = { 
                     ...t, 
                     subtasks: [...(t.subtasks || []), ...data.result],
                     lastTouched: new Date().toISOString()
                   };
                   tasksChanged = true;
                   addAgentLog(`Generated subtasks for: ${t.title}`);
                }
             } catch(e) {
                console.error('Agent breakdown error', e);
             }
         }
      } else if (name === 'planDay') {
         addAgentLog('Planned day automatically');
      }
    }
    
    if (tasksChanged) {
       setTasks(nextTasks);
       addToast('Agent actions applied', 'success');
    }
  };

  const handleBrainDumpSubmit = async (text: string) => {
    try {
      const response = await fetch('/api/gemini/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setTasks((prev) => [...prev, ...data.result.map((t: any) => ({ ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString(), lastTouched: new Date().toISOString() }))]);
        
        if (data.citations && data.citations.length > 0) {
          addToast(`Grounded sources: ${data.citations[0]}`, 'success');
        }
      } else {
        throw new Error(data.error || 'Failed to parse tasks');
      }
    } catch (e: any) {
      console.error(e);
      addToast(`API Error: ${e.message}`, 'error');
    }
  };

  const handleImageSubmit = async (base64: string, mimeType: string) => {
    try {
      addToast('Analyzing image...', 'info');
      const response = await fetch('/api/gemini/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePart: {
            inlineData: {
              data: base64,
              mimeType
            }
          }
        }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setTasks((prev) => [...prev, ...data.result.map((t: any) => ({ ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString(), lastTouched: new Date().toISOString() }))]);
        addToast('Tasks extracted successfully', 'success');
        if (data.citations && data.citations.length > 0) {
          addToast(`Grounded sources: ${data.citations[0]}`, 'success');
        }
      } else {
        throw new Error(data.error || 'Failed to parse image');
      }
    } catch (e: any) {
      console.error(e);
      addToast(`API Error: ${e.message}`, 'error');
    }
  };

  const handleExecute = async (task: Task) => {
    if (task.draft) {
      setActionModal({ isOpen: true, taskTile: task.title, content: task.draft, isLoading: false, taskId: task.id });
      return;
    }
    setActionModal({ isOpen: true, taskTile: task.title, content: '', isLoading: true, taskId: task.id });
    try {
      const response = await fetch('/api/gemini/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task: task.title, 
          action: `Draft a solution, outline, or quick start guide based on the subtasks: ${(task.subtasks || []).map((s: string | Subtask) => typeof s === 'string' ? s : s.title).join(', ')}` 
        }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setActionModal((prev) => ({ ...prev, content: data.result, isLoading: false }));
        if (data.citations && data.citations.length > 0) {
           addToast(`Grounded sources: ${data.citations[0]}`, 'success');
        }
      } else {
        throw new Error(data.error || 'Action failed to execute');
      }
    } catch (e: any) {
      console.error(e);
      setActionModal((prev) => ({ ...prev, content: `Error: ${e.message}`, isLoading: false }));
    }
  };

  const handleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCompletedTasks(prev => {
        const next = [...prev, { ...task, completedAt: new Date().toISOString().split('T')[0] }];
        if (next.length > 50) return next.slice(next.length - 50);
        return next;
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...updatedTask, lastTouched: new Date().toISOString() } : t));
  };

  const handleUpdateSubtask = (taskId: string, subtaskIdx: number, completed: boolean) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const newSubtasks = [...(t.subtasks || [])];
      const sub = newSubtasks[subtaskIdx];
      if (sub) {
        newSubtasks[subtaskIdx] = typeof sub === 'string' ? { title: sub, completed } : { ...sub, completed };
      }
      return { ...t, subtasks: newSubtasks, lastTouched: new Date().toISOString() };
    }));
  };

  const handleSaveDraft = () => {
    if (actionModal.taskId && actionModal.content) {
      setTasks(prev => prev.map(t => t.id === actionModal.taskId ? { ...t, draft: actionModal.content, lastTouched: new Date().toISOString() } : t));
      addToast('Draft saved to task', 'success');
      setActionModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const loadSampleTasks = () => {
    const now = new Date();
    setTasks([
      {
        id: crypto.randomUUID(),
        title: 'Finalize Hackathon Submission',
        priority: 'High',
        urgency: 10,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        lastTouched: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        subtasks: [
          { title: 'Record video demo', estimatedMinutes: 30, completed: false },
          { title: 'Write README.md', estimatedMinutes: 20, completed: true },
          { title: 'Submit on Devpost', estimatedMinutes: 10, completed: false }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Call the DMV',
        priority: 'Medium',
        urgency: 5,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        lastTouched: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
        subtasks: [
          { title: 'Find vehicle registration', estimatedMinutes: 5, completed: false },
          { title: 'Wait on hold', estimatedMinutes: 45, completed: false }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Cancel gym membership',
        priority: 'Medium',
        urgency: 8,
        createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        lastTouched: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (Overdue)
        subtasks: [
          { title: 'Find contract terms', estimatedMinutes: 10, completed: false },
          { title: 'Draft email request', estimatedMinutes: 15, completed: false }
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Organize desk drawer',
        priority: 'Low',
        urgency: 2,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago (Lingering)
        lastTouched: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        subtasks: [
          { title: 'Empty out all items', estimatedMinutes: 5, completed: false },
          { title: 'Sort into keep/throw', estimatedMinutes: 15, completed: false }
        ]
      }
    ]);
  };

  const sortedTasks = [...tasks].sort((a, b) => b.urgency - a.urgency);
  const urgentTasks = sortedTasks.filter(t => t.urgency >= 7 || t.priority === 'High');
  const normalTasks = sortedTasks.filter(t => t.urgency < 7 && t.priority !== 'High');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompleted = completedTasks.filter(t => t.completedAt === todayStr);
  const totalRelevant = tasks.length + todayCompleted.length;
  const productivityScore = totalRelevant === 0 ? 100 : Math.round((todayCompleted.length / totalRelevant) * 100);

  // Matrix categories
  const q1 = tasks.filter(t => (t.urgency >= 7 || (t.dueDate && (new Date(t.dueDate).getTime() - new Date().getTime())/(1000*60*60) < 48)) && (t.priority === 'High' || t.priority === 'Medium'));
  const q2 = tasks.filter(t => !(t.urgency >= 7 || (t.dueDate && (new Date(t.dueDate).getTime() - new Date().getTime())/(1000*60*60) < 48)) && (t.priority === 'High' || t.priority === 'Medium'));
  const q3 = tasks.filter(t => (t.urgency >= 7 || (t.dueDate && (new Date(t.dueDate).getTime() - new Date().getTime())/(1000*60*60) < 48)) && t.priority === 'Low');
  const q4 = tasks.filter(t => !(t.urgency >= 7 || (t.dueDate && (new Date(t.dueDate).getTime() - new Date().getTime())/(1000*60*60) < 48)) && t.priority === 'Low');

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
      </header>

      <DailyBrief tasks={tasks} />
      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-12">
          <section className="space-y-6">
            <AgentChat tasks={tasks} onExecuteAgentActions={handleAgentActions} onPlanDay={() => { document.querySelector<HTMLButtonElement>('#plan-day-btn')?.click(); }} />
            <BrainDump onSubmit={handleBrainDumpSubmit} onImageSubmit={handleImageSubmit} />
          </section>

          {atRiskTasks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold tracking-tight text-red-900">Needs Attention Now</h2>
              </div>
              <div className="space-y-3">
                {atRiskTasks.map(t => {
                  const isOverdue = new Date(t.dueDate!).getTime() < new Date().getTime();
                  return (
                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-4 border border-red-100 shadow-sm gap-4">
                      <div>
                        <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-2 text-lg">
                          {t.title}
                          {isOverdue && <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Overdue</span>}
                        </div>
                        <div className="text-sm text-red-600 font-medium mt-1">
                          {escalationReasons[t.id] || "Due soon"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setFocusTaskId(t.id)} className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition flex items-center justify-center shrink-0 shadow-sm text-sm">Focus</button>
                        <button onClick={() => handleSnooze(t.id, 1)} className="px-3 py-2 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition border border-red-200 text-sm">Snooze 1h</button>
                        <button onClick={() => handleDismiss(t.id)} className="px-3 py-2 text-gray-400 hover:text-gray-600 transition" title="Dismiss"><X className="w-5 h-5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {lingeringTasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-bold tracking-tight text-amber-900">Lingering</h2>
              </div>
              <p className="text-amber-800 text-sm mb-4">This has been sitting a while — still relevant?</p>
              <div className="space-y-3">
                {lingeringTasks.map(t => (
                  <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-4 border border-amber-100 shadow-sm gap-4">
                    <div className="font-semibold text-gray-900">{t.title}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { handleTouch(t.id); setFocusTaskId(t.id); }} className="px-4 py-2 bg-amber-100 text-amber-800 font-medium rounded-xl hover:bg-amber-200 transition text-sm">Review Now</button>
                      <button onClick={() => handleDismiss(t.id)} className="px-3 py-2 text-gray-400 hover:text-gray-600 transition" title="Dismiss"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="flex justify-end mb-4">
              <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm inline-flex">
                <button onClick={() => setIsMatrixView(false)} className={`p-1.5 rounded-md flex items-center transition ${!isMatrixView ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} title="List View"><List className="w-4 h-4" /></button>
                <button onClick={() => setIsMatrixView(true)} className={`p-1.5 rounded-md flex items-center transition ${isMatrixView ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} title="Eisenhower Matrix"><LayoutGrid className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {tasks.length > 0 ? (
            <div className="space-y-12">
              {isMatrixView ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="bg-red-50/30 p-4 rounded-3xl border border-red-100">
                    <h3 className="font-bold text-red-900 mb-4">Do First (Urgent & Important)</h3>
                    <div className="space-y-3">
                      {q1.map(task => <TaskCard key={task.id} task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={t => setFocusTaskId(t.id)} onUpdate={handleUpdateTask} />)}
                      {q1.length === 0 && <div className="text-sm text-red-800/60 p-2 italic text-center">Empty</div>}
                    </div>
                  </section>
                  <section className="bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-4">Schedule (Important, Not Urgent)</h3>
                    <div className="space-y-3">
                      {q2.map(task => <TaskCard key={task.id} task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={t => setFocusTaskId(t.id)} onUpdate={handleUpdateTask} />)}
                      {q2.length === 0 && <div className="text-sm text-indigo-800/60 p-2 italic text-center">Empty</div>}
                    </div>
                  </section>
                  <section className="bg-amber-50/30 p-4 rounded-3xl border border-amber-100">
                    <h3 className="font-bold text-amber-900 mb-4">Quick Wins</h3>
                    <div className="space-y-3">
                      {q3.map(task => <TaskCard key={task.id} task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={t => setFocusTaskId(t.id)} onUpdate={handleUpdateTask} />)}
                      {q3.length === 0 && <div className="text-sm text-amber-800/60 p-2 italic text-center">Empty</div>}
                    </div>
                  </section>
                  <section className="bg-gray-50/50 p-4 rounded-3xl border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4">Eliminate (Neither)</h3>
                    <div className="space-y-3">
                      {q4.map(task => <TaskCard key={task.id} task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={t => setFocusTaskId(t.id)} onUpdate={handleUpdateTask} />)}
                      {q4.length === 0 && <div className="text-sm text-gray-500/60 p-2 italic text-center">Empty</div>}
                    </div>
                  </section>
                </div>
              ) : (
                <>
                  {urgentTasks.length > 0 && (
                    <section>
                       <div className="flex items-center gap-2 mb-6">
                          <div className="w-2 rounded-full h-6 bg-red-500 mr-2"></div>
                          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Urgent & High Priority</h2>
                       </div>
                       <div className="columns-1 sm:columns-2 md:columns-1 lg:columns-2 gap-4">
                          {urgentTasks.map(task => (
                            <div className="mb-4 break-inside-avoid" key={task.id}>
                              <TaskCard task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={t => setFocusTaskId(t.id)} onUpdate={handleUpdateTask} />
                            </div>
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
                       <div className="columns-1 sm:columns-2 md:columns-1 lg:columns-2 gap-4">
                          {normalTasks.map(task => (
                            <div className="mb-4 break-inside-avoid" key={task.id}>
                              <TaskCard task={task} onExecute={handleExecute} onComplete={handleComplete} onFocus={t => setFocusTaskId(t.id)} onUpdate={handleUpdateTask} />
                            </div>
                          ))}
                       </div>
                    </section>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="py-24 text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-indigo-500" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">Inbox Zero Achieved</h3>
               <p className="text-gray-500 max-w-sm mx-auto mb-6">Drop your thoughts in the brain dump above when you're ready to plan your next moves.</p>
               <button
                 onClick={loadSampleTasks}
                 className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 shadow-sm transition-colors text-sm"
               >
                 Load sample tasks
               </button>
            </div>
          )}
        </div>
        
        <aside>
          <div className="sticky top-8 space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-900 tracking-tight">Insights</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Done Today</div>
                  <div className="text-2xl font-bold text-gray-900">{todayCompleted.length}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Focus Sprints</div>
                  <div className="text-2xl font-bold text-gray-900">{sprintCount}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Active Streaks</div>
                  <div className="text-2xl font-bold text-gray-900">{activeHabitsCount}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Completed Rate</div>
                  <div className="text-2xl font-bold text-gray-900">{productivityScore}%</div>
                </div>
              </div>
            </div>

            <HabitTracker />
            <DailyPlanner tasks={tasks} />
            
            {agentLogs.length > 0 && (
              <details className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 group">
                <summary className="font-bold text-gray-900 tracking-tight cursor-pointer flex items-center justify-between list-none">
                   Agent Activity
                   <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2 text-sm text-gray-600">
                  {agentLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-xs text-indigo-400 whitespace-nowrap mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>{log.note}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </aside>
      </main>

      <ActionModal 
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        title={actionModal.taskTile}
        content={actionModal.content}
        isLoading={actionModal.isLoading}
        onSaveDraft={handleSaveDraft}
      />
      
      <FocusMode 
        task={focusTask}
        onClose={() => setFocusTaskId(null)}
        onCompleteTask={handleComplete}
        onUpdateSubtask={handleUpdateSubtask}
      />
    </div>
  );
}
