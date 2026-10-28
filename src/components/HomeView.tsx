// src/components/HomeView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { 
    GraduationCap, Globe, Flame, Zap, Trophy, 
    School, Layers, Feather, Target, BookOpen, 
    Calculator, Palette, Check, Brain, Play, HeartPulse,
    Cpu, Briefcase, Utensils, Globe2, Activity,
    MonitorPlay, Plane, Loader2, X, Plus, GripVertical, Inbox,
    HelpCircle, Sparkles, ChevronRight
} from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import { saveDeckToCache, getDeckFromCache } from '../utils/localCache';
import { calculateLevel } from '../utils/profileHelpers';
import { StudyModePlayer } from './StudyEngines'; 
import { Toast } from './Toast';
import TutorialOverlay from './TutorialOverlay';

// ============================================================================
//  FROSTED GLASS SUBJECT THEMES
// ============================================================================

const getSubjectTheme = (subject: string = '') => {
    const str = subject.toLowerCase();
    
    if (str.match(/stem|medical|anatomy|bio|health|doctor|sci|chem|phys|cell/)) {
        return {
            icon: HeartPulse,
            iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25',
            badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
            glow: 'from-emerald-500/10'
        };
    }
    if (str.match(/tech|logic|code|comp|program|software/)) {
        return {
            icon: Cpu,
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
            badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            barColor: 'bg-gradient-to-r from-blue-500 to-cyan-400',
            glow: 'from-blue-500/10'
        };
    }
    if (str.match(/business|commerce|trade|finance|corporate/)) {
        return {
            icon: Briefcase,
            iconBg: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-500/20',
            badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            textColor: 'text-slate-700 dark:text-slate-300',
            barColor: 'bg-gradient-to-r from-slate-600 to-indigo-500',
            glow: 'from-slate-500/10'
        };
    }
    if (str.match(/art|culture|history|design|draw|paint|color/)) {
        return {
            icon: Palette,
            iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25',
            badge: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200/60 dark:border-fuchsia-500/20',
            textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
            barColor: 'bg-gradient-to-r from-fuchsia-500 to-purple-500',
            glow: 'from-fuchsia-500/10'
        };
    }
    if (str.match(/culinary|hospitality|food|kitchen|cook|eat/)) {
        return {
            icon: Utensils,
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25',
            badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20',
            textColor: 'text-amber-600 dark:text-amber-400',
            barColor: 'bg-gradient-to-r from-amber-500 to-orange-400',
            glow: 'from-amber-500/10'
        };
    }
    if (str.match(/society|politics|law|ethics|government|social/)) {
        return {
            icon: Globe2,
            iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25',
            badge: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-500/20',
            textColor: 'text-cyan-600 dark:text-cyan-400',
            barColor: 'bg-gradient-to-r from-cyan-500 to-blue-400',
            glow: 'from-cyan-500/10'
        };
    }
    if (str.match(/survival|emergency|navigate|travel|place|city|country/)) {
        return {
            icon: Plane,
            iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25',
            badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
            textColor: 'text-rose-600 dark:text-rose-400',
            barColor: 'bg-gradient-to-r from-rose-500 to-pink-500',
            glow: 'from-rose-500/10'
        };
    }
    if (str.match(/media|entertainment|movie|game|music|play|audio|song|sound/)) {
        return {
            icon: MonitorPlay,
            iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25',
            badge: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200/60 dark:border-pink-500/20',
            textColor: 'text-pink-600 dark:text-pink-400',
            barColor: 'bg-gradient-to-r from-pink-500 to-rose-400',
            glow: 'from-pink-500/10'
        };
    }
    if (str.match(/math|calc|num|algebra|geometry/)) {
        return {
            icon: Calculator,
            iconBg: 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25',
            badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
            textColor: 'text-rose-600 dark:text-rose-400',
            barColor: 'bg-gradient-to-r from-rose-500 to-orange-400',
            glow: 'from-rose-500/10'
        };
    }
    
    // Default (Linguistics, English, Reading, General)
    return {
        icon: BookOpen,
        iconBg: 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25',
        badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        barColor: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
        glow: 'from-indigo-500/10'
    };
};

// ============================================================================
//  MAIN HOME VIEW COMPONENT (FROSTED GLASS AESTHETIC)
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
  const [replayHomeTour, setReplayHomeTour] = useState(false);

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
  //  FULL-SCREEN DAILY REVIEW OVERLAY (FROSTED DARK GLASS)
  // ============================================================================
  if (launchDailyReview && compiledQueue) {
      return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl text-white flex flex-col animate-in fade-in duration-300">
              <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                  <button
                      onClick={() => { setLaunchDailyReview(false); setCompiledQueue(null); }}
                      aria-label="Close Review"
                      className="w-11 h-11 rounded-full bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center transition-all active:scale-95 shrink-0"
                  >
                      <X size={20} strokeWidth={2.5}/>
                  </button>
                  <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">
                          Smart Review
                      </span>
                      <span className="text-base font-black text-white tracking-tight">
                          Spaced Repetition Queue
                      </span>
                  </div>
                  <div className="w-11" />
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-300">
        {/* Ambient Decorative Background Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

        {/* 🔥 STUDENT HOME DASHBOARD TUTORIAL OVERLAY */}
        <TutorialOverlay
            key={replayHomeTour ? 'home-replay' : 'home-auto'}
            variant="home"
            user={user}
            userData={userData}
            forceOpen={replayHomeTour}
            onComplete={() => setReplayHomeTour(false)}
        />

        {/* 1. FROSTED GLASS TOP HEADER */}
        <header className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border-b border-slate-200/70 dark:border-slate-800/80 shrink-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
                
                {/* Brand Identity */}
                <div className="flex items-center gap-3.5">
                    {activeOrg?.logoUrl ? (
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center p-2 shadow-sm shrink-0">
                            <img src={activeOrg.logoUrl} alt={`${themeName} Logo`} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div
                            className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0 border border-white/20"
                            style={{ backgroundColor: themeColor }}
                            aria-hidden="true"
                        >
                            <GraduationCap size={24} strokeWidth={2.5}/>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-black tracking-tight text-lg sm:text-2xl leading-none text-slate-900 dark:text-white">
                            {themeName}
                        </span>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                            Scholar Portal
                        </span>
                    </div>
                </div>

                {/* Right Frosted Utility Pills */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                        className="hidden sm:flex px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 items-center gap-2 shrink-0 backdrop-blur-md"
                        aria-label={`Target Language: ${targetLang}`}
                    >
                        <Globe size={15} strokeWidth={2.5} className="text-indigo-500 dark:text-indigo-400" aria-hidden="true"/>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            {targetLang}
                        </span>
                    </div>

                    {/* 1-CLICK REPLAY DASHBOARD TOUR BUTTON */}
                    <button
                        type="button"
                        onClick={() => setReplayHomeTour(true)}
                        title="Launch Dashboard Tour"
                        aria-label="Launch Dashboard Tour"
                        className="w-11 h-11 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                    >
                        <HelpCircle size={19} strokeWidth={2.3} />
                    </button>

                    {/* Inbox Button */}
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        aria-label="Open Inbox"
                        className="relative px-4 h-11 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Inbox size={19} strokeWidth={2.3} />
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tabular-nums shadow-sm animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>

        <main
            ref={scrollViewportRef}
            className="flex-1 overflow-y-auto custom-scrollbar pb-32 focus:outline-none relative z-10"
            tabIndex={-1}
        >
            <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto space-y-10 pt-6 sm:pt-8">

                {/* 2. FROSTED TELEMETRY & LEVEL PROGRESS HERO */}
                <section
                    data-tutorial="home-stats"
                    className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-slate-800 shadow-xl p-5 sm:p-7 space-y-5"
                >
                    {/* 3-Column Stat Cards */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-5">
                        {/* Streak Card */}
                        <div className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                            streak > 0 && isToday
                                ? 'bg-gradient-to-br from-amber-400/20 via-orange-500/15 to-amber-500/10 border-amber-300/60 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 shadow-lg shadow-amber-500/10'
                                : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-white'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-75">
                                    Streak
                                </span>
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
                                    streak > 0 && isToday ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                                }`}>
                                    <Flame size={15} strokeWidth={2.5} fill={streak > 0 && isToday ? 'currentColor' : 'none'} />
                                </div>
                            </div>
                            <span className="text-2xl sm:text-4xl font-black tracking-tight leading-none tabular-nums">
                                {String(streak).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Total XP Card */}
                        <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Total XP
                                </span>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Zap size={15} strokeWidth={2.5} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-2xl sm:text-4xl font-black tracking-tight leading-none tabular-nums text-slate-900 dark:text-white">
                                {xp.toLocaleString()}
                            </span>
                        </div>

                        {/* Level Card */}
                        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white border border-indigo-400/30 shadow-lg shadow-indigo-500/20 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-200">
                                    Level
                                </span>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/15 text-amber-300 flex items-center justify-center backdrop-blur-sm">
                                    <Trophy size={15} strokeWidth={2.5} />
                                </div>
                            </div>
                            <span className="text-2xl sm:text-4xl font-black tracking-tight leading-none tabular-nums">
                                {String(level).padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    {/* Smooth Pill Level Progress Bar */}
                    <div
                        className="px-4 py-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4"
                        aria-label={`Progress to next level: ${progressPct}%`}
                    >
                        <div className="flex justify-between items-center sm:shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-indigo-500" /> Level {level} Progression
                            </span>
                            <span className="sm:hidden text-[10px] font-black uppercase tracking-widest text-slate-400 tabular-nums">
                                {xpToNext} XP Remaining
                            </span>
                        </div>
                        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div 
                                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]" 
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="hidden sm:inline text-[10px] font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap uppercase tracking-widest tabular-nums">
                            {xpToNext} XP to LVL {level + 1}
                        </span>
                    </div>
                </section>

                {/* 3. ACTION CENTER (FROSTED GLASS BENTO GRID) */}
                <section data-tutorial="home-actions">
                    <div className="flex items-center gap-2.5 mb-4 px-1">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <Activity size={14} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Action Center
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* CARD 1: DAILY TARGETS */}
                        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-[2.2rem] border border-emerald-200/70 dark:border-emerald-500/20 p-5 sm:p-6 flex flex-col justify-between min-h-[180px] shadow-lg hover:shadow-xl transition-all relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex justify-between items-start w-full gap-2 relative z-10">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                                    <Target size={20} strokeWidth={2.5} />
                                </div>
                                {allQuestsDone ? (
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        <Check size={16} strokeWidth={3} />
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 tabular-nums">
                                        {hoursRemaining}H Left
                                    </span>
                                )}
                            </div>

                            <div className="my-3 space-y-2.5 w-full relative z-10">
                                <div className="flex items-center gap-2 w-full">
                                    <Zap size={12} strokeWidth={2.5} className="text-amber-500 shrink-0" fill="currentColor" />
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (todayXp / 50) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 tabular-nums">{Math.min(todayXp, 50)}/50</span>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <BookOpen size={12} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (todayLessons / 1) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 tabular-nums">{Math.min(todayLessons, 1)}/1</span>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    Daily Targets
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">
                                    {allQuestsDone ? 'All Quests Complete' : 'In Progress'}
                                </p>
                            </div>
                        </div>

                        {/* CARD 2: SMART REVIEW (Global Queue) */}
                        <button 
                            onClick={handleLaunchGlobalQueue}
                            disabled={isCompilingQueue}
                            className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-[2.2rem] border border-indigo-200/70 dark:border-indigo-500/20 p-5 sm:p-6 text-left transition-all flex flex-col justify-between min-h-[180px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex justify-between items-start w-full relative z-10">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                                    <Brain size={20} strokeWidth={2.5} />
                                </div>
                                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {isCompilingQueue ? (
                                        <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                                    ) : (
                                        <Play size={15} className="ml-0.5" fill="currentColor" />
                                    )}
                                </span>
                            </div>
                            
                            <div className="mt-auto relative z-10">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    Smart Review
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">
                                    Spaced Repetition
                                </p>
                            </div>
                        </button>

                        {/* CARD 3: STUDIO */}
                        <button 
                            onClick={() => setActiveTab('create')}
                            className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-[2.2rem] border border-fuchsia-200/70 dark:border-fuchsia-500/20 p-5 sm:p-6 text-left transition-all flex flex-col justify-between min-h-[180px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex justify-between items-start w-full relative z-10">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-fuchsia-500/25 shrink-0">
                                    <Feather size={20} strokeWidth={2.5} />
                                </div>
                                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-fuchsia-50 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-500/30 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                                    <Plus size={18} strokeWidth={2.5} />
                                </span>
                            </div>
                            
                            <div className="mt-auto relative z-10">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    Studio
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400 mt-1">
                                    Create Content
                                </p>
                            </div>
                        </button>

                        {/* CARD 4: MESSAGES (Inbox) */}
                        <button 
                            onClick={() => setActiveTab('inbox')}
                            className={`backdrop-blur-xl rounded-[2.2rem] border p-5 sm:p-6 text-left transition-all flex flex-col justify-between min-h-[180px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] group relative overflow-hidden cursor-pointer ${
                                unreadCount > 0
                                    ? 'bg-rose-50/85 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30'
                                    : 'bg-white/75 dark:bg-slate-900/75 border-slate-200/70 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex justify-between items-start w-full relative z-10">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
                                    unreadCount > 0
                                        ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                    <Inbox size={20} strokeWidth={2.5} />
                                </div>
                                <span className={`flex items-center justify-center min-w-[36px] h-9 px-2.5 rounded-full font-black text-xs tabular-nums border ${
                                    unreadCount > 0
                                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm animate-pulse'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}>
                                    {String(unreadCount).padStart(2, '0')}
                                </span>
                            </div>
                            
                            <div className="mt-auto relative z-10">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    Messages
                                </h3>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    unreadCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                                }`}>
                                    {unreadCount > 0 ? 'Unread Alerts' : 'Inbox Clear'}
                                </p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* 4. ACTIVE SUBJECTS SECTION (FROSTED GLASS DRAGGABLE CARDS) */}
                {localClasses && localClasses.length > 0 ? (
                  <section data-tutorial="home-classes">
                      <div className="flex justify-between items-center mb-5 px-1">
                          <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                  <Layers size={14} strokeWidth={2.5} />
                              </div>
                              <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  Active Subjects
                              </h2>
                          </div>
                          <button 
                              onClick={() => setActiveTab('classes')} 
                              className="px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1"
                          >
                              View All <ChevronRight size={12} strokeWidth={3} />
                          </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                      className="text-left bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-500/40 p-6 shadow-xl hover:shadow-2xl hover:scale-[1.015] transition-all flex flex-col justify-between group cursor-grab active:cursor-grabbing relative overflow-hidden"
                                  >
                                      {/* Subtle Radial Theme Glow */}
                                      <div className={`absolute top-0 right-0 w-40 h-full bg-gradient-to-l ${theme.glow} to-transparent pointer-events-none opacity-60`} />

                                      {/* Top Metadata Strip */}
                                      <div className="flex justify-between items-center w-full mb-5 relative z-10">
                                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border truncate max-w-[180px] ${theme.badge}`}>
                                              {effectiveSubject}
                                          </span>
                                          
                                          <div className="flex items-center gap-1.5 shrink-0">
                                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 ${
                                                  cls.type === 'solo' 
                                                      ? 'text-indigo-600 dark:text-indigo-400' 
                                                      : 'text-slate-500 dark:text-slate-400'
                                              }`}>
                                                  {cls.type === 'solo' ? 'Solo' : effectiveGrade}
                                              </span>
                                              <GripVertical size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
                                          </div>
                                      </div>
                                      
                                      {/* Core Subject Identity */}
                                      <div className="flex items-center gap-4 my-auto mb-6 relative z-10">
                                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 ${theme.iconBg}`}>
                                              <Icon size={26} strokeWidth={2.3} aria-hidden="true" />
                                          </div>
                                          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                              {cls.title || cls.name}
                                          </h3>
                                      </div>

                                      {/* Bottom Progress Readout */}
                                      <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
                                          <div className="flex justify-between items-center mb-2">
                                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                  Completion
                                              </span>
                                              <span className={`text-xs font-black tabular-nums ${theme.textColor}`}>
                                                  {progress}%
                                              </span>
                                          </div>
                                          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                                              <div 
                                                  className={`h-full rounded-full transition-all duration-700 ${theme.barColor}`} 
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
                   <section
                      data-tutorial="home-classes"
                      className="p-10 md:p-14 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg"
                   >
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <School size={30} strokeWidth={2.2} aria-hidden="true"/>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">
                          No Active Subjects Assigned
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-6">
                          Join a classroom cohort or explore the course catalog to begin your pathway.
                      </p>
                      <button 
                          onClick={() => setActiveTab('classes')} 
                          className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/25 transition-all active:scale-95"
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
