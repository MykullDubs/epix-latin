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
  Camera, Loader2, Heart, Activity, AlertCircle, History, Target, Moon,
  X, Save, RefreshCw, Cpu, Eye, Smile, ArrowUpCircle, Layers
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// 🔥 BLACK MARKET COSMETIC DICTIONARIES
const AURA_MAP: Record<string, string> = {
    'aura_emerald': 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]',
    'aura_void': 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]',
    'aura_solar': 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,1)] animate-pulse',
};

const TITLE_MAP: Record<string, string> = {
    'title_scholar': '"The Scholar"',
    'title_glitch': '"System Glitch"',
    'title_architect': '"The Architect"',
};

// ============================================================================
//  AVATAR FORGE (The Custom Character Builder)
// ============================================================================
const FORGE_PARTS = {
    base: ['box', 'cylinder', 'shadow', 'skull', 'square'],
    eyes: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'robocop', 'round', 'sensor', 'smile'],
    mouth: ['bite', 'diagram', 'grill01', 'grill02', 'square01', 'square02'],
    top: ['antenna', 'antennaCrooked', 'bulb01', 'horns', 'radar', 'lights', 'pyramid']
};

const FORGE_COLORS = ['4f46e5', '06b6d4', '10b981', 'f59e0b', 'f43f5e', '8b5cf6', '64748b'];

function AvatarForge({ currentConfig, onSave, onClose }: any) {
    const [config, setConfig] = useState(currentConfig || {
        base: 'skull',
        eyes: 'glow',
        mouth: 'bite',
        top: 'antenna',
        baseColor: '4f46e5'
    });

    const [activeTab, setActiveTab] = useState<'base' | 'eyes' | 'mouth' | 'top'>('base');

    const previewUrl = `https://api.dicebear.com/7.x/bottts/svg?base=${config.base}&eyes=${config.eyes}&mouth=${config.mouth}&top=${config.top}&baseColor=${config.baseColor}&backgroundColor=transparent`;

    const handleRandomize = () => {
        setConfig({
            base: FORGE_PARTS.base[Math.floor(Math.random() * FORGE_PARTS.base.length)],
            eyes: FORGE_PARTS.eyes[Math.floor(Math.random() * FORGE_PARTS.eyes.length)],
            mouth: FORGE_PARTS.mouth[Math.floor(Math.random() * FORGE_PARTS.mouth.length)],
            top: FORGE_PARTS.top[Math.floor(Math.random() * FORGE_PARTS.top.length)],
            baseColor: FORGE_COLORS[Math.floor(Math.random() * FORGE_COLORS.length)]
        });
    };

    const tabs = [
        { id: 'base', icon: Cpu, label: 'Chassis' },
        { id: 'eyes', icon: Eye, label: 'Optics' },
        { id: 'mouth', icon: Smile, label: 'Vocoder' },
        { id: 'top', icon: ArrowUpCircle, label: 'Hardware' }
    ];

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
                
                <div className="bg-slate-100 dark:bg-slate-800 p-8 relative flex flex-col items-center border-b border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full text-slate-500 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                    
                    <button onClick={handleRandomize} className="absolute top-6 left-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-full text-indigo-500 transition-colors" title="Randomize Protocol">
                        <RefreshCw size={20} strokeWidth={3} />
                    </button>

                    <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-[2rem] shadow-inner border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center p-4 relative mb-6">
                        <img src={previewUrl} alt="Live Avatar Preview" className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in" />
                    </div>

                    <div className="flex gap-2 justify-center bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                        {FORGE_COLORS.map(color => (
                            <button 
                                key={color}
                                onClick={() => setConfig({ ...config, baseColor: color })}
                                className={`w-6 h-6 rounded-full transition-transform ${config.baseColor === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                                style={{ backgroundColor: `#${color}` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col p-6 h-72">
                    <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon size={18} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-3 gap-3">
                            {FORGE_PARTS[activeTab].map((part) => {
                                const isSelected = config[activeTab] === part;
                                return (
                                    <button 
                                        key={part}
                                        onClick={() => setConfig({ ...config, [activeTab]: part })}
                                        className={`py-4 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                    >
                                        {part}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0">
                    <button 
                        onClick={() => onSave(previewUrl, config)}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                        <Save size={20} /> Save & Equip Avatar
                    </button>
                </div>
            </div>
        </div>
    );
}

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

    // 🔥 PULL COSMETICS FROM USER DATA
    const equippedAvatar = user?.equipped?.avatars;
    const equippedAura = user?.equipped?.auras;
    const activeAuraCSS = equippedAura ? AURA_MAP[equippedAura] : '';

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[35%] overflow-hidden flex items-center justify-center font-black transition-all ${
                equippedAvatar || avatarUrl?.includes('dicebear') ? 'bg-slate-800' :
                avatarUrl ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
            } ${border && !activeAuraCSS ? 'ring-4 ring-white dark:ring-slate-900 shadow-xl' : ''} ${activeAuraCSS}`}>
                
                {/* 1. Show Equipped Black Market Avatar OR Forge Avatar */}
                {equippedAvatar ? (
                    <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${equippedAvatar}&backgroundColor=transparent`} 
                        alt="Cosmetic Avatar" 
                        className="w-full h-full object-contain p-1 animate-in zoom-in duration-500" 
                    />
                ) : 
                /* 2. Fallback to Uploaded Photo / Forged Avatar */
                avatarUrl ? (
                    <img 
                        key={avatarUrl} 
                        src={avatarUrl} 
                        alt={name} 
                        className={`w-full h-full ${avatarUrl.includes('dicebear') ? 'object-contain p-1' : 'object-cover'} animate-in fade-in duration-500`} 
                    />
                ) : 
                /* 3. Fallback to Initials */
                (
                    <span>{initials}</span>
                )}
            </div>
            
            {/* Online/Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10" />
        </div>
    );
};

export default function ProfileView({ user, userData: propUserData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [liveProfile, setLiveProfile] = useState<any>(null);
  
  // 🔥 Avatar Forge State
  const [showForge, setShowForge] = useState(false);

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

  const deploySystemContent = async () => { 
      if (!window.confirm("Overwrite system content?")) return;
      setDeploying(true); 
      const batch = writeBatch(db); 
      Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); 
      INITIAL_SYSTEM_LESSONS.forEach((lesson) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); 
      try { await batch.commit(); alert("Magister OS Core Rebuilt!"); } catch (e: any) { alert("Error: " + e.message); } 
      setDeploying(false); 
  };

  // 🔥 AVATAR FORGE SAVE HANDLER
  const handleSaveCustomAvatar = async (finalUrl: string, config: any) => {
      if (!user?.uid) return;
      try {
          const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
          
          // If they save a custom forge avatar, we automatically un-equip any Store avatar
          // so the custom one shows up instead!
          const newEquipped = { ...(activeData.equipped || {}) };
          if (newEquipped.avatars) delete newEquipped.avatars;

          await updateDoc(userRef, {
              'profile.main.avatarUrl': finalUrl,
              'customAvatarConfig': config,
              'equipped': newEquipped
          });
          setShowForge(false);
      } catch (err) {
          console.error("Failed to forge avatar:", err);
      }
  };

  const xp = activeData?.profile?.main?.xp || activeData?.xp || 0;
  const streak = activeData?.profile?.main?.streak || activeData?.streak || 0;
  const totalLikes = activeData?.profile?.main?.totalLikesReceived || activeData?.totalLikesReceived || 0;
  
  const { level, currentLevelXp, xpToNext, progressPct } = calculateLevel ? calculateLevel(xp, totalLikes) : { level: 1, currentLevelXp: xp, xpToNext: 100, progressPct: 0 };
  const league = getLeagueTier ? getLeagueTier(level) : { name: 'Bronze' };

  const activeTitle = activeData?.equipped?.titles ? TITLE_MAP[activeData.equipped.titles] : "Student";

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar pt-2 pb-40 transition-colors duration-300">
        
        {/* 1. HERO CARD */}
        <div className="px-6 mb-8">
            <div className="bg-slate-900 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl border border-white/5 dark:border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col items-center">
                    
                    {/* AVATAR & SQUIRCLE PROGRESS RING */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 scale-125 z-0">
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
                        
                        {/* 🔥 FORGE TRIGGER */}
                        <div onClick={() => setShowForge(true)} className="cursor-pointer group relative z-10">
                            <UserAvatar user={activeData} size="xl" />
                            <div className="absolute inset-0 bg-black/40 rounded-[35%] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                                <Settings className="text-white mb-1" size={24} />
                                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Forge</span>
                            </div>
                        </div>

                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-black px-4 py-1 rounded-full shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 whitespace-nowrap z-30 transition-colors duration-300">
                            <Crown size={10} className="text-indigo-600 dark:text-indigo-400" /> LVL {level}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{activeData?.name || "User"}</h2>
                    <span className="text-xs font-black text-indigo-400 mb-4 tracking-widest">{activeTitle}</span>
                    
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
                    
                    {/* APPEARANCE TOGGLE ROW */}
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
        </div>

        {/* 🔥 FORGE MODAL PORTAL */}
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
