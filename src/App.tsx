// src/App.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore'; 
import { db, appId } from './config/firebase';   
import { useMagisterData } from './hooks/useMagisterData';
import { GLOBAL_CURRICULUMS } from './constants/curriculums'; 

// Sub-component Imports
import AuthView from './components/AuthView';
import MarketingSite from './components/MarketingSite';
import HomeView from './components/HomeView';
import DiscoveryView from './components/DiscoveryView';
import FlashcardView from './components/FlashcardView';
import ProfileView from './components/ProfileView';
import StorefrontView from './components/StorefrontView'; 
import InstructorDashboard from './components/instructor/InstructorDashboard';
import AdminDashboardView from './components/admin/AdminDashboardView';
import StudentClassView from './components/StudentClassView';
import StudentNavBar from './components/StudentNavBar';
import ExamPlayerView from './components/ExamPlayerView';
import LessonView from './components/LessonView';
import ClassView from './components/ClassView'; 
import LiveVocabProjector from './components/LiveVocabProjector'; 
import LiveConnectFourProjector from './components/LiveConnectFourProjector';
import LiveSlipstreamProjector from './components/LiveSlipstreamProjector';
import CelebrationScreen from './components/CelebrationScreen';
import HoloAvatar from './components/HoloAvatar'; 
import InstructorHUD from './components/instructor/InstructorHUD'; 
import StudentInbox from './components/StudentInbox'; // 🔥 IMPORTED INBOX

// 🔥 DYNAMIC OS THEME ENGINE
const OS_THEMES: Record<string, string> = {
    // Injecting heavy background colors and matching text colors to completely override the default styling
    theme_hacker: 'bg-emerald-950 text-emerald-500 selection:bg-emerald-500/30',
    theme_synth: 'bg-fuchsia-950 text-cyan-400 selection:bg-cyan-400/30',
    theme_vapor: 'bg-violet-950 text-fuchsia-400 selection:bg-fuchsia-400/30',
    default: 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
};

export default function App() {
  const { 
    user, userData, authChecked, activeOrg, allLessons, 
    enrolledClasses, instructorClasses, allDecks, 
    customCurriculums, activityLogs, actions,
    allClasses 
  } = useMagisterData();
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'student' | 'instructor' | 'admin'>('student');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showAuth, setShowAuth] = useState(false);
  
  // Content State
  const [activeLesson, setActiveLesson] = useState<any>(null); 
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null); 
  const [activeDeckKey, setActiveDeckKey] = useState<string | null>(null);
  const [celebrationData, setCelebrationData] = useState<any>(null);

  // Live Presentation States
  const [activePresentation, setActivePresentation] = useState<{lessonId: string, classId: string} | null>(null);
  const [activeVocabGame, setActiveVocabGame] = useState<{deckId: string, classId: string} | null>(null);
  const [activeConnectFour, setActiveConnectFour] = useState<{deckId: string, classId: string} | null>(null);
  const [activeSlipstream, setActiveSlipstream] = useState<{deckId: string, classId: string} | null>(null);
  const [activeHUD, setActiveHUD] = useState<{lessonId: string, classId: string} | null>(null); 

  const allCurriculums = useMemo(() => {
      return [...GLOBAL_CURRICULUMS, ...(customCurriculums || [])];
  }, [customCurriculums]);

  // 🔥 THE NETWORK FILTER: Only passes public decks to the Discovery Radar
  const networkDecks = useMemo(() => {
      const publicDecks: Record<string, any> = {};
      if (allDecks) {
          Object.entries(allDecks).forEach(([key, deck]: any) => {
              if (deck.isPublished === true) {
                  publicDecks[key] = deck;
              }
          });
      }
      return publicDecks;
  }, [allDecks]);

  // 🔥 MERGE LIVE COHORTS WITH SOLO ELECTIVES & APPLY SAVED ORDER
  const combinedClasses = useMemo(() => {
      const soloCourses = userData?.enrolledClasses || userData?.profile?.main?.enrolledClasses || [];
      
      const enrichedSoloCourses = soloCourses.map((solo: any) => {
          const fullData = allClasses?.find(c => c.id === solo.id);
          if (fullData) {
              return { ...fullData, type: 'solo', progressPct: solo.progressPct || 0, unlockedAt: solo.unlockedAt };
          }
          return {
              ...solo,
              name: solo.title || solo.name || "Decrypting Course...",
              themeColor: "#4f46e5", 
              type: 'solo'
          };
      });

      const merged = [...enrolledClasses, ...enrichedSoloCourses];
      
      const savedOrder = userData?.classOrder;
      if (savedOrder && savedOrder.length > 0) {
          return merged.sort((a, b) => {
              const indexA = savedOrder.indexOf(a.id);
              const indexB = savedOrder.indexOf(b.id);
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
          });
      }
      
      return merged;
  }, [enrolledClasses, userData, allClasses]);

  // 🔥 THE GLOBAL THEME LISTENER
  const equippedThemeId = userData?.equipped?.themes || 'default';
  const activeThemeClass = OS_THEMES[equippedThemeId] || OS_THEMES.default;
  const themeClassModifier = equippedThemeId !== 'default' ? equippedThemeId.replace('_', '-') : '';

  const handleEquipCosmetic = async (itemId: string, category: string) => {
      if (!user || !userData) return;
      const newEquipped = { ...(userData.equipped || {}), [category]: itemId };
      try {
          const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
          await updateDoc(profileRef, { equipped: newEquipped });
          
          const rootRef = doc(db, 'artifacts', appId, 'users', user.uid);
          await updateDoc(rootRef, { equipped: newEquipped, 'profile.main.equipped': newEquipped }).catch(() => {});
      } catch (err) {
          console.error("Equip protocol failed:", err);
      }
  };

  const handleReorderFolders = async (newOrder: string[]) => {
      if (!user?.uid) return;
      try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), { studyFolders: newOrder }, { merge: true }); } 
      catch (err) { console.error("Failed to sync folder order to the network:", err); }
  };

  const handleReorderDecks = async (newOrder: string[]) => {
      if (!user?.uid) return;
      try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), { deckOrder: newOrder }, { merge: true }); } 
      catch (err) { console.error("Failed to sync deck order to the network:", err); }
  };

  // ==========================================================================
  //  LIVE ARENA LAUNCHERS
  // ==========================================================================
  const handleStartVocabGame = async (deckId: string, classId: string) => {
      try {
          const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
          await setDoc(sessionRef, { type: 'trivia', lessonId: deckId, quizState: 'waiting', currentBlockIndex: 0, joined: {}, answers: {}, scores: {}, timestamp: Date.now() });
          setActiveVocabGame({ deckId, classId });
      } catch (error) { console.error("Failed to launch Live Arena:", error); }
  };

  const handleStartConnectFour = async (deckId: string, classId: string) => {
      try {
          const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
          await setDoc(sessionRef, { type: 'connect_four', lessonId: deckId, quizState: 'waiting', currentTurn: 1, grid: Array(7).fill([]), teams: {}, joined: {}, answers: {}, timestamp: Date.now() });
          setActiveConnectFour({ deckId, classId });
      } catch (error) { console.error("Failed to launch Squad Strike:", error); }
  };

  const handleStartSlipstream = async (deckId: string, classId: string) => {
      try {
          const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
          await setDoc(sessionRef, { type: 'slipstream', lessonId: deckId, quizState: 'waiting', joined: {}, progress: {}, timestamp: Date.now() });
          setActiveSlipstream({ deckId, classId });
      } catch (error) { console.error("Failed to launch Slipstream Run:", error); }
  };

  // ==========================================================================
  //  URL ROUTING ENGINE
  // ==========================================================================
  const isHydrated = useRef(false);

  useEffect(() => {
    if (!authChecked || isHydrated.current) return;
    const params = new URLSearchParams(window.location.search);
    
    // 🔥 NEW OS FEATURE: QR Code Route Interceptor
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if ((pathParts[0] === 'join' || pathParts[0] === 'live') && pathParts[1]) {
        params.set('classId', pathParts[1]);
        params.set('autoJoin', 'true'); // Flag to instantly open the lobby
        window.history.replaceState({}, '', `/?${params.toString()}`);
    }

    if (params.get('action') === 'signup' && !user) {
        setShowAuth(true);
        params.delete('action');
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
    }

    if (params.get('view')) setCurrentView(params.get('view') as any);
    if (params.get('tab')) setActiveTab(params.get('tab')!);
    if (params.get('deckId')) setActiveDeckKey(params.get('deckId'));

    const urlClassId = params.get('classId');
    if (urlClassId) {
        if (combinedClasses.length > 0) {
            const foundClass = combinedClasses.find((c: any) => c.id === urlClassId);
            if (foundClass) {
                setActiveStudentClass(foundClass);
            } else if (allClasses && allClasses.length > 0) {
                const publicClass = allClasses.find((c: any) => c.id === urlClassId);
                if (publicClass) {
                    setActiveTab('discovery');
                }
            }
        } else {
            return; // Wait for classes to finish loading before hydrating
        }
    }

    const urlLessonId = params.get('lessonId');
    if (urlLessonId && allLessons.length > 0) {
      const foundLesson = allLessons.find((l: any) => l.id === urlLessonId);
      if (foundLesson) setActiveLesson(foundLesson);
    }

    if (combinedClasses.length > 0 || allLessons.length > 0 || allClasses?.length > 0) {
        isHydrated.current = true;
    }
  }, [authChecked, combinedClasses, allLessons, user, allClasses]);

  useEffect(() => {
    if (!isHydrated.current) return;
    const params = new URLSearchParams(window.location.search);
    params.set('view', currentView);
    params.set('tab', activeTab);
    
    if (activeStudentClass) params.set('classId', activeStudentClass.id);
    else params.delete('classId');
    if (activeLesson) params.set('lessonId', activeLesson.id);
    else params.delete('lessonId');
    if (activeDeckKey) params.set('deckId', activeDeckKey);
    else params.delete('deckId');

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) window.history.pushState({}, '', newUrl);
  }, [currentView, activeTab, activeStudentClass, activeLesson, activeDeckKey]);

  useEffect(() => {
    const handlePopState = () => {
      const params = newSearchParams(window.location.search);
      const params = new URLSearchParams(window.location.search); 
      setCurrentView((params.get('view') as any) || 'student');
      setActiveTab(params.get('tab') || 'home');
      setActiveDeckKey(params.get('deckId'));

      const classId = params.get('classId');
      setActiveStudentClass(classId ? combinedClasses.find((c: any) => c.id === classId) || null : null);

      const lessonId = params.get('lessonId');
      setActiveLesson(lessonId ? allLessons.find((l: any) => l.id === lessonId) || null : null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [combinedClasses, allLessons]);

  // --- BOOT SEQUENCE & AUTHENTICATION ---
  if (!authChecked) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-indigo-500 font-mono">
              <div className="animate-pulse space-y-4 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-black tracking-[0.5em] uppercase">Booting Magister OS...</p>
              </div>
          </div>
      );
  }

  if (!user) {
    return showAuth ? (
      <div className={`relative min-h-screen transition-colors duration-500 ${activeThemeClass}`}>
         <button onClick={() => setShowAuth(false)} className="absolute top-6 left-6 z-50 text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-colors">← Regresar</button>
         <AuthView />
      </div>
    ) : <MarketingSite onLoginClick={() => setShowAuth(true)} />;
  }

  // 2. PROJECTOR / PRESENTATION MODE
  if (activePresentation) {
    const lesson = allLessons.find(l => l.id === activePresentation.lessonId);
    return (
      <div className="fixed inset-0 z-[5000] bg-slate-900 flex flex-col">
        <div className="h-16 px-6 flex justify-between items-center border-b border-white/10" style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}>
          <span className="font-black text-white uppercase tracking-widest">{activeOrg?.name || 'Magister'} | CLASE EN VIVO</span>
          <button onClick={() => setActivePresentation(null)} className="bg-black/20 text-white px-6 py-2 rounded-full font-black text-xs hover:bg-rose-600 transition-colors">Terminar Clase</button>
        </div>
        <div className="flex-1 bg-white">
          <ClassView lesson={lesson} classId={activePresentation.classId} userData={userData} activeOrg={activeOrg} onExit={() => setActivePresentation(null)} />
        </div>
      </div>
    );
  }

  // 🔥 2.5 INSTRUCTOR HUD (The iPad Remote)
  if (activeHUD) {
    const lesson = allLessons.find(l => l.id === activeHUD.lessonId);
    const activeClassForHUD = instructorClasses.find(c => c.id === activeHUD.classId);
    return (
      <div className="fixed inset-0 z-[5000] bg-black flex flex-col">
        <InstructorHUD lesson={lesson} classId={activeHUD.classId} activeClass={activeClassForHUD} onExit={() => setActiveHUD(null)} />
      </div>
    );
  }

  if (activeVocabGame) {
    const deck = allDecks[activeVocabGame.deckId] || allDecks.custom;
    const activeClassForVocab = instructorClasses.find(c => c.id === activeVocabGame.classId) || enrolledClasses.find(c => c.id === activeVocabGame.classId);
    return (
      <div className="fixed inset-0 z-[5000] bg-black flex flex-col">
        <LiveVocabProjector deck={deck} classId={activeVocabGame.classId} activeClass={activeClassForVocab} activeOrg={activeOrg} onExit={() => setActiveVocabGame(null)} />
      </div>
    );
  }

  if (activeConnectFour) {
    const deck = allDecks[activeConnectFour.deckId] || allDecks.custom;
    const activeClassForC4 = instructorClasses.find(c => c.id === activeConnectFour.classId) || enrolledClasses.find(c => c.id === activeConnectFour.classId);
    return (
      <div className="fixed inset-0 z-[5000] bg-black flex flex-col">
        <LiveConnectFourProjector deck={deck} classId={activeConnectFour.classId} activeClass={activeClassForC4} onExit={() => setActiveConnectFour(null)} />
      </div>
    );
  }

  if (activeSlipstream) {
    const deck = allDecks[activeSlipstream.deckId] || allDecks.custom;
    const activeClassForSlipstream = instructorClasses.find(c => c.id === activeSlipstream.classId) || enrolledClasses.find(c => c.id === activeSlipstream.classId);
    return (
      <div className="fixed inset-0 z-[5000] bg-black flex flex-col">
        <LiveSlipstreamProjector deck={deck} classId={activeSlipstream.classId} activeClass={activeClassForSlipstream} onExit={() => setActiveSlipstream(null)} />
      </div>
    );
  }

  // 3. ADMIN VIEW
  if (currentView === 'admin' && (userData?.role === 'admin' || userData?.role === 'org_admin')) {
    return (
        <div className={`h-screen w-full relative transition-colors duration-500 ${activeThemeClass}`}>
            <AdminDashboardView user={{...user, ...userData}} activeOrg={activeOrg} onSwitchView={() => setCurrentView('student')} />
            <button 
                onClick={() => setCurrentView('student')}
                style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}
                className="fixed bottom-6 right-6 z-[9000] text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-transform active:scale-95 hover:scale-105"
            >
                👁️ Preview App
            </button>
        </div>
    );
  }

  // 4. INSTRUCTOR VIEW
  if (currentView === 'instructor' && userData?.role !== 'student') {
    return (
      <InstructorDashboard 
        user={user} 
        userData={{ ...userData, classes: instructorClasses }} 
        allDecks={allDecks} 
        lessons={allLessons} 
        curriculums={allCurriculums}
        activityLogs={activityLogs}
        onAssignCurriculum={actions.assignCurriculum} 
        onSaveLesson={actions.saveLesson} 
        onSaveCurriculum={actions.saveCurriculum}
        onSaveCard={actions.saveCard}
        onUpdateCard={actions.updateCard}
        onAssign={actions.assignContent}
        onRevoke={actions.revokeContent}
        onCreateClass={actions.createClass}
        onDeleteClass={actions.deleteClass}
        onRenameClass={actions.renameClass}
        onUpdateClassDescription={actions.updateClassDescription}
        onAddStudent={actions.addStudent}
        onRemoveStudent={actions.removeStudent} 
        onStartPresentation={(lessonId: string, classId: string) => setActivePresentation({ lessonId, classId })}
        onStartHUD={(lessonId: string, classId: string) => setActiveHUD({ lessonId, classId })} // 🔥 NEW: Connects HUD to dashboard
        onStartVocabGame={handleStartVocabGame}      
        onStartConnectFour={handleStartConnectFour} 
        onStartSlipstream={handleStartSlipstream}
        onPublishDeck={actions.publishDeck}
        onSwitchView={() => setCurrentView('student')}
        onLogout={actions.logout} 
        AdminDashboardView={AdminDashboardView}
      />
    );
  }

  // 5. STUDENT MOBILE APP
  return (
    <div className={themeClassModifier}>
      <div className={`min-h-[100dvh] w-full flex flex-col items-center relative overflow-hidden transition-colors duration-700 ${activeThemeClass}`}>
        
        {/* Floating Command Center Button features the user's avatar! */}
        {userData?.role !== 'student' && (
          <button 
              onClick={() => setCurrentView(userData?.role === 'instructor' ? 'instructor' : 'admin')} 
              className="fixed top-6 right-6 z-[1000] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full font-black text-[10px] tracking-widest uppercase shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all hover:scale-105 active:scale-95 group overflow-hidden border border-white/10 dark:border-slate-900/10 flex items-center gap-3"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <HoloAvatar student={userData} size="sm" className="w-6 h-6 shadow-none ring-1 ring-white/20" />
            <span className="relative z-10">
              {userData?.role === 'instructor' ? 'Magister Command' : 'Command Center'}
            </span>
          </button>
        )}

        {/* The OS Device Wrapper */}
        <div className={`w-full max-w-md h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.4)] relative flex flex-col overflow-hidden transition-colors duration-700 ring-1 ring-slate-900/5 dark:ring-white/5 ${activeThemeClass}`}>
          
          <div key={activeTab + (activeLesson?.id || '')} className="flex-1 overflow-hidden relative animate-in fade-in zoom-in-[0.98] duration-300 ease-out">
            {celebrationData ? (
               <CelebrationScreen data={celebrationData} userData={userData} onComplete={() => { setCelebrationData(null); setActiveLesson(null); }} />
            ) : activeLesson ? (
              activeLesson.type === 'exam' || activeLesson.type === 'test' ? (
                <ExamPlayerView exam={activeLesson} onFinish={(id:any, score:any, title:any, res:any) => { actions.logActivity(id, score, title, { scoreDetail: res }); setCelebrationData({ xp: score, title: title }); }} />
              ) : (
                <LessonView lesson={activeLesson} onFinish={() => { actions.logActivity(activeLesson.id, 50, activeLesson.title, { mode: 'lesson' }); setCelebrationData({ xp: 50, title: activeLesson.title }); }} />
              )
            ) : activeStudentClass ? (
              <StudentClassView classData={activeStudentClass} lessons={allLessons} curriculums={allCurriculums} allDecks={allDecks} onBack={() => setActiveStudentClass(null)} onSelectLesson={setActiveLesson} setActiveTab={setActiveTab} setSelectedLessonId={(lessonId: string) => setActivePresentation({ lessonId, classId: activeStudentClass.id })} userData={userData} ExamPlayerView={ExamPlayerView} onLogActivity={actions.logActivity} />
            ) : activeTab === 'discovery' ? (
              <DiscoveryView networkClasses={allClasses || []} networkDecks={networkDecks} userData={userData} activeOrg={activeOrg} onPurchase={actions.purchaseItem} onOpenClass={(courseObj: any) => { setActiveDeckKey(null); setActiveLesson(null); setActiveTab('home'); setActiveStudentClass(courseObj); }} onDownloadDeck={async (deck: any) => { await actions.purchaseItem(deck.id, deck.price || 0, 'deck'); if (actions.assignDeckToFolder) actions.assignDeckToFolder(deck.id, null); setActiveDeckKey(deck.id); setActiveTab('flashcards'); }} />
            ) : activeTab === 'store' ? (
              <StorefrontView userData={userData} activeOrg={activeOrg} onPurchase={actions.purchaseItem} onEquip={handleEquipCosmetic} />
            ) : activeTab === 'flashcards' ? (
              <FlashcardView allDecks={allDecks} selectedDeckKey={activeDeckKey} onSelectDeck={(key:any) => { setActiveDeckKey(key); if(!key) setActiveTab('home'); }} onLogActivity={actions.logActivity} onSaveCard={actions.saveCard} userData={userData} user={user} activeOrg={activeOrg} onToggleStar={actions.toggleCardStar} onToggleArchive={actions.toggleDeckArchive} onCreateFolder={actions.createStudyFolder} onAssignToFolder={actions.assignDeckToFolder} onHideDeck={actions.hideDeck} onUpdateFolder={actions.updateStudyFolder} onDeleteFolder={actions.deleteStudyFolder} onReorderFolders={handleReorderFolders} onReorderDecks={handleReorderDecks} />
            ) : activeTab === 'profile' ? (
              <ProfileView user={user} userData={userData} />
            ) : activeTab === 'inbox' ? (
              // 🔥 PRO-LMS: INBOX ROUTER 
              <StudentInbox 
                  user={user} 
                  onLaunchContent={(type: 'lesson' | 'deck', id: string) => {
                      if (type === 'lesson') {
                          const foundLesson = allLessons.find(l => l.id === id);
                          if (foundLesson) setActiveLesson(foundLesson);
                      } else if (type === 'deck') {
                          setActiveDeckKey(id);
                          setActiveTab('flashcards');
                      }
                  }} 
              />
            ) : (
              <HomeView classes={combinedClasses} curriculums={allCurriculums} onSelectClass={setActiveStudentClass} onReorderClasses={(actions as any).reorderClasses} userData={userData} user={user} activeOrg={activeOrg} setActiveTab={setActiveTab} allDecks={allDecks} />
            )}
          </div>
          
          {!activeLesson && !activeStudentClass && !celebrationData && (
            <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} activeOrg={activeOrg} userData={userData} />
          )}
        </div>
      </div>
    </div>
  );
}
