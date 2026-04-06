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
  calculateUserStats, calculateLevel, getLeagueTier, uploadProfilePicture 
} from '../utils/profileHelpers';
import { 
  Flame, Trophy, Zap, Settings, ChevronRight, UploadCloud, LogOut, 
  Shield, Crown, Camera, Loader2, Heart, Activity, History, Target, Moon
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import HoloAvatar from './HoloAvatar'; 
import AvatarForge from './AvatarForge'; 

// Only keeping the Title Map here since Auras and Avatars are now handled by HoloAvatar
const TITLE_MAP: Record<string, string> = {
    'title_scholar': '"The Scholar"',
    'title_glitch': '"System Glitch"',
    'title_architect': '"The Architect"',
};

export default function ProfileView({ user, userData: propUserData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [liveProfile, setLiveProfile] = useState<any>(null);
  
  // Avatar Forge State
  const [showForge, setShowForge] = useState(false);
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
          if (uploadProfilePicture) {
              await uploadProfilePicture(user.uid, file);
              
              // Automatically un-equip Store Avatars so the new photo shows up
              const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
              const newEquipped = { ...(activeData.equipped || {}) };
              delete newEquipped.avatars;
              await updateDoc(userRef, { equipped: newEquipped });
          }
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
      try { await batch.commit(); alert("Content Synchronized Successfully!"); } catch (e: any) { alert("Error: " + e.message); } 
      setDeploying(false); 
  };

  // AVATAR FORGE SAVE HANDLER
  const handleSaveCustomAvatar = async (finalUrl: string, config: any) => {
      if (!user?.uid) return;
      try {
          const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
          
          const newEquipped = { ...(activeData.equipped || {}) };
          if (newEquipped.avatars) delete newEquipped.avatars;

          await updateDoc(userRef, {
              'profile.main.avatarUrl': finalUrl,
              'customAvatarConfig': config,
              'equipped': newEquipped
          });
          setShowForge(false);
      } catch (err) {
          console.error("Failed to save avatar:", err);
      }
  };

  const xp = activeData?.profile?.main?.xp || activeData?.xp || 0;
  const streak = activeData?.profile?.main?.streak || activeData?.streak || 0;
  const totalLikes = activeData?.profile?.main?.totalLikesReceived || activeData?.totalLikesReceived || 0;
  
  const { level, currentLevelXp, xpToNext, progressPct } = calculateLevel ? calculateLevel(xp, totalLikes) : { level: 1, currentLevelXp: xp, xpToNext: 100, progressPct: 0 };
  const league = getLeagueTier ? getLeagueTier(level) : { name: 'Bronze' };

  const activeTitle = activeData?.equipped?.titles ? TITLE_MAP[activeData.equipped.titles] : "Student";

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 relative overflow-hidden">
        
        {/* UNIFIED HEADER */}
        <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-50 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                    <User size={18} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Profile Center</h2>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Manage Identity & Settings</p>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-10 pb-32 focus:outline-none">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* 1. HERO CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                        
                        {/* AVATAR RING */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 scale-[1.35] z-0 pointer-events-none">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3" />
                                    <circle 
                                        cx="50" cy="50" r="46" fill="none" 
                                        stroke="url(#levelGradient)" strokeWidth="4" 
                                        strokeDasharray="289" strokeDashoffset={289 - (289 * progressPct) / 100} 
                                        strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                                    />
                                    <defs>
                                        <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#22d3ee" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            
                            <div onClick={() => setShowForge(true)} className="cursor-pointer group relative z-10 mt-2 ml-2">
                                <HoloAvatar student={activeData} size="xl" />
                                <div className="absolute inset-0 bg-black/40 rounded-[35%] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm shadow-inner">
                                    <Settings className="text-white mb-1" size={24} />
                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Edit Avatar</span>
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-slate-900/80 rounded-[35%] flex items-center justify-center z-20 backdrop-blur-sm">
                                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                                    </div>
                                )}
                            </div>

                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 whitespace-nowrap z-30 transition-colors">
                                <Crown size={12} className="text-indigo-600 dark:text-indigo-400" /> LVL {level}
                            </div>
                        </div>

                        {/* PROFILE INFO */}
                        <div className="flex flex-col items-center md:items-start flex-1 text-center md:text-left mt-2">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{activeData?.name || "User"}</h2>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-5 tracking-widest">{activeTitle}</span>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700/50 shadow-sm">{activeData?.role}</span>
                                <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 shadow-sm flex items-center gap-1.5"><Shield size={12}/> {league.name} League</span>
                            </div>

                            <div className="grid grid-cols-3 w-full bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-700/50 shadow-sm">
                                <div className="p-4 text-center">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex justify-center items-center gap-1"><Zap size={12} className="text-amber-500"/> Total XP</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{xp.toLocaleString()}</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex justify-center items-center gap-1"><Flame size={12} className="text-orange-500"/> Streak</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{streak}</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex justify-center items-center gap-1"><Heart size={12} className="text-rose-500"/> Stars</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{totalLikes}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* LEFT COLUMN */}
                    <div className="space-y-8">
                        
                        {/* JOURNEY PROGRESS */}
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[11px] flex items-center gap-2"><Trophy size={16} className="text-amber-500"/> Level Progress</h3>
                                <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl uppercase border border-indigo-100 dark:border-indigo-500/20 shadow-sm">Next: {xpToNext} XP</div>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden mb-3 shadow-inner">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                                <span>{currentLevelXp} Current</span>
                                <span>{xpToNext - currentLevelXp} Remaining</span>
                            </div>
                        </div>

                        {/* RECENT ACTIVITY TIMELINE */}
                        {logs.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[11px] flex items-center gap-2"><History size={16} className="text-indigo-500"/> Recent Activity</h3>
                                </div>
                                <div className="space-y-3">
                                    {logs.slice(0, 4).map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-indigo-500 border border-slate-100 dark:border-slate-700 transition-colors duration-300 group-hover:scale-110">
                                                    <Target size={18} />
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                    <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                                        {log.itemTitle || 'Arena Match'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 dark:border-emerald-500/20 shadow-sm">
                                                +{log.score || log.xp || 0} XP
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-8">
                        
                        {/* LEARNING VELOCITY */}
                        {stats?.graphData?.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 flex flex-col h-[280px]">
                                <div className="flex justify-between items-center mb-8 shrink-0">
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[11px] flex items-center gap-2"><Activity size={16} className="text-emerald-500"/> Learning Velocity</h3>
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{stats.totalHours} Active Hours</span>
                                </div>
                                
                                <div className="flex items-end justify-between gap-3 px-2 flex-1 mt-auto">
                                    {stats.graphData.map((d: any, i: number) => (
                                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                                            <div className="absolute -top-10 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-10">
                                                {d.minutes} mins
                                            </div>
                                            
                                            <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl relative flex items-end h-full mb-3 border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                                                <div 
                                                    className={`w-full transition-all duration-1000 rounded-t-sm ${d.minutes > 0 ? 'bg-indigo-500 group-hover:bg-cyan-400 dark:bg-indigo-600 dark:group-hover:bg-cyan-500' : 'bg-transparent'}`} 
                                                    style={{ height: `${d.height}%` }} 
                                                />
                                            </div>
                                            <span className={`text-[9px] font-black uppercase transition-colors ${d.minutes > 0 ? 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>{d.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SETTINGS MENU */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50">
                                
                                {/* APPEARANCE TOGGLE */}
                                <div className="w-full p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20 shadow-sm"><Moon size={20}/></div>
                                        <div className="text-left">
                                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Appearance</span>
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Interface Theme</span>
                                        </div>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                {/* ROLE TOGGLE */}
                                <button onClick={toggleRole} className="w-full p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm group-hover:scale-110 transition-transform"><Settings size={20}/></div>
                                        <div className="text-left">
                                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Account Role</span>
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{activeData?.role} Mode</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform"/>
                                </button>

                                {/* SYSTEM SYNC (INSTRUCTOR ONLY) */}
                                {activeData?.role === 'instructor' && (
                                    <button onClick={deploySystemContent} disabled={deploying} className="w-full p-6 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm group-hover:scale-110 transition-transform"><UploadCloud size={20}/></div>
                                            <div className="text-left">
                                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">System Core</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{deploying ? 'Updating...' : 'Sync Content'}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform"/>
                                    </button>
                                )}

                                {/* LOGOUT */}
                                <button onClick={handleLogout} className="w-full p-6 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 shadow-sm group-hover:scale-110 transition-transform"><LogOut size={20}/></div>
                                        <div className="text-left">
                                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Session</span>
                                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Log Out</span>
                                        </div>
                                    </div>
                                    <div className="bg-rose-100 dark:bg-rose-500/20 p-2 rounded-xl border border-rose-200 dark:border-rose-500/30 transition-colors"><LogOut size={14} className="text-rose-600 dark:text-rose-400"/></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

        {/* FORGE MODAL PORTAL */}
        {showForge && (
            <AvatarForge 
                currentConfig={activeData?.customAvatarConfig} 
                onSave={handleSaveCustomAvatar} 
                onClose={() => setShowForge(false)} 
            />
        )}
    </div>
  );
}
