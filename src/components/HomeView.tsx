// src/components/HomeView.tsx
import React, { useRef } from 'react';
import { 
    GraduationCap, Globe, Flame, Zap, Trophy, 
    School, Layers, Feather, Target, BookOpen, 
    Microscope, Terminal, Calculator, Palette, BookText
} from 'lucide-react';
import { calculateLevel } from '../utils/profileHelpers';

// --- NEW THEME HELPER (Must match StudentDashboardHub) ---
const getSubjectTheme = (subject: string) => {
    const sub = subject.toLowerCase();
    if (sub.includes('bio') || sub.includes('science') || sub.includes('phys')) return { icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-400' };
    if (sub.includes('code') || sub.includes('comp') || sub.includes('tech')) return { icon: Terminal, color: 'text-slate-800', bg: 'bg-slate-200', gradient: 'from-slate-800 to-slate-600' };
    if (sub.includes('math') || sub.includes('calc') || sub.includes('alg')) return { icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-50', gradient: 'from-rose-500 to-orange-400' };
    if (sub.includes('art') || sub.includes('design')) return { icon: Palette, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', gradient: 'from-fuchsia-500 to-pink-400' };
    if (sub.includes('hist') || sub.includes('lit') || sub.includes('read')) return { icon: BookText, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-500 to-yellow-400' };
    return { icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', gradient: 'from-indigo-600 to-cyan-500' };
};

export default function HomeView({ setActiveTab, classes, onSelectClass, userData, user, activeOrg }: any) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  // Calculate Gamified Stats
  const xp = userData?.xp || 0;
  const streak = userData?.streak || 0;
  const targetLang = userData?.targetLanguage || "English";
  const { level, progressPct, xpToNext } = calculateLevel(xp);

  // Dynamic Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userData?.name?.split(' ')[0] || "Scholar";

  // --- DYNAMIC BRANDING ---
  const themeColor = activeOrg?.themeColor || '#4f46e5'; 
  const themeName = activeOrg?.name || 'Magister';

  // --- DAILY QUEST ENGINE ---
  const todayStr = new Date().toDateString();
  const isToday = userData?.lastActivityDate === todayStr;
  
  const todayXp = isToday ? (userData?.dailyXp || 0) : 0;
  const todayLessons = isToday ? (userData?.dailyLessons || 0) : 0;

  const dailyQuests = [
      { id: 1, title: 'Earn 50 XP', target: 50, current: Math.min(todayXp, 50), icon: <Zap size={16} className="text-yellow-500" /> },
      { id: 2, title: 'Complete 1 Lesson', target: 1, current: Math.min(todayLessons, 1), icon: <BookOpen size={16} className="text-indigo-500" /> },
  ];

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hoursRemaining = Math.max(1, Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div className="h-full flex flex-col bg-slate-50">
        
        {/* 1. DYNAMIC APP BAR */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                {activeOrg?.logoUrl ? (
                    <img src={activeOrg.logoUrl} alt="Organization Logo" className="w-8 h-8 object-contain rounded-md" />
                ) : (
                    <div className="text-white p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: themeColor }}>
                        <GraduationCap size={18} strokeWidth={3}/>
                    </div>
                )}
                <span className="font-black tracking-tighter text-lg truncate max-w-[150px]" style={{ color: themeColor }}>
                    {themeName}
                </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1.5 shrink-0">
                <Globe size={14} className="text-slate-400"/>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{targetLang}</span>
            </div>
        </div>

        <div ref={scrollViewportRef} className="flex-1 overflow-y-auto custom-scrollbar pb-32">
            
            {/* 2. HERO SECTION */}
            <div className="bg-white pt-6 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-medium text-slate-400 tracking-tight">{greeting},</h1>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">{firstName}.</h1>
                </div>

                {/* STATS BENTO */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <Flame size={20} className={`mb-1 ${streak > 0 && isToday ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`}/>
                        <span className={`text-lg font-black ${streak > 0 && isToday ? '' : 'text-slate-400'}`} style={streak > 0 && isToday ? { color: themeColor } : {}}>{streak}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Day Streak</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <Zap size={20} className="text-yellow-500 mb-1 fill-yellow-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{xp}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <Trophy size={20} className="text-emerald-500 mb-1 fill-emerald-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{level}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Level</span>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progressPct}%`, backgroundColor: themeColor }}
                        />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">
                        {xpToNext} XP to Level Up
                    </span>
                </div>
            </div>

            <div className="px-6 space-y-8 mt-8">

              {/* 3. DAILY QUESTS WIDGET */}
              <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-5">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                          <Target size={18} className="text-rose-500" /> Daily Quests
                      </h3>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-widest">
                          Resets in {hoursRemaining}h
                      </span>
                  </div>

                  <div className="space-y-4">
                      {dailyQuests.map(quest => {
                          const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
                          const isDone = quest.current >= quest.target;
                          
                          return (
                              <div key={quest.id} className="relative">
                                  <div className="flex justify-between items-end mb-2">
                                      <div className="flex items-center gap-2">
                                          <div className={`${isDone ? 'opacity-50 grayscale' : ''} transition-all`}>{quest.icon}</div>
                                          <span className={`text-sm font-bold ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{quest.title}</span>
                                      </div>
                                      <span className={`text-xs font-black ${isDone ? 'text-emerald-500' : 'text-slate-400'}`}>
                                          {isDone ? 'DONE' : `${quest.current}/${quest.target}`}
                                      </span>
                                  </div>
                                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                      <div className={`h-full transition-all duration-1000 ${isDone ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
              
              {/* 4. ACTIVE SUBJECTS SECTION (Upgraded from Classes) */}
              {classes && classes.length > 0 ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Active Subjects</h3>
                        <button onClick={() => setActiveTab('classes')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                        {classes.map((cls: any) => { 
                            const pendingCount = (cls.assignments || []).length;
                            const theme = getSubjectTheme(cls.subject || 'General');
                            const Icon = theme.icon;

                            return ( 
                                <button 
                                    key={cls.id} 
                                    onClick={() => onSelectClass(cls)} 
                                    className="snap-start min-w-[260px] bg-white rounded-[2rem] shadow-sm border-2 border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100 group relative overflow-hidden flex flex-col text-left p-6 active:scale-95"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-inner transition-colors duration-500 ${theme.bg} ${theme.color} group-hover:bg-indigo-600 group-hover:text-white`}>
                                            <Icon size={24} strokeWidth={2.5} />
                                        </div>
                                        {pendingCount > 0 && (
                                            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
                                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                              {pendingCount} Tasks
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{cls.subject || 'General'}</span>
                                        <h4 className="font-black text-slate-800 text-xl truncate leading-tight group-hover:text-indigo-600 transition-colors">{cls.name}</h4>
                                    </div>
                                </button> 
                            ); 
                        })}
                    </div>
                </div>
              ) : (
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                    <School size={32} className="mx-auto text-slate-300 mb-2"/>
                    <p className="text-sm text-slate-400 font-bold mb-4">No active subjects right now.</p>
                    <button onClick={() => setActiveTab('classes')} className="px-6 py-3 bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-colors">
                        Browse Campus
                    </button>
                 </div>
              )}

              {/* 5. ACTION CARDS */}
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <button 
                    onClick={() => setActiveTab('flashcards')} 
                    className="relative h-32 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group text-left transition-all active:scale-95 hover:shadow-lg"
                >
                    <div className="absolute inset-0 bg-white"></div>
                    <div className="absolute -right-4 -bottom-4 text-orange-500 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-700"><Layers size={80} /></div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><Layers size={16} /></div>
                        <div><h3 className="text-slate-800 font-black text-lg mb-0.5 leading-none">Practice</h3><p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Memory Vault</p></div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTab('create')} 
                    className="relative h-32 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group text-left transition-all active:scale-95 hover:shadow-lg"
                >
                    <div className="absolute inset-0 bg-white"></div>
                    <div className="absolute -right-4 -bottom-4 text-emerald-500 opacity-10 transform -rotate-12 group-hover:scale-125 transition-transform duration-700"><Feather size={80} /></div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Feather size={16} /></div>
                        <div><h3 className="text-slate-800 font-black text-lg mb-0.5 leading-none">Studio</h3><p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Create Content</p></div>
                    </div>
                </button>
              </div>

            </div>
        </div>
    </div>
  );
}
