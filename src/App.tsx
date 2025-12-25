import './index.css';
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
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
  getDocs,
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
  BrainCircuit, Swords, Heart, Skull, Shield, Hourglass, Flame, Crown, Crosshair,Map, TrendingUp, Footprints,ArrowUp, Eye, EyeOff, Settings2,Type,ImageIcon,Video,Code,Quote,ArrowDownUp,Minus,MoreHorizontal, Mic, Lock, GitFork, RotateCcw,
  Inbox, MessageCircle, Send, Bell, Megaphone, XCircle, Palette, Link as LinkIcon, 
  MapPin, Flag, Sparkles, Building, Cloud, Star,BarChart2, Timer, RotateCw, Speaker, Play, Maximize2  // <--- Added these for the new game modes
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

// ============================================================================
//  ANALYTICS HOOK: TRACKS TIME SPENT
// ============================================================================
const useLearningTimer = (user: any, activityId: string, activityType: string, title: string) => {
    useEffect(() => {
        if (!user || !activityId) return;
        const startTime = Date.now();

        // This runs automatically when the user leaves the screen
        return () => {
            const endTime = Date.now();
            const durationSec = Math.round((endTime - startTime) / 1000);

            // Filter out accidental clicks (< 5 seconds)
            if (durationSec > 5) {
                try {
                    addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
                        studentName: user.displayName || user.email.split('@')[0],
                        studentEmail: user.email,
                        itemTitle: title || 'Unknown Activity',
                        itemId: activityId,
                        type: 'time_log', // Special type for analytics
                        activityType: activityType, // 'lesson', 'deck', 'test'
                        duration: durationSec,
                        timestamp: Date.now()
                    });
                    console.log(`⏱️ Logged ${durationSec}s for ${title}`);
                } catch (e) {
                    console.error("Failed to log time:", e);
                }
            }
        };
    }, [user, activityId]); // Re-starts if the user switches lessons immediately
};

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
// --- DATE HELPERS ---
const getDueStatus = (timestamp: number | null) => {
  if (!timestamp) return null;
  
  const now = new Date();
  const due = new Date(timestamp);
  
  // Reset hours to compare pure dates
  now.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d Late`, color: 'bg-rose-100 text-rose-700', urgent: true };
  if (diffDays === 0) return { label: 'Due Today', color: 'bg-amber-100 text-amber-700', urgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-amber-50 text-amber-600', urgent: false };
  if (diffDays <= 3) return { label: `${diffDays} Days left`, color: 'bg-blue-50 text-blue-600', urgent: false };
  
  return { label: new Date(timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}), color: 'bg-slate-100 text-slate-500', urgent: false };
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
// --- HELPER: RANK DEFINITIONS ---
const RANK_MILESTONES = [
  { name: "Beginner", minXP: 0, icon: "🌱", color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-200" },
  { name: "Elementary", minXP: 500, icon: "🔥", color: "text-orange-500", bg: "bg-orange-100", border: "border-orange-200" },
  { name: "Intermediate", minXP: 1000, icon: "⚔️", color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-200" },
  { name: "Advanced", minXP: 2000, icon: "🛡️", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200" },
  { name: "Native-like", minXP: 5000, icon: "👑", color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-200" }
];

function LevelUpModal({ userData, onClose }: any) {
  const [activeTab, setActiveTab] = useState<'stats' | 'journey'>('stats');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Calculate Levels
  const { level, currentLevelXP, nextLevelXP, progress, rank } = getLevelInfo(userData?.xp || 0);
  const xpNeeded = nextLevelXP - currentLevelXP;
  
  // Counts
  const completedCount = (userData?.completedAssignments || []).length;
  const classCount = (userData?.classes || []).length;

  // --- FETCH HISTORY ---
  useEffect(() => {
    if (activeTab === 'journey' && history.length === 0) {
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                if (!userData?.email) return;
                const q = query(
                    collection(db, 'artifacts', appId, 'activity_logs'),
                    where('studentEmail', '==', userData.email),
                    orderBy('timestamp', 'desc'),
                    limit(50) // Limit to last 50 actions for performance
                );
                const snapshot = await getDocs(q);
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(logs);
            } catch (e) {
                console.error("Error fetching history:", e);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }
  }, [activeTab, userData]);

  // --- HELPER: GET ICON FOR ACTIVITY ---
  const getActivityIcon = (type: string) => {
      if (type === 'game_reward') return <Swords size={16} />;
      if (type === 'quiz_score') return <Trophy size={16} />;
      return <BookOpen size={16} />;
  };

  const getActivityColor = (type: string) => {
      if (type === 'game_reward') return 'bg-rose-100 text-rose-600 border-rose-200';
      if (type === 'quiz_score') return 'bg-amber-100 text-amber-600 border-amber-200';
      return 'bg-blue-100 text-blue-600 border-blue-200';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-slate-50 w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* --- HEADER --- */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 p-8 pt-12 text-center shrink-0">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-md transition-all z-20">
                <X size={20} />
            </button>

            {/* Avatar */}
            <div className="relative inline-block">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl mb-4 overflow-hidden transform rotate-3">
                    {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-serif font-bold text-4xl text-white">{userData?.name?.charAt(0) || "U"}</span>
                    )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg border border-white/50">
                    LVL {level}
                </div>
            </div>

            <h2 className="text-3xl font-serif font-bold text-white tracking-tight drop-shadow-md">{userData?.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
                <span className="bg-white/10 text-blue-100 text-xs font-bold px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm flex items-center gap-1">
                    <Award size={12} /> {rank}
                </span>
            </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex p-2 bg-white border-b border-slate-100">
            <button onClick={() => setActiveTab('stats')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'stats' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
                <BarChart3 size={16} /> Overview
            </button>
            <button onClick={() => setActiveTab('journey')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'journey' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Footprints size={16} /> History
            </button>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative custom-scrollbar">
            
            {activeTab === 'stats' && (
                <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                    {/* Level Progress */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Level Progress</span>
                            <span className="text-sm font-black text-indigo-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 text-center"><span className="font-bold text-slate-800">{xpNeeded} XP</span> to Level {level + 1}</p>
                    </div>

                    {/* Bento Grid Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-2"><Zap size={20} fill="currentColor"/></div>
                            <span className="text-2xl font-black text-slate-800">{userData?.streak || 1}</span>
                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Day Streak</span>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-2"><Award size={20}/></div>
                            <span className="text-2xl font-black text-slate-800">{userData?.xp || 0}</span>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total XP</span>
                        </div>
                        <div className="col-span-2 bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 size={20} /></div>
                                <div>
                                    <span className="block text-xl font-black text-slate-800">{completedCount}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assignments</span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-100"></div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="block text-xl font-black text-slate-800 text-right">{classCount}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Classes</span>
                                </div>
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><School size={20} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'journey' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pl-2">
                    {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <Loader className="animate-spin text-indigo-600" size={32} />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracing footsteps...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">
                            <p>No journey data yet.</p>
                            <p className="text-xs mt-2">Complete a lesson to start your path.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                            {history.map((log: any) => (
                                <div key={log.id} className="relative pl-8">
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[17px] top-0 w-9 h-9 rounded-full border-4 border-slate-50 flex items-center justify-center ${getActivityColor(log.type)}`}>
                                        {getActivityIcon(log.type)}
                                    </div>
                                    
                                    {/* Content Card */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{log.itemTitle}</h4>
                                            <span className="text-emerald-600 text-xs font-black">+{log.xp} XP</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="capitalize">{log.type.replace('_', ' ')}</span>
                                        </div>
                                        {log.scoreDetail && (
                                            <div className="mt-3 bg-slate-50 rounded-lg p-2 flex items-center gap-3">
                                                <div className={`text-lg font-black ${log.scoreDetail.score/log.scoreDetail.total >= 0.7 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100)}%
                                                </div>
                                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${log.scoreDetail.score/log.scoreDetail.total >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                        style={{ width: `${(log.scoreDetail.score / log.scoreDetail.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Start Node */}
                            <div className="relative pl-8 pb-4">
                                <div className="absolute -left-[13px] top-0 w-7 h-7 rounded-full bg-slate-200 border-4 border-slate-50 flex items-center justify-center text-slate-400">
                                    <User size={12} />
                                </div>
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest pt-1">Joined the Academy</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
// --- PROFILE CONSTANTS ---
const ACHIEVEMENTS_DATA = [
  { id: 'novice', label: 'Novice', icon: '🌱', xpThreshold: 0, description: 'Started the journey' },
  { id: 'scholar', label: 'Scholar', icon: '📚', xpThreshold: 500, description: 'Earned 500 XP' },
  { id: 'sage', label: 'Sage', icon: '🔮', xpThreshold: 2000, description: 'Earned 2000 XP' },
  { id: 'streak_fire', label: 'On Fire', icon: '🔥', streakThreshold: 3, description: '3 Day Streak' },
  { id: 'streak_titan', label: 'Titan', icon: '⚡', streakThreshold: 7, description: '7 Day Streak' },
  { id: 'social', label: 'Voice', icon: '🗣️', type: 'special', description: 'Participated in Forum' }
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// --- BEEFED UP PROFILE VIEW (FIXED LAYOUT) ---
function ProfileView({ user, userData }: any) {
  // Stats Calculation
  const joinDate = new Date(userData?.created || Date.now()).toLocaleDateString();
  const xp = userData?.xp || 0;
  const assignments = userData?.completedAssignments?.length || 0;
  const level = Math.floor(xp / 1000) + 1;

  // Sign Out Handler
  const handleLogout = () => signOut(auth);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50 pb-24">
      
      {/* 1. Header Card */}
      <div className="bg-slate-900 text-white pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-xl shadow-indigo-900/20 relative overflow-hidden mb-6">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
             <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-700/50 shadow-2xl flex items-center justify-center text-3xl font-serif font-bold mb-4 overflow-hidden relative group">
                 {userData?.photoURL ? (
                     <img src={userData.photoURL} className="w-full h-full object-cover" />
                 ) : (
                     <span className="group-hover:scale-110 transition-transform">{user?.email?.charAt(0).toUpperCase()}</span>
                 )}
                 <div className="absolute inset-0 ring-4 ring-indigo-500/20 rounded-full"></div>
             </div>
             
             <h2 className="text-2xl font-bold mb-1">{userData?.name || user?.email?.split('@')[0]}</h2>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                 <span>Scholar</span> • <span>Joined {joinDate}</span>
             </div>
          </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="px-6 grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full mb-1"><Trophy size={20}/></div>
              <span className="text-2xl font-black text-slate-800">{level}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Level</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full mb-1"><CheckCircle2 size={20}/></div>
              <span className="text-2xl font-black text-slate-800">{assignments}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Completed</span>
          </div>
      </div>

      {/* 3. Settings Menu */}
      <div className="px-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1">Account Settings</h3>
          
          <button className="w-full p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between group hover:border-indigo-300 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><User size={20}/></div>
                  <div className="text-left">
                      <div className="font-bold text-slate-700 text-sm">Edit Profile</div>
                      <div className="text-[10px] text-slate-400">Name, Avatar, Bio</div>
                  </div>
              </div>
              <ChevronRight size={16} className="text-slate-300"/>
          </button>

          <button className="w-full p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between group hover:border-indigo-300 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Bell size={20}/></div>
                  <div className="text-left">
                      <div className="font-bold text-slate-700 text-sm">Notifications</div>
                      <div className="text-[10px] text-slate-400">Email & Push Alerts</div>
                  </div>
              </div>
              <ChevronRight size={16} className="text-slate-300"/>
          </button>

          <button onClick={handleLogout} className="w-full p-4 mt-6 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-center gap-2 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-colors shadow-sm">
              <LogOut size={18}/> Sign Out
          </button>
          
          <p className="text-center text-[10px] text-slate-300 mt-4">Magister LMS v1.0.4 • Epix Latin</p>
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

function FlashcardView({ 
  allDecks, 
  selectedDeckKey, 
  onSelectDeck, 
  onSaveCard, 
  activeDeckOverride, 
  onComplete, 
  onLogActivity, 
  userData, 
  onUpdatePrefs, 
  onDeleteDeck 
}: any) {
  
  // 1. DATA PREP (Must be first for the hook)
  const currentDeck = activeDeckOverride || allDecks[selectedDeckKey];
  const userPrefs = userData?.deckPreferences || { hiddenDeckIds: [], customOrder: [] };

  // 2. ANALYTICS HOOK
  useLearningTimer(
      userData ? auth.currentUser : null, 
      selectedDeckKey, 
      'deck', 
      currentDeck?.title || 'Flashcards'
  );

  // --- STATE ---
  const [viewState, setViewState] = useState<'browsing' | 'playing'>(activeDeckOverride ? 'playing' : 'browsing');
  const [filterLang, setFilterLang] = useState('All');
  const [isEditMode, setIsEditMode] = useState(false);
  const [completionMsg, setCompletionMsg] = useState<string | null>(null);

  // Accordion State
  const [openSections, setOpenSections] = useState({
    assignments: true,
    custom: true,
    library: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  };

  // Player State
  const [gameMode, setGameMode] = useState('study'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Pointer/Swipe State
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const minSwipeDistance = 50; 

  // --- MEMOS & FILTERING ---
  const { assignments, customDecks, libraryDecks, allProcessed, languages } = useMemo(() => {
      const isHidden = (id: string) => userPrefs.hiddenDeckIds?.includes(id);

      const processed = Object.entries(allDecks)
        .filter(([_, deck]: any) => deck.cards && deck.cards.length > 0)
        .map(([key, deck]: any) => {
            const detectedLang = deck.targetLanguage || deck.cards[0]?.targetLanguage || 'General';
            let category = 'library';
            if (deck.isAssignment) category = 'assignment';
            else if (key.startsWith('custom')) category = 'custom';

            return { id: key, ...deck, language: detectedLang, category, isHidden: isHidden(key) };
        });

      // Sort Order Logic
      const sortOrder = userPrefs.customOrder || [];
      const sorter = (a: any, b: any) => {
          const idxA = sortOrder.indexOf(a.id);
          const idxB = sortOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.title.localeCompare(b.title);
      };

      const langs = new Set(processed.map(d => d.language));

      return {
          assignments: processed.filter(d => d.category === 'assignment').sort(sorter),
          customDecks: processed.filter(d => d.category === 'custom').sort(sorter),
          libraryDecks: processed.filter(d => d.category === 'library').sort(sorter),
          allProcessed: processed,
          languages: ['All', ...Array.from(langs).sort()]
      };
  }, [allDecks, userPrefs]);

  // Apply Language & Visibility Filters
  const filterList = (list: any[]) => {
      let filtered = list;
      if (filterLang !== 'All') filtered = filtered.filter(d => d.language === filterLang);
      if (!isEditMode) filtered = filtered.filter(d => !d.isHidden);
      return filtered;
  };

  const visibleAssignments = filterList(assignments);
  const visibleCustom = filterList(customDecks);
  const visibleLibrary = filterList(libraryDecks);
  const totalCardsAvailable = allProcessed.reduce((acc, deck: any) => acc + deck.cards.length, 0);

  // Player Data
  const deckCards = currentDeck?.cards || [];
  const card = deckCards[currentIndex];
  const theme = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.noun) : TYPE_COLORS.noun;

  // --- ACTIONS ---
  const launchDeck = (key: string) => {
    if (isEditMode) return;
    onSelectDeck(key);
    setCurrentIndex(0);
    setIsFlipped(false);
    setViewState('playing');
  };

  const handleQuickStudy = () => {
    if (allProcessed.length === 0) return;
    const largestDeck = allProcessed.sort((a: any, b: any) => b.cards.length - a.cards.length)[0];
    launchDeck(largestDeck.id);
  };

  // Preference Handlers
  const handleMove = (id: string, direction: 'up' | 'down', list: any[]) => {
      const currentOrder = list.map(d => d.id);
      const currentIndex = currentOrder.indexOf(id);
      if (currentIndex === -1) return;

      const newOrder = [...currentOrder];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return;

      [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

      // Sync with global order
      const globalOrder = [...(userPrefs.customOrder || [])];
      list.forEach(d => { if(!globalOrder.includes(d.id)) globalOrder.push(d.id); });
      
      const id1 = currentOrder[currentIndex];
      const id2 = currentOrder[targetIndex];
      const gIdx1 = globalOrder.indexOf(id1);
      const gIdx2 = globalOrder.indexOf(id2);
      
      if(gIdx1 !== -1 && gIdx2 !== -1) {
          [globalOrder[gIdx1], globalOrder[gIdx2]] = [globalOrder[gIdx2], globalOrder[gIdx1]];
      }
      onUpdatePrefs({ ...userPrefs, customOrder: globalOrder });
  };

  const handleToggleHide = (id: string) => {
      const hidden = userPrefs.hiddenDeckIds || [];
      const newHidden = hidden.includes(id) ? hidden.filter((h: string) => h !== id) : [...hidden, id];
      onUpdatePrefs({ ...userPrefs, hiddenDeckIds: newHidden });
  };

  // Game/Player Handlers
  const handleGameEnd = (data: any) => { 
      let xp = 0;
      let message = "";
      if (typeof data === 'number') {
          xp = data;
          message = `Matching Complete! +${xp} XP`;
      } else {
          const percentage = Math.round((data.score / data.total) * 100);
          xp = Math.round((data.score / data.total) * 50) + 10;
          message = `Score: ${percentage}% (${data.score}/${data.total}) • +${xp} XP`;
      }
      setCompletionMsg(message);

      if (activeDeckOverride && onComplete) {
          onComplete(activeDeckOverride.id, xp, currentDeck.title, data.score !== undefined ? data : null); 
      } else if (onLogActivity) {
          const scoreDetail = data.score !== undefined ? data : null;
          onLogActivity(selectedDeckKey, xp, `${currentDeck.title} (${gameMode})`, scoreDetail);
          setViewState('browsing');
      } else {
          setViewState('browsing');
      }
  };

  const handleNext = useCallback(() => {
    setXrayMode(false); setIsFlipped(false); setSwipeDirection('left');
    setTimeout(() => { setCurrentIndex((prev) => (prev + 1) % deckCards.length); setSwipeDirection(null); }, 200);
  }, [deckCards.length]);

  const handlePrev = useCallback(() => {
    setXrayMode(false); setIsFlipped(false); setSwipeDirection('right');
    setTimeout(() => { setCurrentIndex((prev) => (prev - 1 + deckCards.length) % deckCards.length); setSwipeDirection(null); }, 200);
  }, [deckCards.length]);

  const playAudio = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => { setDragEndX(null); setDragStartX(e.clientX); };
  const onPointerMove = (e: React.PointerEvent) => { if (dragStartX !== null) setDragEndX(e.clientX); };
  const onPointerUp = () => {
    if (dragStartX === null || dragEndX === null) { setDragStartX(null); return; }
    const distance = dragStartX - dragEndX;
    if (distance > minSwipeDistance) handleNext(); else if (distance < -minSwipeDistance) handlePrev();
    setDragStartX(null); setDragEndX(null);
  };

  // --- SUB-COMPONENTS ---
  
  const DeckCard = ({ deck, icon, colorClass, borderClass, fullList }: any) => (
      <div 
          onClick={() => launchDeck(deck.id)}
          className={`w-full bg-white p-4 rounded-2xl border shadow-sm transition-all flex flex-col gap-3 group relative overflow-hidden text-left ${
              isEditMode 
              ? 'border-slate-300 border-dashed cursor-default' 
              : `hover:shadow-md cursor-pointer ${borderClass || 'border-slate-100 hover:border-indigo-200'}`
          } ${deck.isHidden ? 'opacity-60 bg-slate-50' : ''}`}
      >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              deck.language === 'Latin' ? 'bg-purple-500' : 
              deck.language === 'Spanish' ? 'bg-orange-500' :
              deck.language === 'English' ? 'bg-blue-500' : 'bg-slate-300'
          }`}></div>

          <div className="flex justify-between items-start w-full pl-2">
              <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors ${deck.isHidden ? 'bg-slate-200 text-slate-400' : colorClass}`}>
                      {icon}
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 text-base leading-tight group-hover:text-indigo-700 transition-colors line-clamp-1 flex items-center gap-2">
                          {deck.title}
                          {deck.isHidden && <span className="text-[9px] bg-slate-200 text-slate-500 px-1 rounded uppercase">Hidden</span>}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Globe size={10}/> {deck.language}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              <Layers size={10}/> {deck.cards.length}
                          </span>
                      </div>
                  </div>
              </div>
              
              {isEditMode ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleMove(deck.id, 'up', fullList)} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-600"><ArrowUp size={16}/></button>
                      <button onClick={() => handleMove(deck.id, 'down', fullList)} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-600"><ArrowDown size={16}/></button>
                      <button onClick={() => handleToggleHide(deck.id)} className="p-2 bg-slate-100 rounded-lg hover:bg-amber-100 hover:text-amber-600">
                          {deck.isHidden ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                      {deck.category === 'custom' && (
                          <button onClick={() => onDeleteDeck(deck.id)} className="p-2 bg-rose-50 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 ml-1">
                              <Trash2 size={16}/>
                          </button>
                      )}
                  </div>
              ) : (
                  <div className="text-slate-300 group-hover:text-indigo-500 transition-colors"><ChevronRight size={18}/></div>
              )}
          </div>
          
          {!isEditMode && (
              <div className="w-full pl-2 pr-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <span>Progress</span><span>{deck.mastery || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deck.mastery || 5}%` }}></div>
                  </div>
              </div>
          )}
      </div>
  );

  const SectionAccordion = ({ title, icon, count, isOpen, onToggle, children, colorTheme = "indigo" }: any) => {
    const theme: any = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    };
    const t = theme[colorTheme] || theme.indigo;

    return (
        <div className={`mb-4 rounded-2xl bg-white border ${isOpen ? t.border : 'border-slate-200'} shadow-sm overflow-hidden transition-all duration-300`}>
            <button onClick={onToggle} className="w-full p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.bg} ${t.text}`}>{icon}</div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{count} Decks</p>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100' : ''}`}>
                    <ChevronDown size={16} />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 border-t border-slate-50">
                    <div className="pt-4 grid grid-cols-1 gap-3">{children}</div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <>
      {completionMsg && <Toast message={completionMsg} onClose={() => setCompletionMsg(null)} />}

      {viewState === 'browsing' ? (
        <div className="h-full bg-slate-50 flex flex-col overflow-y-auto pb-24 animate-in fade-in custom-scrollbar">
            <div className="bg-white p-6 pb-2 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Practice Hub</h1>
                    <div className="flex gap-2">
                        {languages.length > 1 && (
                            <button onClick={() => {
                                const idx = languages.indexOf(filterLang);
                                setFilterLang(languages[(idx + 1) % languages.length]);
                            }} className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                {filterLang}
                            </button>
                        )}
                        <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${isEditMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Settings2 size={12}/> {isEditMode ? 'Done' : 'Manage'}
                        </button>
                    </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex-1 min-w-[140px] bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center">
                        <span className="text-2xl font-black text-indigo-600">{totalCardsAvailable}</span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Total Cards</span>
                    </div>
                    <div className="flex-1 min-w-[140px] bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center">
                        <span className="text-2xl font-black text-emerald-600">{allProcessed.length}</span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Active Decks</span>
                    </div>
                    <button onClick={handleQuickStudy} className="flex-1 min-w-[140px] bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex flex-col justify-center items-center group">
                        <PlayCircle size={24} className="mb-1 group-hover:scale-110 transition-transform"/>
                        <span className="text-[10px] font-bold uppercase tracking-wide">Quick Review</span>
                    </button>
                </div>
            </div>

            <div className="p-6">
                {(isEditMode ? assignments : visibleAssignments).length > 0 && (
                    <SectionAccordion title="Class Assignments" icon={<School size={20}/>} count={(isEditMode ? assignments : visibleAssignments).length} isOpen={openSections.assignments} onToggle={() => toggleSection('assignments')} colorTheme="amber">
                        {(isEditMode ? assignments : visibleAssignments).map((deck: any) => <DeckCard key={deck.id} deck={deck} fullList={assignments} icon={<School size={20}/>} colorClass="bg-amber-100 text-amber-600" borderClass="border-amber-200 hover:border-amber-400" />)}
                    </SectionAccordion>
                )}

                <SectionAccordion title="My Collections" icon={<Feather size={20}/>} count={(isEditMode ? customDecks : visibleCustom).length} isOpen={openSections.custom} onToggle={() => toggleSection('custom')} colorTheme="emerald">
                    {(isEditMode ? customDecks : visibleCustom).length > 0 ? (isEditMode ? customDecks : visibleCustom).map((deck: any) => <DeckCard key={deck.id} deck={deck} fullList={customDecks} icon={<Feather size={20}/>} colorClass="bg-emerald-100 text-emerald-600" borderClass="border-slate-100 hover:border-emerald-300" />) : <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center"><p className="text-sm text-slate-400 font-bold">No custom decks yet.</p><p className="text-xs text-slate-300 mt-1">Use the Creator tab to build one!</p></div>}
                </SectionAccordion>

                <SectionAccordion title="System Library" icon={<Library size={20}/>} count={(isEditMode ? libraryDecks : visibleLibrary).length} isOpen={openSections.library} onToggle={() => toggleSection('library')} colorTheme="blue">
                    {(isEditMode ? libraryDecks : visibleLibrary).length > 0 ? (isEditMode ? libraryDecks : visibleLibrary).map((deck: any) => <DeckCard key={deck.id} deck={deck} fullList={libraryDecks} icon={<BookOpen size={20}/>} colorClass="bg-blue-100 text-blue-600" borderClass="border-slate-100 hover:border-blue-300" />) : <div className="p-4 text-center text-slate-400 text-xs italic">Library empty for this filter.</div>}
                </SectionAccordion>
                <div className="h-8"></div>
            </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 pb-6 relative overflow-hidden">
          <Header title={currentDeck?.title || "Deck"} subtitle={`${currentIndex + 1} / ${deckCards.length} Cards`} sticky={false} onClickTitle={() => setViewState('browsing')} rightAction={<button onClick={() => setViewState('browsing')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X size={20} /></button>} />
          
          <div className="px-6 mt-2 mb-4 z-10">
              <div className="flex bg-slate-200 p-1 rounded-xl w-full max-w-sm mx-auto shadow-inner">
                  {['study', 'quiz', 'match'].map((mode) => (
                      <button key={mode} onClick={() => setGameMode(mode)} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg capitalize transition-all ${gameMode === mode ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>{mode}</button>
                  ))}
              </div>
          </div>
          
          <div className="flex-1 relative w-full overflow-hidden">
              {gameMode === 'match' && <div className="h-full overflow-y-auto"><MatchingGame deckCards={deckCards} onGameEnd={handleGameEnd} /></div>}
              {gameMode === 'quiz' && <div className="h-full overflow-y-auto"><QuizGame deckCards={deckCards} onGameEnd={handleGameEnd} /></div>}
              {gameMode === 'study' && card && (
                <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 perspective-1000 relative z-0 h-full" style={{ perspective: '1000px', touchAction: 'pan-y' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                    <div className={`relative w-full h-full max-h-[520px] cursor-pointer shadow-2xl rounded-[2rem] transition-transform duration-300 ${swipeDirection === 'left' ? '-translate-x-full opacity-0 rotate-[-10deg]' : swipeDirection === 'right' ? 'translate-x-full opacity-0 rotate-[10deg]' : 'translate-x-0 opacity-100'}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped && !swipeDirection ? 'rotateY(180deg)' : swipeDirection ? undefined : 'rotateY(0deg)' }} onClick={() => !xrayMode && setIsFlipped(!isFlipped)}>
                        <div className="absolute inset-0 bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col select-none" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                            <div className={`h-3 w-full ${xrayMode ? theme.bg.replace('50', '500') : 'bg-slate-100'} transition-colors duration-500`} />
                            <div className="flex-1 flex flex-col p-6 relative">
                                <div className="flex justify-between items-start mb-8"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>{card.type}</span><span className="text-xs font-mono text-slate-300">{currentIndex + 1}/{deckCards.length}</span></div>
                                <div className="flex-1 flex flex-col items-center justify-center mt-[-40px]">
                                    <h2 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 text-center mb-6 leading-tight select-none">{card.front}</h2>
                                    <div onClick={(e) => { e.stopPropagation(); playAudio(card.front); }} className="flex items-center gap-3 bg-slate-50 pl-3 pr-5 py-2 rounded-full border border-slate-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors group active:scale-95 shadow-sm"><Volume2 size={16} className="text-indigo-400"/><span className="font-serif text-slate-500 text-lg tracking-wide group-hover:text-indigo-800 select-none">{card.ipa || "/.../"}</span></div>
                                </div>
                                <div className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 transition-all duration-300 flex flex-col overflow-hidden z-20 ${xrayMode ? 'h-[75%] opacity-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]' : 'h-0 opacity-0'}`} onClick={e => e.stopPropagation()}>
                                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                            <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Puzzle size={14} /> Morphology</h4><div className="flex flex-wrap gap-2">{Array.isArray(card.morphology) && card.morphology.map((m: any, i: number) => (<div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[60px]"><span className={`font-bold text-lg ${m.type === 'root' ? 'text-indigo-600' : 'text-slate-700'}`}>{m.part}</span><span className="text-slate-400 text-[9px] font-medium uppercase mt-1 text-center max-w-[80px] leading-tight">{m.meaning}</span></div>))}</div></div>
                                            <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare size={14} /> Context</h4><div className={`p-4 rounded-xl border ${theme.border} ${theme.bg}`}><p className="text-slate-800 font-serif font-medium text-lg mb-1">"{card.usage?.sentence || '...'}"</p><p className={`text-sm ${theme.text} opacity-80 italic`}>{card.usage?.translation || '...'}</p></div></div>
                                    </div>
                                </div>
                                {!xrayMode && (<div className="mt-auto text-center"><p className="text-xs text-slate-300 font-bold uppercase tracking-widest animate-pulse flex items-center justify-center gap-2"><ArrowLeft size={10}/> Swipe <ArrowRight size={10}/></p></div>)}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-slate-900 rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-8 text-white relative overflow-hidden select-none" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col items-center"><span className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border-b border-indigo-500/30 pb-2">Translation</span><h2 className="text-3xl md:text-4xl font-bold text-center mb-8 leading-tight">{card.back}</h2></div>
                        </div>
                    </div>
                </div>
              )}
          </div>
          
          {gameMode === 'study' && card && (
            <div className="px-6 pb-4 pt-2">
              <div className="flex items-center justify-between max-w-sm mx-auto">
                <button onClick={handlePrev} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-rose-50"><X size={28} strokeWidth={2.5} /></button>
                <button onClick={(e) => { e.stopPropagation(); if(isFlipped) setIsFlipped(false); setXrayMode(!xrayMode); }} className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 border-2 ${xrayMode ? 'bg-indigo-600 border-indigo-600 text-white translate-y-[-8px] shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}><Search size={28} strokeWidth={xrayMode ? 3 : 2} className={xrayMode ? 'animate-pulse' : ''} /><span className="text-[10px] font-black tracking-wider mt-1">X-RAY</span></button>
                <button onClick={handleNext} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-emerald-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-emerald-50"><Check size={28} strokeWidth={2.5} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
// ============================================================================
//  ULTIMATE LESSON VIEW (Decks, Scenarios, Chat, & Interactive Quizzes)
// ============================================================================

// --- SUB-COMPONENT: JUICY DECK (Flashcards/Vocab) ---
const JuicyDeckBlock = ({ items, title }: any) => {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0); 

    const currentCard = items[index];

    const handleSwipe = (dir: number) => {
        setIsFlipped(false);
        setDirection(dir);
        setTimeout(() => {
            setIndex((prev) => (prev + dir + items.length) % items.length);
            setDirection(0);
        }, 200);
    };

    const playAudio = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="my-4 w-full max-w-sm mx-auto">
            <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layers size={14}/> {title || "Flashcards"}</h4>
                <div className="flex gap-1">{items.map((_:any, i:number) => <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-200'}`} />)}</div>
            </div>
            <div className="group perspective-1000 h-64 cursor-pointer relative" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} ${direction === 1 ? 'translate-x-full opacity-0 rotate-12' : direction === -1 ? '-translate-x-full opacity-0 -rotate-12' : ''}`}>
                    <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center">
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-300 uppercase">Term</span>
                        <h3 className="text-2xl font-black text-slate-800">{currentCard.term || currentCard.front}</h3>
                        <button onClick={(e) => { e.stopPropagation(); playAudio(currentCard.term || currentCard.front); }} className="absolute bottom-4 right-4 p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><Volume2 size={18}/></button>
                    </div>
                    <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-2xl shadow-xl rotate-y-180 flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500/20 rounded-full blur-[60px]"></div>
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase">Definition</span>
                        <p className="text-lg font-medium leading-relaxed relative z-10">{currentCard.definition || currentCard.back}</p>
                    </div>
                </div>
                <div className="absolute top-2 left-2 w-full h-full bg-slate-100 rounded-2xl -z-10 border border-slate-200 shadow-sm transform rotate-2"></div>
            </div>
            <div className="flex justify-between items-center mt-6 px-4">
                <button onClick={() => handleSwipe(-1)} className="p-3 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm active:scale-95"><ArrowLeft size={20}/></button>
                <div className="text-xs font-bold text-slate-400">{index + 1} / {items.length}</div>
                <button onClick={() => handleSwipe(1)} className="p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-indigo-600 active:scale-95"><ArrowRight size={20}/></button>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: SCENARIO PLAYER (Branching Logic) ---
const ScenarioBlock = ({ block, onComplete }: any) => {
    const [currentNodeId, setCurrentNodeId] = useState(block.nodes[0].id);
    const [history, setHistory] = useState<string[]>([]);
    
    const currentNode = block.nodes.find((n:any) => n.id === currentNodeId);
    if (!currentNode) return <div className="p-4 bg-red-50 text-red-500">Error: Broken Scenario Link</div>;

    const isEnd = !currentNode.options || currentNode.options.length === 0 || currentNode.options[0].nextNodeId === 'end';

    const bgColors: any = { neutral: 'bg-slate-900', success: 'bg-emerald-900', failure: 'bg-rose-900', critical: 'bg-amber-900' };
    const borderColor = currentNode.color === 'success' ? 'border-emerald-500' : currentNode.color === 'failure' ? 'border-rose-500' : 'border-slate-700';

    return (
        <div className={`${bgColors[currentNode.color || 'neutral']} text-white rounded-3xl overflow-hidden shadow-2xl border-4 ${borderColor} my-4 transition-colors duration-500`}>
            {currentNode.imageUrl && (
                <div className="h-40 w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10"/>
                    
                    <img src={currentNode.imageUrl} alt="Scene" className="w-full h-full object-cover"/>
                </div>
            )}
            <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-20">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                    {currentNode.speaker ? <User size={14}/> : <GitFork size={14}/>} {currentNode.speaker || 'Scene'}
                </span>
                {history.length > 0 && <button onClick={() => { setCurrentNodeId(block.nodes[0].id); setHistory([]); }} className="text-xs text-white/50 hover:text-white flex items-center gap-1"><RotateCcw size={12}/> Restart</button>}
            </div>
            <div className="p-6 relative z-20">
                <p className="text-lg font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">"{currentNode.text}"</p>
            </div>
            <div className="bg-black/20 p-2 grid gap-2 backdrop-blur-sm">
                {!isEnd ? currentNode.options.map((opt:any, i:number) => (
                    <button key={i} onClick={() => { setHistory([...history, currentNode.text]); setCurrentNodeId(opt.nextNodeId); }} className="w-full p-3 text-left bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold text-sm border border-white/5 hover:border-white/30 flex justify-between items-center group">
                        <span>{opt.text}</span><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                )) : (
                    <button onClick={onComplete} className="w-full p-4 bg-white text-slate-900 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse shadow-lg">
                        Complete Scenario <Check size={16}/>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: INTERACTIVE QUIZ BLOCK ---
const QuizBlock = ({ block, onComplete }: any) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isCorrect = selected === block.correctId;

    const handleSubmit = () => {
        setSubmitted(true);
        if (selected === block.correctId) {
            // Trigger confetti or sound here if you want
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-4">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-start gap-2">
                <span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><Check size={16}/></span>
                {block.question}
            </h3>
            <div className="space-y-2">
                {block.options.map((opt:any) => {
                    let style = "border-slate-200 hover:bg-slate-50";
                    if (submitted) {
                        if (opt.id === block.correctId) style = "bg-emerald-100 border-emerald-500 text-emerald-800 font-bold";
                        else if (opt.id === selected) style = "bg-rose-100 border-rose-500 text-rose-800 opacity-60";
                        else style = "opacity-50 grayscale";
                    } else if (selected === opt.id) {
                        style = "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500";
                    }

                    return (
                        <button 
                            key={opt.id} 
                            disabled={submitted}
                            onClick={() => setSelected(opt.id)}
                            className={`w-full p-4 text-left border-2 rounded-xl transition-all ${style}`}
                        >
                            {opt.text}
                        </button>
                    );
                })}
            </div>
            {!submitted ? (
                <button 
                    onClick={handleSubmit} 
                    disabled={!selected}
                    className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Check Answer
                </button>
            ) : (
                <div className={`mt-4 p-3 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className="font-bold flex items-center gap-2">
                        {isCorrect ? <><Check size={18}/> Correct!</> : <><X size={18}/> Incorrect</>}
                    </span>
                    {isCorrect && <button onClick={onComplete} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">Continue</button>}
                    {!isCorrect && <button onClick={() => { setSubmitted(false); setSelected(null); }} className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold shadow-sm">Try Again</button>}
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: CHAT DIALOGUE ---
const ChatDialogueBlock = ({ lines }: any) => (
    <div className="space-y-4 my-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        {lines.map((line: any, i: number) => {
            const isA = line.speaker === 'A' || i % 2 === 0;
            return (
                <div key={i} className={`flex ${isA ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm relative ${isA ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                        <p className="font-medium leading-relaxed">{line.text}</p>
                        {line.translation && (
                            <p className={`text-[10px] mt-1 pt-1 border-t ${isA ? 'border-slate-100 text-slate-400' : 'border-indigo-500/50 text-indigo-200'}`}>
                                {line.translation}
                            </p>
                        )}
                        <span className={`absolute -top-4 text-[9px] font-bold text-slate-400 ${isA ? 'left-0' : 'right-0'}`}>
                            {line.speaker}
                        </span>
                    </div>
                </div>
            );
        })}
    </div>
);

// --- MAIN COMPONENT: LESSON VIEW ---
function LessonView({ lesson, onFinish }: any) {
  // Analytics Timer
  useLearningTimer(auth.currentUser, lesson.id, 'lesson', lesson.title);

  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const blocks = lesson.blocks || [];
  const progress = ((currentBlockIdx + 1) / blocks.length) * 100;

  // Handler for finishing the lesson
  const handleNextBlock = () => {
      if (currentBlockIdx < blocks.length - 1) {
          setCurrentBlockIdx(prev => prev + 1);
          // Smooth scroll to top
          const container = document.getElementById('lesson-scroll-container');
          if(container) container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          onFinish(lesson.id, lesson.xp, lesson.title);
      }
  };

  const currentBlock = blocks[currentBlockIdx];

  // Helper to Render Specific Block Types
  const renderBlockContent = (block: any) => {
      switch (block.type) {
          case 'text':
              return (
                  <div className="prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {block.title && <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">{block.title}</h2>}
                      <div className="text-lg text-slate-600 leading-loose whitespace-pre-wrap font-serif">{block.content}</div>
                  </div>
              );
          
          case 'image':
              return (
                  <div className="space-y-4 animate-in zoom-in-95 duration-500">
                      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200">
                          
                          <img src={block.url} alt="Lesson" className="w-full object-cover" />
                      </div>
                      {block.caption && <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-2 rounded-full inline-block px-4 mx-auto">{block.caption}</p>}
                  </div>
              );

          case 'vocab-list':
              return <JuicyDeckBlock items={block.items} title="Key Vocabulary" />;

          case 'flashcard':
              return <JuicyDeckBlock items={[{ front: block.front, back: block.back }]} title="Concept Card" />;

          case 'quiz':
              return <QuizBlock block={block} onComplete={handleNextBlock} />;

          case 'scenario':
              return <ScenarioBlock block={block} onComplete={handleNextBlock} />;

          case 'dialogue':
              return <ChatDialogueBlock lines={block.lines} />;

          case 'video':
              return (
                  <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-black aspect-video relative group">
                      <video src={block.url} controls className="w-full h-full" />
                      <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md flex items-center gap-1"><Play size={10}/> Video</div>
                  </div>
              );

          case 'audio':
              return (
                  <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex items-center gap-4">
                      <div className="p-3 bg-indigo-500 rounded-full animate-pulse"><Volume2 size={24}/></div>
                      <div className="flex-1">
                          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Audio Clip</p>
                          <audio src={block.url} controls className="w-full h-8 accent-indigo-500" />
                          {block.caption && <p className="text-xs text-slate-400 mt-2 italic">{block.caption}</p>}
                      </div>
                  </div>
              );

          case 'note':
              const colors: any = { info: 'bg-blue-50 text-blue-800 border-blue-100', tip: 'bg-emerald-50 text-emerald-800 border-emerald-100', warning: 'bg-amber-50 text-amber-800 border-amber-100' };
              const icons: any = { info: <Info size={24}/>, tip: <Zap size={24}/>, warning: <AlertTriangle size={24}/> };
              return (
                  <div className={`p-6 rounded-3xl border-l-8 ${colors[block.variant || 'info']} shadow-sm flex gap-5 items-start my-4`}>
                      <div className="shrink-0 mt-1">{icons[block.variant || 'info']}</div>
                      <div>
                          <h4 className="font-black uppercase text-xs opacity-60 mb-2 tracking-widest">{block.title || block.variant}</h4>
                          <p className="text-base font-medium leading-relaxed">{block.content}</p>
                      </div>
                  </div>
              );
          
          default:
              return <div className="p-4 bg-slate-100 rounded text-slate-500 italic">Unsupported block type: {block.type}</div>;
      }
  };

  return (
    <div id="lesson-scroll-container" className="h-full flex flex-col bg-white overflow-y-auto relative scroll-smooth">
        
        {/* PROGRESS HEADER */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 px-6 py-4 border-b border-slate-100 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <button onClick={() => onFinish(null, 0)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={20} />
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">Progress</span>
                    <span className="text-xs font-bold text-slate-800">{currentBlockIdx + 1} <span className="text-slate-300">/</span> {blocks.length}</span>
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full flex flex-col justify-center min-h-[60vh]">
            <div key={currentBlockIdx} className="w-full">
                {renderBlockContent(currentBlock)}
            </div>
        </div>

        {/* FOOTER NAV */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 z-30">
            {/* Logic: Hide Next button if it's a quiz/scenario that handles its own flow, unless it's the last slide */}
            {!(currentBlock.type === 'quiz' || (currentBlock.type === 'scenario' && currentBlock.nodes)) ? (
                <button 
                    onClick={handleNextBlock}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {currentBlockIdx < blocks.length - 1 ? (
                        <>Next Step <ArrowRight size={20}/></>
                    ) : (
                        <>Complete Lesson <Check size={20}/></>
                    )}
                </button>
            ) : (
                <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                    Complete the activity to continue
                </div>
            )}
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
function StudentGradebook({ classData, user, userData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- HELPER: Normalize strings for fuzzy matching ---
  // Removes punctuation, extra spaces, and casing (e.g., "Exam 1!" -> "exam1")
  const normalize = (str: string) => {
      return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // 1. Fetch User's Activity Logs
  useEffect(() => {
    if (!user?.email) {
        setLoading(false);
        return;
    }
    
    // Fetch logs for this student
    const q = query(
      collection(db, 'artifacts', appId, 'activity_logs'), 
      where('studentEmail', '==', user.email)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // @ts-ignore
          .sort((a, b) => b.timestamp - a.timestamp);
      
      setLogs(fetchedLogs);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // 2. Process Assignments vs Logs
  const assignments = classData.assignments || [];
  const completedIds = new Set(userData?.completedAssignments || []); 
  
  const processedData = assignments.map((assign: any) => {
      const targetSimple = normalize(assign.title);

      // --- ROBUST MATCHING LOGIC ---
      const attempts = logs.filter(l => {
          const logSimple = normalize(l.itemTitle);
          // 1. Check ID match (if available)
          if (l.itemId && l.itemId === assign.id) return true;
          // 2. Check Exact Title match (Simplified)
          if (logSimple === targetSimple) return true;
          // 3. Check fuzzy containment (if titles are long enough to avoid false positives)
          if (targetSimple.length > 3 && logSimple.includes(targetSimple)) return true;
          
          return false;
      });
      
      // Find best score
      const bestAttempt = attempts.reduce((prev, current) => {
          const prevScore = prev?.scoreDetail?.score || 0;
          const currScore = current?.scoreDetail?.score || 0;
          // Prefer the one with a score detail over one without
          if (!prev?.scoreDetail && current?.scoreDetail) return current;
          if (prev?.scoreDetail && !current?.scoreDetail) return prev;
          // If both have scores, take higher
          return currScore > prevScore ? current : prev;
      }, null);

      const isCompleted = completedIds.has(assign.id) || attempts.length > 0;
      
      return {
          ...assign,
          isCompleted,
          bestScore: bestAttempt?.scoreDetail, // Extract score object
          lastAttemptDate: attempts[0]?.timestamp,
          attemptsCount: attempts.length
      };
  });

  const completedCount = processedData.filter((d: any) => d.isCompleted).length;
  const totalCount = processedData.length;
  
  // 3. Calculate Average
  // Filter for items that actually have a score recorded
  const gradedItems = processedData.filter((d: any) => d.bestScore && d.bestScore.total > 0);
  
  const totalScore = gradedItems.reduce((acc: number, curr: any) => {
      const max = curr.bestScore.total || 1; 
      const raw = curr.bestScore.score || 0;
      return acc + (raw / max);
  }, 0);

  const hasGrades = gradedItems.length > 0;
  const averageGrade = hasGrades ? Math.round((totalScore / gradedItems.length) * 100) : 0;

  if (loading) return <div className="p-12 text-center text-slate-400 flex flex-col items-center"><Loader className="animate-spin mb-2"/>Loading grades...</div>;

  return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
          
          {/* OVERVIEW CARD */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
              
              {/* Grade Circle */}
              <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      {/* Only show progress ring if there is a grade > 0 or if items are graded */}
                      <circle 
                        cx="56" cy="56" r="48" 
                        stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={301} 
                        strokeDashoffset={301 - (301 * (hasGrades ? averageGrade : 0)) / 100} 
                        className={`${averageGrade >= 90 ? 'text-emerald-400' : averageGrade >= 70 ? 'text-indigo-500' : 'text-amber-400'} transition-all duration-1000 ease-out`} 
                        strokeLinecap="round" 
                      />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${hasGrades ? 'text-slate-800' : 'text-slate-300'}`}>
                          {hasGrades ? `${averageGrade}%` : 'N/A'}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Avg. Score</span>
                  </div>
              </div>
              
              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                  <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center flex flex-col justify-center">
                      <span className="block text-2xl font-black text-indigo-600">{completedCount}/{totalCount}</span>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Tasks Done</span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center flex flex-col justify-center">
                      <span className="block text-2xl font-black text-amber-500">{gradedItems.length}</span>
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Graded</span>
                  </div>
              </div>
          </div>

          {/* DETAILED LIST */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><BarChart3 size={16} className="text-indigo-500"/> Performance Detail</h3>
              </div>
              <div className="divide-y divide-slate-100">
                  {processedData.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${item.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                  {item.isCompleted ? <CheckCircle2 size={18}/> : item.contentType === 'test' ? <HelpCircle size={18}/> : item.contentType === 'deck' ? <Layers size={18}/> : <FileText size={18}/>}
                              </div>
                              <div className="min-w-0">
                                  <h4 className={`font-bold text-sm truncate ${item.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{item.title}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 rounded">{item.contentType === 'deck' ? 'Deck' : item.contentType === 'test' ? 'Exam' : 'Unit'}</span>
                                      {item.lastAttemptDate && <span className="text-[9px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(item.lastAttemptDate).toLocaleDateString()}</span>}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="text-right pl-2">
                              {item.bestScore ? (
                                  <div>
                                      <span className={`block font-black text-base ${item.bestScore.score / item.bestScore.total >= 0.7 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                          {Math.round((item.bestScore.score / item.bestScore.total) * 100)}%
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">{item.bestScore.score}/{item.bestScore.total}</span>
                                  </div>
                              ) : item.isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> Done</span>
                              ) : (
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">-</span>
                              )}
                          </div>
                      </div>
                  ))}
                  {processedData.length === 0 && <div className="p-8 text-center text-slate-400 italic text-sm">No assignments to track.</div>}
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
      
      {/* --- COMPACT HEADER --- */}
      <div className="bg-white p-6 pb-0 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-20 shrink-0">
          <div className="flex justify-between items-center mb-4">
              <button onClick={onBack} className="group flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-wider">
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Back
              </button>
              <div className="bg-slate-100 text-slate-500 font-mono font-bold px-2 py-1 rounded text-[10px] border border-slate-200">
                  {classData.code}
              </div>
          </div>
          <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200">
                  {classData.name.charAt(0)}
              </div>
              <div>
                  <h1 className="text-xl font-black text-slate-900 leading-tight">{classData.name}</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Student Portal • {relevantAssignments.length} Assignments</p>
              </div>
          </div>
          <div className="flex gap-8 border-b border-slate-100">
              <button onClick={() => setViewMode('assignments')} className={`pb-3 text-sm font-bold transition-all relative ${viewMode === 'assignments' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  Tasks
                  {viewMode === 'assignments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
              </button>
              <button onClick={() => setViewMode('grades')} className={`pb-3 text-sm font-bold transition-all relative ${viewMode === 'grades' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  Grades
                  {viewMode === 'grades' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
              </button>
              <button onClick={() => setViewMode('forum')} className={`pb-3 text-sm font-bold transition-all relative ${viewMode === 'forum' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  Forum
                  {viewMode === 'forum' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
              </button>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
        {viewMode === 'grades' && <StudentGradebook classData={classData} user={user} userData={userData} />}

        {viewMode === 'assignments' && (
            <div className="space-y-6 pb-20">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-5 shadow-lg text-white flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-1">Current Progress</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black">{Math.round(progressPercent)}%</span></div>
                    </div>
                    <div className="relative z-10 text-right">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                            <span className="block text-xl font-bold">{pendingCount}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Remaining</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {relevantAssignments.length > 0 ? ( relevantAssignments.map((l: any, i: number) => {
                        const isDone = completedSet.has(l.id);
                        const dateStatus = !isDone ? getDueStatus(l.dueDate) : null; // Only show due date if incomplete

                        return (
                            <button 
                                key={`${l.id}-${i}`} 
                                onClick={() => handleAssignmentClick(l)} 
                                className={`w-full p-4 rounded-2xl border flex items-center justify-between active:scale-[0.98] transition-all group relative overflow-hidden ${isDone ? 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md'}`}
                            >
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                        isDone ? 'bg-emerald-100 text-emerald-600' : l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'test' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                        {isDone ? <Check size={18} strokeWidth={3}/> : l.contentType === 'deck' ? <Layers size={18}/> : l.contentType === 'test' ? <HelpCircle size={18}/> : <PlayCircle size={18}/>}
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-bold text-sm ${isDone ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800 group-hover:text-indigo-700'}`}>{l.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-1.5 rounded">
                                                {l.contentType === 'deck' ? 'Deck' : l.contentType === 'test' ? 'Exam' : 'Lesson'}
                                            </span>
                                            
                                            {/* --- NEW: DUE DATE BADGE --- */}
                                            {dateStatus && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${dateStatus.color} ${dateStatus.urgent ? 'animate-pulse' : ''}`}>
                                                    <Clock size={10}/> {dateStatus.label}
                                                </span>
                                            )}

                                            {!isDone && l.xp && <span className="text-[9px] font-bold text-emerald-600">+{l.xp} XP</span>}
                                        </div>
                                    </div>
                                </div>
                                {!isDone && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>}
                            </button> 
                        );
                    })) : ( 
                        <div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-sm">No assignments active.</div> 
                    )}
                </div>
            </div>
        )}
        
        {viewMode === 'forum' && (
            <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden pb-20">
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
  // --- View States ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // --- Add/Save States ---
  const [showAddModal, setShowAddModal] = useState(false); 
  const [showSaveOverlay, setShowSaveOverlay] = useState(false); 
  const [newCard, setNewCard] = useState({ front: '', back: '' });
  const [newDeckName, setNewDeckName] = useState(''); 
  const [saving, setSaving] = useState(false);

  // --- Navigation & Data State ---
  const [sessionCards, setSessionCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'study' | 'quiz'>('study');

  // --- Quiz State ---
  const [quizOptions, setQuizOptions] = useState<any[]>([]);
  const [quizState, setQuizState] = useState<'waiting' | 'correct' | 'wrong'>('waiting');
  const [score, setScore] = useState(0);

  // --- Swipe State (Enhanced for Scroll Stability) ---
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null); // NEW
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const [dragEndY, setDragEndY] = useState<number | null>(null); // NEW
  const minSwipeDistance = 50; 

  // --- Preference ---
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
        setScore(0);
    } else {
        setSessionCards([]);
    }
  }, [allDecks, preferredDeckId]);

  // --- QUIZ LOGIC ---
  useEffect(() => {
      if (viewMode === 'quiz' && sessionCards.length > 0) {
          const current = sessionCards[currentIndex];
          const others = sessionCards.filter(c => c.id !== current.id);
          const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 2);
          const options = [current, ...distractors].sort(() => 0.5 - Math.random());
          setQuizOptions(options);
          setQuizState('waiting');
      }
  }, [currentIndex, viewMode, sessionCards]);

  const handleQuizAnswer = (selectedCard: any) => {
      if (quizState !== 'waiting') return;
      const isCorrect = selectedCard.id === sessionCards[currentIndex].id;
      setQuizState(isCorrect ? 'correct' : 'wrong');
      if (isCorrect) {
          setScore(s => s + 1);
          setTimeout(() => {
              if (currentIndex < sessionCards.length - 1) setCurrentIndex(prev => prev + 1);
              else setCurrentIndex(0);
          }, 800);
      }
  };

  // --- SAVE LOGIC ---
  const executeSave = async (targetDeckId: string, targetDeckTitle: string) => {
    const currentUser = user || auth.currentUser;
    if (!currentUser || !sessionCards[currentIndex] || saving) return;
    
    setSaving(true);
    const cardToSave = sessionCards[currentIndex];
    
    try {
        const cardRef = doc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'custom_cards'));
        await setDoc(cardRef, {
            ...cardToSave,
            id: cardRef.id,
            deckId: targetDeckId,
            deckTitle: targetDeckTitle,
            savedFromWidget: true,
            savedAt: Date.now()
        });
        
        setShowSaveOverlay(false); 
        setNewDeckName(''); 
        alert(`Saved to ${targetDeckTitle}!`);
    } catch (err: any) {
        console.error("Error saving card:", err);
        alert("Failed to save: " + err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
      if(!newDeckName.trim()) return;
      const newId = `custom_${Date.now()}`;
      await executeSave(newId, newDeckName);
  };

  const handleQuickAdd = async () => {
    const currentUser = user || auth.currentUser;
    if (!currentUser || !newCard.front || !newCard.back) return;

    setSaving(true);
    try {
        const cardRef = doc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'custom_cards'));
        await setDoc(cardRef, {
            id: cardRef.id,
            front: newCard.front,
            back: newCard.back,
            type: 'noun', 
            deckId: 'custom',
            deckTitle: '✍️ Scriptorium',
            mastery: 0,
            createdAt: Date.now()
        });
        setNewCard({ front: '', back: '' });
        setShowAddModal(false);
        alert("New card created!");
    } catch (err: any) {
        alert("Failed to add: " + err.message);
    } finally {
        setSaving(false);
    }
  };

  // --- HANDLERS ---
  const handleDeckSelect = async (deckId: string) => {
    const targetUid = user?.uid || auth.currentUser?.uid;
    if (!targetUid) return;
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', targetUid, 'profile', 'main'), { widgetDeckId: deckId });
        setShowSettings(false);
        setIsFlipped(false);
    } catch (e) { console.error(e); }
  };

  // --- NAVIGATION & GESTURES ---
  const handleNext = () => { setIsFlipped(false); setShowSaveOverlay(false); setTimeout(() => setCurrentIndex(prev => (prev + 1) % sessionCards.length), 200); };
  const handlePrev = () => { setIsFlipped(false); setShowSaveOverlay(false); setTimeout(() => setCurrentIndex(prev => (prev - 1 + sessionCards.length) % sessionCards.length), 200); };

  const onPointerDown = (e: React.PointerEvent) => { 
      setDragEndX(null); setDragEndY(null);
      setDragStartX(e.clientX); setDragStartY(e.clientY);
  };
  
  const onPointerMove = (e: React.PointerEvent) => { 
      if (dragStartX !== null) { setDragEndX(e.clientX); setDragEndY(e.clientY); }
  };
  
  const onPointerUp = () => {
    if (dragStartX === null || dragEndX === null || dragStartY === null || dragEndY === null) { 
        setDragStartX(null); setDragStartY(null); return; 
    }

    const distX = dragStartX - dragEndX;
    const distY = dragStartY - dragEndY;

    // AXIS LOCKING: If vertical movement is greater than horizontal, assume scrolling and cancel swipe
    if (Math.abs(distY) > Math.abs(distX)) {
        setDragStartX(null); setDragStartY(null);
        return;
    }

    if (distX > minSwipeDistance) handleNext();
    else if (distX < -minSwipeDistance) handlePrev();
    
    setDragStartX(null); setDragStartY(null); setDragEndX(null); setDragEndY(null);
  };

  const currentCard = sessionCards[currentIndex];

  return (
    <div className="mx-6 mt-6 animate-in slide-in-from-bottom-2 duration-700 relative z-0">
      <div className="flex justify-between items-end mb-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Daily Discovery
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-indigo-100 transition-colors shadow-sm">
                <Plus size={12}/> Add
            </button>
            <button onClick={() => setViewMode(viewMode === 'study' ? 'quiz' : 'study')} className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm ${viewMode === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                {viewMode === 'study' ? <BrainCircuit size={12}/> : <Layers size={12}/>}
                {viewMode === 'study' ? "Quiz" : "Study"}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-slate-200 transition-colors shadow-sm">
                {showSettings ? <X size={12}/> : <Settings size={12}/>}
            </button>
          </div>
      </div>
      
      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-5 animate-in fade-in zoom-in duration-200 relative z-20 mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Select Source Deck</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  <button onClick={() => handleDeckSelect('all')} className={`w-full p-4 rounded-xl text-left flex items-center gap-3 transition-all ${preferredDeckId === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>
                      <div className={`p-2 rounded-full ${preferredDeckId === 'all' ? 'bg-white/20' : 'bg-white shadow-sm'}`}><Layers size={16}/></div>
                      <span className="font-bold text-sm">All Collections</span>
                      {preferredDeckId === 'all' && <CheckCircle2 size={18} className="ml-auto"/>}
                  </button>
                  {Object.entries(allDecks).map(([key, deck]: any) => (
                      <button key={key} onClick={() => handleDeckSelect(key)} className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${preferredDeckId === key ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>
                          <div className={`p-2 rounded-full ${preferredDeckId === key ? 'bg-white/20' : 'bg-white shadow-sm'}`}><BookOpen size={16}/></div>
                          <div className="flex-1 overflow-hidden"><p className="font-bold text-sm truncate">{deck.title}</p><p className={`text-[10px] ${preferredDeckId === key ? 'text-indigo-200' : 'text-slate-400'}`}>{deck.cards?.length || 0} cards</p></div>
                          {preferredDeckId === key && <CheckCircle2 size={18} className="ml-auto"/>}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* --- QUICK ADD MODAL --- */}
      {showAddModal && (
          <div className="bg-white rounded-[2rem] border-2 border-indigo-100 shadow-xl p-5 animate-in fade-in zoom-in duration-200 relative z-20 mb-4">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider ml-1">New Flashcard</h4>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                  <input placeholder="Word / Phrase" value={newCard.front} onChange={(e) => setNewCard({...newCard, front: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
                  <input placeholder="Meaning / Translation" value={newCard.back} onChange={(e) => setNewCard({...newCard, back: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={handleQuickAdd} disabled={!newCard.front || !newCard.back || saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center gap-2">
                    {saving ? <Loader size={16} className="animate-spin"/> : <PlusCircle size={16}/>} Save
                  </button>
              </div>
          </div>
      )}

      {/* --- CONTENT AREA --- */}
      {!showSettings && !showAddModal && (
        viewMode === 'quiz' ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative h-56 flex flex-col">
              <div className="bg-indigo-50 px-6 py-3 flex justify-between items-center border-b border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Question {currentIndex + 1} / {sessionCards.length}</span>
                  <span className="text-[10px] font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 shadow-sm">Score: {score}</span>
              </div>
              <div className="flex-1 p-4 flex flex-col items-center justify-center">
                  <h3 className="text-2xl font-serif font-bold text-slate-800 mb-6 text-center">{currentCard?.front}</h3>
                  <div className="grid grid-cols-1 w-full gap-2">
                      {quizOptions.map((opt) => {
                          const isSelected = quizState !== 'waiting';
                          const isCorrect = opt.id === currentCard.id;
                          let btnClass = "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300";
                          if (isSelected) {
                              if (isCorrect) btnClass = "bg-emerald-100 border-emerald-300 text-emerald-700 font-bold";
                              else btnClass = "opacity-50 border-slate-100 text-slate-300";
                          }
                          return ( <button key={opt.id} onClick={() => handleQuizAnswer(opt)} disabled={quizState !== 'waiting'} className={`w-full py-2.5 px-4 rounded-xl border transition-all text-sm font-medium truncate ${btnClass}`}>{opt.back}</button> )
                      })}
                  </div>
              </div>
          </div>
        ) : currentCard ? (
          /* STUDY MODE (Swipeable Stack) */
          <div className="relative h-56 w-full cursor-pointer group perspective-1000 touch-pan-y select-none" style={{ perspective: '1000px' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
            <div className="absolute top-2 left-4 right-4 bottom-0 bg-indigo-300/40 rounded-[2rem] transform scale-95 translate-y-2 z-0" />
            <div className="absolute top-4 left-8 right-8 bottom-0 bg-indigo-200/30 rounded-[2rem] transform scale-90 translate-y-3 z-0" />
            <div className="relative w-full h-full shadow-2xl rounded-[2rem] transition-transform duration-500 z-10" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }} onClick={() => setIsFlipped(!isFlipped)}>
              
              {/* FRONT SIDE (Cornflower Mode) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6495ED] to-[#4169E1] rounded-[2rem] p-6 text-white flex flex-col justify-between overflow-hidden shadow-blue-200" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                  
                  {/* --- DECK SELECTOR OVERLAY --- */}
                  {showSaveOverlay ? (
                      <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col p-5 rounded-[2rem] text-left animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Save to Deck</h4>
                              <button onClick={() => setShowSaveOverlay(false)} className="text-white/50 hover:text-white"><X size={16}/></button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                              <button onClick={() => executeSave('custom', '✍️ Scriptorium')} className="w-full p-3 bg-white/10 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-colors border border-white/5">
                                  <div className="p-1.5 bg-[#6495ED] rounded-lg"><Layers size={14} className="text-white"/></div>
                                  <span className="text-sm font-bold text-white">Scriptorium (Default)</span>
                              </button>
                              
                              {Object.entries(allDecks).map(([key, deck]: any) => (
                                  <button key={key} onClick={() => executeSave(key, deck.title)} className="w-full p-3 bg-white/5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                                      <div className="p-1.5 bg-white/10 rounded-lg text-white/70"><BookOpen size={14}/></div>
                                      <div className="text-left flex-1 overflow-hidden">
                                          <span className="text-sm font-bold text-white block truncate">{deck.title}</span>
                                      </div>
                                  </button>
                              ))}
                          </div>

                          <div className="mt-auto">
                              <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Or Create New</label>
                              <div className="flex gap-2">
                                  <input 
                                    value={newDeckName} 
                                    onChange={(e) => setNewDeckName(e.target.value)} 
                                    placeholder="Deck Name..." 
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6495ED]"
                                  />
                                  <button onClick={handleCreateAndSave} disabled={!newDeckName} className="bg-[#6495ED] text-white px-3 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-[#4169E1] transition-colors">
                                      <Plus size={18}/>
                                  </button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      // NORMAL CARD FACE CONTENT
                      <>
                        <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <span className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-1.5 shadow-sm"><Layers size={10} className="text-blue-200" /> {currentIndex + 1} / {sessionCards.length}</span>
                            
                            <div className="flex gap-2">
                                <button 
                                    className="p-2.5 bg-white/10 rounded-full hover:bg-white/30 transition-colors active:scale-90 border border-white/5 shadow-sm z-40 cursor-pointer" 
                                    onClick={(e) => { e.stopPropagation(); setShowSaveOverlay(true); }}
                                    title="Save Card"
                                >
                                    {saving ? <Loader size={20} className="animate-spin text-white"/> : <Heart size={20} className="text-white"/>}
                                </button>
                                <div className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-90 border border-white/5 shadow-sm z-40 cursor-pointer" onClick={(e) => { e.stopPropagation(); playAudio(currentCard.front); }}>
                                    <Volume2 size={20} className="text-white"/>
                                </div>
                            </div>
                        </div>
                        <div className="text-center relative z-10 mt-2">
                            <h2 className="text-4xl font-serif font-bold mb-2 drop-shadow-md">{currentCard.front}</h2>
                            <div className="inline-block px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/10"><p className="text-blue-100 font-serif text-sm tracking-wide">{currentCard.ipa || '/.../'}</p></div>
                        </div>
                        <div className="text-center relative z-10"><p className="text-[10px] uppercase font-bold text-blue-200 tracking-widest animate-pulse flex items-center justify-center gap-2"><ArrowLeft size={10}/> Swipe <ArrowRight size={10}/></p></div>
                      </>
                  )}
              </div>

              {/* BACK SIDE */}
              <div 
                className="absolute inset-0 bg-white rounded-[2rem] border border-slate-200 flex flex-col shadow-sm overflow-hidden" 
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                  <div className="w-10 h-1 rounded-full bg-slate-100 mx-auto mt-4 shrink-0"></div>
                  
                  {/* --- SCROLLABLE CONTENT --- */}
                  <div 
                    className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar min-h-0 flex flex-col items-center text-center touch-pan-y"
                    onPointerDown={(e) => e.stopPropagation()} // BLOCK SWIPE FROM STARTING HERE
                  >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 bg-slate-50 px-2 py-1 rounded-md">Definition</span>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 leading-tight">{currentCard.back}</h3>
                      {currentCard.usage?.sentence && (
                        <div className="bg-slate-50 p-4 rounded-xl w-full border border-slate-100 text-left relative shrink-0">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#6495ED] rounded-l-xl"></div>
                          <p className="text-sm text-slate-600 italic font-serif leading-relaxed pl-2">"{currentCard.usage.sentence}"</p>
                        </div>
                      )}
                  </div>

                  <div className="p-3 border-t border-slate-50 text-center shrink-0">
                     <div className="text-[10px] text-slate-300 font-bold uppercase flex items-center justify-center gap-2">
                         <ArrowLeft size={10}/> Next Card <ArrowRight size={10}/>
                     </div>
                  </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center h-56">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-300"><Layers size={24} /></div>
            <p className="text-slate-500 font-bold mb-1">No cards in this deck.</p>
            <button onClick={() => setShowSettings(true)} className="px-5 py-2 bg-[#6495ED] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-[#4169E1] transition-all">Change Source</button>
          </div>
        )
      )}
    </div>
  );
}
// --- AUDIO ENGINE (Synthesizer) ---
// Generates sounds on the fly so no assets are needed
const playSynthSound = (type: 'hit' | 'miss' | 'frenzy' | 'tick', comboPitch = 0) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'hit') {
        // Pitch rises with combo (pentatonic scale ish)
        const baseFreq = 440; 
        const freq = baseFreq + (comboPitch * 50); 
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.1);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'miss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'frenzy') {
        // Power up sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
};

// ============================================================================
//  THE TOWER: INFINITE ASCENSION MODE
// ============================================================================
function TowerMode({ allDecks, user, onExit, onXPUpdate }: any) {
    // Game State
    const [gameState, setGameState] = useState<'intro' | 'climbing' | 'fallen'>('intro');
    const [floor, setFloor] = useState(1);
    const [pendingXP, setPendingXP] = useState(0);
    const [lives, setLives] = useState(3);
    const [question, setQuestion] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Get all cards
    const allCards = useMemo(() => {
        let cards: any[] = [];
        Object.values(allDecks).forEach((d: any) => {
            if (d.cards) cards = [...cards, ...d.cards];
        });
        return cards.sort(() => Math.random() - 0.5);
    }, [allDecks]);

    const generateQuestion = () => {
        if (allCards.length === 0) return null;
        const card = allCards[Math.floor(Math.random() * allCards.length)];
        
        // Generate distractors
        const distractors = allCards
            .filter(c => c.id !== card.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(c => c.back);

        const options = [...distractors, card.back].sort(() => Math.random() - 0.5);
        
        return {
            prompt: card.front,
            correct: card.back,
            options,
            type: 'mcq'
        };
    };

    const handleAnswer = (selected: string) => {
        if (isAnimating) return;
        setIsAnimating(true);

        const isCorrect = selected === question.correct;

        if (isCorrect) {
            // Climb Logic
            setTimeout(() => {
                setFloor(prev => prev + 1);
                setPendingXP(prev => prev + 10 + (Math.floor(floor / 5) * 5)); // Higher floors = more XP
                setQuestion(generateQuestion());
                setIsAnimating(false);
            }, 600); // Animation delay
        } else {
            // Damage Logic
            setTimeout(() => {
                if (lives > 1) {
                    setLives(prev => prev - 1);
                    setQuestion(generateQuestion());
                    setIsAnimating(false);
                } else {
                    setGameState('fallen');
                }
            }, 800);
        }
    };

    const handleCashOut = () => {
        onXPUpdate(pendingXP, `Tower Run (Floor ${floor})`);
        onExit();
    };

    // Initialize
    useEffect(() => {
        if (gameState === 'climbing' && !question) {
            setQuestion(generateQuestion());
        }
    }, [gameState]);

    // Dynamic Background based on Floor
    const getBackground = () => {
        if (floor < 5) return 'bg-gradient-to-b from-blue-400 to-emerald-300'; // Ground
        if (floor < 10) return 'bg-gradient-to-b from-indigo-500 to-blue-400'; // Sky
        if (floor < 20) return 'bg-gradient-to-b from-slate-900 to-indigo-600'; // Stratosphere
        return 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900'; // Space
    };

    if (allCards.length < 4) return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm text-center">
                <h3 className="font-bold text-lg mb-2">Not Enough Cards</h3>
                <p className="text-sm text-slate-500 mb-4">You need at least 4 flashcards in your library to enter The Tower.</p>
                <button onClick={onExit} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Return</button>
            </div>
        </div>
    );

    return (
        <div className={`fixed inset-0 z-50 ${getBackground()} transition-colors duration-[2000ms] flex flex-col`}>
            
            {/* --- VISUAL EFFECTS --- */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            {/* Moving Clouds/Stars */}
            <div className={`absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden ${floor > 10 ? 'opacity-0' : 'opacity-30'}`}>
                <Cloud className="absolute top-20 left-10 text-white animate-[pulse_4s_infinite]" size={64} />
                <Cloud className="absolute top-40 right-20 text-white animate-[pulse_6s_infinite]" size={48} />
            </div>
            {floor >= 10 && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-1/4 text-white/40 animate-pulse"><Star size={12}/></div>
                    <div className="absolute top-1/3 right-10 text-white/30 animate-pulse delay-700"><Star size={16}/></div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="relative z-10 p-6 flex justify-between items-start text-white">
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Current Floor</span>
                    <span className="text-5xl font-black flex items-center gap-2 drop-shadow-lg">
                        {floor} <ArrowUp size={32} className="text-yellow-400 animate-bounce"/>
                    </span>
                </div>
                <div className="text-right">
                    <div className="flex gap-1 mb-2 justify-end">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full shadow-lg ${i < lives ? 'bg-rose-500' : 'bg-slate-800/50'}`} />
                        ))}
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                        <span className="text-xs font-bold text-yellow-300">XP At Risk: </span>
                        <span className="font-mono font-bold text-white">{pendingXP}</span>
                    </div>
                </div>
            </div>

            {/* --- GAMEPLAY AREA --- */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-20 relative z-10 max-w-md mx-auto w-full">
                
                {gameState === 'intro' && (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building size={40}/>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">The Tower</h2>
                        <p className="text-slate-500 text-sm mb-6">Ascend as high as you can. Every floor gets harder, but awards more XP. <br/><br/><strong className="text-rose-600">Warning:</strong> If you lose all hearts, you lose half your pending XP.</p>
                        <button onClick={() => setGameState('climbing')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all active:scale-95">
                            Begin Ascent
                        </button>
                        <button onClick={onExit} className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
                    </div>
                )}

                {gameState === 'climbing' && question && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                        {/* Question Card */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center shadow-2xl">
                            <h3 className="text-2xl font-bold text-white drop-shadow-md">{question.prompt}</h3>
                        </div>

                        {/* Options */}
                        <div className="grid gap-3">
                            {question.options.map((opt: string, idx: number) => (
                                <button
                                    key={idx}
                                    disabled={isAnimating}
                                    onClick={() => handleAnswer(opt)}
                                    className={`p-4 rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-lg border-2 
                                        ${isAnimating && opt === question.correct ? 'bg-emerald-500 border-emerald-400 text-white scale-105' : 
                                          isAnimating && opt !== question.correct ? 'bg-white/5 border-transparent text-white/30' :
                                          'bg-white text-slate-800 border-white hover:border-yellow-300 hover:bg-yellow-50'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Cash Out Button (Risk Management) */}
                        {floor > 1 && !isAnimating && (
                            <button onClick={handleCashOut} className="w-full py-3 bg-slate-900/50 hover:bg-slate-900 text-white/80 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all flex items-center justify-center gap-2">
                                <Flag size={14}/> Bank {pendingXP} XP & Leave
                            </button>
                        )}
                    </div>
                )}

                {gameState === 'fallen' && (
                    <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in duration-300 border-4 border-rose-100">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={40}/>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-1">You Fell!</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Floor Reached: {floor}</p>
                        
                        <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500">XP Saved</span>
                            <span className="text-xl font-black text-rose-600">+{Math.floor(pendingXP / 2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-6 italic">Next time, bank your XP before you fall.</p>

                        <button onClick={() => { onXPUpdate(Math.floor(pendingXP / 2), "Tower Attempt (Fallen)"); onExit(); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg">
                            Return to Base
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
// ============================================================================
//  PRO HERO PROFILE WIDGET
// ============================================================================
function HeroProfileWidget({ user, userData, displayName, level, progress, classes }: any) {
    const [showDetails, setShowDetails] = useState(false);

    // Dynamic Rank Titles based on Level
    const getRankTitle = (lvl: number) => {
        if (lvl >= 50) return "Grandmaster";
        if (lvl >= 30) return "Sage";
        if (lvl >= 20) return "Magister";
        if (lvl >= 10) return "Scholar";
        if (lvl >= 5)  return "Adept";
        return "Novice";
    };

    const enrolledIds = (classes || []).map((c: any) => c.id);

    return (
        <div className="relative w-full z-30 mb-6">
            
            {/* 1. BACKGROUND LAYER (Handles the Shape & Color) */}
            {/* We apply overflow-hidden HERE only, so the background clips, but content doesn't get cut off if it expands */}
            <div className="absolute inset-0 h-[180px] bg-slate-900 rounded-b-[3rem] overflow-hidden shadow-2xl shadow-indigo-900/40">
                {/* Modern Mesh Gradient */}
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-indigo-900 animate-slow-spin opacity-50"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                
                {/* Ambient Glows */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-40 animate-pulse"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-rose-500 rounded-full blur-[60px] opacity-20"></div>
            </div>

            {/* 2. CONTENT LAYER (Sits on top, fully visible) */}
            <div className="relative pt-14 pb-4 px-6">
                
                <div className="flex justify-between items-start">
                    
                    {/* AVATAR & IDENTITY */}
                    <div className="flex items-center gap-5">
                        <div className="relative group cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                            {/* Glowing Ring */}
                            <div className="absolute -inset-1 bg-gradient-to-tr from-rose-500 to-indigo-500 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
                            
                            <div className="relative w-16 h-16 bg-slate-800 rounded-2xl border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                                {userData?.photoURL ? (
                                    <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-serif font-black text-2xl text-white/90">{displayName.charAt(0)}</span>
                                )}
                            </div>
                            
                            {/* Level Badge */}
                            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-sm flex items-center gap-1">
                                <Sparkles size={8} className="text-yellow-300"/> {level}
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                                {displayName}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-indigo-200 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                                    {getRankTitle(level)}
                                </span>
                                <div className="h-1 w-1 bg-slate-500 rounded-full"></div>
                                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                    <Trophy size={12} className="text-yellow-500"/> {userData?.xp || 0} XP
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* NOTIFICATION BELL */}
                    {/* High Z-Index ensures dropdown goes OVER everything */}
                    <div className="relative z-50">
                        <NotificationBell user={user} enrolledClassIds={enrolledIds} />
                    </div>
                </div>

                {/* PROGRESS BAR (Floating Card Effect) */}
                <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Zap size={12} className="text-yellow-400 fill-yellow-400"/> Next Rank
                        </span>
                        <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                    </div>
                    
                    {/* The Bar Track */}
                    <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden relative z-10">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out relative" 
                            style={{ width: `${progress}%` }}
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] skew-x-12 opacity-50"></div>
                        </div>
                    </div>

                    {/* Decorative Background inside the card */}
                    <div className="absolute right-0 bottom-0 opacity-5">
                        <Trophy size={64} className="text-white"/>
                    </div>
                </div>

            </div>
        </div>
    );
}
function HomeView({ setActiveTab, lessons, onSelectLesson, userData, assignments, classes, onSelectClass, onSelectDeck, allDecks, user }: any) {
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  
  // STATE: The Tower
  const [showTower, setShowTower] = useState(false);
  
  // 1. SCROLL REF
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // 2. THE NUCLEAR SCROLL FIX
  useLayoutEffect(() => {
      const viewport = scrollViewportRef.current;
      if (viewport) {
          viewport.scrollTop = 0;
          setTimeout(() => { if (viewport) viewport.scrollTop = 0; }, 10);
          setTimeout(() => { if (viewport) viewport.scrollTop = 0; }, 50);
      }
  }, []);

  // 3. SMART NAME RESOLVER
  const displayName = useMemo(() => {
      if (userData?.name && userData.name !== 'Student' && userData.name !== 'User') return userData.name;
      if (user?.displayName) return user.displayName;
      if (user?.email) {
          const namePart = user.email.split('@')[0];
          const cleanName = namePart.replace(/[0-9]/g, ''); 
          return cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Scholar";
      }
      return 'Student';
  }, [userData, user]);

  // 4. DATA PROCESSING
  const completedSet = new Set(userData?.completedAssignments || []);
  
  const relevantAssignments = (assignments || []).filter((l: any) => { 
      return !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); 
  });
  
  const activeAssignments = relevantAssignments.filter((l: any) => !completedSet.has(l.id));
  const { level, progress } = getLevelInfo(userData?.xp || 0);
  const visibleLessons = libraryExpanded ? lessons : lessons.slice(0, 2);

  // 5. XP HANDLER FOR TOWER
  const handleTowerXP = async (xpAmount: number, reason: string) => {
      if (!user) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { 
              xp: increment(xpAmount) 
          });
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
              studentName: displayName || "Student",
              studentEmail: user.email,
              itemTitle: reason,
              xp: xpAmount,
              timestamp: Date.now(),
              type: 'game_reward'
          });
      } catch (e: any) { console.error("XP Save Failed:", e); }
  };

  if (activeStudentClass) { 
      return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={onSelectLesson} onSelectDeck={onSelectDeck} userData={userData} user={user} displayName={displayName} />; 
  }

  return (
  <div 
    ref={scrollViewportRef} 
    className="h-full overflow-y-auto overflow-x-hidden relative bg-slate-50 scroll-smooth"
  >
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* --- OVERLAYS --- */}
        {showLevelModal && <LevelUpModal userData={userData} onClose={() => setShowLevelModal(false)} />}
        
        {showTower && (
            <TowerMode 
                allDecks={allDecks} 
                user={user} 
                onExit={() => setShowTower(false)}
                onXPUpdate={handleTowerXP}
            />
        )}

        {/* --- 1. PRO HEADER WIDGET --- */}
        <HeroProfileWidget 
            user={user} 
            userData={userData} 
            displayName={displayName} 
            level={level} 
            progress={progress} 
            classes={classes} 
        />
        
        {/* --- 2. DAILY DISCOVERY --- */}
        <DailyDiscoveryWidget allDecks={allDecks} user={user} userData={userData} />
        
        {/* --- 3. THE TOWER (Replaces Colosseum) --- */}
        <div className="px-6 mt-6">
            <button onClick={() => setShowTower(true)} className="w-full p-1 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden">
                <div className="bg-slate-900 rounded-[2.3rem] p-6 relative overflow-hidden flex items-center justify-between">
                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-800 via-slate-900 to-slate-900"></div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/50 group-hover:-translate-y-1 transition-transform">
                            <Building size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-black text-white italic tracking-tight">THE TOWER</h3>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Infinite Ascent</p>
                        </div>
                    </div>
                    
                    <div className="relative z-10 bg-white/10 p-2 rounded-full text-white/50 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                        <ArrowUp size={24} />
                    </div>
                </div>
            </button>
        </div>

        {/* --- MAIN SCROLLABLE CONTENT --- */}
        <div className="px-6 space-y-8 mt-8 relative z-20">
          
          {/* 4. MY CLASSES */}
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
                            <button key={cls.id} onClick={() => setActiveStudentClass(cls)} className="snap-start min-w-[300px] h-[200px] bg-white rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.3)] border border-slate-100 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col text-left">
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
          
          {/* 5. UP NEXT */}
          {activeAssignments.length > 0 && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
                 <div className="flex justify-between items-center mb-3 ml-1">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Up Next</h3>
                 </div>
                 <div className="space-y-3">
                    {activeAssignments.map((l: any, i: number) => {
                        const dateStatus = getDueStatus(l.dueDate); 
                        return ( 
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
                                        {dateStatus && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${dateStatus.color} ${dateStatus.urgent ? 'animate-pulse' : ''}`}>
                                                <Clock size={10}/> {dateStatus.label}
                                            </span>
                                        )}
                                        {l.xp && <span className="text-[10px] font-bold text-emerald-600">+{l.xp} XP</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <ChevronRight size={16} />
                            </div>
                        </button>
                    )})}
                 </div>
              </div>
          )}
          
          {/* 6. LIBRARY */}
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
          
          {/* 7. QUICK ACTIONS */}
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
  </div>
  );
}
// ============================================================================
//  CONTENT CREATION SUITE
// ============================================================================

// ============================================================================
//  BEEFED UP CONTENT CREATION SUITE (10+ Block Types)
// ============================================================================



// 1. FLASHCARD BUILDER (Standard)
function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId, initialData, onCancelEdit }: any) {
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Visibility State
  const [visibility, setVisibility] = useState('private');
  const [sharedWith, setSharedWith] = useState<string[]>([]);

  const IPA_KEYS = ['ə', 'æ', 'θ', 'ð', 'ŋ', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ʌ', 'ː', 'ˈ', 'ˌ'];

  const insertIPA = (char: string) => {
    setFormData(prev => ({ ...prev, ipa: prev.ipa + char }));
  };

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
          setVisibility(initialData.visibility || 'private');
          setSharedWith(initialData.sharedWith || []);
      }
  }, [initialData, initialDeckId]);

  const handleChange = (e: any) => { 
      if (e.target.name === 'deckId') { 
          if (e.target.value === 'new') { setIsCreatingDeck(true); setFormData({ ...formData, deckId: 'new' }); } 
          else { setIsCreatingDeck(false); setFormData({ ...formData, deckId: e.target.value }); } 
      } else { 
          setFormData({ ...formData, [e.target.name]: e.target.value }); 
      } 
  };

  const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
  const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };
  
  const handleClear = () => { 
      setEditingId(null); 
      setFormData(prev => ({ ...prev, front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '' })); 
      setMorphology([]);
      setVisibility('private');
      setSharedWith([]);
      if (onCancelEdit) onCancelEdit();
  };

  const handleSubmit = (e: any) => { 
      e.preventDefault(); 
      if (!formData.front || !formData.back) return; 
      
      let finalDeckId = formData.deckId; 
      let finalDeckTitle = null; 
      
      if (formData.deckId === 'new') { 
          if (!newDeckTitle) return alert("Please name your new deck."); 
          finalDeckId = `custom_${Date.now()}`; 
          finalDeckTitle = newDeckTitle; 
      } 
      
      const cardData = { 
          front: formData.front, back: formData.back, type: formData.type, 
          deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "", mastery: 0, 
          morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], 
          usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, 
          grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"],
          visibility,
          sharedWith,
          authorName: auth.currentUser?.displayName || "Anonymous",
          authorId: auth.currentUser?.uid
      }; 
      
      if (editingId) { onUpdateCard(editingId, cardData); setToastMsg("Card Updated Successfully"); } 
      else { onSaveCard(cardData); setToastMsg("Card Created Successfully"); } 
      
      handleClear(); 
      if (isCreatingDeck) { setIsCreatingDeck(false); setNewDeckTitle(''); setFormData(prev => ({ ...prev, deckId: finalDeckId })); } 
  };
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title }));

  return (
    <div className="px-6 mt-4 space-y-6 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center">
          <div>
              <p className="font-bold flex items-center gap-2"><Layers size={16}/> {editingId ? 'Editing Card' : 'Card Creator'}</p>
              <p className="opacity-80 text-xs mt-1">{editingId ? 'Update details below.' : 'Define deep linguistic data (X-Ray).'}</p>
          </div>
          {editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}
      </div>
      
      {/* CORE DATA SECTION */}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Core Data</h3>
        
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Target Deck</label>
            <select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-3 rounded-lg border border-slate-200 bg-indigo-50/50 font-bold text-indigo-900 disabled:opacity-50">
                <option value="custom">✍️ Scriptorium (My Deck)</option>
                {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                <option value="new">✨ + Create New Deck</option>
            </select>
            {isCreatingDeck && <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter New Deck Name" className="w-full p-3 rounded-lg border-2 border-indigo-500 bg-white font-bold mt-2 animate-in fade-in slide-in-from-top-2" autoFocus />}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Word</label><input name="front" value={formData.front} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="e.g. Bellum" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Meaning</label><input name="back" value={formData.back} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="e.g. War" /></div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
           <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Part of Speech</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 bg-white"><option value="noun">Noun</option><option value="verb">Verb</option><option value="adjective">Adjective</option><option value="adverb">Adverb</option><option value="phrase">Phrase</option></select></div>
           
           <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex justify-between"><span>Phonetics (IPA)</span><span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">Tap to Insert</span></label>
                <div className="flex flex-wrap gap-1 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {IPA_KEYS.map(char => (
                        <button key={char} type="button" onClick={() => insertIPA(char)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 font-serif shadow-sm transition-all active:scale-90">{char}</button>
                    ))}
                </div>
                <input name="ipa" value={formData.ipa} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-serif text-sm text-slate-600" placeholder="/.../" />
           </div>
        </div>
      </section>

      {/* MORPHOLOGY SECTION */}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Morphology (X-Ray Data)</h3>
        <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Part</label><input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="Bell-" /></div>
            <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Meaning</label><input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="War" /></div>
            <div className="w-24 space-y-1"><label className="text-[10px] font-bold text-slate-400">Type</label><select value={newMorphPart.type} onChange={(e) => setNewMorphPart({...newMorphPart, type: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white"><option value="root">Root</option><option value="prefix">Prefix</option><option value="suffix">Suffix</option></select></div>
            <button type="button" onClick={addMorphology} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200"><Plus size={20}/></button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">{morphology.map((m, i) => (<div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm"><span className="font-bold text-indigo-700">{m.part}</span><span className="text-slate-500 text-xs">({m.meaning})</span><button type="button" onClick={() => removeMorphology(i)} className="text-slate-300 hover:text-rose-500"><X size={14}/></button></div>))}</div>
      </section>

      {/* CONTEXT SECTION */}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Context & Grammar</h3>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Example Sentence</label><input name="sentence" value={formData.sentence} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 italic" placeholder="Si vis pacem, para bellum." /></div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Translation</label><input name="sentenceTrans" value={formData.sentenceTrans} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="If you want peace, prepare for war." /></div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Grammar Tags</label><input name="grammarTags" value={formData.grammarTags} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="2nd Declension, Neuter" /></div>
      </section>

      {/* VISIBILITY SECTION */}
      <VisibilitySelector 
          visibility={visibility} 
          setVisibility={setVisibility} 
          sharedWith={sharedWith} 
          setSharedWith={setSharedWith} 
      />

      <button onClick={handleSubmit} className={`w-full text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingId ? <><Save size={20}/> Update Card</> : <><Plus size={20}/> Create Card</>}</button>
    </div>
  );
}
// ============================================================================
//  JUICED-UP LESSON BUILDER (v4.0)
// ============================================================================

function LessonBuilderView({ data, setData, onSave }: any) {

  // --- STANDARD STATE HELPERS ---
  const updateBlock = (idx: number, field: string, val: any) => {
      const newBlocks = [...data.blocks];
      newBlocks[idx] = { ...newBlocks[idx], [field]: val };
      setData({ ...data, blocks: newBlocks });
  };

  const updateNested = (bIdx: number, arrField: string, itemIdx: number, field: string, val: any) => {
      const newBlocks = [...data.blocks];
      const newArray = [...(newBlocks[bIdx][arrField] || [])];
      newArray[itemIdx] = { ...newArray[itemIdx], [field]: val };
      newBlocks[bIdx] = { ...newBlocks[bIdx], [arrField]: newArray };
      setData({ ...data, blocks: newBlocks });
  };

  const addNestedItem = (bIdx: number, arrField: string, initialItem: any) => {
      const newBlocks = [...data.blocks];
      const newArray = [...(newBlocks[bIdx][arrField] || []), initialItem];
      newBlocks[bIdx] = { ...newBlocks[bIdx], [arrField]: newArray };
      setData({ ...data, blocks: newBlocks });
  };

  const removeNestedItem = (bIdx: number, arrField: string, itemIdx: number) => {
      const newBlocks = [...data.blocks];
      const newArray = newBlocks[bIdx][arrField].filter((_:any, i:number) => i !== itemIdx);
      newBlocks[bIdx] = { ...newBlocks[bIdx], [arrField]: newArray };
      setData({ ...data, blocks: newBlocks });
  };

  // --- SUB-COMPONENT: JUICY SCENARIO EDITOR ---
  const JuicyScenarioEditor = ({ block, bIdx }: any) => {
      
      const updateNode = (nIdx: number, field: string, val: any) => {
          const newBlocks = [...data.blocks];
          newBlocks[bIdx].nodes[nIdx][field] = val;
          setData({ ...data, blocks: newBlocks });
      };

      const addOption = (nIdx: number) => {
          const newBlocks = [...data.blocks];
          newBlocks[bIdx].nodes[nIdx].options.push({ text: 'New Choice', nextNodeId: 'end', variant: 'neutral' });
          setData({ ...data, blocks: newBlocks });
      };

      // THE "AUTO-BRANCH" FEATURE
      const autoBranch = (nIdx: number) => {
          const newId = `node_${Date.now()}`;
          const newBlocks = [...data.blocks];
          
          // 1. Create the new destination node
          newBlocks[bIdx].nodes.push({ 
              id: newId, 
              title: 'New Branch', 
              text: 'What happens next...', 
              color: 'neutral', 
              options: [] 
          });

          // 2. Add an option pointing to it
          newBlocks[bIdx].nodes[nIdx].options.push({ 
              text: 'Go to New Branch', 
              nextNodeId: newId, 
              variant: 'neutral' 
          });

          setData({ ...data, blocks: newBlocks });
      };

      const deleteNode = (nIdx: number) => {
          if(!window.confirm("Delete this scene?")) return;
          const newBlocks = [...data.blocks];
          newBlocks[bIdx].nodes = newBlocks[bIdx].nodes.filter((_:any, i:number) => i !== nIdx);
          setData({ ...data, blocks: newBlocks });
      };

      // Helper to get node summary for dropdowns
      const getNodeLabel = (id: string) => {
          if (id === 'end') return '🏁 End Scenario';
          const n = block.nodes.find((x:any) => x.id === id);
          return n ? `📄 ${n.title || n.id}` : `⚠️ Broken Link (${id})`;
      };

      return (
          <div className="mt-4 space-y-6 bg-slate-50 p-4 rounded-3xl border border-slate-200">
              <div className="flex justify-between items-center px-2">
                  <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">
                      <GitFork size={14}/> Storyboard Editor
                  </h4>
                  <button onClick={() => {
                      const newBlocks = [...data.blocks];
                      newBlocks[bIdx].nodes.push({ id: `node_${Date.now()}`, title: 'New Scene', text: '...', color: 'neutral', options: [] });
                      setData({ ...data, blocks: newBlocks });
                  }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:scale-105 transition-transform">
                      + Add Scene
                  </button>
              </div>

              <div className="space-y-4">
                  {block.nodes?.map((node: any, nIdx: number) => {
                      // Color Logic
                      const colors: any = {
                          neutral: 'bg-white border-slate-200',
                          success: 'bg-emerald-50 border-emerald-200',
                          failure: 'bg-rose-50 border-rose-200',
                          critical: 'bg-amber-50 border-amber-200'
                      };
                      const activeColor = colors[node.color || 'neutral'];

                      return (
                          <div key={node.id} className={`p-5 rounded-2xl border-2 transition-all shadow-sm group ${activeColor}`}>
                              
                              {/* HEADER ROW */}
                              <div className="flex justify-between items-start mb-4 gap-4">
                                  <div className="flex-1 space-y-2">
                                      <div className="flex gap-2">
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[9px] font-bold text-slate-400 uppercase">ID</span>
                                              <span className="text-[10px] font-mono bg-black/5 px-2 py-1 rounded text-slate-500 select-all">{node.id}</span>
                                          </div>
                                          <div className="flex-1">
                                              <label className="text-[9px] font-bold text-slate-400 uppercase">Scene Title</label>
                                              <input className="w-full font-bold text-sm bg-transparent border-b border-black/10 focus:border-indigo-500 outline-none pb-1" value={node.title || ''} onChange={e => updateNode(nIdx, 'title', e.target.value)} placeholder="e.g. The Barista's Reaction" />
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex gap-1">
                                      {/* Color Picker */}
                                      {['neutral', 'success', 'failure', 'critical'].map(c => (
                                          <button 
                                              key={c}
                                              onClick={() => updateNode(nIdx, 'color', c)}
                                              className={`w-6 h-6 rounded-full border-2 ${node.color === c ? 'border-indigo-600 scale-110' : 'border-transparent opacity-30 hover:opacity-100'} ${c === 'neutral' ? 'bg-slate-200' : c === 'success' ? 'bg-emerald-400' : c === 'failure' ? 'bg-rose-400' : 'bg-amber-400'}`}
                                              title={c}
                                          />
                                      ))}
                                      <button onClick={() => deleteNode(nIdx)} className="ml-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                  </div>
                              </div>

                              {/* CONTENT ROW */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-3">
                                      <div>
                                          <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><User size={10}/> Speaker (Optional)</label>
                                          <input className="w-full text-xs p-2 bg-white/50 rounded border border-black/5" placeholder="e.g. Angry Barista" value={node.speaker || ''} onChange={e => updateNode(nIdx, 'speaker', e.target.value)}/>
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><ImageIcon size={10}/> Image URL (Optional)</label>
                                          <input className="w-full text-xs p-2 bg-white/50 rounded border border-black/5" placeholder="https://..." value={node.imageUrl || ''} onChange={e => updateNode(nIdx, 'imageUrl', e.target.value)}/>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase">Dialogue / Story Text</label>
                                      <textarea className="w-full h-24 p-3 text-sm bg-white/80 rounded-xl border border-black/5 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" placeholder="What happens in this scene?" value={node.text} onChange={e => updateNode(nIdx, 'text', e.target.value)}/>
                                  </div>
                              </div>

                              {/* OPTIONS ROW */}
                              <div className="bg-white/60 p-3 rounded-xl">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><GitFork size={10}/> Choices</label>
                                  <div className="space-y-2">
                                      {node.options?.map((opt: any, oIdx: number) => (
                                          <div key={oIdx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                              <input className="flex-1 text-xs font-bold bg-transparent outline-none" value={opt.text} onChange={(e) => {
                                                  const newOpts = [...node.options]; newOpts[oIdx].text = e.target.value;
                                                  updateNode(nIdx, 'options', newOpts);
                                              }} placeholder="Choice text..."/>
                                              
                                              <ArrowRight size={12} className="text-slate-300"/>
                                              
                                              <select 
                                                  className="text-[10px] max-w-[120px] bg-slate-50 border rounded p-1"
                                                  value={opt.nextNodeId} 
                                                  onChange={(e) => {
                                                      const newOpts = [...node.options]; newOpts[oIdx].nextNodeId = e.target.value;
                                                      updateNode(nIdx, 'options', newOpts);
                                                  }}
                                              >
                                                  <option value="end">🏁 End Scenario</option>
                                                  {block.nodes.map((n:any) => <option key={n.id} value={n.id}>{n.title ? n.title.substring(0,20) : n.id}</option>)}
                                              </select>

                                              <button onClick={() => {
                                                  const newOpts = node.options.filter((_:any, i:number) => i !== oIdx);
                                                  updateNode(nIdx, 'options', newOpts);
                                              }} className="text-slate-300 hover:text-rose-500"><X size={14}/></button>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                      <button onClick={() => addOption(nIdx)} className="text-[10px] font-bold text-slate-500 bg-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-300">+ Add Choice</button>
                                      <button onClick={() => autoBranch(nIdx)} className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-200 flex items-center gap-1"><LinkIcon size={10}/> Auto-Branch</button>
                                  </div>
                              </div>

                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const BLOCK_TYPES = [
      { type: 'text', label: 'Text', icon: <Type size={18}/> },
      { type: 'image', label: 'Image', icon: <ImageIcon size={18}/> },
      { type: 'video', label: 'Video', icon: <Video size={18}/> },
      { type: 'audio', label: 'Audio', icon: <Mic size={18}/> },
      { type: 'flashcard', label: 'Card', icon: <Layers size={18}/> },
      { type: 'vocab-list', label: 'Vocab', icon: <List size={18}/> },
      { type: 'dialogue', label: 'Dialogue', icon: <MessageSquare size={18}/> },
      { type: 'quiz', label: 'Quiz', icon: <HelpCircle size={18}/> },
      { type: 'scenario', label: 'Scenario', icon: <GitFork size={18}/> },
      { type: 'note', label: 'Note/Tip', icon: <Info size={18}/> },
      { type: 'code', label: 'Grammar', icon: <Code size={18}/> },
      { type: 'quote', label: 'Quote', icon: <Quote size={18}/> },
  ];

  const addBlock = (type: string) => { 
      let base = { title: '', content: '' };
      if(type === 'dialogue') base = { ...base, lines: [{ speaker: 'A', text: '', translation: '' }] } as any;
      if(type === 'vocab-list') base = { ...base, items: [{ term: '', definition: '' }] } as any;
      if(type === 'flashcard') base = { ...base, front: '', back: '' } as any;
      if(type === 'video') base = { ...base, url: '', caption: '' } as any;
      if(type === 'audio') base = { ...base, url: '', caption: '' } as any;
      if(type === 'image') base = { ...base, url: '', caption: '' } as any;
      if(type === 'note') base = { ...base, variant: 'info' } as any;
      if(type === 'quiz') base = { ...base, question: '', options: [{id:'a', text:''}, {id:'b', text:''}], correctId: 'a' } as any;
      if(type === 'scenario') base = { ...base, nodes: [{ id: 'start', title: 'Start', text: 'Where it begins...', color: 'neutral', options: [] }] } as any;
      
      setData({ ...data, blocks: [...(data.blocks || []), { type, ...base }] }); 
  };

  return (
    <div className="space-y-6">
       <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center text-emerald-900">
          <h3 className="font-bold flex items-center gap-2"><BookOpen size={18}/> Lesson Builder</h3>
          <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow-sm opacity-70">{(data.blocks || []).length} Blocks</span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                  <input className="w-full text-xl font-bold border-b border-slate-100 pb-2 focus:outline-none" placeholder="Lesson Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
              </div>
              <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                  <button onClick={() => setData({...data, visibility: 'private'})} className={`p-2 rounded-md ${data.visibility === 'private' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}><Lock size={14}/></button>
                  <button onClick={() => setData({...data, visibility: 'public'})} className={`p-2 rounded-md ${data.visibility === 'public' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><Globe size={14}/></button>
                  <button onClick={() => setData({...data, visibility: 'draft'})} className={`p-2 rounded-md ${data.visibility === 'draft' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}><EyeOff size={14}/></button>
              </div>
          </div>
          <textarea className="w-full text-sm text-slate-600 resize-none h-20 focus:outline-none" placeholder="Short description..." value={data.description} onChange={e => setData({...data, description: e.target.value})} />
      </div>

      <div className="space-y-4">
          {data.blocks?.map((block: any, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:border-indigo-200">
                  <div className="absolute top-4 right-4 flex gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">{block.type}</span>
                      <button onClick={() => setData({...data, blocks: data.blocks.filter((_:any, i:number) => i !== idx)})} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                  </div>
                  
                  {block.type === 'scenario' ? (
                      <div className="mt-2">
                          <input className="w-full font-bold text-sm focus:outline-none border-b border-slate-100 pb-1" placeholder="Scenario Title (e.g. At the Market)" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)}/>
                          <JuicyScenarioEditor block={block} bIdx={idx} />
                      </div>
                  ) : (
                      <div className="mt-2 space-y-2">
                          {block.type === 'text' && <textarea className="w-full text-sm bg-slate-50 p-3 rounded-lg min-h-[100px]" placeholder="Content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)}/>}
                          {['image','video','audio'].includes(block.type) && <input className="w-full p-2 border rounded" placeholder="Media URL..." value={block.url} onChange={e => updateBlock(idx, 'url', e.target.value)}/>}
                          
                          {/* (Include other simple block types here like previous example) */}
                          {/* Minimal render for brevity since Scenario is the focus */}
                          {block.type === 'vocab-list' && <div className="p-4 bg-slate-50 rounded text-center text-xs text-slate-400 italic">Vocab Editor (Use Add Item below)</div>}
                          {block.type === 'dialogue' && <div className="p-4 bg-slate-50 rounded text-center text-xs text-slate-400 italic">Dialogue Editor (Use Add Line below)</div>}
                      </div>
                  )}
              </div>
          ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
          {BLOCK_TYPES.map(t => (
              <button key={t.type} onClick={() => addBlock(t.type)} className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="text-slate-400 group-hover:text-indigo-600 mb-1">{t.icon}</div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{t.label}</span>
              </button>
          ))}
      </div>

      <button onClick={() => onSave({ ...data, xp: 100 })} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
          <Save size={20}/> Save Lesson
      </button>
    </div>
  );
}
// 3. EXAM BUILDER (With Visibility)
function TestBuilderView({ onSave, onCancel, initialData }: any) {
  const [testData, setTestData] = useState(initialData || { title: '', description: '', type: 'test', xp: 100, questions: [], visibility: 'private' });
  const [saving, setSaving] = useState(false);

  // ... (Question Types & Helper Functions from previous response) ...
  const QUESTION_TYPES = [
      { type: 'mcq', label: 'Multiple Choice', icon: <CheckCircle2 size={16}/> },
      { type: 'select-multi', label: 'Select All', icon: <CheckSquare size={16}/> },
      { type: 'tf', label: 'True/False', icon: <ArrowDownUp size={16}/> },
      { type: 'short-answer', label: 'Short Answer', icon: <Minus size={16}/> },
      { type: 'fill-blank', label: 'Fill Blank', icon: <MoreHorizontal size={16}/> },
      { type: 'match', label: 'Matching', icon: <ArrowRightLeft size={16}/> },
      { type: 'order', label: 'Ordering', icon: <ListOrdered size={16}/> },
      { type: 'image-id', label: 'Image ID', icon: <ImageIcon size={16}/> },
      { type: 'audio-res', label: 'Audio Response', icon: <Mic size={16}/> },
      { type: 'essay', label: 'Essay', icon: <AlignLeft size={16}/> },
  ];

  const addQuestion = (type: string) => {
    let newQ: any = { id: Date.now().toString(), type, prompt: '' };
    if (type === 'mcq') newQ = { ...newQ, options: [{id: 'o1', text: ''}, {id: 'o2', text: ''}], correctAnswer: '' };
    if (type === 'select-multi') newQ = { ...newQ, options: [{id: 'o1', text: ''}, {id: 'o2', text: ''}], correctAnswers: [] }; 
    if (type === 'tf') newQ = { ...newQ, correctAnswer: 'true' };
    if (type === 'match') newQ = { ...newQ, pairs: [{left: '', right: ''}, {left: '', right: ''}] };
    if (type === 'order') newQ = { ...newQ, items: [{id: 'i1', text: ''}, {id: 'i2', text: ''}] };
    if (type === 'short-answer' || type === 'fill-blank') newQ = { ...newQ, correctAnswer: '' };
    if (type === 'image-id') newQ = { ...newQ, imageUrl: '', options: [{id: 'o1', text: ''}], correctAnswer: '' };
    if (type === 'audio-res') newQ = { ...newQ, audioUrl: '', correctAnswer: '' };
    if (type === 'essay') newQ = { ...newQ, minLength: 50, manualGrading: true };
    setTestData({ ...testData, questions: [...testData.questions, newQ] });
  };

  const updateQuestion = (idx: number, field: string, val: any) => { const qs = [...testData.questions]; qs[idx] = { ...qs[idx], [field]: val }; setTestData({ ...testData, questions: qs }); };
  const updateOption = (qIdx: number, oIdx: number, val: string) => { const qs = [...testData.questions]; qs[qIdx].options[oIdx].text = val; setTestData({ ...testData, questions: qs }); };
  const addOption = (qIdx: number) => { const qs = [...testData.questions]; qs[qIdx].options.push({ id: `o${Date.now()}`, text: '' }); setTestData({ ...testData, questions: qs }); };
  const updatePair = (qIdx: number, pIdx: number, field: 'left' | 'right', val: string) => { const qs = [...testData.questions]; qs[qIdx].pairs[pIdx][field] = val; setTestData({ ...testData, questions: qs }); };
  const updateItem = (qIdx: number, iIdx: number, val: string) => { const qs = [...testData.questions]; qs[qIdx].items[iIdx].text = val; setTestData({ ...testData, questions: qs }); };

  const handleSave = async () => {
      if (!testData.title.trim()) { alert("Please add an Exam Title"); return; }
      setSaving(true);
      // Clean undefined
      const cleanQuestions = testData.questions.map((q: any) => {
          const cleanQ = { ...q };
          if (!cleanQ.options) cleanQ.options = [];
          if (!cleanQ.pairs) cleanQ.pairs = [];
          if (!cleanQ.items) cleanQ.items = [];
          if (cleanQ.correctAnswer === undefined) cleanQ.correctAnswer = "";
          if (cleanQ.imageUrl === undefined) cleanQ.imageUrl = "";
          if (cleanQ.audioUrl === undefined) cleanQ.audioUrl = "";
          return cleanQ;
      });
      const finalData = { ...testData, questions: cleanQuestions };
      try { await onSave(finalData); } catch (e) { alert("Save Failed."); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex justify-between items-center text-rose-900">
          <h3 className="font-bold flex items-center gap-2"><HelpCircle size={18}/> Exam Builder</h3>
          <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow-sm opacity-70">{(testData.questions || []).length} Questions</span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-4">
              <input className="flex-1 text-xl font-bold border-b border-slate-100 pb-2 focus:outline-none" placeholder="Exam Title" value={testData.title} onChange={e => setTestData({...testData, title: e.target.value})}/>
              
              {/* --- VISIBILITY SELECTOR --- */}
              <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                  <button onClick={() => setTestData({...testData, visibility: 'private'})} className={`p-2 rounded-md ${testData.visibility === 'private' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`} title="Private"><Lock size={14}/></button>
                  <button onClick={() => setTestData({...testData, visibility: 'public'})} className={`p-2 rounded-md ${testData.visibility === 'public' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`} title="Public"><Globe size={14}/></button>
                  <button onClick={() => setTestData({...testData, visibility: 'draft'})} className={`p-2 rounded-md ${testData.visibility === 'draft' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`} title="Draft"><EyeOff size={14}/></button>
              </div>
          </div>
      </div>

      {/* ... (Rest of the rendering logic for questions) ... */}
      <div className="space-y-4">
          {testData.questions.map((q: any, idx: number) => (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-rose-200 transition-colors">
                  <div className="mb-3 flex justify-between">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{q.type}</span>
                      <button onClick={() => setTestData({ ...testData, questions: testData.questions.filter((_:any, i:number) => i !== idx) })}><Trash2 size={16} className="text-slate-300 hover:text-rose-500"/></button>
                  </div>
                  <input className="w-full font-bold mb-3 border-b border-slate-100 pb-1" placeholder="Question Prompt..." value={q.prompt} onChange={e => updateQuestion(idx, 'prompt', e.target.value)} />
                  
                  {/* ... (Keep the render logic for MCQ, Essay, etc. from previous response) ... */}
              </div>
          ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
          {QUESTION_TYPES.map(t => (
              <button key={t.type} onClick={() => addQuestion(t.type)} className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition-all group">
                  <div className="text-slate-400 group-hover:text-rose-600 mb-1">{t.icon}</div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase text-center leading-tight">{t.label}</span>
              </button>
          ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full bg-rose-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader className="animate-spin"/> : <Save size={20}/>} 
          {saving ? 'Saving...' : 'Save Exam'}
      </button>
    </div>
  );
}
// --- NEW COMPONENT: VISIBILITY SELECTOR ---
function VisibilitySelector({ visibility, setVisibility, sharedWith, setSharedWith }: any) {
    const [emailInput, setEmailInput] = useState('');

    const addEmail = (e: any) => {
        e.preventDefault();
        if (emailInput && !sharedWith.includes(emailInput)) {
            setSharedWith([...sharedWith, emailInput]);
            setEmailInput('');
        }
    };

    const removeEmail = (email: string) => {
        setSharedWith(sharedWith.filter((e: string) => e !== email));
    };

    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe size={14}/> Visibility Settings
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => setVisibility('private')}
                    className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${visibility === 'private' ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'}`}
                >
                    <Lock size={18}/> Private
                </button>
                <button 
                    onClick={() => setVisibility('shared')}
                    className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${visibility === 'shared' ? 'bg-white border-amber-500 text-amber-600 shadow-sm ring-1 ring-amber-200' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'}`}
                >
                    <Users size={18}/> Shared
                </button>
                <button 
                    onClick={() => setVisibility('public')}
                    className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${visibility === 'public' ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm ring-1 ring-emerald-200' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'}`}
                >
                    <Globe size={18}/> Public
                </button>
            </div>

            {/* Description Text */}
            <div className="text-xs text-slate-500 text-center">
                {visibility === 'private' && "Only you can see and use this content."}
                {visibility === 'public' && "Visible to ALL users in the Community Library."}
                {visibility === 'shared' && "Visible only to specific users you add below."}
            </div>

            {/* Shared Email Input */}
            {visibility === 'shared' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-2">
                        <input 
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Enter user email..."
                            className="flex-1 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                        />
                        <button onClick={addEmail} className="bg-amber-500 text-white p-2 rounded-lg font-bold text-xs">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sharedWith.map((email: string) => (
                            <span key={email} className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                {email} <button onClick={() => removeEmail(email)}><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
// 4. MAIN BUILDER HUB CONTAINER
function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks, lessons }: any) {
  // --- STATE ---
  // Editor State
  const [lessonData, setLessonData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [], visibility: 'private', sharedWith: [] });
  const [mode, setMode] = useState('card'); // 'card' | 'lesson' | 'test'
  const [subView, setSubView] = useState('menu'); // 'menu' | 'library' | 'editor' | 'import'
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Import State
  const [jsonInput, setJsonInput] = useState('');
  const [importType, setImportType] = useState<'lesson' | 'deck' | 'test'>('lesson');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // -- NEW: Import Visibility State --
  const [importVisibility, setImportVisibility] = useState('private');
  const [importSharedWith, setImportSharedWith] = useState<string[]>([]);
  
  // Library Filter State
  const [libSearch, setLibSearch] = useState('');
  const [libFilter, setLibFilter] = useState('all'); 
  const [libLang, setLibLang] = useState('all'); 
  const [libDifficulty, setLibDifficulty] = useState('all');

  // --- HELPER: Difficulty Colors ---
  const getDiffColor = (diff: string) => {
      const d = (diff || '').toLowerCase();
      if (d.includes('begin') || d.includes('easy')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      if (d.includes('inter') || d.includes('med')) return 'bg-amber-100 text-amber-700 border-amber-200';
      if (d.includes('advan') || d.includes('hard')) return 'bg-rose-100 text-rose-700 border-rose-200';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  // --- LOGIC: PUBLISH TO GLOBAL ---
  const publishContent = async (collectionName: string, itemData: any) => {
      if (itemData.visibility === 'public') {
          try {
              const globalRef = doc(collection(db, 'artifacts', appId, 'public_library'));
              await setDoc(globalRef, {
                  ...itemData,
                  originalAuthorId: auth.currentUser?.uid,
                  originalAuthorName: auth.currentUser?.displayName || "Unknown",
                  publishedAt: Date.now(),
                  type: collectionName === 'custom_cards' ? 'deck' : 'lesson' 
              });
              console.log("Published to global library");
          } catch (e) {
              console.error("Error publishing global:", e);
          }
      }
  };

  // --- WRAPPED SAVE HANDLERS ---
  const handleSaveCardWrapper = async (data: any) => {
      await onSaveCard(data); 
  };

  const handleSaveLessonWrapper = async (data: any) => {
      await onSaveLesson(data); 
      if (data.visibility === 'public') {
          await publishContent('custom_lessons', data);
      }
  };

  const handleSaveTestWrapper = async (data: any) => {
      const testData = { ...data, contentType: 'test' };
      await onSaveLesson(testData, editingItem?.id); 
      if (testData.visibility === 'public') {
          await publishContent('custom_lessons', testData);
      }
  };

  // --- BULK IMPORT (UPDATED) ---
  const handleBulkImport = async () => {
    try {
        const data = JSON.parse(jsonInput);
        if (!Array.isArray(data)) throw new Error("Input must be an array.");
        const batch = writeBatch(db);
        // @ts-ignore
        const userId = auth.currentUser?.uid;
        // @ts-ignore
        const userName = auth.currentUser?.displayName || "Unknown";
        if(!userId) return;

        let count = 0;
        data.forEach((item: any) => {
            const id = item.id || `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const lang = item.targetLanguage || "Latin"; 
            const diff = item.difficulty || "Beginner";

            // Common Metadata including Visibility
            const baseMeta = {
                targetLanguage: lang,
                difficulty: diff,
                visibility: importVisibility,
                sharedWith: importSharedWith,
                authorId: userId,
                authorName: userName,
                createdAt: Date.now()
            };

            let itemRef;
            let finalData;

            if (importType === 'deck') {
                const deckId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                const deckTitle = item.title || "Imported Deck";
                if (item.cards && Array.isArray(item.cards)) {
                    item.cards.forEach((card: any) => {
                        const cardRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'custom_cards'));
                        batch.set(cardRef, { 
                            ...card, 
                            ...baseMeta,
                            deckId: deckId, 
                            deckTitle: deckTitle, 
                            type: card.type || 'noun', 
                            mastery: 0, 
                            grammar_tags: card.grammar_tags || ["Imported"],
                        });
                        count++;
                    });
                }
            } else {
                 // Lessons & Exams
                 itemRef = doc(db, 'artifacts', appId, 'users', userId, 'custom_lessons', id);
                 
                 if (importType === 'test') {
                     const processedQuestions = (item.questions || []).map((q: any, idx: number) => ({
                         ...q,
                         id: q.id || `q_${Date.now()}_${idx}`,
                         options: q.options?.map((opt: any, oIdx: number) => ({ ...opt, id: opt.id || `opt_${Date.now()}_${idx}_${oIdx}` })) || []
                     }));
                     finalData = { ...item, ...baseMeta, type: 'test', questions: processedQuestions, xp: item.xp || 100 };
                 } else {
                     finalData = { ...item, ...baseMeta, vocab: Array.isArray(item.vocab) ? item.vocab : [], xp: item.xp || 100 };
                 }
                 
                 // 1. Write to Private
                 batch.set(itemRef, finalData);
                 count++;

                 // 2. Write to Public (If Selected)
                 if (importVisibility === 'public') {
                     const publicRef = doc(collection(db, 'artifacts', appId, 'public_library'));
                     batch.set(publicRef, {
                         ...finalData,
                         originalAuthorId: userId,
                         originalAuthorName: userName,
                         publishedAt: Date.now(),
                         type: 'lesson' // normalize type for search
                     });
                 }
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

  // --- RENDER: LIBRARY VIEW ---
  if (subView === 'library') {
      const deckItems = Object.entries(allDecks || {}).map(([key, deck]: any) => ({
          id: key, ...deck, type: 'deck', subtitle: `${deck.cards?.length || 0} Cards`,
          targetLanguage: deck.targetLanguage || (deck.cards?.[0]?.targetLanguage) || 'Latin',
          difficulty: deck.difficulty || (deck.cards?.[0]?.difficulty) || 'Beginner'
      }));

      const contentItems = (lessons || []).map((l: any) => ({
          ...l, type: (l.type === 'test' || l.contentType === 'test') ? 'test' : 'lesson',
          subtitle: (l.type === 'test' || l.contentType === 'test') ? `${(l.questions || []).length} Questions` : `${(l.blocks || []).length} Blocks`,
          targetLanguage: l.targetLanguage || 'Latin', difficulty: l.difficulty || 'Beginner'
      }));

      const allItems = [...deckItems, ...contentItems];
      const availableLanguages = Array.from(new Set(allItems.map(i => i.targetLanguage))).sort();
      const availableDifficulties = Array.from(new Set(allItems.map(i => i.difficulty))).sort();

      const filteredItems = allItems.filter(item => {
          const matchesSearch = item.title.toLowerCase().includes(libSearch.toLowerCase());
          const matchesType = libFilter === 'all' || item.type === libFilter;
          const matchesLang = libLang === 'all' || item.targetLanguage === libLang;
          const matchesDiff = libDifficulty === 'all' || item.difficulty === libDifficulty;
          return matchesSearch && matchesType && matchesLang && matchesDiff;
      });

      return (
          <div className="h-full flex flex-col bg-slate-50">
              <div className="p-6 border-b border-slate-100 bg-white flex flex-col gap-4 sticky top-0 z-10 shadow-sm">
                  <div className="flex justify-between items-center">
                      <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Library className="text-indigo-600"/> Content Library</h2>
                      <button onClick={() => setSubView('menu')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-slate-50">Back to Hub</button>
                  </div>
                  <div className="flex flex-col gap-3">
                      <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                          <input value={libSearch} onChange={(e) => setLibSearch(e.target.value)} placeholder="Search content..." className="w-full pl-9 py-2 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                          <div className="relative"><select value={libFilter} onChange={(e) => setLibFilter(e.target.value)} className="w-full p-2 pl-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border-none focus:ring-2 focus:ring-indigo-500 appearance-none"><option value="all">All Types</option><option value="deck">Decks</option><option value="lesson">Lessons</option><option value="test">Exams</option></select><Layers size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"/></div>
                          <div className="relative"><select value={libLang} onChange={(e) => setLibLang(e.target.value)} className="w-full p-2 pl-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border-none focus:ring-2 focus:ring-indigo-500 appearance-none"><option value="all">All Langs</option>{availableLanguages.map(lang => (<option key={lang} value={lang}>{lang}</option>))}</select><Globe size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"/></div>
                          <div className="relative"><select value={libDifficulty} onChange={(e) => setLibDifficulty(e.target.value)} className="w-full p-2 pl-8 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border-none focus:ring-2 focus:ring-indigo-500 appearance-none"><option value="all">All Levels</option>{availableDifficulties.map(diff => (<option key={diff} value={diff}>{diff}</option>))}</select><BarChart3 size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"/></div>
                      </div>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  {filteredItems.length === 0 ? (<div className="text-center py-20 text-slate-400 italic">No content found matching your filters.</div>) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {filteredItems.map((item: any) => (
                              <div key={item.id} onClick={() => handleEdit(item, item.type === 'deck' ? 'card' : item.type === 'test' ? 'test' : 'lesson')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden flex flex-col h-full">
                                  {item.isPublic && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg z-20">PUBLIC</div>}
                                  <div className="flex justify-between items-start mb-3 relative z-10">
                                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${item.type === 'deck' ? 'bg-orange-50 text-orange-600 border-orange-100' : item.type === 'test' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{item.type === 'deck' ? 'Flashcards' : item.type === 'test' ? 'Exam' : 'Lesson'}</span>
                                      <Edit3 size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                                  </div>
                                  <div className="relative z-10 mb-4 flex-1">
                                      <h4 className="font-bold text-slate-800 text-lg mb-1 line-clamp-2 leading-tight">{item.title}</h4>
                                      <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"><Globe size={10}/> {item.targetLanguage.substring(0, 3).toUpperCase()}</span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getDiffColor(item.difficulty)}`}>{item.difficulty}</span>
                                      </div>
                                  </div>
                                  <div className="pt-3 border-t border-slate-100 relative z-10 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                      {item.type === 'deck' && <Layers size={14}/>} {item.type === 'lesson' && <BookOpen size={14}/>} {item.type === 'test' && <HelpCircle size={14}/>} {item.subtitle}
                                  </div>
                                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-[100px] transition-transform group-hover:scale-125 pointer-events-none ${item.type === 'deck' ? 'from-orange-400 to-amber-500' : item.type === 'test' ? 'from-rose-400 to-pink-500' : 'from-indigo-400 to-blue-500'}`}></div>
                              </div>
                           ))}
                      </div>
                  )}
              </div>
          </div>
      )
  }

  // --- RENDER: IMPORT VIEW (UPDATED) ---
  if (subView === 'import') {
      return (
          <div className="h-full flex flex-col bg-slate-50 p-6 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">AI / JSON Import</h2>
                 <button onClick={() => setSubView('menu')} className="text-sm font-bold text-slate-500 hover:text-indigo-600">Back</button>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col gap-4">
                 
                 {/* 1. Type Selector */}
                 <div className="flex gap-2">
                     <button onClick={() => setImportType('lesson')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${importType === 'lesson' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Lessons</button>
                     <button onClick={() => setImportType('deck')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${importType === 'deck' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Decks</button>
                     <button onClick={() => setImportType('test')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${importType === 'test' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Exams</button>
                 </div>

                 {/* 2. Visibility Selector */}
                 <VisibilitySelector 
                    visibility={importVisibility} 
                    setVisibility={setImportVisibility} 
                    sharedWith={importSharedWith} 
                    setSharedWith={setImportSharedWith} 
                 />

                 {/* 3. Text Area */}
                 <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="flex-1 w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[300px]" placeholder={importType === 'test' ? '[ { "title": "Midterm", "questions": [...] } ]' : importType === 'lesson' ? '[ { "title": "Lesson 1", "blocks": [...] } ]' : '[ { "title": "My Deck", "cards": [...] } ]'} />
                 
                 {/* 4. Action */}
                 <div className="flex justify-end">
                     <button onClick={handleBulkImport} disabled={!jsonInput} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"><UploadCloud size={18}/> Import JSON</button>
                 </div>
                 {toastMsg && <p className="text-emerald-600 font-bold text-center mt-2">{toastMsg}</p>}
             </div>
          </div>
      )
  }

  // --- RENDER: MAIN MENU / EDITOR ---
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
                    onSaveCard={handleSaveCardWrapper} 
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
                    onSave={handleSaveLessonWrapper} 
                    availableDecks={allDecks} 
                />
            )}
            {subView === 'editor' && mode === 'test' && (
                <TestBuilderView 
                    initialData={editingItem}
                    onSave={handleSaveTestWrapper}
                    onCancel={() => setSubView('menu')}
                />
            )}
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

  // Smooth Reordering Logic
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
        // Only calculate score for auto-gradable types
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
    // Check if manual grading is needed
    const hasManualQuestions = questions.some((q:any) => ['essay', 'short-answer', 'fill-blank', 'audio-res'].includes(q.type));
    
    // Calculate Score (only for auto-graded stuff)
    const percentage = questions.length > 0 ? score / questions.length : 0;
    // If manual, we give 0 XP for now, instructor awards it later
    const earnedXP = hasManualQuestions ? 0 : Math.round(test.xp * percentage);
    
    const submissionDetails = questions.map((q: any, idx: number) => {
        const ans = answers[idx];
        let isCorrect = false;
        let studentVal = ans || "No Answer"; 
        let correctVal = q.correctAnswer || "Manual Review";

        // Auto-grade logic for simple types
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
        
        // Manual types are NEVER automatically correct
        if(['essay', 'short-answer', 'fill-blank'].includes(q.type)) {
            isCorrect = false; 
        }

        return { prompt: q.prompt, type: q.type, isCorrect, studentVal, correctVal };
    });

    onFinish(
        test.id, 
        earnedXP, 
        test.title, 
        { 
            score, 
            total: questions.length, 
            details: submissionDetails,
            status: hasManualQuestions ? 'pending_review' : 'graded' 
        }
    ); 
  };

  const hasManualQuestions = questions.some((q:any) => ['essay', 'short-answer', 'fill-blank'].includes(q.type));

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

                  {/* ORDERING */}
                  {currentQ.type === 'order' && (
                      <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tap arrows to reorder</p>
                          {dragOrder.length > 0 ? dragOrder.map((item: any, idx: number) => (
                              <div key={item.id} className="bg-white p-3 rounded-xl border-2 border-slate-200 shadow-sm flex items-center gap-4 transition-all">
                                  <div className="flex flex-col gap-1">
                                      <button disabled={idx === 0} onClick={() => moveItem(idx, 'up')} className="p-1 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-colors">
                                          <ChevronUp size={16}/>
                                      </button>
                                      <button disabled={idx === dragOrder.length - 1} onClick={() => moveItem(idx, 'down')} className="p-1 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-colors">
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

                  {/* TEXT INPUTS (Essay, Short Answer, Fill Blank) */}
                  {['essay', 'short-answer', 'fill-blank'].includes(currentQ.type) && (
                      <div className="space-y-4">
                          {currentQ.type === 'essay' ? (
                              <textarea 
                                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-serif text-lg leading-relaxed h-64 resize-none"
                                  placeholder="Type your answer here..."
                                  value={answers[currentIndex] || ''}
                                  onChange={(e) => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                              />
                          ) : (
                              <input 
                                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg"
                                  placeholder="Type your answer..."
                                  value={answers[currentIndex] || ''}
                                  onChange={(e) => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                              />
                          )}
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">
                              {answers[currentIndex]?.length || 0} Characters
                          </p>
                      </div>
                  )}
              </div>
          ) : (
              <div className="text-center py-10 animate-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><Trophy size={48} /></div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Exam Submitted!</h2>
                  
                  {hasManualQuestions ? (
                      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-8 max-w-sm mx-auto">
                          <p className="text-amber-800 font-bold mb-1">Score Pending</p>
                          <p className="text-sm text-amber-600">This exam contains questions that require manual review by your instructor.</p>
                      </div>
                  ) : (
                      <>
                          <div className="text-6xl font-black text-indigo-600 mb-2">{score}<span className="text-2xl text-slate-300">/{questions.length}</span></div>
                          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">{Math.round((score/questions.length)*100)}% Accuracy</div>
                      </>
                  )}
                  
                  <button onClick={finishExam} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">
                      {hasManualQuestions ? "Return to Menu" : "Collect XP & Finish"}
                  </button>
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

function ClassGrades({ classData }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: SELECTED STUDENT STATE ---
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);

  // 1. Subscribe to Data
  useEffect(() => {
    if (!classData?.students || classData.students.length === 0) {
        setLoading(false);
        return;
    }

    // A. Fetch Student Profiles
    const qStudents = query(collectionGroup(db, 'profile'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
        const allStudents = snapshot.docs.map(d => d.data());
        const classStudents = allStudents.filter((s: any) => classData.studentEmails?.includes(s.email));
        setStudents(classStudents);
    });

    // B. Fetch Activity Logs
    const qLogs = query(collection(db, 'artifacts', appId, 'activity_logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
        const allLogs = snapshot.docs.map(d => d.data());
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

  // --- NEW: STUDENT DETAIL MODAL COMPONENT ---
  const StudentDetailModal = () => {
      if (!selectedStudentEmail) return null;

      const student = students.find(s => s.email === selectedStudentEmail) || { name: 'Unknown', email: selectedStudentEmail };
      const studentLogs = logs.filter(l => l.studentEmail === selectedStudentEmail);
      const stats = getStudentStats(selectedStudentEmail);

      return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedStudentEmail(null)}>
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white border-2 border-white shadow-md rounded-full overflow-hidden">
                              {student.photoURL ? (
                                  <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover"/>
                              ) : (
                                  <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl">
                                      {student.name?.charAt(0)}
                                  </div>
                              )}
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                              <p className="text-sm text-slate-500 font-mono">{student.email}</p>
                              <div className="flex gap-2 mt-2">
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                      {student.xp || 0} Total XP
                                  </span>
                                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                      {stats.average}% Quiz Avg
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedStudentEmail(null)} className="p-2 bg-white rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm text-slate-400">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body: Assignment List */}
                  <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                      {studentLogs.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 italic">No activity recorded for this student yet.</div>
                      ) : (
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                  <tr>
                                      <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Assignment</th>
                                      <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Date</th>
                                      <th className="p-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Score</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {studentLogs.map((log: any) => {
                                      const scorePct = log.scoreDetail ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : null;
                                      return (
                                          <tr key={log.id} className="hover:bg-slate-50/50">
                                              <td className="p-4">
                                                  <p className="font-bold text-slate-700">{log.itemTitle}</p>
                                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${log.type === 'quiz_score' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                      {log.type === 'quiz_score' ? 'Quiz' : 'Lesson'}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-slate-500 text-xs">
                                                  <div className="flex items-center gap-1">
                                                      <Calendar size={12}/>
                                                      {new Date(log.timestamp).toLocaleDateString()}
                                                  </div>
                                                  <div className="text-[10px] opacity-60 pl-4">
                                                      {new Date(log.timestamp).toLocaleTimeString()}
                                                  </div>
                                              </td>
                                              <td className="p-4 text-right">
                                                  {log.scoreDetail ? (
                                                      <div>
                                                          <span className={`text-lg font-black ${scorePct! >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                              {scorePct}%
                                                          </span>
                                                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                              {log.scoreDetail.score}/{log.scoreDetail.total} Correct
                                                          </p>
                                                      </div>
                                                  ) : (
                                                      <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold text-xs">
                                                          <CheckCircle2 size={14}/> Complete
                                                      </div>
                                                  )}
                                                  <div className="text-[10px] text-indigo-400 font-bold mt-1">+{log.xp} XP</div>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  if (loading) return <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2"><Loader className="animate-spin"/><span className="text-xs font-bold uppercase tracking-widest">Calculating Grades...</span></div>;

  return (
     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
        
        {/* Render the modal if a student is selected */}
        <StudentDetailModal />

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
                            <tr 
                                key={s.email} 
                                onClick={() => setSelectedStudentEmail(s.email)} // <--- CLICK HANDLER
                                className="hover:bg-indigo-50/50 transition-colors group cursor-pointer" // <--- CURSOR POINTER
                            >
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-serif font-bold shadow-sm border border-white group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            {s.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{s.name || 'Unknown'}</p>
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
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><Activity size={12}/> Active</span>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors"/>
                                        </div>
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
// --- NEW COMPONENT: ROSTER MANAGER MODAL ---
function RosterManagerModal({ isOpen, onClose, currentRosterEmails, onSave }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set(currentRosterEmails));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setSelectedEmails(new Set(currentRosterEmails));
            
            const q = query(collectionGroup(db, 'profile'), where('role', '==', 'student'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllStudents(students);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [isOpen, currentRosterEmails]);

    const toggleStudent = (email: string) => {
        const newSet = new Set(selectedEmails);
        if (newSet.has(email)) newSet.delete(email);
        else newSet.add(email);
        setSelectedEmails(newSet);
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(Array.from(selectedEmails));
        setSaving(false);
        onClose();
    };

    const filteredStudents = allStudents.filter(s => 
        (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (s.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users size={20} className="text-indigo-600"/> Manage Roster
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Select students to enroll in this class</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X size={20}/>
                    </button>
                </div>
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search students by name or email..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-400">
                            <Loader size={24} className="animate-spin"/>
                            <span className="text-xs font-bold uppercase tracking-widest">Loading Scholars...</span>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 italic">No students found matching "{searchTerm}".</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredStudents.map((student) => {
                                const isSelected = selectedEmails.has(student.email);
                                return (
                                    <div 
                                        key={student.email} 
                                        onClick={() => toggleStudent(student.email)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer select-none group ${
                                            isSelected 
                                            ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                                            : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                {student.photoURL ? (
                                                    <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    student.name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {student.name || "Unknown Student"}
                                                </h4>
                                                <p className={`text-xs ${isSelected ? 'text-indigo-600/70' : 'text-slate-400'}`}>
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-indigo-500 border-indigo-500 text-white scale-110' : 'border-slate-300 bg-white group-hover:border-slate-400'
                                        }`}>
                                            {isSelected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-500">
                        <span className="text-indigo-600 text-lg mr-1">{selectedEmails.size}</span> 
                        Selected
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-sm transition-colors">
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>}
                            Save Roster
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- UPDATED CLASS MANAGER VIEW ---
function ClassManagerView({ user, userData, classes, lessons, allDecks, initialClassId, onClearSelection }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClassId || null);
  
  useEffect(() => {
      if (initialClassId) setSelectedClassId(initialClassId);
  }, [initialClassId]);

  const [newClassName, setNewClassName] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [targetStudentMode, setTargetStudentMode] = useState('all'); 
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  // --- NEW: DATE STATE ---
  const [selectedDueDate, setSelectedDueDate] = useState('');

  const [assignType, setAssignType] = useState<'deck' | 'lesson' | 'test'>('lesson');
  const [viewTab, setViewTab] = useState<'content' | 'forum' | 'grades'>('content');
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  // --- ACTIONS ---
  const createClass = async (e: any) => { e.preventDefault(); if (!newClassName.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { name: newClassName, code: Math.random().toString(36).substring(2, 8).toUpperCase(), students: [], studentEmails: [], assignments: [], created: Date.now() }); setNewClassName(''); setToastMsg("Class Created Successfully"); } catch (error) { console.error("Create class failed:", error); alert("Failed to create class."); } };
  const handleDeleteClass = async (id: string) => { if (window.confirm("Delete this class?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id)); if (selectedClassId === id) setSelectedClassId(null); } catch (error) { console.error("Delete class failed:", error); alert("Failed to delete class."); } } };
  const handleRenameClass = async (classId: string, currentName: string) => { const newName = prompt("Enter new class name:", currentName); if (newName && newName.trim() !== "" && newName !== currentName) { try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), { name: newName.trim() }); setToastMsg("Class renamed successfully"); } catch (error) { console.error("Rename failed", error); alert("Failed to rename class"); } } };
  
  const toggleAssignee = (email: string) => { if (selectedAssignees.includes(email)) { setSelectedAssignees(selectedAssignees.filter(e => e !== email)); } else { setSelectedAssignees([...selectedAssignees, email]); } };
  
  // --- UPDATED ASSIGN CONTENT ---
  const assignContent = async (item: any, type: string) => { 
      if (!selectedClass) return; 
      try { 
          const assignment = JSON.parse(JSON.stringify({ 
              ...item, 
              id: `assign_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, 
              originalId: item.id, 
              contentType: type, 
              targetStudents: targetStudentMode === 'specific' ? selectedAssignees : null,
              // Save the date as a timestamp (midnight of that day)
              dueDate: selectedDueDate ? new Date(selectedDueDate).getTime() : null
          })); 
          
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: arrayUnion(assignment) }); 
          
          setAssignModalOpen(false); 
          setTargetStudentMode('all'); 
          setSelectedAssignees([]); 
          setSelectedDueDate(''); // Reset date
          setToastMsg(`Assigned: ${item.title}`); 
      } catch (error) { 
          console.error("Assign failed:", error); 
          alert("Failed to assign."); 
      } 
  };

  const handleUpdateRoster = async (newEmailList: string[]) => {
      if (!selectedClass) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { students: newEmailList, studentEmails: newEmailList });
          setToastMsg("Roster updated successfully");
      } catch (error) { console.error("Roster update failed:", error); alert("Failed to update roster."); }
  };

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
      if (!window.confirm("Unassign this content?")) return;
      try {
          const newAssignments = (selectedClass.assignments || []).filter((a: any) => a.id !== assignmentId);
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: newAssignments });
          setToastMsg("Assignment removed");
      } catch (e: any) { console.error(e); alert("Error removing assignment: " + e.message); }
  };

  const handleBack = () => { setSelectedClassId(null); if (onClearSelection) onClearSelection(); };

  if (selectedClass) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 relative bg-slate-50">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        
        <RosterManagerModal isOpen={isStudentListOpen} onClose={() => setIsStudentListOpen(false)} currentRosterEmails={selectedClass.studentEmails || []} onSave={handleUpdateRoster} />

        <div className="pb-4 border-b border-slate-200 mb-4 bg-white p-4 rounded-xl shadow-sm shrink-0">
          <button onClick={handleBack} className="flex items-center text-slate-400 hover:text-indigo-600 mb-3 text-xs font-bold uppercase tracking-wider"><ArrowLeft size={14} className="mr-1"/> All Classes</button>
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-800 leading-none">{selectedClass.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">Code: {selectedClass.code}</span>
                    <button className="text-indigo-600 hover:text-indigo-800" onClick={() => navigator.clipboard.writeText(selectedClass.code)}><Copy size={14}/></button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setViewTab('content')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${viewTab === 'content' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Manage</button>
                <button onClick={() => setViewTab('grades')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2 ${viewTab === 'grades' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}><BarChart3 size={14}/> Grades</button>
                <button onClick={() => setViewTab('forum')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${viewTab === 'forum' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Forum</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {viewTab === 'content' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><BookOpen size={16} className="text-indigo-600"/> Assignments</h3>
                            <div className="flex gap-1">
                                <button onClick={() => { setAssignType('lesson'); setAssignModalOpen(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Assign Lesson"><BookOpen size={16}/></button>
                                <button onClick={() => { setAssignType('deck'); setAssignModalOpen(true); }} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100" title="Assign Deck"><Layers size={16}/></button>
                                <button onClick={() => { setAssignType('test'); setAssignModalOpen(true); }} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100" title="Assign Exam"><HelpCircle size={16}/></button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {(!selectedClass.assignments || selectedClass.assignments.length === 0) && (
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm"><BookOpen className="mx-auto mb-2 opacity-50" size={32}/>No content assigned yet.</div>
                            )}
                            {selectedClass.assignments?.map((l: any, idx: number) => {
                              // Helper for instructor view of dates
                              const dateStatus = getDueStatus(l.dueDate);
                              return (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start group">
                                    <div className="flex items-start gap-3 overflow-hidden">
                                        <div className={`mt-1 p-2 rounded-lg shrink-0 ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'test' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {l.contentType === 'deck' ? <Layers size={16} /> : l.contentType === 'test' ? <HelpCircle size={16}/> : <FileText size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{l.title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded">
                                                    {l.contentType === 'deck' ? 'Deck' : l.contentType === 'test' ? 'Exam' : 'Unit'}
                                                </span>
                                                {dateStatus && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${dateStatus.color}`}>
                                                        <Clock size={10}/> {dateStatus.label}
                                                    </span>
                                                )}
                                                {l.targetStudents && l.targetStudents.length > 0 && (
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Users size={10}/> {l.targetStudents.length}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeAssignment(l.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"><Trash2 size={16} /></button>
                                </div> 
                              );
                            })}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Users size={16} className="text-indigo-600"/> Roster</h3>
                            <button onClick={() => setIsStudentListOpen(true)} className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"><UserPlus size={12}/> Manage</button>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {(!selectedClass.students || selectedClass.students.length === 0) && (<div className="p-8 text-center text-slate-400 text-sm italic"><Users className="mx-auto mb-2 opacity-50" size={32}/>Class is empty.<br/>Click "Manage" to add students.</div>)}
                            <div className="divide-y divide-slate-50">
                                {selectedClass.students?.map((s: string, i: number) => (
                                    <div key={i} className="p-3 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">{s.charAt(0).toUpperCase()}</div>
                                            <span className="text-xs font-bold text-slate-700 truncate">{s}</span>
                                        </div>
                                        <button onClick={() => removeStudent(s)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remove"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {viewTab === 'grades' && <div className="pb-20"><ClassGrades classData={selectedClass} /></div>}
            {viewTab === 'forum' && <div className="h-[600px] pb-20"><ClassForum classId={selectedClass.id} user={user} userData={{...userData, role: 'instructor'}} /></div>}
        </div>

        {assignModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Assign Content</h3><button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                  
                  {/* --- NEW: DATE PICKER --- */}
                  <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Due Date (Optional)</label>
                      <input 
                        type="date" 
                        value={selectedDueDate} 
                        onChange={(e) => setSelectedDueDate(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>

                  <div className="bg-white p-1 rounded-lg border border-slate-200 flex mb-2"><button onClick={() => setTargetStudentMode('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'all' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Entire Class</button><button onClick={() => setTargetStudentMode('specific')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'specific' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Specific Students</button></div>
                  {targetStudentMode === 'specific' && (<div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 custom-scrollbar">{(!selectedClass.students || selectedClass.students.length === 0) ? (<p className="text-xs text-slate-400 italic text-center p-2">No students in roster.</p>) : (selectedClass.students.map((studentEmail: string) => (<button key={studentEmail} onClick={() => toggleAssignee(studentEmail)} className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded text-left">{selectedAssignees.includes(studentEmail) ? <CheckCircle2 size={16} className="text-indigo-600"/> : <Circle size={16} className="text-slate-300"/>}<span className="text-xs font-medium text-slate-700 truncate">{studentEmail}</span></button>)))}</div>)}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {assignType === 'deck' && (<div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers size={14}/> Flashcard Decks</h4><div className="space-y-2">{Object.keys(allDecks || {}).length === 0 ? <p className="text-sm text-slate-400 italic">No decks found.</p> : Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => assignContent({ ...deck, id: key }, 'deck')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{deck.title}</h4><p className="text-xs text-slate-500">{deck.cards?.length || 0} Cards</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-orange-500"/></button>))}</div></div>)}
                  {assignType === 'lesson' && (<div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen size={14}/> Learning Units</h4><div className="space-y-2">{lessons.filter((l:any) => l.type !== 'test').length === 0 ? <p className="text-sm text-slate-400 italic">No lessons found.</p> : lessons.filter((l:any) => l.type !== 'test').map((l: any) => (<button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-indigo-500"/></button>))}</div></div>)}
                  {assignType === 'test' && (<div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><HelpCircle size={14}/> Exams</h4><div className="space-y-2">{lessons.filter((l:any) => l.type === 'test').length === 0 ? <p className="text-sm text-slate-400 italic">No exams found.</p> : lessons.filter((l:any) => l.type === 'test').map((l: any) => (<button key={l.id} onClick={() => assignContent(l, 'test')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{(l.questions || []).length} Questions • {l.xp} XP</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-rose-500"/></button>))}</div></div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative bg-slate-50 h-full p-6">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">My Classes</h2>
          <form onSubmit={createClass} className="flex gap-2 w-full sm:w-auto">
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="New Class Name" className="flex-1 p-2 rounded-lg border border-slate-200 text-sm" />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Create</button>
          </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls: any) => (
              <div key={cls.id} onClick={() => setSelectedClassId(cls.id)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={(e) => {e.stopPropagation(); handleRenameClass(cls.id, cls.name);}} className="text-slate-300 hover:text-indigo-500"><Edit3 size={16}/></button>
                      <button onClick={(e) => {e.stopPropagation(); handleDeleteClass(cls.id);}} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-bold text-lg">{cls.name.charAt(0)}</div>
                  <h3 className="font-bold text-lg text-slate-900 truncate pr-16">{cls.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{(cls.students || []).length} Students</p>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                      <span className="text-xs font-mono font-bold text-slate-600 tracking-wider">{cls.code}</span>
                      <button className="text-indigo-600 text-xs font-bold flex items-center gap-1" onClick={(e) => {e.stopPropagation(); navigator.clipboard.writeText(cls.code);}}><Copy size={12}/> Copy</button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}
// ============================================================================
//  1. JUICY TOAST NOTIFICATION
// ============================================================================
function JuicyToast({ message, type = 'success', onClose }: any) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${isSuccess ? 'bg-slate-900/90 border-emerald-500/30 text-white' : 'bg-white/90 border-rose-200 text-rose-600'}`}>
                <div className={`p-2 rounded-full ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-500'}`}>
                    {isSuccess ? <Check size={18} strokeWidth={3} /> : <AlertCircle size={18} strokeWidth={3} />}
                </div>
                <div>
                    <h4 className="font-bold text-sm">{isSuccess ? 'Success' : 'Error'}</h4>
                    <p className={`text-xs ${isSuccess ? 'text-slate-400' : 'text-rose-400'}`}>{message}</p>
                </div>
                <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                    <X size={14}/>
                </button>
            </div>
        </div>
    );
}

// ============================================================================
//  2. BROADCAST MODAL
// ============================================================================
function BroadcastModal({ classes, user, onClose, onToast }: any) {
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || !selectedClassId) return;
        setSending(true);
        try {
            const targetClass = classes.find((c: any) => c.id === selectedClassId);
            await addDoc(collection(db, 'artifacts', appId, 'announcements'), {
                classId: selectedClassId,
                className: targetClass?.name || 'Class',
                instructorName: user.email.split('@')[0], 
                content: message,
                timestamp: Date.now(),
                readBy: [] 
            });
            onToast("Broadcast sent to students!", "success");
            onClose();
        } catch (e) {
            console.error(e);
            onToast("Failed to send message.", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><XCircle size={24}/></button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-xl shadow-lg shadow-rose-200"><Megaphone size={24}/></div>
                    <div><h2 className="text-xl font-bold text-slate-900">Broadcast</h2><p className="text-xs text-slate-500">Send a push alert to students</p></div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Target Class</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Message</label>
                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-rose-500 resize-none" placeholder="e.g. Don't forget, the midterm is tomorrow!" value={message} onChange={(e) => setMessage(e.target.value)}/>
                    </div>
                    <button onClick={handleSend} disabled={sending || !message} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                        {sending ? <Loader className="animate-spin" size={18}/> : <Send size={18}/>} Send Blast
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  3. INSTRUCTOR INBOX
// ============================================================================
function InstructorInbox({ onGradeSubmission }: any) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [manualScore, setManualScore] = useState(0); 

  useEffect(() => {
      const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('scoreDetail.status', '==', 'pending_review'), orderBy('timestamp', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
          setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
      });
      return () => unsub();
  }, []);

  const selectedItem = submissions.find(s => s.id === selectedId);

  const handleSubmitGrade = async () => {
      if(!selectedItem) return;
      const baseXP = selectedItem.xp > 0 ? selectedItem.xp : 100; 
      const finalXP = Math.round(baseXP * (manualScore / 100));
      await onGradeSubmission(selectedItem.id, finalXP, feedback, manualScore);
      setSelectedId(null); setFeedback(''); setManualScore(0);
  };

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white z-10`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><Inbox size={18} className="text-indigo-600"/> Inbox</h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{submissions.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {submissions.length === 0 ? <div className="p-8 text-center text-slate-400 italic text-sm">All caught up! 🎉</div> : submissions.map(sub => (
                    <div key={sub.id} onClick={() => setSelectedId(sub.id)} className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${selectedId === sub.id ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                        <div className="flex justify-between items-start mb-1"><span className="font-bold text-slate-700 text-sm">{sub.studentName}</span><span className="text-[10px] text-slate-400">{new Date(sub.timestamp).toLocaleDateString()}</span></div>
                        <p className="text-xs text-slate-500 truncate mb-2">{sub.itemTitle}</p>
                        <div className="flex gap-2"><span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Needs Review</span></div>
                    </div>
                ))}
            </div>
        </div>
        <div className={`flex-1 flex flex-col bg-slate-50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
            {selectedItem ? (
                <>
                    <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3"><button onClick={() => setSelectedId(null)} className="md:hidden p-2 text-slate-400"><ArrowLeft size={20}/></button><div><h2 className="font-bold text-lg text-slate-800">{selectedItem.itemTitle}</h2><p className="text-xs text-slate-500">Submitted by <span className="font-bold text-indigo-600">{selectedItem.studentName}</span></p></div></div>
                        <div className="text-right"><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Auto-Score</div><div className="text-xl font-black text-slate-300">{selectedItem.scoreDetail.score}/{selectedItem.scoreDetail.total}</div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"><div className="max-w-3xl mx-auto space-y-6">
                        {selectedItem.scoreDetail.details.map((q: any, idx: number) => (
                            <div key={idx} className={`bg-white p-6 rounded-2xl border-2 shadow-sm ${['essay', 'short-answer'].includes(q.type) ? 'border-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 opacity-70'}`}>
                                <div className="flex justify-between items-start mb-4"><span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">{q.type}</span>{['essay', 'short-answer'].includes(q.type) ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"><AlertCircle size={12}/> Needs Grading</span> : (q.isCorrect ? <span className="text-emerald-500"><Check size={20}/></span> : <span className="text-rose-500"><X size={20}/></span>)}</div>
                                <h3 className="font-bold text-slate-800 text-lg mb-4">{q.prompt}</h3>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap font-serif">{q.studentVal}</div>
                                {!['essay', 'short-answer'].includes(q.type) && <div className="mt-2 text-xs text-slate-400">Correct: {q.correctVal}</div>}
                            </div>
                        ))}
                    </div></div>
                    <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20"><div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-end">
                        <div className="w-full space-y-2"><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MessageCircle size={14}/> Instructor Feedback</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" placeholder="Great job, but..." value={feedback} onChange={(e) => setFeedback(e.target.value)}/></div>
                        <div className="w-full md:w-auto shrink-0 flex flex-col gap-4 min-w-[250px]">
                            <div><div className="flex justify-between text-xs font-bold text-slate-500 mb-2"><span>FINAL SCORE</span><span className={`text-lg font-black ${manualScore >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{manualScore}%</span></div><input type="range" min="0" max="100" value={manualScore} onChange={(e) => setManualScore(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/></div>
                            <button onClick={handleSubmitGrade} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex justify-center items-center gap-2"><Send size={18}/> Release Grade</button>
                        </div>
                    </div></div>
                </>
            ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8"><Inbox size={64} className="mb-4 opacity-50"/><p className="text-lg font-bold">Select a submission to grade</p></div>}
        </div>
    </div>
  );
}

// ============================================================================
//  3. ANALYTICS DASHBOARD (Class Filtering & Named Printouts)
// ============================================================================
function AnalyticsDashboard({ classes }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState('all');

    // 1. Fetch Data
    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'),
            where('type', '==', 'time_log'),
            orderBy('timestamp', 'desc'),
            limit(500)
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(d => d.data());
            setLogs(fetched);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // 2. Filter Logic
    const filteredLogs = useMemo(() => {
        if (selectedClassId === 'all') return logs;

        // Find the selected class object
        const targetClass = classes.find((c:any) => c.id === selectedClassId);
        if (!targetClass || !targetClass.students) return [];

        // Filter logs where the student email is in the class roster
        // Note: This matches logs based on the student's email
        return logs.filter(log => targetClass.students.includes(log.studentEmail));
    }, [logs, selectedClassId, classes]);

    // 3. Stats Calculations (Based on Filtered Data)
    const totalSeconds = filteredLogs.reduce((acc, log) => acc + log.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const avgSession = filteredLogs.length ? Math.round(totalSeconds / filteredLogs.length / 60) : 0;
    
    // Group by Student
    const studentStats: any = {};
    filteredLogs.forEach(log => {
        if (!studentStats[log.studentEmail]) studentStats[log.studentEmail] = { name: log.studentName, totalSec: 0, sessions: 0 };
        studentStats[log.studentEmail].totalSec += log.duration;
        studentStats[log.studentEmail].sessions += 1;
    });

    const leaderboard = Object.values(studentStats)
        // @ts-ignore
        .sort((a:any, b:any) => b.totalSec - a.totalSec)
        .slice(0, 5);

    if (loading) return <div className="p-12 text-center text-slate-400"><Loader className="animate-spin inline"/> Loading Data...</div>;

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* HEADER & FILTER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-indigo-600"/> 
                    {selectedClassId === 'all' ? 'Global Analytics' : classes.find((c:any) => c.id === selectedClassId)?.name + ' Analytics'}
                </h2>
                
                {/* CLASS SELECTOR */}
                <div className="relative">
                    <select 
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="appearance-none bg-white pl-4 pr-10 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                    >
                        <option value="all">All Classes</option>
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Clock size={20}/></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Study Time</span></div>
                    <div className="text-3xl font-black text-slate-800">{totalHours} <span className="text-sm font-medium text-slate-400">Hours</span></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={20}/></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sessions</span></div>
                    <div className="text-3xl font-black text-slate-800">{filteredLogs.length}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Timer size={20}/></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Session</span></div>
                    <div className="text-3xl font-black text-slate-800">{avgSession} <span className="text-sm font-medium text-slate-400">Min</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEADERBOARD */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-700">Top Scholars</h3><Trophy size={16} className="text-yellow-500"/></div>
                    <div className="divide-y divide-slate-100">
                        {leaderboard.map((s:any, idx:number) => (
                            <div key={idx} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div><div><div className="font-bold text-sm text-slate-700">{s.name}</div><div className="text-xs text-slate-400">{s.sessions} Sessions</div></div></div>
                                <div className="font-mono font-bold text-indigo-600">{(s.totalSec / 60).toFixed(0)}m</div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No activity recorded for this selection.</div>}
                    </div>
                </div>

                {/* RECENT ACTIVITY FEED (Now with Names!) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-700">Recent Activity</h3></div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-0">
                        {filteredLogs.slice(0, 15).map((log, i) => (
                            <div key={i} className="p-4 border-b border-slate-50 hover:bg-indigo-50/30 transition-colors flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    {/* Generated Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                        {log.studentName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-800">{log.studentName}</span>
                                            <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 rounded-md uppercase tracking-wide">
                                                {log.activityType}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{log.itemTitle}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-indigo-600 text-sm">
                                        {Math.floor(log.duration / 60)}m {log.duration % 60}s
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {filteredLogs.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No activity recorded for this selection.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  5. INSTRUCTOR DASHBOARD (Main)
// ============================================================================
function InstructorDashboard({ user, userData, allDecks, lessons, onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewClassId, setViewClassId] = useState<string | null>(null);
  const [builderInitMode, setBuilderInitMode] = useState<'card' | 'lesson' | 'test' | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type: string = 'success') => { setToast({ msg, type }); };
  const handleQuickCreate = (type: 'card' | 'lesson' | 'test') => { setBuilderInitMode(type); setActiveTab('content'); };
  const handleClassShortcut = (classId: string) => { setViewClassId(classId); setActiveTab('classes'); };

  const handleGradeSubmission = async (logId: string, finalXP: number, feedback: string, scorePct: number) => {
      try {
          const logRef = doc(db, 'artifacts', appId, 'activity_logs', logId);
          await updateDoc(logRef, { 'scoreDetail.status': 'graded', 'scoreDetail.finalScorePct': scorePct, 'scoreDetail.instructorFeedback': feedback, xp: finalXP });
          showToast(`Grade released! (+${finalXP} XP)`, 'success');
      } catch (e) { console.error(e); showToast("Error saving grade", "error"); }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {toast && <JuicyToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showBroadcast && <BroadcastModal classes={userData.classes || []} user={user} onClose={() => setShowBroadcast(false)} onToast={showToast}/>}

      <div className="w-72 bg-slate-900 text-white flex-col hidden md:flex shrink-0 border-r border-slate-800 shadow-2xl relative z-20">
        <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold flex items-center gap-2 text-white"><GraduationCap className="text-indigo-400" strokeWidth={2.5}/> <span>Magister</span></h1>
            <div className="flex items-center gap-2 mt-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">{user.email.charAt(0).toUpperCase()}</div>
                <div className="overflow-hidden"><p className="text-xs font-bold text-slate-200 truncate w-40">{user.email}</p><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</p></div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Menu</p>
                <button onClick={() => setActiveTab('dashboard')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Activity size={18} /> Live Feed</button>
                <button onClick={() => setActiveTab('inbox')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Inbox size={18} /> Inbox</button>
                <button onClick={() => setActiveTab('classes')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'classes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><School size={18} /> Class Manager</button>
                <button onClick={() => setActiveTab('content')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Library size={18} /> Library</button>
                <button onClick={() => setActiveTab('analytics')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BarChart2 size={18} /> Analytics</button>
                <button onClick={() => setActiveTab('profile')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><User size={18} /> Settings</button>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Quick Create</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleQuickCreate('card')} className="flex flex-col items-center justify-center bg-slate-800 hover:bg-indigo-600 hover:text-white p-3 rounded-xl border border-slate-700 transition-all group"><Layers size={20} className="text-slate-400 group-hover:text-white mb-1"/><span className="text-[9px] font-bold text-slate-400 group-hover:text-white">Deck</span></button>
                    <button onClick={() => handleQuickCreate('test')} className="flex flex-col items-center justify-center bg-slate-800 hover:bg-rose-600 hover:text-white p-3 rounded-xl border border-slate-700 transition-all group"><HelpCircle size={20} className="text-slate-400 group-hover:text-white mb-1"/><span className="text-[9px] font-bold text-slate-400 group-hover:text-white">Quiz</span></button>
                    <button onClick={() => handleQuickCreate('lesson')} className="flex flex-col items-center justify-center bg-slate-800 hover:bg-emerald-600 hover:text-white p-3 rounded-xl border border-slate-700 transition-all group"><BookOpen size={20} className="text-slate-400 group-hover:text-white mb-1"/><span className="text-[9px] font-bold text-slate-400 group-hover:text-white">Unit</span></button>
                </div>
            </div>
            <div className="px-1"><button onClick={() => setShowBroadcast(true)} className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-rose-900/50 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"><Megaphone size={16}/> Broadcast Alert</button></div>
            <div className="space-y-1">
                <div className="flex justify-between items-center px-2 mb-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Classes</p><span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{userData.classes?.length || 0}</span></div>
                <div className="space-y-1">{userData.classes?.length > 0 ? userData.classes.map((cls: any) => (<button key={cls.id} onClick={() => handleClassShortcut(cls.id)} className="w-full px-3 py-2 rounded-lg flex items-center justify-between group hover:bg-slate-800 transition-colors text-left"><div className="flex items-center gap-2 overflow-hidden"><div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:animate-pulse shrink-0"></div><span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{cls.name}</span></div><ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400"/></button>)) : <div className="px-3 py-4 text-center border border-dashed border-slate-800 rounded-xl"><p className="text-[10px] text-slate-500">No classes yet</p></div>}</div>
            </div>
        </div>
        <div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="w-full p-3 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center gap-2 hover:bg-rose-900/20 hover:text-rose-300 transition-colors font-bold text-xs uppercase tracking-wider"><LogOut size={16} /> Sign Out</button></div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
         <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 z-50">
            <span className="font-bold flex items-center gap-2"><GraduationCap/> Magister</span>
            <div className="flex gap-4"><button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}><LayoutDashboard/></button><button onClick={() => setActiveTab('inbox')} className={activeTab === 'inbox' ? 'text-indigo-400' : 'text-slate-400'}><Inbox/></button><button onClick={() => setActiveTab('classes')} className={activeTab === 'classes' ? 'text-indigo-400' : 'text-slate-400'}><School/></button><button onClick={() => setActiveTab('content')} className={activeTab === 'content' ? 'text-indigo-400' : 'text-slate-400'}><Library/></button></div>
         </div>
         <div className="flex-1 overflow-hidden relative">
            {activeTab === 'dashboard' && (
                <div className="h-full flex flex-col">
                    <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                        <div><h2 className="text-lg font-bold text-slate-800">Live Command Center</h2><p className="text-xs text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Active • {new Date().toLocaleDateString()}</p></div>
                        <div className="flex gap-4 text-center"><div><span className="block text-lg font-black text-slate-800 leading-none">{userData.classes?.length || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase">Classes</span></div><div className="w-px h-8 bg-slate-100"></div><div><span className="block text-lg font-black text-indigo-600 leading-none">{allDecks.custom?.cards?.length || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase">Cards</span></div></div>
                    </div>
                    <div className="flex-1 overflow-hidden p-4 md:p-6 bg-slate-100/50"><LiveActivityFeed /></div>
                </div>
            )}
            
            {activeTab === 'inbox' && <div className="h-full overflow-hidden"><InstructorInbox onGradeSubmission={handleGradeSubmission} /></div>}
            
            {activeTab === 'analytics' && <div className="h-full overflow-y-auto bg-slate-50"><AnalyticsDashboard classes={userData.classes || []} /></div>}

            {activeTab === 'classes' && <div className="h-full overflow-y-auto p-4 md:p-8"><ClassManagerView user={user} userData={userData} classes={userData?.classes || []} lessons={lessons} allDecks={allDecks} initialClassId={viewClassId} onClearSelection={() => setViewClassId(null)} /></div>}
            
            {activeTab === 'content' && <div className="h-full overflow-hidden flex flex-col bg-white"><BuilderHub onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} onSaveLesson={onSaveLesson} allDecks={allDecks} lessons={lessons} initialMode={builderInitMode} onClearMode={() => setBuilderInitMode(null)} /></div>}
            
            {activeTab === 'profile' && <ProfileView user={user} userData={userData} />}
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
// ============================================================================
//  NOTIFICATION SYSTEM
// ============================================================================


// 2. STUDENT: NOTIFICATION BELL
function NotificationBell({ user, enrolledClassIds }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for Announcements
    useEffect(() => {
        // SAFETY CHECK: Do not run query if user is missing OR if class list is empty
        if (!user || !enrolledClassIds || enrolledClassIds.length === 0) {
            return;
        }

        try {
            // Note: We removed 'orderBy' because 'in' queries + 'orderBy' require a complex composite index
            // We sort the results in JavaScript instead to avoid index errors.
            const q = query(
                collection(db, 'artifacts', appId, 'announcements'),
                where('classId', 'in', enrolledClassIds),
                limit(10)
            );

            const unsub = onSnapshot(q, (snapshot) => {
                const fetched = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    // @ts-ignore
                    .sort((a, b) => b.timestamp - a.timestamp); // Sort Newest First

                setAlerts(fetched);
                
                // Calc unread
                const unread = fetched.filter((a: any) => !a.readBy?.includes(user.email)).length;
                setUnreadCount(unread);
            }, (error) => {
                console.log("Notification Sync Error (Ignore if just loading):", error);
            });

            return () => unsub();
        } catch (e) {
            console.error("Query Setup Error:", e);
        }
    }, [user, enrolledClassIds]); // Re-run when class list loads

    const markAllRead = async () => {
        const batch = writeBatch(db);
        alerts.forEach((alert) => {
            if (!alert.readBy?.includes(user.email)) {
                const ref = doc(db, 'artifacts', appId, 'announcements', alert.id);
                batch.update(ref, { readBy: arrayUnion(user.email) });
            }
        });
        try {
            await batch.commit();
            setUnreadCount(0); // Optimistic update
        } catch (e) { console.error(e); }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => { setIsOpen(!isOpen); if(!isOpen && unreadCount > 0) markAllRead(); }} 
                className="relative p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all active:scale-90"
            >
                <Bell size={20} className={`text-white ${unreadCount > 0 ? 'animate-[swing_1s_ease-in-out_infinite]' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-indigo-600 shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 cursor-default z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-4 zoom-in-95 z-50 origin-top-right ring-4 ring-black/5">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Alerts</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{alerts.length}</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {alerts.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs italic flex flex-col items-center">
                                    <Bell size={24} className="mb-2 opacity-20"/>
                                    All caught up!
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className="p-4 border-b border-slate-50 hover:bg-indigo-50/30 transition-colors relative group text-left">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-indigo-600 text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wide">{alert.className}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-snug font-medium">{alert.content}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                {alert.instructorName?.charAt(0)}
                                            </div>
                                            <p className="text-[10px] text-slate-400">{alert.instructorName}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // --- ADD THIS HELPER INSIDE App() ---
  const displayName = useMemo(() => {
      if (userData?.name && userData.name !== 'Student' && userData.name !== 'User') return userData.name;
      if (user?.displayName) return user.displayName;
      if (user?.email) {
          const namePart = user.email.split('@')[0];
          const cleanName = namePart.replace(/[0-9]/g, ''); 
          return cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Scholar";
      }
      return 'Student';
  }, [userData, user]);
  
  // Data State
  const [systemDecks, setSystemDecks] = useState<any>({});
  const [systemLessons, setSystemLessons] = useState<any[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [classLessons, setClassLessons] = useState<any[]>([]);
  const [publicContent, setPublicContent] = useState<any[]>([]); // New: Public Library Content
  
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
  const lessons = useMemo(() => [
      ...systemLessons, 
      ...customLessons, 
      ...publicContent, 
      ...classLessons.filter(l => l.contentType !== 'deck')
  ], [systemLessons, customLessons, classLessons, publicContent]);
  
  const libraryLessons = useMemo(() => [...systemLessons, ...customLessons, ...publicContent], [systemLessons, customLessons, publicContent]);

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
    
    // 4. Public Content Listener
    const qPublic = query(collection(db, 'artifacts', appId, 'public_library'), limit(50));
    const unsubPublic = onSnapshot(qPublic, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data(), isPublic: true }));
        setPublicContent(items);
    });

    return () => { unsubProfile(); unsubCards(); unsubLessons(); unsubClasses(); unsubPublic(); };
  }, [user, userData?.role]);

  // --- ACTIONS ---
  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card. Check permissions."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Are you sure you want to delete this card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); alert("Failed to delete card."); } }, [user]);
// --- REPLACEMENT HANDLER ---
  const onSaveLesson = async (lessonData: any, editingId?: string) => {
    if (!user) return;
    
    // 1. Generate ID if new
    const docId = editingId || `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 2. Clean Data (Deep Copy + Default Values)
    // This prevents "FirebaseError: Function document() cannot be called with an undefined path."
    const cleanData = JSON.parse(JSON.stringify({
      ...lessonData,
      id: docId,
      authorId: user.uid,
      authorName: userData?.name || "Instructor",
      lastUpdated: Date.now(),
      title: lessonData.title || "Untitled",
      type: lessonData.type || "lesson", 
      blocks: lessonData.blocks || [],
      questions: lessonData.questions || [], 
      visibility: lessonData.visibility || 'private'
    }));

    try {
      // 3. Save to Firebase (Using setDoc to control the ID)
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', docId), cleanData);
      
      alert("Saved Successfully!");
      
      // 4. Update Local State to reflect changes immediately
      setCustomLessons(prev => {
          const others = prev.filter(l => l.id !== docId);
          return [...others, cleanData];
      });
      
    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`Failed to save: ${error.message}`);
    }
  };  
 const handleFinishLesson = useCallback(async (lessonId: string, xp: number, title?: string, scoreDetail?: any) => { 
    if (userData?.role !== 'instructor') setActiveTab('home'); 
    
    // FIX: Allow saving if XP is > 0 OR if there is a scoreDetail (even if XP is 0 for pending essays)
    if (user && (xp > 0 || scoreDetail)) { 
        try { 
            // Only update Profile XP if > 0
            if (xp > 0) {
                await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { 
                    xp: increment(xp), 
                    completedAssignments: arrayUnion(lessonId) 
                }); 
            }

            // Always save the log (This is what the Inbox listens for)
            await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { 
                studentName: userData?.name || 'Unknown Student', 
                studentEmail: user.email, 
                itemTitle: title || 'Unknown Activity', 
                xp: xp, 
                timestamp: Date.now(), 
                type: scoreDetail ? 'quiz_score' : 'completion', 
                scoreDetail: scoreDetail || null 
            });

            if(userData?.role === 'instructor') alert(`Activity Logged: ${title}`);
        } catch (e: any) { 
            console.error("Error logging activity:", e);
            // Fallback for new users
            if (xp > 0) {
                await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { ...DEFAULT_USER_DATA, xp: xp, completedAssignments: [lessonId] }, { merge: true }); 
            }
        } 
    } 
  }, [user, userData]);

  // --- NEW: LOG SELF STUDY (For Practice Hub) ---
  const handleLogSelfStudy = useCallback(async (itemId: string, xp: number, title: string, scoreDetail?: any) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
            studentName: userData?.name || 'Unknown Student',
            studentEmail: user.email,
            itemTitle: title || 'Self Study Session',
            xp: xp,
            timestamp: Date.now(),
            type: scoreDetail ? 'quiz_score' : 'practice',
            scoreDetail: scoreDetail || null,
            isSelfStudy: true
        });
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp) });
    } catch (e) {
        console.error("Error logging self-study:", e);
    }
  }, [user, userData]);

  // --- NEW: DECK MANAGEMENT ---
  const handleDeleteDeck = useCallback(async (deckId: string) => {
      if (!user) return;
      if (!window.confirm("Permanently delete this deck? This cannot be undone.")) return;
      
      try {
          const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), where('deckId', '==', deckId));
          // IMPORTANT: Import getDocs at top of file
          const snapshot = await getDocs(q); 
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();

          if (userData?.deckPreferences?.customOrder) {
              const newOrder = userData.deckPreferences.customOrder.filter((id: string) => id !== deckId);
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
                  'deckPreferences.customOrder': newOrder
              });
          }
          alert("Deck deleted.");
      } catch (e: any) {
          console.error(e);
          alert("Error deleting deck: " + e.message);
      }
  }, [user, userData]);

  const handleUpdatePreferences = useCallback(async (newPrefs: any) => {
      if (!user) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              deckPreferences: newPrefs
          });
      } catch (e) {
          console.error("Error saving preferences", e);
      }
  }, [user]);

  // --- RENDER HELPERS ---
  if (!authChecked) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>;
  if (!user) return <AuthView />;
  if (!userData) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>; 
  
const commonHandlers = { 
      onSaveCard: handleCreateCard, 
      onUpdateCard: handleUpdateCard, 
      onDeleteCard: handleDeleteCard, 
      onSaveLesson: onSaveLesson, // <--- CHANGE THIS (was handleCreateLesson)
  };
 const renderStudentView = () => {
    let content;
    let viewKey; 

    if (activeLesson) {
        viewKey = `lesson-${activeLesson.id}`;
        
        if (activeLesson.type === 'test' || activeLesson.contentType === 'test') {
             // @ts-ignore
             // Added types: (id: string, xp: number, title: string, score: any)
             content = <TestPlayerView test={activeLesson} onFinish={(id: string, xp: number, title: string, score: any) => { handleFinishLesson(id, xp, title, score); setActiveLesson(null); }} />;
        } else if (activeLesson.type === 'email_module') {
             // @ts-ignore
             content = <EmailSimulatorView module={activeLesson} onFinish={(id: string, xp: number, title: string) => { handleFinishLesson(id, xp, title); setActiveLesson(null); }} />;
        } else {
             content = <LessonView lesson={activeLesson} onFinish={(id: string, xp: number, title: string) => { handleFinishLesson(id, xp, title); setActiveLesson(null); }} />;
        }

    } else if (activeTab === 'home' && activeStudentClass) {
        viewKey = `class-${activeStudentClass.id}`;
        // displayName is now available here because we added it in Step 1
        content = <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} user={user} displayName={displayName} />;
    
    } else {
        viewKey = `tab-${activeTab}`;
        switch (activeTab) {
            case 'home': 
                content = <HomeView setActiveTab={setActiveTab} allDecks={allDecks} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} user={user} />;
                break;
            case 'flashcards': 
                const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck');
                const deckToLoad = assignedDeck || allDecks[selectedDeckKey];
                content = (
                    <FlashcardView 
                        allDecks={allDecks} 
                        selectedDeckKey={selectedDeckKey} 
                        onSelectDeck={setSelectedDeckKey} 
                        onSaveCard={handleCreateCard} 
                        activeDeckOverride={deckToLoad} 
                        onComplete={handleFinishLesson}
                        onLogActivity={handleLogSelfStudy}
                        userData={userData} 
                        onUpdatePrefs={handleUpdatePreferences} 
                        onDeleteDeck={handleDeleteDeck} 
                    />
                );
                break;
            case 'create': 
                content = <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={onSaveLesson} allDecks={allDecks} lessons={lessons} />;
                break;
            case 'profile': 
                content = <ProfileView user={user} userData={userData} />;
                break;
            default: 
                content = <HomeView />;
        }
    }

    return (
        <div key={viewKey} className="h-full w-full animate-in fade-in duration-300">
            {content}
        </div>
    );
  };
  
  const isWidgetMode = window.location.pathname === '/widget';

  if (isWidgetMode) {
      if (!authChecked) return <div className="bg-slate-900 h-screen w-screen flex items-center justify-center text-white"><Loader className="animate-spin"/></div>;
      if (!user || !userData) return <div className="h-screen w-screen bg-slate-100 flex items-center justify-center text-xs text-slate-400">Please Log In</div>;
      return <WidgetView allDecks={allDecks} userData={userData} />;
  }

  return (
<div className="bg-slate-50 min-h-screen w-full font-sans text-slate-900 flex justify-center items-start relative overflow-hidden">
  <style>{`
        html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #f8fafc; }
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-400/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      
      <RoleToggle user={user} userData={userData} />

      <div className={`w-full h-[100dvh] relative overflow-hidden bg-slate-50 ${userData?.role === 'instructor' ? 'max-w-full' : 'max-w-full sm:max-w-[400px] sm:h-[850px] sm:rounded-[3rem] sm:shadow-2xl sm:border-[8px] sm:border-slate-900/10'}`}>
        
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
