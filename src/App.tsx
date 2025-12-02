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
  ChevronUp
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
  const xpNeeded = nextLevelXP - currentLevelXP;
  const completedCount = (userData?.completedAssignments || []).length;
  const classCount = (userData?.classes || []).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden transform scale-100 transition-all relative border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 pb-12 text-white text-center overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[60px] mix-blend-overlay animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-indigo-300/20 rounded-full blur-[40px] mix-blend-overlay"></div>
            <button onClick={onClose} className="absolute top-5 right-5 text-white/50 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-md transition-all"><X size={20} /></button>
           <div className="flex flex-col items-center relative z-10">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.25)] mb-4 overflow-hidden">
                {userData?.photoURL ? (<img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />) : (<span className="font-serif font-bold text-4xl text-white drop-shadow-md">{userData?.name?.charAt(0) || "U"}</span>)}
            </div>
                <h2 className="text-3xl font-serif font-bold tracking-tight">{userData?.name}</h2>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">{userData?.email}</p>
                <div className="mt-4 bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner"><Award size={14} className="text-yellow-300" /><span className="text-xs font-bold uppercase tracking-wide">{rank}</span></div>
            </div>
        </div>
        <div className="px-6 pb-8 -mt-8 relative z-20">
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 mb-6">
                <div className="flex justify-between items-end mb-2"><div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Status</span><span className="text-2xl font-black text-slate-800">Level {level}</span></div><div className="text-right"><span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span></div></div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner border border-slate-200"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}><div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div></div></div>
                <p className="text-center text-xs text-slate-500 mt-3 font-medium"><span className="text-indigo-600 font-bold">{xpNeeded} XP</span> until Level {level + 1}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center gap-2 shadow-sm"><div className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><Zap size={20} fill="currentColor"/></div><div className="text-center"><p className="text-2xl font-black text-slate-800 leading-none">{userData?.streak || 1}</p><p className="text-[10px] text-orange-600/70 uppercase font-bold tracking-wider mt-1">Day Streak</p></div></div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center gap-2 shadow-sm"><div className="p-2 bg-white rounded-full text-blue-500 shadow-sm"><Award size={20}/></div><div className="text-center"><p className="text-2xl font-black text-slate-800 leading-none">{userData?.xp || 0}</p><p className="text-[10px] text-blue-600/70 uppercase font-bold tracking-wider mt-1">Total XP</p></div></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1"><span className="text-2xl font-bold text-slate-700">{completedCount}</span><span className="text-[9px] text-slate-400 font-bold uppercase">Assignments Done</span></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-1"><span className="text-2xl font-bold text-slate-700">{classCount}</span><span className="text-[9px] text-slate-400 font-bold uppercase">Active Classes</span></div>
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

function ProfileView({ user, userData }: any) {
  const [deploying, setDeploying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => signOut(auth);
  const { level, progress, rank } = getLevelInfo(userData?.xp || 0);

  const deploySystemContent = async () => { setDeploying(true); const batch = writeBatch(db); Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); INITIAL_SYSTEM_LESSONS.forEach((lesson: any) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); try { await batch.commit(); alert("Deployed!"); } catch (e: any) { alert("Error: " + e.message); } setDeploying(false); };
  const toggleRole = async () => { if (!userData) return; const newRole = userData.role === 'instructor' ? 'student' : 'instructor'; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole }); };

  const handleImageUpload = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert("File is too large (Max 5MB)"); return; }
      if (!file.type.startsWith('image/')) { alert("Please upload an image file"); return; }
      setUploading(true);
      try {
          const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
          await uploadBytes(storageRef, file);
          const photoURL = await getDownloadURL(storageRef);
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
        <div className="relative bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-700/90 backdrop-blur-md pb-16 pt-10 px-6 rounded-b-[2rem] shadow-2xl z-0 shrink-0 text-center overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-400/40 rounded-full blur-[80px] mix-blend-overlay pointer-events-none animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-300/40 rounded-full blur-[60px] mix-blend-overlay pointer-events-none animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
            
            <div className="relative inline-block mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.3)] relative z-10 overflow-hidden">
                    {uploading ? <Loader className="animate-spin text-white" /> : userData?.photoURL ? <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-serif font-bold text-4xl text-white drop-shadow-lg">{userData?.name?.charAt(0) || 'U'}</span>}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                </div>
                <div className="absolute inset-0 border border-white/20 rounded-full scale-125 animate-pulse pointer-events-none"></div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <h1 className="text-3xl font-serif font-bold text-white drop-shadow-md mb-1">{userData?.name}</h1>
            <p className="text-blue-100 font-medium tracking-wide text-sm opacity-80">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"><div className={`w-1.5 h-1.5 rounded-full ${userData?.role === 'instructor' ? 'bg-amber-400' : 'bg-emerald-400'} shadow-[0_0_10px_currentColor]`}></div><span className="text-[10px] font-bold text-white uppercase tracking-widest">{userData?.role} Account</span></div>
        </div>

        <div className="px-6 -mt-12 relative z-10 pb-24">
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-[inset_0_2px_20px_rgba(255,255,255,0.2),_0_15px_35px_rgba(0,0,0,0.1)] border border-white/40 mb-8 relative overflow-hidden ring-1 ring-white/20">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400/80 via-indigo-500/80 to-blue-600/80"></div>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="text-center border-r border-blue-500/10"><span className="block text-blue-900/60 text-[10px] font-bold uppercase tracking-widest mb-1">Current Rank</span><div className="flex items-center justify-center gap-2 text-indigo-600 drop-shadow-sm"><Award size={22} /><span className="text-xl font-black">{level}</span></div><span className="text-xs font-bold text-indigo-500/80">{rank}</span></div>
                    <div className="text-center"><span className="block text-blue-900/60 text-[10px] font-bold uppercase tracking-widest mb-1">Day Streak</span><div className="flex items-center justify-center gap-2 text-amber-500 drop-shadow-sm"><Zap size={22} fill="currentColor"/><span className="text-xl font-black">{userData?.streak || 1}</span></div><span className="text-xs font-bold text-amber-500/80">On Fire!</span></div>
                    <div className="col-span-2 pt-4 border-t border-blue-500/10"><div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-blue-900/60">XP Progress</span><span className="text-xs font-bold text-indigo-600">{userData?.xp || 0} XP</span></div><div className="w-full bg-blue-900/5 rounded-full h-3 overflow-hidden shadow-inner border border-white/30"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(79,70,229,0.4)]" style={{ width: `${progress}%` }}><div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div></div></div></div>
                </div>
            </div>
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-blue-900/50 uppercase tracking-wider ml-2 mb-2">Account Settings</h3>
                <button onClick={toggleRole} className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm flex items-center justify-between group hover:bg-white/95 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm"><School size={20}/></div><div className="text-left"><h4 className="font-bold text-slate-800 text-base">Switch Role</h4><p className="text-[10px] text-slate-500">Currently: {userData?.role}</p></div></div><div className="w-8 h-8 rounded-full bg-slate-50/50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ChevronRight size={16}/></div></button>
                <button onClick={deploySystemContent} disabled={deploying} className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm flex items-center justify-between group hover:bg-white/95 hover:border-slate-400 hover:shadow-md transition-all active:scale-[0.98]"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors shadow-sm">{deploying ? <Loader className="animate-spin" size={20}/> : <UploadCloud size={20}/>}</div><div className="text-left"><h4 className="font-bold text-slate-800 text-base">Deploy Content</h4><p className="text-[10px] text-slate-500">Reset system defaults</p></div></div></button>
                <button onClick={handleLogout} className="w-full bg-rose-50/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100/60 shadow-sm flex items-center justify-between group hover:bg-rose-100/90 hover:border-rose-200 hover:shadow-md transition-all active:scale-[0.98] mt-5"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-white/80 text-rose-500 rounded-xl flex items-center justify-center shadow-sm"><LogOut size={20}/></div><div className="text-left"><h4 className="font-bold text-rose-700 text-base">Sign Out</h4><p className="text-[10px] text-rose-500/80">See you soon!</p></div></div></button>
            </div>
            <div className="mt-8 text-center"><p className="text-[9px] font-bold text-blue-900/30 uppercase tracking-widest">LinguistFlow v3.2 • Profile Shine Edition</p></div>
        </div>
    </div>
  );
}

// --- STUDENT QUIZ VIEW (NEW) ---
function StudentQuizView({ quiz, onFinish }: any) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle');

    const question = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / quiz.questions.length) * 100;

    const handleAnswer = (optionId: string) => {
        if (answerState !== 'idle') return;
        setSelectedOption(optionId);
        
        const isCorrect = optionId === question.correctId;
        setAnswerState(isCorrect ? 'correct' : 'wrong');
        
        if (isCorrect) setScore(s => s + 1);

        setTimeout(() => {
            if (currentQuestionIndex < quiz.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption(null);
                setAnswerState('idle');
            } else {
                setIsComplete(true);
            }
        }, 1500);
    };

    if (isComplete) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <Trophy size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Quiz Complete!</h2>
                <p className="text-slate-500 mb-8">You scored <span className="text-indigo-600 font-bold text-xl">{score}</span> out of <span className="font-bold">{quiz.questions.length}</span></p>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-400 uppercase">Accuracy</span>
                        <span className="text-2xl font-black text-slate-800">{Math.round((score / quiz.questions.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(score / quiz.questions.length) * 100}%` }}></div>
                    </div>
                </div>

                <button 
                    onClick={() => onFinish(quiz.id, Math.round((score / quiz.questions.length) * quiz.xp) || 10, quiz.title, { score, total: quiz.questions.length })} 
                    className="w-full max-w-sm bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                    Collect Rewards
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
            <div className="bg-white p-6 pb-8 border-b border-slate-200 relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quiz Mode</span>
                    <button onClick={() => onFinish(quiz.id, 0, quiz.title)} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
                </div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight pr-8">{quiz.title}</h2>
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100">
                    <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                <div className="w-full space-y-8">
                    <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                        <h3 className="text-2xl font-serif font-bold text-slate-900 leading-snug">{question.text}</h3>
                    </div>

                    <div className="space-y-3">
                        {question.options.map((opt: any) => {
                            const isSelected = selectedOption === opt.id;
                            const isCorrect = opt.id === question.correctId;
                            
                            let buttonStyle = "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md";
                            if (answerState !== 'idle') {
                                if (isCorrect) buttonStyle = "bg-emerald-100 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200";
                                else if (isSelected && !isCorrect) buttonStyle = "bg-rose-100 border-rose-500 text-rose-800 opacity-50";
                                else buttonStyle = "bg-slate-50 border-slate-200 opacity-50";
                            } else if (isSelected) {
                                buttonStyle = "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200";
                            }

                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt.id)}
                                    disabled={answerState !== 'idle'}
                                    className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all duration-200 flex items-center justify-between group ${buttonStyle}`}
                                >
                                    <span>{opt.text}</span>
                                    {answerState !== 'idle' && isCorrect && <CheckCircle2 size={20} className="text-emerald-600"/>}
                                    {answerState !== 'idle' && isSelected && !isCorrect && <AlertCircle size={20} className="text-rose-600"/>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
            
            {answerState === 'correct' && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2">
                    <Check size={18} /> Correct!
                </div>
            )}
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
  
  const currentDeck = activeDeckOverride || allDecks[selectedDeckKey];
  const deckCards = currentDeck?.cards || [];
  const card = deckCards[currentIndex];
  const theme = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.noun) : TYPE_COLORS.noun;

  const handleDeckChange = (key: string) => { onSelectDeck(key); setIsSelectorOpen(false); setCurrentIndex(0); setIsFlipped(false); setXrayMode(false); setManageMode(false); };
  const filteredCards = deckCards.filter((c: any) => (c.front || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.back || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const handleQuickAdd = (e: any) => { e.preventDefault(); if(!quickAddData.front || !quickAddData.back) return; onSaveCard({ ...quickAddData, deckId: selectedDeckKey, ipa: "/.../", mastery: 0, morphology: [{ part: quickAddData.front, meaning: "Custom", type: "root" }], usage: { sentence: "-", translation: "-" }, grammar_tags: ["Quick Add"] }); setQuickAddData({ front: '', back: '', type: 'noun' }); setSearchTerm(''); alert("Card Added!"); };

  if (!card && !manageMode) return <div className="h-full flex flex-col bg-slate-50"><Header title={currentDeck?.title || "Empty Deck"} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<button onClick={() => setManageMode(true)} className="p-2 bg-slate-100 rounded-full"><List size={20} className="text-slate-600" /></button>} /><div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400"><Layers size={48} className="mb-4 opacity-20" /><p>This deck is empty.</p><button onClick={() => setManageMode(true)} className="mt-4 text-indigo-600 font-bold text-sm">Add Cards</button></div></div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 pb-6 relative overflow-hidden">
      <Header title={currentDeck?.title.split(' ')[1] || "Deck"} subtitle={`${currentIndex + 1} / ${deckCards.length}`} onClickTitle={() => setIsSelectorOpen(!isSelectorOpen)} rightAction={<div className="flex items-center gap-2">{activeDeckOverride && onComplete && (<button onClick={() => onComplete(activeDeckOverride.id, 50, currentDeck.title)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"><Check size={14}/> Complete</button>)}<button onClick={() => setManageMode(!manageMode)} className={`p-2 rounded-full transition-colors ${manageMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{manageMode ? <X size={20} /> : <List size={20} />}</button></div>} />
      {isSelectorOpen && <div className="absolute top-24 left-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-4">{Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => handleDeckChange(key)} className={`w-full text-left p-3 rounded-xl font-bold text-sm mb-1 ${selectedDeckKey === key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>{deck.title} <span className="float-right opacity-50">{deck.cards.length}</span></button>))}</div>}
      {isSelectorOpen && <div className="absolute inset-0 z-40 bg-black/5 backdrop-blur-[1px]" onClick={() => setIsSelectorOpen(false)} />}
      
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
            {card && (
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
      {!manageMode && card && (
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

function ClassForum({ classId, user, userData }: any) {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');

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

  const handleCreateThread = async (e: any) => {
    e.preventDefault();
    if (!newThread.title.trim() || !newThread.content.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'forum_threads'), {
      classId, title: newThread.title, content: newThread.content,
      authorName: userData?.name || user.email.split('@')[0], authorEmail: user.email,
      authorRole: userData?.role || 'student', timestamp: Date.now(), replies: []
    });
    setNewThread({ title: '', content: '' }); setIsCreating(false);
  };

  const handleReply = async (e: any) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeThread) return;
    const reply = { id: Date.now().toString(), content: replyContent, authorName: userData?.name || user.email.split('@')[0], authorRole: userData?.role || 'student', timestamp: Date.now() };
    const threadRef = doc(db, 'artifacts', appId, 'forum_threads', activeThread.id);
    await updateDoc(threadRef, { replies: arrayUnion(reply) });
    setActiveThread((prev: any) => ({ ...prev, replies: [...(prev.replies || []), reply] }));
    setReplyContent('');
  }; 

  if (activeThread) {
    return (
      <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
        <div className="bg-white p-4 border-b border-slate-200 flex items-start gap-3 sticky top-0 z-10">
          <button onClick={() => setActiveThread(null)} className="mt-1 text-slate-400 hover:text-indigo-600"><ArrowLeft size={20} /></button>
          <div><h3 className="font-bold text-lg text-slate-800 leading-snug">{activeThread.title}</h3><p className="text-xs text-slate-500">Posted by <span className="font-bold text-indigo-600">{activeThread.authorName}</span> • {new Date(activeThread.timestamp).toLocaleDateString()}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm"><p className="text-slate-700 whitespace-pre-wrap">{activeThread.content}</p></div>
          {activeThread.replies?.map((reply: any) => (
            <div key={reply.id} className={`flex flex-col ${reply.authorRole === 'instructor' ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[85%] p-3 rounded-xl text-sm ${reply.authorRole === 'instructor' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-200 text-slate-800 rounded-tl-none'}`}><p className="font-bold text-[10px] opacity-70 mb-1">{reply.authorName}</p><p>{reply.content}</p></div>
               <span className="text-[10px] text-slate-400 mt-1">{new Date(reply.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t border-slate-200"><form onSubmit={handleReply} className="flex gap-2"><input className="flex-1 bg-slate-100 border-0 rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} /><button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 active:scale-95 transition-transform"><ArrowRight size={20} /></button></form></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-600"/> Class Forum</h3><button onClick={() => setIsCreating(true)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors">+ New Post</button></div>
       {isCreating && (<div className="bg-white p-4 rounded-xl border-2 border-indigo-100 mb-4 animate-in slide-in-from-top-2"><input className="w-full font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 focus:outline-none placeholder:font-normal" placeholder="Topic Title..." value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} autoFocus /><textarea className="w-full text-sm text-slate-600 bg-slate-50 p-2 rounded-lg resize-none focus:outline-none mb-2" rows={3} placeholder="What's on your mind?" value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} /><div className="flex justify-end gap-2"><button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button><button onClick={handleCreateThread} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Post</button></div></div>)}
       <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar">
          {threads.length === 0 ? (<div className="text-center py-10 text-slate-400 italic">No discussions yet. Start one!</div>) : (threads.map(thread => (<div key={thread.id} onClick={() => setActiveThread(thread)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-all active:scale-[0.99]"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-slate-800 line-clamp-1">{thread.title}</h4>{thread.authorRole === 'instructor' && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Instructor</span>}</div><p className="text-sm text-slate-500 line-clamp-2 mb-3">{thread.content}</p><div className="flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-wide"><div className="flex items-center gap-2"><span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{thread.authorName.charAt(0)}</span><span>{thread.authorName}</span></div><div className="flex items-center gap-3"><span className="flex items-center gap-1"><MessageSquare size={12}/> {thread.replies?.length || 0}</span><span>{new Date(thread.timestamp).toLocaleDateString()}</span></div></div></div>)))}
       </div>
    </div>
  );
}

function StudentClassView({ classData, onBack, onSelectLesson, onSelectDeck, onSelectQuiz, userData }: any) {
  const [viewMode, setViewMode] = useState<'assignments' | 'forum'>('assignments');
  const completedSet = new Set(userData?.completedAssignments || []);
  const handleAssignmentClick = (assignment: any) => { 
      if (assignment.contentType === 'deck') { onSelectDeck(assignment); } 
      else if (assignment.contentType === 'quiz') { onSelectQuiz(assignment); }
      else { onSelectLesson(assignment); } 
  };
  const relevantAssignments = (classData.assignments || []).filter((l: any) => { const isForMe = !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); return isForMe; });
  const pendingCount = relevantAssignments.filter((l: any) => !completedSet.has(l.id)).length;
  const progressPercent = relevantAssignments.length > 0 ? ((relevantAssignments.length - pendingCount) / relevantAssignments.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 pb-20 pt-12 px-6 rounded-b-[3rem] shadow-2xl z-10 shrink-0">
          <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[80px] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-300/20 rounded-full blur-[60px] mix-blend-overlay pointer-events-none"></div>
          <div className="relative z-20 flex justify-between items-start mb-6"><button onClick={onBack} className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10"><ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Back</button><div className="flex flex-col items-end"><span className="text-[10px] uppercase font-bold text-blue-200 tracking-widest mb-1">Class Code</span><div className="bg-white/20 backdrop-blur-md border border-white/20 text-white font-mono font-bold px-3 py-1 rounded-lg shadow-sm">{classData.code}</div></div></div>
          <div className="relative z-20 text-center"><h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 drop-shadow-md">{classData.name}</h1><div className="inline-flex bg-black/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner"><button onClick={() => setViewMode('assignments')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'assignments' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><BookOpen size={18} className={viewMode === 'assignments' ? 'fill-current' : ''}/> Assignments</button><button onClick={() => setViewMode('forum')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'forum' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><MessageSquare size={18} className={viewMode === 'forum' ? 'fill-current' : ''}/> Forum</button></div></div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 -mt-10 relative z-20 custom-scrollbar">
        {viewMode === 'assignments' ? (
            <div className="px-6 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 flex items-center justify-between relative overflow-hidden group"><div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform duration-500"></div><div className="relative z-10"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Your Progress</p><div className="flex items-baseline gap-2"><span className="text-4xl font-black text-slate-800">{Math.round(progressPercent)}%</span><span className="text-sm font-bold text-indigo-600">Complete</span></div><div className="mt-3 flex gap-1"><div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${progressPercent > 0 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{width: '100%'}}></div></div><div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${progressPercent > 33 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{width: '100%'}}></div></div><div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${progressPercent > 66 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{width: '100%'}}></div></div></div></div><div className="text-right relative z-10"><div className="bg-indigo-50 p-3 rounded-2xl inline-flex flex-col items-center min-w-[80px] border border-indigo-100 group-hover:border-indigo-200 transition-colors"><span className="text-2xl font-bold text-indigo-600">{pendingCount}</span><span className="text-[10px] text-indigo-400 font-bold uppercase">To Do</span></div></div></div>
                <div>
                    <h3 className="font-bold text-blue-900/70 text-sm uppercase tracking-wider mb-4 ml-1 flex items-center gap-2"><Layers size={16} className="text-blue-500"/> Tasks ({relevantAssignments.length})</h3>
                    <div className="space-y-3">
                        {relevantAssignments.length > 0 ? ( relevantAssignments.filter((l: any) => !completedSet.has(l.id)).map((l: any, i: number) => ( 
                            <button key={`${l.id}-${i}`} onClick={() => handleAssignmentClick(l)} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-blue-300 hover:shadow-lg group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'quiz' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {l.contentType === 'deck' ? <Layers size={22}/> : l.contentType === 'quiz' ? <HelpCircle size={22} /> : <PlayCircle size={22} />}
                                    </div>
                                    <div className="text-left"><h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{l.title}</h4><div className="flex items-center gap-2 mt-0.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600 border-orange-100' : l.contentType === 'quiz' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{l.contentType === 'deck' ? 'Deck' : l.contentType === 'quiz' ? 'Quiz' : 'Lesson'}</span>{l.xp && <span className="text-[10px] font-bold text-emerald-600">+{l.xp} XP</span>}</div></div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm relative z-10"><ChevronRight size={16} /></div>
                            </button> 
                        )) ) : ( <div className="p-10 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">No pending assignments.</div> )}
                        {relevantAssignments.every((l: any) => completedSet.has(l.id)) && relevantAssignments.length > 0 && (<div className="p-8 text-center bg-emerald-50 border border-emerald-100 rounded-3xl animate-in zoom-in duration-300"><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={24}/></div><p className="text-emerald-800 font-bold">All assignments completed!</p><p className="text-emerald-600/70 text-xs">Great work, legend.</p></div>)}
                    </div>
                </div>
            </div>
        ) : (
            <div className="px-6 h-full pb-20"><div className="bg-white rounded-t-3xl shadow-xl border-x border-t border-slate-200 min-h-full p-2"><ClassForum classId={classData.id} user={{email: userData.email}} userData={userData} /></div></div>
        )}
      </div>
    </div>
  );
}

// --- QUIZ BUILDER VIEW (NEW) ---
function QuizBuilderView({ data, setData, onSave }: any) {
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const addQuestion = () => {
        const newQuestion = {
            id: `q_${Date.now()}`,
            text: '',
            options: [
                { id: 'opt_a', text: '' },
                { id: 'opt_b', text: '' },
                { id: 'opt_c', text: '' },
                { id: 'opt_d', text: '' }
            ],
            correctId: 'opt_a'
        };
        setData({ ...data, questions: [...(data.questions || []), newQuestion] });
    };

    const updateQuestion = (idx: number, field: string, val: any) => {
        const newQuestions = [...data.questions];
        newQuestions[idx] = { ...newQuestions[idx], [field]: val };
        setData({ ...data, questions: newQuestions });
    };

    const updateOption = (qIdx: number, oIdx: number, val: string) => {
        const newQuestions = [...data.questions];
        newQuestions[qIdx].options[oIdx].text = val;
        setData({ ...data, questions: newQuestions });
    };

    const removeQuestion = (idx: number) => {
        const newQuestions = data.questions.filter((_: any, i: number) => i !== idx);
        setData({ ...data, questions: newQuestions });
    };

    const handleSave = () => {
        if (!data.title) return alert("Quiz title is required");
        if ((data.questions || []).length === 0) return alert("Add at least one question");
        
        onSave({ 
            ...data, 
            type: 'quiz',
            xp: (data.questions.length * 10) + 50 // Auto calc XP
        });
        setToastMsg("Quiz Saved Successfully");
    };

    return (
        <div className="px-6 mt-4 space-y-8 pb-20 relative">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trophy size={18} className="text-emerald-600"/> Quiz Metadata</h3>
                <input className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="Quiz Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
                <textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Description (Optional)" value={data.description} onChange={e => setData({...data, description: e.target.value})} />
                <div className="bg-emerald-50 p-2 rounded text-xs text-emerald-800 font-bold">Estimated Reward: {(data.questions?.length || 0) * 10 + 50} XP</div>
            </section>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><HelpCircle size={18} className="text-emerald-600"/> Questions</h3>
                    <span className="text-xs text-slate-400">{(data.questions || []).length} Items</span>
                </div>

                {(data.questions || []).map((q: any, qIdx: number) => (
                    <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                        <div className="absolute right-4 top-4">
                            <button onClick={() => removeQuestion(qIdx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                        </div>
                        
                        <div className="mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Question {qIdx + 1}</span>
                            <input 
                                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="Enter question text..." 
                                value={q.text} 
                                onChange={e => updateQuestion(qIdx, 'text', e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            {q.options.map((opt: any, oIdx: number) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name={`correct_${q.id}`} 
                                        checked={q.correctId === opt.id} 
                                        onChange={() => updateQuestion(qIdx, 'correctId', opt.id)}
                                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                                    />
                                    <input 
                                        className={`flex-1 p-2 border rounded-lg text-sm ${q.correctId === opt.id ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-100'}`}
                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                        value={opt.text}
                                        onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <button onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-emerald-300 transition-all font-bold text-sm">
                    <PlusCircle size={18} /> Add Question
                </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <button onClick={handleSave} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                    <Save size={20} /> Save Quiz to Library
                </button>
            </div>
        </div>
    );
}

function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onSaveQuiz, allDecks }: any) {
  const [data, setData] = useState<any>({ title: '', description: '', questions: [], blocks: [] });
  const [mode, setMode] = useState('card'); 
  const [subView, setSubView] = useState('menu'); // menu | library | editor
  const [editingItem, setEditingItem] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleEdit = (item: any, type: string) => {
      setEditingItem(item);
      setMode(type);
      setSubView('editor');
      if(type === 'lesson' || type === 'quiz') setData(item);
  };

  const handleReset = (newMode: string) => {
      setMode(newMode);
      setEditingItem(null);
      setSubView('editor');
      if (newMode === 'lesson') setData({ title: '', blocks: [], vocab: '' });
      if (newMode === 'quiz') setData({ title: '', description: '', questions: [] });
  };

  return (
    <div className="pb-24 h-full bg-slate-50 overflow-y-auto custom-scrollbar relative">
        <Header title="Scriptorium" subtitle="Content Creator" 
            rightAction={
                <button onClick={() => setSubView(subView === 'menu' ? 'library' : 'menu')} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                    {subView === 'menu' ? <Library size={20}/> : <Home size={20}/>}
                </button>
            } 
        />
        
        {(subView === 'menu' || subView === 'editor') && (
             <div className="px-6 mt-2">
                <div className="flex bg-slate-200 p-1 rounded-xl">
                    <button onClick={() => handleReset('card')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'card' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Flashcard</button>
                    <button onClick={() => handleReset('lesson')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'lesson' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Lesson</button>
                    <button onClick={() => handleReset('quiz')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'quiz' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Quiz</button>
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
                    data={data} 
                    setData={setData} 
                    onSave={onSaveLesson} 
                    availableDecks={allDecks} 
                />
            )}
            {subView === 'editor' && mode === 'quiz' && (
                <QuizBuilderView 
                    data={data} 
                    setData={setData} 
                    onSave={onSaveQuiz} 
                />
            )}
        </div>
    </div>
  );
}

// Re-using existing CardBuilderView and LessonBuilderView (assuming they are kept from previous iteration)
// Included purely to ensure the file compiles if I missed pasting them earlier, but for brevity in response:
// Assuming previous CardBuilderView and LessonBuilderView logic is preserved exactly as is.
function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId, initialData, onCancelEdit }: any) {
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { 
      if (initialData) {
          setEditingId(initialData.id);
          setFormData({ front: initialData.front, back: initialData.back, type: initialData.type || 'noun', ipa: initialData.ipa || '', sentence: initialData.usage?.sentence || '', sentenceTrans: initialData.usage?.translation || '', grammarTags: initialData.grammar_tags?.join(', ') || '', deckId: initialData.deckId || initialDeckId || 'custom' });
          setMorphology(initialData.morphology || []);
      }
  }, [initialData, initialDeckId]);

  const handleChange = (e: any) => { if (e.target.name === 'deckId') { if (e.target.value === 'new') { setIsCreatingDeck(true); setFormData({ ...formData, deckId: 'new' }); } else { setIsCreatingDeck(false); setFormData({ ...formData, deckId: e.target.value }); } } else { setFormData({ ...formData, [e.target.name]: e.target.value }); } };
  const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
  const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };
  
  const handleSubmit = (e: any) => { e.preventDefault(); if (!formData.front || !formData.back) return; let finalDeckId = formData.deckId; let finalDeckTitle = null; if (formData.deckId === 'new') { if (!newDeckTitle) return alert("Please name your new deck."); finalDeckId = `custom_${Date.now()}`; finalDeckTitle = newDeckTitle; } const cardData = { front: formData.front, back: formData.back, type: formData.type, deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "/.../", mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] }; if (editingId) { onUpdateCard(editingId, cardData); } else { onSaveCard(cardData); } setFormData({ ...formData, front: '', back: '' }); if (onCancelEdit) onCancelEdit(); };
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title }));

  return (
    <div className="px-6 mt-4 space-y-6 pb-20 relative">
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center"><div><p className="font-bold flex items-center gap-2"><Layers size={16}/> {editingId ? 'Editing Card' : 'Card Creator'}</p></div>{editingId && <button onClick={onCancelEdit} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel</button>}</div>
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Target Deck</label><select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-3 rounded-lg border border-slate-200 bg-indigo-50/50 font-bold text-indigo-900 disabled:opacity-50"><option value="custom">✍️ Scriptorium (My Deck)</option>{deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}<option value="new">✨ + Create New Deck</option></select>{isCreatingDeck && <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter New Deck Name" className="w-full p-3 rounded-lg border-2 border-indigo-500 bg-white font-bold mt-2" />}</div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Latin Word</label><input name="front" value={formData.front} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="e.g. Bellum" /></div><div className="space-y-2"><label className="text-xs font-bold text-slate-400">English</label><input name="back" value={formData.back} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="e.g. War" /></div></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-400">Part of Speech</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 bg-white"><option value="noun">Noun</option><option value="verb">Verb</option><option value="adjective">Adjective</option><option value="adverb">Adverb</option><option value="phrase">Phrase</option></select></div><div className="space-y-2"><label className="text-xs font-bold text-slate-400">IPA</label><input name="ipa" value={formData.ipa} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-mono text-sm" placeholder="/ˈbel.lum/" /></div></div>
      </section>
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Morphology</h3>
        <div className="flex gap-2 items-end"><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Part</label><input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="Bell-" /></div><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">Meaning</label><input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 text-sm" placeholder="War" /></div><button type="button" onClick={addMorphology} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200"><Plus size={20}/></button></div>
        <div className="flex flex-wrap gap-2 mt-2">{morphology.map((m, i) => (<div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm"><span className="font-bold text-indigo-700">{m.part}</span><span className="text-slate-500 text-xs">({m.meaning})</span><button type="button" onClick={() => removeMorphology(i)} className="text-slate-300 hover:text-rose-500"><X size={14}/></button></div>))}</div>
      </section>
      <button onClick={handleSubmit} className={`w-full text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingId ? <><Save size={20}/> Update Card</> : <><Plus size={20}/> Create Card</>}</button>
    </div>
  );
}

function LessonBuilderView({ data, setData, onSave, availableDecks }: any) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const updateBlock = (index: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[index] = { ...newBlocks[index], [field]: value }; setData({ ...data, blocks: newBlocks }); };
  const addBlock = (type: string) => { const baseBlock = type === 'text' ? { type: 'text', title: '', content: '' } : { type: 'text', title: '', content: '' }; setData({ ...data, blocks: [...(data.blocks || []), baseBlock] }); };
  const handleSave = () => { if (!data.title) return alert("Title required"); onSave({ ...data, xp: 100 }); setToastMsg("Lesson Saved Successfully"); };

  return (
    <div className="px-6 mt-4 space-y-8 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> Lesson Metadata</h3><input className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} /><textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Description" value={data.description} onChange={e => setData({...data, description: e.target.value})} /></section>
      <div className="space-y-4"><h3 className="font-bold text-slate-800">Content Blocks</h3>{(data.blocks || []).map((block: any, idx: number) => (<div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200"><input className="w-full p-2 border-b mb-2 font-bold" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} placeholder="Block Title"/><textarea className="w-full p-2 bg-slate-50" value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} placeholder="Content"/></div>))}</div>
      <div className="grid grid-cols-2 gap-2"><button onClick={() => addBlock('text')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">Add Text Block</button></div>
      <div className="pt-4 border-t border-slate-100"><button onClick={handleSave} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg">Save Lesson</button></div>
    </div>
  );
}

function ClassManagerView({ user, userData, classes, lessons, allDecks, quizzes }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [targetStudentMode, setTargetStudentMode] = useState('all'); 
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assignType, setAssignType] = useState<'deck' | 'lesson' | 'quiz'>('lesson');
  const [viewTab, setViewTab] = useState<'content' | 'forum'>('content');
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

  const createClass = async (e: any) => { e.preventDefault(); if (!newClassName.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { name: newClassName, code: Math.random().toString(36).substring(2, 8).toUpperCase(), students: [], studentEmails: [], assignments: [], created: Date.now() }); setNewClassName(''); setToastMsg("Class Created Successfully"); } catch (error) { console.error("Create class failed:", error); alert("Failed to create class."); } };
  const handleDeleteClass = async (id: string) => { if (window.confirm("Delete this class?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id)); if (selectedClassId === id) setSelectedClassId(null); } catch (error) { console.error("Delete class failed:", error); alert("Failed to delete class."); } } };
  
  const toggleAssignee = (email: string) => { if (selectedAssignees.includes(email)) { setSelectedAssignees(selectedAssignees.filter(e => e !== email)); } else { setSelectedAssignees([...selectedAssignees, email]); } };
  const assignContent = async (item: any, type: string) => { 
      if (!selectedClass) return; 
      try { 
          const assignment = JSON.parse(JSON.stringify({ 
              ...item, 
              id: `assign_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, 
              originalId: item.id, 
              contentType: type, 
              targetStudents: targetStudentMode === 'specific' ? selectedAssignees : null 
          })); 
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { assignments: arrayUnion(assignment) }); 
          setAssignModalOpen(false); setTargetStudentMode('all'); setSelectedAssignees([]); setToastMsg(`Assigned: ${item.title}`); 
      } catch (error) { console.error("Assign failed:", error); alert("Failed to assign."); } 
  };

  const addStudentToClass = async (email: string) => {
      if (!selectedClass || !email) return;
      const normalizedEmail = email.toLowerCase().trim();
      if (selectedClass.studentEmails?.includes(normalizedEmail)) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { students: arrayUnion(normalizedEmail), studentEmails: arrayUnion(normalizedEmail) });
          setToastMsg(`Added ${normalizedEmail}`);
      } catch (error) { console.error("Add student failed:", error); alert("Failed to add student."); }
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
                {viewTab === 'content' && (
                    <>
                    <button onClick={() => { setAssignType('lesson'); setAssignModalOpen(true); }} className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm uppercase"><BookOpen size={14}/> Lesson</button>
                    <button onClick={() => { setAssignType('deck'); setAssignModalOpen(true); }} className="bg-orange-500 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm uppercase"><Layers size={14}/> Deck</button>
                    <button onClick={() => { setAssignType('quiz'); setAssignModalOpen(true); }} className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm uppercase"><Trophy size={14}/> Quiz</button>
                    </>
                )}
                <button onClick={() => setViewTab(viewTab === 'content' ? 'forum' : 'content')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${viewTab === 'forum' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>
                    {viewTab === 'content' ? 'Forum' : 'Manage'}
                </button>
            </div>
          </div>
        </div>

        {viewTab === 'content' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3>
                    {(!selectedClass.assignments || selectedClass.assignments.length === 0) && <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">No content assigned yet.</div>}
                    {selectedClass.assignments?.map((l: any, idx: number) => ( 
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'quiz' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {l.contentType === 'deck' ? <Layers size={18} /> : l.contentType === 'quiz' ? <Trophy size={18} /> : <FileText size={18} />}
                                </div>
                                <div><h4 className="font-bold text-slate-800">{l.title}</h4></div>
                            </div>
                        </div> 
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Roster</h3><button onClick={() => setIsStudentListOpen(true)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><UserPlus size={14}/> Add Students</button></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">{(!selectedClass.students || selectedClass.students.length === 0) && <div className="p-4 text-center text-slate-400 text-sm italic">No students joined yet.</div>}{selectedClass.students?.map((s: string, i: number) => (<div key={i} className="p-3 border-b border-slate-50 last:border-0 flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{s.charAt(0)}</div><span className="text-sm font-medium text-slate-700">{s}</span></div>))}</div>
                </div>
            </div>
        ) : (
            <div className="h-full pb-20"><ClassForum classId={selectedClass.id} user={user} userData={{...userData, role: 'instructor'}} /></div>
        )}

        {isStudentListOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-lg">Select Students</h3><button onClick={() => setIsStudentListOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                    <div className="p-4 border-b border-slate-100"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus /></div></div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {availableStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((student, idx) => { 
                                const isAdded = selectedClass.students?.includes(student.email); 
                                return ( 
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{student.name.charAt(0)}</div><div><p className="text-sm font-bold text-slate-800">{student.name}</p></div></div>
                                        <button onClick={() => addStudentToClass(student.email)} disabled={isAdded} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isAdded ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isAdded ? 'Joined' : 'Add'}</button>
                                    </div> 
                                ) 
                            })}
                    </div>
                </div>
            </div>
        )}

        {assignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Assign {assignType === 'deck' ? 'Deck' : assignType === 'quiz' ? 'Quiz' : 'Lesson'}</h3><button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {assignType === 'deck' && Object.entries(allDecks).map(([key, deck]: any) => (
                      <button key={key} onClick={() => assignContent({ ...deck, id: key }, 'deck')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 mb-2 group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{deck.title}</h4></div><PlusCircle size={18} className="text-slate-300 group-hover:text-orange-500"/></button>
                  ))}
                  {assignType === 'lesson' && lessons.map((l: any) => (
                      <button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 mb-2 group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4></div><PlusCircle size={18} className="text-slate-300 group-hover:text-indigo-500"/></button>
                  ))}
                  {assignType === 'quiz' && quizzes.map((q: any) => (
                      <button key={q.id} onClick={() => assignContent(q, 'quiz')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 mb-2 group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{q.title}</h4><p className="text-xs text-slate-500">{q.questions.length} Questions</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-emerald-500"/></button>
                  ))}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{classes.map((cls: any) => (<div key={cls.id} onClick={() => setSelectedClassId(cls.id)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"><div className="absolute top-4 right-4 flex gap-2"><button onClick={(e) => {e.stopPropagation(); handleDeleteClass(cls.id);}} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div><div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-bold text-lg">{cls.name.charAt(0)}</div><h3 className="font-bold text-lg text-slate-900">{cls.name}</h3><p className="text-sm text-slate-500 mb-4">{(cls.students || []).length} Students</p><div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg"><span className="text-xs font-mono font-bold text-slate-600 tracking-wider">{cls.code}</span><button className="text-indigo-600 text-xs font-bold flex items-center gap-1" onClick={(e) => {e.stopPropagation(); navigator.clipboard.writeText(cls.code);}}><Copy size={12}/> Copy</button></div></div>))}</div>
    </div>
  );
}

function InstructorDashboard({ user, userData, allDecks, lessons, quizzes, onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onSaveQuiz, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <div className="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800"><h1 className="text-xl font-bold flex items-center gap-2">
        <GraduationCap className="text-indigo-400"/> Instructor 
    </h1><p className="text-xs text-slate-400 mt-1">{user.email}</p></div>
        <div className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} /> Overview</button>
            <button onClick={() => setActiveTab('classes')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'classes' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><School size={20} /> Classes & Roster</button>
            <button onClick={() => setActiveTab('content')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'content' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Library size={20} /> Content Library</button>
            <button onClick={() => setActiveTab('profile')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><User size={20} /> Profile & Settings</button>
        </div>
        <div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="w-full p-3 rounded-xl bg-slate-800 text-rose-400 flex items-center gap-3 hover:bg-slate-700 transition-colors"><LogOut size={20} /> Sign Out</button></div>
      </div>
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
                                    <div><span className="text-4xl font-bold block">{userData.classes?.length || 0}</span><span className="text-xs uppercase tracking-wider opacity-70">Classes</span></div>
                                    <div><span className="text-4xl font-bold block">{allDecks.custom?.cards?.length || 0}</span><span className="text-xs uppercase tracking-wider opacity-70">Cards</span></div>
                                    <div><span className="text-4xl font-bold block">{quizzes.length}</span><span className="text-xs uppercase tracking-wider opacity-70">Quizzes</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="h-[500px] md:h-auto">
                            <LiveActivityFeed />
                        </div>
                    </div>
                )}
                {activeTab === 'classes' && (<ClassManagerView user={user} userData={userData} classes={userData?.classes || []} lessons={lessons} quizzes={quizzes} allDecks={allDecks} />)}
                {activeTab === 'content' && (<div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col"><div className="flex-1 overflow-y-auto"><BuilderHub onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} onSaveLesson={onSaveLesson} onSaveQuiz={onSaveQuiz} allDecks={allDecks} /></div></div>)}
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
  const [customQuizzes, setCustomQuizzes] = useState<any[]>([]); // New Quiz State
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [classLessons, setClassLessons] = useState<any[]>([]);
  
  // Navigation State
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeQuiz, setActiveQuiz] = useState<any>(null); // New Quiz Navigation
  const [selectedDeckKey, setSelectedDeckKey] = useState('salutationes');
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);

  // --- MEMOS ---
  const allDecks = useMemo(() => {
    const decks: any = { ...systemDecks, custom: { title: "✍️ Scriptorium", cards: [] } };
    customCards.forEach(card => {
        const target = card.deckId || 'custom';
        if (!decks[target]) { decks[target] = { title: card.deckTitle || "Custom Deck", cards: [] }; }
        if (!decks[target].cards) decks[target].cards = [];
        decks[target].cards.push(card);
    });
    classLessons.forEach((assignment: any) => {
        if (assignment.contentType === 'deck') {
            decks[assignment.id] = { title: `(Class) ${assignment.title}`, cards: assignment.cards || [], isAssignment: true };
        }
    });
    return decks;
  }, [systemDecks, customCards, classLessons]);

  const lessons = useMemo(() => [...systemLessons, ...customLessons, ...classLessons.filter(l => l.contentType === 'lesson')], [systemLessons, customLessons, classLessons]);
  const libraryLessons = useMemo(() => [...systemLessons, ...customLessons], [systemLessons, customLessons]);

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
    const unsubQuizzes = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_quizzes'), (snap) => setCustomQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
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
    
    return () => { unsubProfile(); unsubCards(); unsubLessons(); unsubClasses(); unsubQuizzes(); };
  }, [user, userData?.role]);

  // --- ACTIONS ---
  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card. Check permissions."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Are you sure you want to delete this card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); alert("Failed to delete card."); } }, [user]);
  const handleCreateLesson = useCallback(async (l: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), l); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), l); } setActiveTab('home'); }, [user]);
  
  // NEW: Create Quiz
  const handleCreateQuiz = useCallback(async (q: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_quizzes', id), q); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_quizzes'), q); } }, [user]);

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
  
  const commonHandlers = { onSaveCard: handleCreateCard, onUpdateCard: handleUpdateCard, onDeleteCard: handleDeleteCard, onSaveLesson: handleCreateLesson, onSaveQuiz: handleCreateQuiz };

  const renderStudentView = () => {
    if (activeQuiz) return <StudentQuizView quiz={activeQuiz} onFinish={(id: string, xp: number, title: string, detail: any) => { handleFinishLesson(id, xp, title, detail); setActiveQuiz(null); }} />;
    if (activeLesson) return <LessonView lesson={activeLesson} onFinish={(id: string, xp: number, title: string) => { handleFinishLesson(id, xp, title); setActiveLesson(null); }} />;
    
    if (activeTab === 'home' && activeStudentClass) {
        return <StudentClassView 
            classData={activeStudentClass} 
            onBack={() => setActiveStudentClass(null)} 
            onSelectLesson={setActiveLesson} 
            onSelectDeck={(d: any) => { setSelectedDeckKey(d.id); setActiveTab('flashcards'); setActiveStudentClass(null); }}
            onSelectQuiz={setActiveQuiz}
            userData={userData} 
        />;
    }
    
    switch (activeTab) {
      case 'home': return <HomeView setActiveTab={setActiveTab} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={setActiveLesson} onSelectDeck={(d: any) => { setSelectedDeckKey(d.id); setActiveTab('flashcards'); }} userData={userData} />;
      case 'flashcards': 
          const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck');
          const deckToLoad = assignedDeck || allDecks[selectedDeckKey];
          return <FlashcardView allDecks={allDecks} selectedDeckKey={selectedDeckKey} onSelectDeck={setSelectedDeckKey} onSaveCard={handleCreateCard} activeDeckOverride={deckToLoad} onComplete={handleFinishLesson} />;
      case 'create': return <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={handleCreateLesson} onSaveQuiz={handleCreateQuiz} allDecks={allDecks} />;
      case 'profile': return <ProfileView user={user} userData={userData} />;
      default: return <HomeView />;
    }
  };

  // --- FINAL RENDER ---
  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans text-slate-900 flex justify-center items-center relative overflow-hidden">
      <style>{`html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #f8fafc; } *::-webkit-scrollbar { display: none; } * { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
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
                quizzes={customQuizzes}
                {...commonHandlers} 
                onLogout={() => signOut(auth)} 
             />
        ) : (
             <>
                {renderStudentView()}
                <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
             </>
        )}
      </div>
    </div>
  );
}

export default App;
