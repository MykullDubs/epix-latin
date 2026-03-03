// src/App.tsx
import React, { useState } from 'react';
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
import ClassView from './components/ClassView'; // Projector view

export default function App() {
  const { user, userData, authChecked, activeOrg, allLessons, enrolledClasses, instructorClasses, allDecks, actions } = useMagisterData();
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'student' | 'instructor' | 'admin'>('student');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showAuth, setShowAuth] = useState(false);
  
  // Content State
  const [activeLesson, setActiveLesson] = useState<any>(null); 
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null); 
  const [presentationLessonId, setPresentationLessonId] = useState<string | null>(null);
  const [activeDeckKey, setActiveDeckKey] = useState<string | null>(null);

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

  // 2. PROJECTOR / PRESENTATION MODE (Full-screen overlay)
  if (presentationLessonId) {
    const lesson = allLessons.find(l => l.id === presentationLessonId);
    return (
      <div className="fixed inset-0 z-[5000] bg-slate-900 flex flex-col">
        <div className="h-16 px-6 flex justify-between items-center border-b border-white/10" style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}>
          <span className="font-black text-white uppercase tracking-widest">{activeOrg?.name || 'Magister'} | CLASE EN VIVO</span>
          <button onClick={() => setPresentationLessonId(null)} className="bg-black/20 text-white px-6 py-2 rounded-full font-black text-xs hover:bg-rose-600 transition-colors">Terminar Clase</button>
        </div>
        <div className="flex-1 bg-white">
          <ClassView lesson={lesson} userData={userData} activeOrg={activeOrg} />
        </div>
      </div>
    );
  }

  // 3. ADMIN VIEW
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

  // 4. INSTRUCTOR VIEW
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
        onUpdateClassDescription={actions.updateClassDescription} // Passing the new update desc prop!
        onAddStudent={actions.addStudent}
        onStartPresentation={setPresentationLessonId}
        onSwitchView={() => setCurrentView('student')}
        onLogout={actions.logout} 
        AdminDashboardView={AdminDashboardView}
      />
    );
  }

  // 5. STUDENT MOBILE APP
  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col items-center relative overflow-hidden">
      {/* Switch to Dash Button (For Staff) */}
      {userData?.role !== 'student' && (
        <button onClick={() => setCurrentView(userData?.role === 'instructor' ? 'instructor' : 'admin')} className="fixed top-6 right-6 z-[1000] bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase shadow-2xl transition-all hover:scale-105 active:scale-95">
          {userData?.role === 'instructor' ? '🎓 Magister Command' : '🛡️ Command Center'}
        </button>
      )}

      <div className="w-full bg-white max-w-md h-[100dvh] shadow-2xl relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden relative bg-slate-50">
          
          {activeLesson ? (
            activeLesson.type === 'exam' || activeLesson.type === 'test' ? (
              <ExamPlayerView exam={activeLesson} onFinish={(id:any, score:any, title:any, res:any) => { actions.logActivity(id, score, title, { scoreDetail: res }); setActiveLesson(null); }} />
            ) : (
              <LessonView lesson={activeLesson} onFinish={() => { actions.logActivity(activeLesson.id, 50, activeLesson.title, { mode: 'lesson' }); setActiveLesson(null); }} />
            )
          ) : activeStudentClass ? (
            <StudentClassView classData={activeStudentClass} lessons={allLessons} curriculums={GLOBAL_CURRICULUMS} onBack={() => setActiveStudentClass(null)} onSelectLesson={setActiveLesson} setActiveTab={setActiveTab} setSelectedLessonId={setPresentationLessonId} userData={userData} ExamPlayerView={ExamPlayerView} />
          ) : activeTab === 'discovery' ? (
            <DiscoveryView allDecks={allDecks} lessons={allLessons} onSelectDeck={(d:any) => { setActiveDeckKey(d.id); setActiveTab('flashcards'); }} onSelectLesson={setActiveLesson} onLogActivity={actions.logActivity} userData={userData} />
          ) : activeTab === 'flashcards' ? (
            <FlashcardView allDecks={allDecks} selectedDeckKey={activeDeckKey} onSelectDeck={(key:any) => { setActiveDeckKey(key); if(!key) setActiveTab('home'); }} onLogActivity={actions.logActivity} onSaveCard={actions.saveCard} userData={userData} user={user} />
          ) : activeTab === 'profile' ? (
            <ProfileView user={user} userData={userData} />
          ) : (
            <HomeView classes={enrolledClasses} onSelectClass={setActiveStudentClass} userData={userData} activeOrg={activeOrg} setActiveTab={setActiveTab} />
          )}

        </div>
        
        {!activeLesson && !activeStudentClass && (
          <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} activeOrg={activeOrg} />
        )}
      </div>
    </div>
  );
}
