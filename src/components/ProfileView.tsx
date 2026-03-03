// src/components/ProfileView.tsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { INITIAL_SYSTEM_DECKS, INITIAL_SYSTEM_LESSONS } from '../constants/defaults';
import { calculateUserStats, calculateLevel, getLeagueTier } from '../utils/profileHelpers';
import { 
  Globe, Flame, Trophy, BarChart3, CheckCircle2, Zap, 
  Settings, ChevronRight, UploadCloud, LogOut, Shield, Crown 
} from 'lucide-react';

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

  // --- GAMIFICATION MATH ---
  const xp = userData?.xp || 0;
  const streak = userData?.streak || 1;
  const { level, currentLevelXp, xpToNext, progressPct } = calculateLevel(xp);
  const league = getLeagueTier(level);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar pb-32">
        
        {/* 1. HERO HEADER (Gamified Glassmorphism) */}
        <div className="relative overflow-hidden bg-slate-900 pb-8 rounded-b-[3rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] z-10 border-b border-slate-800">
            {/* Dynamic Background based on League */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-transparent`} />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
            </div>
            
            <div className="relative pt-12 px-6 flex flex-col items-center">
                
                {/* SVG Progress Ring & Avatar */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-white/10" strokeWidth="6" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" 
                            stroke="currentColor" strokeWidth="6" 
                            strokeDasharray="283" strokeDashoffset={283 - (283 * progressPct) / 100} 
                            className={`${league.color} transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`} 
                            strokeLinecap="round" 
                        />
                    </svg>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center border-4 border-slate-800 shadow-inner text-4xl font-black text-slate-800">
                        {userData?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {/* Level Badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-1">
                        <Crown size={12} className={league.color} /> LVL {level}
                    </div>
                </div>
                
                {/* Name & Role */}
                <h2 className="text-3xl font-black text-white tracking-tight mb-3 mt-2">{userData?.name}</h2>
                
                <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-white/10 border border-white/20 text-slate-300 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md">
                        {userData?.role}
                    </span>
                    <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider backdrop-blur-md">
                        <Globe size={12}/> {userData?.targetLanguage || 'English'}
                    </span>
                    <span className={`px-3 py-1 bg-slate-800 border ${league.border} ${league.color} text-[10px] font-black rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg`}>
                        <Shield size={12}/> {league.name} League
                    </span>
                </div>

                {/* Core Stats Row */}
                <div className="w-full bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 flex justify-between items-center border border-slate-700">
                    <div className="text-center flex-1 border-r border-slate-700">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                           <Zap size={12} className="text-yellow-400" /> XP
                        </div>
                        <div className="text-xl font-black text-white">{xp}</div>
                    </div>
                    <div className="text-center flex-1 border-r border-slate-700">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                            <Flame size={12} className="text-orange-500" /> Streak
                        </div>
                        <div className="text-xl font-black text-white">{streak}</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-400" /> Perfect
                        </div>
                        <div className="text-xl font-black text-white">{stats.perfectScores}</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="px-6 mt-6 space-y-6">
            
            {/* 2. NEXT LEVEL TARGET */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Level {level + 1} Target</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{xpToNext - currentLevelXp} XP to go</p>
                    </div>
                    <Trophy size={24} className="text-yellow-500 fill-yellow-500 drop-shadow-sm group-hover:scale-110 transition-transform"/>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative z-10">
                    <div className={`h-full ${league.bg.replace('bg-', 'bg-').replace('100', '400').replace('50', '500')} transition-all duration-1000`} style={{ width: `${progressPct}%` }}>
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* 3. ACTIVITY GRAPH */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-600"/> Activity</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.totalHours} Hrs Total</span>
                </div>
                <div className="flex items-end justify-between h-24 gap-2">
                    {stats.graphData.map((d: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div 
                                className="w-full bg-indigo-50 rounded-lg relative group-hover:bg-indigo-500 transition-colors duration-300 overflow-hidden"
                                style={{ height: `${Math.max(15, d.height)}%` }} // Ensure minimum height so text aligns
                            >
                                <div className="absolute bottom-0 left-0 w-full h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${d.xp > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                                {d.date.split('/')[1]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. RECENT HISTORY TILES */}
            <div>
                <h3 className="font-black text-slate-800 mb-4 px-2 text-[10px] uppercase tracking-widest text-slate-400">Recent History</h3>
                <div className="space-y-3">
                    {logs.slice(0, 5).map((log: any) => (
                        <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default group">
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
