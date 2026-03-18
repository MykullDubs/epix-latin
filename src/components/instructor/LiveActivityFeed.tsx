// src/components/instructor/LiveActivityFeed.tsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { Activity, CheckCircle2, Zap, Clock, Flame } from 'lucide-react';

export default function LiveActivityFeed() {
    const [logs, setLogs] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Helper for relative time (e.g., "Just now" or "2m ago")
    const formatTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    };

    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            orderBy('timestamp', 'desc'), 
            limit(20)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden transition-colors duration-300">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-500/10 p-1.5 rounded-lg">
                        <Flame size={18} className="text-orange-500 animate-pulse" />
                    </div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">
                        Live Pulse
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Sync</span>
                </div>
            </div>

            {/* Scrollable Feed */}
            <div 
                className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4" 
                ref={scrollRef}
            >
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                        <Activity size={32} className="mb-2 text-slate-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Signal...</p>
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div 
                            key={log.id} 
                            className="flex items-start gap-3 animate-in slide-in-from-right-6 fade-in duration-500 fill-mode-backwards group"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            {/* Tactical Initial Icon */}
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-indigo-400 group-hover:border-indigo-500 transition-colors">
                                {log.studentName?.charAt(0).toUpperCase() || log.studentEmail?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate pr-2">
                                        {log.studentName || log.studentEmail?.split('@')[0]}
                                    </p>
                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0 tabular-nums flex items-center gap-1">
                                        <Clock size={8} /> {formatTime(log.timestamp)}
                                    </span>
                                </div>
                                
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                                    {log.type === 'completion' ? 'Mastered' : 'Run initialized:'}{" "}
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black italic">
                                        {log.itemTitle}
                                    </span>
                                </p>
                                
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                        +{log.xp || 50} XP
                                    </span>
                                    {log.scorePct !== undefined && (
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                            log.scorePct >= 80 
                                                ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/10' 
                                                : 'text-amber-500 bg-amber-500/10 border-amber-500/10'
                                        }`}>
                                            {Math.round(log.scorePct)}% Accuracy
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
