import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';

// --- 1. LOCAL CONFIG & DATA ---
import { auth, db, appId } from './config/firebase';
import { Curriculum, GLOBAL_CURRICULUMS } from './constants/curriculums';
import { 
  DEFAULT_USER_DATA, DAILY_QUESTS, 
  INITIAL_SYSTEM_DECKS, INITIAL_SYSTEM_LESSONS, TYPE_COLORS, THEMES
} from './constants/defaults';
import { useLearningTimer } from './hooks/useLearningTimer';
import ConnectThreeVocab from './components/ConnectThreeVocab';
import LivePreview from './components/LivePreview';
import { 
  ConceptCardBlock, JuicyDeckBlock, ScenarioBlock, 
  QuizBlock, FillBlankBlock, ChatDialogueBlock 
} from './components/LessonBlocks';
import ClassView from './components/ClassView';
import ClassForum from './components/ClassForum';
import LessonView from './components/LessonView';
import DiscoveryView from './components/DiscoveryView';
import Header from './components/Header';
import HomeView from './components/HomeView';
import FlashcardView from './components/FlashcardView';
import AuthView from './components/AuthView';
import { calculateUserStats } from './utils/profileHelpers';
import ProfileView from './components/ProfileView';
import StudentGradebook from './components/StudentGradebook';
import StudentClassView from './components/StudentClassView';
import { Toast, JuicyToast } from './components/Toast';
import { BroadcastModal, AnalyticsDashboard } from './components/instructor/InstructorTools';
import InstructorInbox from './components/instructor/InstructorInbox';
import LiveActivityFeed from './components/instructor/LiveActivityFeed';
import InstructorGradebook from './components/instructor/InstructorGradebook';
import ClassManagerView from './components/instructor/ClassManagerView';
import BuilderHub from './components/instructor/BuilderHub';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import StudentNavBar from './components/StudentNavBar';
import ExamPlayerView from './components/ExamPlayerView';
import AdminDashboardView from './components/admin/AdminDashboardView';
import MarketingSite from './components/MarketingSite';
// --- 2. FIREBASE AUTHENTICATION ---
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "firebase/auth";

// --- 3. FIREBASE DATABASE (FIRESTORE) ---
import { 
  doc, setDoc, onSnapshot, collection, addDoc, updateDoc, 
  increment, writeBatch, deleteDoc, arrayUnion, arrayRemove, 
  query, where, collectionGroup, orderBy, limit, getDocs, getDoc 
} from "firebase/firestore";

// --- 4. UI ICONS (LUCIDE) ---
import { 
  BookOpen, Layers, User, Home, Check, X, Zap, ChevronRight, Search, Volume2, 
  Puzzle, MessageSquare, GraduationCap, PlusCircle, Save, Feather, ChevronDown, 
  PlayCircle, Award, Trash2, Plus, FileText, Brain, Loader, LogOut, UploadCloud, 
  School, Users, Copy, List, ArrowRight, LayoutDashboard, ArrowLeft, Library, 
  Pencil, Image, Info, Edit3, AlertTriangle, FlipVertical, HelpCircle, 
  CheckCircle2, Circle, Activity, Clock, Compass, Globe, RotateCcw, Play, 
  Maximize2, BarChart2, Timer, Megaphone, Inbox, XCircle, ChevronUp, Send,
  ArrowUp, ArrowDown, Eye, EyeOff, MessageCircle, AlignLeft, ClipboardList, Table, Calendar,
  Trophy, Flame, Settings, BarChart3, CornerDownRight, MoreHorizontal, Dumbbell, Map, Sparkles, Star, TrendingUp, Target,
  Filter, SlidersHorizontal, Hash, Gauge, ChevronLeft, Monitor, Smartphone, PenTool, Menu, Code, BarChart, Tag, RefreshCcw, Gamepad2,
  Bot, Database, Shield, ChefHat, AlertCircle, MoreVertical, Mail, Briefcase, LogIn, Lock
} from 'lucide-react';


// --- QUIZ LOGIC HELPER ---
const generateQuiz = (cards: any[]) => {
  if (!cards || cards.length < 4) return []; // Need at least 4 cards for distractors
  // Shuffle cards
  const shuffled = [...cards].sort(() => 0.5 - Math.random());
  
  return shuffled.map((correctCard) => {
    // Pick 3 random distractors that aren't the correct card
    const others = cards.filter(c => c.id !== correctCard.id);
    const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Combine and shuffle options
    const options = [correctCard, ...distractors]
        .sort(() => 0.5 - Math.random())
        .map(c => ({ id: c.id, text: c.back })); // Assuming "Back" is the answer (English)

    return {
      id: correctCard.id,
      question: `What is the meaning of "${correctCard.front}"?`,
      correctId: correctCard.id,
      options: options,
      context: correctCard.usage?.sentence // Optional context hint
    };
  });
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  
  const [currentView, setCurrentView] = useState<'student' | 'instructor' | 'admin'>('student');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showAuth, setShowAuth] = useState(false);
  
  const hasRoutedInitial = useRef(false);

  const [systemLessons] = useState([]); 
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [instructorClasses, setInstructorClasses] = useState<any[]>([]); 
  const [allDecks, setAllDecks] = useState<any>({ custom: { title: 'Scriptorium', cards: [] } });
  const [systemCurriculums] = useState<Curriculum[]>(GLOBAL_CURRICULUMS);
  
  const [activeLesson, setActiveLesson] = useState<any>(null); 
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null); 
  const [presentationLessonId, setPresentationLessonId] = useState<string | null>(null); 
  const [activeDeckKey, setActiveDeckKey] = useState<string | null>(null); 

  const lessons = useMemo(() => {
    const allActiveClasses = [...instructorClasses, ...enrolledClasses]; 
    const assignments = allActiveClasses.flatMap(c => c.assignments || []);
    return [...systemLessons, ...customLessons, ...assignments];
  }, [systemLessons, customLessons, enrolledClasses, instructorClasses]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
        hasRoutedInitial.current = false;
        setAuthChecked(true);
      }
    });

    if (user?.uid) {
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          
          if (!hasRoutedInitial.current) {
              if (data.role === 'admin' || data.role === 'org_admin') {
                  setCurrentView('admin');
              } else if (data.role === 'instructor') {
                  setCurrentView('instructor');
              } else {
                  setCurrentView('student');
              }
              hasRoutedInitial.current = true;
          }
        }
        setAuthChecked(true);
      });

      const unsubLessons = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), (snap) => {
        setCustomLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), (snap) => {
        const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllDecks((prev: any) => ({ ...prev, custom: { ...prev.custom, cards } }));
      });

      const qClasses = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', user.email));
      const unsubClasses = onSnapshot(qClasses, (snap) => {
        setEnrolledClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubInstructorClasses = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), (snap) => {
        setInstructorClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubAuth(); unsubProfile(); unsubLessons(); unsubCards(); unsubClasses(); unsubInstructorClasses(); };
    }
    return () => unsubAuth();
  }, [user?.uid, user?.email]);

  const calculateCurriculumProgress = (curriculumId: string, studentLogs: any[]) => {
      const curriculum = systemCurriculums.find(c => c.id === curriculumId);
      if (!curriculum) return { completed: 0, total: 0, percentage: 0 };

      const totalLessons = curriculum.lessonIds.length;
      
      const completedLessonIds = new Set(
          studentLogs
              .filter(log => log.type === 'completion' && curriculum.lessonIds.includes(log.itemId))
              .map(log => log.itemId)
      );

      const completedCount = completedLessonIds.size;
      const percentage = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

      return {
          completed: completedCount,
          total: totalLessons,
          percentage: percentage,
          nextLessonId: curriculum.lessonIds[completedCount] || null 
      };
  };

  useEffect(() => {
    if (userData?.orgId && userData.orgId !== 'global') {
      const unsubOrg = onSnapshot(doc(db, 'artifacts', appId, 'organizations', userData.orgId), (snap) => {
        if (snap.exists()) {
          setActiveOrg({ id: snap.id, ...snap.data() });
        }
      });
      return () => unsubOrg();
    } else {
      setActiveOrg(null);
    }
  }, [userData?.orgId]);

  const handleCreateClass = async (className: string) => {
    if (!user) return { success: false };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), {
        name: className, code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        students: [], studentEmails: [], assignments: [], created: Date.now()
      });
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  const handleDeleteClass = async (id: string) => {
    if (!user) return { success: false };
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id));
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  const handleRenameClass = async (id: string, newName: string) => {
    if (!user) return { success: false };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id), { name: newName });
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  const handleAddStudent = async (classId: string, email: string) => {
    if (!user) return { success: false };
    try {
      const cleanEmail = email.toLowerCase().trim();
      const classRef = doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId);
      
      await updateDoc(classRef, {
        students: arrayUnion({ email: cleanEmail, name: null, uid: null }),
        studentEmails: arrayUnion(cleanEmail)
      });
      return { success: true };
    } catch (e) { return { success: false }; }
  };
  
  const handleAssign = async (classId: string, assignment: any) => {
    if (!user) return { success: false };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), {
        assignments: arrayUnion(assignment)
      });
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  const handleRevoke = async (classId: string, assignment: any) => {
    if (!user) return { success: false };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), {
        assignments: arrayRemove(assignment)
      });
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  const handleAssignCurriculum = async (classId: string, curriculumId: string) => {
    if (!user) return { success: false };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), {
        assignedCurriculums: arrayUnion(curriculumId)
      });
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  const handleSaveLesson = async (lessonData: any) => {
    if (!user) return;
    const lessonId = lessonData.id || `lesson_${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', lessonId), {
      ...lessonData, id: lessonId, instructorId: user.uid, updatedAt: Date.now()
    });
  };

  const handleSaveCard = async (cardData: any) => {
    if (!user) return;
    const cardId = cardData.id || `card_${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), { 
      ...cardData, id: cardId, owner: user.uid 
    });
  };

  const handleLogActivity = async (itemId: string, xp: number, title: string, details: any = {}) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
        studentEmail: user.email,
        studentName: userData?.name || user.email.split('@')[0],
        type: itemId === 'explore_deck' ? 'explore' : 'completion',
        activityType: details.mode || 'general',
        itemTitle: title,
        itemId: itemId, 
        xp: xp,
        timestamp: Date.now(),
        ...details
      });
      if (xp > 0) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
          xp: increment(xp)
        });
      }
    } catch (e) { console.error("Log error", e); }
  };

  const closeLessons = () => {
    setActiveLesson(null);
  };

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return (
        <div className="relative min-h-screen bg-slate-50">
           <button 
             onClick={() => setShowAuth(false)}
             className="absolute top-6 left-6 z-50 text-slate-400 hover:text-slate-900 font-bold text-sm flex items-center gap-2 transition-colors"
           >
             ← Regresar
           </button>
           <AuthView />
        </div>
      );
    }
    return <MarketingSite onLoginClick={() => setShowAuth(true)} />;
  }

  if (presentationLessonId || activeTab === 'presentation') {
    const lessonToPresent = lessons.find(l => l.id === presentationLessonId) || activeLesson || lessons[0];
    return (
      <div className="fixed inset-0 z-[5000] bg-slate-900 w-screen h-screen flex flex-col">
        <div 
            className="h-16 px-6 flex justify-between items-center shrink-0 border-b border-white/10"
            style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}
        >
            <div className="flex items-center gap-4">
                {activeOrg?.logoUrl ? (
                    <img src={activeOrg.logoUrl} alt="School Logo" className="h-10 object-contain bg-white rounded-lg p-1" />
                ) : (
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-xl">
                        {activeOrg ? activeOrg.name.charAt(0) : '🎓'}
                    </div>
                )}
                <span className="font-black text-white text-lg tracking-widest uppercase opacity-90">
                    {activeOrg ? activeOrg.name : 'Magister Global'} | CLASE EN VIVO
                </span>
            </div>
            
            <button 
              onClick={() => { setPresentationLessonId(null); setActiveTab('dashboard'); }} 
              className="bg-black/20 hover:bg-rose-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-colors shadow-inner border border-white/10"
            >
              Terminar Clase
            </button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-white">
            {lessonToPresent ? (
              <ClassView lesson={lessonToPresent} userData={userData} activeOrg={activeOrg} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Unidad No Encontrada</div>
            )}
        </div>
      </div>
    );
  }

  if (currentView === 'admin' && (userData?.role === 'admin' || userData?.role === 'org_admin')) {
      return (
          <div className="h-screen w-full relative">
              <AdminDashboardView user={{...user, ...userData}} activeOrg={activeOrg} />
              
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

  if (currentView === 'instructor' && (userData?.role === 'instructor' || userData?.role === 'admin' || userData?.role === 'org_admin')) {
    return (
      <InstructorDashboard 
        user={user} 
        userData={{ ...userData, classes: instructorClasses }} 
        allDecks={allDecks} 
        lessons={lessons} 
        curriculums={systemCurriculums} 
        onAssignCurriculum={handleAssignCurriculum} 
        onSaveLesson={handleSaveLesson} 
        onSaveCard={handleSaveCard}
        onAssign={handleAssign}
        onRevoke={handleRevoke}
        onCreateClass={handleCreateClass}
        onDeleteClass={handleDeleteClass}
        onRenameClass={handleRenameClass}
        onAddStudent={handleAddStudent}
        onStartPresentation={(lessonId: string) => setPresentationLessonId(lessonId)}
        onSwitchView={() => setCurrentView('student')}
        onLogout={() => signOut(auth)} 
      />
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col items-center relative font-sans overflow-hidden">
      
      {(userData?.role === 'instructor' || userData?.role === 'admin' || userData?.role === 'org_admin') && (
        <button 
          onClick={() => setCurrentView(userData?.role === 'instructor' ? 'instructor' : 'admin')} 
          className="fixed top-6 right-6 z-[1000] bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          {userData?.role === 'instructor' ? '🎓 Magister Command' : '🛡️ Command Center'}
        </button>
      )}

      <div className="w-full transition-all duration-700 bg-white relative overflow-hidden flex flex-col max-w-md h-[100dvh] shadow-2xl">
        <div className="flex-1 h-full overflow-hidden relative bg-slate-50">
          
          {activeLesson ? (
            (activeLesson.type === 'test' || activeLesson.type === 'exam' || activeLesson.contentType === 'test') ? (
              <ExamPlayerView 
                exam={activeLesson}
                onFinish={(examId: string, score: number, title: string, result: any) => {
                  if (examId) handleLogActivity(examId, score, title, { scoreDetail: result });
                  closeLessons();
                }}
              />
            ) : (activeLesson.contentType === 'deck' || activeLesson.cards) ? (
              <div className="h-full w-full bg-white relative z-50">
                 <FlashcardView 
                    allDecks={{ [activeLesson.id || 'temp']: activeLesson }}
                    selectedDeckKey={activeLesson.id || 'temp'}
                    onSelectDeck={closeLessons} 
                    onLogActivity={handleLogActivity}
                    userData={userData}
                    user={user}
                 />
              </div>
            ) : (
              <LessonView 
                lesson={activeLesson} 
                onFinish={() => {
                  handleLogActivity(activeLesson.id, activeLesson.xp || 50, activeLesson.title, { mode: 'lesson' });
                  closeLessons();
                }} 
                isInstructor={userData?.role === 'instructor'} 
              />
            )

          ) : activeStudentClass ? (
            <StudentClassView 
               classData={activeStudentClass} 
               lessons={lessons}
               curriculums={systemCurriculums}
               onBack={() => setActiveStudentClass(null)} 
               onSelectLesson={setActiveLesson}
               setActiveTab={setActiveTab}
               setSelectedLessonId={setPresentationLessonId}
               userData={userData}
            />

          ) : activeTab === 'discovery' ? (
            <DiscoveryView 
               allDecks={allDecks} 
               lessons={lessons} 
               user={user} 
               onSelectDeck={(deck: any) => { setActiveDeckKey(deck.id); setActiveTab('flashcards'); }} 
               onSelectLesson={setActiveLesson} 
               onLogActivity={handleLogActivity} 
               userData={userData} 
            />
          ) : activeTab === 'flashcards' ? (
            <FlashcardView 
               allDecks={allDecks}
               selectedDeckKey={activeDeckKey}
               onSelectDeck={(key: string | null) => {
                 setActiveDeckKey(key);
                 if (!key) setActiveTab('home');
               }}
               onLogActivity={handleLogActivity}
               onSaveCard={handleSaveCard}
               userData={userData}
               user={user}
            />
          ) : activeTab === 'profile' ? (
            <ProfileView 
               user={user} 
               userData={userData} 
            />
          ) : (
            <HomeView 
              setActiveTab={setActiveTab} 
              classes={enrolledClasses} 
              onSelectClass={setActiveStudentClass} 
              userData={userData} 
              user={user}
              activeOrg={activeOrg}
            />
          )}

        </div>
        
        {(!activeLesson && !activeStudentClass) && (
          <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} activeOrg={activeOrg} />
        )}
      </div>
    </div>
  );
}
export default App;
