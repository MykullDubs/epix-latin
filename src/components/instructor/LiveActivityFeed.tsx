// src/components/instructor/LiveActivityFeed.tsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { Activity, CheckCircle2, Zap, Clock } from 'lucide-react';

export default function LiveActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Live Student Activity</h2>
            <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">LIVE</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50" ref={scrollRef}>
            {logs.length === 0 && <div className="text-center text-slate-400 italic mt-10">No recent activity.</div>}
            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full mt-1">
                           {log.type === 'completion' ? <CheckCircle2 size={16}/> : <Zap size={16}/>}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{log.studentName}</p>
                            <p className="text-xs text-slate-500">Completed <span className="font-bold text-indigo-600">{log.itemTitle}</span></p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 flex items-center gap-1"><Clock size={10}/> {new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="text-[10px] font-bold text-emerald-600">+{log.xp} XP</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
