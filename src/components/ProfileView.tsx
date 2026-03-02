// src/components/ProfileView.tsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { INITIAL_SYSTEM_DECKS, INITIAL_SYSTEM_LESSONS } from '../constants/defaults';
import { calculateUserStats } from '../utils/profileHelpers';
import { Globe, Flame, Trophy, BarChart3, CheckCircle2, Zap, Settings, ChevronRight, UploadCloud, LogOut } from 'lucide-react';

export default function ProfileView({ user, userData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);

  // Fetch History & Calculate Stats
  useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('studentEmail', '==', user.email), orderBy('timestamp', 'desc'), limit(100));
      const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => d.data());
          setLogs(data);
          setStats(calculateUserStats(data));
      });
      return () => unsub();
  }, [user]);

  const handleLogout = () => signOut(auth);
  
  const toggleRole = async () => { 
      if (!userData) return; 
      const newRole = userData.role === 'instructor' ? 'student' : 'instructor'; 
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole }); 
  };

  const deploySystemContent = async () => { 
      if (!window.confirm("Overwrite system content? This is an admin action.")) return;
      setDeploying(true); 
      const batch = writeBatch(db); 
      Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); 
      INITIAL_SYSTEM_LESSONS.forEach((lesson) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); 
      try { await batch.commit(); alert("Content Deployed!"); } catch (e: any) { alert("Error: " + e.message); } 
      setDeploying(false); 
  };

  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = 1000 - (xp % 1000);
  const progressPct = (xp % 1000) / 10;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar pb-32">
        
        {/* 1. HERO HEADER (Glassmorphism) */}
        <div className="relative overflow-hidden bg-white pb-8 rounded-b-[3rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] z-10 border-b border-slate-100">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500"></div>
            <div className="absolute top-0 left-0 w-full h-48 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            
            <div className="relative pt-12 px-6 flex flex-col items-center">
                {/* Avatar */}
                <div className="w-28 h-28 p-1.5 bg-white/20 backdrop-blur-md rounded-full shadow-2xl mb-4 border border-white/30">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-4xl font-black text-slate-800 shadow-inner">
                        {userData?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                </div>
                
                {/* Name & Role */}
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">{userData?.name}</h2>
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">{userData?.role}</span>
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                        <Globe size={12}/> {userData?.targetLanguage || 'English'}
                    </span>
                </div>

                {/* Glass Stats Bar */}
                <div className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 flex justify-between items-center border border-slate-100">
                    <div className="text-center flex-1 border-r border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Level</div>
                        <div className="text-2xl font-black text-slate-800">{level}</div>
                    </div>
                    <div className="text-center flex-1 border-r border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">XP</div>
                        <div className="text-2xl font-black text-indigo-600">{xp}</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Streak</div>
                        <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                            <Flame size={20} fill="currentColor"/> {userData?.streak || 1}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="px-6 mt-6 space-y-6">
            
            {/* 2. PROGRESS BENTO BOX */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Next Level</h3>
                        <p className="text-xs text-slate-400 font-bold">{Math.round(nextLevelXp)} XP remaining</p>
                    </div>
                    <Trophy size={24} className="text-yellow-500 fill-yellow-500 drop-shadow-sm group-hover:scale-110 transition-transform"/>
                </div>
                {/* Juicy Progress Bar */}
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative z-10">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 relative" style={{ width: `${progressPct}%` }}>
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50"></div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-50 rounded-full blur-2xl z-0"></div>
            </div>

            {/* 3. ACTIVITY GRAPH */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-600"/> Activity</h3>
                <div className="flex items-end justify-between h-24 gap-2">
                    {stats.graphData.map((d: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div 
                                className="w-full bg-slate-100 rounded-lg relative group-hover:bg-indigo-500 transition-colors duration-300 overflow-hidden"
                                style={{ height: `${d.height}%` }}
                            >
                                <div className="absolute bottom-0 left-0 w-full h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{d.date.split('/')[1]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. RECENT HISTORY TILES */}
            <div>
                <h3 className="font-black text-slate-800 mb-4 px-2 text-sm uppercase tracking-wider text-slate-400">Recent History</h3>
                <div className="space-y-3">
                    {logs.slice(0, 5).map((log: any) => (
                        <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default group">
                            <div className={`p-3 rounded-2xl shrink-0 ${log.type === 'completion' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {log.type === 'completion' ? <CheckCircle2 size={20} strokeWidth={2.5}/> : <Zap size={20} strokeWidth={2.5}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{log.itemTitle}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(log.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-indigo-600 text-sm block">+{log.xp}</span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase">XP</span>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-2xl">No history yet. Start learning!</div>}
                </div>
            </div>

            {/* 5. SETTINGS CONTROL PANEL */}
            <div className="bg-slate-200 p-1.5 rounded-[2rem]">
                <button onClick={toggleRole} className="w-full bg-white p-4 rounded-[1.5rem] text-slate-700 font-bold flex justify-between items-center mb-1.5 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
                    <span className="flex items-center gap-3"><Settings size={18} className="text-slate-400"/> Switch Role ({userData?.role})</span>
                    <div className="bg-slate-100 p-1 rounded-full"><ChevronRight size={16} className="text-slate-400"/></div>
                </button>
                {userData?.role === 'instructor' && (
                    <button onClick={deploySystemContent} disabled={deploying} className="w-full bg-white p-4 rounded-[1.5rem] text-slate-700 font-bold flex justify-between items-center mb-1.5 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
                        <span className="flex items-center gap-3"><UploadCloud size={18} className="text-slate-400"/> {deploying ? 'Deploying...' : 'Reset System Content'}</span>
                        <div className="bg-slate-100 p-1 rounded-full"><ChevronRight size={16} className="text-slate-400"/></div>
                    </button>
                )}
                <button onClick={handleLogout} className="w-full bg-white p-4 rounded-[1.5rem] text-rose-600 font-bold flex justify-between items-center active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
                    <span className="flex items-center gap-3"><LogOut size={18} className="text-rose-400"/> Sign Out</span>
                    <div className="bg-rose-50 p-1 rounded-full"><LogOut size={16} className="text-rose-400"/></div>
                </button>
            </div>

        </div>
    </div>
  );
}
