// src/components/ProfileView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { 
  collection, query, where, orderBy, limit, onSnapshot, 
  doc, updateDoc, writeBatch 
} from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { INITIAL_SYSTEM_DECKS, INITIAL_SYSTEM_LESSONS } from '../constants/defaults';
import { 
  calculateUserStats, 
  calculateLevel, 
  getLeagueTier, 
  uploadProfilePicture, 
  getInitials 
} from '../utils/profileHelpers';
import { 
  Globe, Flame, Trophy, BarChart3, CheckCircle2, Zap, 
  Settings, ChevronRight, UploadCloud, LogOut, Shield, Crown,
  Camera, Loader2, Heart, Activity, AlertCircle, History, Target, Moon
} from 'lucide-react';
import ThemeToggle from './ThemeToggle'; // 🔥 IMPORTED THE TOGGLE

// --- SUB-COMPONENT: REUSABLE AVATAR ---
const UserAvatar = ({ user, size = "md", border = false }: any) => {
    const sizeClasses: any = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-12 h-12 text-sm",
        lg: "w-24 h-24 text-xl",
        xl: "w-32 h-32 text-2xl"
    };

    const avatarUrl = user?.profile?.main?.avatarUrl || user?.avatarUrl;
    const name = user?.name || "Scholar";
    const initials = getInitials ? getInitials(name) : name[0].toUpperCase();

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[35%] overflow-hidden flex items-center justify-center font-black transition-all ${
                avatarUrl ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
            } ${border ? 'ring-4 ring-white dark:ring-slate-900 shadow-xl' : ''}`}>
                {avatarUrl ? (
                    <img 
                        key={avatarUrl} 
                        src={avatarUrl} 
                        alt={name} 
                        className="w-full h-full object-cover animate-in fade-in duration-500" 
                    />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
        </div>
    );
};

export default function ProfileView({ user, userData: propUserData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [liveProfile, setLiveProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. LIVE LISTENER
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) setLiveProfile(docSnap.data());
    });
  }, [user]);

  // 2. ACTIVITY LOGS
  useEffect(() => {
      if(!user) return;
      const q = query(
          collection(db, 'artifacts', appId, 'activity_logs'), 
          where('studentEmail', '==', user.email), 
          orderBy('timestamp', 'desc'), 
          limit(100)
      );
      return onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => d.data());
          setLogs(data);
          if (calculateUserStats) {
              setStats(calculateUserStats(data));
          }
      });
  }, [user]);

  // 3. DATA MERGE
  const activeData = {
      ...propUserData,
      ...liveProfile,
      profile: {
          ...propUserData?.profile,
          ...liveProfile?.profile,
          main: {
              ...propUserData?.profile?.main,
              ...liveProfile?.profile?.main
          }
      }
  };

  const handleLogout = () => signOut(auth);
  
  const toggleRole = async () => { 
      if (!activeData) return; 
      const newRole = activeData.role === 'instructor' ? 'student' : 'instructor'; 
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { role: newRole }); 
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user?.uid) return;
      setIsUploading(true);
      try { 
          if (uploadProfilePicture) await uploadProfilePicture(user.uid, file); 
      } catch (err: any) { 
          alert(`Upload failed: ${err.message}`); 
      } finally { 
          setIsUploading(false); 
      }
  };

  const deploySystemContent = async () => { 
      if (!window.confirm("Overwrite system content?")) return;
      setDeploying(true); 
      const batch = writeBatch(db); 
      Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); 
      INITIAL_SYSTEM_LESSONS.forEach((lesson) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); 
      try { await batch.commit(); alert("Magister OS Core Rebuilt!"); } catch (e: any) { alert("Error: " + e.message); } 
      setDeploying(false); 
  };

  const xp = activeData?.profile?.main?.xp || activeData?.xp || 0;
  const streak = activeData?.profile?.main?.streak || activeData?.streak || 0;
  const totalLikes = activeData?.profile?.main?.totalLikesReceived || activeData?.totalLikesReceived || 0;
  
  const { level, currentLevelXp, xpToNext, progressPct } = calculateLevel ? calculateLevel(xp, totalLikes) : { level: 1, currentLevelXp: xp, xpToNext: 100, progressPct: 0 };
  const league = getLeagueTier ? getLeagueTier(level) : { name: 'Bronze' };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar pt-2 pb-40 transition-colors duration-300">
        
        {/* 1. HERO CARD */}
        <div className="px-6 mb-8">
            <div className="bg-slate-900 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl border border-white/5 dark:border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col items-center">
                    
                    {/* AVATAR & SQUIRCLE PROGRESS RING */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 scale-125">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <rect x="4" y="4" width="92" height="92" rx="32" fill="none" stroke="white" opacity="0.05" strokeWidth="2" />
                                <rect 
                                    x="4" y="4" width="92" height="92" rx="32" fill="none" 
                                    stroke="url(#agileGradient)" strokeWidth="3" 
                                    strokeDasharray="314" strokeDashoffset={314 - (314 * progressPct) / 100} 
                                    strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                                />
                                <defs>
                                    <linearGradient id="agileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        
                        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer group relative">
                            <UserAvatar user={activeData} size="xl" />
                            <div className="absolute inset-0 bg-black/40 rounded-[35%] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                                <Camera className="text-white mb-1" size={24} />
                                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Edit</span>
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 bg-slate-900/80 rounded-[35%] flex items-center justify-center z-20">
                                    <Loader2 className="animate-spin text-cyan-400" size={32} />
                                </div>
                            )}
                        </div>

                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black px-4 py-1 rounded-full shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 whitespace-nowrap z-30 transition-colors duration-300">
                            <Crown size={10} className="text-indigo-600 dark:text-indigo-400" /> LVL {level}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{activeData?.name || "User"}</h2>
                    <div className="flex gap-2 mb-8">
                        <span className="px-3 py-1 bg-white/10 text-white/60 text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/5">{activeData?.role}</span>
                        <span className="px-3 py-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg flex items-center gap-1.5 transition-colors duration-300"><Shield size={10}/> {league.name} League</span>
                    </div>

                    <div className="grid grid-cols-3 w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 divide-x divide-white/5">
                        <div className="p-5 text-center">
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-center gap-1"><Zap size={10} className="text-yellow-400"/> Total XP</div>
                            <div className="text-xl font-black text-white">{xp.toLocaleString()}</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-center gap-1"><Flame size={10} className="text-orange-500"/> Streak</div>
                            <div className="text-xl font-black text-white">{streak}</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-center gap-1"><Heart size={10} className="text-rose-500"/> Stars</div>
                            <div className="text-xl font-black text-white">{totalLikes}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="px-6 space-y-6">
            
            {/* JOURNEY PROGRESS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[10px] flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Journey Progress</h3>
                    <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase transition-colors duration-300">Next: {xpToNext} XP</div>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden mb-3 p-1 transition-colors duration-300">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    <span>{currentLevelXp} Current</span>
                    <span>{xpToNext - currentLevelXp} remaining</span>
                </div>
            </div>

            {/* RECENT ACTIVITY TIMELINE */}
            {logs.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[10px] flex items-center gap-2"><History size={14} className="text-indigo-600 dark:text-indigo-400"/> Recent Protocols</h3>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{logs.length} Total</span>
                    </div>
                    <div className="space-y-3">
                        {logs.slice(0, 4).map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 transition-colors duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-[10px] shadow-sm flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                                        <Target size={16} />
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                                            {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        <span className="block text-xs font-black text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                            {log.itemTitle || 'Arena Match'}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 dark:border-emerald-500/20 transition-colors duration-300">
                                    +{log.score || log.xp || 0} XP
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LEARNING VELOCITY */}
            {stats?.graphData?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[10px] flex items-center gap-2"><Activity size={14} className="text-indigo-600 dark:text-indigo-400"/> Learning Velocity</h3>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">{stats.totalHours} Active Hours</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-24 gap-2 px-1">
                        {stats.graphData.map((d: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                <div className="absolute -top-8 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-10">
                                    {d.minutes} mins
                                </div>
                                
                                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg relative flex items-end h-full mb-3 border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-colors duration-300">
                                    <div 
                                        className={`w-full transition-all duration-1000 rounded-t-sm ${d.minutes > 0 ? 'bg-indigo-500 group-hover:bg-cyan-400 dark:bg-indigo-600 dark:group-hover:bg-cyan-500' : 'bg-transparent'}`} 
                                        style={{ height: `${d.height}%` }} 
                                    />
                                </div>
                                <span className={`text-[8px] font-black uppercase transition-colors ${d.minutes > 0 ? 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SETTINGS BENTO BLOCK */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="flex flex-col">
                    
                    {/* 🔥 NEW: APPEARANCE TOGGLE ROW */}
                    <div className="w-full p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl text-cyan-600 dark:text-cyan-400 transition-colors duration-300"><Moon size={20}/></div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Appearance</span>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-100">Interface Theme</span>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>

                    {/* ROLE TOGGLE */}
                    <button onClick={toggleRole} className="w-full p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group border-b border-slate-50 dark:border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-all"><Settings size={20}/></div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">System Context</span>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-100 capitalize">{activeData?.role} Mode</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600"/>
                    </button>

                    {/* SYSTEM SYNC (INSTRUCTOR ONLY) */}
                    {activeData?.role === 'instructor' && (
                        <button onClick={deploySystemContent} disabled={deploying} className="w-full p-5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center justify-between group border-b border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-all"><UploadCloud size={20}/></div>
                                <div className="text-left">
                                    <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Infrastructure</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{deploying ? 'Rebuilding...' : 'Synchronize Core'}</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 dark:text-slate-600"/>
                        </button>
                    )}

                    {/* LOGOUT */}
                    <button onClick={handleLogout} className="w-full p-5 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-all"><LogOut size={20}/></div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Session</span>
                                <span className="text-sm font-black text-rose-600 dark:text-rose-400">Terminate Connection</span>
                            </div>
                        </div>
                        <div className="bg-rose-100/50 dark:bg-rose-500/20 p-2 rounded-full transition-colors"><LogOut size={14} className="text-rose-500 dark:text-rose-400"/></div>
                    </button>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
    </div>
  );
}
