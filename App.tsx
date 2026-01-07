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
  CheckCircle2, Circle, Activity, Clock, Compass, Globe, RotateCcw, Play, Maximize2
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
//  LESSON VIEW SUB-COMPONENTS (Juiced)
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
//  DISCOVERY VIEW (Explore Tab)
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
//  HOME VIEW (Clean)
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

// --- SUB-COMPONENTS (Keep existing implementations or simple stubs) ---
function MatchingGame({ deckCards, onGameEnd }: any) { return <div className="p-10 text-center"><p>Matching Game Stub</p><button onClick={() => onGameEnd(50)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Finish</button></div>; }
function QuizGame({ deckCards, onGameEnd }: any) { return <div className="p-10 text-center"><p>Quiz Game Stub</p><button onClick={() => onGameEnd(50)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Finish</button></div>; }
function TowerMode({ allDecks, user, onExit, onXPUpdate }: any) { return <div className="fixed inset-0 bg-slate-900 z-[60] flex items-center justify-center text-white"><div className="text-center"><h1>The Tower</h1><p>Climb to the top!</p><button onClick={onExit} className="mt-4 bg-white text-black px-4 py-2 rounded">Exit</button></div></div>; }

// ============================================================================
//  4-BUTTON NAVIGATION BAR
// ============================================================================
function StudentNavBar({ activeTab, setActiveTab }: any) {
    const tabs = [
        { id: 'home', label: 'Home', icon: LayoutDashboard },
        { id: 'discovery', label: 'Explore', icon: Compass },   // <--- The New 4th Button
        { id: 'flashcards', label: 'Practice', icon: Layers },
        { id: 'profile', label: 'Me', icon: User }
    ];

    return (
        <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe pt-2 px-6 z-40 flex justify-between items-center h-[85px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex flex-col items-center gap-1 transition-all duration-300 w-16 ${isActive ? 'text-indigo-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100' : ''}`}>
                            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-indigo-100' : ''}/>
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 scale-0'} transition-all duration-300 absolute -bottom-2`}>
                            {tab.label}
                        </span>
                    </button>
                );
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
  
  // Content & State
  const [systemDecks, setSystemDecks] = useState<any>({});
  const [systemLessons, setSystemLessons] = useState<any[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [selectedDeckKey, setSelectedDeckKey] = useState('salutationes');
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [classLessons, setClassLessons] = useState<any[]>([]);
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

  // --- EFFECTS ---
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
        cls.forEach((c: any) => { if (c.assignments && Array.isArray(c.assignments)) { newAssignments.push(...c.assignments); } }); 
        setClassLessons(newAssignments); 
        setUserData((prev: any) => ({...prev, classes: cls, classAssignments: newAssignments})); 
    }, (error) => { console.log("Class sync error:", error); setUserData((prev: any) => ({...prev, classSyncError: true})); });
    
    return () => { unsubProfile(); unsubCards(); unsubLessons(); unsubSysDecks(); unsubSysLessons(); unsubClasses(); };
  }, [user, userData?.role]);

  // --- HANDLERS ---
  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Delete card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); } }, [user]);
  const handleCreateLesson = useCallback(async (l: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), l); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), l); } setActiveTab('home'); }, [user]);
  const handleUpdatePreferences = useCallback(async (prefs: any) => { if (!user) return; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { deckPreferences: prefs }); setUserData((prev: any) => ({ ...prev, deckPreferences: prefs })); }, [user]);
  const handleDeleteDeck = useCallback(async (deckId: string) => { if(!user) return; if(!window.confirm("Delete this deck?")) return; try { const toDelete = customCards.filter(c => c.deckId === deckId); for(const c of toDelete) { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', c.id)); } setSelectedDeckKey('custom'); } catch(e) { console.error(e); } }, [user, customCards]);
  const handleLogSelfStudy = useCallback(async (deckId: string, xp: number, title: string, scoreDetail?: any) => { 
      if (!user) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp) }); 
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: displayName, studentEmail: user.email, itemTitle: title, itemId: deckId, xp: xp, timestamp: Date.now(), type: 'self_study', scoreDetail }); 
      } catch (e) { console.error(e); } 
  }, [user, displayName]);

  const handleFinishLesson = useCallback(async (lessonId: string, xp: number, title: string = 'Lesson', score: any = null) => { 
    setActiveTab('home'); 
    if (xp > 0 && user) { 
        try { 
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp), completedAssignments: arrayUnion(lessonId) }); 
            await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: displayName, studentEmail: user.email, itemTitle: title, xp: xp, timestamp: Date.now(), type: 'completion', scoreDetail: score });
        } catch (e) { console.error(e); } 
    } 
  }, [user, displayName]);

  if (!authChecked) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>;
  if (!user) return <AuthView />;
  if (!userData) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>; 
  
  const commonHandlers = { onSaveCard: handleCreateCard, onUpdateCard: handleUpdateCard, onDeleteCard: handleDeleteCard, onSaveLesson: handleCreateLesson, };
  const isInstructor = userData.role === 'instructor';

  if (isInstructor) {
      return <InstructorDashboard user={user} userData={{...userData, classes: enrolledClasses}} allDecks={allDecks} lessons={libraryLessons} {...commonHandlers} onLogout={() => signOut(auth)} />;
  }

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
            case 'home': 
                content = <HomeView setActiveTab={setActiveTab} allDecks={allDecks} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} user={user} />;
                break;
            case 'discovery': 
                content = <DiscoveryView allDecks={allDecks} user={user} onSelectDeck={handleContentSelection} />;
                break;
            case 'flashcards': 
                const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck');
                const deckToLoad = assignedDeck || allDecks[selectedDeckKey];
                content = <FlashcardView allDecks={allDecks} selectedDeckKey={selectedDeckKey} onSelectDeck={setSelectedDeckKey} onSaveCard={handleCreateCard} activeDeckOverride={deckToLoad} onComplete={handleFinishLesson} onLogActivity={handleLogSelfStudy} userData={userData} user={user} onUpdatePrefs={handleUpdatePreferences} onDeleteDeck={handleDeleteDeck} />;
                break;
            case 'create': 
                content = <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={handleCreateLesson} allDecks={allDecks} lessons={lessons} />;
                break;
            case 'profile': 
                content = <ProfileView user={user} userData={userData} />;
                break;
            default: 
                content = <HomeView />;
        }
    }

    const isLessonMode = !!activeLesson;
    return (
        <div key={viewKey} className={`h-full w-full animate-in fade-in duration-300 ${!isLessonMode ? 'pt-12' : ''}`}>
            {content}
        </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans text-slate-900 flex justify-center items-start relative overflow-hidden">
      <div className="w-full max-w-md h-[100dvh] bg-white shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* VIEWPORT CONTENT */}
        <div className="flex-1 h-full overflow-hidden relative">
            {renderStudentView()}
        </div>

        {/* BOTTOM NAVIGATION (4 BUTTONS) */}
        {!activeLesson && <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
      <style>{` 
        .perspective-1000 { perspective: 1000px; } 
        .preserve-3d { transform-style: preserve-3d; } 
        .backface-hidden { backface-visibility: hidden; } 
        .rotate-y-180 { transform: rotateY(180deg); } 
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } 
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}
export default App;
