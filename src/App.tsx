import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  updateDoc, 
  increment,
  writeBatch,
  deleteDoc,
  arrayUnion,
  query,
  where,
  collectionGroup,
  orderBy,
  limit
} from "firebase/firestore";
// FIX: Removed 'CardBuilderView' and 'LessonBuilderView' from this import list
import { 
  BookOpen, Layers, User, Home, Check, X, Zap, ChevronRight, Search, Volume2, 
  Puzzle, MessageSquare, GraduationCap, PlusCircle, Save, Feather, ChevronDown, 
  PlayCircle, Award, Trash2, Plus, FileText, Brain, Loader, LogOut, UploadCloud, 
  School, Users, Copy, List, ArrowRight, LayoutDashboard, ArrowLeft, Library, 
  Pencil, Image, Info, Edit3, FileJson, AlertTriangle, FlipVertical, GanttChart, 
  Club, AlignLeft, HelpCircle, Activity, Clock, CheckCircle2, Circle, ArrowDown,
  BarChart3, PenTool, UserPlus
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAjK79x_N5pSWzWluFUg25mqEc_HeraRPk",
  authDomain: "epic-latin.firebaseapp.com",
  projectId: "epic-latin",
  storageBucket: "epic-latin.firebasestorage.app",
  messagingSenderId: "321050459278",
  appId: "1:321050459278:web:df00b3cf5b8befb0d55ddf",
  measurementId: "G-KEWLZ67Z61"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'epic-latin-prod';

// --- DEFAULTS & SEED DATA ---
const DEFAULT_USER_DATA = { 
  name: "Student", // Was "Discipulus"
  targetLanguage: "English", // Was "Latin"
  level: "Beginner", // Was "Novice"
  streak: 1, 
  xp: 0, 
  role: 'student', 
  classes: [], 
  completedAssignments: [] 
};
const INITIAL_SYSTEM_DECKS: any = {
  greetings: {
    title: "👋 English Greetings",
    cards: [
      { id: 'g1', front: "How are you?", back: "A polite question about someone's health or mood.", type: "phrase", mastery: 0 },
      { id: 'g2', front: "Nice to meet you", back: "Used when meeting someone for the first time.", type: "phrase", mastery: 0 },
      { id: 'g3', front: "See you later", back: "A casual way to say goodbye.", type: "phrase", mastery: 0 }
    ]
  },
  phrasal_verbs: {
    title: "🏃 Phrasal Verbs",
    cards: [
      { id: 'pv1', front: "Give up", back: "To stop trying.", type: "verb", mastery: 0 },
      { id: 'pv2', front: "Run out", back: "To have none left.", type: "verb", mastery: 0 },
      { id: 'pv3', front: "Find out", back: "To discover information.", type: "verb", mastery: 0 },
      { id: 'pv4', front: "Bring up", back: "To mention a topic.", type: "verb", mastery: 0 }
    ]
  }
};
// --- XP & LEVELING LOGIC ---
const getLevelInfo = (xp: number) => {
  const baseXP = 100; // XP needed for first level up
  const level = Math.floor(xp / baseXP) + 1;
  const currentLevelXP = xp % baseXP;
  const nextLevelXP = baseXP;
  const progress = (currentLevelXP / nextLevelXP) * 100;
  
  // Latin Ranks based on Level
let rank = "Beginner";
  if (level >= 5) rank = "Elementary";
  if (level >= 10) rank = "Intermediate";
  if (level >= 20) rank = "Advanced";
  if (level >= 50) rank = "Native-like";

  return { level, currentLevelXP, nextLevelXP, progress, rank };
};

function LevelUpModal({ userData, onClose }: any) {
  const { level, currentLevelXP, nextLevelXP, progress, rank } = getLevelInfo(userData?.xp || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
        {/* Header Profile Section */}
        <div className="bg-gradient-to-br from-red-800 to-rose-900 p-6 text-white text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X /></button>
            <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-white p-1 rounded-full mb-3 shadow-lg">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                        {userData?.name?.charAt(0) || "U"}
                    </div>
                </div>
                <h2 className="text-2xl font-serif font-bold">{userData?.name}</h2>
                <div className="flex items-center gap-2 text-rose-200 text-xs font-bold uppercase tracking-widest mt-1">
                    <span>{userData?.role}</span>
                    <span>•</span>
                    <span>{userData?.email}</span>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold text-slate-800">Level {level}</span>
                    <span className="text-sm font-bold text-indigo-600">{rank}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>{currentLevelXP} XP</span>
                    <span>{nextLevelXP} XP (Next Lvl)</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><Zap size={18}/></div>
                    <div>
                        <p className="text-lg font-bold text-slate-800 leading-none">{userData?.streak || 1}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Day Streak</p>
                    </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm"><CheckCircle2 size={18}/></div>
                    <div>
                        <p className="text-lg font-bold text-slate-800 leading-none">{(userData?.completedAssignments || []).length}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Completed</p>
                    </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-indigo-500 shadow-sm"><School size={18}/></div>
                    <div>
                        <p className="text-lg font-bold text-slate-800 leading-none">{(userData?.classes || []).length}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Classes</p>
                    </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-purple-500 shadow-sm"><Award size={18}/></div>
                    <div>
                        <p className="text-lg font-bold text-slate-800 leading-none">{userData?.xp || 0}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total XP</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}


// FIND THIS AND REPLACE:
const INITIAL_SYSTEM_LESSONS: any[] = [
  {
    id: 'l1',
    title: "The Verb 'To Be'",
    subtitle: "Present Simple Tense",
    description: "Learn how to introduce yourself and others.",
    xp: 50,
    vocab: ['Am', 'Is', 'Are'],
    blocks: [
      { type: 'text', title: 'Introduction', content: 'In English, the verb "To Be" changes based on who you are talking about.' },
      { type: 'table', headers: ["Subject", "Verb Form"], rows: [ {c1: "I", c2: "am"}, {c1: "You/We/They", c2: "are"}, {c1: "He/She/It", c2: "is"} ] },
      { type: 'dialogue', lines: [ { speaker: "John", text: "Hello, I am John.", translation: "Greeting", side: "left" }, { speaker: "Sarah", text: "Hi John, I am Sarah.", translation: "Response", side: "right" } ] },
      { type: 'quiz', question: "Which is correct?", options: [{ id: 'a', text: "She are happy" }, { id: 'b', text: "She is happy" }, { id: 'c', text: "She am happy" }], correctId: 'b' }
    ]
  }
];

const TYPE_COLORS: any = {
  verb: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  noun: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  adverb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  phrase: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  adjective: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  idiom: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
};

// --- HELPER COMPONENTS ---
function Toast({ message, onClose }: any) {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-white/10">
      <Check size={16} className="text-emerald-400" /> <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
  );
}
function Navigation({ activeTab, setActiveTab }: any) {
  // ESL UPDATE: English Labels
  const tabs = [ 
    { id: 'home', icon: Home, label: 'Home' }, 
    { id: 'flashcards', icon: Layers, label: 'Practice' }, 
    { id: 'profile', icon: User, label: 'Profile' } 
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center space-y-1 transition-all duration-200 ${activeTab === tab.id ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}>
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} /> <span className="text-[10px] font-bold tracking-wide uppercase">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
function Header({ title, subtitle, rightAction, onClickTitle, sticky = true }: any) {
  return (
    <div className={`px-6 pt-12 pb-6 bg-white ${sticky ? 'sticky top-0' : ''} z-40 border-b border-slate-100 flex justify-between items-end`}>
        <div onClick={onClickTitle} className={onClickTitle ? "cursor-pointer active:opacity-60 transition-opacity" : ""}>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">{title} {onClickTitle && <ChevronDown size={20} className="text-slate-400" />}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
        {rightAction}
    </div>
  );
}

// ============================================================================
//  1. CORE VIEWS & GAMES
// ============================================================================

function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: any) => { e.preventDefault(); setError(''); setLoading(true); try { if (isLogin) await signInWithEmailAndPassword(auth, email, password); else { const uc = await createUserWithEmailAndPassword(auth, email, password); await setDoc(doc(db, 'artifacts', appId, 'users', uc.user.uid, 'profile', 'main'), { ...DEFAULT_USER_DATA, name: name || "User", email: email, role: role }); } } catch (err: any) { setError(err.message.replace('Firebase: ', '')); } finally { setLoading(false); } };

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-8"><div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-4 shadow-xl"><GraduationCap size={40} /></div><h1 className="text-3xl font-bold text-slate-900">LinguistFlow v3.0</h1></div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <><div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" required={!isLogin} /></div><div className="flex gap-3"><button type="button" onClick={() => setRole('student')} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${role === 'student' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Student</button><button type="button" onClick={() => setRole('instructor')} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${role === 'instructor' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Instructor</button></div></>}
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" required /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" required /></div>
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg">{loading ? <Loader className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}</button>
        </form>
        <div className="mt-6 text-center"><button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold text-sm hover:underline">{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button></div>
      </div>
    </div>
  );
}

function ProfileView({ user, userData }: any) {
  const [deploying, setDeploying] = useState(false);
  const handleLogout = () => signOut(auth);
  const deploySystemContent = async () => { setDeploying(true); const batch = writeBatch(db); Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); INITIAL_SYSTEM_LESSONS.forEach((lesson: any) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); try { await batch.commit(); alert("Deployed!"); } catch (e: any) { alert("Error: " + e.message); } setDeploying(false); };
  const toggleRole = async () => { if (!userData) return; const newRole = userData.role === 'instructor' ? 'student' : 'instructor'; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole }); };
  return (<div className="h-full flex flex-col bg-slate-50"><Header title="Ego" subtitle="Profile" /><div className="flex-1 px-6 mt-4"><div className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col items-center mb-6"><h2 className="text-2xl font-bold">{userData?.name}</h2><p className="text-sm text-slate-500">{user.email}</p><div className="mt-4 px-4 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase">{userData?.role}</div></div><div className="space-y-3"><button onClick={toggleRole} className="w-full bg-white p-4 rounded-xl border text-slate-700 font-bold mb-4 flex justify-between"><span>Switch Role</span><School size={20} /></button><button onClick={handleLogout} className="w-full bg-white p-4 rounded-xl border text-rose-600 font-bold mb-4 flex justify-between"><span>Sign Out</span><LogOut/></button><button onClick={deploySystemContent} disabled={deploying} className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold flex justify-between">{deploying ? <Loader className="animate-spin"/> : <UploadCloud/>}<span>Deploy Content</span></button></div></div></div>);
}

function LiveActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Live Student Activity</h2>
            <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">LIVE</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50" ref={scrollRef}>
            {logs.length === 0 && <div className="text-center text-slate-400 italic mt-10">No recent activity.</div>}
            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                        <div className={`p-2 rounded-full mt-1 ${log.type === 'quiz_score' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                           {log.type === 'quiz_score' ? <BarChart3 size={16}/> : <CheckCircle2 size={16}/>}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{log.studentName}</p>
                                    <p className="text-xs text-slate-500">
                                        {log.type === 'quiz_score' ? 'Quiz Result:' : 'Completed'} <span className="font-bold text-indigo-600">{log.itemTitle}</span>
                                    </p>
                                </div>
                                {log.scoreDetail && (
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-slate-800">{log.scoreDetail.score}/{log.scoreDetail.total}</span>
                                        <span className="block text-[10px] text-slate-400 font-bold">{Math.round((log.scoreDetail.score/log.scoreDetail.total)*100)}%</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 flex items-center gap-1"><Clock size={10}/> {new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="text-[10px] font-bold text-emerald-600">+{log.xp} XP</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

function MatchingGame({ deckCards, onGameEnd }: any) {
    const [terms, setTerms] = useState<any[]>([]);
    const [definitions, setDefinitions] = useState<any[]>([]);
    const [selectedTermIndex, setSelectedTermIndex] = useState<number | null>(null);
    const [selectedDefIndex, setSelectedDefIndex] = useState<number | null>(null);
    const [matchedIds, setMatchedIds] = useState<number[]>([]); 
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (deckCards.length < 3) return;
        const gameDeck = deckCards.slice(0, 6);
        const termCards = gameDeck.map((card: any, i: number) => ({ id: `term-${i}`, content: card.front, originalIndex: i, type: 'term' })).sort(() => Math.random() - 0.5);
        const defCards = gameDeck.map((card: any, i: number) => ({ id: `def-${i}`, content: card.back, originalIndex: i, type: 'def' })).sort(() => Math.random() - 0.5);
        setTerms(termCards); setDefinitions(defCards); setMatchedIds([]); setSelectedTermIndex(null); setSelectedDefIndex(null); setIsChecking(false);
    }, [deckCards]);

    const handleTermClick = (index: number) => {
        if (isChecking || matchedIds.includes(terms[index].originalIndex) || selectedTermIndex === index) return;
        setSelectedTermIndex(index);
        if (selectedDefIndex !== null) checkMatch(index, selectedDefIndex);
    };

    const handleDefClick = (index: number) => {
        if (isChecking || matchedIds.includes(definitions[index].originalIndex)) return;
        setSelectedDefIndex(index);
        if (selectedTermIndex !== null) checkMatch(selectedTermIndex, index);
    };

    const checkMatch = (tIndex: number, dIndex: number) => {
        setIsChecking(true);
        const term = terms[tIndex];
        const def = definitions[dIndex];
        if (term.originalIndex === def.originalIndex) {
            setMatchedIds(prev => [...prev, term.originalIndex]);
            setSelectedTermIndex(null);
            setSelectedDefIndex(null);
            setIsChecking(false);
            if (matchedIds.length + 1 === terms.length) setTimeout(() => onGameEnd(50), 500);
        } else {
            setTimeout(() => { setSelectedTermIndex(null); setSelectedDefIndex(null); setIsChecking(false); }, 1000);
        }
    };

    if (deckCards.length < 3) return <div className="p-6 text-center text-slate-500"><AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" /><p>Need at least 3 cards in this deck for the Matching Game!</p></div>;

    return (
        <div className="p-4 space-y-6 bg-slate-100 rounded-2xl h-full overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><GanttChart size={20} className="text-indigo-600" /> Matching</h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{matchedIds.length} / {terms.length} Pairs</span>
            </div>
            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">1. Reveal a Word</p>
                <div className="grid grid-cols-3 gap-3">
                    {terms.map((card, index) => {
                        const isMatched = matchedIds.includes(card.originalIndex);
                        const isSelected = selectedTermIndex === index;
                        return (
                            <button key={card.id} onClick={() => handleTermClick(index)} disabled={isMatched} className={`h-24 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${isMatched ? 'opacity-0 pointer-events-none' : isSelected ? 'bg-white border-indigo-500 shadow-lg transform scale-105' : 'bg-indigo-600 border-indigo-700 shadow-md hover:bg-indigo-700'}`}>
                                <div className="absolute inset-0 flex items-center justify-center p-1 text-center">{isSelected ? (<span className="text-slate-800 font-bold text-sm animate-in zoom-in">{card.content}</span>) : (<span className="text-indigo-300 font-black text-2xl">?</span>)}</div>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-300"></div><span className="flex-shrink-0 mx-4 text-slate-400"><ArrowDown size={16} /></span><div className="flex-grow border-t border-slate-300"></div></div>
            <div className="space-y-2 pb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">2. Select Definition</p>
                <div className="grid grid-cols-2 gap-3">
                    {definitions.map((card, index) => {
                        const isMatched = matchedIds.includes(card.originalIndex);
                        const isSelected = selectedDefIndex === index;
                        const isWrong = isChecking && isSelected && selectedTermIndex !== null && terms[selectedTermIndex].originalIndex !== card.originalIndex;
                        return (
                            <button key={card.id} onClick={() => handleDefClick(index)} disabled={isMatched} className={`p-3 min-h-[60px] rounded-xl border-2 text-sm font-medium transition-all duration-200 flex items-center justify-center text-center ${isMatched ? 'opacity-0 pointer-events-none' : isWrong ? 'bg-rose-50 border-rose-500 text-rose-700 animate-shake' : isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                                {card.content}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}



function QuizGame({ deckCards, onGameEnd }: any) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    useEffect(() => {
        if (deckCards.length < 4) return;
        const qList = Array.from({length: Math.min(10, deckCards.length)}).map((_, i) => {
            const target = deckCards[i % deckCards.length];
            const others = deckCards.filter((c: any) => c.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [...others, target].sort(() => 0.5 - Math.random());
            return { target, options, id: i };
        });
        setQuestions(qList);
    }, [deckCards]);

    const handleAnswer = (answerId: string) => {
        setSelectedAnswer(answerId);
        const correct = questions[currentIndex].target.id === answerId;
        if (correct) setScore(s => s + 1);
        
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(c => c + 1);
                setSelectedAnswer(null);
            } else {
                setIsComplete(true);
            }
        }, 1000);
    };

    if (deckCards.length < 4) return <div className="p-6 text-center text-slate-400">Need at least 4 cards for a Quiz.</div>;
    if (questions.length === 0) return <div className="p-6 text-center"><Loader className="animate-spin mx-auto"/></div>;

    if (isComplete) {
        return (
            <div className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={48}/>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Quiz Complete!</h2>
                <p className="text-lg text-slate-600 my-2">You scored {score} out of {questions.length}</p>
                <button onClick={() => onGameEnd({ score, total: questions.length })} className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Finish & Save</button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-400 uppercase text-xs">Question {currentIndex + 1}/{questions.length}</h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Score: {score}</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">What is <span className="text-indigo-600">"{currentQ.target.front}"</span>?</h2>
                <div className="grid gap-3">
                    {currentQ.options.map((opt: any) => {
                        const isSelected = selectedAnswer === opt.id;
                        const isCorrect = opt.id === currentQ.target.id;
                        let style = "bg-white border-slate-200 hover:bg-slate-50";
                        if (selectedAnswer) {
                            if (isCorrect) style = "bg-emerald-100 border-emerald-500 text-emerald-800";
                            else if (isSelected) style = "bg-rose-100 border-rose-500 text-rose-800";
                        }
                        return (
                            <button 
                                key={opt.id} 
                                disabled={!!selectedAnswer}
                                onClick={() => handleAnswer(opt.id)} 
                                className={`p-4 rounded-xl border-2 font-bold text-left transition-all ${style}`}
                            >
                                {opt.back}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onSaveCard, activeDeckOverride, onComplete }: any) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickAddData, setQuickAddData] = useState({ front: '', back: '', type: 'noun' });
  const [gameMode, setGameMode] = useState('study'); 
   
  const currentDeck = activeDeckOverride || allDecks[selectedDeckKey];
  const deckCards = currentDeck?.cards || [];
  const card = deckCards[currentIndex];
  const theme = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.noun) : TYPE_COLORS.noun;

  const handleDeckChange = (key: string) => { onSelectDeck(key); setIsSelectorOpen(false); setCurrentIndex(0); setIsFlipped(false); setXrayMode(false); setManageMode(false); setGameMode('study'); };
  const handleGameEnd = (data: any) => { 
      const xp = typeof data === 'number' ? data : (Math.round((data.score / data.total) * 50) + 10); 
      alert(`Complete! You earned ${xp} XP.`); 
      setGameMode('study'); 
      if (activeDeckOverride && onComplete) { 
          onComplete(activeDeckOverride.id, xp, currentDeck.title, data.score !== undefined ? data : null); 
      } 
  }
   
  const filteredCards = deckCards.filter((c: any) => (c.front || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.back || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const handleQuickAdd = (e: any) => { e.preventDefault(); if(!quickAddData.front || !quickAddData.back) return; onSaveCard({ ...quickAddData, deckId: selectedDeckKey, ipa: "/.../", mastery: 0, morphology: [{ part: quickAddData.front, meaning: "Custom", type: "root" }], usage: { sentence: "-", translation: "-" }, grammar_tags: ["Quick Add"] }); setQuickAddData({ front: '', back: '', type: 'noun' }); setSearchTerm(''); alert("Card Added!"); };

  if (!card && !manageMode) return <div className="h-full flex flex-col bg-slate-50"><Header title={currentDeck?.title || "Empty Deck"} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<button onClick={() => setManageMode(true)} className="p-2 bg-slate-100 rounded-full"><List size={20} className="text-slate-600" /></button>} /><div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400"><Layers size={48} className="mb-4 opacity-20" /><p>This deck is empty.</p><button onClick={() => setManageMode(true)} className="mt-4 text-indigo-600 font-bold text-sm">Add Cards</button></div></div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 pb-6 relative overflow-hidden">
      <Header title={currentDeck?.title.split(' ')[1] || "Deck"} subtitle={`${currentIndex + 1} / ${deckCards.length}`} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<div className="flex items-center gap-2">{activeDeckOverride && onComplete && (<button onClick={() => onComplete(activeDeckOverride.id, 50, currentDeck.title)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"><Check size={14}/> Complete</button>)}<button onClick={() => setManageMode(!manageMode)} className={`p-2 rounded-full transition-colors ${manageMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{manageMode ? <X size={20} /> : <List size={20} />}</button></div>} />
      {isSelectorOpen && <div className="absolute top-24 left-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-4">{Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => handleDeckChange(key)} className={`w-full text-left p-3 rounded-xl font-bold text-sm mb-1 ${selectedDeckKey === key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>{deck.title} <span className="float-right opacity-50">{deck.cards.length}</span></button>))}</div>}
      {isSelectorOpen && <div className="absolute inset-0 z-40 bg-black/5 backdrop-blur-[1px]" onClick={() => setIsSelectorOpen(false)} />}
      
      {/* UPDATED: Removed VocabJack Button from this list */}
      {!manageMode && (<div className="px-6 mt-2 mb-2"><div className="flex bg-slate-200 p-1 rounded-xl w-full max-w-sm mx-auto overflow-x-auto"><button onClick={() => setGameMode('study')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg whitespace-nowrap ${gameMode === 'study' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Study</button><button onClick={() => setGameMode('quiz')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg whitespace-nowrap ${gameMode === 'quiz' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Quiz</button><button onClick={() => setGameMode('match')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg whitespace-nowrap ${gameMode === 'match' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Match</button></div></div>)}
      
      <div className="flex-1 overflow-y-auto pt-4">
        {manageMode ? (
            <div className="p-6">
                 <h3 className="font-bold text-slate-900 mb-4">Deck Manager</h3>
                 <div className="relative mb-6"><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`Search ${deckCards.length} cards...`} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm" /></div>
                 {selectedDeckKey === 'custom' && (<div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-6"><h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2"><PlusCircle size={14}/> Quick Add</h4><div className="flex gap-2 mb-2"><input placeholder="Latin Word" value={quickAddData.front} onChange={(e) => setQuickAddData({...quickAddData, front: e.target.value})} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-sm font-bold" /><select value={quickAddData.type} onChange={(e) => setQuickAddData({...quickAddData, type: e.target.value})} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs"><option value="noun">Noun</option><option value="verb">Verb</option><option value="phrase">Phrase</option></select></div><div className="flex gap-2"><input placeholder="English Meaning" value={quickAddData.back} onChange={(e) => setQuickAddData({...quickAddData, back: e.target.value})} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-sm" /><button onClick={handleQuickAdd} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={18}/></button></div></div>)}
                 <div className="space-y-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cards in Deck</p>{filteredCards.map((c: any, idx: number) => (<button key={idx} onClick={() => { setCurrentIndex(deckCards.indexOf(c)); setManageMode(false); }} className="w-full bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center hover:border-indigo-300 transition-colors text-left"><div><span className="font-bold text-slate-800">{c.front}</span><span className="text-slate-400 mx-2">•</span><span className="text-sm text-slate-500">{c.back}</span></div><ArrowRight size={16} className="text-slate-300" /></button>))}{filteredCards.length === 0 && <p className="text-slate-400 text-sm italic">No cards found.</p>}</div>
            </div>
        ) : (
            <>
            {gameMode === 'match' && <MatchingGame deckCards={deckCards} onGameEnd={handleGameEnd} />}
            {/* UPDATED: Removed VocabJack component here */}
            {gameMode === 'quiz' && <QuizGame deckCards={deckCards} onGameEnd={handleGameEnd} />}
            {gameMode === 'study' && card && (
                  <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 perspective-1000 relative z-0">
                      <div className={`relative w-full h-full max-h-[520px] transition-all duration-500 transform preserve-3d cursor-pointer shadow-2xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => !xrayMode && setIsFlipped(!isFlipped)}>
                          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                            <div className={`h-2 w-full ${xrayMode ? theme.bg.replace('50', '500') : 'bg-slate-100'} transition-colors duration-500`} />
                            <div className="flex-1 flex flex-col p-6 relative">
                              <div className="flex justify-between items-start mb-8"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>{card.type}</span></div>
                              <div className="flex-1 flex flex-col items-center justify-center mt-[-40px]"><h2 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 text-center mb-4 leading-tight">{card.front}</h2><div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100"><button onClick={(e) => { e.stopPropagation(); }} className="p-2 bg-white rounded-full shadow-sm text-indigo-600 hover:scale-110 transition-transform active:scale-90"><Volume2 size={18} /></button><span className="font-mono text-slate-500 text-sm tracking-wide">{card.ipa}</span></div></div>
                              <div className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 transition-all duration-500 ease-in-out flex flex-col overflow-hidden z-20 ${xrayMode ? 'h-[75%] opacity-100 rounded-t-3xl shadow-[-10px_-10px_30px_rgba(0,0,0,0.05)]' : 'h-0 opacity-0'}`}>
                                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                  <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Puzzle size={14} /> Morphologia</h4><div className="flex flex-wrap gap-2">{Array.isArray(card.morphology) && card.morphology.map((m: any, i: number) => (<div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[60px]"><span className={`font-bold text-lg ${m.type === 'root' ? 'text-indigo-600' : 'text-slate-700'}`}>{m.part}</span><span className="text-slate-400 text-[9px] font-medium uppercase mt-1 text-center max-w-[80px] leading-tight">{m.meaning}</span></div>))}</div></div>
                                  <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare size={14} /> Exemplum</h4><div className={`p-4 rounded-xl border ${theme.border} ${theme.bg}`}><p className="text-slate-800 font-serif font-medium text-lg mb-1">"{card.usage?.sentence || '...'}"</p><p className={`text-sm ${theme.text} opacity-80 italic`}>{card.usage?.translation || '...'}</p></div></div>
                                </div>
                              </div>
                              {!xrayMode && (<div className="mt-auto text-center"><p className="text-xs text-slate-400 font-medium animate-pulse">Tap to flip</p></div>)}
                            </div>
                          </div>
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-white relative overflow-hidden"><div className="relative z-10 flex flex-col items-center"><span className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border-b border-indigo-500/30 pb-2">Translatio</span><h2 className="text-4xl font-bold text-center mb-8 leading-tight">{card.back}</h2></div></div>
                      </div>
                  </div>
            )}
            </>
        )}
      </div>
      {gameMode === 'study' && !manageMode && card && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <button onClick={() => { setXrayMode(false); setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + deckCards.length) % deckCards.length), 200); }} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><X size={28} strokeWidth={2.5} /></button>
            <button onClick={(e) => { e.stopPropagation(); if(isFlipped) setIsFlipped(false); setXrayMode(!xrayMode); }} className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 border-2 ${xrayMode ? 'bg-indigo-600 border-indigo-600 text-white translate-y-[-8px] shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}><Search size={28} strokeWidth={xrayMode ? 3 : 2} className={xrayMode ? 'animate-pulse' : ''} /><span className="text-[10px] font-black tracking-wider mt-1">X-RAY</span></button>
            <button onClick={() => { setXrayMode(false); setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % deckCards.length), 200); }} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-emerald-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Check size={28} strokeWidth={2.5} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. STUDENT VIEWS (Defined AFTER Flashcard/Quiz/Games) ---

function LessonView({ lesson, onFinish }: any) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<any>({});
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentBlockIndex]);

  const handleNext = () => { if (currentBlockIndex < (lesson.blocks?.length || 0) - 1) { setCurrentBlockIndex(prev => prev + 1); } else { setIsComplete(true); } };
  const handleQuizOption = (blockIdx: number, optionId: string) => { setQuizAnswers({ ...quizAnswers, [blockIdx]: optionId }); };

  return (
    <div className="h-full flex flex-col bg-white">
      <Header title={lesson.title} subtitle={lesson.subtitle} rightAction={<button onClick={() => onFinish(lesson.id, 0, lesson.title)} className="text-slate-400 hover:text-rose-500"><X /></button>}/>
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center animate-in fade-in slide-in-from-bottom-4"><h2 className="text-2xl font-serif font-bold text-indigo-900 mb-2">{lesson.title}</h2><p className="text-indigo-800 opacity-80">{lesson.description}</p></div>
        {lesson.blocks?.slice(0, currentBlockIndex + 1).map((block: any, idx: number) => (
          <div key={idx} className="animate-in slide-in-from-bottom-8 fade-in duration-500">
            {block.type === 'text' && (<div className="prose prose-slate max-w-none"><h3 className="font-bold text-lg text-slate-800">{block.title}</h3><p className="text-slate-600 leading-relaxed">{block.content}</p></div>)}
            {block.type === 'dialogue' && (<div className="space-y-4 my-4">{block.lines.map((line: any, i: number) => (<div key={i} className={`flex flex-col ${line.side === 'right' || line.speaker === 'B' ? 'items-end' : 'items-start'}`}><span className="text-xs font-bold text-slate-400 uppercase mb-1">{line.speaker}</span><div className={`p-4 rounded-2xl max-w-[80%] ${line.side === 'right' || line.speaker === 'B' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}><p className="font-serif text-lg">{line.text}</p><p className={`text-xs mt-1 italic ${line.side === 'right' || line.speaker === 'B' ? 'text-indigo-200' : 'text-slate-500'}`}>{line.translation}</p></div></div>))}</div>)}
            {block.type === 'quiz' && (<div className="bg-white border-2 border-indigo-100 p-5 rounded-2xl shadow-sm"><p className="font-bold text-slate-800 mb-4 flex items-center gap-2"><HelpCircle className="text-indigo-500" size={20}/> {block.question}</p><div className="space-y-2">{block.options.map((opt: any) => { const isSelected = quizAnswers[idx] === opt.id; const isCorrect = opt.id === block.correctId; const showResult = !!quizAnswers[idx]; let style = "bg-slate-50 border-slate-200 hover:bg-slate-100"; if (showResult && isSelected && isCorrect) style = "bg-emerald-100 border-emerald-500 text-emerald-800 font-bold"; if (showResult && isSelected && !isCorrect) style = "bg-rose-100 border-rose-500 text-rose-800"; if (showResult && !isSelected && isCorrect) style = "bg-emerald-50 border-emerald-200 text-emerald-800"; return (<button key={opt.id} disabled={showResult} onClick={() => handleQuizOption(idx, opt.id)} className={`w-full p-3 rounded-xl border text-left transition-all ${style}`}>{opt.text}</button>); })}</div></div>)}
            {block.type === 'vocab-list' && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{block.items.map((item: any, i:number) => (<div key={i} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center"><span className="font-bold text-slate-800">{item.term}</span><span className="text-slate-500 text-sm">{item.definition}</span></div>))}</div>)}
            {block.type === 'image' && (<div className="rounded-xl overflow-hidden shadow-sm border border-slate-200"><img src={block.url} alt="Lesson illustration" className="w-full h-auto object-cover" />{block.caption && <div className="p-2 bg-slate-50 text-xs text-center text-slate-500 italic">{block.caption}</div>}</div>)}
          </div>
        ))}
        <div ref={bottomRef} className="pt-8">{!isComplete ? (<button onClick={handleNext} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"><span>Continue</span> <ChevronDown /></button>) : (<button onClick={() => onFinish(lesson.id, lesson.xp || 50, lesson.title)} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-600 active:scale-95 transition-all animate-bounce">Complete Lesson (+{lesson.xp || 50} XP)</button>)}</div>
      </div>
    </div>
  );
}

function StudentClassView({ classData, onBack, onSelectLesson, onSelectDeck, userData }: any) {
  const completedSet = new Set(userData?.completedAssignments || []);
  const handleAssignmentClick = (assignment: any) => { if (assignment.contentType === 'deck') { onSelectDeck(assignment); } else { onSelectLesson(assignment); } };
  const relevantAssignments = (classData.assignments || []).filter((l: any) => { const isForMe = !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); return isForMe; });
  const pendingCount = relevantAssignments.filter((l: any) => !completedSet.has(l.id)).length;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-6 pt-12 pb-6 bg-white sticky top-0 z-40 border-b border-slate-100"><button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Back to Home</button><h1 className="text-2xl font-bold text-slate-900">{classData.name}</h1><p className="text-sm text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">Code: {classData.code}</p></div>
      <div className="flex-1 px-6 mt-4 overflow-y-auto pb-24"><div className="space-y-6"><div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg"><h3 className="text-lg font-bold mb-1">Your Progress</h3><p className="text-indigo-200 text-sm">Keep up the great work!</p><div className="mt-4 flex gap-4"><div><span className="text-2xl font-bold block">{pendingCount}</span><span className="text-xs opacity-70">To Do</span></div><div><span className="text-2xl font-bold block">{classData.students?.length || 0}</span><span className="text-xs opacity-70">Classmates</span></div></div></div><div><h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3><div className="space-y-3">{relevantAssignments.length > 0 ? ( relevantAssignments.filter((l: any) => !completedSet.has(l.id)).map((l: any, i: number) => ( <button key={`${l.id}-${i}`} onClick={() => handleAssignmentClick(l)} className="w-full bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"><div className="flex items-center space-x-4"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>{l.contentType === 'deck' ? <Layers size={20}/> : <PlayCircle size={20} />}</div><div className="text-left"><h4 className="font-bold text-indigo-900">{l.title}</h4><p className="text-xs text-indigo-600/70">{l.contentType === 'deck' ? 'Flashcard Deck' : 'Assigned Lesson'}</p></div></div><ChevronRight size={20} className="text-slate-300" /></button> )) ) : ( <div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl">No pending assignments.</div> )}{relevantAssignments.every((l: any) => completedSet.has(l.id)) && relevantAssignments.length > 0 && (<div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl">All assignments completed! 🎉</div>)}</div></div></div></div>
    </div>
  );
}

function HomeView({ setActiveTab, lessons, onSelectLesson, userData, assignments, classes, onSelectClass, onSelectDeck }: any) {
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const completedSet = new Set(userData?.completedAssignments || []);
  const relevantAssignments = (assignments || []).filter((l: any) => { return !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); });
  const activeAssignments = relevantAssignments.filter((l: any) => !completedSet.has(l.id));
  const handleSelectClass = (cls: any) => { setActiveStudentClass(cls); };
  
  // Calculate Level Data for the Widget
  const { level, progress, rank } = getLevelInfo(userData?.xp || 0);

  if (activeStudentClass) { return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={onSelectLesson} onSelectDeck={onSelectDeck} userData={userData} />; }

  return (
  <div className="pb-24 animate-in fade-in duration-500 overflow-y-auto h-full relative">
    {/* --- LEVEL UP MODAL (Updated Prop) --- */}
    {showLevelModal && <LevelUpModal userData={userData} onClose={() => setShowLevelModal(false)} />}

    {userData?.classSyncError && (<div className="bg-rose-500 text-white p-4 text-center text-sm font-bold"><AlertTriangle className="inline-block mr-2" size={16} />System Notice: Database Index Missing.<br/><span className="text-xs font-normal opacity-80">Instructors: Check console for the Firebase setup link.</span></div>)}
    
    {/* --- DELETED: Header Component was here --- */}
    
    <div className="px-6 space-y-6 mt-8"> {/* Increased top margin since header is gone */}
      
      {/* --- INTERACTIVE RED WIDGET (Updated Layout) --- */}
      <button 
        onClick={() => setShowLevelModal(true)}
        className="w-full text-left bg-gradient-to-br from-red-800 to-rose-900 rounded-3xl p-6 text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <User size={140} />
        </div>
        
        {/* Top Row: Avatar and Name */}
        <div className="flex items-center gap-4 relative z-10 mb-6">
             <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner">
                <span className="font-bold text-2xl">{userData?.name?.charAt(0) || 'S'}</span>
             </div>
             <div>
                <p className="text-rose-200 text-xs font-bold uppercase tracking-widest mb-1">Welcome back,</p>
                <h3 className="text-3xl font-serif font-bold leading-none">{userData?.name || 'Student'}</h3>
             </div>
        </div>

        {/* Bottom Row: Level and Stats */}
        <div className="flex justify-between items-end relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-rose-950/50 px-3 py-1 rounded-lg text-xs font-bold text-rose-100 border border-white/10">{rank}</span>
                    <span className="text-sm font-bold">Lvl {level}</span>
                </div>
                <div className="w-32 bg-black/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-yellow-400 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${progress}%` }}/>
                </div>
            </div>

            <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-400 mb-0.5 justify-end">
                    <Zap size={20} fill="currentColor" />
                    <span className="font-bold text-xl">{userData?.streak || 1}</span>
                </div>
                <span className="text-[10px] text-rose-200 uppercase font-bold tracking-wide">Day Streak</span>
            </div>
        </div>
      </button>

      {/* ... Rest of the HomeView components (Classes, Assignments, etc.) remain the same ... */}


      {/* CLASSES SCROLLER */}
      {classes && classes.length > 0 && (<div className="mb-6"><h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><School size={18} className="text-indigo-600"/> My Classes</h3><div className="flex gap-4 overflow-x-auto pb-4">{classes.map((cls: any) => { const clsPendingCount = (cls.assignments || []).filter((l: any) => { const isForMe = !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); return isForMe && !completedSet.has(l.id); }).length; return ( <button key={cls.id} onClick={() => handleSelectClass(cls)} className="min-w-[200px] bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left active:scale-95 transition-transform"><div className="flex items-center justify-between mb-2"><div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">{cls.name.charAt(0)}</div><span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">{cls.code}</span></div><h4 className="font-bold text-slate-900">{cls.name}</h4><p className="text-xs text-slate-500 mt-1">{clsPendingCount} Pending Tasks</p></button> ); })}</div></div>)}
      
      {/* ASSIGNMENTS LIST */}
      {activeAssignments.length > 0 && (<div><h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3><div className="space-y-3">{activeAssignments.map((l: any, i: number) => ( <button key={`${l.id}-${i}`} onClick={() => l.contentType === 'deck' ? onSelectDeck(l) : onSelectLesson(l)} className="w-full bg-indigo-50 border border-indigo-100 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"><div className="flex items-center space-x-4"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600' : 'bg-white text-indigo-600'}`}>{l.contentType === 'deck' ? <Layers size={20}/> : <PlayCircle size={20} />}</div><div className="text-left"><h4 className="font-bold text-indigo-900">{l.title}</h4><p className="text-xs text-indigo-600/70">{l.contentType === 'deck' ? 'Flashcard Deck' : 'Assigned Lesson'}</p></div></div><ChevronRight size={20} className="text-indigo-300" /></button>))}</div></div>)}
      
      {/* STANDARD LIBRARY */}
      <div><h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Lessons</h3><div className="space-y-3">{lessons.map((l: any) => (<button key={l.id} onClick={() => onSelectLesson(l)} className="w-full bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-14 w-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700"><PlayCircle size={28}/></div><div className="text-left"><h4 className="font-bold text-slate-900">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div></div><ChevronRight className="text-slate-300"/></button>))}</div></div>
      
      {/* QUICK ACTIONS */}
<div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('flashcards')} className="...">
            <Layers className="mx-auto text-orange-500 mb-2"/>
            <span className="block font-bold text-slate-800">Practice</span> {/* Was Repetitio */}
        </button>
        <button onClick={() => setActiveTab('create')} className="...">
            <Feather className="mx-auto text-emerald-500 mb-2"/>
            <span className="block font-bold text-slate-800">Creator</span> {/* Was Scriptorium */}
        </button>
    </div>
    </div>
  </div>
  );
}
// ============================================================================
//  PASTE THIS BLOCK *ABOVE* THE 'BuilderHub' FUNCTION
// ============================================================================

function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId, initialData, onCancelEdit }: any) {
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Hydrate form if editing
  useEffect(() => { 
      if (initialData) {
          setEditingId(initialData.id);
          setFormData({ 
            front: initialData.front, back: initialData.back, type: initialData.type || 'noun', 
            ipa: initialData.ipa || '', sentence: initialData.usage?.sentence || '', 
            sentenceTrans: initialData.usage?.translation || '', 
            grammarTags: initialData.grammar_tags?.join(', ') || '', 
            deckId: initialData.deckId || initialDeckId || 'custom' 
          });
          setMorphology(initialData.morphology || []);
      }
  }, [initialData, initialDeckId]);

  const handleChange = (e: any) => { if (e.target.name === 'deckId') { if (e.target.value === 'new') { setIsCreatingDeck(true); setFormData({ ...formData, deckId: 'new' }); } else { setIsCreatingDeck(false); setFormData({ ...formData, deckId: e.target.value }); } } else { setFormData({ ...formData, [e.target.name]: e.target.value }); } };
  const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
  const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };
  
  const handleClear = () => { 
      setEditingId(null); 
      setFormData(prev => ({ ...prev, front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '' })); 
      setMorphology([]);
      if (onCancelEdit) onCancelEdit();
  };

  const handleSubmit = (e: any) => { e.preventDefault(); if (!formData.front || !formData.back) return; let finalDeckId = formData.deckId; let finalDeckTitle = null; if (formData.deckId === 'new') { if (!newDeckTitle) return alert("Please name your new deck."); finalDeckId = `custom_${Date.now()}`; finalDeckTitle = newDeckTitle; } const cardData = { front: formData.front, back: formData.back, type: formData.type, deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "/.../", mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] }; if (editingId) { onUpdateCard(editingId, cardData); setToastMsg("Card Updated Successfully"); } else { onSaveCard(cardData); setToastMsg("Card Created Successfully"); } handleClear(); if (isCreatingDeck) { setIsCreatingDeck(false); setNewDeckTitle(''); setFormData(prev => ({ ...prev, deckId: finalDeckId })); } };
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title }));

  return (
    <div className="px-6 mt-4 space-y-6 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center"><div><p className="font-bold flex items-center gap-2"><Layers size={16}/> {editingId ? 'Editing Card' : 'Card Creator'}</p><p className="opacity-80 text-xs mt-1">{editingId ? 'Update details below.' : 'Define deep linguistic data (X-Ray).'}</p></div>{editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}</div>
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Core Data</h3>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Target Deck</label><select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-3 rounded-lg border border-slate-200 bg-indigo-50/50 font-bold text-indigo-900 disabled:opacity-50"><option value="custom">✍️ Scriptorium (My Deck)</option>{deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}<option value="new">✨ + Create New Deck</option></select>{isCreatingDeck && <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter New Deck Name" className="w-full p-3 rounded-lg border-2 border-indigo-500 bg-white font-bold mt-2 animate-in fade-in slide-in-from-top-2" autoFocus />}</div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Latin Word</label><input name="front" value={formData.front} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="e.g. Bellum" /></div><div className="space-y-2"><label className="text-xs font-bold text-slate-400">English</label><input name="back" value={formData.back} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="e.g. War" /></div></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Part of Speech</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 bg-white"><option value="noun">Noun</option><option value="verb">Verb</option><option value="adjective">Adjective</option><option value="adverb">Adverb</option><option value="phrase">Phrase</option></select></div><div className="space-y-2"><label className="text-xs font-bold text-slate-400">IPA</label><input name="ipa" value={formData.ipa} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-mono text-sm" placeholder="/ˈbel.lum/" /></div></div>
      </section>
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Morphology (X-Ray Data)</h3>
        <div className="flex gap-2 items-end"><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Part</label><input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="Bell-" /></div><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Meaning</label><input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="War" /></div><div className="w-24 space-y-1"><label className="text-[10px] font-bold text-slate-400">Type</label><select value={newMorphPart.type} onChange={(e) => setNewMorphPart({...newMorphPart, type: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white"><option value="root">Root</option><option value="prefix">Prefix</option><option value="suffix">Suffix</option></select></div><button type="button" onClick={addMorphology} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200"><Plus size={20}/></button></div>
        <div className="flex flex-wrap gap-2 mt-2">{morphology.map((m, i) => (<div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm"><span className="font-bold text-indigo-700">{m.part}</span><span className="text-slate-500 text-xs">({m.meaning})</span><button type="button" onClick={() => removeMorphology(i)} className="text-slate-300 hover:text-rose-500"><X size={14}/></button></div>))}</div>
      </section>
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Context & Grammar</h3>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Example Sentence</label><input name="sentence" value={formData.sentence} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 italic" placeholder="Si vis pacem, para bellum." /></div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Translation</label><input name="sentenceTrans" value={formData.sentenceTrans} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="If you want peace, prepare for war." /></div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Grammar Tags</label><input name="grammarTags" value={formData.grammarTags} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="2nd Declension, Neuter" /></div>
      </section>
      <button onClick={handleSubmit} className={`w-full text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingId ? <><Save size={20}/> Update Card</> : <><Plus size={20}/> Create Card</>}</button>
    </div>
  );
}

function LessonBuilderView({ data, setData, onSave, availableDecks }: any) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const updateBlock = (index: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[index] = { ...newBlocks[index], [field]: value }; setData({ ...data, blocks: newBlocks }); };
  const updateDialogueLine = (blockIndex: number, lineIndex: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[blockIndex].lines[lineIndex][field] = value; setData({ ...data, blocks: newBlocks }); };
  const updateVocabItem = (blockIndex: number, itemIndex: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[blockIndex].items[itemIndex][field] = value; setData({ ...data, blocks: newBlocks }); };
  const addBlock = (type: string) => { const baseBlock = type === 'dialogue' ? { type: 'dialogue', lines: [{ speaker: 'A', text: '', translation: '', side: 'left' }] } : type === 'quiz' ? { type: 'quiz', question: '', options: [{id:'a',text:''},{id:'b',text:''}], correctId: 'a' } : type === 'vocab-list' ? { type: 'vocab-list', items: [{ term: '', definition: '' }] } : type === 'flashcard' ? { type: 'flashcard', front: '', back: '' } : type === 'image' ? { type: 'image', url: '', caption: '' } : type === 'note' ? { type: 'note', title: '', content: '' } : { type: 'text', title: '', content: '' }; setData({ ...data, blocks: [...(data.blocks || []), baseBlock] }); };
  const removeBlock = (index: number) => { const newBlocks = [...(data.blocks || [])].filter((_, i) => i !== index); setData({ ...data, blocks: newBlocks }); };
  const handleSave = () => { if (!data.title) return alert("Title required"); const processedVocab = Array.isArray(data.vocab) ? data.vocab : (typeof data.vocab === 'string' ? data.vocab.split(',').map((s: string) => s.trim()) : []); onSave({ ...data, vocab: processedVocab, xp: 100 }); setToastMsg("Lesson Saved Successfully"); };
  const deckOptions = availableDecks ? Object.entries(availableDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })) : [];

  return (
    <div className="px-6 mt-4 space-y-8 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> Lesson Metadata</h3><input className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} /><textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Description" value={data.description} onChange={e => setData({...data, description: e.target.value})} /><input className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Vocab (comma separated)" value={data.vocab} onChange={e => setData({...data, vocab: e.target.value})} /><div className="mt-2"><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Linked Flashcard Deck</label><select className="w-full p-3 rounded-lg border border-slate-200 bg-white" value={data.relatedDeckId || ''} onChange={e => setData({...data, relatedDeckId: e.target.value})}><option value="">None (No Deck)</option>{deckOptions.map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}</select></div></section>
      <div className="space-y-4"><div className="flex items-center justify-between px-1"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Content Blocks</h3><span className="text-xs text-slate-400">{(data.blocks || []).length} Blocks</span></div>
        {(data.blocks || []).map((block: any, idx: number) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group"><div className="absolute right-4 top-4 flex gap-2"><span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded">{block.type}</span><button onClick={() => removeBlock(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div>
            {block.type === 'text' && (<div className="space-y-3 mt-4"><input className="w-full p-2 border-b border-slate-100 font-bold text-sm focus:outline-none" placeholder="Section Title" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} /><textarea className="w-full p-2 bg-slate-50 rounded-lg text-sm min-h-[80px]" placeholder="Content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} /></div>)}
            {block.type === 'note' && (<div className="space-y-3 mt-4"><div className="flex gap-2"><Info size={18} className="text-amber-500"/><input className="flex-1 p-2 border-b border-slate-100 font-bold text-sm focus:outline-none" placeholder="Note Title (e.g. Grammar Tip)" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} /></div><textarea className="w-full p-2 bg-amber-50 border border-amber-100 rounded-lg text-sm min-h-[80px] text-amber-800" placeholder="Tip content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} /></div>)}
            {block.type === 'image' && (<div className="space-y-3 mt-4"><div className="flex gap-2 items-center"><Image size={18} className="text-slate-400"/><input className="flex-1 p-2 border-b border-slate-100 text-sm" placeholder="Image URL (e.g., https://placehold.co/400x200)" value={block.url} onChange={e => updateBlock(idx, 'url', e.target.value)} /></div><input className="w-full p-2 bg-slate-50 rounded-lg text-sm" placeholder="Caption" value={block.caption} onChange={e => updateBlock(idx, 'caption', e.target.value)} /></div>)}
            {block.type === 'vocab-list' && (<div className="space-y-3 mt-6"><p className="text-xs font-bold text-slate-400 uppercase">Vocabulary List</p>{block.items.map((item: any, i: number) => (<div key={i} className="flex gap-2"><input className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-sm font-bold" placeholder="Term" value={item.term} onChange={e => updateVocabItem(idx, i, 'term', e.target.value)} /><input className="flex-1 p-2 border-b border-slate-100 text-sm" placeholder="Definition" value={item.definition} onChange={e => updateVocabItem(idx, i, 'definition', e.target.value)} /></div>))}<button onClick={() => { const newItems = [...block.items, { term: '', definition: '' }]; updateBlock(idx, 'items', newItems); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Term</button></div>)}
            {block.type === 'flashcard' && (<div className="space-y-3 mt-4"><div className="flex gap-2"><FlipVertical size={18} className="text-indigo-500"/><span className="text-sm font-bold text-slate-700">Embedded Flashcard</span></div><input className="w-full p-2 border rounded text-sm font-bold" placeholder="Front (Latin)" value={block.front} onChange={e => updateBlock(idx, 'front', e.target.value)} /><input className="w-full p-2 border rounded text-sm" placeholder="Back (English)" value={block.back} onChange={e => updateBlock(idx, 'back', e.target.value)} /></div>)}
            {block.type === 'dialogue' && (<div className="space-y-3 mt-6">{block.lines.map((line: any, lIdx: number) => (<div key={lIdx} className="flex gap-2 text-sm"><input className="w-16 p-1 bg-slate-50 rounded border border-slate-100 text-xs font-bold" placeholder="Speaker" value={line.speaker} onChange={e => updateDialogueLine(idx, lIdx, 'speaker', e.target.value)} /><div className="flex-1 space-y-1"><input className="w-full p-1 border-b border-slate-100" placeholder="Latin" value={line.text} onChange={e => updateDialogueLine(idx, lIdx, 'text', e.target.value)} /><input className="w-full p-1 text-xs text-slate-500 italic" placeholder="English" value={line.translation} onChange={e => updateDialogueLine(idx, lIdx, 'translation', e.target.value)} /></div></div>))}<button onClick={() => { const newLines = [...block.lines, { speaker: 'B', text: '', translation: '', side: 'right' }]; updateBlock(idx, 'lines', newLines); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Line</button></div>)}
            {block.type === 'quiz' && (<div className="space-y-3 mt-4"><input className="w-full p-2 bg-slate-50 rounded-lg font-bold text-sm" placeholder="Question" value={block.question} onChange={e => updateBlock(idx, 'question', e.target.value)} /><div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Options (ID, Text)</p>{block.options.map((opt: any, oIdx: number) => (<div key={oIdx} className="flex gap-2"><input className="w-8 p-1 bg-slate-50 text-center text-xs" value={opt.id} readOnly /><input className="flex-1 p-1 border-b border-slate-100 text-sm" value={opt.text} onChange={(e) => { const newOpts = [...block.options]; newOpts[oIdx].text = e.target.value; updateBlock(idx, 'options', newOpts); }} /></div>))}</div><div className="flex items-center gap-2 text-sm mt-2"><span className="text-slate-500">Correct ID:</span><input className="w-10 p-1 bg-green-50 border border-green-200 rounded text-center font-bold text-green-700" value={block.correctId} onChange={e => updateBlock(idx, 'correctId', e.target.value)} /></div></div>)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2"><button onClick={() => addBlock('text')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><AlignLeft size={20}/> <span className="text-[10px] font-bold">Text</span></button><button onClick={() => addBlock('dialogue')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><MessageSquare size={20}/> <span className="text-[10px] font-bold">Dialogue</span></button><button onClick={() => addBlock('quiz')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><HelpCircle size={20}/> <span className="text-[10px] font-bold">Quiz</span></button><button onClick={() => addBlock('vocab-list')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><List size={20}/> <span className="text-[10px] font-bold">Vocab List</span></button><button onClick={() => addBlock('flashcard')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><FlipVertical size={20}/> <span className="text-[10px] font-bold">Flashcard</span></button><button onClick={() => addBlock('image')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><Image size={20}/> <span className="text-[10px] font-bold">Image</span></button></div>
      <div className="pt-4 border-t border-slate-100"><button onClick={handleSave} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Save size={20} /> Save Lesson to Library</button></div>
    </div>
  );
}

// ============================================================================
//  [PLACEHOLDER: BUILDER HUB FUNCTION WAS HERE - NOW MOVED BELOW]
// ============================================================================
// --- 4. AGGREGATOR & MANAGER COMPONENTS (Defined LAST) ---

function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks }: any) {
  const [lessonData, setLessonData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [] });
  const [mode, setMode] = useState('card'); 
  const [subView, setSubView] = useState('menu'); // menu | library | editor | import
  const [editingItem, setEditingItem] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importType, setImportType] = useState('lesson');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleBulkImport = async () => {
    try {
        const data = JSON.parse(jsonInput);
        if (!Array.isArray(data)) throw new Error("Input must be an array.");
        const batch = writeBatch(db);
        // @ts-ignore
        const userId = auth.currentUser?.uid;
        if(!userId) return;

        let count = 0;
        data.forEach((item: any) => {
            const id = item.id || `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            if (importType === 'deck') {
                const deckId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                const deckTitle = item.title || "Imported Deck";
                if (item.cards && Array.isArray(item.cards)) {
                    item.cards.forEach((card: any) => {
                        const cardRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'custom_cards'));
                        batch.set(cardRef, { ...card, deckId: deckId, deckTitle: deckTitle, type: card.type || 'noun', mastery: 0, grammar_tags: card.grammar_tags || ["Imported"] });
                        count++;
                    });
                }
            } else {
                 const ref = doc(db, 'artifacts', appId, 'users', userId, 'custom_lessons', id);
                 batch.set(ref, { ...item, vocab: Array.isArray(item.vocab) ? item.vocab : [], xp: item.xp || 100 });
                 count++;
            }
        });
        await batch.commit();
        setToastMsg(`Successfully imported ${count} items.`);
        setJsonInput('');
    } catch (e: any) { alert("Import Failed: " + e.message); }
  };

  const handleEdit = (item: any, type: string) => {
      setEditingItem(item);
      setMode(type);
      setSubView('editor');
      if(type === 'lesson') {
           // Flatten vocab for editor
           setLessonData({...item, vocab: Array.isArray(item.vocab) ? item.vocab.join(', ') : item.vocab});
      }
  };

  // -- Sub-views inside BuilderHub --
  
  if (subView === 'library') {
      return (
          <div className="h-full flex flex-col bg-slate-50">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                  <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Library className="text-indigo-600"/> Content Library</h2>
                  <button onClick={() => setSubView('menu')} className="text-sm font-bold text-slate-500 hover:text-indigo-600">Back</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div>
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers size={18} className="text-orange-500"/> Decks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {Object.entries(allDecks).map(([key, deck]: any) => (
                              <div key={key} onClick={() => handleEdit({...deck, deckId: key}, 'card')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 cursor-pointer transition-colors group">
                                  <div className="flex justify-between mb-2">
                                      <h4 className="font-bold text-slate-900">{deck.title}</h4>
                                      <Edit3 size={16} className="text-slate-300 group-hover:text-orange-500"/>
                                  </div>
                                  <p className="text-xs text-slate-500">{deck.cards?.length || 0} Cards</p>
                              </div>
                           ))}
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  if (subView === 'import') {
      return (
          <div className="h-full flex flex-col bg-slate-50 p-6">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">AI / JSON Import</h2>
                 <button onClick={() => setSubView('menu')} className="text-sm font-bold text-slate-500 hover:text-indigo-600">Back</button>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setImportType('lesson')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${importType === 'lesson' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Lessons</button>
                     <button onClick={() => setImportType('deck')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${importType === 'deck' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Decks</button>
                 </div>
                 <textarea 
                    value={jsonInput} 
                    onChange={(e) => setJsonInput(e.target.value)} 
                    className="flex-1 w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder={importType === 'lesson' ? '[ { "title": "Lesson 1", "blocks": [...] } ]' : '[ { "title": "My Deck", "cards": [...] } ]'}
                 />
                 <div className="mt-4 flex justify-end">
                     <button onClick={handleBulkImport} disabled={!jsonInput} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                         <UploadCloud size={18}/> Import JSON
                     </button>
                 </div>
                 {toastMsg && <p className="text-emerald-600 font-bold text-center mt-2">{toastMsg}</p>}
             </div>
          </div>
      )
  }

  // Default View (Menu + Editor)
  return (
    <div className="pb-24 h-full bg-slate-50 overflow-y-auto custom-scrollbar relative">
        <Header title="Scriptorium" subtitle="Content Creator" 
            rightAction={
                <div className="flex gap-2">
                    <button onClick={() => setSubView('import')} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><FileJson size={20}/></button>
                    <button onClick={() => setSubView('library')} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><Library size={20}/></button>
                </div>
            } 
        />
        
        {(subView === 'menu' || subView === 'editor') && (
             <div className="px-6 mt-2">
                <div className="flex bg-slate-200 p-1 rounded-xl">
                    <button onClick={() => { setMode('card'); setEditingItem(null); setSubView('editor'); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode === 'card' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Flashcard</button>
                    <button onClick={() => { setMode('lesson'); setEditingItem(null); setSubView('editor'); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode === 'lesson' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Full Lesson</button>
                </div>
            </div>
        )}

        <div className="mt-4">
            {subView === 'editor' && mode === 'card' && (
                <CardBuilderView 
                    onSaveCard={onSaveCard} 
                    onUpdateCard={onUpdateCard} 
                    onDeleteCard={onDeleteCard} 
                    availableDecks={allDecks} 
                    initialData={editingItem}
                    onCancelEdit={() => { setEditingItem(null); }}
                />
            )}
            {subView === 'editor' && mode === 'lesson' && (
                <LessonBuilderView 
                    data={lessonData} 
                    setData={setLessonData} 
                    onSave={onSaveLesson} 
                    availableDecks={allDecks} 
                />
            )}
        </div>
    </div>
  );
}

// --- INSTRUCTOR & DASHBOARD ---
function ClassManagerView({ user, classes, lessons, allDecks }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [targetStudentMode, setTargetStudentMode] = useState('all'); 
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assignType, setAssignType] = useState<'deck' | 'lesson'>('lesson');

  // -- NEW: Student Selector States --
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  // -- NEW: Fetch all students when modal opens --
  useEffect(() => {
    if (isStudentListOpen) {
        const q = query(collectionGroup(db, 'profile'), where('role', '==', 'student'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAvailableStudents(snapshot.docs.map(doc => ({ 
                // The doc ID is usually 'main', so we try to get uid from parent path or data if available, 
                // but for this app we rely on email.
                ...doc.data() 
            })));
        });
        return () => unsubscribe();
    }
  }, [isStudentListOpen]);

  const createClass = async (e: any) => { e.preventDefault(); if (!newClassName.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { name: newClassName, code: Math.random().toString(36).substring(2, 8).toUpperCase(), students: [], studentEmails: [], assignments: [], created: Date.now() }); setNewClassName(''); setToastMsg("Class Created Successfully"); } catch (error) { console.error("Create class failed:", error); alert("Failed to create class."); } };
  const handleDeleteClass = async (id: string) => { if (window.confirm("Delete this class?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id)); if (selectedClassId === id) setSelectedClassId(null); } catch (error) { console.error("Delete class failed:", error); alert("Failed to delete class."); } } };
  const handleRenameClass = async (classId: string, currentName: string) => { const newName = prompt("Enter new class name:", currentName); if (newName && newName.trim() !== "" && newName !== currentName) { try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), { name: newName.trim() }); setToastMsg("Class renamed successfully"); } catch (error) { console.error("Rename failed", error); alert("Failed to rename class"); } } };
  
  const toggleAssignee = (email: string) => { if (selectedAssignees.includes(email)) { setSelectedAssignees(selectedAssignees.filter(e => e !== email)); } else { setSelectedAssignees([...selectedAssignees, email]); } };
  const assignContent = async (item: any, type: string) => { if (!selectedClass) return; try { const assignment = JSON.parse(JSON.stringify({ ...item, id: `assign_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, originalId: item.id, contentType: type, targetStudents: targetStudentMode === 'specific' ? selectedAssignees : null })); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: arrayUnion(assignment) }); setAssignModalOpen(false); setTargetStudentMode('all'); setSelectedAssignees([]); setToastMsg(`Assigned: ${item.title}`); } catch (error) { console.error("Assign failed:", error); alert("Failed to assign."); } };

  // -- NEW: Add Student Logic --
  const addStudentToClass = async (email: string) => {
      if (!selectedClass || !email) return;
      const normalizedEmail = email.toLowerCase().trim();
      if (selectedClass.studentEmails?.includes(normalizedEmail)) return;

      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { 
              students: arrayUnion(normalizedEmail), 
              studentEmails: arrayUnion(normalizedEmail) 
          });
          setToastMsg(`Added ${normalizedEmail}`);
      } catch (error) {
          console.error("Add student failed:", error);
          alert("Failed to add student.");
      }
  };

  if (selectedClass) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 relative">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        <div className="pb-6 border-b border-slate-100 mb-6">
          <button onClick={() => setSelectedClassId(null)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Back to Classes</button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900">{selectedClass.name}</h1><p className="text-sm text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">Code: {selectedClass.code}</p></div>
            <div className="flex gap-2">
                <button onClick={() => { setAssignType('lesson'); setAssignModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-wider"><BookOpen size={16}/> ASSIGN LESSON</button>
                <button onClick={() => { setAssignType('deck'); setAssignModalOpen(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-orange-600 active:scale-95 transition-all uppercase tracking-wider"><Layers size={16}/> ASSIGN DECK</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ASSIGNMENTS COLUMN */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3>
                {(!selectedClass.assignments || selectedClass.assignments.length === 0) && <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">No content assigned yet.</div>}
                {selectedClass.assignments?.map((l: any, idx: number) => ( 
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>{l.contentType === 'deck' ? <Layers size={18} /> : <FileText size={18} />}</div>
                            <div><h4 className="font-bold text-slate-800">{l.title}</h4><div className="flex items-center gap-2"><span className="text-[10px] text-slate-500 uppercase">{l.contentType === 'deck' ? 'Flashcard Deck' : 'Lesson'}</span>{l.targetStudents && l.targetStudents.length > 0 && (<span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold flex items-center gap-1"><Users size={10}/> {l.targetStudents.length} Students</span>)}</div></div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* New Feature: View Results Button logic could go here */}
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">Active</span>
                        </div>
                    </div> 
                ))}
            </div>

            {/* ROSTER COLUMN */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Roster</h3>
                    <button onClick={() => setIsStudentListOpen(true)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><UserPlus size={14}/> Add Students</button>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {(!selectedClass.students || selectedClass.students.length === 0) && <div className="p-4 text-center text-slate-400 text-sm italic">No students joined yet.</div>}
                    {selectedClass.students?.map((s: string, i: number) => (
                        <div key={i} className="p-3 border-b border-slate-50 last:border-0 flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{s.charAt(0)}</div>
                            <span className="text-sm font-medium text-slate-700">{s}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- STUDENT SELECTOR MODAL --- */}
        {isStudentListOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Select Students</h3>
                        <button onClick={() => setIsStudentListOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                value={studentSearch} 
                                onChange={(e) => setStudentSearch(e.target.value)} 
                                placeholder="Search by name or email..." 
                                className="w-full pl-9 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {availableStudents.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">Loading students...</div>
                        ) : (
                            availableStudents
                            .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()))
                            .map((student, idx) => {
                                const isAdded = selectedClass.students?.includes(student.email);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{student.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                <p className="text-xs text-slate-500">{student.email}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => addStudentToClass(student.email)}
                                            disabled={isAdded}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isAdded ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            {isAdded ? 'Joined' : 'Add'}
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- ASSIGN CONTENT MODAL --- */}
        {assignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Assign {assignType === 'deck' ? 'Flashcard Deck' : 'Lesson'}</h3><button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                  <div className="bg-white p-1 rounded-lg border border-slate-200 flex mb-2"><button onClick={() => setTargetStudentMode('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'all' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Entire Class</button><button onClick={() => setTargetStudentMode('specific')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'specific' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Specific Students</button></div>
                  {targetStudentMode === 'specific' && (<div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 custom-scrollbar">{(!selectedClass.students || selectedClass.students.length === 0) ? (<p className="text-xs text-slate-400 italic text-center p-2">No students in roster.</p>) : (selectedClass.students.map((studentEmail: string) => (<button key={studentEmail} onClick={() => toggleAssignee(studentEmail)} className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded text-left">{selectedAssignees.includes(studentEmail) ? <CheckCircle2 size={16} className="text-indigo-600"/> : <Circle size={16} className="text-slate-300"/>}<span className="text-xs font-medium text-slate-700 truncate">{studentEmail}</span></button>)))}</div>)}
                  {targetStudentMode === 'specific' && <p className="text-[10px] text-slate-400 mt-2 text-right">{selectedAssignees.length} selected</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {assignType === 'deck' && (
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers size={14}/> Available Decks</h4>
                          <div className="space-y-2">
                              {Object.keys(allDecks || {}).length === 0 ? <p className="text-sm text-slate-400 italic">No decks found.</p> : Object.entries(allDecks).map(([key, deck]: any) => (
                                  <button key={key} onClick={() => assignContent({ ...deck, id: key }, 'deck')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group flex justify-between items-center">
                                      <div><h4 className="font-bold text-slate-800 text-sm">{deck.title}</h4><p className="text-xs text-slate-500">{deck.cards?.length || 0} Cards</p></div>
                                      <PlusCircle size={18} className="text-slate-300 group-hover:text-orange-500"/>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
                  {assignType === 'lesson' && (
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen size={14}/> Available Lessons</h4>
                          <div className="space-y-2">
                              {lessons.length === 0 ? <p className="text-sm text-slate-400 italic">No lessons found.</p> : lessons.map((l: any) => (
                                  <button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex justify-between items-center">
                                      <div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div>
                                      <PlusCircle size={18} className="text-slate-300 group-hover:text-indigo-500"/>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">My Classes</h2><form onSubmit={createClass} className="flex gap-2"><input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name" className="p-2 rounded-lg border border-slate-200 text-sm w-64" /><button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> Create</button></form></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{classes.map((cls: any) => (<div key={cls.id} onClick={() => setSelectedClassId(cls.id)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"><div className="absolute top-4 right-4 flex gap-2"><button onClick={(e) => {e.stopPropagation(); handleRenameClass(cls.id, cls.name);}} className="text-slate-300 hover:text-indigo-500"><Edit3 size={16}/></button><button onClick={(e) => {e.stopPropagation(); handleDeleteClass(cls.id);}} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div><div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-bold text-lg">{cls.name.charAt(0)}</div><h3 className="font-bold text-lg text-slate-900">{cls.name}</h3><p className="text-sm text-slate-500 mb-4">{(cls.students || []).length} Students</p><div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg"><span className="text-xs font-mono font-bold text-slate-600 tracking-wider">{cls.code}</span><button className="text-indigo-600 text-xs font-bold flex items-center gap-1" onClick={(e) => {e.stopPropagation(); navigator.clipboard.writeText(cls.code);}}><Copy size={12}/> Copy</button></div></div>))}</div>
    </div>
  );
}

function InstructorDashboard({ user, userData, allDecks, lessons, onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar for Desktop */}
      <div className="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800"><h1 className="text-xl font-bold flex items-center gap-2">
        <GraduationCap className="text-indigo-400"/> Instructor {/* Was Magister */}
    </h1><p className="text-xs text-slate-400 mt-1">{user.email}</p></div>
        <div className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} /> Overview</button>
            <button onClick={() => setActiveTab('classes')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'classes' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><School size={20} /> Classes & Roster</button>
            <button onClick={() => setActiveTab('content')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'content' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Library size={20} /> Content Library</button>
            <button onClick={() => setActiveTab('profile')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><User size={20} /> Profile & Settings</button>
        </div>
        <div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="w-full p-3 rounded-xl bg-slate-800 text-rose-400 flex items-center gap-3 hover:bg-slate-700 transition-colors"><LogOut size={20} /> Sign Out</button></div>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center"><span className="font-bold flex items-center gap-2"><GraduationCap/> Magister</span><div className="flex gap-4"><button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}><LayoutDashboard/></button><button onClick={() => setActiveTab('classes')} className={activeTab === 'classes' ? 'text-indigo-400' : 'text-slate-400'}><School/></button><button onClick={() => setActiveTab('content')} className={activeTab === 'content' ? 'text-indigo-400' : 'text-slate-400'}><Library/></button></div></div>
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto h-full">
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-lg">
                                <h2 className="text-3xl font-bold mb-2">Welcome back, Magister.</h2>
                                <p className="text-indigo-100 mb-6">Your academy is active.</p>
                                <div className="flex gap-8">
                                    <div><span className="text-4xl font-bold block">{userData.classes?.length || 0}</span><span className="text-xs uppercase tracking-wider opacity-70">Active Classes</span></div>
                                    <div><span className="text-4xl font-bold block">{allDecks.custom?.cards?.length || 0}</span><span className="text-xs uppercase tracking-wider opacity-70">Flashcards</span></div>
                                    <div><span className="text-4xl font-bold block">{lessons.length}</span><span className="text-xs uppercase tracking-wider opacity-70">Lessons</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="h-[500px] md:h-auto">
                            <LiveActivityFeed />
                        </div>
                    </div>
                )}
                {activeTab === 'classes' && (<ClassManagerView user={user} classes={userData?.classes || []} lessons={lessons} allDecks={allDecks} />)}
                {activeTab === 'content' && (<div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col"><div className="flex-1 overflow-y-auto"><BuilderHub onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} onSaveLesson={onSaveLesson} allDecks={allDecks} /></div></div>)}
                {activeTab === 'profile' && <ProfileView user={user} userData={userData} />}
            </div>
         </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [systemDecks, setSystemDecks] = useState<any>({});
  const [systemLessons, setSystemLessons] = useState<any[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [selectedDeckKey, setSelectedDeckKey] = useState('salutationes');
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [classLessons, setClassLessons] = useState<any[]>([]);
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);

const allDecks = useMemo(() => {
    // 1. Start with system decks
    const decks: any = { ...systemDecks, custom: { title: "✍️ Scriptorium", cards: [] } };
    
    // 2. Add Custom User Cards
    customCards.forEach(card => {
        const target = card.deckId || 'custom';
        if (!decks[target]) { decks[target] = { title: card.deckTitle || "Custom Deck", cards: [] }; }
        if (!decks[target].cards) decks[target].cards = [];
        decks[target].cards.push(card);
    });

    // 3. --- NEW CODE: Add Assigned Class Decks ---
    classLessons.forEach((assignment: any) => {
        if (assignment.contentType === 'deck') {
            decks[assignment.id] = {
                title: `(Class) ${assignment.title}`,
                cards: assignment.cards || [],
                isAssignment: true
            };
        }
    });

    return decks;
  }, [systemDecks, customCards, classLessons]); // <--- Added classLessons dependency

  const lessons = useMemo(() => [...systemLessons, ...customLessons, ...classLessons.filter(l => l.contentType !== 'deck')], [systemLessons, customLessons, classLessons]);
  const libraryLessons = useMemo(() => [...systemLessons, ...customLessons], [systemLessons, customLessons]);

  const handleContentSelection = (item: any) => { if (item.contentType === 'deck') { setSelectedDeckKey(item.id); setActiveTab('flashcards'); setActiveStudentClass(null); setActiveLesson(null); } else { setActiveLesson(item); } };

  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthChecked(true); }); return () => unsubscribe(); }, []);
  
  useEffect(() => {
    if (!user) { setUserData(null); return; }
    setSystemDecks(INITIAL_SYSTEM_DECKS); setSystemLessons(INITIAL_SYSTEM_LESSONS);
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (docSnap) => { if (docSnap.exists()) setUserData(docSnap.data()); else setUserData(DEFAULT_USER_DATA); });
    const unsubCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), (snap) => setCustomCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLessons = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), (snap) => setCustomLessons(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSysDecks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'system_decks'), (snap) => { const d: any = {}; snap.docs.forEach(doc => { d[doc.id] = doc.data(); }); if (Object.keys(d).length > 0) setSystemDecks(d); });
    const unsubSysLessons = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'system_lessons'), (snap) => { const l = snap.docs.map(d => ({ id: d.id, ...d.data() })); if (l.length > 0) setSystemLessons(l); });

    let qClasses;
    if (userData?.role === 'instructor') {
         qClasses = query(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'));
    } else {
         qClasses = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', user.email));
    }

    const unsubClasses = onSnapshot(qClasses, (snapshot) => { 
        const cls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        setEnrolledClasses(cls); 
        const newAssignments: any[] = []; 
        cls.forEach((c: any) => { 
            if (c.assignments && Array.isArray(c.assignments)) { 
                newAssignments.push(...c.assignments); 
            } 
        }); 
        setClassLessons(newAssignments); 
        setUserData((prev: any) => ({...prev, classes: cls, classAssignments: newAssignments})); 
    }, (error) => { console.log("Class sync error:", error); setUserData((prev: any) => ({...prev, classSyncError: true})); });
    
    return () => { unsubProfile(); unsubCards(); unsubLessons(); unsubSysDecks(); unsubSysLessons(); unsubClasses(); };
  }, [user, userData?.role]);

  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card. Check permissions."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Are you sure you want to delete this card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); alert("Failed to delete card."); } }, [user]);
  const handleCreateLesson = useCallback(async (l: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), l); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), l); } setActiveTab('home'); }, [user]);
const handleFinishLesson = useCallback(async (lessonId: string, xp: number, title?: string, scoreDetail?: any) => { 
  if (userData?.role !== 'instructor') setActiveTab('home'); 
  
  if (xp > 0 && user) { 
      try { 
          // 1. Update User Profile
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { 
            xp: increment(xp), 
            completedAssignments: arrayUnion(lessonId) 
          }); 

          // 2. Log Activity to Feed
          console.log("Attempting to write to Activity Log..."); // DEBUG LOG
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { 
              studentName: userData?.name || 'Unknown Student', 
              studentEmail: user.email, 
              itemTitle: title || 'Unknown Activity', 
              xp: xp, 
              timestamp: Date.now(), 
              type: scoreDetail ? 'quiz_score' : 'completion',
              scoreDetail: scoreDetail || null
          });
          console.log("Activity Logged Successfully!"); // DEBUG LOG

          if(userData?.role === 'instructor') alert(`Activity Logged: ${title} (+${xp}XP)`);
      } catch (e: any) { 
          console.error("Error logging activity:", e); // VIEW THIS IN CONSOLE
          // Fallback for new users who might not have a profile doc yet
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { 
            ...DEFAULT_USER_DATA, xp: xp, completedAssignments: [lessonId] 
          }, { merge: true }); 
      } 
  } 
}, [user, userData]);

  if (!authChecked) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>;
  if (!user) return <AuthView />;
  if (!userData) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>; 
  
  const commonHandlers = { onSaveCard: handleCreateCard, onUpdateCard: handleUpdateCard, onDeleteCard: handleDeleteCard, onSaveLesson: handleCreateLesson, };
  
  if (userData.role === 'instructor') {
      return (
        <InstructorDashboard 
            user={user} 
            userData={{...userData, classes: enrolledClasses}} 
            allDecks={allDecks} 
            lessons={libraryLessons} 
            {...commonHandlers} 
            onLogout={() => signOut(auth)} 
        />
      );
  }

  const renderStudentView = () => {
    if (activeLesson) return <LessonView lesson={activeLesson} onFinish={(id: string, xp: number, title: string) => { handleFinishLesson(id, xp, title); setActiveLesson(null); }} />;
    if (activeTab === 'home' && activeStudentClass) return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} />;
    switch (activeTab) {
      case 'home': return <HomeView setActiveTab={setActiveTab} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} />;
      case 'flashcards': 
         const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck');
         const deckToLoad = assignedDeck || allDecks[selectedDeckKey];
         return <FlashcardView allDecks={allDecks} selectedDeckKey={selectedDeckKey} onSelectDeck={setSelectedDeckKey} onSaveCard={handleCreateCard} activeDeckOverride={deckToLoad} onComplete={handleFinishLesson} />;
      case 'create': return <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={handleCreateLesson} allDecks={allDecks} />;
      case 'profile': return <ProfileView user={user} userData={userData} />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-900 flex justify-center items-center p-0 sm:p-4">
      <div className={`bg-slate-50 w-full h-[100dvh] shadow-2xl relative overflow-hidden border-[8px] border-slate-900/5 sm:border-slate-900/10 ${userData?.role === 'instructor' ? 'max-w-full sm:rounded-none border-0' : 'max-w-[400px] sm:rounded-[3rem] sm:h-[800px]'}`}>
        {userData?.role !== 'instructor' && <div className="absolute top-0 left-0 right-0 h-8 bg-white/0 z-50 pointer-events-none" />}
        {renderStudentView()}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <style>{` .perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } `}</style>
    </div>
  );
}

export default App;
