// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useMagisterData } from './hooks/useMagisterData';
import { GLOBAL_CURRICULUMS } from './constants/curriculums';

// Sub-component Imports
import AuthView from './components/AuthView';
import MarketingSite from './components/MarketingSite';
import HomeView from './components/HomeView';
import DiscoveryView from './components/DiscoveryView';
import FlashcardView from './components/FlashcardView';
import ProfileView from './components/ProfileView';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import AdminDashboardView from './components/admin/AdminDashboardView';
import StudentClassView from './components/StudentClassView';
import StudentNavBar from './components/StudentNavBar';
import ExamPlayerView from './components/ExamPlayerView';
import LessonView from './components/LessonView';
import ClassView from './components/ClassView'; 
import LiveVocabProjector from './components/LiveVocabProjector'; 
import LiveConnectFourProjector from './components/LiveConnectFourProjector';
import CelebrationScreen from './components/CelebrationScreen';

export default function App() {
  // 🔥 FIX: We no longer rename allDecks to rawDecks because useMagisterData does the sorting now!
  const { user, userData, authChecked, activeOrg, allLessons, enrolledClasses, instructorClasses, allDecks, actions } = useMagisterData();
  
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

  // ==========================================================================
  //  THE URL ROUTING ENGINE
  // ==========================================================================
  const isHydrated = useRef(false);

  useEffect(() => {
    if (!authChecked || isHydrated.current) return;

    const params = new URLSearchParams(window.location.search);
    
    if (params.get('view')) setCurrentView(params.get('view') as any);
    if (params.get('tab')) setActiveTab(params.get('tab')!);
    if (params.get('deckId')) setActiveDeckKey(params.get('deckId'));

    const urlClassId = params.get('classId');
    if (urlClassId && enrolledClasses.length > 0) {
      const foundClass = enrolledClasses.find((c: any) => c.id === urlClassId);
      if (foundClass) setActiveStudentClass(foundClass);
    }

    const urlLessonId = params.get('lessonId');
    if (urlLessonId && allLessons.length > 0) {
      const foundLesson = allLessons.find((l: any) => l.id === urlLessonId);
      if (foundLesson) setActiveLesson(foundLesson);
    }

    if (enrolledClasses.length > 0 || allLessons.length > 0) {
        isHydrated.current = true;
    }
  }, [authChecked, enrolledClasses, allLessons]);

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

    if (window.location.search !== `?${params.toString()}`) {
      window.history.pushState({}, '', newUrl);
    }
  }, [currentView, activeTab, activeStudentClass, activeLesson, activeDeckKey]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      
      setCurrentView((params.get('view') as any) || 'student');
      setActiveTab(params.get('tab') || 'home');
      setActiveDeckKey(params.get('deckId'));

      const classId = params.get('classId');
      setActiveStudentClass(classId ? enrolledClasses.find((c: any) => c.id === classId) || null : null);

      const lessonId = params.get('lessonId');
      setActiveLesson(lessonId ? allLessons.find((l: any) => l.id === lessonId) || null : null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enrolledClasses, allLessons]);

  if (!authChecked) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  // 1. PUBLIC / AUTH GATES
  if (!user) {
    return showAuth ? (
      <div className="relative min-h-screen bg-slate-50">
         <button onClick={() => setShowAuth(false)} className="absolute top-6 left-6 z-50 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors">← Regresar</button>
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
          <ClassView 
            lesson={lesson} 
            classId={activePresentation.classId} 
            userData={userData} 
            activeOrg={activeOrg} 
            onExit={() => setActivePresentation(null)}
          />
        </div>
      </div>
    );
  }

  // 3. PROJECTOR MODE (Live Vocab Game)
  if (activeVocabGame) {
    const deck = allDecks[activeVocabGame.deckId] || allDecks.custom;
    const activeClassForVocab = instructorClasses.find(c => c.id === activeVocabGame.classId) || enrolledClasses.find(c => c.id === activeVocabGame.classId);

    return (
      <div className="fixed inset-0 z-[5000] bg-black flex flex-col">
        <div className="h-16 px-6 flex justify-between items-center border-b border-white/10" style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}>
          <span className="font-black text-white uppercase tracking-widest">{activeOrg?.name || 'Magister'} | VOCABULARY PROTOCOL</span>
          <button onClick={() => setActiveVocabGame(null)} className="bg-white/10 text-white px-6 py-2 rounded-full font-black text-xs hover:bg-rose-600 transition-colors">Abort Run</button>
        </div>
        <div className="flex-1 bg-black relative">
          <LiveVocabProjector 
             deck={deck} 
             classId={activeVocabGame.classId} 
             activeClass={activeClassForVocab} 
             activeOrg={activeOrg} 
             onExit={() => setActiveVocabGame(null)} 
          />
        </div>
      </div>
    );
  }

  // 4. PROJECTOR MODE (Live Connect 4 Battle)
  if (activeConnectFour) {
    const deck = allDecks[activeConnectFour.deckId] || allDecks.custom;
    const activeClassForC4 = instructorClasses.find(c => c.id === activeConnectFour.classId) || enrolledClasses.find(c => c.id === activeConnectFour.classId);

    return (
      <div className="fixed inset-0 z-[5000] bg-black flex flex-col">
        <LiveConnectFourProjector 
             deck={deck} 
             classId={activeConnectFour.classId} 
             activeClass={activeClassForC4} 
             onExit={() => setActiveConnectFour(null)} 
          />
      </div>
    );
  }

  // 5. ADMIN VIEW
  if (currentView === 'admin' && (userData?.role === 'admin' || userData?.role === 'org_admin')) {
    return (
        <div className="h-screen w-full relative">
            <AdminDashboardView user={{...user, ...userData}} activeOrg={activeOrg} onSwitchView={() => setCurrentView('student')} />
            <button 
                onClick={() => setCurrentView('student')}
                style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}
                className="fixed bottom-6 right-6 z-[9000] text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-transform active:scale-95"
            >
                👁️ Preview App
            </button>
        </div>
    );
  }

  // 6. INSTRUCTOR VIEW
  if (currentView === 'instructor' && userData?.role !== 'student') {
    return (
      <InstructorDashboard 
        user={user} 
        userData={{ ...userData, classes: instructorClasses }} 
        allDecks={allDecks} 
        lessons={allLessons} 
        curriculums={GLOBAL_CURRICULUMS} 
        onAssignCurriculum={actions.assignCurriculum} 
        onSaveLesson={actions.saveLesson} 
        onSaveCard={actions.saveCard}
        onAssign={actions.assignContent}
        onRevoke={actions.revokeContent}
        onCreateClass={actions.createClass}
        onDeleteClass={actions.deleteClass}
        onRenameClass={actions.renameClass}
        onUpdateClassDescription={actions.updateClassDescription}
        onAddStudent={actions.addStudent}
        onStartPresentation={(lessonId: string, classId: string) => setActivePresentation({ lessonId, classId })}
        onStartVocabGame={(deckId: string, classId: string) => setActiveVocabGame({ deckId, classId })}
        onStartConnectFour={(deckId: string, classId: string) => setActiveConnectFour({ deckId, classId })}
        
        // 🔥 THE MISSING LINK IS NOW WIRED UP!
        onPublishDeck={actions.publishDeck}
        
        onSwitchView={() => setCurrentView('student')}
        onLogout={actions.logout} 
        AdminDashboardView={AdminDashboardView}
      />
    );
  }

  // 7. STUDENT MOBILE APP
  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col items-center relative overflow-hidden">
      {userData?.role !== 'student' && (
        <button onClick={() => setCurrentView(userData?.role === 'instructor' ? 'instructor' : 'admin')} className="fixed top-6 right-6 z-[1000] bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase shadow-2xl transition-all hover:scale-105 active:scale-95">
          {userData?.role === 'instructor' ? '🎓 Magister Command' : '🛡️ Command Center'}
        </button>
      )}

      <div className="w-full bg-white max-w-md h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden relative bg-slate-50">
          
          {/* CELEBRATION INTERCEPTOR */}
          {celebrationData ? (
             <CelebrationScreen 
                data={celebrationData} 
                userData={userData} 
                onComplete={() => {
                    setCelebrationData(null);
                    setActiveLesson(null); 
                }} 
             />
          ) : activeLesson ? (
            activeLesson.type === 'exam' || activeLesson.type === 'test' ? (
              <ExamPlayerView 
                exam={activeLesson} 
                onFinish={(id:any, score:any, title:any, res:any) => { 
                    actions.logActivity(id, score, title, { scoreDetail: res }); 
                    setCelebrationData({ xp: score, title: title }); 
                }} 
              />
            ) : (
              <LessonView 
                lesson={activeLesson} 
                onFinish={() => { 
                    actions.logActivity(activeLesson.id, 50, activeLesson.title, { mode: 'lesson' }); 
                    setCelebrationData({ xp: 50, title: activeLesson.title }); 
                }} 
              />
            )
          ) : activeStudentClass ? (
            <StudentClassView 
               classData={activeStudentClass} 
               lessons={allLessons} 
               curriculums={GLOBAL_CURRICULUMS} 
               onBack={() => setActiveStudentClass(null)} 
               onSelectLesson={setActiveLesson} 
               setActiveTab={setActiveTab} 
               setSelectedLessonId={(lessonId: string) => setActivePresentation({ lessonId, classId: activeStudentClass.id })} 
               userData={userData} 
               ExamPlayerView={ExamPlayerView} 
               onLogActivity={actions.logActivity}
            />
          ) : activeTab === 'discovery' ? (
            <DiscoveryView allDecks={allDecks} lessons={allLessons} onSelectDeck={(d:any) => { setActiveDeckKey(d.id); setActiveTab('flashcards'); }} onSelectLesson={setActiveLesson} onLogActivity={actions.logActivity} userData={userData} />
          ) : activeTab === 'flashcards' ? (
            <FlashcardView allDecks={allDecks} selectedDeckKey={activeDeckKey} onSelectDeck={(key:any) => { setActiveDeckKey(key); if(!key) setActiveTab('home'); }} onLogActivity={actions.logActivity} onSaveCard={actions.saveCard} userData={userData} user={user} />
          ) : activeTab === 'profile' ? (
            <ProfileView user={user} userData={userData} />
          ) : (
            <HomeView classes={enrolledClasses} curriculums={GLOBAL_CURRICULUMS} onSelectClass={setActiveStudentClass} userData={userData} activeOrg={activeOrg} setActiveTab={setActiveTab} />
          )}
        </div>
        
        {!activeLesson && !activeStudentClass && !celebrationData && (
          <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} activeOrg={activeOrg} />
        )}
      </div>
    </div>
  );
}
