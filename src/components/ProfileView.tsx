import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
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
  Camera, Loader2, Heart
} from 'lucide-react';

// --- SUB-COMPONENT: REUSABLE AVATAR ---
const UserAvatar = ({ user, size = "md", border = false }: any) => {
    const sizeClasses: any = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-12 h-12 text-sm",
        lg: "w-24 h-24 text-xl",
        xl: "w-32 h-32 text-2xl"
    };

    const avatarUrl = user?.profile?.main?.avatarUrl;
    const name = user?.name || "Scholar";
    const initials = getInitials(name);

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[30%] overflow-hidden flex items-center justify-center font-black transition-all ${
                avatarUrl ? 'bg-slate-100' : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
            } ${border ? 'ring-4 ring-slate-800 shadow-2xl' : ''}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {/* Agile Online Status */}
            <div className="absolute -bottom-1 -right-1 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" />
        </div>
    );
};

export default function ProfileView({ user, userData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { role: newRole }); 
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user?.uid) return;

      if (file.size > 2 * 1024 * 1024) {
          alert("Image too large. Please keep it under 2MB.");
          return;
      }

      setIsUploading(true);
      try {
          await uploadProfilePicture(user.uid, file);
      } catch (err) {
          alert("Failed to upload image.");
      } finally {
          setIsUploading(false);
      }
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

  // --- GAMIFICATION MATH (Updated with Likes) ---
  const xp = userData?.xp || 0;
  const streak = userData?.streak || 0;
  const totalLikes = userData?.totalLikesReceived || 0;
  const { level, currentLevelXp, xpToNext, progressPct } = calculateLevel(xp, totalLikes);
  const league = getLeagueTier(level);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar pb-32">
        
        {/* 1. HERO HEADER */}
        <div className="relative overflow-hidden bg-slate-900 pb-10 rounded-b-[3.5rem] shadow-2xl z-10 border-b border-slate-800">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600 to-transparent`} />
            </div>
            
            <div className="relative pt-12 px-6 flex flex-col items-center">
                
                {/* SVG Progress Ring & Interactive Avatar */}
                <div className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="4" />
                        <circle 
                            cx="50" cy="50" r="46" fill="none" 
                            stroke="currentColor" strokeWidth="4" 
                            strokeDasharray="289" strokeDashoffset={289 - (289 * progressPct) / 100} 
                            className={`${league.color} transition-all duration-1000 ease-out`} 
                            strokeLinecap="round" 
                        />
                    </svg>

                    <div 
                        className="relative cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UserAvatar user={userData} size="xl" border={false} />
                        
                        {/* Camera Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 rounded-[30%] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                            <Camera className="text-white mb-1" size={24} />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Update</span>
                        </div>

                        {/* Uploading Spinner */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-slate-900/80 rounded-[30%] flex items-center justify-center z-20">
                                <Loader2 className="animate-spin text-indigo-400" size={32} />
                            </div>
                        )}
                    </div>

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                    {/* Level Badge */}
                    <div className="absolute -bottom-1 bg-slate-800 text-white text-[10px] font-black px-4 py-1.5 rounded-full border-2 border-slate-700 shadow-xl flex items-center gap-1.5">
                        <Crown size={12} className={league.color} /> LVL {level}
                    </div>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tight mb-3 mt-2">{userData?.name}</h2>
                
                <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
                    <span className="px-3 py-1 bg-white/10 border border-white/20 text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-widest">
                        {userData?.role}
                    </span>
                    <span className={`px-3 py-1 bg-slate-800 border ${league.border} ${league.color} text-[9px] font-black rounded-lg flex items-center gap-1.5 uppercase tracking-widest shadow-lg`}>
                        <Shield size={12}/> {league.name} League
                    </span>
                </div>

                {/* Core Stats Row */}
                <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-2xl rounded-3xl p-6 flex justify-between items-center border border-white/10 shadow-2xl">
                    <div className="text-center flex-1 border-r border-white/5">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                           <Zap size={12} className="text-yellow-400" /> XP
                        </div>
                        <div className="text-2xl font-black text-white">{xp}</div>
                    </div>
                    <div className="text-center flex-1 border-r border-white/5">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                            <Flame size={12} className="text-orange-500" /> Streak
                        </div>
                        <div className="text-2xl font-black text-white">{streak}</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                            <Heart size={12} className="text-rose-500" /> Stars
                        </div>
                        <div className="text-2xl font-black text-white">{totalLikes}</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="px-6 mt-8 space-y-6">
            
            {/* 2. PROGRESS TRACKER */}
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                       <Trophy size={16} className="text-amber-500"/> Pathway Progress
                    </h3>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Level {level + 1} Target</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                    <div 
                        className={`h-full bg-indigo-600 transition-all duration-1000 ease-out relative`} 
                        style={{ width: `${progressPct}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                    </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{currentLevelXp} XP Earned</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{xpToNext} XP Total</span>
                </div>
            </div>

            {/* 3. ACTIVITY GRAPH */}
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><BarChart3 size={16} className="text-indigo-600"/> Velocity</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.totalHours} Total Hours</span>
                </div>
                <div className="flex items-end justify-between h-32 gap-3 px-2">
                    {stats.graphData.map((d: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer">
                            <div className="w-full bg-slate-50 rounded-xl relative flex items-end h-full mb-3 border border-slate-100 overflow-hidden">
                                <div 
                                    className={`w-full rounded-t-lg transition-all duration-1000 ${d.minutes > 0 ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-transparent'}`}
                                    style={{ height: `${d.height}%` }} 
                                />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${d.minutes > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. SETTINGS PANEL */}
            <div className="bg-slate-200/50 p-2 rounded-[3rem] space-y-2">
                <button onClick={toggleRole} className="w-full bg-white p-5 rounded-[2rem] text-slate-700 font-black flex justify-between items-center active:scale-[0.98] transition-all shadow-sm border border-transparent hover:border-indigo-100">
                    <span className="flex items-center gap-4 text-xs uppercase tracking-widest"><Settings size={18} className="text-slate-400"/> Mode: {userData?.role}</span>
                    <ChevronRight size={18} className="text-slate-300"/>
                </button>
                
                {userData?.role === 'instructor' && (
                    <button onClick={deploySystemContent} disabled={deploying} className="w-full bg-white p-5 rounded-[2rem] text-slate-700 font-black flex justify-between items-center active:scale-[0.98] transition-all shadow-sm">
                        <span className="flex items-center gap-4 text-xs uppercase tracking-widest"><UploadCloud size={18} className="text-slate-400"/> {deploying ? 'Deploying...' : 'Reset Core Content'}</span>
                        <ChevronRight size={18} className="text-slate-300"/>
                    </button>
                )}
                
                <button onClick={handleLogout} className="w-full bg-white p-5 rounded-[2rem] text-rose-600 font-black flex justify-between items-center active:scale-[0.98] transition-all shadow-sm">
                    <span className="flex items-center gap-4 text-xs uppercase tracking-widest"><LogOut size={18} className="text-rose-400"/> System Sign Out</span>
                    <div className="bg-rose-50 p-1.5 rounded-full"><LogOut size={16} className="text-rose-400"/></div>
                </button>
            </div>

        </div>
    </div>
  );
}
