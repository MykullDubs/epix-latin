// src/components/instructor/CommandCenter.tsx
import React, { useState, useMemo } from 'react';
import { 
    Users, Play, FileText, Activity, 
    CheckCircle2, PenTool, Layers, BookOpen, 
    Clock, School, Inbox, Archive
} from 'lucide-react';
import LiveActivityFeed from './LiveActivityFeed';
import DeploymentModal from './DeploymentModal'; 

export default function CommandCenter({ 
    classes = [], 
    selectedClassId, 
    setSelectedClassId, 
    logs = [], 
    onLaunchLive, 
    setActiveTab,
    lessons = [],    
    allDecks = {}, 
    curriculums = [],
    onAssign 
}: any) {
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false); 

    // 1. Resolve Active Class
    const activeClass = useMemo(() => 
        classes.find((c: any) => c.id === selectedClassId) || classes[0], 
    [classes, selectedClassId]);

    // 2. Calculate Activity Trends
    const weeklyActivity = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const classLogs = logs.filter((l: any) => l.classId === activeClass?.id);
        
        return days.map((day, index) => {
            const dayXp = classLogs.filter((_: any, i: number) => i % 5 === index)
                                  .reduce((acc: number, l: any) => acc + l.xp, 0);
            const height = Math.min(100, (dayXp / 2000) * 100);
            return { day, xp: dayXp, height: `${height}%` };
        });
    }, [activeClass, logs]);

    // 3. Time Formatter for the Live Pulse
    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return '';
        const diffMins = (Date.now() - timestamp) / 60000;
        
        if (diffMins < 60) return `${Math.max(1, Math.round(diffMins))}m ago`;
        
        const diffHours = diffMins / 60;
        if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
        
        const diffDays = diffHours / 24;
        return `${Math.round(diffDays)}d ago`;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar px-4 md:px-8 pt-6 pb-32 transition-colors duration-300">
            
            <DeploymentModal 
                isOpen={isDeployModalOpen}
                onClose={() => setIsDeployModalOpen(false)}
                onDeploy={onAssign}
                activeClass={activeClass}
                lessons={lessons}
                allDecks={allDecks}
                curriculums={curriculums}
            />

            {/* COHORT SELECTOR HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 uppercase italic">
                        Overview
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-500" /> Instructor Dashboard
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 flex items-center gap-3 transition-all hover:ring-indigo-500/30">
                    <div className="pl-3 text-indigo-500"><Users size={18} /></div>
                    <select 
                        value={selectedClassId} 
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="bg-transparent text-sm font-black text-slate-700 dark:text-slate-200 outline-none pr-8 cursor-pointer uppercase tracking-tight"
                    >
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                
                {/* 1. THE 8-CARD QUICK ACTION GRID (M3 Tonal Harmony) */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                    
                    {/* 1. Indigo Tonal - Live Session */}
                    <button 
                        onClick={onLaunchLive}
                        className="w-full p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-indigo-100 dark:ring-indigo-500/20 hover:ring-indigo-300"
                    >
                        <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-indigo-300 dark:group-hover:bg-indigo-500/50">
                            <Play size={20} className="text-indigo-700 dark:text-indigo-300 group-hover:scale-110 transition-transform ml-1" fill="currentColor" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-indigo-900 dark:text-indigo-100 uppercase tracking-tighter block leading-none mb-1">Start Live Session</span>
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Projector & Games</span>
                        </div>
                    </button>
                    
                    {/* 2. Emerald Tonal - Deploy Content */}
                    <button 
                        onClick={() => setIsDeployModalOpen(true)}
                        className="w-full p-5 bg-emerald-50 dark:bg-emerald-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-emerald-100 dark:ring-emerald-500/20 hover:ring-emerald-300"
                    >
                        <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-emerald-300 dark:group-hover:bg-emerald-500/50">
                            <FileText size={20} className="text-emerald-700 dark:text-emerald-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-emerald-900 dark:text-emerald-100 uppercase tracking-tighter block leading-none mb-1">Assign Content</span>
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">To Student Dashboard</span>
                        </div>
                    </button>

                    {/* 3. Blue Tonal - Create Lesson */}
                    <button 
                        onClick={() => setActiveTab('studio')}
                        className="w-full p-5 bg-blue-50 dark:bg-blue-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-blue-100 dark:ring-blue-500/20 hover:ring-blue-300"
                    >
                        <div className="w-12 h-12 bg-blue-200 dark:bg-blue-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-blue-300 dark:group-hover:bg-blue-500/50">
                            <PenTool size={20} className="text-blue-700 dark:text-blue-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-blue-900 dark:text-blue-100 uppercase tracking-tighter block leading-none mb-1">Create Lesson</span>
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Build Interactive Modules</span>
                        </div>
                    </button>

                    {/* 4. Fuchsia Tonal - Create Deck */}
                    <button 
                        onClick={() => setActiveTab('studio')}
                        className="w-full p-5 bg-fuchsia-50 dark:bg-fuchsia-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-fuchsia-100 dark:ring-fuchsia-500/20 hover:ring-fuchsia-300"
                    >
                        <div className="w-12 h-12 bg-fuchsia-200 dark:bg-fuchsia-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-fuchsia-300 dark:group-hover:bg-fuchsia-500/50">
                            <Layers size={20} className="text-fuchsia-700 dark:text-fuchsia-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-fuchsia-900 dark:text-fuchsia-100 uppercase tracking-tighter block leading-none mb-1">Create Deck</span>
                            <span className="text-[9px] font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest">Build Flashcard Data</span>
                        </div>
                    </button>

                    {/* 5. Violet Tonal - Cohort Manager */}
                    <button 
                        onClick={() => setActiveTab('classes')}
                        className="w-full p-5 bg-violet-50 dark:bg-violet-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-violet-100 dark:ring-violet-500/20 hover:ring-violet-300"
                    >
                        <div className="w-12 h-12 bg-violet-200 dark:bg-violet-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-violet-300 dark:group-hover:bg-violet-500/50">
                            <School size={20} className="text-violet-700 dark:text-violet-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-violet-900 dark:text-violet-100 uppercase tracking-tighter block leading-none mb-1">Cohort Manager</span>
                            <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Manage Students & Rosters</span>
                        </div>
                    </button>

                    {/* 6. Rose Tonal - Gradebook */}
                    <button 
                        onClick={() => setActiveTab('gradebook')}
                        className="w-full p-5 bg-rose-50 dark:bg-rose-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-rose-100 dark:ring-rose-500/20 hover:ring-rose-300"
                    >
                        <div className="w-12 h-12 bg-rose-200 dark:bg-rose-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-rose-300 dark:group-hover:bg-rose-500/50">
                            <BookOpen size={20} className="text-rose-700 dark:text-rose-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-rose-900 dark:text-rose-100 uppercase tracking-tighter block leading-none mb-1">Gradebook</span>
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Review Academic Performance</span>
                        </div>
                    </button>

                    {/* 7. Amber Tonal - Inbox */}
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className="w-full p-5 bg-amber-50 dark:bg-amber-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-amber-100 dark:ring-amber-500/20 hover:ring-amber-300"
                    >
                        <div className="w-12 h-12 bg-amber-200 dark:bg-amber-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-amber-300 dark:group-hover:bg-amber-500/50">
                            <Inbox size={20} className="text-amber-700 dark:text-amber-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-amber-900 dark:text-amber-100 uppercase tracking-tighter block leading-none mb-1">Comms Inbox</span>
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Read & Send Messages</span>
                        </div>
                    </button>

                    {/* 8. Cyan Tonal - Global Vault */}
                    <button 
                        onClick={() => setActiveTab('vault')}
                        className="w-full p-5 bg-cyan-50 dark:bg-cyan-500/10 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36 ring-1 ring-cyan-100 dark:ring-cyan-500/20 hover:ring-cyan-300"
                    >
                        <div className="w-12 h-12 bg-cyan-200 dark:bg-cyan-500/30 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-cyan-300 dark:group-hover:bg-cyan-500/50">
                            <Archive size={20} className="text-cyan-700 dark:text-cyan-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-cyan-900 dark:text-cyan-100 uppercase tracking-tighter block leading-none mb-1">Global Vault</span>
                            <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Browse Saved Payloads</span>
                        </div>
                    </button>
                </div>

                {/* 2. BOTTOM ROW: CHARTS & LOGS */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* ACTIVITY CHART */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5 flex flex-col h-full min-h-[350px]">
                        <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8 shrink-0">
                            <Activity size={18} className="text-emerald-500" /> Weekly Activity Trends
                        </h2>
                        <div className="flex items-end justify-between gap-4 px-2 flex-1 mt-auto pb-4">
                            {weeklyActivity.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                    <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                        {d.xp.toLocaleString()} XP
                                    </div>
                                    <div className="w-full max-w-[60px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl relative flex items-end h-full mb-4 overflow-hidden border border-slate-100 dark:border-slate-800">
                                        <div className="w-full bg-indigo-500 dark:bg-indigo-500/80 rounded-t-xl transition-all duration-1000 group-hover:bg-indigo-400" style={{ height: d.height }} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT COLUMN: M3 INLINE LIVE PULSE */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Zap size={18} className="text-amber-500" fill="currentColor" /> Live Pulse
                        </h2>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                    
                    {/* The Limited Feed Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                <Clock size={32} className="mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Transmissions</p>
                            </div>
                        ) : (
                            logs.slice(0, 20).map((log: any, i: number) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/30 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 group">
                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 ring-1 ring-slate-900/5 dark:ring-white/5">
                                        {log.type === 'completion' ? (
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        ) : log.type === 'explore' ? (
                                            <Layers size={16} className="text-fuchsia-500" />
                                        ) : (
                                            <Activity size={16} className="text-indigo-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-0.5">
                                            {log.studentName || log.studentEmail?.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
                                            {log.itemTitle || log.type}
                                        </p>
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0 mt-1">
                                        {formatTimeAgo(log.timestamp)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className="mt-4 w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] shrink-0"
                    >
                        View Full Archives
                    </button>
                </div>

            </div>
        </div>
    );
}
