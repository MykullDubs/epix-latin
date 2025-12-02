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

function EmailSimulatorView({ module, onFinish }: any) {
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fillState, setFillState] = useState<any>({});
  const [fixedTargets, setFixedTargets] = useState<string[]>([]);

  const email = module.scenarios[currentEmailIndex];
  const isLast = currentEmailIndex === module.scenarios.length - 1;
  const progress = (completedIds.length / module.scenarios.length) * 100;

  const handleNext = () => {
    setFeedback(null);
    setFixedTargets([]);
    setFillState({});
    if (currentEmailIndex < module.scenarios.length - 1) {
      setCurrentEmailIndex(prev => prev + 1);
    } else {
      onFinish(module.id, module.xp, module.title);
    }
  };

  const markComplete = () => {
    if (!completedIds.includes(email.id)) {
      setCompletedIds([...completedIds, email.id]);
    }
  };

  const handleToneClick = (phrase: string) => {
    if (email.targets.includes(phrase)) {
      if (!fixedTargets.includes(phrase)) {
        const newFixed = [...fixedTargets, phrase];
        setFixedTargets(newFixed);
        if (newFixed.length === email.targets.length) {
            setFeedback("Great job! You softened the tone.");
            markComplete();
        }
      }
    }
  };

  const handleSort = (isCorrect: boolean) => {
    if (isCorrect) {
      setFeedback("Correct! You identified the tone.");
      markComplete();
    } else {
      setFeedback("Try again. Look at the vocabulary used.");
    }
  };

  const handleFill = (index: number, value: string) => {
    const newState = { ...fillState, [index]: value };
    setFillState(newState);
    const allCorrect = email.blanks.every((b: any) => newState[b.index] === b.correct);
    if (allCorrect) {
      setFeedback("Perfect! The email is professional and complete.");
      markComplete();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg"><UploadCloud size={20} /></div>
            <div>
                <h1 className="font-bold text-lg">MailFlow</h1>
                <p className="text-[10px] text-slate-400">Inbox: {module.scenarios.length - completedIds.length} Unread</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-500" style={{width: `${progress}%`}} /></div>
            <button onClick={() => onFinish(module.id, 0, module.title)} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-4 space-y-2">
            <button className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm"><span className="w-2 h-2 rounded-full bg-indigo-600"/> Inbox</button>
            <button className="flex items-center gap-3 p-3 text-slate-500 font-bold text-sm hover:bg-slate-50"><span className="w-2 h-2 rounded-full bg-transparent"/> Sent</button>
            <button className="flex items-center gap-3 p-3 text-slate-500 font-bold text-sm hover:bg-slate-50"><span className="w-2 h-2 rounded-full bg-transparent"/> Drafts</button>
        </div>
        <div className="flex-1 flex flex-col md:p-6 p-2 overflow-y-auto">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-4"><h2 className="text-xl font-bold text-slate-900">{email.subject}</h2><span className="text-xs font-mono text-slate-400">Today, 10:42 AM</span></div>
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">{email.avatar}</div><div><p className="text-sm font-bold text-slate-800">{email.sender}</p><p className="text-xs text-slate-500">To: You</p></div></div>
              </div>
              <div className="p-8 min-h-[300px] text-slate-700 leading-relaxed relative">
                  <div className="absolute top-2 right-2"><div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse"><Info size={12} /> {email.instruction}</div></div>
                  {email.type === 'fix_tone' && (
                      <div className="text-lg font-serif">
                          {email.content.split(' ').map((word: string, i: number) => {
                              const isTarget = email.targets.some((t: string) => t.includes(word.replace(/[^a-zA-Z]/g, '')));
                              const fullPhrase = email.targets.find((t: string) => t.includes(word.replace(/[^a-zA-Z]/g, '')));
                              const isFixed = fullPhrase && fixedTargets.includes(fullPhrase);
                              if (isTarget && !isFixed) return <span key={i} onClick={() => handleToneClick(fullPhrase)} className="bg-rose-100 text-rose-700 cursor-pointer hover:bg-rose-200 px-1 rounded mx-0.5 border-b-2 border-rose-300">{word}</span>
                              if (isFixed) return <span key={i} className="text-emerald-600 font-bold mx-0.5 transition-all">{word}</span>
                              return <span key={i} className="mx-0.5">{word}</span>
                          })}
                          {fixedTargets.length === email.targets.length && (<div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 animate-in fade-in"><span className="font-bold block mb-1">Better Version:</span>"{email.correctContent}"</div>)}
                      </div>
                  )}
                  {email.type === 'sort' && (
                      <div className="space-y-6">
                          <p className="font-serif text-lg bg-slate-50 p-6 rounded-xl border border-slate-100 italic">"{email.content}"</p>
                          <div className="flex gap-4 justify-center">
                              {email.options.map((opt: any) => (
                                  <button key={opt.id} onClick={() => handleSort(opt.correct)} disabled={!!feedback} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 min-w-[120px]">
                                      {opt.id === 'formal' ? <Briefcase size={24}/> : <Coffee size={24}/>}
                                      {opt.label}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
                  {email.type === 'reply_fill' && (
                       <div className="space-y-6">
                            <p className="font-serif text-lg text-slate-400 mb-6 pb-6 border-b border-slate-100">"{email.content}"</p>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-serif relative">
                                <div className="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">Draft</div>
                                {email.template.split(/\[(\d)\]/).map((part: string, i: number) => {
                                    if (part.match(/^\d$/)) {
                                        const blankIndex = parseInt(part);
                                        const blankData = email.blanks.find((b: any) => b.index === blankIndex);
                                        const userVal = fillState[blankIndex];
                                        return (
                                            <select key={i} value={userVal || ""} onChange={(e) => handleFill(blankIndex, e.target.value)} disabled={!!feedback} className={`mx-1 p-1 rounded border-b-2 font-sans font-bold text-sm focus:outline-none ${userVal === blankData.correct ? 'text-emerald-600 border-emerald-500 bg-emerald-50' : 'text-indigo-600 border-indigo-300 bg-white'}`}>
                                                <option value="" disabled>___</option>
                                                {blankData.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        );
                                    }
                                    return <span key={i}>{part}</span>
                                })}
                            </div>
                       </div>
                  )}
              </div>
              <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center min-h-[88px]">
                  <div className="flex-1">
                      {feedback && (<div className={`flex items-center gap-2 font-bold ${feedback.includes("Try again") ? 'text-rose-600' : 'text-emerald-600'} animate-in slide-in-from-left-4`}>{feedback.includes("Try again") ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}{feedback}</div>)}
                  </div>
                  {completedIds.includes(email.id) && (<button onClick={handleNext} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">{isLast ? "Finish Inbox" : "Next Email"} <ArrowRight size={18}/></button>)}
              </div>
           </div>
        </div>
      </div>
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

function StudentClassView({ classData, onBack, onSelectLesson, onSelectDeck, userData }: any) {
  const [viewMode, setViewMode] = useState<'assignments' | 'forum'>('assignments');
  const completedSet = new Set(userData?.completedAssignments || []);
  const handleAssignmentClick = (assignment: any) => { if (assignment.contentType === 'deck') { onSelectDeck(assignment); } else { onSelectLesson(assignment); } };
  const relevantAssignments = (classData.assignments || []).filter((l: any) => { const isForMe = !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); return isForMe; });
  const pendingCount = relevantAssignments.filter((l: any) => !completedSet.has(l.id)).length;
  const completedCount = relevantAssignments.length - pendingCount;
  const progressPercent = relevantAssignments.length > 0 ? (completedCount / relevantAssignments.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* --- JUICY CORNFLOWER HEADER --- */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 pb-20 pt-12 px-6 rounded-b-[3rem] shadow-2xl z-10 shrink-0">
          {/* Background Decor */}
          <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[80px] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-300/20 rounded-full blur-[60px] mix-blend-overlay pointer-events-none"></div>
          
          {/* Top Bar */}
          <div className="relative z-20 flex justify-between items-start mb-6">
              <button 
                onClick={onBack} 
                className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10"
              >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Back
              </button>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-blue-200 tracking-widest mb-1">Class Code</span>
                  <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white font-mono font-bold px-3 py-1 rounded-lg shadow-sm">
                      {classData.code}
                  </div>
              </div>
          </div>

          {/* Class Title & Tabs */}
          <div className="relative z-20 text-center">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 drop-shadow-md">{classData.name}</h1>
              
              {/* GLASS TOGGLE SWITCH */}
              <div className="inline-flex bg-black/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner">
                  <button 
                    onClick={() => setViewMode('assignments')} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'assignments' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                      <BookOpen size={18} className={viewMode === 'assignments' ? 'fill-current' : ''}/> Assignments
                  </button>
                  <button 
                    onClick={() => setViewMode('forum')} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'forum' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                      <MessageSquare size={18} className={viewMode === 'forum' ? 'fill-current' : ''}/> Forum
                  </button>
              </div>
          </div>
      </div>
      
      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto pb-24 -mt-10 relative z-20 custom-scrollbar">
        
        {viewMode === 'assignments' ? (
            <div className="px-6 space-y-6">
                
                {/* FLOATING PROGRESS CARD */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                    
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Your Progress</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-800">{Math.round(progressPercent)}%</span>
                            <span className="text-sm font-bold text-indigo-600">Complete</span>
                        </div>
                        <div className="mt-3 flex gap-1">
                            <div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${progressPercent > 0 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{width: '100%'}}></div>
                            </div>
                            <div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${progressPercent > 33 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{width: '100%'}}></div>
                            </div>
                            <div className="h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${progressPercent > 66 ? 'bg-emerald-400' : 'bg-transparent'}`} style={{width: '100%'}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-right relative z-10">
                        <div className="bg-indigo-50 p-3 rounded-2xl inline-flex flex-col items-center min-w-[80px] border border-indigo-100 group-hover:border-indigo-200 transition-colors">
                            <span className="text-2xl font-bold text-indigo-600">{pendingCount}</span>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase">To Do</span>
                        </div>
                    </div>
                </div>

                {/* ASSIGNMENTS LIST */}
                <div>
                    <h3 className="font-bold text-blue-900/70 text-sm uppercase tracking-wider mb-4 ml-1 flex items-center gap-2">
                        <Layers size={16} className="text-blue-500"/> Tasks ({relevantAssignments.length})
                    </h3>
                    <div className="space-y-3">
                        {relevantAssignments.length > 0 ? ( relevantAssignments.filter((l: any) => !completedSet.has(l.id)).map((l: any, i: number) => ( 
                            <button key={`${l.id}-${i}`} onClick={() => handleAssignmentClick(l)} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-blue-300 hover:shadow-lg group relative overflow-hidden">
                                {/* Subtle Hover Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${l.contentType === 'deck' ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white' : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white'}`}>
                                        {l.contentType === 'deck' ? <Layers size={22}/> : <PlayCircle size={22} />}
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{l.title}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {l.contentType === 'deck' ? 'Deck' : 'Lesson'}
                                            </span>
                                            {l.xp && <span className="text-[10px] font-bold text-emerald-600">+{l.xp} XP</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm relative z-10">
                                    <ChevronRight size={16} />
                                </div>
                            </button> 
                        )) ) : ( <div className="p-10 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">No pending assignments.</div> )}
                        
                        {relevantAssignments.every((l: any) => completedSet.has(l.id)) && relevantAssignments.length > 0 && (
                            <div className="p-8 text-center bg-emerald-50 border border-emerald-100 rounded-3xl animate-in zoom-in duration-300">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle2 size={24}/>
                                </div>
                                <p className="text-emerald-800 font-bold">All assignments completed!</p>
                                <p className="text-emerald-600/70 text-xs">Great work, legend.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="px-6 h-full pb-20">
                {/* Forum needs a container to ensure it scrolls correctly within this layout */}
                <div className="bg-white rounded-t-3xl shadow-xl border-x border-t border-slate-200 min-h-full p-2">
                    <ClassForum classId={classData.id} user={{email: userData.email}} userData={userData} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

function HomeView({ setActiveTab, lessons, onSelectLesson, userData, assignments, classes, onSelectClass, onSelectDeck }: any) {
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  
  // --- NEW STATE: Controls the Accordion ---
  const [libraryExpanded, setLibraryExpanded] = useState(false);

  const completedSet = new Set(userData?.completedAssignments || []);
  const relevantAssignments = (assignments || []).filter((l: any) => { return !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); });
  const activeAssignments = relevantAssignments.filter((l: any) => !completedSet.has(l.id));
  const handleSelectClass = (cls: any) => { setActiveStudentClass(cls); };
  
  // Calculate Level Data
  const { level, progress, rank } = getLevelInfo(userData?.xp || 0);

  // --- LOGIC: Slice the lessons based on state ---
  const visibleLessons = libraryExpanded ? lessons : lessons.slice(0, 2);

  if (activeStudentClass) { return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={onSelectLesson} onSelectDeck={onSelectDeck} userData={userData} />; }

  return (
  <div className="pb-24 animate-in fade-in duration-500 overflow-y-auto h-full relative bg-slate-50 overflow-x-hidden">
    {/* --- LEVEL UP MODAL --- */}
    {showLevelModal && <LevelUpModal userData={userData} onClose={() => setShowLevelModal(false)} />}

    {userData?.classSyncError && (<div className="bg-rose-500 text-white p-4 text-center text-sm font-bold relative z-50"><AlertTriangle className="inline-block mr-2" size={16} />System Notice: Database Index Missing.</div>)}
    
    {/* --- HERO WIDGET --- */}
    <button onClick={() => setShowLevelModal(true)} className="w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 text-white shadow-xl z-10 group text-left rounded-b-[2.5rem] pb-8 pt-10 px-6 transition-all active:scale-[0.99]">
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[80px] mix-blend-overlay pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-300/20 rounded-full blur-[60px] mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-[-10%] right-[-10%] opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:rotate-12 group-hover:scale-110"><User size={280} strokeWidth={1.5} /></div>
       
        <div className="relative z-20 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] group-hover:ring-4 ring-white/20 transition-all overflow-hidden">
                        {userData?.photoURL ? (<img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />) : (<span className="font-serif font-bold text-2xl text-white drop-shadow-md">{userData?.name?.charAt(0) || 'S'}</span>)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-4 border-blue-600 rounded-full shadow-sm"></div>
                </div>
                <div>
                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-90 drop-shadow-sm">Welcome back,</p>
                    <h1 className="text-3xl font-serif font-bold leading-none tracking-tight drop-shadow-lg filter">{userData?.name || 'Student'}</h1>
                    <div className="flex items-center gap-2 mt-1.5"><span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border border-white/20 shadow-sm">{rank}</span></div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/30 flex items-center justify-between mt-2 group-hover:bg-white/20 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                <div className="flex-1 border-r border-white/20 pr-4">
                     <div className="flex justify-between items-end mb-1"><span className="text-[10px] font-bold text-white tracking-wide">Level {level}</span><span className="text-[9px] font-bold text-blue-100">{Math.round(progress)}%</span></div>
                     <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-white/10"><div className="bg-gradient-to-r from-yellow-300 to-amber-400 h-full rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] relative overflow-hidden" style={{ width: `${progress}%` }}><div className="absolute inset-0 bg-white/40 w-full animate-[shimmer_2s_infinite]"></div></div></div>
                </div>
                <div className="pl-5 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 text-yellow-300 filter drop-shadow-sm"><Zap size={20} fill="currentColor" /><span className="text-xl font-bold leading-none text-white">{userData?.streak || 1}</span></div>
                    <span className="text-[8px] text-blue-100 uppercase font-bold tracking-wider mt-0.5">Day Streak</span>
                </div>
            </div>
        </div>
    </button>
    
    {/* --- MAIN CONTENT --- */}
    <div className="px-6 space-y-6 mt-4 relative z-20">
      
      {/* --- MY CLASSES --- */}
      {classes && classes.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <h3 className="text-sm font-bold text-blue-900/70 uppercase tracking-wider mb-4 ml-1 flex items-center gap-2"><School size={16} className="text-blue-500"/> My Classes</h3>
            <div className="flex gap-4 overflow-x-auto pb-5 custom-scrollbar snap-x">
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
                        <button key={cls.id} onClick={() => handleSelectClass(cls)} className="snap-start min-w-[280px] bg-white p-5 rounded-3xl border border-blue-100 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden flex flex-col justify-between h-[180px]">
                            <div className="absolute top-[-40%] right-[-40%] w-40 h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors"></div>
                            <div className="relative z-10 w-full">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform duration-300">{cls.name.charAt(0)}</div>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">{cls.code}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg truncate pr-2 group-hover:text-indigo-600 transition-colors">{cls.name}</h4>
                                <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs font-medium"><Users size={12} className="text-blue-400" /><span>{studentCount} Students</span></div>
                            </div>
                            <div className="relative z-10 w-full mt-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-end mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span><span className="text-[10px] font-bold text-indigo-600">{completedTasks}/{totalTasks} Tasks</span></div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${classProgress === 100 ? 'bg-emerald-400' : 'bg-blue-500'}`} style={{width: `${classProgress}%`}}></div></div>
                                {myPending > 0 && (<div className="absolute right-0 -top-8 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">{myPending} Due</div>)}
                            </div>
                        </button> 
                    ); 
                })}
            </div>
        </div>
      )}
      
      {/* PENDING ASSIGNMENTS */}
      {activeAssignments.length > 0 && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
             <h3 className="text-sm font-bold text-blue-900/70 uppercase tracking-wider mb-3 ml-1">Pending Assignments</h3>
             <div className="space-y-3">
                {activeAssignments.map((l: any, i: number) => ( 
                    <button key={`${l.id}-${i}`} onClick={() => l.contentType === 'deck' ? onSelectDeck(l) : onSelectLesson(l)} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-blue-300 hover:shadow-md group">
                        <div className="flex items-center space-x-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white'}`}>{l.contentType === 'deck' ? <Layers size={22}/> : <PlayCircle size={22} />}</div>
                            <div className="text-left"><h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{l.title}</h4><p className="text-xs text-slate-500">{l.contentType === 'deck' ? 'Flashcard Deck' : 'Assigned Lesson'}</p></div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><ChevronRight size={16} /></div>
                    </button>
                ))}
             </div>
          </div>
      )}
      
      {/* --- LIBRARY STACK (With Accordion) --- */}
      <div className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
         <h3 className="text-sm font-bold text-blue-900/70 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500"/> Library
         </h3>
         
         <div className="space-y-3">
            {/* Map over visibleLessons instead of all lessons */}
            {visibleLessons.map((l: any, idx: number) => (
                <button 
                    key={l.id} 
                    onClick={() => onSelectLesson(l)} 
                    // Add staggered animation delay based on index so they cascade in nicely
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 group transition-all hover:shadow-md animate-in slide-in-from-bottom-2 fade-in fill-mode-forwards"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><BookOpen size={22}/></div>
                        <div className="text-left"><h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                </button>
            ))}
         </div>

         {/* --- ACCORDION TOGGLE --- */}
         {lessons.length > 2 && (
             <button 
                onClick={() => setLibraryExpanded(!libraryExpanded)}
                className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
             >
                {libraryExpanded ? (
                    <>Show Less <ChevronUp size={14}/></>
                ) : (
                    <>View All ({lessons.length}) <ChevronDown size={14}/></>
                )}
             </button>
         )}
      </div>
      
      {/* QUICK ACTIONS */}
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
// --- EXAM FEATURE COMPONENTS ---

function TestBuilderView({ onSave, onCancel, initialData }: any) {
  const [testData, setTestData] = useState(initialData || { title: '', description: '', type: 'test', xp: 100, questions: [] });
  const addQuestion = (type: 'mcq' | 'tf') => {
    setTestData({ ...testData, questions: [...testData.questions, { id: Date.now().toString(), type, prompt: '', options: type === 'mcq' ? [{id: 'o1', text: ''}, {id: 'o2', text: ''}] : [], correctAnswer: type === 'tf' ? 'true' : '' }] });
  };
  const updateQuestion = (idx: number, field: string, val: any) => { const qs = [...testData.questions]; qs[idx] = { ...qs[idx], [field]: val }; setTestData({ ...testData, questions: qs }); };
  const updateOption = (qIdx: number, oIdx: number, val: string) => { const qs = [...testData.questions]; qs[qIdx].options[oIdx].text = val; setTestData({ ...testData, questions: qs }); };
  const addOption = (qIdx: number) => { const qs = [...testData.questions]; qs[qIdx].options.push({ id: `o${Date.now()}`, text: '' }); setTestData({ ...testData, questions: qs }); };
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
                <div className="mb-3"><span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-1 rounded-lg">Q{idx+1}</span></div>
                <input className="w-full font-bold border-b border-slate-100 pb-2 mb-4 focus:outline-none" placeholder="Question Prompt" value={q.prompt} onChange={e => updateQuestion(idx, 'prompt', e.target.value)}/>
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
                {q.type === 'tf' && (
                    <div className="flex gap-4 pl-4">
                        {['true', 'false'].map(val => ( <button key={val} onClick={() => updateQuestion(idx, 'correctAnswer', val)} className={`px-6 py-2 rounded-xl font-bold border-2 ${q.correctAnswer === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400'}`}>{val === 'true' ? 'True' : 'False'}</button> )) }
                    </div>
                )}
            </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex flex-col gap-2 z-50">
          <div className="flex gap-2 justify-center pb-2">
              <button onClick={() => addQuestion('mcq')} className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600 hover:text-indigo-600">+ Multiple Choice</button>
              <button onClick={() => addQuestion('tf')} className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600 hover:text-indigo-600">+ True/False</button>
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
  const questions = test.questions || [];
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + (isSubmitted ? 1 : 0)) / questions.length) * 100;

  const handleSelect = (val: string) => { if(isSubmitted) return; setAnswers({ ...answers, [currentIndex]: val }); };
  const handleSubmit = () => {
    let correct = 0; questions.forEach((q: any, idx: number) => { if(answers[idx] === q.correctAnswer) correct++; });
    setScore(correct); setIsSubmitted(true);
  };
  const finishExam = () => { const xp = Math.round((score / questions.length) * test.xp); onFinish(test.id, xp, test.title, { score, total: questions.length }); };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-20">
          <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-slate-800 truncate">{test.title}</h2><button onClick={() => onFinish(null, 0)}><X/></button></div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-32">
          {!isSubmitted ? (
              <div className="animate-in slide-in-from-right-8 duration-300" key={currentIndex}>
                  <div className="bg-indigo-50 inline-block px-3 py-1 rounded-lg text-indigo-700 font-bold text-xs mb-4 uppercase">Question {currentIndex + 1} of {questions.length}</div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-8">{currentQ.prompt}</h3>
                  <div className="space-y-3">
                      {currentQ.type === 'tf' ? ['true', 'false'].map(val => ( <button key={val} onClick={() => handleSelect(val)} className={`w-full p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all ${answers[currentIndex] === val ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white'}`}>{val === 'true' ? 'True' : 'False'}</button> )) : currentQ.options.map((opt: any) => ( <button key={opt.id} onClick={() => handleSelect(opt.id)} className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all ${answers[currentIndex] === opt.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white'}`}>{opt.text}</button> ))}
                  </div>
              </div>
          ) : (
              <div className="text-center py-10 animate-in zoom-in">
                  <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Trophy size={48} /></div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Exam Complete!</h2>
                  <div className="text-6xl font-black text-indigo-600 mb-10">{score}<span className="text-2xl text-slate-300">/{questions.length}</span></div>
                  <button onClick={finishExam} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg">Collect XP & Finish</button>
              </div>
          )}
      </div>
      {!isSubmitted && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-20 flex gap-4 max-w-md mx-auto">
              <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="px-6 py-3 rounded-xl font-bold text-slate-500 disabled:opacity-50">Prev</button>
              {currentIndex < questions.length - 1 ? ( <button onClick={() => setCurrentIndex(prev => prev + 1)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold">Next</button> ) : ( <button onClick={handleSubmit} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Submit Exam</button> )}
          </div>
      )}
    </div>
  );
}
function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks }: any) {
  const [lessonData, setLessonData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [] });
  const [mode, setMode] = useState('card'); 
  const [subView, setSubView] = useState('menu'); // menu | library | editor | import
  const [editingItem, setEditingItem] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState('');
  // UPDATED: Added 'test' to the state type
  const [importType, setImportType] = useState<'lesson' | 'deck' | 'test'>('lesson');
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
            } else if (importType === 'test') {
                 // --- NEW: TEST IMPORT LOGIC ---
                 const ref = doc(db, 'artifacts', appId, 'users', userId, 'custom_lessons', id);
                 
                 // Ensure questions have IDs so the player doesn't crash
                 const processedQuestions = (item.questions || []).map((q: any, idx: number) => ({
                     ...q,
                     id: q.id || `q_${Date.now()}_${idx}`,
                     options: q.options?.map((opt: any, oIdx: number) => ({
                         ...opt,
                         id: opt.id || `opt_${Date.now()}_${idx}_${oIdx}`
                     })) || []
                 }));

                 batch.set(ref, { 
                     ...item, 
                     type: 'test', // Force type to test
                     questions: processedQuestions,
                     xp: item.xp || 100,
                     created: Date.now()
                 });
                 count++;
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
           setLessonData({...item, vocab: Array.isArray(item.vocab) ? item.vocab.join(', ') : item.vocab});
      }
  };

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
                     {/* --- NEW EXAMS BUTTON --- */}
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
                    
                    {/* --- NEW EXAM TOGGLE BUTTON --- */}
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
            {/* --- RENDER TEST BUILDER --- */}
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

function ClassManagerView({ user, userData, classes, lessons, allDecks }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [targetStudentMode, setTargetStudentMode] = useState('all'); 
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  // UPDATED: Added 'test' to the allowed types
  const [assignType, setAssignType] = useState<'deck' | 'lesson' | 'test'>('lesson');
  const [viewTab, setViewTab] = useState<'content' | 'forum' | 'analytics'>('content');

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

  if (selectedClass) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 relative">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        <div className="pb-6 border-b border-slate-100 mb-6">
          <button onClick={() => setSelectedClassId(null)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Back to Classes</button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900">{selectedClass.name}</h1><p className="text-sm text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">Code: {selectedClass.code}</p></div>
            <div className="flex gap-2">
                <button onClick={() => setViewTab('content')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewTab === 'content' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500'}`}>Manage</button>
                <button onClick={() => setViewTab('analytics')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewTab === 'analytics' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500'}`}>Analytics</button>
                <button onClick={() => setViewTab('forum')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewTab === 'forum' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500'}`}>Forum</button>
                
                {viewTab === 'content' && (
                    <>
                    <button onClick={() => { setAssignType('lesson'); setAssignModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-wider"><BookOpen size={16}/> ASSIGN LESSON</button>
                    <button onClick={() => { setAssignType('deck'); setAssignModalOpen(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-orange-600 active:scale-95 transition-all uppercase tracking-wider"><Layers size={16}/> ASSIGN DECK</button>
                    {/* --- NEW BUTTON: ASSIGN EXAM --- */}
                    <button onClick={() => { setAssignType('test'); setAssignModalOpen(true); }} className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-rose-700 active:scale-95 transition-all uppercase tracking-wider"><FileQuestion size={16}/> ASSIGN EXAM</button>
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
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {/* Dynamic Icon Based on Content Type */}
                          <div className={`p-2 rounded-lg ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'test' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                              {l.contentType === 'deck' ? <Layers size={18} /> : l.contentType === 'test' ? <FileQuestion size={18}/> : <FileText size={18} />}
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
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">Active</span>
                      </div> 
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Roster</h3><button onClick={() => setIsStudentListOpen(true)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><UserPlus size={14}/> Add Students</button></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">{(!selectedClass.students || selectedClass.students.length === 0) && <div className="p-4 text-center text-slate-400 text-sm italic">No students joined yet.</div>}{selectedClass.students?.map((s: string, i: number) => (<div key={i} className="p-3 border-b border-slate-50 last:border-0 flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{s.charAt(0)}</div><span className="text-sm font-medium text-slate-700">{s}</span></div>))}</div>
                </div>
            </div>
        )}
        
        {viewTab === 'forum' && (
            <div className="h-full pb-20">
                <ClassForum classId={selectedClass.id} user={user} userData={{...userData, role: 'instructor'}} />
            </div>
        )}

        {viewTab === 'analytics' && (
            <div className="h-full pb-20">
                <ClassAnalytics classData={selectedClass} />
            </div>
        )}

        {isStudentListOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-lg">Select Students</h3><button onClick={() => setIsStudentListOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                    <div className="p-4 border-b border-slate-100"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus /></div></div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {availableStudents.length === 0 ? (<div className="text-center py-8 text-slate-400">Loading students...</div>) : (availableStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())).map((student, idx) => { const isAdded = selectedClass.students?.includes(student.email); return ( <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{student.name.charAt(0)}</div><div><p className="text-sm font-bold text-slate-800">{student.name}</p><p className="text-xs text-slate-500">{student.email}</p></div></div><button onClick={() => addStudentToClass(student.email)} disabled={isAdded} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isAdded ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isAdded ? 'Joined' : 'Add'}</button></div> ) }))}
                    </div>
                </div>
            </div>
        )}

        {assignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                      {/* Dynamic Header */}
                      <h3 className="font-bold text-lg">Assign {assignType === 'deck' ? 'Flashcard Deck' : assignType === 'test' ? 'Exam' : 'Lesson'}</h3>
                      <button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
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
                  
                  {/* UPDATED: Filter out 'test' type here so lessons aren't cluttered */}
                  {assignType === 'lesson' && (
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen size={14}/> Available Lessons</h4>
                          <div className="space-y-2">
                              {lessons.filter((l:any) => l.type !== 'test').length === 0 ? <p className="text-sm text-slate-400 italic">No lessons found.</p> : lessons.filter((l:any) => l.type !== 'test').map((l: any) => (
                                  <button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex justify-between items-center">
                                      <div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div>
                                      <PlusCircle size={18} className="text-slate-300 group-hover:text-indigo-500"/>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
                  
                  {/* --- NEW SECTION: EXAMS --- */}
                  {assignType === 'test' && (
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileQuestion size={14}/> Available Exams</h4>
                          <div className="space-y-2">
                              {lessons.filter((l:any) => l.type === 'test').length === 0 ? <p className="text-sm text-slate-400 italic">No exams found.</p> : lessons.filter((l:any) => l.type === 'test').map((l: any) => (
                                  <button key={l.id} onClick={() => assignContent(l, 'test')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group flex justify-between items-center">
                                      <div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{(l.questions || []).length} Questions • {l.xp} XP</p></div>
                                      <PlusCircle size={18} className="text-slate-300 group-hover:text-rose-500"/>
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
// 2. Replace InstructorDashboard
// Fixes: Passes 'userData' properly to ClassManagerView
function InstructorDashboard({ user, userData, allDecks, lessons, onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onLogout }: any) {
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
                {activeTab === 'classes' && (<ClassManagerView user={user} userData={userData} classes={userData?.classes || []} lessons={lessons} allDecks={allDecks} />)}
                {activeTab === 'content' && (<div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col"><div className="flex-1 overflow-y-auto"><BuilderHub onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} onSaveLesson={onSaveLesson} allDecks={allDecks} /></div></div>)}
                {activeTab === 'profile' && <ProfileView user={user} userData={userData} />}
            </div>
         </div>
      </div>
    </div>
  );
}

// ============================================================================
// PASTE THIS AT THE VERY BOTTOM OF YOUR FILE
// (Replace your existing RoleToggle and function App)
// ============================================================================

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
    // 1. Check for Exam/Test
    if (activeLesson && activeLesson.type === 'test') {
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
                <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
             </>
        )}

      </div>
    </div>
  );
}

export default App;
