// src/components/instructor/CommandCenter.tsx
import React, { useState, useMemo } from 'react';
import { 
    Users, Zap, TrendingUp, AlertTriangle, Play, FileText, 
    Activity, ChevronRight, Shield, Target, Calendar,
    CheckCircle2, Mail, Crosshair // 🔥 Added Mail and Crosshair icons
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

    // 3. ACTIONABLE Smart Triage Alerts
    const triageAlerts = useMemo(() => {
        const alerts: any[] = [];
        const now = Date.now();
        const classLogs = logs.filter((l: any) => l.classId === activeClass?.id);

        // Performance Alerts
        const lowScores = classLogs.filter((l: any) => l.scorePct !== undefined && l.scorePct < 70);
        if (lowScores.length > 0) {
            alerts.push({ 
                id: 'perf', 
                type: 'warning', 
                text: `${lowScores.length} recent scores below 70%`, 
                actionLabel: 'Intervene',
                actionType: 'deploy',
                icon: Crosshair
            });
        }

        // MIA (Missing In Action) Alerts
        activeClass?.studentEmails?.forEach((email: string) => {
            const studentLogs = classLogs.filter((l: any) => l.studentEmail === email);
            const lastLog = studentLogs[0]?.timestamp || 0;
            // If inactive for more than 3 days
            if (now - lastLog > 3 * 24 * 60 * 60 * 1000) { 
                alerts.push({ 
                    id: `inactive-${email}`, 
                    type: 'mia', 
                    text: `${email.split('@')[0]} inactive for 3+ days`, 
                    actionLabel: 'Ping',
                    actionType: 'email',
                    targetPayload: email,
                    icon: Mail
                });
            }
        });

        return alerts.slice(0, 4); // Show up to 4 alerts now
    }, [activeClass, logs]);

    // 4. Calculate Fleet Velocity
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

    // Handle the new Action Buttons in the Triage Panel
    const handleTriageAction = (alert: any) => {
        if (alert.actionType === 'email') {
            // Opens the user's default email client with a pre-filled subject
            window.location.href = `mailto:${alert.targetPayload}?subject=Magister OS: Checking in regarding ${activeClass?.name}`;
        } else if (alert.actionType === 'deploy') {
            // Opens the deployment modal so you can assign a remedial deck
            setIsDeployModalOpen(true);
        }
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
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 uppercase italic">
                        Command Center
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Shield size={14} className="text-indigo-500" /> Tactical HUD
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
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all hover:border-indigo-200 dark:hover:border-indigo-500/50 group">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Users size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeStudents}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined Scholars</span>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all hover:border-amber-200 dark:hover:border-amber-500/50 group">
                        <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor" /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.weeklyXp.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet XP</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center md:items-start transition-all hover:border-emerald-200 dark:hover:border-emerald-500/50 group">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">Lvl {stats.avgLevel}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Rank</span>
                    </div>
                </div>

                {/* 2. MIDDLE LEFT: ACTIONABLE TRIAGE PANEL */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle size={16} className="text-rose-500" /> Tactical Triage
                        </h2>
                    </div>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        {triageAlerts.length > 0 ? triageAlerts.map((alert, i) => {
                            const ActionIcon = alert.icon;
                            return (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${alert.type === 'warning' ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-amber-500'}`} />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{alert.text}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleTriageAction(alert)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all shadow-sm active:scale-95"
                                    >
                                        <ActionIcon size={12} /> {alert.actionLabel}
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="py-8 text-center opacity-40">
                                <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500 drop-shadow-md" />
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">All Systems Nominal</p>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">No interventions required at this time.</p>
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
                            className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white rounded-2xl flex items-center justify-between group shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                                <span className="font-black text-sm uppercase tracking-widest">Launch Arena</span>
                            </div>
                        </button>
                        
                        <button 
                            onClick={() => setIsDeployModalOpen(true)}
                            className="w-full p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-between group transition-all active:scale-95 border border-slate-700"
                        >
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-emerald-400" />
                                <span className="font-black text-sm uppercase tracking-widest">Deploy Mission</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
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

                {/* 5. BOTTOM RIGHT: LIVE ACTIVITY FEED */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-all min-h-[400px]">
                    <div className="flex-1 overflow-hidden">
                        <LiveActivityFeed />
                    </div>
                    
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className="mt-6 w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700/50 active:scale-95 shrink-0"
                    >
                        Access Mission Logs
                    </button>
                </div>

            </div>
        </div>
    );
}
