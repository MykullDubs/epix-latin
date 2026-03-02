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

// --- HELPER COMPONENTS ---
function Toast({ message, onClose }: any) {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-white/10"><Check size={16} className="text-emerald-400" /> <span className="text-sm font-medium tracking-wide">{message}</span></div>);
}



// ============================================================================
//  JUICY TOAST NOTIFICATION (Now supports types!)
// ============================================================================
function JuicyToast({ message, type = 'success', onClose }: { message: string, type?: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Style Config
  const styles: any = {
    success: { 
        bg: 'bg-slate-900/90', 
        iconBg: 'bg-emerald-500', 
        icon: <Check size={12} strokeWidth={4} className="text-slate-900" /> 
    },
    error: { 
        bg: 'bg-rose-900/90', 
        iconBg: 'bg-white', 
        icon: <X size={12} strokeWidth={4} className="text-rose-900" /> 
    },
    info: { 
        bg: 'bg-indigo-900/90', 
        iconBg: 'bg-white', 
        icon: <Info size={12} strokeWidth={4} className="text-indigo-900" /> 
    }
  };

  const s = styles[type] || styles.success;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`${s.bg} backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10`}>
        <div className={`${s.iconBg} rounded-full p-1`}>
          {s.icon}
        </div>
        <span className="font-bold text-sm">{message}</span>
      </div>
    </div>
  );
}
function BroadcastModal({ classes, user, onClose, onToast }: any) {
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const handleSend = async () => { if (!message.trim() || !selectedClassId) return; setSending(true); try { const targetClass = classes.find((c: any) => c.id === selectedClassId); await addDoc(collection(db, 'artifacts', appId, 'announcements'), { classId: selectedClassId, className: targetClass?.name || 'Class', instructorName: user.email.split('@')[0], content: message, timestamp: Date.now(), readBy: [] }); onToast("Broadcast sent to students!", "success"); onClose(); } catch (e) { console.error(e); onToast("Failed to send message.", "error"); } finally { setSending(false); } };
    return ( <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><XCircle size={24}/></button><div className="flex items-center gap-3 mb-6"><div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-xl shadow-lg shadow-rose-200"><Megaphone size={24}/></div><div><h2 className="text-xl font-bold text-slate-900">Broadcast</h2><p className="text-xs text-slate-500">Send a push alert to students</p></div></div><div className="space-y-4"><div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Target Class</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Message</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-rose-500 resize-none" placeholder="e.g. Don't forget, the midterm is tomorrow!" value={message} onChange={(e) => setMessage(e.target.value)}/></div><button onClick={handleSend} disabled={sending || !message} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50">{sending ? <Loader className="animate-spin" size={18}/> : <Send size={18}/>} Send Blast</button></div></div></div> );
}

function AnalyticsDashboard({ classes }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState('all');
    useEffect(() => { const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('type', '==', 'time_log'), orderBy('timestamp', 'desc'), limit(500)); const unsub = onSnapshot(q, (snapshot) => { const fetched = snapshot.docs.map(d => d.data()); setLogs(fetched); setLoading(false); }); return () => unsub(); }, []);
    const filteredLogs = useMemo(() => { if (selectedClassId === 'all') return logs; const targetClass = classes.find((c:any) => c.id === selectedClassId); if (!targetClass || !targetClass.students) return []; return logs.filter(log => targetClass.students.includes(log.studentEmail)); }, [logs, selectedClassId, classes]);
    const totalSeconds = filteredLogs.reduce((acc, log) => acc + log.duration, 0); const totalHours = (totalSeconds / 3600).toFixed(1); const avgSession = filteredLogs.length ? Math.round(totalSeconds / filteredLogs.length / 60) : 0;
    const studentStats: any = {}; filteredLogs.forEach(log => { if (!studentStats[log.studentEmail]) studentStats[log.studentEmail] = { name: log.studentName, totalSec: 0, sessions: 0 }; studentStats[log.studentEmail].totalSec += log.duration; studentStats[log.studentEmail].sessions += 1; });
    const leaderboard = Object.values(studentStats).sort((a:any, b:any) => b.totalSec - a.totalSec).slice(0, 5);
    if (loading) return <div className="p-12 text-center text-slate-400"><Loader className="animate-spin inline"/> Loading Data...</div>;
    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart2 className="text-indigo-600"/> {selectedClassId === 'all' ? 'Global Analytics' : classes.find((c:any) => c.id === selectedClassId)?.name + ' Analytics'}</h2><div className="relative"><select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="appearance-none bg-white pl-4 pr-10 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"><option value="all">All Classes</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Clock size={20}/></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Study Time</span></div><div className="text-3xl font-black text-slate-800">{totalHours} <span className="text-sm font-medium text-slate-400">Hours</span></div></div><div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={20}/></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sessions</span></div><div className="text-3xl font-black text-slate-800">{filteredLogs.length}</div></div><div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Timer size={20}/></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Session</span></div><div className="text-3xl font-black text-slate-800">{avgSession} <span className="text-sm font-medium text-slate-400">Min</span></div></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-700">Top Scholars</h3><Award size={16} className="text-yellow-500"/></div><div className="divide-y divide-slate-100">{leaderboard.map((s:any, idx:number) => (<div key={idx} className="p-4 flex justify-between items-center"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div><div><div className="font-bold text-sm text-slate-700">{s.name}</div><div className="text-xs text-slate-400">{s.sessions} Sessions</div></div></div><div className="font-mono font-bold text-indigo-600">{(s.totalSec / 60).toFixed(0)}m</div></div>))}{leaderboard.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No data yet.</div>}</div></div><div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-700">Recent Activity</h3></div><div className="max-h-[300px] overflow-y-auto custom-scrollbar p-0">{filteredLogs.slice(0, 15).map((log, i) => (<div key={i} className="p-4 border-b border-slate-50 hover:bg-indigo-50/30 transition-colors flex justify-between items-center group"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">{log.studentName?.charAt(0) || '?'}</div><div><div className="flex items-center gap-2"><span className="font-bold text-sm text-slate-800">{log.studentName}</span><span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 rounded-md uppercase tracking-wide">{log.activityType}</span></div><div className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{log.itemTitle}</div></div></div><div className="text-right"><span className="block font-bold text-indigo-600 text-sm">{Math.floor(log.duration / 60)}m {log.duration % 60}s</span><span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>))}{filteredLogs.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No activity recorded.</div>}</div></div></div>
        </div>
    );
}

// ============================================================================
//  INSTRUCTOR GRADING SUITE (Inbox - Fixed with Direct Firebase Sync)
// ============================================================================
function InstructorInbox() { // Removed the broken onGradeSubmission prop!
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null); // Added Toast State
  
  // Local state for the grade adjustments
  const [grades, setGrades] = useState<any>({}); 

  useEffect(() => { 
      const q = query(
          collection(db, 'artifacts', appId, 'activity_logs'), 
          where('scoreDetail.status', '==', 'pending_review'), 
          orderBy('timestamp', 'asc')
      ); 
      const unsub = onSnapshot(q, (snapshot) => { 
          setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
          setLoading(false); 
      }); 
      return () => unsub(); 
  }, []);

  const selectedItem = submissions.find(s => s.id === selectedId);

  // Initialize grades when a submission is selected
  useEffect(() => {
      if (selectedItem) {
          const initGrades: any = {};
          selectedItem.scoreDetail.details.forEach((q: any, i: number) => {
              // Default to existing awarded points (auto-graded ones)
              initGrades[i] = q.awardedPoints || 0;
          });
          setGrades(initGrades);
          setFeedback(''); // Clear feedback on new selection
      }
  }, [selectedItem]);

  const handlePointChange = (idx: number, points: number) => {
      setGrades({ ...grades, [idx]: points });
  };

  const calculateTotal = () => {
      return Object.values(grades).reduce((acc: number, val: any) => acc + (parseInt(val) || 0), 0);
  };

 // --- NEW: DIRECT FIREBASE UPDATE ENGINE ---
    const handleSubmitGrade = async () => { 
        if(!selectedItem) return; 
        const finalScore = calculateTotal();
        const totalPossible = selectedItem.scoreDetail.total || 100;
        const scorePct = Math.round((finalScore / totalPossible) * 100);
        
        // THE FIX: Rebuild the details array to include the individual points you just assigned!
        const updatedDetails = selectedItem.scoreDetail.details.map((q: any, idx: number) => ({
            ...q,
            // Grab the instructor's grade, or fallback to the auto-graded points if untouched
            awardedPoints: grades[idx] !== undefined ? parseInt(grades[idx], 10) : (q.awardedPoints || 0)
        }));

        try {
            // Target the specific exam in Firebase
            const logRef = doc(db, 'artifacts', appId, 'activity_logs', selectedItem.id);
            
            // Send the total scores AND the updated individual question scores
            await updateDoc(logRef, {
                'scoreDetail.score': finalScore,
                'scoreDetail.finalScorePct': scorePct,
                'scoreDetail.status': 'graded',
                'scoreDetail.instructorFeedback': feedback,
                'scoreDetail.details': updatedDetails, // <--- This saves the individual essay grades!
                'lastUpdated': Date.now()
            });

            // Trigger the satisfying toast!
            setToastMsg("Exam Graded & Released! 🎯");
            
            // Clear the UI so you can grade the next one
            setSelectedId(null); 
            setFeedback(''); 
            setGrades({});
        } catch (error) {
            console.error("Failed to submit grade:", error);
            setToastMsg("Error saving grade to database.");
        }
    };

  return ( 
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
        {/* TOAST NOTIFICATION */}
        {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

        {/* SIDEBAR LIST */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white z-10`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold text-slate-800 flex items-center gap-2"><Inbox size={18} className="text-indigo-600"/> Inbox</h2><span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{submissions.length}</span></div>
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

        {/* GRADING PANE */}
        <div className={`flex-1 flex flex-col bg-slate-50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
            {selectedItem ? (
                <>
                    <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 relative">
                        <div className="flex items-center gap-3"><button onClick={() => setSelectedId(null)} className="md:hidden p-2 text-slate-400"><ArrowLeft size={20}/></button><div><h2 className="font-bold text-lg text-slate-800">{selectedItem.itemTitle}</h2><p className="text-xs text-slate-500">Submitted by <span className="font-bold text-indigo-600">{selectedItem.studentName}</span></p></div></div>
                        <div className="text-right"><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Score</div><div className="text-2xl font-black text-indigo-600">{calculateTotal()} <span className="text-sm text-slate-300 font-medium">/ {selectedItem.scoreDetail.total}</span></div></div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {selectedItem.scoreDetail.details.map((q: any, idx: number) => (
                                <div key={idx} className={`bg-white p-6 rounded-2xl border-2 shadow-sm ${['essay'].includes(q.type) ? 'border-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">{q.type}</span>
                                            {q.type === 'essay' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle size={10}/> Essay</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Points:</label>
                                            <input type="number" min="0" max={q.maxPoints} value={grades[idx] || 0} onChange={(e) => handlePointChange(idx, parseInt(e.target.value))} className="w-16 p-1 text-center font-bold border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                            <span className="text-xs font-bold text-slate-400">/ {q.maxPoints}</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-4">{q.prompt}</h3>
                                    
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap font-serif leading-relaxed">
                                        {q.studentVal}
                                    </div>
                                    
                                    {q.type !== 'essay' && (
                                        <div className="mt-3 flex items-center gap-2 text-xs">
                                            <span className="font-bold text-slate-400 uppercase">Correct Answer:</span>
                                            <span className={`px-2 py-1 rounded font-bold ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{q.correctVal}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Footer Grading Action */}
                    <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-end">
                            <div className="w-full space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MessageCircle size={14}/> Final Feedback</label>
                                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" placeholder="Great job! Here is some advice..." value={feedback} onChange={(e) => setFeedback(e.target.value)}/>
                            </div>
                            <div className="w-full md:w-auto shrink-0">
                                <button onClick={handleSubmitGrade} className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex justify-center items-center gap-2">
                                    <Send size={18}/> Release Grade ({calculateTotal()} pts)
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8">
                    <Inbox size={64} className="mb-4 opacity-50"/>
                    <p className="text-lg font-bold">Select a submission to grade</p>
                </div>
            )}
        </div>
    </div> 
  );
}

// ============================================================================
//  INSTRUCTOR TOOLS (Live Feed & Class Manager)
// ============================================================================
function LiveActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to the 'activity_logs' collection, recent 20 events
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
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full mt-1">
                           {log.type === 'completion' ? <CheckCircle2 size={16}/> : <Zap size={16}/>}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{log.studentName}</p>
                            <p className="text-xs text-slate-500">Completed <span className="font-bold text-indigo-600">{log.itemTitle}</span></p>
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

// ============================================================================
//  INSTRUCTOR GRADEBOOK (Fixed: Explicit Types for GPA Loop)
// ============================================================================
function InstructorGradebook({ classData }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'exams' | 'all'>('exams'); 
    
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<{ student: string; assignId: string; logId: string } | null>(null);
    const [scoreInput, setScoreInput] = useState<string>("");

    useEffect(() => {
        if(!classData.assignments || !classData.students) return;
        
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('type', '==', 'completion'),
            where('studentEmail', 'in', classData.students.slice(0, 10)),
            orderBy('timestamp', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            setLogs(all);
        });
        return () => unsub();
    }, [classData]);

    const displayedAssignments = classData.assignments.filter((a: any) => 
        viewType === 'all' || a.contentType === 'test' || a.contentType === 'exam'
    );

    const handleReleaseGrade = async (logId: string) => {
        const numericScore = parseInt(scoreInput, 10);
        if (isNaN(numericScore) || !logId) {
            setEditingCell(null);
            return;
        }

        try {
            const logRef = doc(db, 'artifacts', appId, 'activity_logs', logId);
            await setDoc(logRef, {
                scoreDetail: {
                    finalScorePct: numericScore,
                    status: 'graded'
                },
                lastUpdated: Date.now()
            }, { merge: true });

            setToastMsg("Grade Released! 🎯");
            setEditingCell(null);
        } catch (error) {
            setToastMsg("Error saving grade.");
        }
    };

    const getScoreCell = (studentEmail: string, assign: any) => {
        let log = logs.find(l => l.studentEmail === studentEmail && l.itemId === assign.id);
        if (!log && assign.originalId) log = logs.find(l => l.studentEmail === studentEmail && l.itemId === assign.originalId);
        if (!log) log = logs.find(l => l.itemTitle === assign.title);

        if (!log) return <span className="text-slate-200">-</span>;
        
        const pct = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
        const isEditing = editingCell?.student === studentEmail && editingCell?.assignId === assign.id;

        if (isEditing) {
            return (
                <div className="flex items-center justify-center gap-1 animate-in zoom-in-95">
                    <input
                        type="number" autoFocus value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleReleaseGrade(log.id);
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-14 p-1 text-center font-black text-xs bg-white border-2 border-indigo-500 rounded-lg outline-none"
                    />
                </div>
            );
        }

        if (log.scoreDetail?.status === 'pending_review') {
            return (
                <button 
                    onClick={() => { setEditingCell({ student: studentEmail, assignId: assign.id, logId: log.id }); setScoreInput(pct.toString()); }} 
                    className="text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-md font-black uppercase hover:bg-amber-200 transition-all shadow-sm"
                >
                    Review
                </button>
            );
        }
        
        const color = pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50';
        
        return (
            <button 
                onClick={() => { setEditingCell({ student: studentEmail, assignId: assign.id, logId: log.id }); setScoreInput(pct.toString()); }}
                className={`text-xs font-black px-2.5 py-1.5 rounded-xl cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all ${color}`}
            >
                {pct}%
            </button>
        );
    };

    return (
        <div className="relative animate-in fade-in duration-500">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            <div className="flex justify-between items-center mb-6">
                <div className="flex bg-slate-200/50 p-1 rounded-2xl">
                    <button 
                        onClick={() => setViewType('exams')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'exams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Exams Only
                    </button>
                    <button 
                        onClick={() => setViewType('all')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Show Lessons
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-white/5">Student</th>
                            {displayedAssignments.map((a: any) => (
                                <th key={a.id} className="p-5 text-[10px] font-black uppercase tracking-widest text-center min-w-[140px] border-r border-white/5">
                                    <div className={`text-[8px] mb-1 ${a.contentType === 'test' ? 'text-rose-400' : 'text-indigo-300'}`}>
                                        {a.contentType}
                                    </div>
                                    {a.title}
                                </th>
                            ))}
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right sticky right-0 bg-slate-900 z-10 border-l border-white/5">GPA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {classData.students.map((student: string) => (
                            <tr key={student} className="hover:bg-slate-50/50 group">
                                <td className="p-5 font-bold text-slate-700 text-sm sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[4px_0_10px_rgba(0,0,0,0.02)] z-10 transition-colors">
                                    {student.split('@')[0]}
                                    <div className="text-[9px] text-slate-300 font-medium lowercase tracking-tight">{student}</div>
                                </td>
                                {displayedAssignments.map((a: any) => (
                                    <td key={a.id} className="p-4 text-center align-middle border-r border-slate-50">
                                        {getScoreCell(student, a)}
                                    </td>
                                ))}
                                <td className="p-5 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] z-10">
                                    {(() => {
                                        let total = 0, count = 0;
                                        // --- FIX APPLIED HERE: (a: any) ---
                                        displayedAssignments.forEach((a: any) => {
                                            const log = logs.find(l => l.studentEmail === student && (l.itemId === a.id || l.itemTitle === a.title));
                                            if (log) {
                                                const p = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
                                                total += p; count++;
                                            }
                                        });
                                        return count === 0 ? <span className="text-slate-200">--</span> : <span className="font-black text-slate-900 text-sm">{Math.round(total / count)}%</span>;
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
// ============================================================================
//  CLASS MANAGER VIEW (Search Dropdown & Active Playlist)
// ============================================================================
function ClassManagerView({ 
    user, 
    classes = [], 
    lessons = [], 
    allDecks = [],
    onAssign, 
    onRevoke, 
    onCreateClass, 
    onDeleteClass, 
    onRenameClass, 
    onAddStudent 
}: any) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
    
    // Form States
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    
    // Creation & Search States
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [lessonSearch, setLessonSearch] = useState('');

    const activeClass = classes.find((c: any) => c.id === selectedClassId);

    // --- ASSIGNMENT DATA LOGIC ---
    // 1. Get lessons already assigned to this cohort
    const assignedLessons = lessons.filter((l: any) => activeClass?.assignments?.includes(l.id));
    
    // 2. Get lessons NOT yet assigned
    const unassignedLessons = lessons.filter((l: any) => !activeClass?.assignments?.includes(l.id));
    
    // 3. Filter unassigned lessons by the search bar
    const filteredUnassigned = unassignedLessons.filter((l: any) => {
        if (!lessonSearch.trim()) return true;
        const searchStr = `${l.title || 'Untitled'} ${l.type === 'arcade_game' ? 'arcade' : 'unit'}`.toLowerCase();
        return searchStr.includes(lessonSearch.toLowerCase());
    });

    const handleCreateSubmit = () => {
        if (!newCohortName.trim()) return;
        onCreateClass(newCohortName.trim());
        setNewCohortName('');
        setIsCreatingCohort(false);
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentEmail.trim() || !activeClass) return;
        onAddStudent(activeClass.id, newStudentEmail);
        setNewStudentEmail('');
    };

    return (
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pb-32 animate-in fade-in duration-500 font-sans">
            
            {/* ============================================================== */}
            {/* LEFT PANE: THE COHORT LIST (MASTER) */}
            {/* ============================================================== */}
            <div className="w-full md:w-[340px] flex flex-col gap-6 shrink-0">
                
                {/* Header & Create Action */}
                <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-indigo-50 opacity-50 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Users size={100} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Cohorts</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                            {classes.length} Active
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            setIsCreatingCohort(!isCreatingCohort);
                            setNewCohortName('');
                        }}
                        className={`relative z-10 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all active:scale-95 ${isCreatingCohort ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
                        title="Provision New Cohort"
                    >
                        {isCreatingCohort ? <X size={24} /> : <Plus size={24} />}
                    </button>
                </div>

                {/* Cohort List & Inline Creator */}
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 pb-12">
                    
                    {/* INLINE COHORT FORGE */}
                    {isCreatingCohort && (
                        <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-xl shadow-indigo-200 animate-in slide-in-from-top-4 fade-in duration-300">
                            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Forge New Cohort</label>
                            <input 
                                autoFocus
                                value={newCohortName}
                                onChange={e => setNewCohortName(e.target.value)}
                                placeholder="e.g. KitchenComm Beta..."
                                className="w-full bg-white/10 border-2 border-indigo-400/50 rounded-xl px-4 py-3 mb-3 text-sm font-black text-white placeholder:text-indigo-300 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()}
                            />
                            <button 
                                disabled={!newCohortName.trim()}
                                onClick={handleCreateSubmit}
                                className="w-full py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Flame size={16} /> Deploy
                            </button>
                        </div>
                    )}

                    {classes.length === 0 && !isCreatingCohort ? (
                        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50">
                            <Users size={32} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-500">No cohorts deployed.</p>
                            <button onClick={() => setIsCreatingCohort(true)} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">Create One Now</button>
                        </div>
                    ) : (
                        classes.map((cls: any) => {
                            const isSelected = selectedClassId === cls.id;
                            const pulse = cls.pulse || Math.floor(Math.random() * 40) + 60; 
                            
                            return (
                                <button 
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${
                                        isSelected 
                                            ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' 
                                            : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {isSelected && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />}

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <h3 className={`text-lg font-black leading-tight pr-4 ${isSelected ? 'text-white' : 'text-slate-800 group-hover:text-indigo-900'}`}>
                                            {cls.name}
                                        </h3>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 text-indigo-50 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                            <Users size={14} />
                                        </div>
                                    </div>
                                    
                                    <div className={`flex items-center justify-between text-xs font-bold relative z-10 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                        <span>{cls.students?.length || 0} Students</span>
                                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isSelected ? 'bg-indigo-500/50 text-white' : pulse >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <Activity size={12} /> {pulse}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT PANE: COHORT DETAILS (DETAIL) */}
            {/* ============================================================== */}
            <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative min-h-[600px]">
                
                {!activeClass ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
                            <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Select a Cohort</h2>
                        <p className="text-slate-500 font-bold max-w-sm">Click on a deployment from the roster to manage assignments, view progress, and track student pulse.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 fade-in">
                        
                        {/* Detail Header */}
                        <header className="px-8 pt-8 pb-0 border-b border-slate-100 bg-slate-50/50 relative">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex-1 pr-8">
                                    <span className="inline-block px-3 py-1 bg-slate-200/50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-3 border border-slate-200">
                                        ID: {activeClass.id}
                                    </span>
                                    
                                    <div className="flex items-center gap-3 group">
                                        <input 
                                            className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter bg-transparent border-b-2 border-transparent focus:border-indigo-500 p-0 focus:ring-0 w-full max-w-lg transition-colors"
                                            value={activeClass.name}
                                            onChange={(e) => onRenameClass(activeClass.id, e.target.value)}
                                            onFocus={() => setIsEditingTitle(true)}
                                            onBlur={() => setIsEditingTitle(false)}
                                            placeholder="Cohort Name..."
                                        />
                                        <Edit3 size={18} className={`text-slate-300 transition-opacity ${isEditingTitle ? 'opacity-0' : 'opacity-100 group-hover:text-indigo-400'}`} />
                                    </div>

                                    <div className="flex flex-wrap gap-3 mt-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                            <Users size={14} className="text-indigo-500"/> {activeClass.students?.length || 0} Enrolled
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                            <BookOpen size={14} className="text-emerald-500"/> {activeClass.assignments?.length || 0} Units Assigned
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        onDeleteClass(activeClass.id);
                                        setSelectedClassId(null);
                                    }}
                                    className="p-3 text-slate-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all shadow-sm bg-white border border-slate-200 hover:border-rose-500"
                                    title="Delete Cohort"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex gap-6 relative bottom-[-1px]">
                                <button 
                                    onClick={() => setActiveTab('roster')}
                                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'roster' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Student Roster
                                </button>
                                <button 
                                    onClick={() => setActiveTab('assignments')}
                                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Curriculum
                                </button>
                            </div>
                        </header>

                        {/* Detail Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white relative">
                            
                            {/* ==================== ROSTER TAB ==================== */}
                            {activeTab === 'roster' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <form onSubmit={handleAddStudent} className="relative group max-w-xl">
                                        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-lg group-focus-within:bg-indigo-500/20 transition-all duration-500" />
                                        <div className="relative flex items-center bg-white border-2 border-slate-200 focus-within:border-indigo-500 rounded-2xl p-1.5 shadow-sm transition-colors">
                                            <div className="pl-4 pr-2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Mail size={18} /></div>
                                            <input 
                                                type="email" 
                                                placeholder="Enter student email address..." 
                                                value={newStudentEmail}
                                                onChange={e => setNewStudentEmail(e.target.value)}
                                                className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!newStudentEmail.trim()}
                                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                                            >
                                                Enroll <Plus size={14} />
                                            </button>
                                        </div>
                                    </form>

                                    <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Completion</th>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {(!activeClass.students || activeClass.students.length === 0) ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center">
                                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300"><Users size={20} /></div>
                                                            <p className="text-sm font-bold text-slate-500">The roster is empty.</p>
                                                            <p className="text-xs font-bold text-slate-400 mt-1">Enroll students using the field above.</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    activeClass.students.map((student: any, idx: number) => {
                                                        const displayName = student.name || 'Pending Registration';
                                                        const isPending = !student.name;
                                                        const initial = (student.name?.[0] || student.email?.[0] || 'S').toUpperCase();

                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-[1rem] font-black flex items-center justify-center text-sm shadow-inner border transition-colors ${isPending ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100/50'}`}>
                                                                            {initial}
                                                                        </div>
                                                                        <div>
                                                                            <span className={`block font-bold mb-0.5 ${isPending ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                                                                                {displayName}
                                                                            </span>
                                                                            <span className="text-xs font-bold text-slate-400 block">{student.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div className={`h-full w-[45%] rounded-full ${isPending ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-slate-400 w-8">45%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><X size={16} strokeWidth={3} /></button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ==================== ASSIGNMENTS TAB (SEARCH & LIST) ==================== */}
                            {activeTab === 'assignments' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 flex flex-col h-full">
                                    
                                    {/* 1. THE SEARCH & ADD BAR */}
                                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 relative z-20">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Add to Curriculum</h3>
                                        <div className="relative group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input 
                                                type="text"
                                                placeholder="Search library to add..."
                                                value={lessonSearch}
                                                onChange={(e) => setLessonSearch(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all shadow-sm"
                                            />
                                            
                                            {/* Live Search Dropdown */}
                                            {lessonSearch.trim().length > 0 && (
                                                <div className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 fade-in">
                                                    {filteredUnassigned.length === 0 ? (
                                                        <div className="p-6 text-center text-sm font-bold text-slate-400">
                                                            No unassigned lessons match "{lessonSearch}"
                                                        </div>
                                                    ) : (
                                                        filteredUnassigned.map((lesson: any) => (
                                                            <button
                                                                key={lesson.id}
                                                                onClick={() => {
                                                                    onAssign(activeClass.id, lesson.id);
                                                                    setLessonSearch(''); // Clear search on assign
                                                                }}
                                                                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 border-b border-slate-50 transition-colors text-left group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                                                                        {lesson.type === 'arcade_game' ? <Gamepad2 size={18} /> : <BookOpen size={18} />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-900 transition-colors">{lesson.title || 'Untitled'}</p>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{lesson.type === 'arcade_game' ? 'Arcade' : 'Standard'} • {lesson.blocks?.length || 0} Blocks</p>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-transparent group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                    <Plus size={16} strokeWidth={3} />
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. THE ACTIVE PLAYLIST */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-500" /> Active Playlist
                                            </h3>
                                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">
                                                {assignedLessons.length} Items
                                            </span>
                                        </div>
                                        
                                        {assignedLessons.length === 0 ? (
                                            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem]">
                                                <BookOpen size={32} className="mx-auto text-slate-200 mb-3" />
                                                <p className="text-sm font-bold text-slate-500">No content assigned yet.</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1">Use the search bar above to add lessons.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {assignedLessons.map((lesson: any, idx: number) => (
                                                    <div key={lesson.id} className="flex items-center p-4 rounded-2xl border-2 border-slate-100 bg-white shadow-sm hover:border-slate-200 transition-colors group animate-in fade-in">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black mr-4 shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${lesson.type === 'arcade_game' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                            {lesson.type === 'arcade_game' ? <Gamepad2 size={20} /> : <BookOpen size={20} />}
                                                        </div>
                                                        <div className="flex-1 pr-4">
                                                            <h4 className="font-black text-slate-800 text-sm mb-0.5">{lesson.title || 'Untitled'}</h4>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                {lesson.type === 'arcade_game' ? 'Arcade Game' : 'Standard Unit'}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            onClick={() => onRevoke(activeClass.id, lesson.id)}
                                                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white hover:shadow-md transition-all shrink-0"
                                                            title="Revoke Assignment"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// ============================================================================
//  CREATOR TOOLS (Builders)
// ============================================================================

function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId }: any) {
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { if (initialDeckId) setFormData(prev => ({...prev, deckId: initialDeckId})); }, [initialDeckId]);
  const handleChange = (e: any) => { if (e.target.name === 'deckId') { if (e.target.value === 'new') { setIsCreatingDeck(true); setFormData({ ...formData, deckId: 'new' }); } else { setIsCreatingDeck(false); setFormData({ ...formData, deckId: e.target.value }); } } else { setFormData({ ...formData, [e.target.name]: e.target.value }); } };
  const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
  const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };
  const handleSelectCard = (card: any) => { setEditingId(card.id); setFormData({ front: card.front, back: card.back, type: card.type || 'noun', ipa: card.ipa || '', sentence: card.usage?.sentence || '', sentenceTrans: card.usage?.translation || '', grammarTags: card.grammar_tags?.join(', ') || '', deckId: card.deckId || formData.deckId }); setMorphology(card.morphology || []); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleClear = () => { setEditingId(null); setFormData(prev => ({ ...prev, front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '' })); setMorphology([]); };
  const handleSubmit = (e: any) => { e.preventDefault(); if (!formData.front || !formData.back) return; let finalDeckId = formData.deckId; let finalDeckTitle = null; if (formData.deckId === 'new') { if (!newDeckTitle) return alert("Please name your new deck."); finalDeckId = `custom_${Date.now()}`; finalDeckTitle = newDeckTitle; } const cardData = { front: formData.front, back: formData.back, type: formData.type, deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "/.../", mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] }; if (editingId) { onUpdateCard(editingId, cardData); setToastMsg("Card Updated Successfully"); } else { onSaveCard(cardData); setToastMsg("Card Created Successfully"); } handleClear(); if (isCreatingDeck) { setIsCreatingDeck(false); setNewDeckTitle(''); setFormData(prev => ({ ...prev, deckId: finalDeckId })); } };
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })); 
  const currentDeckCards = validDecks[formData.deckId] ? validDecks[formData.deckId].cards || [] : validDecks['custom'] ? validDecks['custom'].cards || [] : [];
  
  useEffect(() => { if (editingId && !currentDeckCards.some((c: any) => c.id === editingId)) { handleClear(); } }, [currentDeckCards, editingId]);

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
      {currentDeckCards && currentDeckCards.length > 0 && (<div className="pt-6 border-t border-slate-200"><h3 className="font-bold text-slate-800 mb-4">Cards in this Deck ({currentDeckCards.length})</h3><div className="space-y-2">{currentDeckCards.map((card: any, idx: number) => (<div key={idx} onClick={() => handleSelectCard(card)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${editingId === card.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}><div><span className="font-bold text-slate-800">{card.front}</span><span className="text-slate-400 mx-2">•</span><span className="text-sm text-slate-500">{card.back}</span></div><div className="flex items-center gap-2"><Edit3 size={16} className="text-indigo-400" />{/* @ts-ignore */ !(INITIAL_SYSTEM_DECKS as any)[card.deckId] && (<button onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>)}</div></div>))}</div></div>)}
    </div>
  );
}
function LessonBuilderView({ data, setData, onSave }: any) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(data, null, 2));

  // --- 1. THE ENGINE ---
  const updateBlock = (index: number, field: string, value: any) => {
    const newBlocks = [...(data.blocks || [])];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setData({ ...data, blocks: newBlocks });
  };

  const addBlock = (type: string) => {
    const templates: any = {
      text: { type: 'text', title: '', content: 'New Core Concept...' },
      essay: { type: 'essay', title: 'Deep Dive', content: 'Paragraph 1...\n\nParagraph 2...' },
      dialogue: { type: 'dialogue', lines: [{ speaker: 'A', text: '', side: 'left' }] },
      'vocab-list': { type: 'vocab-list', items: [{ term: '', definition: '' }] },
      quiz: { type: 'quiz', question: '', options: [{id:'a',text:''},{id:'b',text:''}], correctId: 'a' },
      image: { type: 'image', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', caption: '' },
      'fill-blank': { type: 'fill-blank', question: 'Fill in the blanks:', text: 'The [quick] brown [fox] jumps.', distractors: ['slow', 'dog'] },
      discussion: { type: 'discussion', title: 'Discussion Time', questions: ['Question 1?', 'Question 2?', 'Question 3?'] },
      // --- NEW GAME TEMPLATE ---
      game: { type: 'game', gameType: 'connect-three', title: 'Vocabulary Battle' }
    };
    setData({ ...data, blocks: [...(data.blocks || []), templates[type]] });
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...(data.blocks || [])].filter((_, i) => i !== index);
    setData({ ...data, blocks: newBlocks });
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setData(parsed);
      setJsonMode(false);
      setToastMsg("Unit Injected!");
    } catch (e) {
      setToastMsg("Syntax Error in JSON");
    }
  };

  // Keep JSON string updated if visual editor changes
  useEffect(() => {
    if (!jsonMode) setJsonInput(JSON.stringify(data, null, 2));
  }, [data, jsonMode]);

  // --- 2. THE RENDERER ---
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-64 animate-in fade-in duration-500">
      
      {/* TOOLBAR: THEME & MODE TOGGLES */}
      <div className="flex justify-between items-center bg-slate-100/50 p-2 rounded-[2rem] border border-slate-200">
         <button 
           onClick={() => setJsonMode(!jsonMode)}
           className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
             jsonMode ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'
           }`}
         >
           <Code size={14} /> {jsonMode ? 'Exit JSON' : 'Advanced JSON'}
         </button>
         
         <div className="flex gap-2 pr-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Editor Active</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
         </div>
      </div>

      {jsonMode ? (
        /* --- JSON INJECTOR VIEW --- */
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-slate-950 rounded-[3rem] p-8 shadow-2xl relative">
            <div className="absolute top-6 right-8 flex gap-2">
               <div className="w-3 h-3 rounded-full bg-rose-500/20" />
               <div className="w-3 h-3 rounded-full bg-amber-500/20" />
               <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
            </div>
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-[60vh] bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none leading-relaxed custom-scrollbar"
              placeholder="Paste your 'Looksmaxing' JSON here..."
            />
          </div>
          <button 
            onClick={handleImportJson}
            className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl active:scale-95 transition-all hover:bg-emerald-400"
          >
            Inject Unit Architecture
          </button>
        </div>
      ) : (
        /* --- VISUAL BLOCK VIEW --- */
        <div className="space-y-12">
          {/* Unit Meta */}
          <div className="space-y-4 px-2">
            <input 
              className="text-5xl md:text-6xl font-black border-none w-full focus:ring-0 p-0 placeholder:text-slate-200 tracking-tighter bg-transparent" 
              placeholder="Unit Title..." 
              value={data.title || ''} 
              onChange={e => setData({...data, title: e.target.value})} 
            />
            <input 
              className="text-xl md:text-2xl font-bold text-slate-400 border-none w-full focus:ring-0 p-0 tracking-tight bg-transparent" 
              placeholder="Lesson Subtitle..." 
              value={data.subtitle || ''} 
              onChange={e => setData({...data, subtitle: e.target.value})} 
            />
          </div>

          {/* Blocks */}
          <div className="space-y-6">
            {(data.blocks || []).map((block: any, idx: number) => (
              <div key={idx} className="group bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all relative">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">{idx + 1}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{block.type}</span>
                   </div>
                   <button onClick={() => removeBlock(idx)} className="p-2 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white">
                     <Trash2 size={16} />
                   </button>
                </div>

                {/* TEXT EDITOR */}
                {block.type === 'text' && (
                  <textarea 
                    className="w-full bg-slate-50 rounded-xl p-4 font-black text-xl border-none focus:ring-2 focus:ring-indigo-100 resize-none h-32" 
                    placeholder="Punchy text content..."
                    value={block.content} 
                    onChange={e => updateBlock(idx, 'content', e.target.value)} 
                  />
                )}

                {/* ESSAY EDITOR */}
                {block.type === 'essay' && (
                  <div className="space-y-4">
                    <input className="w-full font-black text-slate-800 bg-slate-50 border-none px-5 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100" placeholder="Essay Title" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} />
                    <textarea className="w-full h-48 bg-slate-50 border-none p-5 rounded-xl text-xs font-serif leading-relaxed focus:ring-2 focus:ring-indigo-100" placeholder="Paragraph 1...\n\nParagraph 2..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} />
                  </div>
                )}

                {/* IMAGE EDITOR */}
                {block.type === 'image' && (
                  <div className="space-y-3">
                    <input className="w-full bg-slate-50 border-none p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" placeholder="Unsplash Image URL" value={block.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} />
                    <input className="w-full bg-slate-50 border-none p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" placeholder="Image Caption (Optional)" value={block.caption || ''} onChange={e => updateBlock(idx, 'caption', e.target.value)} />
                  </div>
                )}

                {/* VOCAB LIST EDITOR */}
                {block.type === 'vocab-list' && (
                  <div className="space-y-3">
                    {(block.items || []).map((item: any, iIdx: number) => (
                       <div key={iIdx} className="flex gap-2">
                          <input className="w-1/3 bg-slate-50 border-none p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100" placeholder="Term" value={item.term} onChange={e => { const newItems = [...block.items]; newItems[iIdx].term = e.target.value; updateBlock(idx, 'items', newItems); }} />
                          <input className="flex-1 bg-slate-50 border-none p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100" placeholder="Definition" value={item.definition} onChange={e => { const newItems = [...block.items]; newItems[iIdx].definition = e.target.value; updateBlock(idx, 'items', newItems); }} />
                          <button onClick={() => { const newItems = block.items.filter((_:any, i:number) => i !== iIdx); updateBlock(idx, 'items', newItems); }} className="p-3 text-slate-300 hover:text-rose-500"><X size={16}/></button>
                       </div>
                    ))}
                    <button onClick={() => updateBlock(idx, 'items', [...(block.items||[]), {term:'', definition:''}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">+ Add Word</button>
                  </div>
                )}

                {/* QUIZ EDITOR */}
                {block.type === 'quiz' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <textarea className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold resize-none h-20" placeholder="Quiz Question..." value={block.question || ''} onChange={e => updateBlock(idx, 'question', e.target.value)} />
                     <div className="space-y-2 mt-4">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Options (Select Correct)</span>
                       {(block.options || []).map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-2">
                             <input type="radio" className="w-4 h-4 text-indigo-600" checked={block.correctId === opt.id} onChange={() => updateBlock(idx, 'correctId', opt.id)} />
                             <input className="w-12 bg-white border border-slate-200 p-2 rounded-lg text-xs font-mono text-center" placeholder="ID" value={opt.id} onChange={e => { const newOpts = [...block.options]; newOpts[oIdx].id = e.target.value; updateBlock(idx, 'options', newOpts); }} />
                             <input className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-sm" placeholder="Answer Text" value={opt.text} onChange={e => { const newOpts = [...block.options]; newOpts[oIdx].text = e.target.value; updateBlock(idx, 'options', newOpts); }} />
                          </div>
                       ))}
                       <button onClick={() => updateBlock(idx, 'options', [...(block.options||[]), {id: String.fromCharCode(97 + (block.options?.length || 0)), text: ''}])} className="text-xs font-bold text-indigo-500 mt-2 hover:underline">+ Add Option</button>
                     </div>
                  </div>
                )}

                {/* DIALOGUE EDITOR */}
                {block.type === 'dialogue' && (
                  <div className="space-y-3">
                     {(block.lines || []).map((line: any, lIdx: number) => (
                        <div key={lIdx} className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 relative">
                           <button onClick={() => { const newLines = block.lines.filter((_:any, i:number) => i !== lIdx); updateBlock(idx, 'lines', newLines); }} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><X size={14}/></button>
                           <div className="flex gap-2 pr-6">
                             <input className="w-1/4 bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold" placeholder="Speaker" value={line.speaker} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].speaker = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                             <select className="bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-500" value={line.side} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].side = e.target.value; updateBlock(idx, 'lines', newLines); }}>
                                <option value="left">Left Side</option><option value="right">Right Side</option>
                             </select>
                           </div>
                           <textarea className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm resize-none" placeholder="What are they saying?" value={line.text} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].text = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                           <input className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs italic text-slate-500" placeholder="Translation / Context note" value={line.translation || ''} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].translation = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                        </div>
                     ))}
                     <button onClick={() => updateBlock(idx, 'lines', [...(block.lines||[]), {speaker:'A', text:'', side:'left'}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">+ Add Dialogue Line</button>
                  </div>
                )}

                {/* SCENARIO EDITOR (Read-Only Status for complex trees) */}
                {block.type === 'scenario' && (
                  <div className="p-6 bg-slate-900 rounded-2xl flex items-center justify-between shadow-inner">
                     <div>
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Complex Block</span>
                       <p className="text-white font-bold mt-1 text-sm">Interactive Branching Scenario</p>
                       <p className="text-slate-400 text-xs mt-1">{block.nodes?.length || 0} logic nodes configured.</p>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                       <Code size={20} />
                     </div>
                  </div>
                )}

                {/* DISCUSSION EDITOR */}
                {block.type === 'discussion' && (
                  <div className="space-y-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                     <div className="flex items-center gap-2 mb-2">
                        <MessageCircle size={16} className="text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900">Discussion Block</span>
                     </div>
                     <input 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-200" 
                        placeholder="Title (e.g. Talk about it!)" 
                        value={block.title || ''} 
                        onChange={e => updateBlock(idx, 'title', e.target.value)} 
                     />
                     <div className="space-y-3">
                       {(block.questions || []).map((q: string, qIdx: number) => (
                          <div key={qIdx} className="flex gap-2">
                            <span className="flex-none p-3 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">{qIdx + 1}</span>
                            <input 
                              className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200" 
                              placeholder={`Question ${qIdx + 1}`} 
                              value={q} 
                              onChange={e => {
                                 const newQs = [...block.questions];
                                 newQs[qIdx] = e.target.value;
                                 updateBlock(idx, 'questions', newQs);
                              }} 
                            />
                          </div>
                       ))}
                     </div>
                  </div>
                )}

                {/* FILL BLANK EDITOR */}
                {block.type === 'fill-blank' && (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Puzzle size={16} className="text-indigo-500" />
                        <span className="text-xs font-bold text-slate-600">Drag & Drop Configurator</span>
                     </div>
                     <input 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100" 
                        placeholder="Instruction (e.g., Fill in the missing verbs)" 
                        value={block.question || ''} 
                        onChange={e => updateBlock(idx, 'question', e.target.value)} 
                     />
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Sentence (Use [brackets] for blanks)</label>
                       <textarea 
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-mono resize-none h-24 focus:ring-2 focus:ring-indigo-100" 
                          placeholder="I want to buy [apples] at the [store]." 
                          value={block.text || ''} 
                          onChange={e => updateBlock(idx, 'text', e.target.value)} 
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Distractor Words (Comma separated)</label>
                       <input 
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100" 
                          placeholder="oranges, bank, sell" 
                          value={(block.distractors || []).join(', ')} 
                          onChange={e => {
                             const distArr = e.target.value.split(',').map((s:string) => s.trim()).filter((s:string) => s !== '');
                             updateBlock(idx, 'distractors', distArr);
                          }} 
                       />
                     </div>
                  </div>
                )}

                {/* --- NEW GAME EDITOR VISUAL --- */}
                {block.type === 'game' && (
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                      <Gamepad2 size={120} className="absolute -right-10 -bottom-10 text-indigo-500/5 rotate-12" />
                      
                      <div className="flex items-center gap-5 relative z-10">
                          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                              <Gamepad2 size={32} />
                          </div>
                          <div>
                              <h4 className="text-xl font-black text-indigo-950 mb-1">{block.title || 'Connect Three'}</h4>
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white/60 px-2 py-1 rounded-md inline-block">Interactive Module</p>
                          </div>
                      </div>
                      
                      <div className="relative z-10 text-left md:text-right max-w-xs">
                          <p className="text-sm font-bold text-indigo-800 leading-tight">
                              This game will automatically populate words from the lesson's vocab list block.
                          </p>
                      </div>
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* Injector Button Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-10 border-t border-slate-100">
             <InjectorButton icon={<AlignLeft/>} label="Text" onClick={() => addBlock('text')} />
             <InjectorButton icon={<FileText/>} label="Essay" onClick={() => addBlock('essay')} />
             <InjectorButton icon={<MessageSquare/>} label="Dialogue" onClick={() => addBlock('dialogue')} />
             <InjectorButton icon={<List/>} label="Vocab" onClick={() => addBlock('vocab-list')} />
             <InjectorButton icon={<HelpCircle/>} label="Quiz" onClick={() => addBlock('quiz')} />
             <InjectorButton icon={<Image/>} label="Visual" onClick={() => addBlock('image')} />
             <InjectorButton icon={<Puzzle/>} label="Fill Blank" onClick={() => addBlock('fill-blank')} />
             <InjectorButton icon={<MessageCircle/>} label="Discussion" onClick={() => addBlock('discussion')} />
             {/* NEW GAME INJECTOR BUTTON */}
             <InjectorButton icon={<Gamepad2/>} label="Game" onClick={() => addBlock('game')} />
          </div>
        </div>
      )}
    </div>
  );
}
function InjectorButton({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className="h-28 bg-white border-2 border-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 hover:shadow-xl transition-all active:scale-90 group"
    >
      <div className="text-slate-300 group-hover:text-indigo-600 transition-colors scale-125">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </button>
  );
}
// ============================================================================
//  BUILDER HUB (The Main Studio Workspace)
// ============================================================================
function BuilderHub({ 
  onSaveCard, 
  onUpdateCard, 
  onDeleteCard, 
  onSaveLesson, 
  allDecks, 
  lessons, 
  initialMode, 
  onClearMode 
}: any) {
  const [lessonData, setLessonData] = useState<any>({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
  const [mode, setMode] = useState<'card' | 'lesson' | 'exam' | 'arcade'>(initialMode || 'card'); 
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  const modes = [
    { id: 'card', label: 'Scriptorium', icon: <Layers size={18}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'lesson', label: 'Curriculum', icon: <BookOpen size={18}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'exam', label: 'Assessment', icon: <FileText size={18}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'arcade', label: 'Arcade', icon: <Gamepad2 size={18}/>, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];
const handleCommit = () => {
    // 1. Save the data
    const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
    onSaveLesson(payload);
    
    // 2. Show the success toast
    setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");

    // 3. THE FIX: Instantly wipe the state clean for the next entry
    if (mode === 'lesson') {
        setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
    } else if (mode === 'arcade') {
        setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
    }
  };
  const activeModeConfig = modes.find(m => m.id === mode) || modes[0];

  return ( 
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden select-none animate-in fade-in duration-500">
      {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* HEADER */}
      <header className="h-24 bg-white border-b border-slate-200 px-6 md:px-10 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${activeModeConfig.bg} ${activeModeConfig.color} hidden sm:flex transition-colors`}>
            {activeModeConfig.icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{activeModeConfig.label}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Magister Studio</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl md:hidden border border-slate-200">
          <button 
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'
            }`}
          >
            <Edit3 size={14} /> Edit
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'
            }`}
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          {initialMode && (
            <button onClick={onClearMode} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100">
              <X size={20} />
            </button>
          )}
          
          {mode !== 'exam' && (
<button 
               onClick={handleCommit}
               className={`hidden sm:flex text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all ${mode === 'arcade' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-slate-900 hover:bg-slate-800'}`}
             >
               Commit {mode === 'arcade' ? 'Game' : 'Unit'}
             </button>
          )}
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: EDITOR */}
        <div className={`h-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${
          viewMode === 'edit' ? 'w-full md:w-1/2 opacity-100' : 'hidden md:block md:w-1/2 opacity-50 grayscale-[50%]'
        }`}>
          <div className="p-6 md:p-12 max-w-2xl mx-auto pb-40">
            
            <div className="mb-10 flex flex-wrap bg-slate-200/50 p-1.5 rounded-[2rem] w-fit mx-auto md:mx-0 gap-1">
              {modes.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => {
                    setMode(m.id as any);
                    if (m.id === 'arcade') setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
                    if (m.id === 'lesson') setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
                  }} 
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === m.id ? 'bg-white text-slate-900 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m.id}
                </button>
              ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4">
              {mode === 'card' && <CardBuilderView onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} availableDecks={allDecks} />}
              {mode === 'lesson' && <LessonBuilderView data={lessonData} setData={setLessonData} onSave={onSaveLesson} availableDecks={allDecks} />}
              {mode === 'exam' && (
                <div className="-mx-6 md:-mx-12">
                   <ExamBuilderView onSave={(examObj: any) => { onSaveLesson(examObj); setToastMsg("Assessment Successfully Built! 🎯"); }} />
                </div>
              )}
              {mode === 'arcade' && <ArcadeBuilderView data={lessonData} setData={setLessonData} availableDecks={allDecks} />}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: LIVE PREVIEW */}
        <div className={`h-full bg-slate-100 border-l border-slate-200 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-500 ${
          viewMode === 'preview' ? 'flex w-full md:w-1/2' : 'hidden md:flex md:w-1/2'
        }`}>
          <div className="relative w-full h-full max-w-sm max-h-[750px] group flex flex-col items-center justify-center">
            
            {mode === 'exam' && (
                <div className="w-full max-w-xs aspect-[9/16] bg-white border-4 border-dashed border-slate-200 rounded-[3rem] shadow-sm flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
                    <FileText size={64} className="text-slate-200 mb-6" />
                    <h3 className="text-lg font-black text-slate-800 mb-2">Exam Preview</h3>
                    <p className="text-sm font-bold text-slate-400">Assessments are rendered dynamically in the student's isolated testing environment.</p>
                </div>
            )}

            {mode === 'arcade' && (
                <div className="w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[12px] border-slate-900 animate-in zoom-in-95 duration-500 relative">
                    <div className="absolute inset-0 bg-amber-500/10 z-0" />
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner rotate-12">
                            <Gamepad2 size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
                            {lessonData.title || "Untitled Game"}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full mb-8">
                            Template: {lessonData.gameTemplate?.replace('-', ' ') || 'None'}
                        </p>
                        
                        <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 text-left space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</span>
                                <span className="text-sm font-bold text-slate-700">{lessonData.mode === 'pvc' ? 'vs CPU' : 'Pass & Play'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Win Goal</span>
                                <span className="text-sm font-bold text-slate-700">{lessonData.targetScore || 3} Points</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vocab Ammo</span>
                                <span className="text-sm font-bold text-slate-700">{lessonData.deckIds?.length || 0} Decks</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(mode === 'lesson' || mode === 'card') && (
                <>
                    <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-emerald-500/10 blur-2xl rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="relative h-full w-full animate-in zoom-in-95 duration-500">
                      <LivePreview data={lessonData} />
                    </div>
                </>
            )}

            {mode !== 'exam' && (
                <button 
                onClick={() => {
                    const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
                    onSaveLesson(payload);
                    setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");
                }}
                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl md:hidden flex items-center gap-3 active:scale-90 transition-all ${mode === 'arcade' ? 'bg-amber-500' : 'bg-slate-900'}`}
                >
                <Zap size={16} className={mode === 'arcade' ? 'text-white' : 'text-yellow-400'} /> Commit to Library
                </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLET FOOTER */}
      <div className={`md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 transition-all duration-500 ${
        viewMode === 'edit' ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}>
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <div className={`w-1 h-4 rounded-full animate-pulse ${activeModeConfig.color.replace('text-', 'bg-')}`} />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Editing Mode: {mode}</p>
        </div>
      </div>
    </div> 
  );
}
function InstructorDashboard({ 
  user, 
  userData, 
  allDecks, 
  lessons, 
  curriculums,
  onAssignCurriculum,
  onSaveLesson, 
  onSaveCard, 
  onAssign,        
  onRevoke,        
  onCreateClass,  
  onDeleteClass,  
  onRenameClass,  
  onAddStudent,   
  onSwitchView, 
  onLogout 
}: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(''); 

  const NavItem = ({ id, icon, label, badge }: { id: string; icon: React.ReactNode; label: string; badge?: boolean }) => {
    const isActive = activeTab === id;
    
    return (
      <button 
        onClick={() => setActiveTab(id)}
        role="tab"
        aria-selected={isActive}
        className={`relative flex items-center h-14 w-full rounded-[1.5rem] transition-all duration-300 ease-out group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.96] ${
          isActive ? '' : 'hover:bg-slate-900/60'
        }`}
      >
        {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-[1.5rem] shadow-lg shadow-indigo-900/50 animate-in fade-in zoom-in-95 duration-300 border border-indigo-400/20" />
        )}

        <div className="relative z-10 flex items-center w-full">
            <div className="w-20 shrink-0 flex items-center justify-center relative">
                {React.cloneElement(icon as React.ReactElement, { 
                    size: 22, 
                    strokeWidth: isActive ? 2.5 : 2,
                    className: `transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`
                })}
                
                {badge && !isActive && (
                    <span className="absolute top-3 right-5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-slate-950"></span>
                    </span>
                )}
            </div>

            <span className={`font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ease-out ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            } ${
                isRailExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}>
                {label}
            </span>
        </div>

        {isActive && !isRailExpanded && (
          <div className="absolute left-1.5 w-1 h-8 bg-white rounded-full z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-in slide-in-from-left-full duration-300" />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans select-none">
      
      <aside 
        className={`bg-slate-950 flex flex-col transition-all duration-500 ease-in-out z-50 shadow-[20px_0_40px_rgba(0,0,0,0.1)] ${
          isRailExpanded ? 'w-72' : 'w-20'
        }`}
      >
        <div className="h-24 flex items-center border-b border-slate-900 overflow-hidden shrink-0">
          <div className="w-20 flex items-center justify-center shrink-0">
            <div className={`w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-all duration-700 ${isRailExpanded ? 'rotate-0' : 'rotate-12 scale-90 hover:scale-100 hover:rotate-0 cursor-pointer'}`} onClick={() => !isRailExpanded && setIsRailExpanded(true)}>
              <GraduationCap size={24} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className={`flex-1 flex items-center justify-between pr-4 transition-opacity duration-300 ${isRailExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-white font-black text-lg tracking-tighter uppercase italic">Magister</span>
            <button 
              onClick={() => setIsRailExpanded(false)}
              className="p-2 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-xl transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {!isRailExpanded && (
            <button 
              onClick={() => setIsRailExpanded(true)}
              className="absolute -right-3 top-10 w-6 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-400 border border-slate-700 active:scale-95 shadow-lg md:hidden"
            >
              <Menu size={12} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem id="dashboard" icon={<Activity />} label="Live Feed" />
          <NavItem id="studio" icon={<PenTool />} label="Studio Hub" />
          <NavItem id="classes" icon={<School />} label="Cohort Manager" />
          <NavItem id="vault" icon={<Layers />} label="Global Vault" />
          <NavItem id="inbox" icon={<Inbox />} label="Grading Inbox" badge={true} />
          <NavItem id="analytics" icon={<BarChart2 />} label="Analytics" />
        </nav>

        <div className="p-4 border-t border-slate-900 space-y-2 shrink-0 bg-slate-950/50">
         {(userData?.role === 'admin' || userData?.role === 'org_admin') && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`relative flex items-center h-14 w-full rounded-[1.5rem] transition-all duration-300 active:scale-[0.96] group overflow-hidden ${activeTab === 'admin' ? 'bg-emerald-500/20 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.5)]' : 'hover:bg-slate-900'}`}
            >
              <div className="w-14 flex items-center justify-center shrink-0 ml-1">
                <Shield size={20} className={activeTab === 'admin' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'} />
              </div>
              <span className={`font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${activeTab === 'admin' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} ${isRailExpanded ? 'opacity-100' : 'opacity-0 -translate-x-4'}`}>
                  Command Center
              </span>
            </button>
          )}

          <button 
            onClick={onSwitchView}
            className="flex items-center h-14 w-full rounded-[1.5rem] text-slate-500 hover:bg-slate-900 hover:text-indigo-400 transition-all active:scale-[0.96] group"
          >
            <div className="w-14 flex items-center justify-center shrink-0 ml-1">
              <User size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            {isRailExpanded && <span className="font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap opacity-100 transition-opacity">Student View</span>}
          </button>

          <button 
            onClick={onLogout}
            className="flex items-center h-14 w-full rounded-[1.5rem] text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-all active:scale-[0.96] group"
          >
            <div className="w-14 flex items-center justify-center shrink-0 ml-1">
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            {isRailExpanded && <span className="font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap opacity-100 transition-opacity">Logout</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN STAGE: DYNAMIC CONTENT --- */}
      <main className="flex-1 overflow-hidden relative bg-slate-50">
        <div className="h-full w-full">
            
           {activeTab === 'admin' ? (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <AdminDashboardView user={userData} />
             </div>
           ) : activeTab === 'studio' ? (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <BuilderHub onSaveLesson={onSaveLesson} onSaveCard={onSaveCard} lessons={lessons} allDecks={allDecks} />
             </div>
           ) : activeTab === 'classes' ? (
             <div className="h-full p-6 md:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-6 duration-500">
               <ClassManagerView user={user} classes={userData?.classes || []} lessons={lessons} allDecks={allDecks} onAssign={onAssign} onRevoke={onRevoke} onCreateClass={onCreateClass} onDeleteClass={onDeleteClass} onRenameClass={onRenameClass} onAddStudent={onAddStudent} />
             </div>
           ) : activeTab === 'vault' ? (
             <div className="h-full overflow-y-auto p-6 md:p-12 custom-scrollbar animate-in slide-in-from-bottom-6 duration-500">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-200 pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Magister Engine</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">Global Vault</h2>
                            <p className="text-slate-500 font-medium max-w-xl text-lg">Deploy comprehensive, CEFR-aligned learning pathways directly to your cohorts with a single click.</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm min-w-[250px]">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Cohort</label>
                            <select 
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            >
                                <option value="" disabled>Select a class to assign...</option>
                                {userData?.classes?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {curriculums?.map((curr: any) => {
                            const activeClass = userData?.classes?.find((c: any) => c.id === selectedClassId);
                            const isAssigned = activeClass?.assignedCurriculums?.includes(curr.id);

                            return (
                                <div key={curr.id} className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden hover:border-indigo-200 transition-all shadow-sm hover:shadow-2xl group flex flex-col">
                                    <div className="h-48 relative overflow-hidden bg-slate-900">
                                        <img 
                                            src={curr.coverImage} 
                                            alt={curr.title} 
                                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" 
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span 
                                                className="px-4 py-1.5 bg-white font-black text-xs rounded-xl uppercase tracking-widest shadow-lg"
                                                style={{ color: curr.themeColor }}
                                            >
                                                {curr.level} Level
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col">
                                        <h3 className="text-2xl font-black text-slate-800 mb-3">{curr.title}</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1">
                                            {curr.description}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mb-8 text-slate-400 text-sm font-bold bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                            <BookOpen size={18} className="text-indigo-400" />
                                            {curr.lessonIds?.length || 0} Interactive Lessons
                                        </div>

                                        {!selectedClassId ? (
                                            <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest cursor-not-allowed">
                                                Select a class first
                                            </button>
                                        ) : isAssigned ? (
                                            <button disabled className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-200">
                                                <CheckCircle2 size={18} /> Active in {activeClass?.name}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onAssignCurriculum(selectedClassId, curr.id)}
                                                className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-xl active:scale-95"
                                            >
                                                Assign to {activeClass?.name}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
           ) : (
             <div className="h-full overflow-y-auto p-12 custom-scrollbar animate-in fade-in duration-700">
                <header className="mb-12">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Magister Command</span>
                  </div>
                  <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">{activeTab}</h2>
                  <div className="h-1.5 w-16 bg-indigo-600 rounded-full mt-4" />
                </header>
                
                {activeTab === 'dashboard' && <LiveActivityFeed />}
                {activeTab === 'analytics' && <AnalyticsDashboard classes={userData?.classes} />}
                {activeTab === 'inbox' && <InstructorInbox />}
             </div>
           )}
        </div>
      </main>

    </div>
  );
}
// ============================================================================
//  STUDENT NAVIGATION BAR (Floating Pill Edition)
// ============================================================================
function StudentNavBar({ activeTab, setActiveTab, activeOrg }: any) {
  const tabs = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'discovery', icon: <Compass size={24} />, label: 'Explore' },
    { id: 'flashcards', icon: <Layers size={24} />, label: 'Decks' },
    { id: 'profile', icon: <User size={24} />, label: 'Profile' }
  ];

  // 2. Define the fallback theme color (your app's default color, e.g., Indigo-600)
  const themeColor = activeOrg?.themeColor || '#4f46e5'; 

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-4 pb-8 z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-sm mx-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 transition-all duration-300 relative"
              // 3. Inject the dynamic color here!
              style={{ color: isActive ? themeColor : '#94a3b8' }} 
            >
              <div className={`transition-transform duration-300 ${isActive ? '-translate-y-2 scale-110' : 'hover:scale-110'}`}>
                {tab.icon}
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 absolute -bottom-4 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {tab.label}
              </span>

              {/* Little glowing dot under the active tab */}
              {isActive && (
                <div 
                  className="absolute -bottom-6 w-1.5 h-1.5 rounded-full shadow-lg" 
                  style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
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
// ============================================================================
//  EXAM BUILDER (Instructor Tool - Juiced Up)
// ============================================================================
function ExamBuilderView({ onSave, initialData }: any) {
    const [examData, setExamData] = useState(initialData || { 
        title: '', 
        description: '', 
        type: 'test', 
        level: 'All',
        duration: 30,
        tags: [],
        questions: [] 
    });
    const [jsonMode, setJsonMode] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Dynamic tag input state
    const [tagInput, setTagInput] = useState('');

    const totalPoints = examData.questions.reduce((sum: number, q: any) => sum + (Number(q.points) || 0), 0);

    const addQuestion = (type: string) => {
        const base = { id: Date.now().toString(), type, prompt: '', points: 10 };
        const extras = type === 'multiple-choice' ? { options: ['Option A', 'Option B'], correctAnswer: 'Option A' } 
                     : type === 'boolean' ? { correctAnswer: 'true' } 
                     : {}; // essay needs no extras
        setExamData({ ...examData, questions: [...examData.questions, { ...base, ...extras }] });
    };

    const updateQuestion = (idx: number, field: string, val: any) => {
        const newQs = [...examData.questions];
        newQs[idx] = { ...newQs[idx], [field]: val };
        setExamData({ ...examData, questions: newQs });
    };

    // Safely update an option's text while keeping the 'correctAnswer' in sync if it was selected!
    const handleOptionTextChange = (qIdx: number, optIdx: number, newText: string) => {
        const q = examData.questions[qIdx];
        const oldText = q.options[optIdx];
        const newOpts = [...q.options];
        newOpts[optIdx] = newText;
        
        let newCorrect = q.correctAnswer;
        if (q.correctAnswer === oldText) newCorrect = newText; // Sync the answer if it changed
        
        const newQs = [...examData.questions];
        newQs[qIdx] = { ...q, options: newOpts, correctAnswer: newCorrect };
        setExamData({ ...examData, questions: newQs });
    };

    const handleImport = () => {
        try {
            setJsonError(null);
            const parsed = JSON.parse(jsonInput);
            setExamData({ ...examData, ...parsed, type: 'test' });
            setJsonMode(false);
        } catch (e) { 
            setJsonError("Invalid JSON structure. Please check your syntax."); 
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!examData.tags.includes(tagInput.trim())) {
                setExamData({ ...examData, tags: [...(examData.tags || []), tagInput.trim()] });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setExamData({ ...examData, tags: examData.tags.filter((t:string) => t !== tagToRemove) });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 relative animate-in fade-in duration-500">
            {/* --- HEADER --- */}
            <div className="p-8 border-b border-slate-100 bg-white flex justify-between items-end shrink-0 sticky top-0 z-20">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Exam Builder</h2>
                    <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{examData.questions.length} Questions</span>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">{totalPoints} Total Points</span>
                    </div>
                </div>
                <button onClick={() => setJsonMode(!jsonMode)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${jsonMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                    <Code size={16} /> {jsonMode ? 'Visual Editor' : 'JSON Import'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-40">
                {jsonMode ? (
                    <div className="p-8 max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
                        {jsonError && <div className="mb-4 p-4 bg-rose-50 text-rose-600 border-2 border-rose-100 rounded-2xl font-bold text-sm">{jsonError}</div>}
                        <textarea 
                            className="w-full h-[60vh] p-6 bg-slate-900 text-emerald-400 font-mono text-sm rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-2xl" 
                            value={jsonInput} 
                            onChange={e => setJsonInput(e.target.value)} 
                            placeholder="Paste your raw JSON exam object here..." 
                        />
                        <button onClick={handleImport} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95">
                            Hydrate Exam
                        </button>
                    </div>
                ) : (
                    <div className="p-8 max-w-4xl mx-auto space-y-8">
                        
                        {/* --- METADATA SETTINGS PANEL --- */}
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                            <div className="flex items-center gap-3 text-indigo-600 mb-2">
                                <Settings size={20} /> <h3 className="font-black uppercase tracking-widest text-sm">Exam Configuration</h3>
                            </div>
                            
                            <input 
                                className="w-full text-4xl font-black text-slate-900 placeholder-slate-200 outline-none" 
                                placeholder="Exam Title" 
                                value={examData.title} 
                                onChange={e => setExamData({...examData, title: e.target.value})} 
                            />
                            <textarea 
                                className="w-full text-lg font-medium text-slate-500 placeholder-slate-300 outline-none resize-none h-14" 
                                placeholder="A brief description of what this exam evaluates..." 
                                value={examData.description} 
                                onChange={e => setExamData({...examData, description: e.target.value})} 
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><BarChart size={12}/> Target Level</label>
                                    <select value={examData.level} onChange={e => setExamData({...examData, level: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                                        <option value="All">All Levels</option>
                                        <option value="A1">A1 Beginner</option>
                                        <option value="A2">A2 Elementary</option>
                                        <option value="B1">B1 Intermediate</option>
                                        <option value="B2">B2 Upper Int.</option>
                                        <option value="C1">C1 Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><Clock size={12}/> Time Limit</label>
                                    <div className="relative">
                                        <input type="number" value={examData.duration} onChange={e => setExamData({...examData, duration: parseInt(e.target.value) || 0})} className="w-full p-3 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">min</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><Tag size={12}/> Categorization Tags</label>
                                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Type & hit enter..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            
                            {examData.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {examData.tags.map((t:string) => (
                                        <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            {t} <button onClick={() => removeTag(t)} className="hover:text-rose-500"><X size={12}/></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- QUESTION CARDS --- */}
                        <div className="space-y-6">
                            {examData.questions.map((q: any, idx: number) => (
                                <div key={q.id} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-colors animate-in slide-in-from-bottom-4">
                                    
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">{idx + 1}</div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">{q.type.replace('-', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                                                <input className="w-10 bg-transparent text-right font-black text-amber-600 outline-none" type="number" min="1" value={q.points} onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value) || 0)} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">pts</span>
                                            </div>
                                            <button onClick={() => { const n = [...examData.questions]; n.splice(idx,1); setExamData({...examData, questions: n}); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>

                                    <textarea 
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-lg text-slate-800 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[100px]" 
                                        placeholder="Type your question prompt here..." 
                                        value={q.prompt} 
                                        onChange={e => updateQuestion(idx, 'prompt', e.target.value)} 
                                    />

                                    {/* MULTIPLE CHOICE EDITOR */}
                                    {q.type === 'multiple-choice' && (
                                        <div className="space-y-3 pl-4 border-l-4 border-indigo-100">
                                            {q.options.map((opt: string, oIdx: number) => {
                                                const isCorrect = q.correctAnswer === opt;
                                                return (
                                                    <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                                                        <button 
                                                            onClick={() => updateQuestion(idx, 'correctAnswer', opt)}
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}
                                                        >
                                                            {isCorrect && <Check size={14} strokeWidth={4} />}
                                                        </button>
                                                        <input 
                                                            className={`flex-1 bg-transparent text-sm font-bold outline-none ${isCorrect ? 'text-emerald-900' : 'text-slate-700'}`} 
                                                            value={opt} 
                                                            onChange={(e) => handleOptionTextChange(idx, oIdx, e.target.value)} 
                                                            placeholder={`Option ${oIdx + 1}`}
                                                        />
                                                        {q.options.length > 2 && (
                                                            <button onClick={() => { const newOpts = q.options.filter((_:any, i:number) => i !== oIdx); updateQuestion(idx, 'options', newOpts); }} className="text-slate-300 hover:text-rose-500 p-1">
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => updateQuestion(idx, 'options', [...q.options, `New Option ${q.options.length + 1}`])} className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors uppercase tracking-widest mt-2 flex items-center gap-2">
                                                <Plus size={14} /> Add Option
                                            </button>
                                        </div>
                                    )}

                                    {/* BOOLEAN EDITOR */}
                                    {q.type === 'boolean' && (
                                        <div className="flex gap-4 pl-4 border-l-4 border-indigo-100">
                                            <button onClick={() => updateQuestion(idx, 'correctAnswer', 'true')} className={`flex-1 py-4 rounded-xl border-2 font-black text-sm transition-all flex items-center justify-center gap-2 ${q.correctAnswer === 'true' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                                {q.correctAnswer === 'true' && <CheckCircle2 size={18}/>} True
                                            </button>
                                            <button onClick={() => updateQuestion(idx, 'correctAnswer', 'false')} className={`flex-1 py-4 rounded-xl border-2 font-black text-sm transition-all flex items-center justify-center gap-2 ${q.correctAnswer === 'false' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                                {q.correctAnswer === 'false' && <CheckCircle2 size={18}/>} False
                                            </button>
                                        </div>
                                    )}

                                    {/* ESSAY EDITOR (Just info) */}
                                    {q.type === 'essay' && (
                                        <div className="pl-4 border-l-4 border-indigo-100 py-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><AlignLeft size={14}/> Student will be provided a rich-text input box.</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- ACTION DOCK (Sticky Bottom) --- */}
            {!jsonMode && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-2">
                        <button onClick={() => addQuestion('multiple-choice')} className="px-4 py-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                            <List size={16}/> M. Choice
                        </button>
                        <button onClick={() => addQuestion('boolean')} className="px-4 py-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                            <CheckCircle2 size={16}/> True/False
                        </button>
                        <button onClick={() => addQuestion('essay')} className="px-4 py-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                            <AlignLeft size={16}/> Essay
                        </button>
                    </div>

                    <button onClick={() => onSave(examData)} className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-transform active:scale-95">
                        <Save size={18} /> Publish Exam Object
                    </button>
                </div>
            )}
        </div>
    );
}
// ============================================================================
//  EXAM PLAYER (Upgraded: Timer, Intro Screen, & Syncs with Inbox)
// ============================================================================
function ExamPlayerView({ exam, onFinish }: any) {
    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [scoreDetail, setScoreDetail] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // --- TIMER STATE ---
    const [timeLeft, setTimeLeft] = useState((exam.duration || 30) * 60);

    const totalQuestions = exam?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (!started || submitted || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [started, submitted, timeLeft]);

    // Auto-submit if time runs out
    useEffect(() => {
        if (started && timeLeft <= 0 && !submitted) {
            confirmSubmit();
        }
    }, [timeLeft, started]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (qId: string, val: any) => {
        if (submitted) return;
        setAnswers({ ...answers, [qId]: val });
    };

    const confirmSubmit = () => {
        let totalPoints = 0;
        let earnedPoints = 0;
        const details: any[] = [];
        let requiresManualGrading = false;

        exam.questions.forEach((q: any) => {
            const points = parseInt(q.points || 0);
            totalPoints += points;
            const studentVal = answers[q.id];
            let isCorrect = false;
            let awarded = 0;

            if (q.type === 'multiple-choice' || q.type === 'boolean') {
                if (String(studentVal) === String(q.correctAnswer)) { 
                    awarded = points;
                    isCorrect = true;
                }
            } else if (q.type === 'essay') {
                requiresManualGrading = true;
                awarded = 0; 
            }

            details.push({ 
                qId: q.id, 
                type: q.type, 
                prompt: q.prompt, 
                maxPoints: points, 
                studentVal: studentVal || "(No Answer)", 
                correctVal: q.correctAnswer || null, 
                awardedPoints: awarded, 
                isCorrect 
            });
            earnedPoints += awarded;
        });

        const finalStatus = requiresManualGrading ? 'pending_review' : 'graded';
        // CRITICAL FIX: Add finalScorePct so the Gradebook and Inbox don't crash!
        const finalScorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        
        const result = { 
            score: earnedPoints, 
            total: totalPoints, 
            finalScorePct, 
            status: finalStatus, 
            details 
        };

        setScoreDetail(result);
        setSubmitted(true);
        setShowConfirm(false);

        // Save immediately via the parent component's function
        onFinish(exam.id, earnedPoints, exam.title, result);
    };

    if (!exam || totalQuestions === 0) return null;

    // --- SCREEN 1: INTRO SCREEN ---
    if (!started) {
        return (
            <div className="h-full flex items-center justify-center p-6 bg-slate-50 animate-in fade-in duration-500">
                <div className="bg-white max-w-xl w-full rounded-[3rem] shadow-2xl border border-slate-100 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-3 bg-indigo-500" />
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <FileText size={40} />
                    </div>
                    
                    <h1 className="text-3xl font-black text-slate-900 mb-4">{exam.title}</h1>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        {exam.description || "You are about to begin this assessment. Please ensure you have a stable connection and enough time to complete it."}
                    </p>
                    
                    <div className="flex justify-center gap-6 mb-10">
                        <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Limit</span>
                            <span className="text-xl font-black text-slate-800 flex items-center gap-2 justify-center"><Clock size={18} className="text-indigo-500"/> {exam.duration || 30} min</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Questions</span>
                            <span className="text-xl font-black text-slate-800">{totalQuestions}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => onFinish(null, 0)} className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest text-sm">
                            Cancel
                        </button>
                        <button onClick={() => setStarted(true)} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 text-sm">
                            Begin Exam
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- SCREEN 3: COMPLETED SCREEN ---
    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 animate-in zoom-in duration-300">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-slate-100 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-3 ${scoreDetail.status === 'pending_review' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ${scoreDetail.status === 'pending_review' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {scoreDetail.status === 'pending_review' ? <Clock size={48}/> : <CheckCircle2 size={48}/>}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3">Exam Submitted</h2>
                    <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                        {scoreDetail.status === 'pending_review' 
                            ? "Your written answers have been sent to your instructor for grading." 
                            : `You scored ${scoreDetail.score} out of ${scoreDetail.total} points.`}
                    </p>
                    <button onClick={() => onFinish(null, 0)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- SCREEN 2: ACTIVE EXAM (SCROLLING LIST) ---
    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative animate-in fade-in duration-500">
            
            {/* SUBMIT CONFIRMATION MODAL */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Submit Assessment?</h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">You cannot change your answers after this point.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Not yet</button>
                            <button onClick={confirmSubmit} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* STICKY HEADER */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <FileText size={20} className="text-indigo-600"/> {exam.title}
                    </h1>
                </div>

                {/* PROGRESS BAR & TIMER */}
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{answeredCount} / {totalQuestions}</span>
                    </div>

                    <div className={`px-4 py-2 rounded-xl font-black flex items-center gap-2 border-2 ${timeLeft < 60 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* SCROLLING QUESTIONS */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-40 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                    {exam.questions.map((q: any, i: number) => {
                        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';

                        return (
                            <div key={q.id} className={`bg-white p-6 md:p-8 rounded-[2rem] border-2 shadow-sm transition-colors duration-300 ${isAnswered ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${isAnswered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        Question {i + 1}
                                    </span>
                                    <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                                        {q.points} pts
                                    </span>
                                </div>
                                
                                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-tight">
                                    {q.prompt}
                                </h3>
                                
                                {/* MULTIPLE CHOICE */}
                                {q.type === 'multiple-choice' && (
                                    <div className="space-y-3">
                                        {q.options.map((opt: string) => (
                                            <button 
                                                key={opt} 
                                                onClick={() => handleAnswer(q.id, opt)} 
                                                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-bold flex justify-between items-center group ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-300'}`}>
                                                        {answers[q.id] === opt && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                    {opt}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {/* TRUE / FALSE */}
                                {q.type === 'boolean' && (
                                    <div className="flex gap-4">
                                        {['true', 'false'].map((val) => (
                                            <button 
                                                key={val} 
                                                onClick={() => handleAnswer(q.id, val)} 
                                                className={`flex-1 p-6 rounded-2xl border-2 font-black text-lg capitalize transition-all flex items-center justify-center gap-3 ${answers[q.id] === val ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'}`}
                                            >
                                                {answers[q.id] === val && <CheckCircle2 size={24} className="text-indigo-600" />}
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {/* ESSAY */}
                                {q.type === 'essay' && (
                                    <textarea 
                                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none h-48 resize-none font-medium text-slate-700 text-lg transition-all" 
                                        placeholder="Type your answer here..." 
                                        value={answers[q.id] || ''} 
                                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* STICKY FOOTER */}
            <div className="bg-white/90 backdrop-blur-md p-6 border-t border-slate-200 absolute bottom-0 left-0 right-0 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">
                        {answeredCount === totalQuestions ? 'All questions answered. Ready to submit?' : 'Please answer all questions before submitting.'}
                    </p>
                    <button 
                        onClick={() => setShowConfirm(true)} 
                        className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${answeredCount === totalQuestions ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                    >
                        Submit Exam <Send size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
}
// ============================================================================
//  ADMIN DASHBOARD: THE FRANCHISE EDITION (SaaS Multi-Tenant)
// ============================================================================
function AdminDashboardView({ user, activeOrg }: any) {
  // 1. IDENTITY & PERMISSIONS
    const isSuperAdmin = user.role === 'admin';
    const isOrgAdmin = user.role === 'org_admin';
    const userOrgId = user.orgId || null;

    // 2. NAVIGATION STATE
    const [activeTab, setActiveTab] = useState<any>(isSuperAdmin ? 'overview' : 'cohorts');
    
    // 3. REAL-TIME DATA STATE
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [allCohorts, setAllCohorts] = useState<any[]>([]);
    const [globalLogs, setGlobalLogs] = useState<any[]>([]);
    const [allContent, setAllContent] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);

    // 4. UI & INTERACTION STATE
    const [directorySearch, setDirectorySearch] = useState('');
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultFilters, setVaultFilters] = useState<string[]>(['lesson', 'exam', 'arcade']);
    const [selectedVaultItems, setSelectedVaultItems] = useState<string[]>([]);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    
    // B2B FRANCHISE STATES
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [newOrg, setNewOrg] = useState({ name: '', logoUrl: '', themeColor: '#4f46e5' });
    const [isProvisioning, setIsProvisioning] = useState(false);
    
    // NEW: EDITING STATE
    const [editingOrg, setEditingOrg] = useState<any | null>(null);
    
    // DEEP DIVE SELECTIONS
    const [selectedInstructorUid, setSelectedInstructorUid] = useState<string | null>(null);
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [selectedContentId, setSelectedContentId] = useState<string | null>(null); 
    const [deployingContent, setDeployingContent] = useState<any | null>(null);
    const [deploySelectedCohorts, setDeploySelectedCohorts] = useState<string[]>([]);
    const [isDeploying, setIsDeploying] = useState(false);

    // INPUTS
    const [bulkTagInput, setBulkTagInput] = useState('');
    const [inspectorTagInput, setInspectorTagInput] = useState('');

    // FEEDBACK
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
    const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ msg, type });
    const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    // 5. THE SCOPED DATA ENGINE
    useEffect(() => {
        const qProfiles = isSuperAdmin ? query(collectionGroup(db, 'profile')) : query(collectionGroup(db, 'profile'), where('orgId', '==', userOrgId));
        const unsubProfiles = onSnapshot(qProfiles, (snap) => setAllProfiles(snap.docs.map(d => ({ uid: d.ref.path.split('/')[3], ...d.data() }))));

        const qClasses = isSuperAdmin ? query(collectionGroup(db, 'classes')) : query(collectionGroup(db, 'classes'), where('orgId', '==', userOrgId));
        const unsubClasses = onSnapshot(qClasses, (snap) => setAllCohorts(snap.docs.map(d => ({ id: d.id, _instructorUid: d.ref.path.split('/')[3], ...d.data() }))));

        const qLogs = isSuperAdmin ? query(collection(db, 'artifacts', appId, 'activity_logs'), where('scoreDetail.status', '==', 'pending_review')) : query(collection(db, 'artifacts', appId, 'activity_logs'), where('orgId', '==', userOrgId), where('scoreDetail.status', '==', 'pending_review'));
        const unsubLogs = onSnapshot(qLogs, (snap) => setGlobalLogs(snap.docs.map(d => d.data())));

        const qContent = isSuperAdmin ? query(collectionGroup(db, 'custom_lessons')) : query(collectionGroup(db, 'custom_lessons'), where('orgId', 'in', ['global', userOrgId]));
        const unsubContent = onSnapshot(qContent, (snap) => setAllContent(snap.docs.map(d => ({ id: d.id, _instructorUid: d.ref.path.split('/')[3], ...d.data() }))));

        let unsubOrgs = () => {};
        if (isSuperAdmin) {
            const qOrgs = query(collection(db, 'artifacts', appId, 'organizations'));
            unsubOrgs = onSnapshot(qOrgs, (snap) => {
                setOrganizations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            });
        } else { setLoading(false); }

        return () => { unsubProfiles(); unsubClasses(); unsubLogs(); unsubContent(); unsubOrgs(); };
    }, [userOrgId, isSuperAdmin]);

    // 6. ACTION HANDLERS
    const handleProvisionOrg = async () => {
        if (!newOrg.name.trim()) return;
        setIsProvisioning(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'organizations'), { ...newOrg, createdAt: Date.now() });
            setShowOrgModal(false);
            setNewOrg({ name: '', logoUrl: '', themeColor: '#4f46e5' });
            triggerToast("B2B Organization Provisioned!", 'success');
        } catch (e) { triggerToast("Provisioning failed.", 'error'); }
        setIsProvisioning(false);
    };

    // NEW: Handle Saving an Edited Organization
    const handleSaveOrgEdit = async () => {
        if (!editingOrg || !editingOrg.name.trim()) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'organizations', editingOrg.id), {
                name: editingOrg.name,
                logoUrl: editingOrg.logoUrl,
                themeColor: editingOrg.themeColor
            });
            setEditingOrg(null);
            triggerToast("Organization updated successfully.", "success");
        } catch (e) {
            triggerToast("Failed to update organization.", "error");
        }
    };

    const assignUserToOrg = async (uid: string, orgId: string) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main'), {
                orgId: orgId === 'global' ? null : orgId
            });
            if (orgId !== 'global') {
                triggerToast("Entered Preview Mode. Data is now scoped.", 'info');
            } else {
                triggerToast("Returned to Global View.", 'success');
            }
        } catch (e) { triggerToast("Migration failed.", 'error'); }
    };

    const deleteOrganization = (orgId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents the card click (edit) from triggering
        setConfirmModal({
            title: "Dissolve Organization",
            message: "CRITICAL WARNING: This will dissolve the tenant. Users assigned to this org will fall back to the Global Pool.",
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'artifacts', appId, 'organizations', orgId));
                    triggerToast("Organization dissolved.", 'success');
                } catch (e) { triggerToast("Failed to delete org.", 'error'); }
                setConfirmModal(null);
            }
        });
    };

    // ... (Keep existing toggleUserRole, handleGlobalBroadcast, forceDeleteCohort, etc.) ...
    const toggleUserRole = (uid: string, currentRole: string) => {
        const roles = isSuperAdmin ? ['student', 'instructor', 'org_admin', 'admin'] : ['student', 'instructor', 'org_admin'];
        const currentIndex = roles.indexOf(currentRole);
        const nextRole = roles[(currentIndex + 1) % roles.length];
        setConfirmModal({
            title: "Update Permissions", message: `Promote/Demote user to ${nextRole.toUpperCase()}?`,
            onConfirm: async () => {
                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main'), { role: nextRole });
                    if (selectedInstructorUid === uid && nextRole === 'student') setSelectedInstructorUid(null);
                    triggerToast(`Role updated to ${nextRole}`);
                } catch (e) { triggerToast("Update failed", "error"); }
                setConfirmModal(null);
            }
        });
    };

    const handleGlobalBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'global_announcements'), {
                message: broadcastMsg.trim(), authorName: user.displayName || 'System Admin', timestamp: Date.now(), active: true, type: 'system_alert', orgId: isSuperAdmin ? 'global' : userOrgId
            });
            setBroadcastMsg(''); setShowBroadcastModal(false); triggerToast("Alert broadcasted successfully!", 'success');
        } catch (error) { triggerToast("Failed to send broadcast.", 'error'); }
        setIsBroadcasting(false);
    };

    const forceDeleteCohort = (instructorUid: string, classId: string) => {
        setConfirmModal({
            title: "Nuke Cohort", message: "Permanently delete this classroom? This cannot be undone.",
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'artifacts', appId, 'users', instructorUid, 'classes', classId));
                    setSelectedCohortId(null); triggerToast("Cohort deleted.", 'success');
                } catch (e) { triggerToast("Delete failed.", 'error'); }
                setConfirmModal(null);
            }
        });
    };

    const forceRemoveStudent = (instructorUid: string, classId: string, studentEmail: string, studentObj: any) => {
        setConfirmModal({
            title: "Remove Student", message: `Are you sure you want to forcibly remove ${studentEmail} from this active roster?`,
            onConfirm: async () => {
                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', instructorUid, 'classes', classId), { studentEmails: arrayRemove(studentEmail), students: arrayRemove(studentObj) });
                    triggerToast("Student removed from roster.", 'success');
                } catch (e) { triggerToast("Failed to remove student.", 'error'); }
                setConfirmModal(null);
            }
        });
    };

    const forceDeleteContent = (instructorUid: string, contentId: string) => {
        setConfirmModal({
            title: "Nuke Curriculum", message: "CRITICAL WARNING: This will permanently delete this item from the platform.",
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'artifacts', appId, 'users', instructorUid, 'custom_lessons', contentId));
                    setSelectedContentId(null); triggerToast("Curriculum nuked.", 'success');
                } catch (e) { triggerToast("Failed to delete content.", 'error'); }
                setConfirmModal(null);
            }
        });
    };

    const handleBulkDelete = () => {
        setConfirmModal({
            title: "Bulk Nuke", message: `Permanently wipe ${selectedVaultItems.length} items from the platform?`,
            onConfirm: async () => {
                try {
                    const deletePromises = selectedVaultItems.map(id => {
                        const item = allContent.find(c => c.id === id);
                        if (item) return deleteDoc(doc(db, 'artifacts', appId, 'users', item._instructorUid, 'custom_lessons', id));
                    });
                    await Promise.all(deletePromises);
                    const count = selectedVaultItems.length; setSelectedVaultItems([]); triggerToast(`Purged ${count} items.`, 'success');
                } catch (e) { triggerToast("Error during deletion.", 'error'); }
                setConfirmModal(null);
            }
        });
    };

    const handleAddSingleTag = async (instructorUid: string, contentId: string) => {
        if (!inspectorTagInput.trim()) return;
        try { await updateDoc(doc(db, 'artifacts', appId, 'users', instructorUid, 'custom_lessons', contentId), { tags: arrayUnion(inspectorTagInput.trim().toLowerCase()) }); triggerToast(`Tag added.`, 'info'); setInspectorTagInput(''); } 
        catch (e) { triggerToast("Failed to add tag.", 'error'); }
    };

    const handleRemoveSingleTag = async (instructorUid: string, contentId: string, tagToRemove: string) => {
        try { await updateDoc(doc(db, 'artifacts', appId, 'users', instructorUid, 'custom_lessons', contentId), { tags: arrayRemove(tagToRemove) }); triggerToast(`Tag removed.`, 'info'); } 
        catch (e) { triggerToast("Failed to remove tag.", 'error'); }
    };

    const handleBulkTagAdd = async () => {
        if (!bulkTagInput.trim()) return;
        const tag = bulkTagInput.trim().toLowerCase();
        try {
            const tagPromises = selectedVaultItems.map(id => {
                const item = allContent.find(c => c.id === id);
                if (item) return updateDoc(doc(db, 'artifacts', appId, 'users', item._instructorUid, 'custom_lessons', id), { tags: arrayUnion(tag) });
            });
            await Promise.all(tagPromises); setBulkTagInput(''); triggerToast(`Tag '${tag}' applied.`, 'success');
        } catch (e) { triggerToast("Tagging failed.", 'error'); }
    };

    const executeDeployment = async () => {
        if (!deployingContent || deploySelectedCohorts.length === 0) return;
        setIsDeploying(true);
        try {
            const pushPromises = deploySelectedCohorts.map(cohortId => {
                const cohort = allCohorts.find(c => c.id === cohortId);
                if (!cohort) return Promise.resolve();
                return updateDoc(doc(db, 'artifacts', appId, 'users', cohort._instructorUid, 'classes', cohort.id), { assignments: arrayUnion(deployingContent.id) });
            });
            await Promise.all(pushPromises);
            setDeployingContent(null); setDeploySelectedCohorts([]); setSelectedContentId(null); triggerToast(`Pushed to ${deploySelectedCohorts.length} cohorts.`, 'success');
        } catch (error) { triggerToast("Deployment failed.", 'error'); }
        setIsDeploying(false);
    };

    const toggleVaultFilter = (type: string) => setVaultFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const toggleVaultItemSelection = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedVaultItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
    const toggleCohortSelection = (id: string) => setDeploySelectedCohorts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    // 7. DERIVED UI DATA
    const studentsCount = allProfiles.filter(p => p.role === 'student').length;
    const instructorsCount = allProfiles.filter(p => p.role === 'instructor' || p.role === 'org_admin' || p.role === 'admin').length;
    
    const populatedCohorts = allCohorts.map(cohort => {
        const inst = allProfiles.find(i => i.uid === cohort._instructorUid);
        return { ...cohort, instructorName: inst?.name || 'Unknown', studentCount: cohort.students?.length || 0 };
    });

    const populatedInstructors = allProfiles.filter(p => p.role === 'instructor' || p.role === 'org_admin' || p.role === 'admin').map(inst => {
        const theirCohorts = allCohorts.filter(c => c._instructorUid === inst.uid);
        const theirStudentEmails = theirCohorts.flatMap(c => c.studentEmails || []);
        const theirPendingGrades = globalLogs.filter(log => theirStudentEmails.includes(log.studentEmail)).length;
        const totalStudentsManaged = theirCohorts.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);
        return { ...inst, activeCohorts: theirCohorts.length, ungradedItems: theirPendingGrades, totalStudentsManaged, theirCohorts };
    });

    const populatedContent = allContent.map(item => {
        const author = allProfiles.find(i => i.uid === item._instructorUid);
        return { ...item, authorName: author?.name || 'Unknown Author' };
    });

    const filteredProfiles = allProfiles.filter(p => `${p.name} ${p.email}`.toLowerCase().includes(directorySearch.toLowerCase()));

    const filteredContent = populatedContent.filter(c => {
        const matchesSearch = !vaultSearch || `${c.title} ${(c.tags || []).join(' ')} ${c.authorName}`.toLowerCase().includes(vaultSearch.toLowerCase());
        const mappedType = c.type === 'arcade_game' ? 'arcade' : (c.type === 'exam' || c.type === 'test' ? 'exam' : 'lesson');
        return matchesSearch && vaultFilters.includes(mappedType);
    });

    if (loading) return <div className="h-full flex flex-col items-center justify-center text-emerald-500 bg-slate-50"><Loader className="animate-spin mb-4" size={40} /><p className="font-black uppercase tracking-widest text-[10px]">Synchronizing Multi-Tenant State...</p></div>;

    const activeInstructor = populatedInstructors.find(i => i.uid === selectedInstructorUid);
    const activeCohort = populatedCohorts.find(c => c.id === selectedCohortId);
    const activeContent = populatedContent.find(c => c.id === selectedContentId);

    // Identify if the Super Admin is currently ghosting an org
    const previewingOrgData = organizations.find(o => o.id === userOrgId);

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
            
            {/* OVERLAY: TOASTS */}
            {toast && <div className="absolute top-0 left-0 w-full z-[4000] flex justify-center pointer-events-none"><JuicyToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}

            {/* NEW: THE GHOST MODE BANNER */}
            {isSuperAdmin && userOrgId && userOrgId !== 'global' && previewingOrgData && (
                <div 
                    onClick={() => assignUserToOrg(user.uid, 'global')}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors z-[100]"
                >
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Previewing Tenant: {previewingOrgData.name}. Click here to exit and return to Global Pool.
                    </span>
                </div>
            )}

            {/* OVERLAY: CONFIRMATION MODAL */}
            {confirmModal && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertTriangle size={32} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">{confirmModal.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={confirmModal.onConfirm} className="flex-[1.5] py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-rose-200 active:scale-95 transition-all">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY: PROVISION ORG MODAL */}
            {showOrgModal && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95">
                        <button onClick={() => setShowOrgModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><Briefcase size={28} /></div>
                            <div><h2 className="text-2xl font-black text-slate-900 leading-tight">New Franchise</h2><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Provision B2B Tenant</p></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Organization Name</label><input type="text" value={newOrg.name} onChange={e => setNewOrg({...newOrg, name: e.target.value})} placeholder="e.g. Texas Culinary Institute" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500" /></div>
                            <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Logo URL (Optional)</label><input type="text" value={newOrg.logoUrl} onChange={e => setNewOrg({...newOrg, logoUrl: e.target.value})} placeholder="https://..." className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500" /></div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Brand Theme Color</label>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200"><input type="color" value={newOrg.themeColor} onChange={e => setNewOrg({...newOrg, themeColor: e.target.value})} className="w-10 h-10 border-none cursor-pointer bg-transparent" /><span className="font-mono text-sm font-black text-slate-600 uppercase">{newOrg.themeColor}</span></div>
                            </div>
                            <button onClick={handleProvisionOrg} disabled={!newOrg.name.trim() || isProvisioning} className="w-full mt-4 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">{isProvisioning ? <Loader size={18} className="animate-spin" /> : <Shield size={18} />} Initialize Tenant</button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW OVERLAY: EDIT ORG MODAL */}
            {editingOrg && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95">
                        <button onClick={() => setEditingOrg(null)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><Briefcase size={28} /></div>
                            <div><h2 className="text-2xl font-black text-slate-900 leading-tight">Edit Franchise</h2><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Tenant Settings</p></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Organization Name</label><input type="text" value={editingOrg.name} onChange={e => setEditingOrg({...editingOrg, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500" /></div>
                            <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Logo URL (Optional)</label><input type="text" value={editingOrg.logoUrl || ''} onChange={e => setEditingOrg({...editingOrg, logoUrl: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500" /></div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Brand Theme Color</label>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200"><input type="color" value={editingOrg.themeColor || '#4f46e5'} onChange={e => setEditingOrg({...editingOrg, themeColor: e.target.value})} className="w-10 h-10 border-none cursor-pointer bg-transparent" /><span className="font-mono text-sm font-black text-slate-600 uppercase">{editingOrg.themeColor || '#4f46e5'}</span></div>
                            </div>
                            <button onClick={handleSaveOrgEdit} disabled={!editingOrg.name.trim()} className="w-full mt-4 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* KEEP EXISTING OVERLAYS (Broadcast, Dossier, Inspector, Matrices) */}
            {/* OVERLAY: GLOBAL BROADCAST MODAL */}
            {showBroadcastModal && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowBroadcastModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner"><Megaphone size={28} /></div>
                            <div><h2 className="text-2xl font-black text-slate-900">System Broadcast</h2><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{isSuperAdmin ? 'Global Alert' : 'Tenant Alert'}</p></div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3"><AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-xs font-bold text-amber-800 leading-relaxed">Warning: This message will be pushed to {isSuperAdmin ? 'all users across all organizations' : 'all users in your organization'}.</p></div>
                            <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none h-32" placeholder="Type your system announcement here..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                            <button onClick={handleGlobalBroadcast} disabled={!broadcastMsg.trim() || isBroadcasting} className="w-full py-5 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isBroadcasting ? <Loader size={18} className="animate-spin" /> : <Send size={18} />} Push to Network
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY: INSTRUCTOR DOSSIER MODAL */}
            {activeInstructor && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-950 p-8 flex justify-between items-start shrink-0 relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-xl border-4 border-slate-800">{activeInstructor.name?.charAt(0).toUpperCase() || 'I'}</div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2"><h2 className="text-3xl font-black text-white">{activeInstructor.name}</h2><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${activeInstructor.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>{activeInstructor.role}</span></div>
                                    <p className="text-slate-400 font-bold flex items-center gap-2"><Mail size={14}/> {activeInstructor.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInstructorUid(null)} className="p-2 bg-white/10 text-white/50 hover:text-white hover:bg-rose-500 rounded-full transition-all relative z-10"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 flex flex-col md:flex-row gap-8 custom-scrollbar">
                            <div className="w-full md:w-1/3 space-y-6 shrink-0">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Impact Metrics</h3>
                                    <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><School size={16} className="text-indigo-500"/> Cohorts</div><span className="font-black text-slate-900 text-lg">{activeInstructor.activeCohorts}</span></div>
                                    <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Users size={16} className="text-emerald-500"/> Students</div><span className="font-black text-slate-900 text-lg">{activeInstructor.totalStudentsManaged}</span></div>
                                    <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><FileText size={16} className="text-amber-500"/> To Grade</div><span className={`font-black text-lg ${activeInstructor.ungradedItems > 20 ? 'text-rose-600' : 'text-slate-900'}`}>{activeInstructor.ungradedItems}</span></div>
                                </div>
                                <div className="space-y-3">
                                    <a href={`mailto:${activeInstructor.email}`} className="w-full py-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-2xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2 group"><Mail size={18} className="group-hover:scale-110 transition-transform"/> Message Instructor</a>
                                    {activeInstructor.role !== 'admin' && ( <button onClick={() => toggleUserRole(activeInstructor.uid, activeInstructor.role)} className="w-full py-4 bg-white border-2 border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2"><Shield size={18}/> Manage Permissions</button> )}
                                </div>
                            </div>
                            <div className="w-full md:w-2/3">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><School size={18} className="text-indigo-500"/> Managed Cohorts</h3>
                                {activeInstructor.theirCohorts.length === 0 ? ( <div className="p-8 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200"><p className="text-slate-400 font-bold">This instructor has not created any cohorts yet.</p></div> ) : (
                                    <div className="space-y-3">
                                        {activeInstructor.theirCohorts.map((c: any) => (
                                            <div key={c.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-lg">{c.name}</h4>
                                                    <div className="flex gap-3 mt-1"><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">ID: {c.code || c.id.substring(0, 6)}</span><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><Users size={10}/> {c.students?.length || 0}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY: COHORT GOVERNANCE INSPECTOR */}
            {activeCohort && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/80">
                            <div>
                                <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><BookOpen size={20}/></div><h2 className="text-2xl font-black text-slate-900">{activeCohort.name}</h2></div>
                                <div className="flex gap-2"><span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md uppercase tracking-widest">Code: {activeCohort.code}</span><span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md uppercase tracking-widest">Prof: {activeCohort.instructorName}</span></div>
                            </div>
                            <button onClick={() => setSelectedCohortId(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-full transition-all shadow-sm"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> Student Roster Auditing</h3>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    {(!activeCohort.students || activeCohort.students.length === 0) ? ( <div className="p-8 text-center text-slate-400 font-bold text-sm bg-slate-50/50">Roster is empty.</div> ) : (
                                        <div className="divide-y divide-slate-100">
                                            {activeCohort.students.map((studentObj: any, idx: number) => {
                                                const email = studentObj.email || studentObj; 
                                                const name = studentObj.name || 'Pending Registration';
                                                return (
                                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs">{name.charAt(0).toUpperCase()}</div><div><p className="font-bold text-slate-800 text-sm leading-none mb-1">{name}</p><p className="text-[10px] text-slate-400 font-bold">{email}</p></div></div>
                                                        <button onClick={() => forceRemoveStudent(activeCohort._instructorUid, activeCohort.id, email, studentObj)} className="text-xs font-black text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-200">Force Remove</button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <button onClick={() => forceDeleteCohort(activeCohort._instructorUid, activeCohort.id)} className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-rose-100 text-rose-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"><Trash2 size={16}/> Delete Cohort</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY: CONTENT VAULT DEPLOYMENT MATRIX & INSPECTOR */}
            {activeContent && (
                <div className="absolute inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    {deployingContent ? (
                        /* MATRIX VIEW */
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="p-8 border-b border-slate-100 bg-indigo-600 text-white relative overflow-hidden shrink-0">
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                                <button onClick={() => setDeployingContent(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={24}/></button>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><Zap size={20}/></div>
                                    <h2 className="text-2xl font-black">Global Deployment Matrix</h2>
                                </div>
                                <p className="text-indigo-200 text-sm font-medium">Targeting cohorts for: <span className="text-white font-bold">{deployingContent.title}</span></p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Target Cohorts</h3>
                                    <button onClick={() => setDeploySelectedCohorts(deploySelectedCohorts.length === populatedCohorts.length ? [] : populatedCohorts.map(c => c.id))} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                        {deploySelectedCohorts.length === populatedCohorts.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {populatedCohorts.length === 0 ? (
                                        <p className="text-center text-slate-400 italic py-10">No active cohorts to deploy to.</p>
                                    ) : (
                                        populatedCohorts.map(cohort => {
                                            const isSelected = deploySelectedCohorts.includes(cohort.id);
                                            return (
                                                <button key={cohort.id} onClick={() => toggleCohortSelection(cohort.id)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all text-left group ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                                                    <div>
                                                        <h4 className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{cohort.name}</h4>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-2"><User size={10}/> {cohort.instructorName} • {cohort.students?.length || 0} Students</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                                        {isSelected && <Check size={12} strokeWidth={4}/>}
                                                    </div>
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                                <div className="text-sm font-bold text-slate-500"><span className="text-indigo-600 font-black">{deploySelectedCohorts.length}</span> targets selected</div>
                                <button onClick={executeDeployment} disabled={deploySelectedCohorts.length === 0 || isDeploying} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {isDeploying ? <Loader size={16} className="animate-spin"/> : <Send size={16}/>} Initialize Push
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* VAULT INSPECTOR VIEW */
                        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/80 relative overflow-hidden shrink-0">
                                <div className={`absolute top-0 left-0 w-2 h-full ${activeContent.type === 'arcade_game' ? 'bg-amber-500' : activeContent.type === 'exam' || activeContent.type === 'test' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Content Inspector</span>
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{activeContent.title || 'Untitled Content'}</h2>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><User size={14} className="text-indigo-500"/> Created by {activeContent.authorName}</div>
                                </div>
                                <button onClick={() => setSelectedContentId(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-full transition-all shadow-sm relative z-10"><X size={20}/></button>
                            </div>
                            <div className="p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Architecture</span>
                                        <span className="font-bold text-slate-800 capitalize">{activeContent.type === 'arcade_game' ? 'Arcade Game' : activeContent.type || 'Standard Lesson'}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Complexity</span>
                                        <span className="font-bold text-slate-800">{activeContent.blocks?.length || activeContent.questions?.length || 0} Modules</span>
                                    </div>
                                </div>
                                
                                {/* TAG MANAGER */}
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> Content Tags</span>
                                    <div className="flex flex-wrap gap-2">
                                        {(!activeContent.tags || activeContent.tags.length === 0) && <span className="text-xs font-bold text-slate-400 italic">No tags assigned.</span>}
                                        {activeContent.tags?.map((tag: string) => (
                                            <div key={tag} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600 shadow-sm">
                                                {tag}
                                                <button onClick={() => handleRemoveSingleTag(activeContent._instructorUid, activeContent.id, tag)} className="text-slate-300 hover:text-rose-500"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Add a new tag..." value={inspectorTagInput} onChange={(e) => setInspectorTagInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleAddSingleTag(activeContent._instructorUid, activeContent.id); }} className="flex-1 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                                        <button onClick={() => handleAddSingleTag(activeContent._instructorUid, activeContent.id)} disabled={!inspectorTagInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-colors">Add</button>
                                    </div>
                                </div>
                                <button onClick={() => setDeployingContent(activeContent)} className="w-full py-5 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 hover:text-white transition-colors shadow-sm flex items-center justify-center gap-2 group">
                                    <Zap size={16} className="group-hover:scale-125 transition-transform" /> Deploy to Network
                                </button>
                            </div>
                            <div className="p-6 bg-rose-50/50 border-t border-rose-100 flex flex-col items-center text-center shrink-0">
                                <button onClick={() => forceDeleteContent(activeContent._instructorUid, activeContent.id)} className="text-rose-500 font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1"><Trash2 size={12}/> Delete from Platform</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

           {/* ============================================================== */}
            {/* MAIN ADMIN DASHBOARD UI (DYNAMICALLY BRANDED HEADER) */}
            {/* ============================================================== */}

            <header 
                className="h-24 bg-slate-900 px-6 md:px-10 flex justify-between items-center shrink-0 z-30 shadow-xl"
                style={activeOrg ? { borderBottom: `4px solid ${activeOrg.themeColor}` } : {}}
            >
                <div className="flex items-center gap-4">
                    {/* DYNAMIC LOGO INJECTION */}
                    {activeOrg?.logoUrl ? (
                        <img src={activeOrg.logoUrl} alt="Tenant Logo" className="w-12 h-12 bg-white rounded-2xl object-contain p-1 border-2 border-slate-700" />
                    ) : (
                        <div 
                            className="w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)]" 
                            style={{ backgroundColor: activeOrg?.themeColor || '#10b981' }}
                        >
                            {activeOrg ? <Briefcase size={24} /> : <Shield size={24} />}
                        </div>
                    )}
                    
                    {/* DYNAMIC TITLE INJECTION */}
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                            {activeOrg ? activeOrg.name : (isSuperAdmin ? 'Command Center' : 'Org Portal')}
                        </h2>
                        <p 
                            className="text-[9px] font-black uppercase tracking-[0.3em] mt-1" 
                            style={{ color: activeOrg?.themeColor || '#34d399' }}
                        >
                            {activeOrg ? 'Tenant Environment' : (isSuperAdmin ? 'Global Access' : 'Tenant Management')}
                        </p>
                    </div>
                </div>
                
                {/* NAVIGATION TABS */}
                <div className="flex bg-slate-800 p-1.5 rounded-[1.5rem] overflow-x-auto hide-scrollbar">
                    {[ 
                        isSuperAdmin && { id: 'overview', label: 'Global' }, 
                        isSuperAdmin && { id: 'franchise', label: 'B2B Orgs' }, 
                        { id: 'cohorts', label: 'Cohorts' }, 
                        { id: 'instructors', label: 'Staff' }, 
                        { id: 'directory', label: 'Directory' }, 
                        { id: 'vault', label: 'The Vault' } 
                    ].filter(Boolean).map((tab:any) => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            // Injecting active state color dynamically!
                            style={activeTab === tab.id ? { backgroundColor: activeOrg?.themeColor || '#10b981' } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative">
                <div className="max-w-6xl mx-auto space-y-12 pb-48">

                    {/* OVERVIEW TAB (Super Admin Only) */}
                    {activeTab === 'overview' && isSuperAdmin && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard icon={<Users size={24} className="text-indigo-500"/>} label="Global Enrollment" value={studentsCount} trend="Active Profiles" color="indigo" />
                                <MetricCard icon={<Briefcase size={24} className="text-purple-500"/>} label="Active Franchises" value={organizations.length} trend="B2B Organizations" color="indigo" />
                                <MetricCard icon={<BookOpen size={24} className="text-emerald-500"/>} label="Global Cohorts" value={populatedCohorts.length} trend="Deployed Classes" color="emerald" />
                                <MetricCard icon={<AlertCircle size={24} className="text-rose-500"/>} label="Global Pending" value={globalLogs.length} trend="Exams awaiting grades" color="rose" />
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div><h3 className="text-2xl font-black text-slate-900 mb-1">System Global Broadcast</h3><p className="text-sm font-bold text-slate-500">Push an alert to every single user on the platform.</p></div>
                                <button onClick={() => setShowBroadcastModal(true)} className="w-full md:w-auto px-8 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-xs"><Megaphone size={18} /> Send Alert</button>
                            </div>
                        </div>
                    )}

                    {/* FRANCHISE ENGINE TAB (Super Admin Only) */}
                    {activeTab === 'franchise' && isSuperAdmin && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                                <div><h3 className="text-2xl font-black text-slate-900">Franchise Engine</h3><p className="text-sm font-bold text-slate-500 max-w-lg mt-2 leading-relaxed">Provision isolated B2B environments. Users assigned to an organization enter a walled garden with branded styling.</p></div>
                                <button onClick={() => setShowOrgModal(true)} className="w-full md:w-auto px-8 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-xs"><Plus size={18} /> Provision Org</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {organizations.map(org => {
                                    const orgUsersCount = allProfiles.filter(p => p.orgId === org.id).length;
                                    return (
                                        <div 
                                            key={org.id} 
                                            onClick={() => setEditingOrg(org)}
                                            className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all cursor-pointer"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-2 transition-all" style={{ backgroundColor: org.themeColor || '#4f46e5' }} />
                                            <div className="flex justify-between items-start mb-6">
                                                {org.logoUrl ? <img src={org.logoUrl} alt={org.name} className="w-16 h-16 object-contain rounded-xl border border-slate-100 p-1" /> : <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xl border border-slate-200">{org.name.charAt(0).toUpperCase()}</div>}
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">ID: {org.id.substring(0,6)}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">{org.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><Users size={12}/> {orgUsersCount} Users Assigned</p>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                                                <button onClick={(e) => deleteOrganization(org.id, e)} className="w-full py-2 bg-slate-50 text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-colors">Dissolve</button>
                                                <button onClick={(e) => { e.stopPropagation(); assignUserToOrg(user.uid, org.id); }} className="w-full py-2 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-colors">Preview Mode</button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {organizations.length === 0 && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]"><Briefcase size={48} className="mx-auto text-slate-300 mb-4" /><h3 className="text-lg font-black text-slate-800">No Active Franchises</h3><p className="text-sm font-bold text-slate-400 mt-1">The platform is currently operating in Global Pool mode.</p></div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* COHORTS TAB (Scoped) */}
                    {activeTab === 'cohorts' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div><h3 className="text-2xl font-black text-slate-900">Platform Deployments</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{isOrgAdmin || userOrgId !== 'global' ? 'Local Tenant View' : 'Global Network View'}</p></div>
                                <div className="text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">Click a row to audit</div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-slate-100">
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Name</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Roster</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">System ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {populatedCohorts.length === 0 ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">No cohorts found in this environment.</td></tr>
                                    ) : (
                                        populatedCohorts.map(cohort => (
                                            <tr key={cohort.id} onClick={() => setSelectedCohortId(cohort.id)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                                <td className="p-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm"><BookOpen size={16} /></div><div><span className="font-black text-slate-800 text-sm block group-hover:text-indigo-600 transition-colors">{cohort.name}</span><span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 inline-block">{(cohort.assignments?.length || 0)} Units Assigned</span></div></div></td>
                                                <td className="p-6 font-bold text-slate-600 text-sm">{cohort.instructorName}</td>
                                                <td className="p-6 text-center"><span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black group-hover:bg-white group-hover:border group-hover:border-slate-200 transition-colors">{cohort.studentCount} <Users size={12} className="inline ml-1 opacity-50"/></span></td>
                                                <td className="p-6 flex items-center justify-between"><span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{cohort.id.substring(0,8)}</span><ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100" /></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* INSTRUCTORS TAB (Scoped) */}
                    {activeTab === 'instructors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                            {populatedInstructors.map(inst => (
                                <button key={inst.uid} onClick={() => setSelectedInstructorUid(inst.uid)} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all relative overflow-hidden text-left group">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500 group-hover:h-3 transition-all" />
                                    <div className="flex items-start justify-between mb-6 mt-2"><div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform">{inst.name?.charAt(0).toUpperCase() || 'I'}</div><span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Shield size={10} /> {inst.role}</span></div>
                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{inst.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 mb-6 truncate">{inst.email}</p>
                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-6">
                                        <div className="bg-slate-50 p-3 rounded-xl text-center group-hover:bg-white group-hover:shadow-sm transition-colors"><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cohorts</span><span className="text-xl font-black text-slate-700">{inst.activeCohorts}</span></div>
                                        <div className={`p-3 rounded-xl text-center transition-colors ${inst.ungradedItems > 0 ? 'bg-amber-50 text-amber-600 group-hover:shadow-sm' : 'bg-slate-50 text-slate-700 group-hover:bg-white group-hover:shadow-sm'}`}><span className="block text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Backlog</span><span className="text-xl font-black">{inst.ungradedItems}</span></div>
                                    </div>
                                </button>
                            ))}
                            {populatedInstructors.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 font-bold">No instructors found in this environment.</div>}
                        </div>
                    )}

                    {/* DIRECTORY TAB (Scoped & Routed) */}
                    {activeTab === 'directory' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
                                <div><h3 className="text-2xl font-black text-slate-900">User Directory</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Access Control</p></div>
                                <div className="relative w-full md:w-72"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search name or email..." value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all" /></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
                                            {isSuperAdmin && organizations.length > 0 && <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">B2B Routing (Tenant)</th>}
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredProfiles.length === 0 ? (
                                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">No users found.</td></tr>
                                        ) : (
                                            filteredProfiles.map(profile => (
                                                <tr key={profile.uid} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="p-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center border border-slate-200 shadow-inner shrink-0">{profile.name?.charAt(0).toUpperCase() || '?'}</div><div><span className="font-black text-slate-800 text-sm block">{profile.name || "Pending Setup"}</span><span className="text-[10px] font-bold text-slate-400">{profile.email}</span></div></div></td>
                                                    <td className="p-6"><button onClick={() => toggleUserRole(profile.uid, profile.role)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${profile.role === 'admin' ? 'bg-slate-900 text-amber-400 cursor-not-allowed' : profile.role === 'org_admin' ? 'bg-purple-600 text-white' : profile.role === 'instructor' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'}`} disabled={profile.role === 'admin'}>{profile.role}</button></td>
                                                    {isSuperAdmin && organizations.length > 0 && (
                                                        <td className="p-6">
                                                            <select value={profile.orgId || 'global'} onChange={(e) => assignUserToOrg(profile.uid, e.target.value)} className="w-full max-w-[200px] p-2.5 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
                                                                <option value="global">🌍 Global Pool</option>
                                                                {organizations.map(o => <option key={o.id} value={o.id}>🏢 {o.name}</option>)}
                                                            </select>
                                                        </td>
                                                    )}
                                                    <td className="p-6 text-right">{profile.isOnboarded ? <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest">Active</span> : <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-widest">Pending</span>}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* VAULT TAB (Scoped & Filterable) */}
                    {activeTab === 'vault' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                            <div className="p-8 border-b border-slate-100 flex flex-col gap-6 bg-slate-50/50">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div><h3 className="text-2xl font-black text-slate-900">The Curriculum Vault</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{isOrgAdmin || userOrgId !== 'global' ? 'Tenant Library' : 'Global Repository'}</p></div>
                                    <div className="relative w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search title, author, or tags..." value={vaultSearch} onChange={(e) => setVaultSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all" /></div>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-200/60 pt-4">
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center">Filter By:</span>
                                        {[ { id: 'lesson', label: 'Lessons', icon: <BookOpen size={12}/> }, { id: 'exam', label: 'Exams', icon: <FileText size={12}/> }, { id: 'arcade', label: 'Arcade', icon: <Gamepad2 size={12}/> } ].map(f => (
                                            <button key={f.id} onClick={() => toggleVaultFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border ${vaultFilters.includes(f.id) ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{f.icon} {f.label}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => setSelectedVaultItems(selectedVaultItems.length === filteredContent.length ? [] : filteredContent.map(c => c.id))} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors">{selectedVaultItems.length === filteredContent.length ? 'Deselect All' : 'Select All Visible'}</button>
                                </div>
                            </div>
                            <div className="p-8">
                                {filteredContent.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem]"><Database size={48} className="mb-4 opacity-50" /><p className="text-center font-bold text-sm text-slate-400">No curriculum found matching your query.</p></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredContent.map(content => {
                                            const isArcade = content.type === 'arcade_game';
                                            const isExam = content.type === 'exam' || content.type === 'test';
                                            const themeColor = isArcade ? 'amber' : isExam ? 'rose' : 'indigo';
                                            const isSelected = selectedVaultItems.includes(content.id);
                                            return (
                                                <div key={content.id} onClick={() => setSelectedContentId(content.id)} className={`relative p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col justify-between group cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50/30 shadow-lg ring-4 ring-indigo-500/10' : `border-slate-100 bg-white hover:border-${themeColor}-300 hover:shadow-xl`}`}>
                                                    <button onClick={(e) => toggleVaultItemSelection(content.id, e)} className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-md' : 'bg-white border-slate-200 text-transparent hover:border-indigo-400 opacity-0 group-hover:opacity-100'}`}><Check size={14} strokeWidth={4} /></button>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4 pr-8">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-colors bg-${themeColor}-50 text-${themeColor}-600 group-hover:bg-${themeColor}-600 group-hover:text-white`}><BookOpen size={24} /></div>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${content.orgId === 'global' || !content.orgId ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{content.orgId === 'global' || !content.orgId ? 'Global Baseline' : 'Internal Content'}</span>
                                                        </div>
                                                        <h4 className={`font-black text-slate-800 text-lg leading-tight mb-2 group-hover:text-${themeColor}-600 transition-colors`}>{content.title || 'Untitled Module'}</h4>
                                                        {content.tags && content.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {content.tags.slice(0, 3).map((t:string) => <span key={t} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase border border-slate-200">{t}</span>)}
                                                                {content.tags.length > 3 && <span className="text-[9px] font-bold text-slate-400">+{content.tags.length - 3}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 w-full"><span className="flex items-center gap-1 truncate pr-2"><User size={12}/> {content.authorName}</span></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            
                            {/* FLOATING BULK DOCK FOR VAULT */}
                            {selectedVaultItems.length > 0 && (
                                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50] animate-in slide-in-from-bottom-8 duration-300 w-[90%] max-w-3xl">
                                    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-3 pr-4 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 pl-3 w-full md:w-auto shrink-0">
                                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0">{selectedVaultItems.length}</div>
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Selected</span>
                                        </div>
                                        <div className="hidden md:block h-8 w-px bg-slate-700" />
                                        <div className="flex items-center w-full bg-slate-800/50 rounded-xl border border-slate-700 p-1">
                                            <div className="pl-3 pr-2 text-slate-400"><Tag size={14}/></div>
                                            <input type="text" placeholder="Add bulk tag..." value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleBulkTagAdd(); }} className="flex-1 bg-transparent border-none text-xs font-bold text-white placeholder:text-slate-500 outline-none min-w-[100px]" />
                                            <button onClick={handleBulkTagAdd} disabled={!bulkTagInput.trim()} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 shrink-0">Apply</button>
                                        </div>
                                        <div className="hidden md:block h-8 w-px bg-slate-700" />
                                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                            <button onClick={() => setSelectedVaultItems([])} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">Clear</button>
                                            <button onClick={handleBulkDelete} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"><Trash2 size={14}/> Nuke</button>
                                        </div>
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
// Helper Component for the Admin Overview Bento Box
function MetricCard({ icon, label, value, trend, color }: any) {
    const bgColors: any = { 
        indigo: 'bg-indigo-50', 
        emerald: 'bg-emerald-50', 
        rose: 'bg-rose-50', 
        amber: 'bg-amber-50' 
    };
    
    const textColors: any = { 
        indigo: 'text-indigo-600', 
        emerald: 'text-emerald-600', 
        rose: 'text-rose-600', 
        amber: 'text-amber-600' 
    };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-48 group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${bgColors[color]}`}>
                    {icon}
                </div>
                <TrendingUp size={16} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-end gap-3">
                    <span className={`text-4xl font-black leading-none ${textColors[color]}`}>{value}</span>
                    <span className="text-xs font-bold text-slate-400 mb-1">{trend}</span>
                </div>
            </div>
        </div>
    );
}
// ============================================================================
//  ARCADE BUILDER (Phase 1: Game Template Configurator)
// ============================================================================
function ArcadeBuilderView({ data, setData, availableDecks = [] }: any) {
    
    // Ensure data has default structure if fresh
    const gameData = {
        title: data?.title || '',
        description: data?.description || '',
        gameTemplate: data?.gameTemplate || 'connect-three',
        targetScore: data?.targetScore || 3,
        mode: data?.mode || 'pvp', // 'pvp' (Pass & Play) or 'pvc' (Player vs CPU)
        deckIds: data?.deckIds || [],
        ...data
    };

    // 🛡️ BULLETPROOF ARRAYS: Converts objects/nulls into safe arrays so .map() and .includes() never crash
    const safeDecks = Array.isArray(availableDecks) ? availableDecks : Object.values(availableDecks || {});
    const safeDeckIds = Array.isArray(gameData.deckIds) ? gameData.deckIds : [];

    const updateField = (field: string, value: any) => {
        setData({ ...gameData, [field]: value });
    };

    const toggleDeck = (deckId: string) => {
        if (safeDeckIds.includes(deckId)) {
            updateField('deckIds', safeDeckIds.filter((id: string) => id !== deckId));
        } else {
            updateField('deckIds', [...safeDeckIds, deckId]);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-64 animate-in fade-in duration-500">
            
            {/* 1. GAME META */}
            <div className="space-y-4 px-2">
                <input 
                    className="text-5xl md:text-6xl font-black border-none w-full focus:ring-0 p-0 placeholder:text-slate-200 tracking-tighter bg-transparent" 
                    placeholder="Game Title..." 
                    value={gameData.title} 
                    onChange={e => updateField('title', e.target.value)} 
                />
                <input 
                    className="text-xl md:text-2xl font-bold text-slate-400 border-none w-full focus:ring-0 p-0 tracking-tight bg-transparent" 
                    placeholder="Short description or instructions..." 
                    value={gameData.description} 
                    onChange={e => updateField('description', e.target.value)} 
                />
            </div>

            {/* 2. CHASSIS / TEMPLATE SELECTOR */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                    <Gamepad2 size={14} /> Select Game Chassis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => updateField('gameTemplate', 'connect-three')}
                        className={`p-6 rounded-[2rem] border-4 text-left transition-all ${gameData.gameTemplate === 'connect-three' ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${gameData.gameTemplate === 'connect-three' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Gamepad2 size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-1">Connect Three</h4>
                        <p className="text-xs font-bold text-slate-500 leading-snug">A strategic 4x5 grid battle powered by rapid vocabulary recall.</p>
                    </button>

                    {/* Coming Soon Template to show scale */}
                    <div className="p-6 rounded-[2rem] border-4 border-dashed border-slate-100 bg-slate-50/50 text-left opacity-70">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-slate-200 text-slate-400">
                            <Plus size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 mb-1">Word Invaders</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">In Development</p>
                    </div>
                </div>
            </div>

            {/* 3. RULESET CONFIGURATOR */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                    <Settings size={14} /> Ruleset & Mechanics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Opponent Toggle */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 block">Opponent Type</label>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <button 
                                onClick={() => updateField('mode', 'pvp')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${gameData.mode === 'pvp' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Users size={16}/> Pass & Play
                            </button>
                            <button 
                                onClick={() => updateField('mode', 'pvc')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${gameData.mode === 'pvc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Bot size={16}/> vs CPU
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 leading-tight px-1">
                            {gameData.mode === 'pvp' ? 'Best for projector live sessions or shared iPads.' : 'Best for individual homework assignments.'}
                        </p>
                    </div>

                    {/* Win Condition Slider */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            Target Score to Win
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg flex items-center gap-1">
                                <Trophy size={14}/> {gameData.targetScore}
                            </span>
                        </label>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={gameData.targetScore} 
                            onChange={(e) => updateField('targetScore', parseInt(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <span>Sudden Death (1)</span>
                            <span>Marathon (10)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. DECK BINDING (The Ammo) */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> Connect Vocabulary Decks
                    </h3>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">
                        {safeDeckIds.length} Linked
                    </span>
                </div>
                
                {safeDecks.length === 0 ? (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center">
                        <p className="text-sm font-bold text-rose-600">No decks found in the Scriptorium. Create some flashcards first!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        {safeDecks.map((deck: any) => {
                            const isLinked = safeDeckIds.includes(deck.id);
                            return (
                                <button 
                                    key={deck.id}
                                    onClick={() => toggleDeck(deck.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isLinked ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                                >
                                    <div>
                                        <h4 className={`font-bold text-sm ${isLinked ? 'text-indigo-900' : 'text-slate-700'}`}>{deck.title}</h4>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isLinked ? 'text-indigo-400' : 'text-slate-400'}`}>
                                            {deck.cards?.length || 0} Terms
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isLinked ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}`}>
                                        {isLinked && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            
        </div>
    );
}
interface MarketingSiteProps {
    onLoginClick: () => void;
    onBookDemoClick?: () => void;
}

function MarketingSite({ onLoginClick, onBookDemoClick }: MarketingSiteProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activePage, setActivePage] = useState('home'); // FIXED: Added missing state

    // Creates the glassmorphism effect when scrolling down
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // FIXED: Extracted Nav into a sub-component so it doesn't break the return tree
    const Nav = () => (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* LOGO */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('home')}>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
                        M
                    </div>
                    <span className="text-xl font-black tracking-widest uppercase text-white">Magister<span className="text-indigo-500">OS</span></span>
                </div>

                {/* DESKTOP LINKS */}
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300 uppercase tracking-widest">
                    <button onClick={() => setActivePage('home')} className="hover:text-white transition-colors">Filosofía</button>
                    <button onClick={() => setActivePage('platform')} className="hover:text-white transition-colors">Plataforma</button>
                    <button onClick={() => setActivePage('pricing')} className="hover:text-white transition-colors">Inversión</button>
                </div>

                {/* DESKTOP ACTIONS (LOGIN & DEMO) */}
                <div className="hidden md:flex items-center gap-4">
                    <button 
                        onClick={onLoginClick}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest group"
                    >
                        <LogIn size={16} className="group-hover:text-indigo-400 transition-colors" />
                        Iniciar Sesión
                    </button>
                    
                    <button 
                        onClick={onBookDemoClick}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-full transition-all uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        Piloto de 14 Días
                    </button>
                </div>

                {/* MOBILE MENU TOGGLE */}
                <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 py-6 px-6 flex flex-col gap-6 shadow-2xl">
                    <button onClick={onLoginClick} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 rounded-xl font-bold text-white uppercase tracking-widest border border-white/5">
                        <LogIn size={18} />
                        Iniciar Sesión
                    </button>
                    <button onClick={onBookDemoClick} className="w-full py-4 bg-indigo-600 rounded-xl font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                        Solicitar Piloto
                    </button>
                </div>
            )}
        </nav>
    );

    const Footer = () => (
        <footer className="bg-slate-950 py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield size={24} className="text-indigo-500" />
                        <span className="text-2xl font-black text-white tracking-tighter">MAGISTER<span className="text-indigo-500">OS</span></span>
                    </div>
                    <p className="text-slate-400 font-medium max-w-sm">El sistema operativo de aprendizaje de marca blanca diseñado para academias de inglés de élite en Latinoamérica.</p>
                </div>
                <div>
                    <h4 className="text-white font-black mb-4 uppercase tracking-widest text-xs">Producto</h4>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setActivePage('platform')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">El Entorno Privado</button>
                        <button onClick={() => setActivePage('platform')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Bóveda Global de Inglés</button>
                        <button onClick={() => setActivePage('platform')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Gimnasio de Vocabulario</button>
                    </div>
                </div>
                <div>
                    <h4 className="text-white font-black mb-4 uppercase tracking-widest text-xs">Empresa</h4>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setActivePage('pricing')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Planes y Precios</button>
                        <a href="#" className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Contactar a Ventas</a>
                    </div>
                </div>
            </div>
        </footer>
    );

    // ==========================================
    // PÁGINA 1: INICIO
    // ==========================================
    if (activePage === 'home') return (
        <div className="min-h-screen bg-slate-900 font-sans selection:bg-indigo-500/30">
            <Nav />
            {/* HERO */}
            <main className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10 pt-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-widest mb-8">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> El Estándar para Academias en LatAm
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8">
                        Deja de alquilar herramientas genéricas.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">Sé dueño de tu campus digital.</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                        Implementa al instante una plataforma de aprendizaje premium, diseñada para móviles y con la marca de tu academia. Reduce la deserción de alumnos, automatiza las calificaciones y accede a un currículo de inglés de clase mundial.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)]">
                            Inicia tu Prueba Piloto
                        </button>
                        <button onClick={() => setActivePage('platform')} className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <PlayCircle size={18} /> Explora la Plataforma
                        </button>
                    </div>
                </div>

                {/* DASHBOARD PREVIEW MOCKUP */}
                <div className="max-w-6xl mx-auto mt-20 relative z-10">
                    <div className="aspect-[16/9] bg-slate-950 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
                        <div className="text-slate-600 font-black flex flex-col items-center gap-4">
                            <Shield size={64} className="opacity-50" />
                            [ CAPTURA DE PANTALLA DE ALTA FIDELIDAD AQUÍ ]
                        </div>
                    </div>
                </div>
            </main>

            {/* NUEVA SECCIÓN: LA FILOSOFÍA MAGISTER */}
            <section className="py-32 bg-slate-950 border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-6">
                            Nuestra Filosofía
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Construido por educadores, para la academia moderna.</h2>
                        <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
                            Creemos que la tecnología no debe reemplazar la enseñanza, sino potenciarla. Magister OS alinea los objetivos del estudiante, el profesor y el director en un solo ecosistema.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* PILAR 1: EL ESTUDIANTE */}
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition-colors group">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={28}/>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3">La Experiencia del Alumno</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Fluidez impulsada por la motivación, no por la memorización. Transformamos el estudio pasivo en una experiencia interactiva y dinámica que los alumnos realmente disfrutan, logrando una retención del idioma más rápida y resultados comprobables.
                            </p>
                        </div>

                        {/* PILAR 2: EL PROFESOR */}
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors group">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen size={28}/>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3">Empoderamiento Docente</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                La tecnología debe liberar tiempo, no consumirlo. Aceleramos la planeación de clases y eliminamos horas de trabajo manual para que tus instructores enfoquen su energía en lo más importante: su presencia, entrega y conexión en el aula.
                            </p>
                        </div>

                        {/* PILAR 3: EL ADMINISTRADOR */}
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors group">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                <BarChart3 size={28}/>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3">Rentabilidad y Retención</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Deja de adivinar el estado de tu negocio. Brindamos a la dirección métricas claras y accionables sobre el progreso de los alumnos y el desempeño docente, facilitando la retención de estudiantes y garantizando la satisfacción de tu equipo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );

    // ==========================================
    // PÁGINA 2: PLATAFORMA / FUNCIONES
    // ==========================================
    if (activePage === 'platform') return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Nav />
            <main className="pt-40 pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h1 className="text-5xl font-black text-white tracking-tight mb-6">El Motor SaaS en tu Interior.</h1>
                        <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Explora la arquitectura privada que mantiene tus datos aislados, tu marca en primer plano y a tus profesores con el control absoluto.</p>
                    </div>

                    {/* FUNCIÓN 1: MARCA BLANCA */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                        <div className="order-2 lg:order-1 aspect-square bg-slate-800 rounded-[3rem] border border-slate-700 flex items-center justify-center p-12 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
                             <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col p-6 z-10">
                                 <div className="flex gap-4 mb-8">
                                     <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black">AI</div>
                                     <div><div className="h-4 w-32 bg-slate-700 rounded mb-2"/><div className="h-3 w-20 bg-slate-800 rounded"/></div>
                                 </div>
                                 <div className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700 border-dashed" />
                             </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-4">Arquitectura Multi-Cliente</div>
                            <h2 className="text-4xl font-black text-white mb-6">Tu Entorno Privado.</h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                Al registrarte, Magister OS crea una base de datos aislada exclusivamente para tu academia. Tus alumnos nunca verán nuestra marca. Inician sesión en una interfaz inyectada dinámicamente con los colores, el logotipo y el diseño personalizado de tu escuela.
                            </p>
                            <ul className="space-y-4">
                                {['Aislamiento de datos al 100% entre academias', 'Inyección dinámica de colores CSS y diseño', 'Terminología personalizada (ej. cambia "Clases" por "Grupos")'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium"><CheckCircle2 size={20} className="text-emerald-500" /> {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* FUNCIÓN 2: CENTRO DE MANDO */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="text-purple-400 font-black text-xs uppercase tracking-widest mb-4">Control Académico</div>
                            <h2 className="text-4xl font-black text-white mb-6">El Centro de Mando.</h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                Dale a tu director académico visibilidad total. Monitorea el progreso de cada alumno, observa el rendimiento de los grupos en tiempo real y gestiona los permisos de todo tu personal docente desde un solo panel.
                            </p>
                            <ul className="space-y-4">
                                {['Auditoría global de listas y directorio', 'Implementación de currículo a grupos con un clic', 'Alertas y comunicados a todo el sistema'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium"><CheckCircle2 size={20} className="text-emerald-500" /> {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="aspect-square bg-slate-800 rounded-[3rem] border border-slate-700 flex items-center justify-center p-12 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/20 to-transparent" />
                             <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 z-10 grid grid-cols-2 gap-4">
                                 <div className="bg-slate-800 rounded-xl p-4 flex flex-col justify-end"><div className="text-3xl font-black text-white">420</div><div className="text-[10px] text-slate-400 uppercase font-black">Alumnos Activos</div></div>
                                 <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-end"><div className="text-3xl font-black text-purple-400">12</div><div className="text-[10px] text-purple-400/70 uppercase font-black">Por Calificar</div></div>
                                 <div className="col-span-2 bg-slate-800 rounded-xl p-4" />
                             </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );

    // ==========================================
    // PÁGINA 3: PRECIOS (ENFOQUE LATAM)
    // ==========================================
    if (activePage === 'pricing') return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Nav />
            <main className="pt-40 pb-32 px-6">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h1 className="text-5xl font-black text-white tracking-tight mb-6">Poder empresarial.<br/>Precios independientes.</h1>
                    <p className="text-xl text-slate-400 font-medium">Precios mensuales fijos diseñados para la economía de las academias en América Latina. Sin licencias abusivas "por usuario". Retorno de inversión predecible.</p>
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* TIER 1 */}
                    <div className="bg-slate-800/50 rounded-[3rem] border border-slate-700 p-10 flex flex-col">
                        <h3 className="text-2xl font-black text-white mb-2">Academia en Crecimiento</h3>
                        <p className="text-slate-400 font-medium mb-8 h-12">Perfecto para tutores independientes y centros de idiomas boutique.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-white">$149</span>
                            <span className="text-slate-500 font-bold"> / mes (USD)</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Hasta 100 Alumnos Activos', 'Acceso a la Bóveda Global de Currículo', 'Centro de Mando para Instructores', 'Soporte estándar por correo'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium"><CheckCircle2 size={20} className="text-slate-600" /> {feat}</li>
                            ))}
                        </ul>
                        <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-colors">Comienza tu Prueba Gratis</button>
                    </div>

                    {/* TIER 2 (PREMIUM) */}
                    <div className="bg-indigo-600 rounded-[3rem] border border-indigo-500 p-10 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                        <div className="absolute top-6 right-6 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">Más Popular</div>
                        <h3 className="text-2xl font-black text-white mb-2">Campus Premium</h3>
                        <p className="text-indigo-200 font-medium mb-8 h-12">Para escuelas establecidas listas para escalar y ser dueñas de su marca.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-white">$299</span>
                            <span className="text-indigo-300 font-bold"> / mes (USD)</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Hasta 250 Alumnos Activos', 'Marca Blanca Completa (Tu Logo y Colores)', 'Diseños de Navegación Personalizados', 'Soporte prioritario por WhatsApp', 'Roles dedicados para Directores de Sede'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-white font-medium"><CheckCircle2 size={20} className="text-indigo-300" /> {feat}</li>
                            ))}
                        </ul>
                        <button className="w-full py-4 bg-white hover:bg-slate-50 text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-colors shadow-xl">Contactar a Ventas</button>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto mt-20 text-center p-8 bg-slate-800/30 rounded-3xl border border-slate-700/50">
                    <div className="inline-block p-3 bg-emerald-500/10 rounded-full mb-4"><Zap size={24} className="text-emerald-400" /></div>
                    <h4 className="text-xl font-black text-white mb-2">Nuestra Garantía de ROI</h4>
                    <p className="text-slate-400 font-medium">Si Magister OS evita que tan solo dos alumnos se den de baja este mes gracias a una mejor retención, la plataforma se paga sola.</p>
                </div>
            </main>
            <Footer />
        </div>
    );

    return null; // Fallback
}

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
