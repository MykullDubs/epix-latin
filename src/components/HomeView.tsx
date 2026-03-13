// src/components/HomeView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { 
    GraduationCap, Globe, Flame, Zap, Trophy, 
    School, Layers, Feather, Target, BookOpen, 
    Microscope, Terminal, Calculator, Palette, BookText,
    Check
} from 'lucide-react';
import { calculateLevel } from '../utils/profileHelpers';

// --- NEW THEME HELPER (Must match StudentDashboardHub) ---
const getSubjectTheme = (subject: string) => {
    const sub = subject?.toLowerCase() || '';
    if (sub.includes('math')) return { icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', hover: 'hover:border-rose-300 hover:shadow-rose-100' };
    if (sub.includes('science') || sub.includes('bio') || sub.includes('phys')) return { icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' };
    if (sub.includes('social') || sub.includes('history')) return { icon: BookText, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', hover: 'hover:border-amber-300 hover:shadow-amber-100' };
    if (sub.includes('read') || sub.includes('english') || sub.includes('lit')) return { icon: BookOpen, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', hover: 'hover:border-cyan-300 hover:shadow-cyan-100' };
    if (sub.includes('code') || sub.includes('comp') || sub.includes('tech')) return { icon: Terminal, color: 'text-slate-800', bg: 'bg-slate-200', border: 'border-slate-300', hover: 'hover:border-slate-400 hover:shadow-slate-200' };
    if (sub.includes('art') || sub.includes('design')) return { icon: Palette, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', hover: 'hover:border-fuchsia-300 hover:shadow-fuchsia-100' };
    
    return { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', hover: 'hover:border-indigo-300 hover:shadow-indigo-100' };
};

// ADDED curriculums = [] TO PROPS
export default function HomeView({ setActiveTab, classes, curriculums = [], onSelectClass, userData, user, activeOrg }: any) {
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
      { id: 1, title: 'Earn 50 XP', target: 50, current: Math.min(todayXp, 50), icon: <Zap size={16} className="text-yellow-500" aria-hidden="true" /> },
      { id: 2, title: 'Complete 1 Lesson', target: 1, current: Math.min(todayLessons, 1), icon: <BookOpen size={16} className="text-indigo-500" aria-hidden="true" /> },
  ];

  // Persistent Dismissed Quests State (Clears automatically the next day because of the todayStr key)
  const [dismissedQuests, setDismissedQuests] = useState<number[]>(() => {
      try {
          const saved = localStorage.getItem(`dismissedQuests_${todayStr}`);
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  const handleDismissQuest = (questId: number) => {
      const updated = [...dismissedQuests, questId];
      setDismissedQuests(updated);
      localStorage.setItem(`dismissedQuests_${todayStr}`, JSON.stringify(updated));
  };

  const visibleQuests = dailyQuests.filter(q => !dismissedQuests.includes(q.id));

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hoursRemaining = Math.max(1, Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
        
        {/* 1. DYNAMIC APP BAR */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                {activeOrg?.logoUrl ? (
                    <img src={activeOrg.logoUrl} alt={`${themeName} Logo`} className="w-8 h-8 object-contain rounded-md" />
                ) : (
                    <div className="text-white p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: themeColor }} aria-hidden="true">
                        <GraduationCap size={18} strokeWidth={3}/>
                    </div>
                )}
                <span className="font-black tracking-tighter text-lg truncate max-w-[150px]" style={{ color: themeColor }}>
                    {themeName}
                </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1.5 shrink-0" aria-label={`Target Language: ${targetLang}`}>
                <Globe size={14} className="text-slate-400" aria-hidden="true"/>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{targetLang}</span>
            </div>
        </header>

        <main ref={scrollViewportRef} className="flex-1 overflow-y-auto custom-scrollbar pb-32 focus:outline-none" tabIndex={-1}>
            
            {/* 2. HERO SECTION */}
            <section className="bg-white pt-6 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-medium text-slate-400 tracking-tight">{greeting},</h1>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">{firstName}.</h2>
                </div>

                {/* STATS BENTO */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <Flame size={20} aria-hidden="true" className={`mb-1 ${streak > 0 && isToday ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`}/>
                        <span className={`text-lg font-black ${streak > 0 && isToday ? '' : 'text-slate-400'}`} style={streak > 0 && isToday ? { color: themeColor } : {}}>{streak}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Day Streak</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <Zap size={20} aria-hidden="true" className="text-yellow-500 mb-1 fill-yellow-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{xp}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Total XP</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                        <Trophy size={20} aria-hidden="true" className="text-emerald-500 mb-1 fill-emerald-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{level}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Level</span>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-6 flex items-center gap-3" aria-label={`Progress to next level: ${progressPct}%`}>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progressPct}%`, backgroundColor: themeColor }}
                        />
                    </div>
                    <span className="text-xs font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">
                        {xpToNext} XP to Level Up
                    </span>
                </div>
            </section>

            <div className="px-6 space-y-8 mt-8">

              {/* 3. DAILY QUESTS WIDGET */}
              <section className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-5">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                          <Target size={18} className="text-rose-500" aria-hidden="true" /> Daily Quests
                      </h3>
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-widest">
                          Resets in {hoursRemaining}h
                      </span>
                  </div>

                  {visibleQuests.length === 0 ? (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4 animate-in fade-in zoom-in-95">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                              <Trophy size={24} className="fill-emerald-500" />
                          </div>
                          <div>
                              <h4 className="font-black text-emerald-800 text-sm">All Quests Cleared!</h4>
                              <p className="text-xs font-bold text-emerald-600 mt-0.5">Great job! Come back tomorrow for more rewards.</p>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {visibleQuests.map(quest => {
                              const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
                              const isDone = quest.current >= quest.target;
                              
                              return (
                                  <div key={quest.id} className="relative animate-in fade-in" aria-label={`${quest.title}: ${isDone ? 'Completed' : `${quest.current} out of ${quest.target}`}`}>
                                      <div className="flex justify-between items-end mb-2">
                                          <div className="flex items-center gap-2">
                                              <div className={`${isDone ? 'opacity-50 grayscale' : ''} transition-all`}>{quest.icon}</div>
                                              <span className={`text-sm font-bold ${isDone ? 'text-emerald-600' : 'text-slate-700'}`}>{quest.title}</span>
                                          </div>
                                          
                                          {isDone ? (
                                              <button 
                                                  onClick={() => handleDismissQuest(quest.id)}
                                                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                                              >
                                                  <Check size={14} strokeWidth={3} /> Clear
                                              </button>
                                          ) : (
                                              <span className="text-xs font-black text-slate-400">
                                                  {quest.current}/{quest.target}
                                              </span>
                                          )}
                                      </div>
                                      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                          <div className={`h-full transition-all duration-1000 ${isDone ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </section>
              
              {/* 4. ACTIVE SUBJECTS SECTION */}
              {classes && classes.length > 0 ? (
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Active Subjects</h3>
                        <button 
                            onClick={() => setActiveTab('classes')} 
                            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm"
                            aria-label="View all active subjects"
                        >
                            View All
                        </button>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                        {classes.map((cls: any) => { 
                            // INTELLIGENT CURRICULUM INHERITANCE
                            // Find the first assigned curriculum object if it exists
                            const primaryCurriculum = curriculums?.find((c: any) => cls.assignedCurriculums?.includes(c.id));
                            
                            // Inherit values, falling back to class data, then to defaults
                            const effectiveSubject = cls.subject || primaryCurriculum?.subject || 'General Studies';
                            const effectiveGrade = cls.grade || cls.level || primaryCurriculum?.grade || primaryCurriculum?.level || 'All Grades';
                            
                            const pendingCount = (cls.assignments || []).length;
                            const theme = getSubjectTheme(effectiveSubject);
                            const Icon = theme.icon;
                            const progress = cls.progressPct || Math.floor(Math.random() * 60) + 10;

                            return ( 
                                <button 
                                    key={cls.id} 
                                    onClick={() => onSelectClass(cls)}
                                    aria-label={`Open subject ${cls.name}, ${pendingCount} pending tasks`}
                                    className={`snap-start min-w-[280px] text-left bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col active:scale-[0.98] shadow-sm hover:-translate-y-1 ${theme.border} ${theme.hover} group`}
                                >
                                    {/* Header: Subject & Grade Pills */}
                                    <div className="flex justify-between items-start mb-4 w-full">
                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${theme.bg} ${theme.color}`}>
                                            {effectiveSubject}
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white shadow-sm">
                                            {effectiveGrade}
                                        </div>
                                    </div>
                                    
                                    {/* Body: Icon & Title */}
                                    <div className="flex items-center gap-4 mb-8 mt-2">
                                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-inner transition-colors duration-500 shrink-0 ${theme.bg} ${theme.color} group-hover:bg-opacity-80`}>
                                            <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 leading-tight line-clamp-2">
                                            {cls.title || cls.name}
                                        </h3>
                                    </div>

                                    {/* Footer: Progress Bar */}
                                    <div className="w-full mt-auto pt-5 border-t border-slate-50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Year Progress</span>
                                            <span className={`text-xs font-black ${theme.color}`}>{progress}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${theme.bg.replace('bg-', 'bg-').replace('50', '500')}`} 
                                                style={{ width: `${progress}%`, backgroundColor: 'currentColor' }} 
                                            />
                                        </div>
                                    </div>
                                </button>
                            ); 
                        })}
                    </div>
                </section>
              ) : (
                 <section className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                    <School size={32} className="mx-auto text-slate-300 mb-2" aria-hidden="true"/>
                    <p className="text-sm text-slate-400 font-bold mb-4">No active subjects right now.</p>
                    <button 
                        onClick={() => setActiveTab('classes')} 
                        className="px-6 py-3 bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Browse Campus
                    </button>
                 </section>
              )}

              {/* 5. ACTION CARDS */}
              <section className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <button 
                    onClick={() => setActiveTab('practice')} 
                    aria-label="Navigate to Practice and Memory Vault"
                    className="relative h-32 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group text-left transition-all active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                    <div className="absolute inset-0 bg-white"></div>
                    <div className="absolute -right-4 -bottom-4 text-orange-500 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-700">
                        <Layers size={80} aria-hidden="true" />
                    </div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                            <Layers size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-slate-800 font-black text-lg mb-0.5 leading-none">Practice</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memory Vault</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTab('create')} 
                    aria-label="Navigate to Studio to Create Content"
                    className="relative h-32 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group text-left transition-all active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    <div className="absolute inset-0 bg-white"></div>
                    <div className="absolute -right-4 -bottom-4 text-emerald-500 opacity-10 transform -rotate-12 group-hover:scale-125 transition-transform duration-700">
                        <Feather size={80} aria-hidden="true" />
                    </div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Feather size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-slate-800 font-black text-lg mb-0.5 leading-none">Studio</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Create Content</p>
                        </div>
                    </div>
                </button>
              </section>

            </div>
        </main>
    </div>
  );
}
