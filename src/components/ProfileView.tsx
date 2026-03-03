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
  Camera, Loader2, Heart, Activity, AlertCircle
} from 'lucide-react';

// --- SUB-COMPONENT: REUSABLE AVATAR ---
// This now handles the potential delay in image loading
const UserAvatar = ({ user, size = "md", border = false }: any) => {
    const sizeClasses: any = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-12 h-12 text-sm",
        lg: "w-24 h-24 text-xl",
        xl: "w-32 h-32 text-2xl"
    };

    // Use dot-access safely
    const avatarUrl = user?.profile?.main?.avatarUrl;
    const name = user?.name || "Scholar";
    const initials = getInitials(name);

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[35%] overflow-hidden flex items-center justify-center font-black transition-all ${
                avatarUrl ? 'bg-slate-100' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
            } ${border ? 'ring-4 ring-white shadow-xl' : ''}`}>
                {avatarUrl ? (
                    <img 
                        key={avatarUrl} // Forces re-render when URL changes
                        src={avatarUrl} 
                        alt={name} 
                        className="w-full h-full object-cover animate-in fade-in duration-500" 
                    />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
        </div>
    );
};

export default function ProfileView({ user, userData: propUserData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // NEW: Local state for live profile updates
  const [liveProfile, setLiveProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. LISTEN TO PROFILE CHANGES (The missing link for the picture)
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
    const unsub = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            setLiveProfile(doc.data());
        }
    });
    return () => unsub();
  }, [user]);

  // 2. FETCH ACTIVITY LOGS
  useEffect(() => {
      if(!user) return;
      const q = query(
          collection(db, 'artifacts', appId, 'activity_logs'), 
          where('studentEmail', '==', user.email), 
          orderBy('timestamp', 'desc'), 
          limit(100)
      );
      const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => d.data());
          setLogs(data);
          setStats(calculateUserStats(data));
      });
      return () => unsub();
  }, [user]);

  // Merge the prop data with the live profile data for absolute reliability
  const activeData = liveProfile || propUserData;

  const handleLogout = () => signOut(auth);
  
  const toggleRole = async () => { 
      if (!activeData) return; 
      const newRole = activeData.role === 'instructor' ? 'student' : 'instructor'; 
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { role: newRole }); 
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user?.uid) return;
      if (!file.type.startsWith('image/')) { alert("Upload an image."); return; }

      setIsUploading(true);
      try { 
          await uploadProfilePicture(user.uid, file); 
          // The onSnapshot above will handle the UI update automatically!
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

  // --- AGILE MATH ---
  const xp = activeData?.xp || 0;
  const streak = activeData?.streak || 0;
  const totalLikes = activeData?.totalLikesReceived || 0;
  const { level, currentLevelXp, xpToNext, progressPct } = calculateLevel(xp, totalLikes);
  const league = getLeagueTier(level);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar pt-32 pb-40">
        
        {/* 1. MAGISTER HERO CARD */}
        <div className="px-6 mb-8">
            <div className="bg-slate-900 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-[60px] -ml-24 -mb-24" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 scale-125">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" fill="none" stroke="white" opacity="0.05" strokeWidth="2" />
                                <circle 
                                    cx="50" cy="50" r="46" fill="none" 
                                    stroke="url(#agileGradient)" strokeWidth="3" 
                                    strokeDasharray="289" strokeDashoffset={289 - (289 * progressPct) / 100} 
                                    strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                                />
                                <defs>
                                    <linearGradient id="agileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        
                        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer group relative">
                            {/* Pass activeData here to ensure it uses liveFirestore data */}
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

                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-4 py-1 rounded-full shadow-xl border border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
                            <Crown size={10} className="text-indigo-600" /> LVL {level}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{activeData?.name || "Magister OS User"}</h2>
                    <div className="flex gap-2 mb-8">
                        <span className="px-3 py-1 bg-white/10 text-white/60 text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/5">{activeData?.role}</span>
                        <span className="px-3 py-1 bg-white text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg flex items-center gap-1.5"><Shield size={10}/> {league.name} League</span>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 divide-x divide-white/5">
                        <div className="p-5 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-center gap-1"><Zap size={10} className="text-yellow-400"/> XP</div>
                            <div className="text-xl font-black text-white">{xp.toLocaleString()}</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-center gap-1"><Flame size={10} className="text-orange-500"/> Streak</div>
                            <div className="text-xl font-black text-white">{streak}</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-center gap-1"><Heart size={10} className="text-rose-500"/> Stars</div>
                            <div className="text-xl font-black text-white">{totalLikes}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="px-6 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Journey Progress</h3>
                    <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
                        Next: {xpToNext} XP
                    </div>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-3 p-1">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <span>{currentLevelXp} Current</span>
                    <span>{xpToNext - currentLevelXp} to Level {level + 1}</span>
                </div>
            </div>

            {/* System Control Settings */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
                <div className="p-2 space-y-1">
                    <button onClick={toggleRole} className="w-full p-5 hover:bg-slate-50 rounded-[2rem] transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform"><Settings size={20}/></div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">System Context</span>
                                <span className="text-sm font-black text-slate-800 capitalize">{activeData?.role} Mode</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300"/>
                    </button>

                    <button onClick={handleLogout} className="w-full p-5 hover:bg-rose-50 rounded-[2rem] transition-all flex items-center justify-between group mt-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform"><LogOut size={20}/></div>
                            <div className="text-left">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Session</span>
                                <span className="text-sm font-black text-rose-600">Terminate Connection</span>
                            </div>
                        </div>
                        <div className="bg-rose-100/50 p-2 rounded-full"><LogOut size={14} className="text-rose-500"/></div>
                    </button>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
    </div>
  );
}
