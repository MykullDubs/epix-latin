// src/components/instructor/CommandCenter.tsx
import React from 'react';
import { 
    Users, Zap, TrendingUp, AlertTriangle, Play, FileText, 
    Activity, ChevronRight, Shield, Target, Flame
} from 'lucide-react';

export default function CommandCenter({ classData, logs = [], onLaunchLive, setActiveTab }: any) {
    const className = classData?.name || "Magister Cohort";
    
    // --- MOCK DATA FOR DEMO (You can wire this to real Firebase queries later) ---
    const stats = {
        activeStudents: classData?.studentEmails?.length || 24,
        weeklyXp: 14500,
        avgLevel: 12
    };

    const triageAlerts = [
        { id: 1, type: 'warning', text: '3 students scored < 60% on Verbs Assessment', time: '2h ago' },
        { id: 2, type: 'forum', text: 'New unanswered question in "Declensions"', time: '4h ago' },
        { id: 3, type: 'quest', text: '8 students inactive for 3+ days', time: '1d ago' },
    ];

    const weeklyActivity = [
        { day: 'Mon', xp: 2400, height: '40%' },
        { day: 'Tue', xp: 4100, height: '70%' },
        { day: 'Wed', xp: 5800, height: '100%' },
        { day: 'Thu', xp: 3200, height: '55%' },
        { day: 'Fri', xp: 1800, height: '30%' },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar px-4 md:px-8 pt-6 pb-32 transition-colors duration-300">
            
            {/* HERO HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 transition-colors">
                    Command Center
                </h1>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <Shield size={14} className="text-indigo-500 dark:text-indigo-400" /> {className}
                </p>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. TOP ROW: QUICK STATS (Spans full width on mobile, 3 cols on desktop) */}
                <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-colors">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3 transition-colors"><Users size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{stats.activeStudents}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center md:text-left transition-colors">Active Scholars</span>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-colors">
                        <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 rounded-xl flex items-center justify-center mb-3 transition-colors"><Zap size={20} fill="currentColor" /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{stats.weeklyXp.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center md:text-left transition-colors">Cohort XP (7d)</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-colors">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 transition-colors"><TrendingUp size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white transition-colors">Lvl {stats.avgLevel}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center md:text-left transition-colors">Average Level</span>
                    </div>
                </div>

                {/* 2. MIDDLE LEFT: TRIAGE & ALERTS (Spans 2 columns) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                            <AlertTriangle size={16} className="text-rose-500 dark:text-rose-400" /> Needs Attention
                        </h2>
                        <button className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors">
                            View All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {triageAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all">
                                <div className="flex items-center gap-3">
                                    {alert.type === 'warning' && <div className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse" />}
                                    {alert.type === 'forum' && <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />}
                                    {alert.type === 'quest' && <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />}
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">{alert.text}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{alert.time}</span>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. MIDDLE RIGHT: QUICK LAUNCH OPERATIONS */}
                <div className="lg:col-span-1 bg-slate-900 dark:bg-black p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800 transition-colors">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />
                    
                    <div className="relative z-10 mb-8">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                            <Target size={16} className="text-indigo-400" /> Operations
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Rapid Deployment</p>
                    </div>

                    <div className="relative z-10 space-y-3">
                        <button 
                            onClick={onLaunchLive}
                            className="w-full p-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-2xl flex items-center justify-between group shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                                <span className="font-black text-sm uppercase tracking-widest">Launch Live Arena</span>
                            </div>
                        </button>
                        
                        <button className="w-full p-4 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-white rounded-2xl flex items-center justify-between group border border-slate-700 dark:border-slate-800 transition-all active:scale-95">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="font-black text-sm uppercase tracking-widest">Deploy Exam</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 4. BOTTOM LEFT: LEARNING VELOCITY (Analytics) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                            <Activity size={16} className="text-emerald-500 dark:text-emerald-400" /> Fleet Velocity
                        </h2>
                    </div>
                    
                    <div className="flex items-end justify-between h-32 gap-2 px-2">
                        {weeklyActivity.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                <div className="absolute -top-8 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-10">
                                    {d.xp} XP
                                </div>
                                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg relative flex items-end h-full mb-3 border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-colors">
                                    <div 
                                        className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-sm transition-all duration-1000 group-hover:bg-cyan-400 dark:group-hover:bg-cyan-500" 
                                        style={{ height: d.height }} 
                                    />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {d.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. BOTTOM RIGHT: MINIMIZED LIVE PULSE (The Heartbeat) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                            <Flame size={16} className="text-orange-500 dark:text-orange-400" /> Live Pulse
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {logs.slice(0, 5).map((log: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-right-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 transition-colors">
                                    {log.studentEmail?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight transition-colors">
                                        <span className="font-black text-slate-900 dark:text-white transition-colors">{log.studentEmail?.split('@')[0]}</span> completed <span className="text-indigo-600 dark:text-indigo-400 font-black transition-colors">{log.itemTitle || 'a module'}</span>
                                    </p>
                                    <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest transition-colors">+{log.xp || 50} XP</span>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-center py-8 opacity-40">
                                <Activity size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">No activity yet</span>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className="mt-4 w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50"
                    >
                        View Full Ledger
                    </button>
                </div>

            </div>
        </div>
    );
}
