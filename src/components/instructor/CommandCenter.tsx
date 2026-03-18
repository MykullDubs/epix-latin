// src/components/instructor/CommandCenter.tsx
import React, { useMemo } from 'react';
import { 
    Users, Zap, TrendingUp, AlertTriangle, Play, FileText, 
    Activity, ChevronRight, Shield, Target, Calendar,
    CheckCircle2 
} from 'lucide-react';
// 🔥 IMPORT THE NEW FEED COMPONENT
import LiveActivityFeed from './LiveActivityFeed';

export default function CommandCenter({ 
    classes = [], 
    selectedClassId, 
    setSelectedClassId, 
    logs = [], 
    onLaunchLive, 
    setActiveTab 
}: any) {
    
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

    // 3. Generate Smart Triage Alerts
    const triageAlerts = useMemo(() => {
        const alerts: any[] = [];
        const now = Date.now();
        const classLogs = logs.filter((l: any) => l.classId === activeClass?.id);

        const lowScores = classLogs.filter((l: any) => l.scorePct !== undefined && l.scorePct < 70);
        if (lowScores.length > 0) {
            alerts.push({ 
                id: 'perf', type: 'warning', 
                text: `${lowScores.length} recent scores below 70%`, 
                time: 'Recent' 
            });
        }

        activeClass?.studentEmails?.forEach((email: string) => {
            const studentLogs = classLogs.filter((l: any) => l.studentEmail === email);
            const lastLog = studentLogs[0]?.timestamp || 0;
            if (now - lastLog > 3 * 24 * 60 * 60 * 1000) { 
                alerts.push({ 
                    id: `inactive-${email}`, type: 'quest', 
                    text: `${email.split('@')[0]} inactive for 3+ days`, 
                    time: 'Alert' 
                });
            }
        });

        return alerts.slice(0, 3);
    }, [activeClass, logs]);

    // 4. Calculate Fleet Velocity (Last 5 Days)
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
            
            {/* COHORT SELECTOR HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                        Command Center
                    </h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={14} className="text-indigo-500" /> System Overview
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. TOP ROW: KPI TILES */}
                <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-3"><Users size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeStudents}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined Scholars</span>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all">
                        <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-3"><Zap size={20} fill="currentColor" /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.weeklyXp.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet XP</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-3"><TrendingUp size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">Lvl {stats.avgLevel}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Rank</span>
                    </div>
                </div>

                {/* 2. MIDDLE LEFT: TRIAGE PANEL */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle size={16} className="text-rose-500" /> Needs Attention
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {triageAlerts.length > 0 ? triageAlerts.map((alert, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 group cursor-pointer hover:border-indigo-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${alert.type === 'warning' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{alert.text}</span>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500" />
                            </div>
                        )) : (
                            <div className="py-8 text-center opacity-30">
                                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest">All Systems Operational</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. MIDDLE RIGHT: RAPID OPS */}
                <div className="lg:col-span-1 bg-slate-900 dark:bg-black p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
                    <div className="relative z-10 mb-8">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                            <Target size={16} className="text-indigo-400" /> Rapid Ops
                        </h2>
                    </div>
                    <div className="relative z-10 space-y-3">
                        <button 
                            onClick={onLaunchLive}
                            className="w-full p-4 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-2xl flex items-center justify-between group shadow-lg active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                                <span className="font-black text-sm uppercase tracking-widest">Launch Live Arena</span>
                            </div>
                        </button>
                        <button className="w-full p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-between group transition-all active:scale-95">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-emerald-400" />
                                <span className="font-black text-sm uppercase tracking-widest">Deploy Exam</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 4. BOTTOM LEFT: VELOCITY CHART */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                        <Activity size={16} className="text-emerald-500" /> Fleet Velocity
                    </h2>
                    <div className="flex items-end justify-between h-32 gap-3 px-2">
                        {weeklyActivity.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                <div className="absolute -top-8 bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{d.xp} XP</div>
                                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg relative flex items-end h-full mb-3 overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <div className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-sm transition-all duration-1000 group-hover:bg-cyan-400" style={{ height: d.height }} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. BOTTOM RIGHT: LIVE ACTIVITY FEED */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-all min-h-[400px]">
                    {/* 🔥 THE INTEGRATED FEED COMPONENT */}
                    <div className="flex-1 overflow-hidden">
                        <LiveActivityFeed />
                    </div>
                    
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700/50 active:scale-95 shrink-0"
                    >
                        View Full Mission Logs
                    </button>
                </div>

            </div>
        </div>
    );
}
