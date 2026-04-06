// src/components/instructor/CommandCenter.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Users, Play, FileText, Activity, 
    CheckCircle2, PenTool, Layers, BookOpen, 
    Clock, School, Inbox, Archive, Zap, GripHorizontal
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

    const activeClass = useMemo(() => classes.find((c: any) => c.id === selectedClassId) || classes[0], [classes, selectedClassId]);

    const stats = useMemo(() => {
        const classLogs = logs.filter((l: any) => l.classId === activeClass?.id);
        const weeklyXp = classLogs.reduce((acc: number, log: any) => acc + (log.xp || 0), 0);
        return {
            activeStudents: activeClass?.studentEmails?.length || 0,
            weeklyXp: weeklyXp,
            avgLevel: Math.floor(weeklyXp / 5000) + 1 
        };
    }, [activeClass, logs]);

    const weeklyActivity = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const classLogs = logs.filter((l: any) => l.classId === activeClass?.id);
        return days.map((day, index) => {
            const dayXp = classLogs.filter((_: any, i: number) => i % 5 === index).reduce((acc: number, l: any) => acc + l.xp, 0);
            const height = Math.min(100, (dayXp / 2000) * 100);
            return { day, xp: dayXp, height: `${height}%` };
        });
    }, [activeClass, logs]);

    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return '';
        const diffMins = (Date.now() - timestamp) / 60000;
        if (diffMins < 60) return `${Math.max(1, Math.round(diffMins))}m ago`;
        const diffHours = diffMins / 60;
        if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
        return `${Math.round(diffHours / 24)}d ago`;
    };

    const cardConfig = useMemo(() => [
        { id: 'live', title: 'Start Live Session', subtitle: 'Projector & Games', icon: Play, colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30', borderClass: 'hover:border-indigo-400 dark:hover:border-indigo-500', action: onLaunchLive },
        { id: 'assign', title: 'Assign Content', subtitle: 'To Dashboards', icon: FileText, colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30', borderClass: 'hover:border-emerald-400 dark:hover:border-emerald-500', action: () => setIsDeployModalOpen(true) },
        { id: 'lesson', title: 'Create Lesson', subtitle: 'Build Modules', icon: PenTool, colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30', borderClass: 'hover:border-blue-400 dark:hover:border-blue-500', action: () => setActiveTab('studio') },
        { id: 'deck', title: 'Create Deck', subtitle: 'Flashcard Data', icon: Layers, colorClass: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30', borderClass: 'hover:border-fuchsia-400 dark:hover:border-fuchsia-500', action: () => setActiveTab('studio') },
        { id: 'cohorts', title: 'Cohort Manager', subtitle: 'Manage Rosters', icon: School, colorClass: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30', borderClass: 'hover:border-violet-400 dark:hover:border-violet-500', action: () => setActiveTab('classes') },
        { id: 'gradebook', title: 'Gradebook', subtitle: 'Review Scores', icon: BookOpen, colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30', borderClass: 'hover:border-rose-400 dark:hover:border-rose-500', action: () => setActiveTab('gradebook') },
        { id: 'inbox', title: 'Comms Inbox', subtitle: 'Read & Send', icon: Inbox, colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30', borderClass: 'hover:border-amber-400 dark:hover:border-amber-500', action: () => setActiveTab('inbox') },
        { id: 'vault', title: 'Global Vault', subtitle: 'Saved Payloads', icon: Archive, colorClass: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30', borderClass: 'hover:border-cyan-400 dark:hover:border-cyan-500', action: () => setActiveTab('vault') }
    ], [onLaunchLive, setActiveTab, setIsDeployModalOpen]);

    const [cardOrder, setCardOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('magister_dashboard_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.length === cardConfig.length) return parsed;
            } catch (e) {}
        }
        return cardConfig.map(c => c.id);
    });

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { if (e.target instanceof HTMLElement) e.target.classList.add('opacity-50'); }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => { e.preventDefault(); dragOverItem.current = index; };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newOrder = [...cardOrder];
            const draggedId = newOrder[dragItem.current];
            newOrder.splice(dragItem.current, 1);
            newOrder.splice(dragOverItem.current, 0, draggedId);
            setCardOrder(newOrder);
            localStorage.setItem('magister_dashboard_order', JSON.stringify(newOrder));
        }
        if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-50');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-50');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none animate-in fade-in duration-500 relative transition-colors duration-300">
            <DeploymentModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} onDeploy={onAssign} activeClass={activeClass} lessons={lessons} allDecks={allDecks} curriculums={curriculums} />

            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-50 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Command Center</h2>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Instructor Dashboard</p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50">
                    <div className="pl-3 text-indigo-500 dark:text-indigo-400"><Users size={16} /></div>
                    <select 
                        value={selectedClassId} 
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none pr-6 cursor-pointer uppercase tracking-widest"
                    >
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                    
                    {/* 1. REARRANGEABLE QUICK ACTIONS (StudentHomeView Style) */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                        {cardOrder.map((id, index) => {
                            const config = cardConfig.find(c => c.id === id);
                            if (!config) return null;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={config.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} onClick={config.action}
                                    className={`bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col transition-all cursor-pointer group relative overflow-hidden h-[180px] ${config.borderClass} hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]`}
                                >
                                    <div className="flex justify-between items-start mb-auto relative z-10 shrink-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${config.colorClass}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="text-slate-200 dark:text-slate-700 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1">
                                            <GripHorizontal size={20} />
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1">{config.title}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{config.subtitle}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 2. BOTTOM ROW: CHARTS & LOGS */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
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
                                            {log.type === 'completion' ? <CheckCircle2 size={16} className="text-emerald-500" /> : log.type === 'explore' ? <Layers size={16} className="text-fuchsia-500" /> : <Activity size={16} className="text-indigo-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-0.5">{log.studentName || log.studentEmail?.split('@')[0]}</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">{log.itemTitle || log.type}</p>
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0 mt-1">{formatTimeAgo(log.timestamp)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <button onClick={() => setActiveTab('logs')} className="mt-4 w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] shrink-0">
                            View Full Archives
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
