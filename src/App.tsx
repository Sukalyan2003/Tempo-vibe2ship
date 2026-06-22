import React from 'react';
import { Terminal, Sparkles, FolderOpen, Settings, Play, Layout, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar Template */}
      <aside className="w-16 md:w-64 flex flex-col border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shrink-0 transition-all duration-300">
        <div className="h-14 flex items-center justify-center md:justify-start md:px-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="font-semibold hidden md:block truncate tracking-tight">Vibecoding</span>
          </div>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-y-auto">
          <NavItem icon={<FolderOpen className="w-5 h-5" />} label="Explorer" active />
          <NavItem icon={<Layout className="w-5 h-5" />} label="Canvas" />
          <NavItem icon={<Terminal className="w-5 h-5" />} label="Terminal" />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>
      </aside>

      {/* Main Content Template */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="h-14 border-b border-zinc-800/80 flex items-center px-4 justify-between bg-zinc-950/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
            <span>workspace</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200">awaiting-files...</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all rounded-md text-sm font-medium shadow-lg shadow-indigo-500/5">
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Initialize</span>
          </button>
        </header>

        {/* Workspace Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full flex flex-col items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-md w-full"
          >
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            
            <h1 className="text-3xl font-semibold mb-3 tracking-tight text-white">
              Ready for Input
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              The foundational workspace is locked in. Drop your files, link your dependencies, or prompt the next architecture module to begin the vibecoding session.
            </p>
            
            <div className="p-4 border border-zinc-800/60 bg-zinc-900/40 rounded-xl backdrop-blur-sm text-left mx-auto max-w-sm">
               <pre className="text-[13px] text-zinc-500 font-mono overflow-x-auto leading-relaxed">
                 <div className="flex gap-4">
                   <span className="text-indigo-400/50">01</span>
                   <span className="text-green-400">✓ Template initialized</span>
                 </div>
                 <div className="flex gap-4 mt-1">
                   <span className="text-indigo-400/50">02</span>
                   <span className="text-zinc-400 animate-pulse">Waiting for source payload...</span>
                 </div>
               </pre>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button 
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${
        active 
          ? 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/50 shadow-sm' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
      }`}
    >
      <div className={`shrink-0 ${active ? 'text-indigo-400' : ''}`}>{icon}</div>
      <span className="font-medium text-sm hidden md:block">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator" 
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full"
        />
      )}
    </button>
  );
}
