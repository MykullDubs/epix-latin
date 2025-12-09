import './index.css';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
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
import { 
  BookOpen, Trophy, Layers, User, Home, Check, X, Zap, ChevronRight, Search, Volume2, 
  Puzzle, MessageSquare, GraduationCap, PlusCircle, Save, Feather, ChevronDown, 
  PlayCircle, Award, Trash2, Plus, FileText, Brain, Loader, LogOut, UploadCloud, 
  School, Users, Copy, List, ArrowRight, LayoutDashboard, ArrowLeft, Library, 
  Pencil, Image, Info, Edit3, FileJson, AlertTriangle, FlipVertical, GanttChart, 
  AlignLeft, HelpCircle, Activity, Clock, CheckCircle2, Circle, ArrowDown,
  BarChart3, UserPlus, Briefcase, Coffee, AlertCircle, Target, Calendar, Settings, Edit2, Camera, Medal,
  ChevronUp, GripVertical, ListOrdered, ArrowRightLeft, CheckSquare, Gamepad2, Globe,
  BrainCircuit, Swords, Heart, Skull // <--- Added these for the new game modes
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
const storage = getStorage(app);
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'epic-latin-prod';

// --- DEFAULTS & SEED DATA ---
const DEFAULT_USER_DATA = { 
  name: "Student", 
  targetLanguage: "English", 
  level: "Beginner", 
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
      { id: 'g1', front: "How are you?", back: "A polite question about health.", type: "phrase", mastery: 0, ipa: "/haʊ ɑːr juː/" },
      { id: 'g2', front: "Nice to meet you", back: "Used when meeting first time.", type: "phrase", mastery: 0, ipa: "/naɪs tuː miːt juː/" },
      { id: 'g3', front: "See you later", back: "Casual goodbye.", type: "phrase", mastery: 0, ipa: "/siː juː ˈleɪtər/" }
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

const EMAIL_MODULE_DATA = {
  id: 'email_mastery_1',
  type: 'email_module',
  title: "✉️ Professional Email Mastery",
  subtitle: "The Inbox Challenge",
  description: "Master the art of professional communication.",
  xp: 150,
  scenarios: [
    {
      id: 'e1',
      subject: "URGENT: Meeting??",
      sender: "Toxic Boss <boss@corp.com>",
      avatar: "TB",
      type: "fix_tone",
      content: "HEY. Need the report NOW. Why is it late? Send it ASAP.",
      correctContent: "Hi. Could you please send the report when you have a chance? I'd appreciate an update on its status. Thanks.",
      instruction: "Click 3 rude phrases to soften the tone.",
      targets: ["HEY.", "NOW.", "Why is it late?"]
    },
    {
      id: 'e2',
      subject: "Invitation to Annual Gala",
      sender: "Event Team <events@corp.com>",
      avatar: "ET",
      type: "sort",
      content: "Dear Colleague, You are cordially invited to our Annual Gala...",
      instruction: "Is this email Formal or Informal?",
      options: [
        { id: 'formal', label: 'Formal', correct: true },
        { id: 'informal', label: 'Informal', correct: false }
      ]
    },
    {
      id: 'e3',
      subject: "Re: Project Alpha",
      sender: "Sarah Jenkins <s.jenkins@client.com>",
      avatar: "SJ",
      type: "reply_fill",
      content: "Hi there, just checking in on the timeline for Project Alpha. When can we expect the first draft?",
      instruction: "Complete the reply professionally.",
      template: "Dear Sarah, [1] for your email. We are working hard on it. You can [2] the draft by Friday. Best, [3].",
      blanks: [
        { index: 1, correct: "Thank you", options: ["Thanks", "Thank you", "Good looks"] },
        { index: 2, correct: "expect", options: ["want", "expect", "grab"] },
        { index: 3, correct: "Regards", options: ["Later", "Regards", "See ya"] }
      ]
    }
  ]
};

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
function ExamResultModal({ log, onClose }: any) {
    if (!log) return null;
    const scoreDetail = log.scoreDetail || {};
    const { score = 0, total = 0, details = [] } = scoreDetail;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                
                <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{log.studentName}'s Results</h2>
                        <p className="text-sm text-slate-500">{log.itemTitle} • {new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                         <span className={`text-2xl font-black ${percentage >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{percentage}%</span>
                         <p className="text-xs font-bold text-slate-400 uppercase">{score}/{total} Correct</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {details.length === 0 ? (
                        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                            <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-500 font-bold">No Question Details Available</p>
                        </div>
                    ) : (
                        details.map((item: any, i: number) => (
                            <div key={i} className={`p-4 rounded-2xl border-2 ${item.isCorrect ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {item.isCorrect ? <Check size={14} strokeWidth={3}/> : <X size={14} strokeWidth={3}/>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 mb-2">{item.prompt}</p>
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 w-16 mt-1">Student:</span>
                                                <span className={`font-medium whitespace-pre-wrap ${item.isCorrect ? 'text-emerald-700' : 'text-rose-700 opacity-75'}`}>
                                                    {item.studentVal === 'true' ? 'True' : item.studentVal === 'false' ? 'False' : item.studentVal}
                                                </span>
                                            </div>
                                            {!item.isCorrect && (
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 w-16 mt-1">Correct:</span>
                                                    <span className="font-medium text-emerald-700 whitespace-pre-wrap">
                                                        {item.correctVal === 'true' ? 'True' : item.correctVal === 'false' ? 'False' : item.correctVal}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">Close Review</button>
                </div>
            </div>
        </div>
    );
}
function LiveActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null); 
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden relative">
        {selectedLog && <ExamResultModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Live Student Activity</h2>
            <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">LIVE</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50" ref={scrollRef}>
            {logs.length === 0 && <div className="text-center text-slate-400 italic mt-10">No recent activity.</div>}
            <div className="space-y-3">
                {logs.map((log) => (
                    <div 
                        key={log.id} 
                        onClick={() => {
                            console.log("Clicked log:", log); // DEBUG LOG
                            if (log.scoreDetail) setSelectedLog(log);
                        }}
                        className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 animate-in slide-in-from-top-2 transition-all ${log.scoreDetail ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''}`}
                    >
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
                                {log.scoreDetail && <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-1 rounded ml-auto">View Details</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
// --- LEVELING LOGIC ---
const getLevelInfo = (xp: number) => {
  const baseXP = 100;
  const level = Math.floor(xp / baseXP) + 1;
  const currentLevelXP = xp % baseXP;
  const nextLevelXP = baseXP;
  const progress = (currentLevelXP / nextLevelXP) * 100;
  let rank = "Beginner";
  if (level >= 5) rank = "Elementary";
  if (level >= 10) rank = "Intermediate";
  if (level >= 20) rank = "Advanced";
  if (level >= 50) rank = "Native-like";
  return { level, currentLevelXP, nextLevelXP, progress, rank };
};

function LevelUpModal({ userData, onClose }: any) {
  const { level, currentLevelXP, nextLevelXP, progress, rank } = getLevelInfo(userData?.xp || 0);
  
  // Calculate remaining XP for motivation
  const xpNeeded = nextLevelXP - currentLevelXP;
  
  // Calculate specific stats
  const completedCount = (userData?.completedAssignments || []).length;
  const classCount = (userData?.classes || []).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden transform scale-100 transition-all relative border border-white/20" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* --- HEADER: The Cornflower Canopy --- */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 pb-12 text-white text-center overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-50%] left-[-50%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[60px] mix-blend-overlay animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-indigo-300/20 rounded-full blur-[40px] mix-blend-overlay"></div>
            
            <button onClick={onClose} className="absolute top-5 right-5 text-white/50 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-md transition-all">
                <X size={20} />
            </button>

           <div className="flex flex-col items-center relative z-10">
    {/* Avatar with Halo */}
    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.25)] mb-4 overflow-hidden">
        {userData?.photoURL ? (
            <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
        ) : (
            <span className="font-serif font-bold text-4xl text-white drop-shadow-md">{userData?.name?.charAt(0) || "U"}</span>
        )}
    </div>
                
                <h2 className="text-3xl font-serif font-bold tracking-tight">{userData?.name}</h2>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">{userData?.email}</p>
                
                {/* Rank Badge */}
                <div className="mt-4 bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner">
                    <Award size={14} className="text-yellow-300" />
                    <span className="text-xs font-bold uppercase tracking-wide">{rank}</span>
                </div>
            </div>
        </div>

        {/* --- BODY: The Scrolls of Data --- */}
        <div className="px-6 pb-8 -mt-8 relative z-20">
            
            {/* Progress Card */}
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 mb-6">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                        <span className="text-2xl font-black text-slate-800">Level {level}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner border border-slate-200">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                
                <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                    <span className="text-indigo-600 font-bold">{xpNeeded} XP</span> until Level {level + 1}
                </p>
            </div>

            {/* Stats Grid (The Bento Box of Works) */}
            <div className="grid grid-cols-2 gap-3">
                {/* Streak */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <div className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><Zap size={20} fill="currentColor"/></div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800 leading-none">{userData?.streak || 1}</p>
                        <p className="text-[10px] text-orange-600/70 uppercase font-bold tracking-wider mt-1">Day Streak</p>
                    </div>
                </div>

                {/* Total XP */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm"><Award size={20}/></div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800 leading-none">{userData?.xp || 0}</p>
                        <p className="text-[10px] text-blue-600/70 uppercase font-bold tracking-wider mt-1">Total XP</p>
                    </div>
                </div>

                {/* Completed Assignments */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-bold text-slate-700">{completedCount}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Assignments Done</span>
                </div>

                {/* Active Classes */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-bold text-slate-700">{classCount}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Active Classes</span>
                </div>
            </div>

        </div>
      </div>
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

// --- BEEFED UP PROFILE VIEW (FIXED LAYOUT) ---
function ProfileView({ user, userData }: any) {
  const [deploying, setDeploying] = useState(false);
  const [uploading, setUploading] = useState(false); // New state for upload spinner
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden input

  const handleLogout = () => signOut(auth);
  const { level, progress, rank } = getLevelInfo(userData?.xp || 0);

  const deploySystemContent = async () => { setDeploying(true); const batch = writeBatch(db); Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); INITIAL_SYSTEM_LESSONS.forEach((lesson: any) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); try { await batch.commit(); alert("Deployed!"); } catch (e: any) { alert("Error: " + e.message); } setDeploying(false); };
  const toggleRole = async () => { if (!userData) return; const newRole = userData.role === 'instructor' ? 'student' : 'instructor'; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole }); };

  // --- NEW: HANDLE IMAGE UPLOAD ---
  const handleImageUpload = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Simple validation
      if (file.size > 5 * 1024 * 1024) { alert("File is too large (Max 5MB)"); return; }
      if (!file.type.startsWith('image/')) { alert("Please upload an image file"); return; }

      setUploading(true);
      try {
          // 1. Create Reference
          const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
          
          // 2. Upload
          await uploadBytes(storageRef, file);
          
          // 3. Get URL
          const photoURL = await getDownloadURL(storageRef);
          
          // 4. Update Profile Doc
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { photoURL });
          
      } catch (error) {
          console.error("Upload failed", error);
          alert("Failed to upload image.");
      } finally {
          setUploading(false);
      }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-blue-50 relative overflow-y-auto overflow-x-hidden">
        
        {/* --- HEADER --- */}
        <div className="relative bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-700/90 backdrop-blur-md pb-16 pt-10 px-6 rounded-b-[2rem] shadow-2xl z-0 shrink-0 text-center overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-400/40 rounded-full blur-[80px] mix-blend-overlay pointer-events-none animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-300/40 rounded-full blur-[60px] mix-blend-overlay pointer-events-none animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
            
            {/* --- AVATAR UPLOADER --- */}
            <div className="relative inline-block mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.3)] relative z-10 overflow-hidden">
                    {uploading ? (
                        <Loader className="animate-spin text-white" />
                    ) : userData?.photoURL ? (
                        <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-serif font-bold text-4xl text-white drop-shadow-lg">{userData?.name?.charAt(0) || 'U'}</span>
                    )}
                    
                    {/* Hover Overlay with Camera Icon */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                </div>
                
                {/* Decorative Rings */}
                <div className="absolute inset-0 border border-white/20 rounded-full scale-125 animate-pulse pointer-events-none"></div>
                <div className="absolute inset-0 border border-white/10 rounded-full scale-150 pointer-events-none"></div>
                
                {/* Hidden Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                />
            </div>

            <h1 className="text-3xl font-serif font-bold text-white drop-shadow-md mb-1">{userData?.name}</h1>
            <p className="text-blue-100 font-medium tracking-wide text-sm opacity-80">{user.email}</p>
            
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
                <div className={`w-1.5 h-1.5 rounded-full ${userData?.role === 'instructor' ? 'bg-amber-400' : 'bg-emerald-400'} shadow-[0_0_10px_currentColor]`}></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{userData?.role} Account</span>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="px-6 -mt-12 relative z-10 pb-24">
            
            {/* Stats Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-[inset_0_2px_20px_rgba(255,255,255,0.2),_0_15px_35px_rgba(0,0,0,0.1)] border border-white/40 mb-8 relative overflow-hidden ring-1 ring-white/20">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400/80 via-indigo-500/80 to-blue-600/80"></div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="text-center border-r border-blue-500/10">
                        <span className="block text-blue-900/60 text-[10px] font-bold uppercase tracking-widest mb-1">Current Rank</span>
                        <div className="flex items-center justify-center gap-2 text-indigo-600 drop-shadow-sm">
                            <Award size={22} />
                            <span className="text-xl font-black">{level}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-500/80">{rank}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-blue-900/60 text-[10px] font-bold uppercase tracking-widest mb-1">Day Streak</span>
                        <div className="flex items-center justify-center gap-2 text-amber-500 drop-shadow-sm">
                            <Zap size={22} fill="currentColor"/>
                            <span className="text-xl font-black">{userData?.streak || 1}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-500/80">On Fire!</span>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-blue-500/10">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-blue-900/60">XP Progress</span>
                            <span className="text-xs font-bold text-indigo-600">{userData?.xp || 0} XP</span>
                        </div>
                        <div className="w-full bg-blue-900/5 rounded-full h-3 overflow-hidden shadow-inner border border-white/30">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(79,70,229,0.4)]" style={{ width: `${progress}%` }}>
                                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-blue-900/50 uppercase tracking-wider ml-2 mb-2">Account Settings</h3>
                <button onClick={toggleRole} className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm flex items-center justify-between group hover:bg-white/95 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm"><School size={20}/></div>
                        <div className="text-left"><h4 className="font-bold text-slate-800 text-base">Switch Role</h4><p className="text-[10px] text-slate-500">Currently: {userData?.role}</p></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50/50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ChevronRight size={16}/></div>
                </button>
                <button onClick={deploySystemContent} disabled={deploying} className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm flex items-center justify-between group hover:bg-white/95 hover:border-slate-400 hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors shadow-sm">{deploying ? <Loader className="animate-spin" size={20}/> : <UploadCloud size={20}/>}</div>
                        <div className="text-left"><h4 className="font-bold text-slate-800 text-base">Deploy Content</h4><p className="text-[10px] text-slate-500">Reset system defaults</p></div>
                    </div>
                </button>
                <button onClick={handleLogout} className="w-full bg-rose-50/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100/60 shadow-sm flex items-center justify-between group hover:bg-rose-100/90 hover:border-rose-200 hover:shadow-md transition-all active:scale-[0.98] mt-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/80 text-rose-500 rounded-xl flex items-center justify-center shadow-sm"><LogOut size={20}/></div>
                        <div className="text-left"><h4 className="font-bold text-rose-700 text-base">Sign Out</h4><p className="text-[10px] text-rose-500/80">See you soon!</p></div>
                    </div>
                </button>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-[9px] font-bold text-blue-900/30 uppercase tracking-widest">LinguistFlow v3.2 • Profile Shine Edition</p>
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
  // --- STATE ---
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gameMode, setGameMode] = useState('study'); 
  const [quickAddData, setQuickAddData] = useState({ front: '', back: '', type: 'noun' });
  
  // --- POINTER SWIPE STATE ---
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const minSwipeDistance = 50; 

  // --- DERIVED DATA ---
  const currentDeck = activeDeckOverride || allDecks[selectedDeckKey];
  const deckCards = currentDeck?.cards || [];
  const card = deckCards[currentIndex];
  const theme = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.noun) : TYPE_COLORS.noun;

  // --- AUDIO ENGINE ---
  const playAudio = useCallback((text: string, lang = 'en-US') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes(lang) && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes(lang));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.85; 
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  // --- HANDLERS ---
  const handleDeckChange = (key: string) => { 
    onSelectDeck(key); setIsSelectorOpen(false); setCurrentIndex(0); 
    setIsFlipped(false); setXrayMode(false); setManageMode(false); setGameMode('study'); 
  };
  
  const handleNext = useCallback(() => {
    setXrayMode(false); setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % deckCards.length), 150);
  }, [deckCards.length]);

  const handlePrev = useCallback(() => {
    setXrayMode(false); setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + deckCards.length) % deckCards.length), 150);
  }, [deckCards.length]);

  // --- UNIVERSAL POINTER EVENTS (Mouse + Touch) ---
  const onPointerDown = (e: React.PointerEvent) => {
    // We don't stop propagation here to allow clicking buttons inside
    setDragEndX(null); 
    setDragStartX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    // Only track move if we have started a drag
    if (dragStartX !== null) {
        setDragEndX(e.clientX);
    }
  };

  const onPointerUp = () => {
    if (dragStartX === null || dragEndX === null) {
        setDragStartX(null);
        return;
    }

    const distance = dragStartX - dragEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
        handleNext(); // Dragged Left -> Next Card
    } else if (isRightSwipe) {
        handlePrev(); // Dragged Right -> Prev Card
    }

    // Reset
    setDragStartX(null);
    setDragEndX(null);
  };

  const handleGameEnd = (data: any) => { 
      const xp = typeof data === 'number' ? data : (Math.round((data.score / data.total) * 50) + 10); 
      alert(`Complete! You earned ${xp} XP.`); setGameMode('study'); 
      if (activeDeckOverride && onComplete) onComplete(activeDeckOverride.id, xp, currentDeck.title, data.score !== undefined ? data : null); 
  };
  
  const handleQuickAdd = (e: any) => { 
    e.preventDefault(); if(!quickAddData.front || !quickAddData.back) return; 
    onSaveCard({ ...quickAddData, deckId: selectedDeckKey, ipa: "/.../", mastery: 0, morphology: [{ part: quickAddData.front, meaning: "Custom", type: "root" }], usage: { sentence: "-", translation: "-" }, grammar_tags: ["Quick Add"] }); 
    setQuickAddData({ front: '', back: '', type: 'noun' }); setSearchTerm(''); alert("Card Added!"); 
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (manageMode || gameMode !== 'study') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' || e.key === 'Enter') if (!xrayMode) setIsFlipped(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [manageMode, gameMode, xrayMode, deckCards.length, handleNext, handlePrev]);

  if (!card && !manageMode) return (
      <div className="h-full flex flex-col bg-slate-50">
        <Header title={currentDeck?.title || "Empty Deck"} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<button onClick={() => setManageMode(true)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><List size={20} className="text-slate-600" /></button>} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Layers size={32} className="opacity-20" /></div>
          <p className="font-bold text-lg text-slate-500">This deck is empty.</p><button onClick={() => setManageMode(true)} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg mt-4">Add Cards</button>
        </div>
      </div>
  );

  const filteredCards = deckCards.filter((c: any) => (c.front || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.back || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 pb-6 relative overflow-hidden">
      <Header title={currentDeck?.title.split(' ').slice(1).join(' ') || "Deck"} subtitle={`${currentIndex + 1} / ${deckCards.length} Cards`} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<div className="flex items-center gap-2">{activeDeckOverride && onComplete && (<button onClick={() => onComplete(activeDeckOverride.id, 50, currentDeck.title)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"><Check size={14}/> Complete</button>)}<button onClick={() => setManageMode(!manageMode)} className={`p-2 rounded-full transition-colors ${manageMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{manageMode ? <X size={20} /> : <List size={20} />}</button></div>} />
      
      {isSelectorOpen && (<><div className="absolute top-24 left-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-4 max-h-[60vh] overflow-y-auto custom-scrollbar">{Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => handleDeckChange(key)} className={`w-full text-left p-3 rounded-xl font-bold text-sm mb-1 flex justify-between items-center ${selectedDeckKey === key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}><span>{deck.title}</span><span className="text-xs bg-white px-2 py-1 rounded border border-slate-100 text-slate-400">{deck.cards?.length || 0}</span></button>))}</div><div className="absolute inset-0 z-40 bg-black/5 backdrop-blur-[1px]" onClick={() => setIsSelectorOpen(false)} /></>)}
      {!manageMode && (<div className="px-6 mt-2 mb-2 z-10"><div className="flex bg-slate-200 p-1 rounded-xl w-full max-w-sm mx-auto overflow-x-auto shadow-inner">{['study', 'quiz', 'match'].map((mode) => (<button key={mode} onClick={() => setGameMode(mode)} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg whitespace-nowrap capitalize transition-all ${gameMode === mode ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>{mode}</button>))}</div></div>)}
      
      <div className="flex-1 relative w-full">
        {manageMode ? (
            <div className="absolute inset-0 overflow-y-auto p-6 pb-24 custom-scrollbar">
                 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><List size={18}/> Deck Manager</h3>
                 <div className="relative mb-6"><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`Search ${deckCards.length} cards...`} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm" /></div>
                 {selectedDeckKey === 'custom' && (<div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-6"><h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2"><PlusCircle size={14}/> Quick Add</h4><div className="flex gap-2 mb-2"><input placeholder="Word" value={quickAddData.front} onChange={(e) => setQuickAddData({...quickAddData, front: e.target.value})} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-sm font-bold" /><select value={quickAddData.type} onChange={(e) => setQuickAddData({...quickAddData, type: e.target.value})} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs"><option value="noun">Noun</option><option value="verb">Verb</option><option value="phrase">Phrase</option></select></div><div className="flex gap-2"><input placeholder="Meaning" value={quickAddData.back} onChange={(e) => setQuickAddData({...quickAddData, back: e.target.value})} className="flex-1 p-2 bg-slate-50 rounded border border-slate-200 text-sm" /><button onClick={handleQuickAdd} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"><Plus size={18}/></button></div></div>)}
                 <div className="space-y-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cards in Deck</p>{filteredCards.map((c: any, idx: number) => (<button key={idx} onClick={() => { setCurrentIndex(deckCards.indexOf(c)); setManageMode(false); }} className="w-full bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center hover:border-indigo-300 transition-colors text-left group"><div><span className="font-bold text-slate-800">{c.front}</span><span className="text-slate-400 mx-2">•</span><span className="text-sm text-slate-500 group-hover:text-indigo-600 transition-colors">{c.back}</span></div><ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400" /></button>))}{filteredCards.length === 0 && <p className="text-slate-400 text-sm italic text-center py-4">No cards found matching your search.</p>}</div>
            </div>
        ) : (
            <div className="absolute inset-0 flex flex-col">
                {gameMode === 'match' && <div className="h-full overflow-y-auto"><MatchingGame deckCards={deckCards} onGameEnd={handleGameEnd} /></div>}
                {gameMode === 'quiz' && <div className="h-full overflow-y-auto"><QuizGame deckCards={deckCards} onGameEnd={handleGameEnd} /></div>}
                
                {gameMode === 'study' && card && (
                    <div 
                        className="flex-1 flex flex-col items-center justify-center px-4 py-2 perspective-1000 relative z-0" 
                        style={{ perspective: '1000px', touchAction: 'pan-y' }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp} // Safety: if mouse leaves card, finish swipe
                    >
                        <div 
                            className="relative w-full h-full max-h-[520px] cursor-pointer shadow-2xl rounded-[2rem]"
                            style={{ 
                                transformStyle: 'preserve-3d', 
                                transition: 'transform 0.6s', 
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                            }}
                            onClick={() => !xrayMode && setIsFlipped(!isFlipped)}
                        >
                            {/* FRONT SIDE */}
                            <div 
                                className="absolute inset-0 bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col select-none"
                                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                            >
                                <div className={`h-3 w-full ${xrayMode ? theme.bg.replace('50', '500') : 'bg-slate-100'} transition-colors duration-500`} />
                                <div className="flex-1 flex flex-col p-6 relative">
                                    <div className="flex justify-between items-start mb-8"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>{card.type}</span><span className="text-xs font-mono text-slate-300">{currentIndex + 1}/{deckCards.length}</span></div>
                                    <div className="flex-1 flex flex-col items-center justify-center mt-[-40px]">
                                        <h2 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 text-center mb-6 leading-tight select-none">{card.front}</h2>
                                        <div onClick={(e) => { e.stopPropagation(); playAudio(card.front); }} className="flex items-center gap-3 bg-slate-50 pl-3 pr-5 py-2 rounded-full border border-slate-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors group active:scale-95 shadow-sm"><div className="p-2 bg-white rounded-full shadow-sm text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all"><Volume2 size={16} /></div><span className="font-serif text-slate-500 text-lg tracking-wide group-hover:text-indigo-800 select-none">{card.ipa || "/.../"}</span></div>
                                    </div>
                                    <div className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 transition-all duration-500 ease-in-out flex flex-col overflow-hidden z-20 ${xrayMode ? 'h-[75%] opacity-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]' : 'h-0 opacity-0'}`} onClick={e => e.stopPropagation()}>
                                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                            <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Puzzle size={14} /> Morphology</h4><div className="flex flex-wrap gap-2">{Array.isArray(card.morphology) && card.morphology.map((m: any, i: number) => (<div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[60px]"><span className={`font-bold text-lg ${m.type === 'root' ? 'text-indigo-600' : 'text-slate-700'}`}>{m.part}</span><span className="text-slate-400 text-[9px] font-medium uppercase mt-1 text-center max-w-[80px] leading-tight">{m.meaning}</span></div>))}</div></div>
                                            <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare size={14} /> Context</h4><div className={`p-4 rounded-xl border ${theme.border} ${theme.bg}`}><p className="text-slate-800 font-serif font-medium text-lg mb-1">"{card.usage?.sentence || '...'}"</p><p className={`text-sm ${theme.text} opacity-80 italic`}>{card.usage?.translation || '...'}</p></div></div>
                                            <div className="flex gap-2">{card.grammar_tags?.map((tag: string, i: number) => (<span key={i} className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded border border-slate-200">{tag}</span>))}</div>
                                        </div>
                                    </div>
                                    {!xrayMode && (<div className="mt-auto text-center"><p className="text-xs text-slate-300 font-bold uppercase tracking-widest animate-pulse flex items-center justify-center gap-2"><ArrowLeft size={10}/> Swipe <ArrowRight size={10}/></p></div>)}
                                </div>
                            </div>

                            {/* BACK SIDE */}
                            <div 
                                className="absolute inset-0 bg-slate-900 rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-8 text-white relative overflow-hidden select-none"
                                style={{ 
                                    backfaceVisibility: 'hidden', 
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)' 
                                }}
                            >
                                <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col items-center"><span className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border-b border-indigo-500/30 pb-2">Translation</span><h2 className="text-3xl md:text-4xl font-bold text-center mb-8 leading-tight">{card.back}</h2></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {gameMode === 'study' && !manageMode && card && (
        <div className="px-6 pb-4 pt-2">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <button onClick={handlePrev} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-rose-50"><X size={28} strokeWidth={2.5} /></button>
            <button onClick={(e) => { e.stopPropagation(); if(isFlipped) setIsFlipped(false); setXrayMode(!xrayMode); }} className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 border-2 ${xrayMode ? 'bg-indigo-600 border-indigo-600 text-white translate-y-[-8px] shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}><Search size={28} strokeWidth={xrayMode ? 3 : 2} className={xrayMode ? 'animate-pulse' : ''} /><span className="text-[10px] font-black tracking-wider mt-1">X-RAY</span></button>
            <button onClick={handleNext} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-emerald-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-emerald-50"><Check size={28} strokeWidth={2.5} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
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
            {/* --- UPDATED VOCAB BLOCK START --- */}
            {block.type === 'vocab-list' && (
              <div className="grid grid-cols-1 gap-3">
                {block.items.map((item: any, i:number) => (
                  <div key={i} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                    <div className="flex flex-col gap-2">
                        {/* Term Header */}
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <span className="font-bold text-lg text-slate-800">{item.term}</span>
                        </div>
                        {/* Definition Body */}
                        <div className="pl-3.5 border-l-2 border-slate-100">
                            <span className="text-slate-600 text-sm leading-relaxed block">{item.definition}</span>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* --- UPDATED VOCAB BLOCK END --- */}

            {block.type === 'image' && (<div className="rounded-xl overflow-hidden shadow-sm border border-slate-200"><img src={block.url} alt="Lesson illustration" className="w-full h-auto object-cover" />{block.caption && <div className="p-2 bg-slate-50 text-xs text-center text-slate-500 italic">{block.caption}</div>}</div>)}
          </div>
        ))}
        <div ref={bottomRef} className="pt-8">{!isComplete ? (<button onClick={handleNext} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"><span>Continue</span> <ChevronDown /></button>) : (<button onClick={() => onFinish(lesson.id, lesson.xp || 50, lesson.title)} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-600 active:scale-95 transition-all animate-bounce">Complete Lesson (+{lesson.xp || 50} XP)</button>)}</div>
      </div>
    </div>
  );
}

function ClassForum({ classId, user, userData }: any) {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');

  // 1. Sync Threads for this Class
  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'forum_threads'), 
      where('classId', '==', classId),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [classId]);

  // 2. Create a New Thread
  const handleCreateThread = async (e: any) => {
    e.preventDefault();
    if (!newThread.title.trim() || !newThread.content.trim()) return;

    await addDoc(collection(db, 'artifacts', appId, 'forum_threads'), {
      classId,
      title: newThread.title,
      content: newThread.content,
      authorName: userData?.name || user.email.split('@')[0],
      authorEmail: user.email,
      authorRole: userData?.role || 'student',
      timestamp: Date.now(),
      replies: []
    });
    setNewThread({ title: '', content: '' });
    setIsCreating(false);
  };

  // 3. Post a Reply
  const handleReply = async (e: any) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeThread) return;

    const reply = {
      id: Date.now().toString(),
      content: replyContent,
      authorName: userData?.name || user.email.split('@')[0],
      authorRole: userData?.role || 'student',
      timestamp: Date.now()
    };

    const threadRef = doc(db, 'artifacts', appId, 'forum_threads', activeThread.id);
    await updateDoc(threadRef, {
      replies: arrayUnion(reply)
    });
    
    // Optimistic update
    setActiveThread((prev: any) => ({ ...prev, replies: [...(prev.replies || []), reply] }));
    setReplyContent('');
  }; 

  // --- RENDER: THREAD DETAIL VIEW ---
  if (activeThread) {
    return (
      <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex items-start gap-3 sticky top-0 z-10">
          <button onClick={() => setActiveThread(null)} className="mt-1 text-slate-400 hover:text-indigo-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="font-bold text-lg text-slate-800 leading-snug">{activeThread.title}</h3>
            <p className="text-xs text-slate-500">
              Posted by <span className="font-bold text-indigo-600">{activeThread.authorName}</span> • {new Date(activeThread.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
              <p className="text-slate-700 whitespace-pre-wrap">{activeThread.content}</p>
          </div>

          {activeThread.replies?.map((reply: any) => (
            <div key={reply.id} className={`flex flex-col ${reply.authorRole === 'instructor' ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                 reply.authorRole === 'instructor' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-200 text-slate-800 rounded-tl-none'
               }`}>
                  <p className="font-bold text-[10px] opacity-70 mb-1">{reply.authorName}</p>
                  <p>{reply.content}</p>
               </div>
               <span className="text-[10px] text-slate-400 mt-1">{new Date(reply.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleReply} className="flex gap-2">
            <input 
              className="flex-1 bg-slate-100 border-0 rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 active:scale-95 transition-transform">
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: THREAD LIST VIEW ---
  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-600"/> Class Forum
          </h3>
          <button onClick={() => setIsCreating(true)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors">
            + New Post
          </button>
       </div>

       {isCreating && (
         <div className="bg-white p-4 rounded-xl border-2 border-indigo-100 mb-4 animate-in slide-in-from-top-2">
            <input 
              className="w-full font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 focus:outline-none placeholder:font-normal"
              placeholder="Topic Title..."
              value={newThread.title}
              onChange={e => setNewThread({...newThread, title: e.target.value})}
              autoFocus
            />
            <textarea 
              className="w-full text-sm text-slate-600 bg-slate-50 p-2 rounded-lg resize-none focus:outline-none mb-2"
              rows={3}
              placeholder="What's on your mind?"
              value={newThread.content}
              onChange={e => setNewThread({...newThread, content: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
              <button onClick={handleCreateThread} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Post</button>
            </div>
         </div>
       )}

       <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar">
          {threads.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic">No discussions yet. Start one!</div>
          ) : (
            threads.map(thread => (
              <div 
                key={thread.id} 
                onClick={() => setActiveThread(thread)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 line-clamp-1">{thread.title}</h4>
                  {thread.authorRole === 'instructor' && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Instructor</span>}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{thread.content}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{thread.authorName.charAt(0)}</span>
                    <span>{thread.authorName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><MessageSquare size={12}/> {thread.replies?.length || 0}</span>
                    <span>{new Date(thread.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
       </div>
    </div>
  );
}
function StudentGradebook({ classData, user }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch User's Activity Logs
  useEffect(() => {
    if (!user?.email) return;
    
    const q = query(
      collection(db, 'artifacts', appId, 'activity_logs'), 
      where('studentEmail', '==', user.email),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // 2. Calculate Stats
  const assignments = classData.assignments || [];
  
  const processedData = assignments.map((assign: any) => {
      // Find the BEST score log for this assignment (if multiple attempts)
      const attempts = logs.filter(l => l.itemTitle === assign.title); // Matching by title is safer in this mini-LMS structure
      const bestAttempt = attempts.reduce((prev, current) => {
          const prevScore = prev?.scoreDetail?.score || 0;
          const currScore = current?.scoreDetail?.score || 0;
          return currScore > prevScore ? current : prev;
      }, null);

      const isCompleted = attempts.length > 0;
      
      return {
          ...assign,
          isCompleted,
          bestScore: bestAttempt?.scoreDetail,
          lastAttemptDate: attempts[0]?.timestamp,
          attemptsCount: attempts.length
      };
  });

  const completedCount = processedData.filter((d: any) => d.isCompleted).length;
  const totalCount = processedData.length;
  
  // Calculate Average Grade (only for Graded items like Quizzes/Exams)
  const gradedItems = processedData.filter((d: any) => d.bestScore);
  const totalScore = gradedItems.reduce((acc: number, curr: any) => acc + (curr.bestScore.score / curr.bestScore.total), 0);
  const averageGrade = gradedItems.length > 0 ? Math.round((totalScore / gradedItems.length) * 100) : 0;

  if (loading) return <div className="p-12 text-center text-slate-400"><Loader className="animate-spin mx-auto mb-2"/>Loading grades...</div>;

  return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* OVERVIEW CARD */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
              {/* Grade Circle */}
              <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * averageGrade) / 100} className={`${averageGrade >= 90 ? 'text-emerald-400' : averageGrade >= 70 ? 'text-indigo-500' : 'text-amber-400'} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-800">{averageGrade}%</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Avg. Score</span>
                  </div>
              </div>
              
              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                      <span className="block text-2xl font-black text-indigo-600">{completedCount}/{totalCount}</span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Assignments Done</span>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                      <span className="block text-2xl font-black text-amber-500">{gradedItems.length}</span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Quizzes Taken</span>
                  </div>
              </div>
          </div>

          {/* DETAILED LIST */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500"/> Performance Detail</h3>
              </div>
              <div className="divide-y divide-slate-100">
                  {processedData.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                  {item.contentType === 'test' ? <HelpCircle size={18}/> : item.contentType === 'deck' ? <Layers size={18}/> : <FileText size={18}/>}
                              </div>
                              <div>
                                  <h4 className={`font-bold text-sm ${item.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{item.title}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 rounded">{item.contentType || 'Lesson'}</span>
                                      {item.lastAttemptDate && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(item.lastAttemptDate).toLocaleDateString()}</span>}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="text-right">
                              {item.bestScore ? (
                                  <div>
                                      <span className={`block font-black text-lg ${item.bestScore.score / item.bestScore.total >= 0.7 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                          {Math.round((item.bestScore.score / item.bestScore.total) * 100)}%
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.bestScore.score}/{item.bestScore.total} Correct</span>
                                  </div>
                              ) : item.isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Complete</span>
                              ) : (
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">-</span>
                              )}
                          </div>
                      </div>
                  ))}
                  {processedData.length === 0 && <div className="p-8 text-center text-slate-400 italic">No assignments to track.</div>}
              </div>
          </div>
      </div>
  );
}
function StudentClassView({ classData, onBack, onSelectLesson, onSelectDeck, userData, user, displayName }: any) {
  const [viewMode, setViewMode] = useState<'assignments' | 'forum' | 'grades'>('assignments');
  const completedSet = new Set(userData?.completedAssignments || []);
  
  const relevantAssignments = (classData.assignments || []).filter((l: any) => !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email));
  const pendingCount = relevantAssignments.filter((l: any) => !completedSet.has(l.id)).length;
  const completedCount = relevantAssignments.length - pendingCount;
  const progressPercent = relevantAssignments.length > 0 ? (completedCount / relevantAssignments.length) * 100 : 0;

  const handleAssignmentClick = (assignment: any) => { 
      if (assignment.contentType === 'deck') onSelectDeck(assignment); 
      else onSelectLesson(assignment); 
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* --- JUICY HEADER --- */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 pb-20 pt-10 px-6 rounded-b-[3rem] shadow-2xl z-10 shrink-0">
          <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] bg-indigo-400/30 rounded-full blur-[80px] mix-blend-overlay pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-purple-300/20 rounded-full blur-[60px] mix-blend-overlay pointer-events-none"></div>
          
          <div className="relative z-20 flex justify-between items-start mb-6">
              <button onClick={onBack} className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Back
              </button>
              <div className="bg-black/20 backdrop-blur-md border border-white/10 text-white font-mono font-bold px-3 py-1 rounded-lg shadow-sm text-xs">
                  {classData.code}
              </div>
          </div>

          <div className="relative z-20 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mx-auto mb-4">
                  {classData.name.charAt(0)}
              </div>
              <h1 className="text-3xl font-serif font-bold text-white mb-2 drop-shadow-md leading-tight">{classData.name}</h1>
              <p className="text-indigo-100 text-sm opacity-80 mb-6">Student Portal • {displayName}</p>
              
              {/* TAB SWITCHER */}
              <div className="inline-flex bg-white/10 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-inner">
                  <button onClick={() => setViewMode('assignments')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'assignments' ? 'bg-white text-indigo-700 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                      <BookOpen size={16} className={viewMode === 'assignments' ? 'fill-current' : ''}/> Tasks
                  </button>
                  <button onClick={() => setViewMode('grades')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'grades' ? 'bg-white text-indigo-700 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                      <BarChart3 size={16} className={viewMode === 'grades' ? 'fill-current' : ''}/> Grades
                  </button>
                  <button onClick={() => setViewMode('forum')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'forum' ? 'bg-white text-indigo-700 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                      <MessageSquare size={16} className={viewMode === 'forum' ? 'fill-current' : ''}/> Forum
                  </button>
              </div>
          </div>
      </div>
      
      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto pb-24 -mt-8 relative z-20 px-6 space-y-6">
        
        {viewMode === 'grades' && (
            <StudentGradebook classData={classData} user={user} />
        )}

        {viewMode === 'assignments' && (
            <>
                {/* Progress Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-indigo-900/5 border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Your Progress</p>
                        <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-slate-800">{Math.round(progressPercent)}%</span><span className="text-sm font-bold text-indigo-600">Complete</span></div>
                        <div className="mt-3 flex gap-1 h-2 w-32 bg-slate-100 rounded-full overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000" style={{width: `${progressPercent}%`}}></div></div>
                    </div>
                    <div className="text-right relative z-10">
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 group-hover:border-indigo-200 transition-colors text-center min-w-[90px]">
                            <span className={`text-3xl font-black ${pendingCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{pendingCount}</span>
                            <span className="block text-[10px] text-indigo-400 font-bold uppercase mt-1">To Do</span>
                        </div>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {relevantAssignments.length > 0 ? ( relevantAssignments.map((l: any, i: number) => {
                        const isDone = completedSet.has(l.id);
                        return (
                            <button 
                                key={`${l.id}-${i}`} 
                                onClick={() => handleAssignmentClick(l)} 
                                className={`w-full p-4 rounded-2xl border flex items-center justify-between active:scale-[0.98] transition-all group relative overflow-hidden ${isDone ? 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-lg'}`}
                            >
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                                        isDone 
                                            ? 'bg-emerald-100 text-emerald-600' 
                                            : l.contentType === 'deck' 
                                                ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white' 
                                                : l.contentType === 'test'
                                                    ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white'
                                                    : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white'
                                    }`}>
                                        {isDone ? <Check size={20} strokeWidth={3}/> : l.contentType === 'deck' ? <Layers size={20}/> : l.contentType === 'test' ? <HelpCircle size={20}/> : <PlayCircle size={20}/>}
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-bold text-sm ${isDone ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800 group-hover:text-indigo-700'}`}>{l.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
                                                {l.contentType === 'deck' ? 'Flashcards' : l.contentType === 'test' ? 'Exam' : 'Lesson'}
                                            </span>
                                            {!isDone && l.xp && <span className="text-[10px] font-bold text-emerald-600">+{l.xp} XP</span>}
                                        </div>
                                    </div>
                                </div>
                                {!isDone && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>}
                            </button> 
                        );
                    })) : ( 
                        <div className="p-10 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">No assignments yet.</div> 
                    )}
                </div>
            </>
        )}
        
        {viewMode === 'forum' && (
            <div className="h-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <ClassForum classId={classData.id} user={user} userData={userData} />
            </div>
        )}
      </div>
    </div>
  );
}
// --- AD-LIB TEMPLATES ---
const ADLIB_TEMPLATES = [
  { id: 1, text: "The [ADJ] general decided to [VERB] the [NOUN].", blanks: ['ADJ', 'VERB', 'NOUN'] },
  { id: 2, text: "Never [VERB] with a [NOUN] in your pocket.", blanks: ['VERB', 'NOUN'] },
  { id: 3, text: "I saw a [NOUN] that was very [ADJ].", blanks: ['NOUN', 'ADJ'] },
  { id: 4, text: "Please, [VERB] my [NOUN] gently.", blanks: ['VERB', 'NOUN'] },
  { id: 5, text: "A [ADJ] philosopher always knows how to [VERB].", blanks: ['ADJ', 'VERB'] }
];

function DailyDiscoveryWidget({ allDecks, user, userData }: any) {
  // View States
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'study' | 'game'>('study');
  const [saving, setSaving] = useState(false);
  
  // Study Navigation State
  const [sessionCards, setSessionCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Game State
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [gameSlots, setGameSlots] = useState<any>({});
  const [gameStep, setGameStep] = useState(0);

  // Swipe State
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const minSwipeDistance = 50; 

  // Preference
  const preferredDeckId = userData?.widgetDeckId || 'all';

  // --- AUDIO ENGINE ---
  const playAudio = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes('en-US'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    let sourceCards: any[] = [];
    if (preferredDeckId === 'all' || !allDecks[preferredDeckId]) {
        Object.values(allDecks).forEach((deck: any) => {
            if (deck.cards && Array.isArray(deck.cards)) sourceCards.push(...deck.cards);
        });
    } else {
        sourceCards = allDecks[preferredDeckId]?.cards || [];
    }

    if (sourceCards.length > 0) {
        const shuffled = [...sourceCards].sort(() => 0.5 - Math.random());
        setSessionCards(shuffled.slice(0, 10));
        setCurrentIndex(0);
        
        // Random Template
        const randomTemp = ADLIB_TEMPLATES[Math.floor(Math.random() * ADLIB_TEMPLATES.length)];
        setCurrentTemplate(randomTemp);
        setGameSlots({});
        setGameStep(0);
    } else {
        setSessionCards([]);
    }
  }, [allDecks, preferredDeckId]);

  // --- HANDLERS ---
  const handleDeckSelect = async (deckId: string) => {
    // ROBUST FIX: Check props first, then fall back to global auth
    const targetUid = user?.uid || auth.currentUser?.uid;

    if (!targetUid) {
        console.error("Cannot save preference: Missing User ID");
        alert("Error: Could not identify user to save settings.");
        return;
    }

    setSaving(true);
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'profile', 'main'), { 
            widgetDeckId: deckId 
        });
        setShowSettings(false);
        setIsFlipped(false);
    } catch (e: any) { 
        console.error("Save failed:", e);
        alert("Failed to save preference: " + e.message);
    } finally { 
        setSaving(false); 
    }
  };

  const handleGameSelect = (card: any) => {
      setGameSlots({ ...gameSlots, [gameStep]: card });
      playAudio(card.front); 
      if (gameStep < currentTemplate.blanks.length - 1) setGameStep(prev => prev + 1);
  };

  const resetGame = () => {
      setGameSlots({});
      setGameStep(0);
      setCurrentTemplate(ADLIB_TEMPLATES[Math.floor(Math.random() * ADLIB_TEMPLATES.length)]);
  };

  const playStory = () => {
      if (!currentTemplate) return;
      let story = currentTemplate.text;
      currentTemplate.blanks.forEach((type: string, idx: number) => {
          const card = gameSlots[idx];
          const replacement = card ? card.back : "something"; 
          story = story.replace(`[${type}]`, replacement);
      });
      playAudio(story);
  };

  // --- NAVIGATION ---
  const handleNext = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(prev => (prev + 1) % sessionCards.length), 200); };
  const handlePrev = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(prev => (prev - 1 + sessionCards.length) % sessionCards.length), 200); };

  const onPointerDown = (e: React.PointerEvent) => { setDragEndX(null); setDragStartX(e.clientX); };
  const onPointerMove = (e: React.PointerEvent) => { if (dragStartX !== null) setDragEndX(e.clientX); };
  const onPointerUp = () => {
    if (dragStartX === null || dragEndX === null) { setDragStartX(null); return; }
    const distance = dragStartX - dragEndX;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
    setDragStartX(null); setDragEndX(null);
  };

  const currentCard = sessionCards[currentIndex];
  const currentDeckTitle = preferredDeckId === 'all' ? "All Collections" : (allDecks[preferredDeckId]?.title || "Unknown Deck");
  const isGameComplete = currentTemplate && Object.keys(gameSlots).length === currentTemplate.blanks.length;

  return (
    <div className="mx-6 mt-6 animate-in slide-in-from-bottom-2 duration-700 relative z-0">
      <div className="flex justify-between items-end mb-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Daily Discovery
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setViewMode(viewMode === 'study' ? 'game' : 'study')} className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm ${viewMode === 'game' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-100'}`}>
                {viewMode === 'study' ? <Gamepad2 size={12}/> : <Layers size={12}/>}
                {viewMode === 'study' ? "Play Ad-Lib" : "Study"}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-indigo-100 transition-colors shadow-sm">
                {showSettings ? <X size={12}/> : <Settings size={12}/>}
            </button>
          </div>
      </div>
      
      {showSettings ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-5 animate-in fade-in zoom-in duration-200 relative z-20">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Select Source Deck</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  <button onClick={() => handleDeckSelect('all')} disabled={saving} className={`w-full p-4 rounded-xl text-left flex items-center gap-3 transition-all ${preferredDeckId === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>
                      <div className={`p-2 rounded-full ${preferredDeckId === 'all' ? 'bg-white/20' : 'bg-white shadow-sm'}`}><Layers size={16}/></div>
                      <span className="font-bold text-sm">All Collections</span>
                      {preferredDeckId === 'all' && <CheckCircle2 size={18} className="ml-auto"/>}
                  </button>
                  {Object.entries(allDecks).map(([key, deck]: any) => (
                      <button key={key} onClick={() => handleDeckSelect(key)} disabled={saving} className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${preferredDeckId === key ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>
                          <div className={`p-2 rounded-full ${preferredDeckId === key ? 'bg-white/20' : 'bg-white shadow-sm'}`}><BookOpen size={16}/></div>
                          <div className="flex-1 overflow-hidden"><p className="font-bold text-sm truncate">{deck.title}</p><p className={`text-[10px] ${preferredDeckId === key ? 'text-indigo-200' : 'text-slate-400'}`}>{deck.cards?.length || 0} cards</p></div>
                          {preferredDeckId === key && <CheckCircle2 size={18} className="ml-auto"/>}
                      </button>
                  ))}
              </div>
          </div>
      ) : viewMode === 'game' ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative min-h-[14rem] flex flex-col">
              <div className="bg-purple-600 p-4 text-white flex justify-between items-center"><span className="text-[10px] font-bold uppercase tracking-widest opacity-80">The Drunken Scribe</span><div className="flex gap-1">{currentTemplate?.blanks.map((_: any, i: number) => (<div key={i} className={`w-2 h-2 rounded-full ${i < Object.keys(gameSlots).length ? 'bg-green-400' : 'bg-purple-800'}`} />))}</div></div>
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                  {isGameComplete ? (
                      <div className="animate-in zoom-in duration-300 w-full">
                          <p className="font-serif text-xl font-bold text-slate-800 leading-relaxed mb-6">
                              {(() => {
                                  let story = currentTemplate.text;
                                  currentTemplate.blanks.forEach((type: string, idx: number) => { const card = gameSlots[idx]; const word = card ? card.back : "___"; story = story.replace(`[${type}]`, `<span class="text-purple-600 font-bold">${word}</span>`); });
                                  return <span dangerouslySetInnerHTML={{__html: story}} />;
                              })()}
                          </p>
                          <div className="flex gap-3 justify-center"><button onClick={playStory} className="flex-1 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-200"><Volume2 size={16}/> Read Story</button><button onClick={resetGame} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800">New Story</button></div>
                      </div>
                  ) : (
                      <div className="w-full"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pick a <span className="text-purple-600">{currentTemplate?.blanks[gameStep]}</span></p><div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">{sessionCards.map((card, idx) => (<button key={idx} onClick={() => handleGameSelect(card)} className="snap-center min-w-[140px] bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-all group"><span className="font-bold text-slate-800 text-lg">{card.front}</span><span className="text-[10px] bg-white px-2 py-1 rounded text-slate-400 border border-slate-100 uppercase font-bold group-hover:text-purple-500">{card.type}</span></button>))}</div></div>
                  )}
              </div>
          </div>
      ) : currentCard ? (
          <div className="relative h-56 w-full cursor-pointer group perspective-1000 touch-pan-y select-none" style={{ perspective: '1000px' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
            <div className="absolute top-2 left-4 right-4 bottom-0 bg-indigo-300/40 rounded-[2rem] transform scale-95 translate-y-2 z-0" />
            <div className="absolute top-4 left-8 right-8 bottom-0 bg-indigo-200/30 rounded-[2rem] transform scale-90 translate-y-3 z-0" />
            <div className="relative w-full h-full shadow-2xl rounded-[2rem] transition-transform duration-500 z-10" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }} onClick={() => setIsFlipped(!isFlipped)}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white flex flex-col justify-between overflow-hidden shadow-indigo-200" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div><div className="flex justify-between items-start relative z-10"><span className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-1.5 shadow-sm"><Layers size={10} className="text-indigo-200" /> {currentIndex + 1} / {sessionCards.length}</span><div className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-90 border border-white/5 shadow-sm" onClick={(e) => { e.stopPropagation(); playAudio(currentCard.front); }}><Volume2 size={20} className="text-white"/></div></div><div className="text-center relative z-10 mt-2"><h2 className="text-4xl font-serif font-bold mb-2 drop-shadow-md">{currentCard.front}</h2><div className="inline-block px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm"><p className="text-indigo-100 font-serif text-sm tracking-wide">{currentCard.ipa || '/.../'}</p></div></div><div className="text-center relative z-10"><p className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest animate-pulse flex items-center justify-center gap-2"><ArrowLeft size={10}/> Swipe <ArrowRight size={10}/></p></div></div>
              <div className="absolute inset-0 bg-white rounded-[2rem] p-6 border border-slate-200 flex flex-col justify-center items-center text-center shadow-sm" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><div className="flex-1 flex flex-col items-center justify-center w-full"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 bg-slate-50 px-2 py-1 rounded-md">Definition</span><h3 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">{currentCard.back}</h3>{currentCard.usage?.sentence && (<div className="bg-slate-50 p-4 rounded-xl w-full border border-slate-100 text-left relative"><div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div><p className="text-sm text-slate-600 italic font-serif leading-relaxed pl-2">"{currentCard.usage.sentence}"</p></div>)}</div><div className="mt-auto text-[10px] text-slate-300 font-bold uppercase flex items-center gap-2"><ArrowLeft size={10}/> Next Card <ArrowRight size={10}/></div></div>
            </div>
          </div>
      ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center h-56"><div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-300"><Layers size={24} /></div><p className="text-slate-500 font-bold mb-1">No cards in this deck.</p><button onClick={() => setShowSettings(true)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Change Source</button></div>
      )}
    </div>
  );
}
function ColosseumMode({ allDecks, user, onExit, onXPUpdate }: any) {
  // Game State
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15);
  
  // Question State
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [pool, setPool] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 1. Initialize the "Infinite Pool"
  useEffect(() => {
    let combined: any[] = [];
    Object.values(allDecks).forEach((deck: any) => {
      if (deck.cards && Array.isArray(deck.cards)) {
        combined = [...combined, ...deck.cards];
      }
    });
    // Shuffle the entire universe of cards
    setPool(combined.sort(() => 0.5 - Math.random()));
  }, [allDecks]);

  // 2. Timer Logic
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;
    
    if (timeLeft <= 0) {
        handleWrongAnswer();
        return;
    }

    const timer = setInterval(() => {
        setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameState, isPaused]);

  // 3. Generate a Round
  const nextRound = () => {
    if (lives <= 0) {
        setGameState('gameover');
        // Award XP: Score / 2
        if (score > 0) onXPUpdate(Math.ceil(score / 2), `Colosseum Run (Round ${round})`);
        return;
    }

    // Pick a card (Cyclical logic if pool is small, or random pick)
    const target = pool[Math.floor(Math.random() * pool.length)];
    if (!target) return; // Safety

    // Generate Distractors
    const others = pool.filter(c => c.id !== target.id);
    const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);
    const roundOptions = [target, ...distractors].sort(() => 0.5 - Math.random());

    setCurrentCard(target);
    setOptions(roundOptions);
    setSelectedId(null);
    
    // Difficulty Scaling: Less time as rounds progress
    const baseTime = Math.max(5, 15 - Math.floor(round / 5)); 
    setTimeLeft(baseTime);
  };

  const handleStart = () => {
      setLives(3);
      setScore(0);
      setRound(1);
      setGameState('playing');
      nextRound();
  };

  const handleAnswer = (answerId: string) => {
      if (selectedId) return; // Prevent double taps
      setSelectedId(answerId);
      setIsPaused(true); // Pause timer while showing result

      if (answerId === currentCard.id) {
          // Correct
          setTimeout(() => {
              setScore(s => s + 10 + (timeLeft * 2)); // Speed bonus
              setRound(r => r + 1);
              setIsPaused(false);
              nextRound();
          }, 800);
      } else {
          // Wrong
          setTimeout(() => {
              setLives(l => l - 1);
              setIsPaused(false);
              // If that was the last life, nextRound handles gameover
              if (lives <= 1) {
                  setGameState('gameover');
                  onXPUpdate(Math.ceil(score / 2), `Colosseum Run (Round ${round})`);
              } else {
                  nextRound();
              }
          }, 1000);
      }
  };

  // Helper for Time-out
  const handleWrongAnswer = () => {
      setLives(l => l - 1);
      if (lives <= 1) {
          setGameState('gameover');
          onXPUpdate(Math.ceil(score / 2), `Colosseum Run (Round ${round})`);
      } else {
          nextRound();
      }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
        
        {/* BACKGROUND ANIMATION */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[800px] h-[800px] bg-rose-900/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-50%] right-[-50%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        {gameState === 'intro' && (
            <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 text-center shadow-2xl relative z-10">
                <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner">
                    <Swords size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">The Colosseum</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Endless challenges. <br/>
                    <strong>3 Lives.</strong> Increasing speed. <br/>
                    How long can you survive?
                </p>
                <div className="space-y-3">
                    <button onClick={handleStart} className="w-full py-4 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all">
                        Enter Arena
                    </button>
                    <button onClick={onExit} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600">
                        Retreat
                    </button>
                </div>
            </div>
        )}

        {gameState === 'playing' && currentCard && (
            <div className="w-full max-w-md relative z-10 flex flex-col h-full max-h-[800px]">
                {/* HUD */}
                <div className="flex justify-between items-center mb-6 text-white">
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} size={24} className={`${i < lives ? 'fill-rose-500 text-rose-500' : 'fill-slate-800 text-slate-700'} transition-all`} />
                        ))}
                    </div>
                    <div className="font-mono font-bold text-2xl text-amber-400 drop-shadow-md">{score} pts</div>
                </div>

                {/* TIMER BAR */}
                <div className="w-full h-3 bg-white/10 rounded-full mb-8 overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-rose-500' : 'bg-emerald-400'}`} 
                        style={{ width: `${(timeLeft / (Math.max(5, 15 - Math.floor(round / 5)))) * 100}%` }}
                    />
                </div>

                {/* QUESTION CARD */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] text-center mb-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-indigo-500"></div>
                        <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2 block">Round {round}</span>
                        <h2 className="text-4xl font-serif font-bold text-white mb-2">{currentCard.front}</h2>
                        <p className="text-white/50 text-sm italic">{currentCard.type}</p>
                    </div>

                    <div className="grid gap-3">
                        {options.map((opt) => {
                            let style = "bg-white text-slate-800 hover:bg-slate-50";
                            if (selectedId) {
                                if (opt.id === currentCard.id) style = "bg-emerald-500 text-white border-emerald-500";
                                else if (opt.id === selectedId) style = "bg-rose-500 text-white border-rose-500";
                                else style = "bg-slate-800 text-slate-500 opacity-50";
                            }

                            return (
                                <button
                                    key={opt.id}
                                    disabled={!!selectedId}
                                    onClick={() => handleAnswer(opt.id)}
                                    className={`p-5 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 ${style}`}
                                >
                                    {opt.back}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {gameState === 'gameover' && (
            <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 text-center shadow-2xl relative z-10 animate-in zoom-in">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Skull size={48} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-1">{score}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Final Score</p>
                
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                    <p className="text-indigo-700 font-bold text-sm">+{Math.ceil(score / 2)} XP Earned</p>
                </div>

                <div className="space-y-3">
                    <button onClick={handleStart} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700">
                        Try Again
                    </button>
                    <button onClick={onExit} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600">
                        Leave Arena
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}
function HomeView({ setActiveTab, lessons, onSelectLesson, userData, assignments, classes, onSelectClass, onSelectDeck, allDecks, user }: any) {
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  
  // --- NEW: COLOSSEUM STATE ---
  const [showColosseum, setShowColosseum] = useState(false);

  // --- 1. SMART NAME RESOLVER ---
  const displayName = useMemo(() => {
      // Priority 1: Custom Profile Name (if not default)
      if (userData?.name && userData.name !== 'Student' && userData.name !== 'User') return userData.name;
      // Priority 2: Google/Auth Display Name
      if (user?.displayName) return user.displayName;
      // Priority 3: Email Username (Capitalized)
      if (user?.email) {
          const namePart = user.email.split('@')[0];
          const cleanName = namePart.replace(/[0-9]/g, ''); 
          return cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Scholar";
      }
      return 'Student';
  }, [userData, user]);

  // --- 2. DATA PROCESSING ---
  const completedSet = new Set(userData?.completedAssignments || []);
  
  const relevantAssignments = (assignments || []).filter((l: any) => { 
      return !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); 
  });
  
  const activeAssignments = relevantAssignments.filter((l: any) => !completedSet.has(l.id));
  
  const { level, progress, rank } = getLevelInfo(userData?.xp || 0);
  const visibleLessons = libraryExpanded ? lessons : lessons.slice(0, 2);

  // --- 3. XP HANDLER FOR COLOSSEUM ---
// --- 3. XP HANDLER FOR COLOSSEUM (FIXED) ---
  const handleColosseumXP = async (xpAmount: number, reason: string) => {
      // 1. Robust User Check: Try prop first, then global auth
      const targetUser = user || auth.currentUser;

      if (!targetUser) {
          console.error("XP Error: No user found. Cannot save.");
          alert("Error: You seem to be logged out. XP not saved.");
          return;
      }

      console.log(`Attempting to save ${xpAmount} XP for ${targetUser.uid}`);

      try {
          // 2. Update Profile XP
          const profileRef = doc(db, 'artifacts', appId, 'users', targetUser.uid, 'profile', 'main');
          await updateDoc(profileRef, { 
              xp: increment(xpAmount) 
          });

          // 3. Add Activity Log
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
              studentName: displayName || "Student",
              studentEmail: targetUser.email,
              itemTitle: reason,
              xp: xpAmount,
              timestamp: Date.now(),
              type: 'game_reward'
          });

          setShowColosseum(false);
          // Optional: Add a visual toast here instead of alert
          // alert(`Victory! You earned ${xpAmount} XP.`); 
      } catch (e: any) {
          console.error("XP Save Failed:", e);
          alert(`Failed to save XP: ${e.message}`);
          setShowColosseum(false);
      }
  };

  // --- VIEW ROUTING ---
  if (activeStudentClass) { 
      return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={onSelectLesson} onSelectDeck={onSelectDeck} userData={userData} user={user} displayName={displayName} />; 
  }

  return (
  <div className="pb-24 animate-in fade-in duration-500 overflow-y-auto h-full relative bg-slate-50 overflow-x-hidden">
    
    {/* --- OVERLAYS --- */}
    {showLevelModal && <LevelUpModal userData={userData} onClose={() => setShowLevelModal(false)} />}
    
    {showColosseum && (
        <ColosseumMode 
            allDecks={allDecks} 
            user={user} 
            onExit={() => setShowColosseum(false)}
            onXPUpdate={handleColosseumXP}
        />
    )}

    {userData?.classSyncError && (
        <div className="bg-rose-500 text-white p-4 text-center text-sm font-bold relative z-50">
            <AlertTriangle className="inline-block mr-2" size={16} />
            System Notice: Database Index Missing.
        </div>
    )}
    
    {/* --- 1. HERO PROFILE WIDGET --- */}
    <button onClick={() => setShowLevelModal(true)} className="w-full relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl z-10 group text-left rounded-b-[3rem] pb-10 pt-12 px-8 transition-all active:scale-[0.99] border-b border-white/10">
        <div className="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[80px] mix-blend-overlay pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[60px] mix-blend-overlay pointer-events-none"></div>
       
        <div className="relative z-20 flex flex-col gap-5">
            <div className="flex items-center gap-5">
                <div className="relative">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-all overflow-hidden relative">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-serif font-bold text-3xl text-white drop-shadow-md">{displayName.charAt(0)}</span>
                        )}
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-indigo-600 rounded-full"></div>
                    </div>
                </div>
                <div>
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90 drop-shadow-sm">Welcome back,</p>
                    <h1 className="text-4xl font-serif font-bold leading-none tracking-tight drop-shadow-lg filter truncate max-w-[200px]">{displayName}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-white/20 shadow-sm flex items-center gap-1">
                            <Award size={12} className="text-yellow-300"/> {rank}
                        </span>
                    </div>
                </div>
            </div>

            {/* XP Bar & Streak */}
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center justify-between mt-2 group-hover:bg-black/30 transition-all shadow-inner">
                <div className="flex-1 border-r border-white/10 pr-6">
                     <div className="flex justify-between items-end mb-2">
                         <span className="text-[10px] font-bold text-indigo-100 tracking-wide uppercase">Level {level} Progress</span>
                         <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                     </div>
                     <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden border border-white/5">
                         <div className="bg-gradient-to-r from-cyan-300 to-blue-500 h-full rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)] relative overflow-hidden" style={{ width: `${progress}%` }}>
                             <div className="absolute inset-0 bg-white/40 w-full animate-[shimmer_2s_infinite]"></div>
                         </div>
                     </div>
                </div>
                <div className="pl-6 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 text-amber-300 filter drop-shadow-sm">
                        <Zap size={24} fill="currentColor" className="animate-pulse" />
                        <span className="text-2xl font-black leading-none text-white">{userData?.streak || 1}</span>
                    </div>
                    <span className="text-[9px] text-indigo-200 uppercase font-bold tracking-wider mt-1">Day Streak</span>
                </div>
            </div>
        </div>
    </button>
    
    {/* --- 2. DAILY DISCOVERY --- */}
    <DailyDiscoveryWidget allDecks={allDecks} user={user} userData={userData} />
    
    {/* --- 3. THE COLOSSEUM BANNER --- */}
    <div className="px-6 mt-6">
        <button onClick={() => setShowColosseum(true)} className="w-full p-1 rounded-[2.5rem] bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600 shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden">
            <div className="bg-slate-900 rounded-[2.3rem] p-6 relative overflow-hidden flex items-center justify-between">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-900/50 group-hover:rotate-12 transition-transform">
                        <Swords size={28} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-black text-white italic tracking-tight">THE COLOSSEUM</h3>
                        <p className="text-rose-200 text-xs font-bold uppercase tracking-widest">Infinite Survival Mode</p>
                    </div>
                </div>
                <div className="relative z-10 bg-white/10 p-2 rounded-full text-white/50 group-hover:text-white group-hover:bg-rose-600 transition-colors">
                    <ChevronRight size={24} />
                </div>
            </div>
        </button>
    </div>

    {/* --- MAIN SCROLLABLE CONTENT --- */}
    <div className="px-6 space-y-8 mt-8 relative z-20">
      
      {/* --- 4. MY CLASSES --- */}
      {classes && classes.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex justify-between items-end mb-4 ml-1">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <School size={16} className="text-indigo-500"/> My Classes
                </h3>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{classes.length} Active</span>
            </div>
            
            <div className="flex gap-5 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                {classes.map((cls: any) => { 
                    const clsTasks = cls.assignments || [];
                    const myPending = clsTasks.filter((l: any) => { 
                        const isForMe = !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); 
                        return isForMe && !completedSet.has(l.id); 
                    }).length;
                    
                    const totalTasks = clsTasks.length;
                    const completedTasks = totalTasks - myPending;
                    const classProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                    const studentCount = (cls.students || []).length;

                    return ( 
                        <button key={cls.id} onClick={() => onSelectClass(cls)} className="snap-start min-w-[300px] h-[200px] bg-white rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.3)] border border-slate-100 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col text-left">
                            <div className="h-24 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 relative w-full overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                <div className="absolute top-4 left-5 flex items-start gap-3 z-10">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {cls.name.charAt(0)}
                                    </div>
                                    <div className="mt-1">
                                        <div className="bg-black/30 backdrop-blur-sm border border-white/10 text-white/90 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-1">{cls.code}</div>
                                    </div>
                                </div>
                                {myPending > 0 ? (
                                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white/20 animate-pulse flex items-center gap-1">
                                        <AlertCircle size={10}/> {myPending} Due
                                    </div>
                                ) : (
                                    <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                                        <Check size={10}/> All Done
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between bg-white relative z-10">
                                <div>
                                    <h4 className="font-serif font-bold text-slate-800 text-xl truncate pr-2 group-hover:text-indigo-600 transition-colors">{cls.name}</h4>
                                    <div className="flex items-center gap-2 mt-1 text-slate-400 text-xs font-medium"><Users size={12} /> <span>{studentCount} Students</span></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Progress</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${classProgress === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>{Math.round(classProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${classProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${classProgress}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </button> 
                    ); 
                })}
            </div>
        </div>
      )}
      
      {/* --- 5. UP NEXT --- */}
      {activeAssignments.length > 0 && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
             <div className="flex justify-between items-center mb-3 ml-1">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Up Next</h3>
             </div>
             <div className="space-y-3">
                {activeAssignments.map((l: any, i: number) => ( 
                    <button key={`${l.id}-${i}`} onClick={() => l.contentType === 'deck' ? onSelectDeck(l) : onSelectLesson(l)} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-indigo-300 hover:shadow-md group">
                        <div className="flex items-center space-x-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white' : l.contentType === 'test' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white'}`}>
                                {l.contentType === 'deck' ? <Layers size={22}/> : l.contentType === 'test' ? <HelpCircle size={22}/> : <PlayCircle size={22} />}
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{l.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
                                        {l.contentType === 'deck' ? 'Flashcards' : l.contentType === 'test' ? 'Exam' : 'Lesson'}
                                    </span>
                                    {l.xp && <span className="text-[10px] font-bold text-emerald-600">+{l.xp} XP</span>}
                                </div>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={16} />
                        </div>
                    </button>
                ))}
             </div>
          </div>
      )}
      
      {/* --- 6. LIBRARY STACK --- */}
      <div className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500"/> Library
         </h3>
         <div className="space-y-3">
            {visibleLessons.map((l: any, idx: number) => (
                <button 
                    key={l.id} 
                    onClick={() => onSelectLesson(l)} 
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-300 group transition-all hover:shadow-md animate-in slide-in-from-bottom-2 fade-in fill-mode-forwards"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><BookOpen size={22}/></div>
                        <div className="text-left"><h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                </button>
            ))}
         </div>
         {lessons.length > 2 && (
             <button 
                onClick={() => setLibraryExpanded(!libraryExpanded)}
                className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
             >
                {libraryExpanded ? (<>Show Less <ChevronUp size={14}/></>) : (<>View All ({lessons.length}) <ChevronDown size={14}/></>)}
             </button>
         )}
      </div>
      
      {/* --- 7. QUICK ACTIONS --- */}
      <div className="grid grid-cols-2 gap-4 pb-8 animate-in slide-in-from-bottom-4 duration-500 delay-500">
        <button onClick={() => setActiveTab('flashcards')} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center hover:scale-[1.02] active:scale-95 transition-all group hover:shadow-lg hover:border-orange-200 hover:bg-orange-50/30">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm"><Layers size={28}/></div>
            <span className="block font-bold text-slate-800 text-lg">Practice</span>
            <span className="text-xs text-slate-400 font-medium">Review Cards</span>
        </button>
        <button onClick={() => setActiveTab('create')} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center hover:scale-[1.02] active:scale-95 transition-all group hover:shadow-lg hover:border-emerald-200 hover:bg-emerald-50/30">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-sm"><Feather size={28}/></div>
            <span className="block font-bold text-slate-800 text-lg">Creator</span>
            <span className="text-xs text-slate-400 font-medium">Build Content</span>
        </button>
      </div>

    </div>
  </div>
  );
}
function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId, initialData, onCancelEdit }: any) {
  // ... keep existing state ...
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- NEW: IPA KEYBOARD CONSTANTS ---
  const IPA_KEYS = [
    'ə', 'æ', 'θ', 'ð', 'ŋ', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 
    'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ʌ', 'ː', 'ˈ', 'ˌ'
  ];

  const insertIPA = (char: string) => {
    setFormData(prev => ({ ...prev, ipa: prev.ipa + char }));
  };

  // ... keep useEffect for hydration ...
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

  // ... keep handleChange, addMorphology, removeMorphology, handleClear ...
  const handleChange = (e: any) => { if (e.target.name === 'deckId') { if (e.target.value === 'new') { setIsCreatingDeck(true); setFormData({ ...formData, deckId: 'new' }); } else { setIsCreatingDeck(false); setFormData({ ...formData, deckId: e.target.value }); } } else { setFormData({ ...formData, [e.target.name]: e.target.value }); } };
  const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
  const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };
  
  const handleClear = () => { 
      setEditingId(null); 
      setFormData(prev => ({ ...prev, front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '' })); 
      setMorphology([]);
      if (onCancelEdit) onCancelEdit();
  };

  // ... keep handleSubmit ...
  const handleSubmit = (e: any) => { e.preventDefault(); if (!formData.front || !formData.back) return; let finalDeckId = formData.deckId; let finalDeckTitle = null; if (formData.deckId === 'new') { if (!newDeckTitle) return alert("Please name your new deck."); finalDeckId = `custom_${Date.now()}`; finalDeckTitle = newDeckTitle; } const cardData = { front: formData.front, back: formData.back, type: formData.type, deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "", mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] }; if (editingId) { onUpdateCard(editingId, cardData); setToastMsg("Card Updated Successfully"); } else { onSaveCard(cardData); setToastMsg("Card Created Successfully"); } handleClear(); if (isCreatingDeck) { setIsCreatingDeck(false); setNewDeckTitle(''); setFormData(prev => ({ ...prev, deckId: finalDeckId })); } };
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title }));

  return (
    <div className="px-6 mt-4 space-y-6 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* ... keep Header section ... */}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center"><div><p className="font-bold flex items-center gap-2"><Layers size={16}/> {editingId ? 'Editing Card' : 'Card Creator'}</p><p className="opacity-80 text-xs mt-1">{editingId ? 'Update details below.' : 'Define deep linguistic data (X-Ray).'}</p></div>{editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}</div>
      
      {/* CORE DATA SECTION */}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Core Data</h3>
        
        {/* ... keep Target Deck selector ... */}
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Target Deck</label><select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-3 rounded-lg border border-slate-200 bg-indigo-50/50 font-bold text-indigo-900 disabled:opacity-50"><option value="custom">✍️ Scriptorium (My Deck)</option>{deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}<option value="new">✨ + Create New Deck</option></select>{isCreatingDeck && <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter New Deck Name" className="w-full p-3 rounded-lg border-2 border-indigo-500 bg-white font-bold mt-2 animate-in fade-in slide-in-from-top-2" autoFocus />}</div>
        
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Word</label><input name="front" value={formData.front} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="e.g. Bellum" /></div><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Meaning</label><input name="back" value={formData.back} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="e.g. War" /></div></div>
        
        {/* MODIFIED: Part of Speech + IPA Input with Keyboard */}
        <div className="grid grid-cols-1 gap-4">
           <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Part of Speech</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 bg-white"><option value="noun">Noun</option><option value="verb">Verb</option><option value="adjective">Adjective</option><option value="adverb">Adverb</option><option value="phrase">Phrase</option></select></div>
           
           <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex justify-between">
                    <span>Phonetics (IPA)</span>
                    <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">Tap to Insert</span>
                </label>
                {/* IPA KEYBOARD */}
                <div className="flex flex-wrap gap-1 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {IPA_KEYS.map(char => (
                        <button 
                            key={char} 
                            type="button"
                            onClick={() => insertIPA(char)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 font-serif shadow-sm transition-all active:scale-90"
                        >
                            {char}
                        </button>
                    ))}
                </div>
                <input name="ipa" value={formData.ipa} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-serif text-sm text-slate-600" placeholder="/.../" />
           </div>
        </div>
      </section>

      {/* ... keep Morphology and Context sections exactly as they were ... */}
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
// --- EXAM FEATURE COMPONENTS ---

function TestBuilderView({ onSave, onCancel, initialData }: any) {
  const [testData, setTestData] = useState(initialData || { title: '', description: '', type: 'test', xp: 100, questions: [] });

  const addQuestion = (type: 'mcq' | 'tf' | 'match' | 'order') => {
    let newQ: any = { id: Date.now().toString(), type, prompt: '' };
    
    if (type === 'mcq') newQ = { ...newQ, options: [{id: 'o1', text: ''}, {id: 'o2', text: ''}], correctAnswer: '' };
    if (type === 'tf') newQ = { ...newQ, correctAnswer: 'true' };
    if (type === 'match') newQ = { ...newQ, pairs: [{left: '', right: ''}, {left: '', right: ''}] };
    if (type === 'order') newQ = { ...newQ, items: [{id: 'i1', text: ''}, {id: 'i2', text: ''}] };

    setTestData({ ...testData, questions: [...testData.questions, newQ] });
  };

  const updateQuestion = (idx: number, field: string, val: any) => { const qs = [...testData.questions]; qs[idx] = { ...qs[idx], [field]: val }; setTestData({ ...testData, questions: qs }); };
  
  // MCQ Helpers
  const updateOption = (qIdx: number, oIdx: number, val: string) => { const qs = [...testData.questions]; qs[qIdx].options[oIdx].text = val; setTestData({ ...testData, questions: qs }); };
  const addOption = (qIdx: number) => { const qs = [...testData.questions]; qs[qIdx].options.push({ id: `o${Date.now()}`, text: '' }); setTestData({ ...testData, questions: qs }); };
  
  // Matching Helpers
  const updatePair = (qIdx: number, pIdx: number, field: 'left' | 'right', val: string) => { const qs = [...testData.questions]; qs[qIdx].pairs[pIdx][field] = val; setTestData({ ...testData, questions: qs }); };
  const addPair = (qIdx: number) => { const qs = [...testData.questions]; qs[qIdx].pairs.push({ left: '', right: '' }); setTestData({ ...testData, questions: qs }); };

  // Ordering Helpers
  const updateItem = (qIdx: number, iIdx: number, val: string) => { const qs = [...testData.questions]; qs[qIdx].items[iIdx].text = val; setTestData({ ...testData, questions: qs }); };
  const addItem = (qIdx: number) => { const qs = [...testData.questions]; qs[qIdx].items.push({ id: `i${Date.now()}`, text: '' }); setTestData({ ...testData, questions: qs }); };

  const removeQuestion = (idx: number) => { setTestData({ ...testData, questions: testData.questions.filter((_:any, i:number) => i !== idx) }); };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="text-indigo-600"/> Exam Metadata</h2>
        <input className="w-full text-2xl font-serif font-bold border-b-2 border-slate-100 pb-2 focus:outline-none" placeholder="Exam Title" value={testData.title} onChange={e => setTestData({...testData, title: e.target.value})}/>
        <textarea className="w-full text-sm bg-slate-50 p-3 rounded-xl mt-2 focus:outline-none" placeholder="Instructions..." value={testData.description} onChange={e => setTestData({...testData, description: e.target.value})}/>
      </div>

      <div className="space-y-4">
        {testData.questions.map((q: any, idx: number) => (
            <div key={q.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 relative">
                <button onClick={() => removeQuestion(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                <div className="mb-3">
                    <span className={`font-bold text-xs px-2 py-1 rounded-lg uppercase tracking-wider ${q.type === 'match' ? 'bg-purple-100 text-purple-700' : q.type === 'order' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'tf' ? 'True/False' : q.type === 'match' ? 'Matching' : 'Ordering'}
                    </span>
                </div>
                <input className="w-full font-bold border-b border-slate-100 pb-2 mb-4 focus:outline-none" placeholder="Question Prompt" value={q.prompt} onChange={e => updateQuestion(idx, 'prompt', e.target.value)}/>
                
                {/* MCQ UI */}
                {q.type === 'mcq' && (
                    <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                        {q.options.map((opt: any, oIdx: number) => (
                            <div key={opt.id} className="flex items-center gap-2">
                                <button onClick={() => updateQuestion(idx, 'correctAnswer', opt.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.correctAnswer === opt.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}>{q.correctAnswer === opt.id && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}</button>
                                <input className="flex-1 p-2 rounded-lg text-sm bg-slate-50" placeholder={`Option ${oIdx+1}`} value={opt.text} onChange={e => updateOption(idx, oIdx, e.target.value)}/>
                            </div>
                        ))}
                        <button onClick={() => addOption(idx)} className="text-xs font-bold text-indigo-600 hover:underline pl-8">+ Add Option</button>
                    </div>
                )}

                {/* TF UI */}
                {q.type === 'tf' && (
                    <div className="flex gap-4 pl-4">
                        {['true', 'false'].map(val => ( <button key={val} onClick={() => updateQuestion(idx, 'correctAnswer', val)} className={`px-6 py-2 rounded-xl font-bold border-2 ${q.correctAnswer === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400'}`}>{val === 'true' ? 'True' : 'False'}</button> )) }
                    </div>
                )}

                {/* MATCHING UI */}
                {q.type === 'match' && (
                    <div className="space-y-2 pl-4">
                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-400 mb-1"><span>Term</span><span>Definition</span></div>
                        {q.pairs.map((pair: any, pIdx: number) => (
                            <div key={pIdx} className="grid grid-cols-2 gap-2">
                                <input className="p-2 bg-slate-50 rounded-lg text-sm border border-slate-200" placeholder="Left side" value={pair.left} onChange={e => updatePair(idx, pIdx, 'left', e.target.value)} />
                                <input className="p-2 bg-slate-50 rounded-lg text-sm border border-slate-200" placeholder="Right side" value={pair.right} onChange={e => updatePair(idx, pIdx, 'right', e.target.value)} />
                            </div>
                        ))}
                        <button onClick={() => addPair(idx)} className="text-xs font-bold text-purple-600 hover:underline">+ Add Pair</button>
                    </div>
                )}

                {/* ORDERING UI */}
                {q.type === 'order' && (
                    <div className="space-y-2 pl-4">
                        <p className="text-[10px] text-orange-400 font-bold uppercase">Enter items in the CORRECT order:</p>
                        {q.items.map((item: any, iIdx: number) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <span className="text-slate-300 font-mono text-xs">{iIdx + 1}.</span>
                                <input className="flex-1 p-2 bg-slate-50 rounded-lg text-sm border border-slate-200" placeholder={`Step ${iIdx + 1}`} value={item.text} onChange={e => updateItem(idx, iIdx, e.target.value)} />
                            </div>
                        ))}
                        <button onClick={() => addItem(idx)} className="text-xs font-bold text-orange-600 hover:underline">+ Add Step</button>
                    </div>
                )}
            </div>
        ))}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex flex-col gap-2 z-50">
          <div className="flex gap-2 justify-center pb-2 overflow-x-auto">
              <button onClick={() => addQuestion('mcq')} className="px-4 py-2 bg-indigo-50 rounded-full text-xs font-bold text-indigo-600 hover:bg-indigo-100 flex items-center gap-1"><CheckSquare size={14}/> MC</button>
              <button onClick={() => addQuestion('tf')} className="px-4 py-2 bg-indigo-50 rounded-full text-xs font-bold text-indigo-600 hover:bg-indigo-100 flex items-center gap-1"><CheckCircle2 size={14}/> T/F</button>
              <button onClick={() => addQuestion('match')} className="px-4 py-2 bg-purple-50 rounded-full text-xs font-bold text-purple-600 hover:bg-purple-100 flex items-center gap-1"><ArrowRightLeft size={14}/> Match</button>
              <button onClick={() => addQuestion('order')} className="px-4 py-2 bg-orange-50 rounded-full text-xs font-bold text-orange-600 hover:bg-orange-100 flex items-center gap-1"><ListOrdered size={14}/> Order</button>
          </div>
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">Cancel</button>
            <button onClick={() => { if(!testData.title) return alert("Title needed"); onSave(testData); }} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Save Exam</button>
          </div>
      </div>
    </div>
  );
}

function TestPlayerView({ test, onFinish }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Interaction States
  const [dragOrder, setDragOrder] = useState<any[]>([]);
  const [matchSelection, setMatchSelection] = useState<any>({}); 
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const questions = test.questions || [];
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + (isSubmitted ? 1 : 0)) / questions.length) * 100;

  // Initialize Interaction States
  useEffect(() => {
      if (!currentQ) return;
      
      // ORDERING INIT
      if (currentQ.type === 'order') {
          if (answers[currentIndex]) {
              setDragOrder(answers[currentIndex]);
          } else if (currentQ.items) {
              // Shuffle items so the answer isn't obvious
              const shuffled = [...currentQ.items].sort(() => Math.random() - 0.5);
              setDragOrder(shuffled);
          }
      }
      
      // MATCHING INIT
      if (currentQ.type === 'match') {
          if (answers[currentIndex]) {
              setMatchSelection(answers[currentIndex]);
          } else {
              setMatchSelection({});
          }
      }
  }, [currentIndex, currentQ]);

  const handleMCQ = (val: string) => { if(isSubmitted) return; setAnswers({ ...answers, [currentIndex]: val }); };

  // Matching Logic
  const handleMatchClick = (side: 'left' | 'right', id: string) => {
      if (isSubmitted) return;
      if (side === 'left') setSelectedLeft(id);
      else if (selectedLeft) {
          const newMatches = { ...matchSelection, [selectedLeft]: id };
          setMatchSelection(newMatches);
          setAnswers({ ...answers, [currentIndex]: newMatches });
          setSelectedLeft(null);
      }
  };

  // --- NEW: SMOOTH REORDERING LOGIC (No Drag) ---
  const moveItem = (index: number, direction: 'up' | 'down') => {
      if (isSubmitted) return;
      const newOrder = [...dragOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      // Bounds check
      if (targetIndex < 0 || targetIndex >= newOrder.length) return;

      // Swap
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      
      setDragOrder(newOrder);
      setAnswers({ ...answers, [currentIndex]: newOrder });
  };

  const handleSubmit = () => {
    let correctCount = 0; 
    questions.forEach((q: any, idx: number) => { 
        const ans = answers[idx];
        if (q.type === 'mcq' || q.type === 'tf') {
            if(ans === q.correctAnswer) correctCount++; 
        } else if (q.type === 'match') {
            let allMatch = true;
            if (!ans) allMatch = false;
            else q.pairs.forEach((p: any) => { if (ans[p.left] !== p.right) allMatch = false; });
            if (allMatch) correctCount++;
        } else if (q.type === 'order') {
            const correctOrderIds = q.items.map((i:any) => i.id).join(',');
            const userOrderIds = ans ? ans.map((i:any) => i.id).join(',') : '';
            if (correctOrderIds === userOrderIds) correctCount++;
        }
    });
    setScore(correctCount); 
    setIsSubmitted(true);
  };

  const finishExam = () => { 
    const percentage = score / questions.length;
    const earnedXP = Math.round(test.xp * percentage);
    
    const submissionDetails = questions.map((q: any, idx: number) => {
        const ans = answers[idx];
        let isCorrect = false;
        let studentVal = "No Answer"; 
        let correctVal = "See Instructor";

        if (q.type === 'mcq' || q.type === 'tf') {
            isCorrect = ans === q.correctAnswer;
            if(q.type === 'mcq') {
                studentVal = q.options.find((o:any)=>o.id===ans)?.text || "No Answer";
                correctVal = q.options.find((o:any)=>o.id===q.correctAnswer)?.text || "Unknown";
            } else {
                studentVal = ans;
                correctVal = q.correctAnswer;
            }
        } else if (q.type === 'match') {
             let allMatch = true;
             const lines: string[] = [];
             if(!ans) allMatch = false;
             else {
                 q.pairs.forEach((p:any) => { 
                     if(ans[p.left] !== p.right) allMatch = false; 
                     lines.push(`${p.left} -> ${ans[p.left] || 'Unmatched'}`);
                 });
             }
             isCorrect = allMatch;
             studentVal = lines.join('\n');
             correctVal = q.pairs.map((p:any) => `${p.left} -> ${p.right}`).join('\n');
        } else if (q.type === 'order') {
            const cIds = q.items.map((i:any) => i.id).join(',');
            const uIds = ans ? ans.map((i:any) => i.id).join(',') : '';
            isCorrect = cIds === uIds;
            studentVal = ans ? ans.map((i:any, ix:number) => `${ix+1}. ${i.text}`).join('\n') : "No Order Set";
            correctVal = q.items.map((i:any, ix:number) => `${ix+1}. ${i.text}`).join('\n');
        }

        return { prompt: q.prompt, type: q.type, isCorrect, studentVal, correctVal };
    });

    onFinish(test.id, earnedXP, test.title, { score, total: questions.length, details: submissionDetails }); 
  };

  if (questions.length === 0) return <div className="p-8 text-center text-slate-400">Empty Exam</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-20">
          <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-slate-800 truncate">{test.title}</h2><button onClick={() => onFinish(null, 0)}><X/></button></div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-6 custom-scrollbar">
          {!isSubmitted ? (
              <div className="animate-in slide-in-from-right-8 duration-300" key={currentIndex}>
                  <div className="bg-indigo-50 inline-block px-3 py-1 rounded-lg text-indigo-700 font-bold text-xs mb-4 uppercase">Question {currentIndex + 1}</div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-8">{currentQ.prompt}</h3>

                  {/* MCQ & TF */}
                  {(currentQ.type === 'mcq' || currentQ.type === 'tf') && (
                      <div className="space-y-3">
                          {(currentQ.type === 'mcq' ? currentQ.options : ['true', 'false']).map((opt: any) => {
                              const val = currentQ.type === 'tf' ? opt : opt.id;
                              const label = currentQ.type === 'tf' ? (opt === 'true' ? 'True' : 'False') : opt.text;
                              return (
                                  <button key={val} onClick={() => handleMCQ(val)} className={`w-full p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all ${answers[currentIndex] === val ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                                      {label}
                                  </button>
                              )
                          })}
                      </div>
                  )}

                  {/* ORDERING (Fixed: Replaced Drag with Click-to-Move) */}
                  {currentQ.type === 'order' && (
                      <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tap arrows to reorder</p>
                          {dragOrder.length > 0 ? dragOrder.map((item: any, idx: number) => (
                              <div 
                                key={item.id} 
                                className="bg-white p-3 rounded-xl border-2 border-slate-200 shadow-sm flex items-center gap-4 transition-all"
                              >
                                  <div className="flex flex-col gap-1">
                                      <button 
                                        disabled={idx === 0}
                                        onClick={() => moveItem(idx, 'up')}
                                        className="p-1 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-colors"
                                      >
                                          <ChevronUp size={16}/>
                                      </button>
                                      <button 
                                        disabled={idx === dragOrder.length - 1}
                                        onClick={() => moveItem(idx, 'down')}
                                        className="p-1 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-colors"
                                      >
                                          <ChevronDown size={16}/>
                                      </button>
                                  </div>
                                  <span className="font-mono text-indigo-300 font-bold text-lg w-6">{idx + 1}.</span>
                                  <span className="font-bold text-slate-700 text-lg">{item.text}</span>
                              </div>
                          )) : (
                             <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">No items to order. Check builder.</div>
                          )}
                      </div>
                  )}

                  {/* MATCHING */}
                  {currentQ.type === 'match' && (
                      <div className="grid grid-cols-2 gap-4 sm:gap-8">
                           <div className="space-y-3">
                               {currentQ.pairs?.map((p: any) => (
                                   <button 
                                     key={p.left} 
                                     onClick={() => handleMatchClick('left', p.left)}
                                     className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${selectedLeft === p.left ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' : matchSelection[p.left] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}
                                   >
                                       {p.left}
                                   </button>
                               ))}
                           </div>
                           <div className="space-y-3">
                               {currentQ.pairs ? [...currentQ.pairs].sort((a:any,b:any) => a.right.localeCompare(b.right)).map((p: any) => {
                                   const isMatched = Object.values(matchSelection).includes(p.right);
                                   return (
                                       <button 
                                         key={p.right}
                                         onClick={() => handleMatchClick('right', p.right)}
                                         className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${isMatched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                                       >
                                           {p.right}
                                       </button>
                                   )
                               }) : <p className="text-xs text-slate-400">No pairs defined.</p>}
                           </div>
                      </div>
                  )}
              </div>
          ) : (
              <div className="text-center py-10 animate-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><Trophy size={48} /></div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Exam Complete!</h2>
                  <div className="text-6xl font-black text-indigo-600 mb-2">{score}<span className="text-2xl text-slate-300">/{questions.length}</span></div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">{Math.round((score/questions.length)*100)}% Accuracy</div>
                  <button onClick={finishExam} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">Collect XP & Finish</button>
              </div>
          )}
      </div>

      {!isSubmitted && (
          <div className="p-4 pb-8 bg-white border-t border-slate-200 z-20 shrink-0">
              <div className="flex gap-4 mx-auto w-full">
                  <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="px-6 py-3 rounded-xl font-bold text-slate-500 disabled:opacity-50 hover:bg-slate-50 bg-slate-100">Prev</button>
                  {currentIndex < questions.length - 1 ? ( <button onClick={() => setCurrentIndex(prev => prev + 1)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800">Next</button> ) : ( <button onClick={handleSubmit} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-600">Submit Exam</button> )}
              </div>
          </div>
      )}
    </div>
  );
}
function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks, lessons }: any) {
  // Editor State
  const [lessonData, setLessonData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [] });
  const [mode, setMode] = useState('card'); 
  const [subView, setSubView] = useState('menu'); // menu | library | editor | import
  const [editingItem, setEditingItem] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importType, setImportType] = useState<'lesson' | 'deck' | 'test'>('lesson');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Library Filter State
  const [libSearch, setLibSearch] = useState('');
  const [libFilter, setLibFilter] = useState('all'); // all | deck | lesson | test
  const [libLang, setLibLang] = useState('all'); 
  const [libDifficulty, setLibDifficulty] = useState('all'); // NEW: Difficulty Filter

  // --- HELPER: Difficulty Colors ---
  const getDiffColor = (diff: string) => {
      const d = diff.toLowerCase();
      if (d.includes('begin') || d.includes('easy')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      if (d.includes('inter') || d.includes('med')) return 'bg-amber-100 text-amber-700 border-amber-200';
      if (d.includes('advan') || d.includes('hard')) return 'bg-rose-100 text-rose-700 border-rose-200';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  // --- ACTIONS ---
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
            
            // Auto-detect metadata
            const lang = item.targetLanguage || "Latin"; 
            const diff = item.difficulty || "Beginner";

            if (importType === 'deck') {
                const deckId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                const deckTitle = item.title || "Imported Deck";
                if (item.cards && Array.isArray(item.cards)) {
                    item.cards.forEach((card: any) => {
                        const cardRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'custom_cards'));
                        batch.set(cardRef, { 
                            ...card, 
                            deckId: deckId, 
                            deckTitle: deckTitle, 
                            type: card.type || 'noun', 
                            mastery: 0, 
                            grammar_tags: card.grammar_tags || ["Imported"],
                            targetLanguage: lang,
                            difficulty: diff
                        });
                        count++;
                    });
                }
            } else if (importType === 'test') {
                 const ref = doc(db, 'artifacts', appId, 'users', userId, 'custom_lessons', id);
                 const processedQuestions = (item.questions || []).map((q: any, idx: number) => ({
                     ...q,
                     id: q.id || `q_${Date.now()}_${idx}`,
                     options: q.options?.map((opt: any, oIdx: number) => ({ ...opt, id: opt.id || `opt_${Date.now()}_${idx}_${oIdx}` })) || []
                 }));
                 batch.set(ref, { ...item, type: 'test', questions: processedQuestions, xp: item.xp || 100, created: Date.now(), targetLanguage: lang, difficulty: diff });
                 count++;
            } else {
                 const ref = doc(db, 'artifacts', appId, 'users', userId, 'custom_lessons', id);
                 batch.set(ref, { ...item, vocab: Array.isArray(item.vocab) ? item.vocab : [], xp: item.xp || 100, targetLanguage: lang, difficulty: diff });
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
           setLessonData({...item, vocab: Array.isArray(item.vocab) ? item.vocab.join(', ') : item.vocab});
      }
  };

  // --- LIBRARY VIEW ---
  if (subView === 'library') {
      // 1. Flatten Decks
      const deckItems = Object.entries(allDecks || {}).map(([key, deck]: any) => ({
          id: key,
          ...deck,
          type: 'deck',
          subtitle: `${deck.cards?.length || 0} Cards`,
          targetLanguage: deck.targetLanguage || (deck.cards?.[0]?.targetLanguage) || 'Latin',
          difficulty: deck.difficulty || (deck.cards?.[0]?.difficulty) || 'Beginner'
      }));

      // 2. Prepare Lessons & Exams
      const contentItems = (lessons || []).map((l: any) => ({
          ...l,
          type: (l.type === 'test' || l.contentType === 'test') ? 'test' : 'lesson',
          subtitle: (l.type === 'test' || l.contentType === 'test') 
            ? `${(l.questions || []).length} Questions` 
            : `${(l.blocks || []).length} Blocks`,
          targetLanguage: l.targetLanguage || 'Latin',
          difficulty: l.difficulty || 'Beginner'
      }));

      // 3. Merge
      const allItems = [...deckItems, ...contentItems];

      // 4. Extract Unique Options for Dropdowns
      const availableLanguages = Array.from(new Set(allItems.map(i => i.targetLanguage))).sort();
      const availableDifficulties = Array.from(new Set(allItems.map(i => i.difficulty))).sort();

      // 5. Filter
      const filteredItems = allItems.filter(item => {
          const matchesSearch = item.title.toLowerCase().includes(libSearch.toLowerCase());
          const matchesType = libFilter === 'all' || item.type === libFilter;
          const matchesLang = libLang === 'all' || item.targetLanguage === libLang;
          const matchesDiff = libDifficulty === 'all' || item.difficulty === libDifficulty;
          return matchesSearch && matchesType && matchesLang && matchesDiff;
      });

      return (
          <div className="h-full flex flex-col bg-slate-50">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-white flex flex-col gap-4 sticky top-0 z-10 shadow-sm">
                  <div className="flex justify-between items-center">
                      <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Library className="text-indigo-600"/> Content Library</h2>
                      <button onClick={() => setSubView('menu')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-slate-50">Back to Hub</button>
                  </div>
                  
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col gap-3">
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                          <input 
                            value={libSearch} 
                            onChange={(e) => setLibSearch(e.target.value)} 
                            placeholder="Search content..." 
                            className="w-full pl-9 py-2 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                          {/* Type Filter */}
                          <div className="relative">
                              <select 
                                value={libFilter} 
                                onChange={(e) => setLibFilter(e.target.value)} 
                                className="w-full p-2 pl-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                              >
                                  <option value="all">All Types</option>
                                  <option value="deck">Decks</option>
                                  <option value="lesson">Lessons</option>
                                  <option value="test">Exams</option>
                              </select>
                              <Layers size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"/>
                          </div>

                          {/* Language Filter */}
                          <div className="relative">
                              <select 
                                value={libLang} 
                                onChange={(e) => setLibLang(e.target.value)} 
                                className="w-full p-2 pl-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                              >
                                  <option value="all">All Langs</option>
                                  {availableLanguages.map(lang => (
                                      <option key={lang} value={lang}>{lang}</option>
                                  ))}
                              </select>
                              <Globe size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"/>
                          </div>

                          {/* Difficulty Filter */}
                          <div className="relative">
                              <select 
                                value={libDifficulty} 
                                onChange={(e) => setLibDifficulty(e.target.value)} 
                                className="w-full p-2 pl-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                              >
                                  <option value="all">All Levels</option>
                                  {availableDifficulties.map(diff => (
                                      <option key={diff} value={diff}>{diff}</option>
                                  ))}
                              </select>
                              <BarChart3 size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"/>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  {filteredItems.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 italic">No content found matching your filters.</div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {filteredItems.map((item: any) => (
                              <div 
                                key={item.id} 
                                onClick={() => handleEdit(item, item.type === 'deck' ? 'card' : item.type === 'test' ? 'test' : 'lesson')} 
                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden flex flex-col h-full"
                              >
                                  {/* Header Row */}
                                  <div className="flex justify-between items-start mb-3 relative z-10">
                                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
                                          item.type === 'deck' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                          item.type === 'test' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                                      }`}>
                                          {item.type === 'deck' ? 'Flashcards' : item.type === 'test' ? 'Exam' : 'Lesson'}
                                      </span>
                                      <Edit3 size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                                  </div>
                                  
                                  {/* Body */}
                                  <div className="relative z-10 mb-4 flex-1">
                                      <h4 className="font-bold text-slate-800 text-lg mb-1 line-clamp-2 leading-tight">{item.title}</h4>
                                      <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                              <Globe size={10}/> {item.targetLanguage.substring(0, 3).toUpperCase()}
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getDiffColor(item.difficulty)}`}>
                                              {item.difficulty}
                                          </span>
                                      </div>
                                  </div>
                                  
                                  {/* Footer */}
                                  <div className="pt-3 border-t border-slate-100 relative z-10 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                      {item.type === 'deck' && <Layers size={14}/>}
                                      {item.type === 'lesson' && <BookOpen size={14}/>}
                                      {item.type === 'test' && <HelpCircle size={14}/>}
                                      {item.subtitle}
                                  </div>
                                  
                                  {/* Hover Effect BG */}
                                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-[100px] transition-transform group-hover:scale-125 pointer-events-none ${
                                      item.type === 'deck' ? 'from-orange-400 to-amber-500' : 
                                      item.type === 'test' ? 'from-rose-400 to-pink-500' : 
                                      'from-indigo-400 to-blue-500'
                                  }`}></div>
                              </div>
                           ))}
                      </div>
                  )}
              </div>
          </div>
      )
  }

  // --- IMPORT VIEW ---
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
                     <button onClick={() => setImportType('test')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${importType === 'test' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Exams</button>
                 </div>
                 <textarea 
                   value={jsonInput} 
                   onChange={(e) => setJsonInput(e.target.value)} 
                   className="flex-1 w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                   placeholder={importType === 'test' ? '[ { "title": "Midterm", "questions": [...] } ]' : importType === 'lesson' ? '[ { "title": "Lesson 1", "blocks": [...] } ]' : '[ { "title": "My Deck", "cards": [...] } ]'}
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

  // --- MAIN MENU / EDITOR ---
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
                <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
                    <button onClick={() => { setMode('card'); setEditingItem(null); setSubView('editor'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'card' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Flashcard</button>
                    <button onClick={() => { setMode('lesson'); setEditingItem(null); setSubView('editor'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'lesson' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Lesson</button>
                    <button onClick={() => { setMode('test'); setEditingItem(null); setSubView('editor'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'test' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Exam</button>
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
            {subView === 'editor' && mode === 'test' && (
                <TestBuilderView 
                    initialData={editingItem}
                    onSave={(data: any) => onSaveLesson({...data, contentType: 'test'}, editingItem?.id)} 
                    onCancel={() => setSubView('menu')}
                />
            )}
        </div>
    </div>
  );
}
function ClassGrades({ classData }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Subscribe to Data
  useEffect(() => {
    if (!classData?.students || classData.students.length === 0) {
        setLoading(false);
        return;
    }

    // A. Fetch Student Profiles (to get names, XP, avatars)
    const qStudents = query(collectionGroup(db, 'profile'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
        const allStudents = snapshot.docs.map(d => d.data());
        // Filter for students actually in this class
        // (Note: In a larger app, you'd filter server-side, but this works for class sizes < 100)
        const classStudents = allStudents.filter((s: any) => classData.studentEmails?.includes(s.email));
        setStudents(classStudents);
    });

    // B. Fetch Activity Logs (to get quiz scores)
    const qLogs = query(collection(db, 'artifacts', appId, 'activity_logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
        const allLogs = snapshot.docs.map(d => d.data());
        // Filter logs for this class roster
        const classLogs = allLogs.filter((l: any) => classData.studentEmails?.includes(l.studentEmail));
        setLogs(classLogs);
        setLoading(false);
    });

    return () => { unsubStudents(); unsubLogs(); };
  }, [classData]);

  // 2. Helper to Calc Stats
  const getStudentStats = (email: string) => {
      const studentLogs = logs.filter(l => l.studentEmail === email);
      const completedCount = studentLogs.length;
      
      // Calculate Average Quiz Score
      let totalScore = 0;
      let totalPossible = 0;
      
      studentLogs.forEach((log: any) => {
          if (log.scoreDetail) {
              totalScore += (log.scoreDetail.score || 0);
              totalPossible += (log.scoreDetail.total || 0);
          }
      });

      const average = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      
      return { completedCount, average };
  };

  if (loading) return <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2"><Loader className="animate-spin"/><span className="text-xs font-bold uppercase tracking-widest">Calculating Grades...</span></div>;

  return (
     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="font-bold text-lg text-slate-800">Gradebook</h3>
                <p className="text-xs text-slate-500">Live performance tracking for {classData.name}</p>
            </div>
            <div className="flex gap-2">
                <button className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors">Export CSV</button>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-4 pl-6 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Student</th>
                        <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-center">Total XP</th>
                        <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-center">Assignments</th>
                        <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-center">Quiz Avg</th>
                        <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right pr-6">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {students.map(s => {
                        const stats = getStudentStats(s.email);
                        return (
                            <tr key={s.email} className="hover:bg-indigo-50/30 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-serif font-bold shadow-sm border border-white group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            {s.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{s.name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-400 font-mono">{s.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="font-black text-amber-500 drop-shadow-sm">{s.xp || 0}</span>
                                    <span className="text-[10px] text-amber-300 ml-0.5">XP</span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="font-bold text-slate-700">{stats.completedCount}</span>
                                        <span className="text-[9px] text-slate-400 uppercase font-bold">Done</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full font-bold text-xs border ${stats.average >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : stats.average >= 70 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : stats.average > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        {stats.average}%
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    {stats.completedCount > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><Activity size={12}/> Active</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Inactive</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {students.length === 0 && (
                <div className="p-12 text-center border-t border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users size={32} />
                    </div>
                    <p className="text-slate-500 font-bold">Class roster is empty.</p>
                    <p className="text-xs text-slate-400">Add students to see their grades here.</p>
                </div>
            )}
        </div>
     </div>
  );
}
function ClassManagerView({ user, userData, classes, lessons, allDecks }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [targetStudentMode, setTargetStudentMode] = useState('all'); 
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  const [assignType, setAssignType] = useState<'deck' | 'lesson' | 'test'>('lesson');
  const [viewTab, setViewTab] = useState<'content' | 'forum' | 'grades'>('content');

  // -- Student Selector States --
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  useEffect(() => {
    if (isStudentListOpen) {
        const q = query(collectionGroup(db, 'profile'), where('role', '==', 'student'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAvailableStudents(snapshot.docs.map(doc => ({ ...doc.data() })));
        });
        return () => unsubscribe();
    }
  }, [isStudentListOpen]);

  // --- ACTIONS ---
  const createClass = async (e: any) => { e.preventDefault(); if (!newClassName.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { name: newClassName, code: Math.random().toString(36).substring(2, 8).toUpperCase(), students: [], studentEmails: [], assignments: [], created: Date.now() }); setNewClassName(''); setToastMsg("Class Created Successfully"); } catch (error) { console.error("Create class failed:", error); alert("Failed to create class."); } };
  const handleDeleteClass = async (id: string) => { if (window.confirm("Delete this class?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id)); if (selectedClassId === id) setSelectedClassId(null); } catch (error) { console.error("Delete class failed:", error); alert("Failed to delete class."); } } };
  const handleRenameClass = async (classId: string, currentName: string) => { const newName = prompt("Enter new class name:", currentName); if (newName && newName.trim() !== "" && newName !== currentName) { try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), { name: newName.trim() }); setToastMsg("Class renamed successfully"); } catch (error) { console.error("Rename failed", error); alert("Failed to rename class"); } } };
  
  const toggleAssignee = (email: string) => { if (selectedAssignees.includes(email)) { setSelectedAssignees(selectedAssignees.filter(e => e !== email)); } else { setSelectedAssignees([...selectedAssignees, email]); } };
  const assignContent = async (item: any, type: string) => { if (!selectedClass) return; try { const assignment = JSON.parse(JSON.stringify({ ...item, id: `assign_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, originalId: item.id, contentType: type, targetStudents: targetStudentMode === 'specific' ? selectedAssignees : null })); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: arrayUnion(assignment) }); setAssignModalOpen(false); setTargetStudentMode('all'); setSelectedAssignees([]); setToastMsg(`Assigned: ${item.title}`); } catch (error) { console.error("Assign failed:", error); alert("Failed to assign."); } };

  const addStudentToClass = async (email: string) => {
      if (!selectedClass || !email) return;
      const normalizedEmail = email.toLowerCase().trim();
      if (selectedClass.studentEmails?.includes(normalizedEmail)) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { students: arrayUnion(normalizedEmail), studentEmails: arrayUnion(normalizedEmail) });
          setToastMsg(`Added ${normalizedEmail}`);
      } catch (error) { console.error("Add student failed:", error); alert("Failed to add student."); }
  };

  // --- REMOVE ACTIONS ---
  const removeStudent = async (email: string) => {
      if (!selectedClass || !email) return;
      if (!window.confirm(`Are you sure you want to remove ${email} from this class?`)) return;
      try {
          const newStudents = (selectedClass.students || []).filter((s: string) => s !== email);
          const newEmails = (selectedClass.studentEmails || []).filter((s: string) => s !== email);
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { students: newStudents, studentEmails: newEmails });
          setToastMsg(`Removed ${email}`);
      } catch (e: any) { console.error(e); alert("Error removing student: " + e.message); }
  };

  const removeAssignment = async (assignmentId: string) => {
      if (!selectedClass) return;
      if (!window.confirm("Unassign this content? Student progress logs for this specific task assignment may be lost.")) return;
      try {
          const newAssignments = (selectedClass.assignments || []).filter((a: any) => a.id !== assignmentId);
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: newAssignments });
          setToastMsg("Assignment removed");
      } catch (e: any) { console.error(e); alert("Error removing assignment: " + e.message); }
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
                <button onClick={() => setViewTab('content')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewTab === 'content' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}>Manage</button>
                <button onClick={() => setViewTab('grades')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${viewTab === 'grades' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}>
                    <BarChart3 size={16}/> Grades
                </button>
                <button onClick={() => setViewTab('forum')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewTab === 'forum' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}>Forum</button>
                
                {viewTab === 'content' && (
                    <>
                    <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>
                    <button onClick={() => { setAssignType('lesson'); setAssignModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-wider"><BookOpen size={16}/> ASSIGN LESSON</button>
                    <button onClick={() => { setAssignType('deck'); setAssignModalOpen(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-orange-600 active:scale-95 transition-all uppercase tracking-wider"><Layers size={16}/> ASSIGN DECK</button>
                    <button onClick={() => { setAssignType('test'); setAssignModalOpen(true); }} className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-rose-700 active:scale-95 transition-all uppercase tracking-wider"><HelpCircle size={16}/> ASSIGN EXAM</button>
                    </>
                )}
            </div>
          </div>
        </div>

        {viewTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3>
                    {(!selectedClass.assignments || selectedClass.assignments.length === 0) && <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">No content assigned yet.</div>}
                    {selectedClass.assignments?.map((l: any, idx: number) => ( 
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'test' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                              {l.contentType === 'deck' ? <Layers size={18} /> : l.contentType === 'test' ? <HelpCircle size={18}/> : <FileText size={18} />}
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800">{l.title}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 uppercase">
                                    {l.contentType === 'deck' ? 'Flashcard Deck' : l.contentType === 'test' ? 'Exam' : 'Lesson'}
                                </span>
                                {l.targetStudents && l.targetStudents.length > 0 && (<span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold flex items-center gap-1"><Users size={10}/> {l.targetStudents.length} Students</span>)}
                              </div>
                          </div>
                        </div>
                        <button onClick={() => removeAssignment(l.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Unassign Task"><Trash2 size={16} /></button>
                      </div> 
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Roster</h3><button onClick={() => setIsStudentListOpen(true)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><UserPlus size={14}/> Add Students</button></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">{(!selectedClass.students || selectedClass.students.length === 0) && <div className="p-4 text-center text-slate-400 text-sm italic">No students joined yet.</div>}{selectedClass.students?.map((s: string, i: number) => (
                        <div key={i} className="p-3 border-b border-slate-50 last:border-0 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{s.charAt(0)}</div>
                                <span className="text-sm font-medium text-slate-700">{s}</span>
                            </div>
                            <button onClick={() => removeStudent(s)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remove Student"><Trash2 size={14} /></button>
                        </div>))}
                    </div>
                </div>
            </div>
        )}
        
        {viewTab === 'grades' && (
            <div className="h-full pb-20">
                <ClassGrades classData={selectedClass} />
            </div>
        )}
        
        {viewTab === 'forum' && (
            <div className="h-full pb-20">
                <ClassForum classId={selectedClass.id} user={user} userData={{...userData, role: 'instructor'}} />
            </div>
        )}

        {isStudentListOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-lg">Select Students</h3><button onClick={() => setIsStudentListOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                    <div className="p-4 border-b border-slate-100"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus /></div></div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {availableStudents.length === 0 ? ( <div className="text-center py-8 text-slate-400">Loading students...</div> ) : (
                            // --- FIX APPLIED HERE: Added (s.name || "") fallback ---
                            availableStudents
                            .filter(s => (s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) || (s.email || "").toLowerCase().includes(studentSearch.toLowerCase()))
                            .map((student, idx) => { 
                                const isAdded = selectedClass.students?.includes(student.email); 
                                return ( <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{(student.name || "?").charAt(0)}</div><div><p className="text-sm font-bold text-slate-800">{student.name || "Unknown Name"}</p><p className="text-xs text-slate-500">{student.email}</p></div></div><button onClick={() => addStudentToClass(student.email)} disabled={isAdded} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isAdded ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isAdded ? 'Joined' : 'Add'}</button></div> ) 
                            })
                        )}
                    </div>
                </div>
            </div>
        )}

        {assignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Assign {assignType === 'deck' ? 'Flashcard Deck' : assignType === 'test' ? 'Exam' : 'Lesson'}</h3><button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                  <div className="bg-white p-1 rounded-lg border border-slate-200 flex mb-2"><button onClick={() => setTargetStudentMode('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'all' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Entire Class</button><button onClick={() => setTargetStudentMode('specific')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'specific' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Specific Students</button></div>
                  {targetStudentMode === 'specific' && (<div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 custom-scrollbar">{(!selectedClass.students || selectedClass.students.length === 0) ? (<p className="text-xs text-slate-400 italic text-center p-2">No students in roster.</p>) : (selectedClass.students.map((studentEmail: string) => (<button key={studentEmail} onClick={() => toggleAssignee(studentEmail)} className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded text-left">{selectedAssignees.includes(studentEmail) ? <CheckCircle2 size={16} className="text-indigo-600"/> : <Circle size={16} className="text-slate-300"/>}<span className="text-xs font-medium text-slate-700 truncate">{studentEmail}</span></button>)))}</div>)}
                  {targetStudentMode === 'specific' && <p className="text-[10px] text-slate-400 mt-2 text-right">{selectedAssignees.length} selected</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {assignType === 'deck' && (<div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers size={14}/> Available Decks</h4><div className="space-y-2">{Object.keys(allDecks || {}).length === 0 ? <p className="text-sm text-slate-400 italic">No decks found.</p> : Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => assignContent({ ...deck, id: key }, 'deck')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{deck.title}</h4><p className="text-xs text-slate-500">{deck.cards?.length || 0} Cards</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-orange-500"/></button>))}</div></div>)}
                  {assignType === 'lesson' && (<div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen size={14}/> Available Lessons</h4><div className="space-y-2">{lessons.filter((l:any) => l.type !== 'test').length === 0 ? <p className="text-sm text-slate-400 italic">No lessons found.</p> : lessons.filter((l:any) => l.type !== 'test').map((l: any) => (<button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-indigo-500"/></button>))}</div></div>)}
                  {assignType === 'test' && (<div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><HelpCircle size={14}/> Available Exams</h4><div className="space-y-2">{lessons.filter((l:any) => l.type === 'test').length === 0 ? <p className="text-sm text-slate-400 italic">No exams found.</p> : lessons.filter((l:any) => l.type === 'test').map((l: any) => (<button key={l.id} onClick={() => assignContent(l, 'test')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{(l.questions || []).length} Questions • {l.xp} XP</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-rose-500"/></button>))}</div></div>)}
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
// ============================================================================
// PASTE THIS AT THE VERY BOTTOM OF YOUR FILE
// (Replace your existing RoleToggle and function App)
// ============================================================================
function InstructorDashboard({ user, userData, allDecks, lessons, onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="text-indigo-400"/> Instructor 
            </h1>
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>
        </div>
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
         {/* Mobile Header */}
         <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center"><span className="font-bold flex items-center gap-2"><GraduationCap/> Magister</span><div className="flex gap-4"><button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}><LayoutDashboard/></button><button onClick={() => setActiveTab('classes')} className={activeTab === 'classes' ? 'text-indigo-400' : 'text-slate-400'}><School/></button><button onClick={() => setActiveTab('content')} className={activeTab === 'content' ? 'text-indigo-400' : 'text-slate-400'}><Library/></button></div></div>
         
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto h-full">
                
                {/* 1. DASHBOARD TAB */}
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

                {/* 2. CLASS MANAGER TAB */}
                {activeTab === 'classes' && (
                    <ClassManagerView 
                        user={user} 
                        userData={userData} 
                        classes={userData?.classes || []} 
                        lessons={lessons} 
                        allDecks={allDecks} 
                    />
                )}

                {/* 3. CONTENT LIBRARY TAB (Updated) */}
                {activeTab === 'content' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <BuilderHub 
                                onSaveCard={onSaveCard} 
                                onUpdateCard={onUpdateCard} 
                                onDeleteCard={onDeleteCard} 
                                onSaveLesson={onSaveLesson} 
                                allDecks={allDecks} 
                                lessons={lessons} // <--- Critical: Pass lessons for full library view
                            />
                        </div>
                    </div>
                )}

                {/* 4. PROFILE TAB */}
                {activeTab === 'profile' && <ProfileView user={user} userData={userData} />}
            </div>
         </div>
      </div>
    </div>
  );
}
function RoleToggle({ user, userData }: any) {
  const [switching, setSwitching] = useState(false);

  const handleToggle = async () => {
    if (!user || switching) return;
    setSwitching(true);
    const newRole = userData?.role === 'instructor' ? 'student' : 'instructor';
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole });
    } catch (e) {
        console.error("Error switching role:", e);
    } finally {
        setTimeout(() => setSwitching(false), 500); 
    }
  };

  if (!userData) return null;

  return (
    <button 
      onClick={handleToggle}
      disabled={switching}
      className={`fixed bottom-24 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl border border-white/20 backdrop-blur-xl transition-all duration-500 active:scale-90 group ${
        userData.role === 'instructor' 
          ? 'bg-slate-900/80 text-white hover:bg-slate-800' 
          : 'bg-blue-600/80 text-white hover:bg-blue-500'
      }`}
    >
      <div className={`transition-transform duration-700 ${switching ? 'rotate-180' : ''}`}>
        {switching ? <Loader size={20} className="animate-spin"/> : <ArrowRight size={20} className={userData.role === 'instructor' ? "rotate-180" : ""}/>}
      </div>
      <div className="flex flex-col items-start">
          <span className="text-[9px] uppercase font-bold tracking-widest opacity-70 leading-none">View As</span>
          <span className="text-xs font-bold leading-none">{userData.role === 'instructor' ? 'Magister' : 'Student'}</span>
      </div>
    </button>
  );
}
function WidgetView({ allDecks, userData }: any) {
  // 1. Calculate Daily Card (Reused Logic)
  const preferredDeckId = userData?.widgetDeckId || 'all';
  
  const dailyCard = useMemo(() => {
    let sourceCards: any[] = [];
    if (preferredDeckId === 'all' || !allDecks[preferredDeckId]) {
        Object.values(allDecks).forEach((deck: any) => {
            if (deck.cards) sourceCards.push(...deck.cards);
        });
    } else {
        sourceCards = allDecks[preferredDeckId]?.cards || [];
    }
    if (sourceCards.length === 0) return null;

    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return sourceCards[seed % sourceCards.length];
  }, [allDecks, preferredDeckId]);

  if (!dailyCard) return <div className="h-screen w-screen bg-slate-100 flex items-center justify-center text-xs text-slate-400">No Content</div>;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-4 text-white text-center cursor-pointer" onClick={() => window.open('/', '_self')}>
        
        {/* Widget Header */}
        <div className="flex items-center gap-1.5 mb-2 opacity-80">
            <Zap size={12} className="text-amber-300" fill="currentColor"/>
            <span className="text-[10px] font-bold uppercase tracking-widest">Daily Discovery</span>
        </div>

        {/* Main Content */}
        <h1 className="text-3xl font-serif font-bold mb-1 leading-tight drop-shadow-md">
            {dailyCard.front}
        </h1>
        
        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-3">
            <p className="text-indigo-100 font-serif text-xs tracking-wide">{dailyCard.ipa || '/.../'}</p>
        </div>

        {/* Divider */}
        <div className="w-8 h-0.5 bg-white/20 rounded-full mb-3"></div>

        {/* Meaning */}
        <p className="font-bold text-sm leading-snug max-w-[90%]">
            {dailyCard.back}
        </p>

        <div className="mt-auto pt-2 text-[9px] font-bold uppercase tracking-wider opacity-50">
            Tap to Open App
        </div>
    </div>
  );
}
function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Data State
  const [systemDecks, setSystemDecks] = useState<any>({});
  const [systemLessons, setSystemLessons] = useState<any[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [classLessons, setClassLessons] = useState<any[]>([]);
  
  // Navigation State
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [selectedDeckKey, setSelectedDeckKey] = useState('salutationes');
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);

  // --- MEMOS ---
  const allDecks = useMemo(() => {
    const decks: any = { ...systemDecks, custom: { title: "✍️ Scriptorium", cards: [] } };
    
    // User Custom Cards
    customCards.forEach(card => {
        const target = card.deckId || 'custom';
        if (!decks[target]) { decks[target] = { title: card.deckTitle || "Custom Deck", cards: [] }; }
        if (!decks[target].cards) decks[target].cards = [];
        decks[target].cards.push(card);
    });

    // Assigned Class Decks
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
  }, [systemDecks, customCards, classLessons]);

  // Merge all content for the library
  // (Assuming EMAIL_MODULE_DATA is defined at the top of your file, if not, remove it from this array)
  // If EMAIL_MODULE_DATA is undefined errors, remove it from the array below.
  const lessons = useMemo(() => [...systemLessons, ...customLessons, ...classLessons.filter(l => l.contentType !== 'deck')], [systemLessons, customLessons, classLessons]);
  const libraryLessons = useMemo(() => [...systemLessons, ...customLessons], [systemLessons, customLessons]);

  // --- HANDLERS ---
  const handleContentSelection = (item: any) => { 
      if (item.contentType === 'deck') { 
          setSelectedDeckKey(item.id); 
          setActiveTab('flashcards'); 
          setActiveStudentClass(null); 
          setActiveLesson(null); 
      } else { 
          setActiveLesson(item); 
      } 
  };

  // --- EFFECTS ---
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthChecked(true); }); return () => unsubscribe(); }, []);
  
  useEffect(() => {
    if (!user) { setUserData(null); return; }
    
    // 1. Initial Data Load
    setSystemDecks(INITIAL_SYSTEM_DECKS); 
    setSystemLessons(INITIAL_SYSTEM_LESSONS);
    
    // 2. Listeners
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (docSnap) => { if (docSnap.exists()) setUserData(docSnap.data()); else setUserData(DEFAULT_USER_DATA); });
    const unsubCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), (snap) => setCustomCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLessons = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), (snap) => setCustomLessons(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // 3. Class Logic
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
        cls.forEach((c: any) => { if (c.assignments && Array.isArray(c.assignments)) { newAssignments.push(...c.assignments); } }); 
        setClassLessons(newAssignments); 
        setUserData((prev: any) => ({...prev, classes: cls, classAssignments: newAssignments})); 
    }, (error) => { console.log("Class sync error:", error); setUserData((prev: any) => ({...prev, classSyncError: true})); });
    
    return () => { unsubProfile(); unsubCards(); unsubLessons(); unsubClasses(); };
  }, [user, userData?.role]);

  // --- ACTIONS ---
  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card. Check permissions."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Are you sure you want to delete this card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); alert("Failed to delete card."); } }, [user]);
  const handleCreateLesson = useCallback(async (l: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), l); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), l); } setActiveTab('home'); }, [user]);
  
  const handleFinishLesson = useCallback(async (lessonId: string, xp: number, title?: string, scoreDetail?: any) => { 
    if (userData?.role !== 'instructor') setActiveTab('home'); 
    if (xp > 0 && user) { 
        try { 
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp), completedAssignments: arrayUnion(lessonId) }); 
            await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: userData?.name || 'Unknown Student', studentEmail: user.email, itemTitle: title || 'Unknown Activity', xp: xp, timestamp: Date.now(), type: scoreDetail ? 'quiz_score' : 'completion', scoreDetail: scoreDetail || null });
            if(userData?.role === 'instructor') alert(`Activity Logged: ${title} (+${xp}XP)`);
        } catch (e: any) { 
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { ...DEFAULT_USER_DATA, xp: xp, completedAssignments: [lessonId] }, { merge: true }); 
        } 
    } 
  }, [user, userData]);

  // --- RENDER HELPERS ---
  if (!authChecked) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>;
  if (!user) return <AuthView />;
  if (!userData) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>; 
  
  const commonHandlers = { onSaveCard: handleCreateCard, onUpdateCard: handleUpdateCard, onDeleteCard: handleDeleteCard, onSaveLesson: handleCreateLesson, };


const renderStudentView = () => {
    // 1. Check for Test (Expanded check)
    if (activeLesson && (activeLesson.type === 'test' || activeLesson.contentType === 'test')) {
        // @ts-ignore
        return <TestPlayerView test={activeLesson} onFinish={(id: string, xp: number, title: string, score: any) => { handleFinishLesson(id, xp, title, score); setActiveLesson(null); }} />;
    }

    // 2. Check for Email Module
    if (activeLesson && activeLesson.type === 'email_module') {
        // @ts-ignore
        return <EmailSimulatorView module={activeLesson} onFinish={(id: string, xp: number, title: string) => { handleFinishLesson(id, xp, title); setActiveLesson(null); }} />;
    }

    // 3. Standard Lesson
    if (activeLesson) return <LessonView lesson={activeLesson} onFinish={(id: string, xp: number, title: string) => { handleFinishLesson(id, xp, title); setActiveLesson(null); }} />;
    
    // 4. Specific Class View
    if (activeTab === 'home' && activeStudentClass) return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} />;
    
    // 5. Main Tab Navigation
    switch (activeTab) {
case 'home': return <HomeView setActiveTab={setActiveTab} allDecks={allDecks} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} />;      case 'flashcards': 
          const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck');
          const deckToLoad = assignedDeck || allDecks[selectedDeckKey];
          return <FlashcardView allDecks={allDecks} selectedDeckKey={selectedDeckKey} onSelectDeck={setSelectedDeckKey} onSaveCard={handleCreateCard} activeDeckOverride={deckToLoad} onComplete={handleFinishLesson} />;
      case 'create': return <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={handleCreateLesson} allDecks={allDecks} />;
      case 'profile': return <ProfileView user={user} userData={userData} />;
      default: return <HomeView />;
    }
  };

// --- FINAL RENDER ---
  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans text-slate-900 flex justify-center items-center relative overflow-hidden">
      
{/* 1. FORCEFUL CSS RESET & SCROLLBAR REMOVAL */}
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden; /* Prevents the main window from scrolling */
          background-color: #f8fafc;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        *::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        * {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* Background Blobs (Optional - adds nice glow behind the app) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-400/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      
      {/* Role Toggle */}
      <RoleToggle user={user} userData={userData} />

      {/* THE MAIN VESSEL 
         - Removed: border-[8px], p-4
         - Added: w-full h-full (Consume everything)
      */}
      <div className={`w-full h-[100dvh] relative overflow-hidden bg-slate-50 ${userData?.role === 'instructor' ? 'max-w-full' : 'max-w-full sm:max-w-[400px] sm:h-[850px] sm:rounded-[3rem] sm:shadow-2xl sm:border-[8px] sm:border-slate-900/10'}`}>
        
        {/* Status Bar Spacer (Only for Instructor/Desktop view or strict mobile setups) */}
        {userData?.role !== 'instructor' && <div className="absolute top-0 left-0 right-0 h-safe-top bg-transparent z-50 pointer-events-none" />}
        
        {userData.role === 'instructor' ? (
             <InstructorDashboard 
                user={user} 
                userData={{...userData, classes: enrolledClasses}} 
                allDecks={allDecks} 
                lessons={libraryLessons} 
                {...commonHandlers} 
                onLogout={() => signOut(auth)} 
             />
) : (
     <>
        {renderStudentView()}
        {/* Hide Navigation if taking a Test/Lesson or viewing a Class */}
        {!activeLesson && !activeStudentClass && (
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
     </>
)}

      </div>
    </div>
  );
}

export default App;
