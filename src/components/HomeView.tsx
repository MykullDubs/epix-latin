// src/components/HomeView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { 
    GraduationCap, Globe, Flame, Zap, Trophy, 
    School, Layers, Feather, Target, BookOpen, 
    Microscope, Terminal, Calculator, Palette, BookText,
    Check, Brain, Play, HeartPulse, Cpu, Briefcase, 
    Utensils, Globe2, Activity, ShieldAlert, MonitorPlay, 
    FlaskConical, Plane, Music, Code, Loader2, X
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { saveDeckToCache, getDeckFromCache } from '../utils/localCache';
import { calculateLevel } from '../utils/profileHelpers';
import InstallPWA from './InstallPWA';
import { StudyModePlayer } from './StudyEngines'; 
import { Toast } from './Toast';
import { auth } from '../config/firebase'; 

// 🔥 UNIFIED DISCOVERY THEMES (Juiced with Gradients, Text Colors, and Shadow Glows)
const getSubjectTheme = (subject: string = '') => {
    const str = subject.toLowerCase();
    
    if (str.match(/stem|medical|anatomy|bio|health|doctor|sci|chem|phys|cell/)) return { icon: HeartPulse, gradient: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/30', textColor: 'text-emerald-500 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10' };
    if (str.match(/tech|logic|code|comp|program|software/)) return { icon: Cpu, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30', textColor: 'text-blue-500 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/10' };
    if (str.match(/business|commerce|trade|finance|corporate/)) return { icon: Briefcase, gradient: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/30', textColor: 'text-slate-700 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-800' };
    if (str.match(/art|culture|history|design|draw|paint|color/)) return { icon: Palette, gradient: 'from-fuchsia-500 to-purple-600', shadow: 'shadow-fuchsia-500/30', textColor: 'text-fuchsia-500 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-500/10' };
    if (str.match(/culinary|hospitality|food|kitchen|cook|eat/)) return { icon: Utensils, gradient: 'from-orange-400 to-rose-500', shadow: 'shadow-orange-500/30', textColor: 'text-orange-500 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10' };
    if (str.match(/society|politics|law|ethics|government|social/)) return { icon: Globe2, gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/30', textColor: 'text-cyan-500 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10' };
    if (str.match(/linguistics|phonetics|grammar|syntax|verb|read|english|vocab|word|lit/)) return { icon: BookOpen, gradient: 'from-violet-500 to-indigo-500', shadow: 'shadow-violet-500/30', textColor: 'text-violet-500 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-500/10' };
    if (str.match(/survival|emergency|navigate|travel|place|city|country/)) return { icon: Plane, gradient: 'from-rose-400 to-red-600', shadow: 'shadow-rose-500/30', textColor: 'text-rose-500 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10' };
    if (str.match(/media|entertainment|movie|game|music|play|audio|song|sound/)) return { icon: MonitorPlay, gradient: 'from-pink-500 to-rose-400', shadow: 'shadow-pink-500/30', textColor: 'text-pink-500 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-500/10' };
    if (str.match(/math|calc|num|algebra|geometry/)) return { icon: Calculator, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/30', textColor: 'text-rose-500 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10' };
    
    return { icon: Layers, gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/30', textColor: 'text-indigo-500 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10' };
};

export default function HomeView({ setActiveTab, classes, curriculums = [], onSelectClass, userData, user, activeOrg, allDecks }: any) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  const [launchDailyReview, setLaunchDailyReview] = useState(false);
  const [isCompilingQueue, setIsCompilingQueue] = useState(false);
  const [compiledQueue, setCompiledQueue] = useState<any>(null);
  const [compiledStats, setCompiledStats] = useState<Record<string, any>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const xp = userData?.xp || 0;
  const streak = userData?.streak || 0;
  const targetLang = userData?.targetLanguage || "English";
  const { level, progressPct, xpToNext } = calculateLevel(xp);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userData?.name?.split(' ')[0] || "Scholar";

  const themeColor = activeOrg?.themeColor || '#4f46e5'; 
  const themeName = activeOrg?.name || 'Magister';

  // --- DAILY TARGETS LOGIC ---
  const todayStr = new Date().toDateString();
  const isToday = userData?.lastActivityDate === todayStr;
  
  const todayXp = isToday ? (userData?.dailyXp || 0) : 0;
  const todayLessons = isToday ? (userData?.dailyLessons || 0) : 0;

  const xpDone = todayXp >= 50;
  const lessonsDone = todayLessons >= 1;
  const allQuestsDone = xpDone && lessonsDone;

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hoursRemaining = Math.max(1, Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));

  // 🔥 ASYNC COMPILER: Fetches actual cards and true stats from DB/Cache
  const handleLaunchGlobalQueue = async () => {
      setIsCompilingQueue(true);
      
      try {
          // 1. Locate all eligible decks
          const activeDecks = Object.entries(allDecks || {}).filter(([key, deck]: any) => {
              const isCustom = key === 'custom';
              const isAuthor = deck.authorId === user?.uid || deck.ownerId === user?.uid;
              const isUnlocked = userData?.unlocks?.[key] || (Array.isArray(userData?.unlocks) && userData.unlocks.includes(key)) || (Array.isArray(userData?.inventory) && userData.inventory.includes(key));
              const hasPrefs = !!userData?.deckPrefs?.[key]; 
              
              const inMyVault = isCustom || isAuthor || isUnlocked || hasPrefs;
              if (!inMyVault) return false;
              
              const isArchived = userData?.deckPrefs?.[key]?.archived || false;
              return !isArchived;
          }).map(([key, deck]: any) => ({ ...deck, id: key }));

          if (activeDecks.length === 0) {
              setToastMsg("You have no active decks in your library.");
              setIsCompilingQueue(false);
              return;
          }

          // 2. Multi-fetch the cards AND their stats
          const allPromises = activeDecks.map(async (deck: any) => {
              let loadedCards: any[] = [];
              if (deck.id === 'custom') {
                  loadedCards = deck.cards || [];
              } else {
                  const cachedData = await getDeckFromCache(deck.id);
                  if (cachedData && cachedData.updatedAt >= (deck.updatedAt || 0)) {
                      loadedCards = cachedData.cards;
                  } else {
                      const cardsRef = collection(db, 'artifacts', appId, 'decks', deck.id, 'cards');
                      const snap = await getDocs(cardsRef);
                      loadedCards = snap.docs.map(doc => doc.data());
                      await saveDeckToCache(deck.id, loadedCards, deck.updatedAt || 0);
                  }
              }
              
              // Tag cards with deckId so the StudyModePlayer routes the stats correctly!
              loadedCards = loadedCards.map(c => ({...c, deckId: deck.id}));

              const statsRef = collection(db, 'artifacts', appId, 'users', user?.uid, 'deck_progress', deck.id, 'card_stats');
              const statsSnap = await getDocs(statsRef);
              const stats = statsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

              return { cards: loadedCards, stats };
          });

          const results = await Promise.all(allPromises);
          
          let allDueCards: any[] = [];
          const globalStatsMap: Record<string, any> = {};

          // 3. Calculate Due Status across all decks
          results.forEach(({ cards, stats }) => {
              const deckStatsMap: Record<string, any> = {};
              stats.forEach((s: any) => { 
                  deckStatsMap[s.id] = s; 
                  globalStatsMap[s.id] = s;
              });

              const due = cards.filter((c: any) => {
                  const stat = deckStatsMap[c.id];
                  return !stat?.nextReviewDate || stat.nextReviewDate <= Date.now();
              });
              
              allDueCards = [...allDueCards, ...due];
          });

          if (allDueCards.length === 0) {
              setToastMsg("Matrix is optimal! No targets due for review.");
              setIsCompilingQueue(false);
              return;
          }

          // 4. Shuffle and cap at 40 cards so the review doesn't take 2 hours
          allDueCards.sort(() => Math.random() - 0.5);
          const dailyCap = allDueCards.slice(0, 40); 

          setCompiledQueue(dailyCap);
          setCompiledStats(globalStatsMap);
          setLaunchDailyReview(true);

      } catch (err) {
          console.error("Failed to compile Global Queue:", err);
          setToastMsg("System error compiling queue.");
      } finally {
          setIsCompilingQueue(false);
      }
  };

  // 🔥 NEW GLOBAL REVIEW INTERFACE
  if (launchDailyReview && compiledQueue) {
      return (
          <div className="fixed inset-0 z-[9999] bg-slate-950 animate-in slide-in-from-bottom-8 duration-500 flex flex-col">
              <div className="px-4 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <button onClick={() => { setLaunchDailyReview(false); setCompiledQueue(null); }} className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                      <X size={20} strokeWidth={3}/>
                  </button>
                  <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Global Queue</span>
                      <span className="text-sm font-black text-white line-clamp-1">Spaced Repetition</span>
                  </div>
                  <div className="w-11"></div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                  <StudyModePlayer 
                      deckCards={compiledQueue} 
                      initialSrbData={compiledStats} 
                      user={user} 
                      userData={userData} 
                      onFinish={() => {
                          setLaunchDailyReview(false);
                          setCompiledQueue(null);
                          setToastMsg("Global Review Complete! Matrix updated.");
                      }} 
                  />
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 relative">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

        {/* 1. DYNAMIC APP BAR */}
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
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
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors duration-300" aria-label={`Target Language: ${targetLang}`}>
                <Globe size={14} className="text-slate-400 dark:text-slate-500" aria-hidden="true"/>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{targetLang}</span>
            </div>
        </header>

        <main ref={scrollViewportRef} className="flex-1 overflow-y-auto custom-scrollbar pb-32 focus:outline-none" tabIndex={-1}>
            
            {/* 2. HERO SECTION */}
            <section className="bg-white dark:bg-slate-900 pt-6 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 dark:border-slate-800 relative z-10 transition-colors duration-300">
                <div className="mb-8">
                    <h1 className="text-3xl font-medium text-slate-400 dark:text-slate-500 tracking-tight">{greeting},</h1>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{firstName}.</h2>
                </div>

                {/* STATS BENTO */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center shadow-inner dark:shadow-none transition-colors duration-300">
                        <Flame size={20} aria-hidden="true" className={`mb-1 ${streak > 0 && isToday ? 'text-orange-500 fill-orange-500' : 'text-slate-300 dark:text-slate-600'}`}/>
                        <span className={`text-lg font-black ${streak > 0 && isToday ? '' : 'text-slate-400 dark:text-slate-500'}`} style={streak > 0 && isToday ? { color: themeColor } : {}}>{streak}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Day Streak</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center shadow-inner dark:shadow-none transition-colors duration-300">
                        <Zap size={20} aria-hidden="true" className="text-yellow-500 mb-1 fill-yellow-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{xp}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Total XP</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center shadow-inner dark:shadow-none transition-colors duration-300">
                        <Trophy size={20} aria-hidden="true" className="text-emerald-500 mb-1 fill-emerald-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{level}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Level</span>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-6 flex items-center gap-3" aria-label={`Progress to next level: ${progressPct}%`}>
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner dark:shadow-none transition-colors duration-300">
                        <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progressPct}%`, backgroundColor: themeColor }}
                        />
                    </div>
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-widest">
                        {xpToNext} XP to Level Up
                    </span>
                </div>
            </section>

            <div className="px-6 space-y-8 mt-6">

              <InstallPWA />

              {/* 🔥 3. ULTRA-COMPACT DAILY ROUTINE (BENTO GRID) */}
              <section className="animate-in slide-in-from-bottom-4 transition-all duration-500 mb-2">
                  <div className="flex justify-between items-end mb-3 ml-1">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                          <Target size={16} className="text-rose-500" /> Daily Routine
                      </h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Resets in {hoursRemaining}h
                      </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 h-36">
                       
                       {/* LEFT CARD: COMBINED DAILY QUESTS */}
                       <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group relative overflow-hidden transition-colors duration-300">
                          <div className="flex items-center justify-between mb-2 relative z-10">
                               <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Targets</span>
                               {allQuestsDone && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20 px-2 py-1 rounded-md">
                                        Done
                                    </span>
                               )}
                          </div>

                          <div className="space-y-4 relative z-10 mt-auto">
                               {/* XP Progress */}
                               <div>
                                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                         <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Zap size={12} className="text-yellow-500" fill="currentColor" /> 50 XP</span>
                                         <span className={xpDone ? "text-emerald-500" : "text-slate-400"}>{Math.min(todayXp, 50)}/50</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                         <div className={`h-full transition-all duration-1000 ${xpDone ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, (todayXp / 50) * 100)}%` }} />
                                    </div>
                               </div>
                               
                               {/* Lesson Progress */}
                               <div>
                                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                         <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><BookOpen size={12} className="text-indigo-500" /> 1 Lesson</span>
                                         <span className={lessonsDone ? "text-emerald-500" : "text-slate-400"}>{Math.min(todayLessons, 1)}/1</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                         <div className={`h-full transition-all duration-1000 ${lessonsDone ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (todayLessons / 1) * 100)}%` }} />
                                    </div>
                               </div>
                          </div>
                          {allQuestsDone && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />}
                      </div>

                       {/* RIGHT CARD: GLOBAL QUEUE / SPATIAL REPETITION */}
                       <button 
                          onClick={handleLaunchGlobalQueue}
                          disabled={isCompilingQueue}
                          className="w-full h-full relative bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-black rounded-[1.5rem] p-4 border-2 border-indigo-500/30 shadow-md overflow-hidden group text-left transition-all active:scale-[0.98] flex flex-col justify-between"
                      >
                          <div className="absolute -right-4 -bottom-4 p-4 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                              <Brain size={80} className="text-indigo-300" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                          <div className="relative z-10 flex justify-between items-start mb-2">
                               <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20 backdrop-blur-md">
                                    <Brain size={16} className="text-indigo-300" />
                               </div>
                               <span className="flex items-center justify-center w-6 h-6 bg-white/10 text-white rounded-full shadow-sm group-hover:scale-110 transition-transform backdrop-blur-md">
                                    {isCompilingQueue ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} className="ml-0.5" fill="currentColor" />}
                               </span>
                          </div>
                          
                          <div className="relative z-10 mt-auto pt-4">
                               <h3 className="text-lg font-black text-white leading-tight mb-1">Global Queue</h3>
                               <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80">Spaced Review</p>
                          </div>
                      </button>

                  </div>
              </section>

              {/* 4. ACTIVE SUBJECTS SECTION */}
              {classes && classes.length > 0 ? (
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Active Subjects</h3>
                        <button 
                            onClick={() => setActiveTab('classes')} 
                            className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm"
                        >
                            View All
                        </button>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                        {classes.map((cls: any) => { 
                            const primaryCurriculum = curriculums?.find((c: any) => cls.assignedCurriculums?.includes(c.id));
                            const effectiveSubject = cls.subject || primaryCurriculum?.subject || 'General Studies';
                            const effectiveGrade = cls.grade || cls.level || primaryCurriculum?.grade || primaryCurriculum?.level || 'All Grades';
                            
                            const theme = getSubjectTheme(effectiveSubject);
                            const Icon = theme.icon;
                            const progress = cls.progressPct || Math.floor(Math.random() * 60) + 10;

                            return ( 
                                <button 
                                    key={cls.id} 
                                    onClick={() => onSelectClass(cls)}
                                    className="snap-start min-w-[280px] text-left bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col active:scale-[0.98] shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/50 group"
                                >
                                    <div className="flex justify-between items-start mb-4 w-full">
                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${theme.bgColor} ${theme.textColor}`}>
                                            {effectiveSubject}
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-300 shadow-sm border border-transparent dark:border-slate-800">
                                            {effectiveGrade}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-8 mt-2">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 shrink-0 bg-gradient-to-br ${theme.gradient} ${theme.shadow} group-hover:scale-110`}>
                                            <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
                                            {cls.title || cls.name}
                                        </h3>
                                    </div>

                                    <div className="w-full mt-auto pt-5 border-t border-slate-50 dark:border-slate-800/60">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Year Progress</span>
                                            <span className={`text-xs font-black ${theme.textColor}`}>{progress}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 bg-gradient-to-r ${theme.gradient}`} 
                                                style={{ width: `${progress}%` }} 
                                            />
                                        </div>
                                    </div>
                                </button>
                            ); 
                        })}
                    </div>
                </section>
              ) : (
                 <section className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center transition-colors duration-300">
                    <School size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" aria-hidden="true"/>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mb-4">No active subjects right now.</p>
                    <button 
                        onClick={() => setActiveTab('classes')} 
                        className="px-6 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Browse Campus
                    </button>
                 </section>
              )}

              {/* 5. ACTION CARDS */}
              <section className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <button 
                    onClick={() => setActiveTab('practice')} 
                    className="relative h-32 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 group text-left transition-all active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                >
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 transition-colors duration-300"></div>
                    <div className="absolute -right-4 -bottom-4 text-orange-500 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-700">
                        <Layers size={80} aria-hidden="true" />
                    </div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 dark:text-orange-400 transition-colors duration-300">
                            <Layers size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-0.5 leading-none">Practice</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Memory Vault</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTab('create')} 
                    className="relative h-32 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 group text-left transition-all active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                >
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 transition-colors duration-300"></div>
                    <div className="absolute -right-4 -bottom-4 text-emerald-500 opacity-10 transform -rotate-12 group-hover:scale-125 transition-transform duration-700">
                        <Feather size={80} aria-hidden="true" />
                    </div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                            <Feather size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg mb-0.5 leading-none">Studio</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Create Content</p>
                        </div>
                    </div>
                </button>
              </section>

            </div>
        </main>
    </div>
  );
}
