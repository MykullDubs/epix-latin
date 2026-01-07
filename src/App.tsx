import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, 
  increment, writeBatch, deleteDoc, arrayUnion, query, where, collectionGroup, 
  orderBy, limit 
} from "firebase/firestore";
import { 
  BookOpen, Layers, User, Home, Check, X, Zap, ChevronRight, Search, Volume2, 
  Puzzle, MessageSquare, GraduationCap, PlusCircle, Save, Feather, ChevronDown, 
  PlayCircle, Award, Trash2, Plus, FileText, Brain, Loader, LogOut, UploadCloud, 
  School, Users, Copy, List, ArrowRight, LayoutDashboard, ArrowLeft, Library, 
  Pencil, Image, Info, Edit3, AlertTriangle, FlipVertical, HelpCircle, 
  CheckCircle2, Circle, Activity, Clock, Compass, Globe, RotateCcw, Play, 
  Maximize2, BarChart2, Timer, Megaphone, Inbox, XCircle, ChevronUp, Send
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

// --- DEFAULTS ---
const DEFAULT_USER_DATA = { name: "Discipulus", targetLanguage: "Latin", level: "Novice", streak: 1, xp: 0, role: 'student', classes: [], completedAssignments: [] };

// --- SEED DATA ---
const INITIAL_SYSTEM_DECKS: any = {
  salutationes: { title: "👋 Salutationes", cards: [{ id: 's1', front: "Salve", back: "Hello (Singular)", ipa: "/ˈsal.weː/", type: "phrase", mastery: 4, morphology: [{ part: "Salv-", meaning: "Health", type: "root" }, { part: "-e", meaning: "Imp. Sing.", type: "suffix" }], usage: { sentence: "Salve, Marce!", translation: "Hello, Marcus!" }, grammar_tags: ["Imperative", "Greeting"] }, { id: 's2', front: "Salvete", back: "Hello (Plural)", ipa: "/salˈweː.te/", type: "phrase", mastery: 3, morphology: [{ part: "Salv-", meaning: "Health", type: "root" }, { part: "-ete", meaning: "Imp. Pl.", type: "suffix" }], usage: { sentence: "Salvete, discipuli!", translation: "Hello, students!" }, grammar_tags: ["Imperative", "Greeting"] }, { id: 's3', front: "Vale", back: "Goodbye", ipa: "/ˈwa.leː/", type: "phrase", mastery: 3, morphology: [{ part: "Val-", meaning: "Be strong", type: "root" }, { part: "-e", meaning: "Imp.", type: "suffix" }], usage: { sentence: "Vale, amice.", translation: "Goodbye, friend." }, grammar_tags: ["Valediction"] }] },
  medicina: { title: "⚕️ Medicina", cards: [{ id: 'm1', front: "Vulnus", back: "Wound", ipa: "/ˈwul.nus/", type: "noun", mastery: 1, morphology: [{ part: "Vuln-", meaning: "Wound", type: "root" }, { part: "-us", meaning: "Nom.", type: "suffix" }], usage: { sentence: "Vulnus grave est.", translation: "The wound is serious." }, grammar_tags: ["3rd Declension"] }] }
};

const INITIAL_SYSTEM_LESSONS: any[] = [
  { id: 'l1', title: "Salutationes", subtitle: "Greetings in the Forum", description: "Learn how to greet friends and elders.", xp: 50, vocab: ['Salve', 'Vale', 'Quid agis?'], blocks: [{ type: 'text', title: 'The Basics', content: 'In Latin, we distinguish between addressing one person ("Salve") and multiple people ("Salvete").' }, { type: 'dialogue', lines: [ { speaker: "Marcus", text: "Salve, Iulia!", translation: "Hello, Julia!", side: "left" }, { speaker: "Iulia", text: "Salve, Marce.", translation: "Hello, Marcus.", side: "right" } ] }, { type: 'quiz', question: "How do you say 'Hello' to a group?", options: [{ id: 'a', text: "Salve" }, { id: 'b', text: "Salvete" }, { id: 'c', text: "Vale" }], correctId: 'b' }] }
];

const TYPE_COLORS: any = { verb: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' }, noun: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }, adverb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }, phrase: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }, adjective: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' } };

// --- ANALYTICS HOOK ---
const useLearningTimer = (user: any, activityId: string, activityType: string, title: string) => {
    useEffect(() => {
        if (!user || !activityId) return;
        const startTime = Date.now();
        return () => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            if (durationSec > 5) {
                try { addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: user.displayName || user.email.split('@')[0], studentEmail: user.email, itemTitle: title || 'Unknown', itemId: activityId, type: 'time_log', activityType, duration: durationSec, timestamp: Date.now() }); } catch (e) { console.error("Log error", e); }
            }
        };
    }, [user, activityId]);
};

// --- HELPER COMPONENTS ---
function Toast({ message, onClose }: any) {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-white/10"><Check size={16} className="text-emerald-400" /> <span className="text-sm font-medium tracking-wide">{message}</span></div>);
}

function Header({ title, subtitle, rightAction, onClickTitle, sticky = true }: any) {
  return (<div className={`px-6 pt-12 pb-6 bg-white ${sticky ? 'sticky top-0' : ''} z-40 border-b border-slate-100 flex justify-between items-end`}><div onClick={onClickTitle} className={onClickTitle ? "cursor-pointer active:opacity-60 transition-opacity" : ""}><h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">{title} {onClickTitle && <ChevronDown size={20} className="text-slate-400" />}</h1>{subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}</div>{rightAction}</div>);
}

// ============================================================================
//  1. LESSON VIEW & SUB-COMPONENTS
// ============================================================================

const ConceptCardBlock = ({ front, back, context, onInteraction }: any) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [status, setStatus] = useState<'neutral' | 'success' | 'missed'>('neutral');
    const handleFlip = () => { if (!isFlipped) { setIsFlipped(true); if (onInteraction) onInteraction(); } };
    const handleRating = (rating: 'success' | 'missed', e: any) => { e.stopPropagation(); setStatus(rating); };
    return (
        <div className="my-8 w-full max-w-md mx-auto">
            {context && (<div className="mb-3 flex items-center gap-2 text-indigo-900/70 font-bold text-sm uppercase tracking-wide animate-in fade-in slide-in-from-bottom-2"><Zap size={14} className="text-amber-500 fill-amber-500"/>{context}</div>)}
            <div onClick={handleFlip} className={`relative h-64 w-full rounded-3xl cursor-pointer perspective-1000 group transition-all duration-300 ${status === 'success' ? 'ring-4 ring-emerald-100' : status === 'missed' ? 'ring-4 ring-rose-100' : ''}`}>
                <div className="relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-3xl" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border-2 border-slate-100 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><HelpCircle size={24}/></div><h3 className="text-2xl font-black text-slate-800 leading-tight">{front}</h3><p className="absolute bottom-6 text-xs font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Tap to Reveal</p></div>
                    <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-white relative overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${status === 'success' ? 'bg-emerald-500' : status === 'missed' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                        <div className="relative z-10 flex flex-col items-center w-full h-full justify-center"><span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Answer</span><h3 className="text-2xl font-bold mb-6">{back}</h3><div className="w-full grid grid-cols-2 gap-3 mt-4"><button onClick={(e) => handleRating('missed', e)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${status === 'missed' ? 'bg-rose-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white/70 hover:bg-rose-500/50'}`}><X size={14}/> I missed it</button><button onClick={(e) => handleRating('success', e)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${status === 'success' ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white/70 hover:bg-emerald-500/50'}`}><Check size={14}/> I knew it</button></div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const JuicyDeckBlock = ({ items, title }: any) => {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const currentCard = items[index];
    const handleSwipe = (dir: number) => { setIsFlipped(false); setTimeout(() => { setIndex((prev) => (prev + dir + items.length) % items.length); }, 200); };
    return (
        <div className="my-8 w-[90%] max-w-sm mx-auto relative">
            <div className="flex justify-between items-center mb-4 px-2"><h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layers size={14}/> {title || "Flashcards"}</h4><div className="flex gap-1">{items.map((_:any, i:number) => <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-200'}`} />)}</div></div>
            <div className="group h-64 cursor-pointer relative perspective-1000" onClick={() => setIsFlipped(!isFlipped)}><div className="relative w-full h-full transition-all duration-500 transform-style-3d" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}><div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><span className="absolute top-4 left-4 text-[10px] font-bold text-slate-300 uppercase">Term</span><h3 className="text-2xl font-black text-slate-800">{currentCard.term || currentCard.front}</h3><p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-medium uppercase tracking-widest">Tap to Flip</p></div><div className="absolute inset-0 bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-white text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase">Definition</span><p className="text-lg font-medium leading-relaxed relative z-10">{currentCard.definition || currentCard.back}</p></div></div><div className="absolute top-2 left-2 w-full h-full bg-slate-100 rounded-2xl -z-10 border border-slate-200 shadow-sm transform rotate-2"></div></div>
            <div className="flex justify-between items-center mt-6 px-4"><button onClick={() => handleSwipe(-1)} className="p-3 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm active:scale-95"><ArrowLeft size={20}/></button><div className="text-xs font-bold text-slate-400">{index + 1} / {items.length}</div><button onClick={() => handleSwipe(1)} className="p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-indigo-600 active:scale-95"><ArrowRight size={20}/></button></div>
        </div>
    );
};

const ScenarioBlock = ({ block, onComplete }: any) => {
    const [currentNodeId, setCurrentNodeId] = useState(block.nodes[0].id);
    const [history, setHistory] = useState<string[]>([]);
    const currentNode = block.nodes.find((n:any) => n.id === currentNodeId);
    if (!currentNode) return <div className="p-4 bg-red-50 text-red-500">Error: Broken Scenario Link</div>;
    const isEnd = !currentNode.options || currentNode.options.length === 0 || currentNode.options[0].nextNodeId === 'end';
    const bgColors: any = { neutral: 'bg-slate-900', success: 'bg-emerald-900', failure: 'bg-rose-900', critical: 'bg-amber-900' };
    const borderColor = currentNode.color === 'success' ? 'border-emerald-500' : currentNode.color === 'failure' ? 'border-rose-500' : 'border-slate-700';
    return (
        <div className={`${bgColors[currentNode.color || 'neutral']} text-white rounded-3xl overflow-hidden shadow-2xl border-4 ${borderColor} my-8 transition-colors duration-500`}>
            {currentNode.imageUrl && (<div className="h-48 w-full overflow-hidden relative"><div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10"/><img src={currentNode.imageUrl} alt="Scene" className="w-full h-full object-cover"/></div>)}
            <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-20"><span className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">{currentNode.speaker ? <User size={14}/> : <Brain size={14}/>} {currentNode.speaker || 'Scene'}</span>{history.length > 0 && <button onClick={() => { setCurrentNodeId(block.nodes[0].id); setHistory([]); }} className="text-xs text-white/50 hover:text-white flex items-center gap-1"><RotateCcw size={12}/> Restart</button>}</div>
            <div className="p-6 relative z-20 min-h-[100px] flex items-center"><p className="text-xl font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">"{currentNode.text}"</p></div>
            <div className="bg-black/20 p-2 grid gap-2 backdrop-blur-sm">{!isEnd ? currentNode.options.map((opt:any, i:number) => (<button key={i} onClick={() => { setHistory([...history, currentNode.text]); setCurrentNodeId(opt.nextNodeId); }} className="w-full p-4 text-left bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold text-sm border border-white/5 hover:border-white/30 flex justify-between items-center group"><span>{opt.text}</span><ArrowRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity"/></button>)) : (<button onClick={onComplete} className="w-full p-4 bg-white text-slate-900 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse shadow-lg">Complete Scenario <Check size={16}/></button>)}</div>
        </div>
    );
};

const QuizBlock = ({ block, onComplete }: any) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const isCorrect = selected === block.correctId;
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-start gap-2"><span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><HelpCircle size={16}/></span>{block.question}</h3>
            <div className="space-y-2">{block.options.map((opt:any) => { let style = "border-slate-200 hover:bg-slate-50"; if (submitted) { if (opt.id === block.correctId) style = "bg-emerald-100 border-emerald-500 text-emerald-800 font-bold"; else if (opt.id === selected) style = "bg-rose-100 border-rose-500 text-rose-800 opacity-60"; else style = "opacity-50 grayscale"; } else if (selected === opt.id) { style = "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500"; } return <button key={opt.id} disabled={submitted} onClick={() => setSelected(opt.id)} className={`w-full p-4 text-left border-2 rounded-xl transition-all ${style}`}>{opt.text}</button>; })}</div>
            {!submitted ? (<button onClick={() => setSubmitted(true)} disabled={!selected} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all">Check Answer</button>) : (<div className={`mt-4 p-3 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><span className="font-bold flex items-center gap-2">{isCorrect ? <><Check size={18}/> Correct!</> : <><X size={18}/> Incorrect</>}</span>{isCorrect ? <button onClick={onComplete} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">Continue</button> : <button onClick={() => { setSubmitted(false); setSelected(null); }} className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold shadow-sm">Try Again</button>}</div>)}
        </div>
    );
};

const ChatDialogueBlock = ({ lines }: any) => (
    <div className="space-y-4 my-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
        {lines.map((line: any, i: number) => {
            const isA = line.speaker === 'A' || i % 2 === 0;
            return (<div key={i} className={`flex ${isA ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-sm relative shadow-sm ${isA ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}><p className="font-medium leading-relaxed text-base">{line.text}</p>{line.translation && <p className={`text-xs mt-2 pt-2 border-t ${isA ? 'border-slate-100 text-slate-400' : 'border-indigo-500/50 text-indigo-200'}`}>{line.translation}</p>}<span className={`absolute -top-5 text-[10px] font-bold text-slate-400 ${isA ? 'left-0' : 'right-0'}`}>{line.speaker}</span></div></div>);
        })}
    </div>
);

// --- MAIN LESSON VIEW (Sequential) ---
function LessonView({ lesson, onFinish }: any) {
  useLearningTimer(auth.currentUser, lesson.id, 'lesson', lesson.title);
  const resetScroll = () => { window.scrollTo(0, 0); const container = document.getElementById('lesson-scroll-container'); if (container) container.scrollTop = 0; };
  useLayoutEffect(() => { resetScroll(); }, []);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const blocks = lesson.blocks || [];
  const progress = ((currentBlockIdx + 1) / blocks.length) * 100;
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (bottomRef.current) { bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, [currentBlockIdx]);
  const handleNextBlock = () => { if (currentBlockIdx < blocks.length - 1) { setCurrentBlockIdx(prev => prev + 1); } else { resetScroll(); onFinish(lesson.id, lesson.xp, lesson.title); } };
  const handleExit = () => { resetScroll(); onFinish(null, 0); };

  const renderBlockContent = (block: any) => {
      switch (block.type) {
          case 'text': return (<div className="my-6 prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700">{block.title && <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">{block.title}</h2>}<div className="text-lg text-slate-600 leading-loose whitespace-pre-wrap font-serif">{block.content}</div></div>);
          case 'image': return (<div className="my-8 space-y-4 animate-in zoom-in-95 duration-500"><div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200">{block.url ? <img src={block.url} alt="Lesson" className="w-full object-cover" /> : <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">Image Placeholder</div>}</div>{block.caption && <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-2 rounded-full inline-block px-4 mx-auto">{block.caption}</p>}</div>);
          case 'vocab-list': return <JuicyDeckBlock items={block.items} title="Key Vocabulary" />;
          case 'flashcard': return <ConceptCardBlock front={block.front} back={block.back} context={block.title || "Check Understanding"} />;
          case 'quiz': return <QuizBlock block={block} onComplete={handleNextBlock} />;
          case 'scenario': return <ScenarioBlock block={block} onComplete={handleNextBlock} />;
          case 'dialogue': return <ChatDialogueBlock lines={block.lines} />;
          case 'note':
              const styles: any = { info: { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-blue-100', iconBg: 'bg-white', iconColor: 'text-blue-600', icon: <Info size={20}/> }, tip: { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-100', iconBg: 'bg-white', iconColor: 'text-emerald-600', icon: <Zap size={20} className="fill-current"/> }, warning: { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-100', iconBg: 'bg-white', iconColor: 'text-amber-600', icon: <AlertTriangle size={20}/> } };
              const s = styles[block.variant || 'info'];
              return (<div className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 my-6 shadow-sm animate-in slide-in-from-left-2 duration-500`}><div className={`absolute -right-4 -top-4 opacity-10 pointer-events-none ${s.iconColor}`}>{React.cloneElement(s.icon, { size: 100 })}</div><div className="relative z-10 flex gap-4 items-start"><div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor} shadow-sm border border-white/50`}>{s.icon}</div><div><h4 className={`font-black text-[10px] uppercase tracking-widest mb-1 opacity-70 ${s.iconColor}`}>{block.title || block.variant}</h4><p className="text-slate-700 text-sm font-medium leading-relaxed">{block.content}</p></div></div></div>);
          default: return <div className="p-4 bg-slate-100 rounded text-slate-500 italic">Unsupported block type: {block.type}</div>;
      }
  };

  const activeBlock = blocks[currentBlockIdx];
  const isInteractive = activeBlock.type === 'quiz' || (activeBlock.type === 'scenario' && activeBlock.nodes);

  return (
    <div id="lesson-scroll-container" className="h-full flex flex-col bg-white overflow-y-auto overflow-x-hidden relative scroll-smooth">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 border-b border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-2"><button onClick={handleExit} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button><div className="flex flex-col items-end"><span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">Progress</span><span className="text-xs font-bold text-slate-800">{currentBlockIdx + 1} <span className="text-slate-300">/</span> {blocks.length}</span></div></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div></div></div>
        <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full pb-32">{blocks.slice(0, currentBlockIdx + 1).map((block: any, idx: number) => (<div key={idx} className={idx === currentBlockIdx ? "min-h-[50vh] flex flex-col justify-center" : "opacity-40 hover:opacity-100 transition-opacity duration-500 mb-12 border-b border-slate-100 pb-12"}>{renderBlockContent(block)}{idx === currentBlockIdx && <div ref={bottomRef} className="h-1 w-1"></div>}</div>))}</div>
        {!isInteractive && (<div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none"><button onClick={handleNextBlock} className="pointer-events-auto w-full max-w-md py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 animate-in slide-in-from-bottom-4 duration-500">{currentBlockIdx < blocks.length - 1 ? (<>Continue <ArrowRight size={20}/></>) : (<>Complete Lesson <Check size={20}/></>)}</button></div>)}
    </div>
  );
}

// ============================================================================
//  2. DISCOVERY VIEW
// ============================================================================
function DiscoveryView({ allDecks, user, onSelectDeck }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const dailyPick = useMemo(() => {
        const deckKeys = Object.keys(allDecks).filter(k => !allDecks[k].isAssignment);
        if (deckKeys.length === 0) return null;
        const today = new Date().toDateString(); 
        let hash = 0; for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
        const idx = Math.abs(hash) % deckKeys.length;
        return { id: deckKeys[idx], ...allDecks[deckKeys[idx]] };
    }, [allDecks]);
    const categories = [{ id: 'trending', name: 'Trending', icon: <Activity size={16}/>, color: 'text-rose-500', bg: 'bg-rose-50' }, { id: 'new', name: 'New', icon: <Zap size={16}/>, color: 'text-amber-500', bg: 'bg-amber-50' }, { id: 'classics', name: 'Classics', icon: <BookOpen size={16}/>, color: 'text-indigo-500', bg: 'bg-indigo-50' }];
    const filteredDecks = Object.entries(allDecks).map(([id, deck]: any) => ({ id, ...deck })).filter(d => !d.isAssignment && (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.language?.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 pb-4 bg-white border-b border-slate-100 z-10"><h1 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><Compass className="text-indigo-600" strokeWidth={2.5}/> Explore</h1><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Search decks..." className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                {!searchTerm && dailyPick && (<div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl text-white group cursor-pointer" onClick={() => onSelectDeck(dailyPick)}><div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 opacity-90"></div><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div className="relative z-10 p-8 flex flex-col items-center text-center"><span className="bg-white/20 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest py-1 px-3 rounded-full mb-4 shadow-lg">Daily Pick</span><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl mb-4 text-indigo-600">{dailyPick.icon || <Layers/>}</div><h2 className="text-2xl font-black mb-2">{dailyPick.title}</h2><p className="text-indigo-200 text-sm font-medium line-clamp-2 max-w-xs">{dailyPick.description || "Master this topic today."}</p></div></div>)}
                {!searchTerm && (<div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">{categories.map(cat => (<button key={cat.id} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm active:scale-95 transition-all"><div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>{cat.icon}</div><span className="font-bold text-slate-700 text-xs">{cat.name}</span></button>))}</div>)}
                <div><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">{searchTerm ? 'Results' : 'Recommended'}</h3><div className="grid grid-cols-2 gap-4">{filteredDecks.map((deck: any) => (<button key={deck.id} onClick={() => onSelectDeck(deck)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col h-full"><div className="flex justify-between items-start mb-3"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">{deck.icon ? <span className="text-lg">{deck.icon}</span> : <Layers size={18}/>}</div>{deck.xp && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{deck.xp} XP</span>}</div><h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">{deck.title}</h4><div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400"><span>{deck.cards?.length || 0} Cards</span><ChevronRight size={14}/></div></button>))}</div></div>
            </div>
        </div>
    );
}

// ============================================================================
//  3. HOME VIEW
// ============================================================================
function HomeView({ setActiveTab, lessons, onSelectLesson, onSelectDeck, userData, assignments, classes, user }: any) {
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { const viewport = scrollViewportRef.current; if (viewport) { viewport.scrollTop = 0; setTimeout(() => { if (viewport) viewport.scrollTop = 0; }, 10); } }, []);
  const completedSet = new Set(userData?.completedAssignments || []);
  const relevantAssignments = (assignments || []).filter((l: any) => !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email));
  const activeAssignments = relevantAssignments.filter((l: any) => !completedSet.has(l.id));
  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const progress = ((xp % 1000) / 1000) * 100;

  if (activeStudentClass) { return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={onSelectLesson} onSelectDeck={onSelectDeck} userData={userData} user={user} />; }

  return (
  <div ref={scrollViewportRef} className="h-full overflow-y-auto overflow-x-hidden relative bg-slate-50 scroll-smooth">
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-white p-6 pb-8 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3"><div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-inner text-lg">{userData?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</div><div><h2 className="text-xl font-black text-slate-800 leading-tight">Ave, {userData?.name?.split(' ')[0] || 'Scholar'}!</h2><div className="flex items-center gap-1.5"><span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Level {level}</span></div></div></div>
                <div className="text-right"><span className="block text-2xl font-black text-slate-800">{xp}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total XP</span></div>
            </div>
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
        </div>
        <div className="px-6 space-y-8 mt-8">
          {classes && classes.length > 0 && (<div className="animate-in slide-in-from-bottom-4 duration-500 delay-100"><div className="flex justify-between items-end mb-4 ml-1"><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><School size={16} className="text-indigo-500"/> My Classes</h3><span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{classes.length} Active</span></div><div className="flex gap-5 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">{classes.map((cls: any) => { const pending = (cls.assignments || []).filter((l: any) => (!l.targetStudents || l.targetStudents.includes(userData.email)) && !completedSet.has(l.id)).length; return ( <button key={cls.id} onClick={() => setActiveStudentClass(cls)} className="snap-start min-w-[280px] h-[180px] bg-white rounded-[2rem] shadow-sm border border-slate-100 transition-all active:scale-95 group relative overflow-hidden flex flex-col text-left hover:shadow-md hover:border-indigo-200"><div className="h-20 bg-gradient-to-br from-slate-800 to-slate-900 relative w-full p-5 flex justify-between items-start"><div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white font-bold">{cls.name.charAt(0)}</div>{pending > 0 ? <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">{pending} Due</span> : <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md">Done</span>}</div><div className="p-5 flex-1 flex flex-col justify-between"><div><h4 className="font-bold text-slate-800 text-lg truncate">{cls.name}</h4><p className="text-xs text-slate-400 font-medium">{cls.code}</p></div></div></button> ); })}</div></div>)}
          {activeAssignments.length > 0 && (<div className="animate-in slide-in-from-bottom-4 duration-500 delay-200"><div className="flex justify-between items-center mb-3 ml-1"><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Up Next</h3></div><div className="space-y-3">{activeAssignments.map((l: any, i: number) => ( <button key={`${l.id}-${i}`} onClick={() => l.contentType === 'deck' ? onSelectDeck(l) : onSelectLesson(l)} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all group"><div className="flex items-center space-x-4"><div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{l.contentType === 'deck' ? <Layers size={22}/> : <PlayCircle size={22} />}</div><div className="text-left"><h4 className="font-bold text-slate-800">{l.title}</h4><p className="text-xs text-slate-400">{l.contentType === 'deck' ? 'Flashcards' : 'Lesson'}</p></div></div><ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors"/></button>))}</div></div>)}
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-300"><button onClick={() => setActiveTab('flashcards')} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center active:scale-95 transition-all group hover:border-orange-200"><div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3"><Layers size={24}/></div><span className="block font-bold text-slate-800">Practice</span></button><button onClick={() => setActiveTab('create')} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center active:scale-95 transition-all group hover:border-emerald-200"><div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3"><Feather size={24}/></div><span className="block font-bold text-slate-800">Create</span></button></div>
        </div>
    </div>
  </div>
  );
}

// ============================================================================
//  4. FLASHCARD VIEW & TOWER
// ============================================================================
function MatchingGame({ deckCards, onGameEnd }: any) { return <div className="p-10 text-center"><p>Matching Game Stub</p><button onClick={() => onGameEnd(50)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Finish</button></div>; }
function QuizGame({ deckCards, onGameEnd }: any) { return <div className="p-10 text-center"><p>Quiz Game Stub</p><button onClick={() => onGameEnd(50)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Finish</button></div>; }
function TowerMode({ allDecks, user, onExit, onXPUpdate }: any) { return <div className="fixed inset-0 bg-slate-900 z-[60] flex items-center justify-center text-white"><div className="text-center"><h1>The Tower</h1><p>Climb to the top!</p><button onClick={onExit} className="mt-4 bg-white text-black px-4 py-2 rounded">Exit</button></div></div>; }

function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onSaveCard, activeDeckOverride, onComplete, onLogActivity, userData, user, onUpdatePrefs, onDeleteDeck }: any) {
  const currentDeck = activeDeckOverride || allDecks[selectedDeckKey];
  const userPrefs = userData?.deckPreferences || { hiddenDeckIds: [], customOrder: [] };
  useLearningTimer(userData ? auth.currentUser : null, selectedDeckKey, 'deck', currentDeck?.title || 'Flashcards');
  const [viewState, setViewState] = useState<'browsing' | 'playing'>(activeDeckOverride ? 'playing' : 'browsing');
  const [filterLang, setFilterLang] = useState('All');
  const [isEditMode, setIsEditMode] = useState(false);
  const [completionMsg, setCompletionMsg] = useState<string | null>(null);
  const [showTower, setShowTower] = useState(false); 
  const [openSections, setOpenSections] = useState({ assignments: true, custom: true, library: false });
  const toggleSection = (section: string) => setOpenSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  const [gameMode, setGameMode] = useState('study'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const minSwipeDistance = 50; 

  const { assignments, customDecks, libraryDecks, allProcessed, languages } = useMemo(() => {
      const isHidden = (id: string) => userPrefs.hiddenDeckIds?.includes(id);
      const processed = Object.entries(allDecks).filter(([_, deck]: any) => deck.cards && deck.cards.length > 0).map(([key, deck]: any) => {
            const detectedLang = deck.targetLanguage || deck.cards[0]?.targetLanguage || 'General';
            let category = 'library';
            if (deck.isAssignment) category = 'assignment';
            else if (key.startsWith('custom')) category = 'custom';
            return { id: key, ...deck, language: detectedLang, category, isHidden: isHidden(key) };
        });
      const sortOrder = userPrefs.customOrder || [];
      const sorter = (a: any, b: any) => { const idxA = sortOrder.indexOf(a.id); const idxB = sortOrder.indexOf(b.id); if (idxA !== -1 && idxB !== -1) return idxA - idxB; if (idxA !== -1) return -1; if (idxB !== -1) return 1; return a.title.localeCompare(b.title); };
      const langs = new Set(processed.map(d => d.language));
      return { assignments: processed.filter(d => d.category === 'assignment').sort(sorter), customDecks: processed.filter(d => d.category === 'custom').sort(sorter), libraryDecks: processed.filter(d => d.category === 'library').sort(sorter), allProcessed: processed, languages: ['All', ...Array.from(langs).sort()] };
  }, [allDecks, userPrefs]);

  const filterList = (list: any[]) => { let filtered = list; if (filterLang !== 'All') filtered = filtered.filter(d => d.language === filterLang); if (!isEditMode) filtered = filtered.filter(d => !d.isHidden); return filtered; };
  const visibleAssignments = filterList(assignments); const visibleCustom = filterList(customDecks); const visibleLibrary = filterList(libraryDecks); const totalCardsAvailable = allProcessed.reduce((acc, deck: any) => acc + deck.cards.length, 0);
  const deckCards = currentDeck?.cards || []; const card = deckCards[currentIndex]; const theme = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.noun) : TYPE_COLORS.noun;

  const launchDeck = (key: string) => { if (isEditMode) return; onSelectDeck(key); setCurrentIndex(0); setIsFlipped(false); setViewState('playing'); };
  const handleTowerXP = async (xpAmount: number, reason: string) => { if (onLogActivity) onLogActivity('tower_game', xpAmount, reason, null); };
  const handleMove = (id: string, direction: 'up' | 'down', list: any[]) => { const currentOrder = list.map(d => d.id); const currentIndex = currentOrder.indexOf(id); if (currentIndex === -1) return; const newOrder = [...currentOrder]; const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1; if (targetIndex < 0 || targetIndex >= newOrder.length) return; [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]]; const globalOrder = [...(userPrefs.customOrder || [])]; list.forEach(d => { if(!globalOrder.includes(d.id)) globalOrder.push(d.id); }); const id1 = currentOrder[currentIndex]; const id2 = currentOrder[targetIndex]; const gIdx1 = globalOrder.indexOf(id1); const gIdx2 = globalOrder.indexOf(id2); if(gIdx1 !== -1 && gIdx2 !== -1) { [globalOrder[gIdx1], globalOrder[gIdx2]] = [globalOrder[gIdx2], globalOrder[gIdx1]]; } onUpdatePrefs({ ...userPrefs, customOrder: globalOrder }); };
  const handleToggleHide = (id: string) => { const hidden = userPrefs.hiddenDeckIds || []; const newHidden = hidden.includes(id) ? hidden.filter((h: string) => h !== id) : [...hidden, id]; onUpdatePrefs({ ...userPrefs, hiddenDeckIds: newHidden }); };
  const handleGameEnd = (data: any) => { let xp = 0; let message = ""; if (typeof data === 'number') { xp = data; message = `Matching Complete! +${xp} XP`; } else { const percentage = Math.round((data.score / data.total) * 100); xp = Math.round((data.score / data.total) * 50) + 10; message = `Score: ${percentage}% (${data.score}/${data.total}) • +${xp} XP`; } setCompletionMsg(message); if (activeDeckOverride && onComplete) onComplete(activeDeckOverride.id, xp, currentDeck.title, data.score !== undefined ? data : null); else if (onLogActivity) { const scoreDetail = data.score !== undefined ? data : null; onLogActivity(selectedDeckKey, xp, `${currentDeck.title} (${gameMode})`, scoreDetail); setViewState('browsing'); } else setViewState('browsing'); };
  const handleNext = useCallback(() => { setXrayMode(false); setIsFlipped(false); setSwipeDirection('left'); setTimeout(() => { setCurrentIndex((prev) => (prev + 1) % deckCards.length); setSwipeDirection(null); }, 200); }, [deckCards.length]);
  const handlePrev = useCallback(() => { setXrayMode(false); setIsFlipped(false); setSwipeDirection('right'); setTimeout(() => { setCurrentIndex((prev) => (prev - 1 + deckCards.length) % deckCards.length); setSwipeDirection(null); }, 200); }, [deckCards.length]);
  const playAudio = useCallback((text: string) => { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); const voices = window.speechSynthesis.getVoices(); const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')); if (preferredVoice) utterance.voice = preferredVoice; window.speechSynthesis.speak(utterance); }, []);
  const onPointerDown = (e: React.PointerEvent) => { setDragEndX(null); setDragStartX(e.clientX); };
  const onPointerMove = (e: React.PointerEvent) => { if (dragStartX !== null) setDragEndX(e.clientX); };
  const onPointerUp = () => { if (dragStartX === null || dragEndX === null) { setDragStartX(null); return; } const distance = dragStartX - dragEndX; if (distance > minSwipeDistance) handleNext(); else if (distance < -minSwipeDistance) handlePrev(); setDragStartX(null); setDragEndX(null); };

  const DeckCard = ({ deck, icon, colorClass, borderClass, fullList }: any) => ( <div onClick={() => launchDeck(deck.id)} className={`w-full bg-white p-4 rounded-2xl border shadow-sm transition-all flex flex-col gap-3 group relative overflow-hidden text-left ${isEditMode ? 'border-slate-300 border-dashed cursor-default' : `hover:shadow-md cursor-pointer ${borderClass || 'border-slate-100 hover:border-indigo-200'}`} ${deck.isHidden ? 'opacity-60 bg-slate-50' : ''}`}><div className={`absolute left-0 top-0 bottom-0 w-1.5 ${deck.language === 'Latin' ? 'bg-purple-500' : deck.language === 'Spanish' ? 'bg-orange-500' : deck.language === 'English' ? 'bg-blue-500' : 'bg-slate-300'}`}></div><div className="flex justify-between items-start w-full pl-2"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors ${deck.isHidden ? 'bg-slate-200 text-slate-400' : colorClass}`}>{icon}</div><div><h4 className="font-bold text-slate-800 text-base leading-tight group-hover:text-indigo-700 transition-colors line-clamp-1 flex items-center gap-2">{deck.title}{deck.isHidden && <span className="text-[9px] bg-slate-200 text-slate-500 px-1 rounded uppercase">Hidden</span>}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1"><Globe size={10}/> {deck.language}</span><span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Layers size={10}/> {deck.cards.length}</span></div></div></div>{isEditMode ? (<div className="flex items-center gap-1" onClick={e => e.stopPropagation()}><button onClick={() => handleMove(deck.id, 'up', fullList)} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-600"><ArrowUp size={16}/></button><button onClick={() => handleMove(deck.id, 'down', fullList)} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-600"><ArrowDown size={16}/></button><button onClick={() => handleToggleHide(deck.id)} className="p-2 bg-slate-100 rounded-lg hover:bg-amber-100 hover:text-amber-600">{deck.isHidden ? <EyeOff size={16}/> : <Eye size={16}/>}</button>{deck.category === 'custom' && (<button onClick={() => onDeleteDeck(deck.id)} className="p-2 bg-rose-50 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 ml-1"><Trash2 size={16}/></button>)}</div>) : (<div className="text-slate-300 group-hover:text-indigo-500 transition-colors"><ChevronRight size={18}/></div>)}</div>{!isEditMode && (<div className="w-full pl-2 pr-1"><div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1"><span>Progress</span><span>{deck.mastery || 0}%</span></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deck.mastery || 5}%` }}></div></div></div>)}</div> );
  const SectionAccordion = ({ title, icon, count, isOpen, onToggle, children, colorTheme = "indigo" }: any) => { const theme: any = { indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }, emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' }, amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }, blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }, }; const t = theme[colorTheme] || theme.indigo; return ( <div className={`mb-4 rounded-2xl bg-white border ${isOpen ? t.border : 'border-slate-200'} shadow-sm overflow-hidden transition-all duration-300`}><button onClick={onToggle} className="w-full p-4 flex items-center justify-between active:bg-slate-50 transition-colors"><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${t.bg} ${t.text}`}>{icon}</div><div className="text-left"><h3 className="font-bold text-slate-800 text-sm">{title}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{count} Decks</p></div></div><div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100' : ''}`}><ChevronDown size={16} /></div></button><div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}><div className="p-4 pt-0 border-t border-slate-50"><div className="pt-4 grid grid-cols-1 gap-3">{children}</div></div></div></div> ); };

  return (
    <>
      {completionMsg && <Toast message={completionMsg} onClose={() => setCompletionMsg(null)} />}
      {showTower && (<TowerMode allDecks={allDecks} user={user} onExit={() => setShowTower(false)} onXPUpdate={handleTowerXP} />)}
      {viewState === 'browsing' ? (
        <div className="h-full bg-slate-50 flex flex-col overflow-y-auto pb-24 animate-in fade-in custom-scrollbar">
            <div className="bg-white p-6 pb-2 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-slate-900">Practice Hub</h1><div className="flex gap-2">{languages.length > 1 && (<button onClick={() => { const idx = languages.indexOf(filterLang); setFilterLang(languages[(idx + 1) % languages.length]); }} className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{filterLang}</button>)}<button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${isEditMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}><Edit3 size={12}/> {isEditMode ? 'Done' : 'Manage'}</button></div></div>
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar"><div className="flex-1 min-w-[140px] bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center"><span className="text-2xl font-black text-indigo-600">{totalCardsAvailable}</span><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Total Cards</span></div><div className="flex-1 min-w-[140px] bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center"><span className="text-2xl font-black text-emerald-600">{allProcessed.length}</span><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Active Decks</span></div>
                    {/* TOWER BUTTON */}
                    <button onClick={() => setShowTower(true)} className="flex-1 min-w-[140px] bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-3 rounded-2xl shadow-lg shadow-indigo-900/30 active:scale-95 transition-all flex flex-col justify-center items-center group relative overflow-hidden"><div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div><Layers size={24} className="mb-1 group-hover:scale-110 transition-transform relative z-10"/><span className="text-[10px] font-bold uppercase tracking-wide relative z-10">The Tower</span></button>
                </div>
            </div>
            <div className="p-6">{(isEditMode ? assignments : visibleAssignments).length > 0 && (<SectionAccordion title="Class Assignments" icon={<School size={20}/>} count={(isEditMode ? assignments : visibleAssignments).length} isOpen={openSections.assignments} onToggle={() => toggleSection('assignments')} colorTheme="amber">{(isEditMode ? assignments : visibleAssignments).map((deck: any) => <DeckCard key={deck.id} deck={deck} fullList={assignments} icon={<School size={20}/>} colorClass="bg-amber-100 text-amber-600" borderClass="border-amber-200 hover:border-amber-400" />)}</SectionAccordion>)}<SectionAccordion title="My Collections" icon={<Feather size={20}/>} count={(isEditMode ? customDecks : visibleCustom).length} isOpen={openSections.custom} onToggle={() => toggleSection('custom')} colorTheme="emerald">{(isEditMode ? customDecks : visibleCustom).length > 0 ? (isEditMode ? customDecks : visibleCustom).map((deck: any) => <DeckCard key={deck.id} deck={deck} fullList={customDecks} icon={<Feather size={20}/>} colorClass="bg-emerald-100 text-emerald-600" borderClass="border-slate-100 hover:border-emerald-300" />) : <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center"><p className="text-sm text-slate-400 font-bold">No custom decks yet.</p><p className="text-xs text-slate-300 mt-1">Use the Creator tab to build one!</p></div>}</SectionAccordion><SectionAccordion title="System Library" icon={<Library size={20}/>} count={(isEditMode ? libraryDecks : visibleLibrary).length} isOpen={openSections.library} onToggle={() => toggleSection('library')} colorTheme="blue">{(isEditMode ? libraryDecks : visibleLibrary).length > 0 ? (isEditMode ? libraryDecks : visibleLibrary).map((deck: any) => <DeckCard key={deck.id} deck={deck} fullList={libraryDecks} icon={<BookOpen size={20}/>} colorClass="bg-blue-100 text-blue-600" borderClass="border-slate-100 hover:border-blue-300" />) : <div className="p-4 text-center text-slate-400 text-xs italic">Library empty for this filter.</div>}</SectionAccordion><div className="h-8"></div></div>
        </div>
      ) : (
        <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 pb-6 relative overflow-hidden"><Header title={currentDeck?.title || "Deck"} subtitle={`${currentIndex + 1} / ${deckCards.length} Cards`} sticky={false} onClickTitle={() => setViewState('browsing')} rightAction={<button onClick={() => setViewState('browsing')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X size={20} /></button>} /><div className="px-6 mt-2 mb-4 z-10"><div className="flex bg-slate-200 p-1 rounded-xl w-full max-w-sm mx-auto shadow-inner">{['study', 'quiz', 'match'].map((mode) => (<button key={mode} onClick={() => setGameMode(mode)} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg capitalize transition-all ${gameMode === mode ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>{mode}</button>))}</div></div><div className="flex-1 relative w-full overflow-hidden">{gameMode === 'match' && <div className="h-full overflow-y-auto"><MatchingGame deckCards={deckCards} onGameEnd={handleGameEnd} /></div>}{gameMode === 'quiz' && <div className="h-full overflow-y-auto"><QuizGame deckCards={deckCards} onGameEnd={handleGameEnd} /></div>}{gameMode === 'study' && card && (<div className="flex-1 flex flex-col items-center justify-center px-4 py-2 perspective-1000 relative z-0 h-full" style={{ perspective: '1000px', touchAction: 'pan-y' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><div className={`relative w-full h-full max-h-[520px] cursor-pointer shadow-2xl rounded-[2rem] transition-transform duration-300 ${swipeDirection === 'left' ? '-translate-x-full opacity-0 rotate-[-10deg]' : swipeDirection === 'right' ? 'translate-x-full opacity-0 rotate-[10deg]' : 'translate-x-0 opacity-100'}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped && !swipeDirection ? 'rotateY(180deg)' : swipeDirection ? undefined : 'rotateY(0deg)' }} onClick={() => !xrayMode && setIsFlipped(!isFlipped)}><div className="absolute inset-0 bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col select-none" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><div className={`h-3 w-full ${xrayMode ? theme.bg.replace('50', '500') : 'bg-slate-100'} transition-colors duration-500`} /><div className="flex-1 flex flex-col p-6 relative"><div className="flex justify-between items-start mb-8"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>{card.type}</span><span className="text-xs font-mono text-slate-300">{currentIndex + 1}/{deckCards.length}</span></div><div className="flex-1 flex flex-col items-center justify-center mt-[-40px]"><h2 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 text-center mb-6 leading-tight select-none">{card.front}</h2><div onClick={(e) => { e.stopPropagation(); playAudio(card.front); }} className="flex items-center gap-3 bg-slate-50 pl-3 pr-5 py-2 rounded-full border border-slate-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors group active:scale-95 shadow-sm"><Volume2 size={16} className="text-indigo-400"/><span className="font-serif text-slate-500 text-lg tracking-wide group-hover:text-indigo-800 select-none">{card.ipa || "/.../"}</span></div></div><div className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 transition-all duration-300 flex flex-col overflow-hidden z-20 ${xrayMode ? 'h-[75%] opacity-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]' : 'h-0 opacity-0'}`} onClick={e => e.stopPropagation()}><div className="p-6 overflow-y-auto custom-scrollbar space-y-6"><div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Puzzle size={14} /> Morphology</h4><div className="flex flex-wrap gap-2">{Array.isArray(card.morphology) && card.morphology.map((m: any, i: number) => (<div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[60px]"><span className={`font-bold text-lg ${m.type === 'root' ? 'text-indigo-600' : 'text-slate-700'}`}>{m.part}</span><span className="text-slate-400 text-[9px] font-medium uppercase mt-1 text-center max-w-[80px] leading-tight">{m.meaning}</span></div>))}</div></div><div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MessageSquare size={14} /> Context</h4><div className={`p-4 rounded-xl border ${theme.border} ${theme.bg}`}><p className="text-slate-800 font-serif font-medium text-lg mb-1">"{card.usage?.sentence || '...'}"</p><p className={`text-sm ${theme.text} opacity-80 italic`}>{card.usage?.translation || '...'}</p></div></div></div></div>{!xrayMode && (<div className="mt-auto text-center"><p className="text-xs text-slate-300 font-bold uppercase tracking-widest animate-pulse flex items-center justify-center gap-2"><ArrowLeft size={10}/> Swipe <ArrowRight size={10}/></p></div>)}</div></div><div className="absolute inset-0 bg-slate-900 rounded-[2rem] shadow-xl flex flex-col items-center justify-center p-8 text-white relative overflow-hidden select-none" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div><div className="relative z-10 flex flex-col items-center"><span className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border-b border-indigo-500/30 pb-2">Translation</span><h2 className="text-3xl md:text-4xl font-bold text-center mb-8 leading-tight">{card.back}</h2></div></div></div></div>)}</div>{gameMode === 'study' && card && (<div className="px-6 pb-4 pt-2"><div className="flex items-center justify-between max-w-sm mx-auto"><button onClick={handlePrev} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-rose-50"><X size={28} strokeWidth={2.5} /></button><button onClick={(e) => { e.stopPropagation(); if(isFlipped) setIsFlipped(false); setXrayMode(!xrayMode); }} className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 border-2 ${xrayMode ? 'bg-indigo-600 border-indigo-600 text-white translate-y-[-8px] shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}><Search size={28} strokeWidth={xrayMode ? 3 : 2} className={xrayMode ? 'animate-pulse' : ''} /><span className="text-[10px] font-black tracking-wider mt-1">X-RAY</span></button><button onClick={handleNext} className="h-14 w-14 rounded-full bg-white border border-slate-100 shadow-md text-emerald-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all hover:bg-emerald-50"><Check size={28} strokeWidth={2.5} /></button></div></div>)}</div>
      )}
    </>
  );
}

// ============================================================================
//  5. AUTH, PROFILE, CLASS, BUILDER, INSTRUCTOR
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
  return ( <div className="h-full flex flex-col p-6 bg-slate-50"><div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"><div className="text-center mb-8"><div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-4 shadow-xl"><GraduationCap size={40} /></div><h1 className="text-3xl font-bold text-slate-900">LinguistFlow v3.0</h1></div><form onSubmit={handleAuth} className="space-y-4">{!isLogin && <><div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" required={!isLogin} /></div><div className="flex gap-3"><button type="button" onClick={() => setRole('student')} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${role === 'student' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Student</button><button type="button" onClick={() => setRole('instructor')} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${role === 'instructor' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Instructor</button></div></>}<div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" required /></div><div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" required /></div>{error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg">{error}</div>}<button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg">{loading ? <Loader className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}</button></form><div className="mt-6 text-center"><button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold text-sm hover:underline">{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button></div></div></div> );
}

function ProfileView({ user, userData }: any) {
  const [deploying, setDeploying] = useState(false);
  const handleLogout = () => signOut(auth);
  const deploySystemContent = async () => { setDeploying(true); const batch = writeBatch(db); Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); INITIAL_SYSTEM_LESSONS.forEach((lesson) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); try { await batch.commit(); alert("Deployed!"); } catch (e: any) { alert("Error: " + e.message); } setDeploying(false); };
  const toggleRole = async () => { if (!userData) return; const newRole = userData.role === 'instructor' ? 'student' : 'instructor'; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole }); };
  return (<div className="h-full flex flex-col bg-slate-50"><Header title="Ego" subtitle="Profile" /><div className="flex-1 px-6 mt-4"><div className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col items-center mb-6"><h2 className="text-2xl font-bold">{userData?.name}</h2><p className="text-sm text-slate-500">{user.email}</p><div className="mt-4 px-4 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase">{userData?.role}</div></div><div className="space-y-3"><button onClick={toggleRole} className="w-full bg-white p-4 rounded-xl border text-slate-700 font-bold mb-4 flex justify-between"><span>Switch Role</span><School size={20} /></button><button onClick={handleLogout} className="w-full bg-white p-4 rounded-xl border text-rose-600 font-bold mb-4 flex justify-between"><span>Sign Out</span><LogOut/></button><button onClick={deploySystemContent} disabled={deploying} className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold flex justify-between">{deploying ? <Loader className="animate-spin"/> : <UploadCloud/>}<span>Deploy Content</span></button></div></div></div>);
}

function StudentClassView({ classData, onBack, onSelectLesson, onSelectDeck, userData }: any) {
  const completedSet = new Set(userData?.completedAssignments || []);
  const handleAssignmentClick = (assignment: any) => { if (assignment.contentType === 'deck') { onSelectDeck(assignment); } else { onSelectLesson(assignment); } };
  const relevantAssignments = (classData.assignments || []).filter((l: any) => { const isForMe = !l.targetStudents || l.targetStudents.length === 0 || l.targetStudents.includes(userData.email); return isForMe; });
  const pendingCount = relevantAssignments.filter((l: any) => !completedSet.has(l.id)).length;
  return (<div className="h-full flex flex-col bg-slate-50"><div className="px-6 pt-12 pb-6 bg-white sticky top-0 z-40 border-b border-slate-100"><button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Back to Home</button><h1 className="text-2xl font-bold text-slate-900">{classData.name}</h1><p className="text-sm text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">Code: {classData.code}</p></div><div className="flex-1 px-6 mt-4 overflow-y-auto pb-24"><div className="space-y-6"><div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg"><h3 className="text-lg font-bold mb-1">Your Progress</h3><p className="text-indigo-200 text-sm">Keep up the great work!</p><div className="mt-4 flex gap-4"><div><span className="text-2xl font-bold block">{pendingCount}</span><span className="text-xs opacity-70">To Do</span></div><div><span className="text-2xl font-bold block">{classData.students?.length || 0}</span><span className="text-xs opacity-70">Classmates</span></div></div></div><div><h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3><div className="space-y-3">{relevantAssignments.length > 0 ? ( relevantAssignments.filter((l: any) => !completedSet.has(l.id)).map((l: any, i: number) => ( <button key={`${l.id}-${i}`} onClick={() => handleAssignmentClick(l)} className="w-full bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"><div className="flex items-center space-x-4"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${l.contentType === 'deck' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>{l.contentType === 'deck' ? <Layers size={20}/> : <PlayCircle size={20} />}</div><div className="text-left"><h4 className="font-bold text-indigo-900">{l.title}</h4><p className="text-xs text-indigo-600/70">{l.contentType === 'deck' ? 'Flashcard Deck' : 'Assigned Lesson'}</p></div></div><ChevronRight size={20} className="text-slate-300" /></button> )) ) : ( <div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl">No pending assignments.</div> )}{relevantAssignments.every((l: any) => completedSet.has(l.id)) && relevantAssignments.length > 0 && (<div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl">All assignments completed! 🎉</div>)}</div></div></div></div></div>);
}

function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks }: any) {
  const [lessonData, setLessonData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [] });
  const [mode, setMode] = useState('card'); 
  return ( <div className="pb-24 h-full bg-slate-50 overflow-y-auto custom-scrollbar">{mode === 'card' && <Header title="Scriptorium" subtitle="Card Builder" />}{mode === 'card' && (<><div className="px-6 mt-2"><div className="flex bg-slate-200 p-1 rounded-xl"><button onClick={() => setMode('card')} className="flex-1 py-2 text-sm font-bold rounded-lg bg-white shadow-sm text-indigo-700">Flashcard</button><button onClick={() => setMode('lesson')} className="flex-1 py-2 text-sm font-bold rounded-lg text-slate-500">Full Lesson</button></div></div><CardBuilderView onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} availableDecks={allDecks} /></>)}{mode === 'lesson' && <LessonBuilderView data={lessonData} setData={setLessonData} onSave={onSaveLesson} availableDecks={allDecks} />}</div> );
}

function JuicyToast({ message, type = 'success', onClose }: any) {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    const isSuccess = type === 'success';
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${isSuccess ? 'bg-slate-900/90 border-emerald-500/30 text-white' : 'bg-white/90 border-rose-200 text-rose-600'}`}>
                <div className={`p-2 rounded-full ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-500'}`}>{isSuccess ? <Check size={18} strokeWidth={3} /> : <AlertTriangle size={18} strokeWidth={3} />}</div>
                <div><h4 className="font-bold text-sm">{isSuccess ? 'Success' : 'Error'}</h4><p className={`text-xs ${isSuccess ? 'text-slate-400' : 'text-rose-400'}`}>{message}</p></div>
                <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity"><X size={14}/></button>
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

function InstructorInbox({ onGradeSubmission }: any) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [manualScore, setManualScore] = useState(0); 
  useEffect(() => { const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('scoreDetail.status', '==', 'pending_review'), orderBy('timestamp', 'asc')); const unsub = onSnapshot(q, (snapshot) => { setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); }); return () => unsub(); }, []);
  const selectedItem = submissions.find(s => s.id === selectedId);
  const handleSubmitGrade = async () => { if(!selectedItem) return; const baseXP = selectedItem.xp > 0 ? selectedItem.xp : 100; const finalXP = Math.round(baseXP * (manualScore / 100)); await onGradeSubmission(selectedItem.id, finalXP, feedback, manualScore); setSelectedId(null); setFeedback(''); setManualScore(0); };
  return ( <div className="flex h-full bg-slate-50 relative overflow-hidden"><div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white z-10`}><div className="p-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold text-slate-800 flex items-center gap-2"><Inbox size={18} className="text-indigo-600"/> Inbox</h2><span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{submissions.length}</span></div><div className="flex-1 overflow-y-auto custom-scrollbar">{submissions.length === 0 ? <div className="p-8 text-center text-slate-400 italic text-sm">All caught up! 🎉</div> : submissions.map(sub => (<div key={sub.id} onClick={() => setSelectedId(sub.id)} className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${selectedId === sub.id ? 'bg-indigo-50 border-indigo-200' : ''}`}><div className="flex justify-between items-start mb-1"><span className="font-bold text-slate-700 text-sm">{sub.studentName}</span><span className="text-[10px] text-slate-400">{new Date(sub.timestamp).toLocaleDateString()}</span></div><p className="text-xs text-slate-500 truncate mb-2">{sub.itemTitle}</p><div className="flex gap-2"><span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Needs Review</span></div></div>))}</div></div><div className={`flex-1 flex flex-col bg-slate-50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>{selectedItem ? (<><div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm"><div className="flex items-center gap-3"><button onClick={() => setSelectedId(null)} className="md:hidden p-2 text-slate-400"><ArrowLeft size={20}/></button><div><h2 className="font-bold text-lg text-slate-800">{selectedItem.itemTitle}</h2><p className="text-xs text-slate-500">Submitted by <span className="font-bold text-indigo-600">{selectedItem.studentName}</span></p></div></div><div className="text-right"><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Auto-Score</div><div className="text-xl font-black text-slate-300">{selectedItem.scoreDetail.score}/{selectedItem.scoreDetail.total}</div></div></div><div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"><div className="max-w-3xl mx-auto space-y-6">{selectedItem.scoreDetail.details.map((q: any, idx: number) => (<div key={idx} className={`bg-white p-6 rounded-2xl border-2 shadow-sm ${['essay', 'short-answer'].includes(q.type) ? 'border-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 opacity-70'}`}><div className="flex justify-between items-start mb-4"><span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">{q.type}</span>{['essay', 'short-answer'].includes(q.type) ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle size={12}/> Needs Grading</span> : (q.isCorrect ? <span className="text-emerald-500"><Check size={20}/></span> : <span className="text-rose-500"><X size={20}/></span>)}</div><h3 className="font-bold text-slate-800 text-lg mb-4">{q.prompt}</h3><div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap font-serif">{q.studentVal}</div>{!['essay', 'short-answer'].includes(q.type) && <div className="mt-2 text-xs text-slate-400">Correct: {q.correctVal}</div>}</div>))}</div></div><div className="p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20"><div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-end"><div className="w-full space-y-2"><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MessageCircle size={14}/> Instructor Feedback</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" placeholder="Great job, but..." value={feedback} onChange={(e) => setFeedback(e.target.value)}/></div><div className="w-full md:w-auto shrink-0 flex flex-col gap-4 min-w-[250px]"><div><div className="flex justify-between text-xs font-bold text-slate-500 mb-2"><span>FINAL SCORE</span><span className={`text-lg font-black ${manualScore >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{manualScore}%</span></div><input type="range" min="0" max="100" value={manualScore} onChange={(e) => setManualScore(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/></div><button onClick={handleSubmitGrade} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex justify-center items-center gap-2"><Send size={18}/> Release Grade</button></div></div></div></>) : <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8"><Inbox size={64} className="mb-4 opacity-50"/><p className="text-lg font-bold">Select a submission to grade</p></div>}</div></div> );
}

function InstructorDashboard({ user, userData, allDecks, lessons, onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewClassId, setViewClassId] = useState<string | null>(null);
  const [builderInitMode, setBuilderInitMode] = useState<'card' | 'lesson' | 'test' | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);
  const showToast = (msg: string, type: string = 'success') => { setToast({ msg, type }); };
  const handleQuickCreate = (type: 'card' | 'lesson' | 'test') => { setBuilderInitMode(type); setActiveTab('content'); };
  const handleClassShortcut = (classId: string) => { setViewClassId(classId); setActiveTab('classes'); };
  const handleGradeSubmission = async (logId: string, finalXP: number, feedback: string, scorePct: number) => { try { const logRef = doc(db, 'artifacts', appId, 'activity_logs', logId); await updateDoc(logRef, { 'scoreDetail.status': 'graded', 'scoreDetail.finalScorePct': scorePct, 'scoreDetail.instructorFeedback': feedback, xp: finalXP }); showToast(`Grade released! (+${finalXP} XP)`, 'success'); } catch (e) { console.error(e); showToast("Error saving grade", "error"); } };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {toast && <JuicyToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showBroadcast && <BroadcastModal classes={userData.classes || []} user={user} onClose={() => setShowBroadcast(false)} onToast={showToast}/>}
      <div className="w-72 bg-slate-900 text-white flex-col hidden md:flex shrink-0 border-r border-slate-800 shadow-2xl relative z-20"><div className="p-6 border-b border-slate-800"><h1 className="text-xl font-bold flex items-center gap-2 text-white"><GraduationCap className="text-indigo-400" strokeWidth={2.5}/> <span>Magister</span></h1><div className="flex items-center gap-2 mt-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50"><div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">{user.email.charAt(0).toUpperCase()}</div><div className="overflow-hidden"><p className="text-xs font-bold text-slate-200 truncate w-40">{user.email}</p><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</p></div></div></div><div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6"><div className="space-y-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Menu</p><button onClick={() => setActiveTab('dashboard')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Activity size={18} /> Live Feed</button><button onClick={() => setActiveTab('inbox')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Inbox size={18} /> Inbox</button><button onClick={() => setActiveTab('classes')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'classes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><School size={18} /> Class Manager</button><button onClick={() => setActiveTab('content')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Library size={18} /> Library</button><button onClick={() => setActiveTab('analytics')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BarChart2 size={18} /> Analytics</button><button onClick={() => setActiveTab('profile')} className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-bold ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><User size={18} /> Settings</button></div><div className="space-y-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Quick Create</p><div className="grid grid-cols-3 gap-2"><button onClick={() => handleQuickCreate('card')} className="flex flex-col items-center justify-center bg-slate-800 hover:bg-indigo-600 hover:text-white p-3 rounded-xl border border-slate-700 transition-all group"><Layers size={20} className="text-slate-400 group-hover:text-white mb-1"/><span className="text-[9px] font-bold text-slate-400 group-hover:text-white">Deck</span></button><button onClick={() => handleQuickCreate('test')} className="flex flex-col items-center justify-center bg-slate-800 hover:bg-rose-600 hover:text-white p-3 rounded-xl border border-slate-700 transition-all group"><HelpCircle size={20} className="text-slate-400 group-hover:text-white mb-1"/><span className="text-[9px] font-bold text-slate-400 group-hover:text-white">Quiz</span></button><button onClick={() => handleQuickCreate('lesson')} className="flex flex-col items-center justify-center bg-slate-800 hover:bg-emerald-600 hover:text-white p-3 rounded-xl border border-slate-700 transition-all group"><BookOpen size={20} className="text-slate-400 group-hover:text-white mb-1"/><span className="text-[9px] font-bold text-slate-400 group-hover:text-white">Unit</span></button></div></div><div className="px-1"><button onClick={() => setShowBroadcast(true)} className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-rose-900/50 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"><Megaphone size={16}/> Broadcast Alert</button></div><div className="space-y-1"><div className="flex justify-between items-center px-2 mb-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Classes</p><span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{userData.classes?.length || 0}</span></div><div className="space-y-1">{userData.classes?.length > 0 ? userData.classes.map((cls: any) => (<button key={cls.id} onClick={() => handleClassShortcut(cls.id)} className="w-full px-3 py-2 rounded-lg flex items-center justify-between group hover:bg-slate-800 transition-colors text-left"><div className="flex items-center gap-2 overflow-hidden"><div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:animate-pulse shrink-0"></div><span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{cls.name}</span></div><ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400"/></button>)) : <div className="px-3 py-4 text-center border border-dashed border-slate-800 rounded-xl"><p className="text-[10px] text-slate-500">No classes yet</p></div>}</div></div></div><div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="w-full p-3 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center gap-2 hover:bg-rose-900/20 hover:text-rose-300 transition-colors font-bold text-xs uppercase tracking-wider"><LogOut size={16} /> Sign Out</button></div></div>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
         <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 z-50"><span className="font-bold flex items-center gap-2"><GraduationCap/> Magister</span><div className="flex gap-4"><button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}><LayoutDashboard/></button><button onClick={() => setActiveTab('inbox')} className={activeTab === 'inbox' ? 'text-indigo-400' : 'text-slate-400'}><Inbox/></button><button onClick={() => setActiveTab('classes')} className={activeTab === 'classes' ? 'text-indigo-400' : 'text-slate-400'}><School/></button><button onClick={() => setActiveTab('content')} className={activeTab === 'content' ? 'text-indigo-400' : 'text-slate-400'}><Library/></button></div></div>
         <div className="flex-1 overflow-hidden relative">
            {activeTab === 'dashboard' && (<div className="h-full flex flex-col"><div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0"><div><h2 className="text-lg font-bold text-slate-800">Live Command Center</h2><p className="text-xs text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Active • {new Date().toLocaleDateString()}</p></div><div className="flex gap-4 text-center"><div><span className="block text-lg font-black text-slate-800 leading-none">{userData.classes?.length || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase">Classes</span></div><div className="w-px h-8 bg-slate-100"></div><div><span className="block text-lg font-black text-indigo-600 leading-none">{allDecks.custom?.cards?.length || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase">Cards</span></div></div></div><div className="flex-1 overflow-hidden p-4 md:p-6 bg-slate-100/50"><LiveActivityFeed /></div></div>)}
            {activeTab === 'inbox' && <div className="h-full overflow-hidden"><InstructorInbox onGradeSubmission={handleGradeSubmission} /></div>}
            {activeTab === 'analytics' && <div className="h-full overflow-y-auto bg-slate-50"><AnalyticsDashboard classes={userData.classes || []} /></div>}
            {activeTab === 'classes' && <div className="h-full overflow-y-auto p-4 md:p-8"><ClassManagerView user={user} classes={userData?.classes || []} lessons={lessons} allDecks={allDecks} initialClassId={viewClassId} onClearSelection={() => setViewClassId(null)} /></div>}
            {activeTab === 'content' && <div className="h-full overflow-hidden flex flex-col bg-white"><BuilderHub onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} onSaveLesson={onSaveLesson} allDecks={allDecks} lessons={lessons} initialMode={builderInitMode} onClearMode={() => setBuilderInitMode(null)} /></div>}
            {activeTab === 'profile' && <ProfileView user={user} userData={userData} />}
         </div>
      </div>
    </div>
  );
}

function StudentNavBar({ activeTab, setActiveTab }: any) {
    const tabs = [{ id: 'home', label: 'Home', icon: LayoutDashboard }, { id: 'discovery', label: 'Explore', icon: Compass }, { id: 'flashcards', label: 'Practice', icon: Layers }, { id: 'profile', label: 'Me', icon: User }];
    return (
        <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe pt-2 px-6 z-40 flex justify-between items-center h-[85px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 w-16 ${isActive ? 'text-indigo-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600'}`}><div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100' : ''}`}><tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-indigo-100' : ''}/></div><span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 scale-0'} transition-all duration-300 absolute -bottom-2`}>{tab.label}</span></button>);
            })}
        </nav>
    );
}

// ============================================================================
//  MAIN APP COMPONENT
// ============================================================================
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
    const decks: any = { ...systemDecks, custom: { title: "✍️ Scriptorium", cards: [] } };
    customCards.forEach(card => {
        const target = card.deckId || 'custom';
        if (!decks[target]) { decks[target] = { title: card.deckTitle || "Custom Deck", cards: [] }; }
        if (!decks[target].cards) decks[target].cards = [];
        decks[target].cards.push(card);
    });
    return decks;
  }, [systemDecks, customCards]);

  const lessons = useMemo(() => [...systemLessons, ...customLessons, ...classLessons.filter(l => l.contentType !== 'deck')], [systemLessons, customLessons, classLessons]);
  const libraryLessons = useMemo(() => [...systemLessons, ...customLessons], [systemLessons, customLessons]);

  const displayName = useMemo(() => {
      if (userData?.name && userData.name !== 'Student' && userData.name !== 'User') return userData.name;
      if (user?.displayName) return user.displayName;
      if (user?.email) return user.email.split('@')[0];
      return 'Scholar';
  }, [userData, user]);

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
    const unsubClasses = onSnapshot(qClasses, (snapshot) => { const cls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setEnrolledClasses(cls); const newAssignments: any[] = []; cls.forEach((c: any) => { if (c.assignments && Array.isArray(c.assignments)) { newAssignments.push(...c.assignments); } }); setClassLessons(newAssignments); setUserData((prev: any) => ({...prev, classes: cls, classAssignments: newAssignments})); }, (error) => { console.log("Class sync error:", error); setUserData((prev: any) => ({...prev, classSyncError: true})); });
    return () => { unsubProfile(); unsubCards(); unsubLessons(); unsubSysDecks(); unsubSysLessons(); unsubClasses(); };
  }, [user, userData?.role]);

  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card. Check permissions."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Are you sure you want to delete this card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); alert("Failed to delete card."); } }, [user]);
  const handleCreateLesson = useCallback(async (l: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), l); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), l); } setActiveTab('home'); }, [user]);
  const handleUpdatePreferences = useCallback(async (prefs: any) => { if (!user) return; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { deckPreferences: prefs }); setUserData((prev: any) => ({ ...prev, deckPreferences: prefs })); }, [user]);
  const handleDeleteDeck = useCallback(async (deckId: string) => { if(!user) return; if(!window.confirm("Delete this deck?")) return; try { const toDelete = customCards.filter(c => c.deckId === deckId); for(const c of toDelete) { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', c.id)); } setSelectedDeckKey('custom'); } catch(e) { console.error(e); } }, [user, customCards]);
  const handleLogSelfStudy = useCallback(async (deckId: string, xp: number, title: string, scoreDetail?: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp) }); await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: displayName, studentEmail: user.email, itemTitle: title, itemId: deckId, xp: xp, timestamp: Date.now(), type: 'self_study', scoreDetail }); } catch (e) { console.error("Log failed", e); } }, [user, displayName]);
  const handleFinishLesson = useCallback(async (lessonId: string, xp: number, title: string = 'Lesson', score: any = null) => { setActiveTab('home'); if (xp > 0 && user) { try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp), completedAssignments: arrayUnion(lessonId) }); await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: displayName, studentEmail: user.email, itemTitle: title, xp: xp, timestamp: Date.now(), type: 'completion', scoreDetail: score }); } catch (e) { console.error(e); } } }, [user, displayName]);

  if (!authChecked) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>;
  if (!user) return <AuthView />;
  if (!userData) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>; 
  
  const commonHandlers = { onSaveCard: handleCreateCard, onUpdateCard: handleUpdateCard, onDeleteCard: handleDeleteCard, onSaveLesson: handleCreateLesson, };
  const isInstructor = userData.role === 'instructor';

  if (isInstructor) { return <InstructorDashboard user={user} userData={{...userData, classes: enrolledClasses}} allDecks={allDecks} lessons={libraryLessons} {...commonHandlers} onLogout={() => signOut(auth)} />; }

  const renderStudentView = () => {
    let content;
    let viewKey; 

    if (activeLesson) {
        viewKey = `lesson-${activeLesson.id}`;
        content = <LessonView lesson={activeLesson} onFinish={handleFinishLesson} />;
    } else if (activeTab === 'home' && activeStudentClass) {
        viewKey = `class-${activeStudentClass.id}`;
        content = <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} user={user} displayName={displayName} />;
    } else {
        viewKey = `tab-${activeTab}`;
        switch (activeTab) {
            case 'home': content = <HomeView setActiveTab={setActiveTab} allDecks={allDecks} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} user={user} />; break;
            case 'discovery': content = <DiscoveryView allDecks={allDecks} user={user} onSelectDeck={handleContentSelection} />; break;
            case 'flashcards': const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck'); const deckToLoad = assignedDeck || allDecks[selectedDeckKey]; content = <FlashcardView allDecks={allDecks} selectedDeckKey={selectedDeckKey} onSelectDeck={setSelectedDeckKey} onSaveCard={handleCreateCard} activeDeckOverride={deckToLoad} onComplete={handleFinishLesson} onLogActivity={handleLogSelfStudy} userData={userData} user={user} onUpdatePrefs={handleUpdatePreferences} onDeleteDeck={handleDeleteDeck} />; break;
            case 'create': content = <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={handleCreateLesson} allDecks={allDecks} lessons={lessons} />; break;
            case 'profile': content = <ProfileView user={user} userData={userData} />; break;
            default: content = <HomeView />;
        }
    }
    const isLessonMode = !!activeLesson;
    return <div key={viewKey} className={`h-full w-full animate-in fade-in duration-300 ${!isLessonMode ? 'pt-12' : ''}`}>{content}</div>;
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans text-slate-900 flex justify-center items-start relative overflow-hidden">
      <div className="w-full max-w-md h-[100dvh] bg-white shadow-2xl relative overflow-hidden flex flex-col">
        <div className="flex-1 h-full overflow-hidden relative">{renderStudentView()}</div>
        {!activeLesson && <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
      <style>{` .perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } .pb-safe { padding-bottom: env(safe-area-inset-bottom); } `}</style>
    </div>
  );
}

export default App;
