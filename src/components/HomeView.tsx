// src/components/HomeView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { 
    GraduationCap, Globe, Flame, Zap, Trophy, 
    School, Layers, Feather, Target, BookOpen, 
    Calculator, Palette, Check, Brain, Play, HeartPulse,
    Cpu, Briefcase, Utensils, Globe2, Activity,
    MonitorPlay, Plane, Loader2, X, Plus, GripVertical, Inbox
} from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import { saveDeckToCache, getDeckFromCache } from '../utils/localCache';
import { calculateLevel } from '../utils/profileHelpers';
import { StudyModePlayer } from './StudyEngines'; 
import { Toast } from './Toast';

// ============================================================================
//  FLAT HIGH-CONTRAST SUBJECT THEMES
// ============================================================================

const getSubjectTheme = (subject: string = '') => {
    const str = subject.toLowerCase();
    
    if (str.match(/stem|medical|anatomy|bio|health|doctor|sci|chem|phys|cell/)) {
        return {
            icon: HeartPulse,
            tileBg: 'bg-emerald-600 text-white',
            badgeBg: 'bg-emerald-600 text-white',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            barColor: 'bg-emerald-600 dark:bg-emerald-400'
        };
    }
    if (str.match(/tech|logic|code|comp|program|software/)) {
        return {
            icon: Cpu,
            tileBg: 'bg-blue-600 text-white',
            badgeBg: 'bg-blue-600 text-white',
            textColor: 'text-blue-600 dark:text-blue-400',
            barColor: 'bg-blue-600 dark:bg-blue-400'
        };
    }
    if (str.match(/business|commerce|trade|finance|corporate/)) {
        return {
            icon: Briefcase,
            tileBg: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black',
            badgeBg: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black',
            textColor: 'text-zinc-900 dark:text-zinc-100',
            barColor: 'bg-zinc-900 dark:bg-zinc-100'
        };
    }
    if (str.match(/art|culture|history|design|draw|paint|color/)) {
        return {
            icon: Palette,
            tileBg: 'bg-fuchsia-600 text-white',
            badgeBg: 'bg-fuchsia-600 text-white',
            textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
            barColor: 'bg-fuchsia-600 dark:bg-fuchsia-400'
        };
    }
    if (str.match(/culinary|hospitality|food|kitchen|cook|eat/)) {
        return {
            icon: Utensils,
            tileBg: 'bg-amber-500 text-black',
            badgeBg: 'bg-amber-500 text-black',
            textColor: 'text-amber-600 dark:text-amber-400',
            barColor: 'bg-amber-500'
        };
    }
    if (str.match(/society|politics|law|ethics|government|social/)) {
        return {
            icon: Globe2,
            tileBg: 'bg-cyan-400 text-black',
            badgeBg: 'bg-cyan-400 text-black',
            textColor: 'text-cyan-600 dark:text-cyan-400',
            barColor: 'bg-cyan-500 dark:bg-cyan-400'
        };
    }
    if (str.match(/linguistics|phonetics|grammar|syntax|verb|read|english|vocab|word|lit/)) {
        return {
            icon: BookOpen,
            tileBg: 'bg-indigo-600 text-white',
            badgeBg: 'bg-indigo-600 text-white',
            textColor: 'text-indigo-600 dark:text-indigo-400',
            barColor: 'bg-indigo-600 dark:bg-indigo-400'
        };
    }
    if (str.match(/survival|emergency|navigate|travel|place|city|country/)) {
        return {
            icon: Plane,
            tileBg: 'bg-rose-600 text-white',
            badgeBg: 'bg-rose-600 text-white',
            textColor: 'text-rose-600 dark:text-rose-400',
            barColor: 'bg-rose-600 dark:bg-rose-400'
        };
    }
    if (str.match(/media|entertainment|movie|game|music|play|audio|song|sound/)) {
        return {
            icon: MonitorPlay,
            tileBg: 'bg-pink-600 text-white',
            badgeBg: 'bg-pink-600 text-white',
            textColor: 'text-pink-600 dark:text-pink-400',
            barColor: 'bg-pink-600 dark:bg-pink-400'
        };
    }
    if (str.match(/math|calc|num|algebra|geometry/)) {
        return {
            icon: Calculator,
            tileBg: 'bg-rose-600 text-white',
            badgeBg: 'bg-rose-600 text-white',
            textColor: 'text-rose-600 dark:text-rose-400',
            barColor: 'bg-rose-600 dark:bg-rose-400'
        };
    }
    
    return {
        icon: Layers,
        tileBg: 'bg-indigo-600 text-white',
        badgeBg: 'bg-indigo-600 text-white',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        barColor: 'bg-indigo-600 dark:bg-indigo-400'
    };
};

// ============================================================================
//  MAIN HOME VIEW COMPONENT
// ============================================================================

export default function HomeView({
    setActiveTab,
    classes,
    curriculums = [],
    onSelectClass,
    onReorderClasses,
    userData,
    user,
    activeOrg,
    allDecks
}: any) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  const [launchDailyReview, setLaunchDailyReview] = useState(false);
  const [isCompilingQueue, setIsCompilingQueue] = useState(false);
  const [compiledQueue, setCompiledQueue] = useState<any>(null);
  const [compiledStats, setCompiledStats] = useState<Record<string, any>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // LOCAL DRAG AND DROP STATE
  const [localClasses, setLocalClasses] = useState<any[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
      setLocalClasses(classes || []);
  }, [classes]);

  // INBOX UNREAD LISTENER
  const [unreadCount, setUnreadCount] = useState(0);
  const studentEmail = user?.email || auth?.currentUser?.email;

  useEffect(() => {
      if (!studentEmail) return;
      const q = query(
          collection(db, 'artifacts', appId, 'messages'),
          where('recipientEmail', '==', studentEmail),
          where('read', '==', false)
      );
      const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.docs.length));
      return () => unsub();
  }, [studentEmail]);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, position: number) => {
      dragItem.current = position;
      e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLButtonElement>, position: number) => {
      dragOverItem.current = position;
      
      if (dragItem.current !== null && dragItem.current !== position) {
          const newClasses = [...localClasses];
          const draggedItemContent = newClasses[dragItem.current];
          newClasses.splice(dragItem.current, 1);
          newClasses.splice(dragOverItem.current, 0, draggedItemContent);
          dragItem.current = position;
          setLocalClasses(newClasses);
      }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
      e.currentTarget.style.opacity = '1';
      dragItem.current = null;
      dragOverItem.current = null;
      
      if (onReorderClasses) {
          onReorderClasses(localClasses.map((c: any) => c.id));
      }
  };

  const xp = userData?.xp || 0;
  const streak = userData?.streak || 0;
  const targetLang = userData?.targetLanguage || "English";
  const { level, progressPct, xpToNext } = calculateLevel(xp);

  const themeColor = activeOrg?.themeColor || '#4f46e5'; 
  const themeName = activeOrg?.name || 'Magister';

  // DAILY TARGETS LOGIC
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

  const handleLaunchGlobalQueue = async () => {
      setIsCompilingQueue(true);
      
      try {
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
              setToastMsg("You have no active flashcards in your library.");
              setIsCompilingQueue(false);
              return;
          }

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
              
              loadedCards = loadedCards.map(c => ({ ...c, deckId: deck.id }));

              const statsRef = collection(db, 'artifacts', appId, 'users', user?.uid, 'deck_progress', deck.id, 'card_stats');
              const statsSnap = await getDocs(statsRef);
              const stats = statsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

              return { cards: loadedCards, stats };
          });

          const results = await Promise.all(allPromises);
          
          let allDueCards: any[] = [];
          const globalStatsMap: Record<string, any> = {};

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
              setToastMsg("You're all caught up! No reviews due right now.");
              setIsCompilingQueue(false);
              return;
          }

          allDueCards.sort(() => Math.random() - 0.5);
          const dailyCap = allDueCards.slice(0, 40); 

          setCompiledQueue(dailyCap);
          setCompiledStats(globalStatsMap);
          setLaunchDailyReview(true);

      } catch (err) {
          console.error("Failed to compile Global Queue:", err);
          setToastMsg("System error loading your review queue.");
      } finally {
          setIsCompilingQueue(false);
      }
  };

  // ============================================================================
  //  FULL-SCREEN DAILY REVIEW OVERLAY
  // ============================================================================
  if (launchDailyReview && compiledQueue) {
      return (
          <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col">
              <header className="bg-black border-b-2 border-zinc-800 flex items-stretch justify-between min-h-[56px] shrink-0">
                  <button
                      onClick={() => { setLaunchDailyReview(false); setCompiledQueue(null); }}
                      aria-label="Close Review"
                      className="w-14 bg-zinc-950 text-white hover:bg-rose-600 border-r-2 border-zinc-800 flex items-center justify-center transition-colors shrink-0"
                  >
                      <X size={20} strokeWidth={2.75}/>
                  </button>
                  <div className="px-4 py-2 flex flex-col justify-center items-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em]">
                          Smart Review
                      </span>
                      <span className="text-sm font-black text-white uppercase tracking-tight">
                          Spaced Repetition Queue
                      </span>
                  </div>
                  <div className="w-14" />
              </header>
              <div className="flex-1 overflow-hidden relative">
                  <StudyModePlayer 
                      deckCards={compiledQueue} 
                      initialSrbData={compiledStats} 
                      user={user} 
                      userData={userData} 
                      onFinish={() => {
                          setLaunchDailyReview(false);
                          setCompiledQueue(null);
                          setToastMsg("Review Complete! Great job.");
                      }} 
                  />
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white font-sans relative overflow-hidden">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

        {/* 1. ARCHITECTURAL FLAT HEADER */}
        <header className="bg-white dark:bg-black border-b-2 border-zinc-900 dark:border-zinc-200 shrink-0 z-50">
            <div className="max-w-7xl mx-auto flex items-stretch justify-between min-h-[64px]">
                {/* Brand Block */}
                <div className="flex items-stretch">
                    {activeOrg?.logoUrl ? (
                        <div className="w-16 border-r-2 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-black flex items-center justify-center p-2 shrink-0">
                            <img src={activeOrg.logoUrl} alt={`${themeName} Logo`} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div
                            className="w-16 border-r-2 border-zinc-900 dark:border-zinc-200 text-white flex items-center justify-center shrink-0"
                            style={{ backgroundColor: themeColor }}
                            aria-hidden="true"
                        >
                            <GraduationCap size={24} strokeWidth={2.75}/>
                        </div>
                    )}
                    <div className="px-4 sm:px-5 flex flex-col justify-center">
                        <span className="font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none text-zinc-950 dark:text-white">
                            {themeName}
                        </span>
                        <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.25em] mt-1">
                            Student Portal
                        </span>
                    </div>
                </div>

                {/* Right Utility Cells */}
                <div className="flex items-stretch divide-x-2 divide-zinc-900 dark:divide-zinc-200 border-l-2 border-zinc-900 dark:border-zinc-200">
                    <div
                        className="hidden sm:flex px-5 bg-zinc-100 dark:bg-zinc-900 items-center gap-2.5 shrink-0"
                        aria-label={`Target Language: ${targetLang}`}
                    >
                        <Globe size={16} strokeWidth={2.5} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true"/>
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em]">
                            {targetLang}
                        </span>
                    </div>

                    <button 
                        onClick={() => setActiveTab('inbox')}
                        aria-label="Open Inbox"
                        className="relative px-5 bg-white dark:bg-black hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center gap-2 min-w-[64px]"
                    >
                        <Inbox size={20} strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black tabular-nums tracking-wider">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>

        <main
            ref={scrollViewportRef}
            className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-28 focus:outline-none"
            tabIndex={-1}
        >
            {/* 2. TELEMETRY & LEVEL PROGRESS SECTION */}
            <section className="bg-white dark:bg-black border-b-2 border-zinc-900 dark:border-zinc-200">
                <div className="max-w-7xl mx-auto">
                    {/* 3-Column Stat Readout */}
                    <div className="grid grid-cols-3 divide-x-2 divide-zinc-900 dark:divide-zinc-200">
                        {/* Streak */}
                        <div className={`p-4 sm:p-6 flex flex-col justify-between ${
                            streak > 0 && isToday
                                ? 'bg-amber-400 text-black'
                                : 'bg-white dark:bg-black text-zinc-950 dark:text-white'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                                    Streak
                                </span>
                                <Flame size={16} strokeWidth={2.75} aria-hidden="true" />
                            </div>
                            <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none tabular-nums">
                                {String(streak).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Total XP */}
                        <div className="p-4 sm:p-6 flex flex-col justify-between bg-white dark:bg-black text-zinc-950 dark:text-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                    Total XP
                                </span>
                                <Zap size={16} strokeWidth={2.75} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                            </div>
                            <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none tabular-nums">
                                {xp}
                            </span>
                        </div>

                        {/* Level */}
                        <div className="p-4 sm:p-6 flex flex-col justify-between bg-zinc-950 dark:bg-zinc-100 text-white dark:text-black">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-75">
                                    Level
                                </span>
                                <Trophy size={16} strokeWidth={2.75} aria-hidden="true" />
                            </div>
                            <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none tabular-nums">
                                {String(level).padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    {/* Level Progress Bar Strip */}
                    <div
                        className="border-t-2 border-zinc-900 dark:border-zinc-200 px-4 sm:px-6 py-3 bg-zinc-100 dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                        aria-label={`Progress to next level: ${progressPct}%`}
                    >
                        <div className="flex justify-between items-center sm:shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                                Level {level} Progression
                            </span>
                            <span className="sm:hidden text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 tabular-nums">
                                {xpToNext} XP Remaining
                            </span>
                        </div>
                        <div className="flex-1 h-3 bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 overflow-hidden">
                            <div 
                                className="h-full transition-all duration-500" 
                                style={{ width: `${progressPct}%`, backgroundColor: themeColor }}
                            />
                        </div>
                        <span className="hidden sm:inline text-[10px] font-black text-zinc-600 dark:text-zinc-300 whitespace-nowrap uppercase tracking-[0.2em] tabular-nums">
                            {xpToNext} XP to LVL {level + 1}
                        </span>
                    </div>
                </div>
            </section>

            <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto space-y-10 mt-8">

              {/* 3. ACTION CENTER (METRO LIVE TILE GRID) */}
              <section>
                  <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b-2 border-zinc-900 dark:border-zinc-200">
                      <div className="w-6 h-6 bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Activity size={14} strokeWidth={2.75} />
                      </div>
                      <h2 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em]">
                          Action Center
                      </h2>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      
                      {/* TILE 1: DAILY TARGETS */}
                      <div className="bg-emerald-600 text-white border-2 border-zinc-900 dark:border-zinc-200 p-4 sm:p-5 flex flex-col justify-between min-h-[168px]">
                          <div className="flex justify-between items-start w-full gap-2">
                              <div className="w-9 h-9 bg-black text-white flex items-center justify-center shrink-0">
                                  <Target size={18} strokeWidth={2.75} />
                              </div>
                              {allQuestsDone ? (
                                  <span className="flex items-center justify-center w-8 h-8 bg-white text-black">
                                      <Check size={16} strokeWidth={3} />
                                  </span>
                              ) : (
                                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white bg-black px-2.5 py-1 tabular-nums">
                                      {hoursRemaining}H LEFT
                                  </span>
                              )}
                          </div>

                          <div className="my-3 space-y-2 w-full">
                              <div className="flex items-center gap-2 w-full">
                                  <Zap size={12} strokeWidth={2.75} className="text-amber-300 shrink-0" />
                                  <div className="flex-1 h-2 bg-black/40 overflow-hidden">
                                      <div
                                          className="h-full bg-amber-300 transition-all duration-500"
                                          style={{ width: `${Math.min(100, (todayXp / 50) * 100)}%` }}
                                      />
                                  </div>
                                  <span className="text-[9px] font-black tabular-nums">{Math.min(todayXp, 50)}/50</span>
                              </div>
                              <div className="flex items-center gap-2 w-full">
                                  <BookOpen size={12} strokeWidth={2.75} className="text-white shrink-0" />
                                  <div className="flex-1 h-2 bg-black/40 overflow-hidden">
                                      <div
                                          className="h-full bg-white transition-all duration-500"
                                          style={{ width: `${Math.min(100, (todayLessons / 1) * 100)}%` }}
                                      />
                                  </div>
                                  <span className="text-[9px] font-black tabular-nums">{Math.min(todayLessons, 1)}/1</span>
                              </div>
                          </div>

                          <div>
                              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-none">
                                  Daily Targets
                              </h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mt-1">
                                  {allQuestsDone ? 'Completed' : 'In Progress'}
                              </p>
                          </div>
                      </div>

                      {/* TILE 2: SMART REVIEW (Global Queue) */}
                      <button 
                          onClick={handleLaunchGlobalQueue}
                          disabled={isCompilingQueue}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-zinc-900 dark:border-zinc-200 p-4 sm:p-5 text-left transition-colors flex flex-col justify-between min-h-[168px] disabled:opacity-60"
                      >
                          <div className="flex justify-between items-start w-full">
                              <div className="w-9 h-9 bg-black text-white flex items-center justify-center shrink-0">
                                  <Brain size={18} strokeWidth={2.75} />
                              </div>
                              <span className="flex items-center justify-center w-9 h-9 bg-white text-black">
                                  {isCompilingQueue ? (
                                      <Loader2 size={16} strokeWidth={2.75} className="animate-spin" />
                                  ) : (
                                      <Play size={15} className="ml-0.5" fill="currentColor" />
                                  )}
                              </span>
                          </div>
                          
                          <div className="mt-auto">
                              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-none">
                                  Smart Review
                              </h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">
                                  Spaced Repetition
                              </p>
                          </div>
                      </button>

                      {/* TILE 3: STUDIO */}
                      <button 
                          onClick={() => setActiveTab('create')}
                          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-2 border-zinc-900 dark:border-zinc-200 p-4 sm:p-5 text-left transition-colors flex flex-col justify-between min-h-[168px]"
                      >
                          <div className="flex justify-between items-start w-full">
                              <div className="w-9 h-9 bg-black text-white flex items-center justify-center shrink-0">
                                  <Feather size={18} strokeWidth={2.75} />
                              </div>
                              <span className="flex items-center justify-center w-9 h-9 bg-white text-black">
                                  <Plus size={18} strokeWidth={3} />
                              </span>
                          </div>
                          
                          <div className="mt-auto">
                              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-none">
                                  Studio
                              </h3>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200 mt-1">
                                  Create Content
                              </p>
                          </div>
                      </button>

                      {/* TILE 4: MESSAGES (Inbox) */}
                      <button 
                          onClick={() => setActiveTab('inbox')}
                          className={`border-2 border-zinc-900 dark:border-zinc-200 p-4 sm:p-5 text-left transition-colors flex flex-col justify-between min-h-[168px] ${
                              unreadCount > 0
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                          }`}
                      >
                          <div className="flex justify-between items-start w-full">
                              <div className="w-9 h-9 bg-black text-white flex items-center justify-center shrink-0">
                                  <Inbox size={18} strokeWidth={2.75} />
                              </div>
                              <span className={`flex items-center justify-center min-w-[36px] h-9 px-2 font-black text-xs tabular-nums ${
                                  unreadCount > 0 ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                  {String(unreadCount).padStart(2, '0')}
                              </span>
                          </div>
                          
                          <div className="mt-auto">
                              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-none">
                                  Messages
                              </h3>
                              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${
                                  unreadCount > 0 ? 'text-rose-200' : 'text-zinc-400'
                              }`}>
                                  {unreadCount > 0 ? 'Unread Alerts' : 'Inbox Clear'}
                              </p>
                          </div>
                      </button>
                  </div>
              </section>

              {/* 4. ACTIVE SUBJECTS SECTION (DRAGGABLE) */}
              {localClasses && localClasses.length > 0 ? (
                <section>
                    <div className="flex justify-between items-center mb-4 pb-2.5 border-b-2 border-zinc-900 dark:border-zinc-200">
                        <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center shrink-0">
                                <Layers size={14} strokeWidth={2.75} />
                            </div>
                            <h2 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em]">
                                Active Subjects
                            </h2>
                        </div>
                        <button 
                            onClick={() => setActiveTab('classes')} 
                            className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {localClasses.map((cls: any, index: number) => { 
                            const primaryCurriculum = curriculums?.find((c: any) => cls.assignedCurriculums?.includes(c.id));
                            const effectiveSubject = cls.subject || primaryCurriculum?.subject || 'General Studies';
                            const effectiveGrade = cls.grade || cls.level || primaryCurriculum?.grade || primaryCurriculum?.level || 'All Grades';
                            
                            const theme = getSubjectTheme(effectiveSubject);
                            const Icon = theme.icon;
                            const progress = cls.progressPct ?? 25;

                            return ( 
                                <button 
                                    key={cls.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => onSelectClass(cls)}
                                    className="text-left bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 hover:border-indigo-600 dark:hover:border-indigo-400 transition-colors flex flex-col justify-between group cursor-grab active:cursor-grabbing"
                                >
                                    {/* Top Metadata Strip */}
                                    <div className="flex justify-between items-stretch w-full border-b-2 border-zinc-900 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900">
                                        <div className={`px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] truncate ${theme.badgeBg}`}>
                                            {effectiveSubject}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 px-3 py-1.5 shrink-0">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                                cls.type === 'solo' 
                                                    ? 'text-indigo-600 dark:text-indigo-400' 
                                                    : 'text-zinc-600 dark:text-zinc-300'
                                            }`}>
                                                {cls.type === 'solo' ? 'Solo' : effectiveGrade}
                                            </span>
                                            <GripVertical size={15} className="text-zinc-400 dark:text-zinc-500" />
                                        </div>
                                    </div>
                                    
                                    {/* Core Subject Identity */}
                                    <div className="p-5 flex items-start gap-4 my-auto">
                                        <div className={`w-14 h-14 flex items-center justify-center shrink-0 border-2 border-zinc-900 dark:border-zinc-200 ${theme.tileBg}`}>
                                            <Icon size={26} strokeWidth={2.5} aria-hidden="true" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tight leading-snug line-clamp-2">
                                            {cls.title || cls.name}
                                        </h3>
                                    </div>

                                    {/* Bottom Progress Readout */}
                                    <div className="w-full px-5 pb-5 pt-3 border-t-2 border-zinc-100 dark:border-zinc-900">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                                Completion
                                            </span>
                                            <span className={`text-xs font-black tabular-nums ${theme.textColor}`}>
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${theme.barColor}`} 
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
                 <section className="p-8 md:p-12 border-2 border-dashed border-zinc-900 dark:border-zinc-200 text-center bg-white dark:bg-black">
                    <div className="w-14 h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center mx-auto mb-4">
                        <School size={28} strokeWidth={2.5} aria-hidden="true"/>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-[0.2em] mb-6">
                        No Active Subjects Assigned
                    </p>
                    <button 
                        onClick={() => setActiveTab('classes')} 
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-colors"
                    >
                        Browse Course Catalog
                    </button>
                 </section>
              )}

            </div>
        </main>
    </div>
  );
}
