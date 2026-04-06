// src/components/instructor/CommandCenter.tsx
import React, { useState, useMemo } from 'react';
import { 
    Users, Zap, TrendingUp, Play, FileText, 
    Activity, ChevronRight, Shield, Calendar,
    CheckCircle2, PenTool, Layers, BookOpen
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
    onAssign,
    onRemoveStudent 
}: any) {
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false); 

    // 1. Resolve Active Class
    const activeClass = useMemo(() => 
        classes.find((c: any) => c.id === selectedClassId) || classes[0], 
    [classes, selectedClassId]);

    // 2. Calculate Real-Time Stats
    const stats = useMemo(() => {
        const classLogs = logs.filter((l: any) => l.classId === activeClass?.id);
        const weeklyXp = classLogs.reduce((acc: number, log: any) => acc + (log.xp || 0), 0);
        return {
            activeStudents: activeClass?.studentEmails?.length || 0,
            weeklyXp: weeklyXp,
            avgLevel: Math.floor(weeklyXp / 5000) + 1 
        };
    }, [activeClass, logs]);

    // 3. Calculate Activity Trends
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

                <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <div className="pl-3 text-slate-400"><Users size={16} /></div>
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
                
                {/* 1. TOP ROW: QUICK ACTIONS */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-2">
                    <button 
                        onClick={onLaunchLive}
                        className="w-full p-5 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white rounded-[2rem] flex flex-col justify-between group shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all relative overflow-hidden h-36"
                    >
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-[30px] pointer-events-none group-hover:bg-white/20 transition-colors" />
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30 relative z-10">
                            <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left relative z-10 mt-auto">
                            <span className="font-black text-lg uppercase tracking-tighter block leading-none mb-1">Start Live Session</span>
                            <span className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">Projector & Games</span>
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => setIsDeployModalOpen(true)}
                        className="w-full p-5 bg-slate-900 dark:bg-black text-white rounded-[2rem] flex flex-col justify-between group shadow-xl active:scale-[0.98] transition-all border border-slate-800 h-36"
                    >
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                            <FileText size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg uppercase tracking-tighter block leading-none mb-1">Assign Content</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To Student Dashboard</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveTab('studio')}
                        className="w-full p-5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/50 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36"
                    >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                            <PenTool size={20} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-blue-900 dark:text-blue-100 uppercase tracking-tighter block leading-none mb-1">Create Lesson</span>
                            <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Build Interactive Modules</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveTab('studio')}
                        className="w-full p-5 bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-100 dark:border-fuchsia-900/50 rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-36"
                    >
                        <div className="w-10 h-10 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-xl flex items-center justify-center">
                            <Layers size={20} className="text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-left mt-auto">
                            <span className="font-black text-lg text-fuchsia-900 dark:text-fuchsia-100 uppercase tracking-tighter block leading-none mb-1">Create Deck</span>
                            <span className="text-[9px] font-bold text-fuchsia-500 dark:text-fuchsia-400 uppercase tracking-widest">Build Flashcard Data</span>
                        </div>
                    </button>
                </div>

                {/* 2. MIDDLE ROW: KPI TILES */}
                <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all hover:border-indigo-200 dark:hover:border-indigo-500/50 group">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Users size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeStudents}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Students</span>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all hover:border-amber-200 dark:hover:border-amber-500/50 group">
                        <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor" /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.weeklyXp.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class XP</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all hover:border-emerald-200 dark:hover:border-emerald-500/50 group">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">Lvl {stats.avgLevel}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Level</span>
                    </div>
                </div>

                {/* 3. BOTTOM ROW: CHARTS & LOGS */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* ACTIVITY CHART */}
                    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all h-full flex flex-col">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8 shrink-0">
                            <Activity size={16} className="text-emerald-500" /> Weekly Activity Trends
                        </h2>
                        <div className="flex items-end justify-between h-48 gap-3 px-2 flex-1 mt-auto">
                            {weeklyActivity.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                    <div className="absolute -top-10 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg border border-slate-700">
                                        {d.xp.toLocaleString()} XP
                                    </div>
                                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl relative flex items-end h-full mb-3 overflow-hidden border border-slate-100 dark:border-slate-800">
                                        <div className="w-full bg-indigo-500 dark:bg-indigo-500/80 rounded-t-md transition-all duration-1000 group-hover:bg-indigo-400" style={{ height: d.height }} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. RIGHT COLUMN: LIVE ACTIVITY FEED */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-all min-h-[500px]">
                    <div className="flex-1 overflow-hidden">
                        <LiveActivityFeed />
                    </div>
                    
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className="mt-6 w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700/50 active:scale-95 shrink-0"
                    >
                        View Activity Logs
                    </button>
                </div>

            </div>
        </div>
    );
}
