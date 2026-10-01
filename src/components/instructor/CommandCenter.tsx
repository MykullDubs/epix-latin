// src/components/instructor/CommandCenter.tsx
import React, { useState, useMemo, useRef } from 'react';
import { 
    Users, Play, FileText, Activity, 
    CheckCircle2, PenTool, Layers, BookOpen, 
    Clock, School, Inbox, Archive, Zap, GripHorizontal, ChevronDown, Home
} from 'lucide-react';
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
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false); 

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
        { id: 'live', title: 'Start Live Session', subtitle: 'Projector & smartboard games', icon: Play, colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30', borderClass: 'hover:border-indigo-400 dark:hover:border-indigo-500', action: onLaunchLive },
        { id: 'assign', title: 'Assign Content', subtitle: 'Send to student dashboards', icon: FileText, colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30', borderClass: 'hover:border-emerald-400 dark:hover:border-emerald-500', action: () => setIsDeployModalOpen(true) },
        { id: 'lesson', title: 'Create Lesson', subtitle: 'Build interactive modules', icon: PenTool, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30', borderClass: 'hover:border-blue-400 dark:hover:border-blue-500', action: () => setActiveTab('studio') },
        { id: 'deck', title: 'Create Flashcards', subtitle: 'Vocab & concept decks', icon: Layers, colorClass: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30', borderClass: 'hover:border-fuchsia-400 dark:hover:border-fuchsia-500', action: () => setActiveTab('studio') },
        { id: 'classes', title: 'Classes', subtitle: 'Manage student rosters', icon: School, colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30', borderClass: 'hover:border-violet-400 dark:hover:border-violet-500', action: () => setActiveTab('classes') },
        { id: 'gradebook', title: 'Gradebook', subtitle: 'Review student performance', icon: BookOpen, colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30', borderClass: 'hover:border-rose-400 dark:hover:border-rose-500', action: () => setActiveTab('gradebook') },
        { id: 'inbox', title: 'Messages', subtitle: 'Read and send updates', icon: Inbox, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30', borderClass: 'hover:border-amber-400 dark:hover:border-amber-500', action: () => setActiveTab('inbox') },
        { id: 'vault', title: 'Library', subtitle: 'Manage all saved content', icon: Archive, colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30', borderClass: 'hover:border-cyan-400 dark:hover:border-cyan-500', action: () => setActiveTab('vault') }
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
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 relative transition-colors duration-300">
            <DeploymentModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} onDeploy={onAssign} activeClass={activeClass} lessons={lessons} allDecks={allDecks} curriculums={curriculums} />

            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-40 shadow-sm transition-colors duration-300 select-none">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <Home size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Today</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Overview & Quick Actions</p>
                    </div>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                        className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 min-w-[200px] justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-indigo-500 dark:text-indigo-400"><Users size={18} /></div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {activeClass?.name || 'Select Class'}
                            </span>
                        </div>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isClassDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsClassDropdownOpen(false)} />
                            <div className="absolute top-full right-0 mt-2 w-full min-w-[240px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                                {classes.map((c: any) => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedClassId(c.id); setIsClassDropdownOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors flex items-center gap-3 ${selectedClassId === c.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${selectedClassId === c.id ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
                    
                    {/* 1. REARRANGEABLE QUICK ACTIONS */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-2 select-none">
                        {cardOrder.map((id, index) => {
                            const config = cardConfig.find(c => c.id === id);
                            if (!config) return null;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={config.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} onClick={config.action}
                                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col transition-all cursor-pointer group relative overflow-hidden h-[160px] ${config.borderClass} hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-indigo-500/10`}
                                >
                                    <div className="flex justify-between items-start mb-auto relative z-10 shrink-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.colorClass}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="text-slate-300 dark:text-slate-700 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1">
                                            <GripHorizontal size={20} />
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">{config.title}</h3>
                                        <p className="text-sm font-medium text-slate-500">{config.subtitle}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 2. BOTTOM ROW: CHARTS & LOGS */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-[350px]">
                            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-8 shrink-0 select-none">
                                <Activity size={20} className="text-indigo-500" /> Activity This Week
                            </h2>
                            <div className="flex items-end justify-between gap-4 px-2 flex-1 mt-auto pb-4 select-none">
                                {weeklyActivity.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                        <div className="absolute -top-10 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                            {d.xp.toLocaleString()} XP
                                        </div>
                                        <div className="w-full max-w-[60px] bg-slate-100 dark:bg-slate-800/50 rounded-2xl relative flex items-end h-full mb-4 overflow-hidden border border-slate-200 dark:border-slate-800">
                                            <div className="w-full bg-indigo-500 dark:bg-indigo-500/80 rounded-t-xl transition-all duration-1000 group-hover:bg-indigo-400" style={{ height: d.height }} />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{d.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. RIGHT COLUMN: M3 INLINE LIVE PULSE */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-6 shrink-0 select-none">
                            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Zap size={20} className="text-amber-500" fill="currentColor" /> Recent Activity
                            </h2>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
                            {logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 select-none">
                                    <Clock size={32} className="mb-4" />
                                    <p className="text-sm font-medium">No recent activity.</p>
                                </div>
                            ) : (
                                logs.slice(0, 20).map((log: any, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                            {log.type === 'completion' ? <CheckCircle2 size={18} className="text-emerald-500" /> : log.type === 'explore' ? <Layers size={18} className="text-fuchsia-500" /> : <Activity size={18} className="text-indigo-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight mb-1">{log.studentName || log.studentEmail?.split('@')[0]}</p>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{log.itemTitle || log.type}</p>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-400 shrink-0 mt-0.5">{formatTimeAgo(log.timestamp)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <button onClick={() => setActiveTab('logs')} className="mt-4 w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98] shrink-0 border border-slate-200 dark:border-slate-700 select-none">
                            View Full Archives
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
