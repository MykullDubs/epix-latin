import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, 
  increment, writeBatch, deleteDoc, arrayUnion, arrayRemove, query, where, collectionGroup, 
  orderBy, limit 
} from "firebase/firestore";
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
  Filter, SlidersHorizontal, Hash, Gauge, ChevronLeft, Monitor  // <--- ADDED MISSING ICONS
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

// --- CONFIG: DAILY QUESTS ---
const DAILY_QUESTS = [
  { id: 'q_cards', label: "Review 10 Cards", target: 10, xp: 50, icon: 'layers', type: 'self_study' },
  { id: 'q_quiz',  label: "Complete a Quiz", target: 1,  xp: 100, icon: 'help-circle', type: 'quiz_complete' },
  { id: 'q_explore', label: "Find a New Deck", target: 1,  xp: 20,  icon: 'search', type: 'explore_deck' },
];

// --- SEED DATA ---
const INITIAL_SYSTEM_DECKS = {
  prep_time: {
    title: "Prepositions of Time ⏰",
    targetLanguage: "English",
    description: "Master the tricky rules of 'at', 'in', and 'on' for dates and schedules.",
    cards: [
      { id: 't1', front: "at (time)", back: "Used for precise times (e.g., 5:00 PM, midnight).", type: "grammar" },
      { id: 't2', front: "in (months/years)", back: "Used for months, years, centuries, and long periods.", type: "grammar" },
      { id: 't3', front: "on (days)", back: "Used for days and dates (e.g., Tuesday, July 4th).", type: "grammar" },
      { id: 't4', front: "during", back: "Used when something happens within a specific period.", type: "grammar" },
      { id: 't5', front: "by", back: "Not later than; at or before.", type: "grammar" },
      { id: 't6', front: "until", back: "Up to a certain point in time.", type: "grammar" },
      { id: 't7', front: "since", back: "From a starting point in the past until now.", type: "grammar" },
      { id: 't8', front: "for (duration)", back: "Used to show an amount of time (e.g., 2 hours).", type: "grammar" },
    ]
  },
  prep_place: {
    title: "Prepositions of Place 📍",
    targetLanguage: "English",
    description: "Learn to describe where objects are located relative to others.",
    cards: [
      { id: 'p1', front: "in (place)", back: "Inside an enclosed space or container.", type: "grammar" },
      { id: 'p2', front: "on (surface)", back: "Touching the surface of something.", type: "grammar" },
      { id: 'p3', front: "at (point)", back: "Specific point or location (e.g., the bus stop).", type: "grammar" },
      { id: 'p4', front: "under", back: "Directly below something.", type: "grammar" },
      { id: 'p5', front: "between", back: "In the space separating two objects.", type: "grammar" },
      { id: 'p6', front: "behind", back: "At the back of something.", type: "grammar" },
      { id: 'p7', front: "in front of", back: "Further forward than someone or something.", type: "grammar" },
      { id: 'p8', front: "next to / beside", back: "At the side of someone or something.", type: "grammar" },
    ]
  },
  prep_movement: {
    title: "Prepositions of Movement 🏃",
    targetLanguage: "English",
    description: "Vocabulary for giving directions and describing motion.",
    cards: [
      { id: 'm1', front: "to", back: "Movement towards a specific destination.", type: "grammar" },
      { id: 'm2', front: "through", back: "Movement in one side and out the other.", type: "grammar" },
      { id: 'm3', front: "across", back: "Movement from one side to the other side.", type: "grammar" },
      { id: 'm4', front: "into", back: "Movement entering an enclosed space.", type: "grammar" },
      { id: 'm5', front: "along", back: "Movement following a line (e.g., a road).", type: "grammar" },
      { id: 'm6', front: "over", back: "Movement above and across something.", type: "grammar" },
      { id: 'm7', front: "past", back: "Moving beyond something without stopping.", type: "grammar" },
      { id: 'm8', front: "towards", back: "Movement in the direction of something.", type: "grammar" },
    ]
  }
};
const INITIAL_SYSTEM_LESSONS = [
  {
    id: "lesson_time_travelers",
    title: "Time Traveler's Guide ⏳",
    subtitle: "Mastering 'at', 'in', and 'on'",
    description: "Learn how to speak about time correctly so you don't arrive in the wrong century.",
    xp: 150,
    type: "lesson",
    vocab: ["Midnight", "Century", "Tuesday"],
    relatedDeckId: "prep_time",
    blocks: [
      {
        type: "text",
        title: "The Pyramid of Time",
        content: "Imagine time as a pyramid. At the bottom, we have big periods (IN). In the middle, specific days (ON). At the top, precise moments (AT)."
      },
      {
        type: "note",
        variant: "tip",
        title: "The Golden Rule",
        content: "Use 'IN' for non-specific times (In the morning, In 1999). Use 'ON' for days (On Monday). Use 'AT' for clock times (At 5 PM)."
      },
      {
        type: "flashcard",
        front: "at (time)",
        back: "Specific times (e.g. 5:00 PM, midnight, sunset)",
        title: "Concept Check"
      },
      {
        type: "quiz",
        question: "I will meet you ___ 5:00 PM.",
        options: [
          { id: "a", text: "on" },
          { id: "b", text: "in" },
          { id: "c", text: "at" }
        ],
        correctId: "c"
      },
      {
        type: "dialogue",
        lines: [
          { speaker: "Alice", text: "When is your flight?", translation: "¿Cuándo es tu vuelo?", side: "left" },
          { speaker: "Bob", text: "It leaves at 9 PM on Friday.", translation: "Sale a las 9 PM el viernes.", side: "right" },
          { speaker: "Alice", text: "Call me in the morning!", translation: "¡Llámame en la mañana!", side: "left" }
        ]
      }
    ]
  },
  {
    id: "lesson_city_nav",
    title: "Navigating the City 🗺️",
    subtitle: "Movement & Place",
    description: "How to give directions and explain where things are located.",
    xp: 150,
    type: "lesson",
    vocab: ["Across", "Toward", "Past"],
    relatedDeckId: "prep_movement",
    blocks: [
      {
        type: "text",
        title: "Moving Through Space",
        content: "Prepositions of movement tell us where to go. They usually follow verbs of motion like 'go', 'walk', or 'run'."
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
        caption: "Go across the bridge and through the tunnel."
      },
      {
        type: "vocab-list",
        items: [
          { term: "Towards", definition: "In the direction of something." },
          { term: "Past", definition: "Going beyond something without stopping." },
          { term: "Through", definition: "Moving in one side and out the other." }
        ]
      },
      {
        type: "scenario",
        nodes: [
          {
            id: "start",
            speaker: "Tourist",
            text: "Excuse me, how do I get to the bank?",
            options: [
              { text: "Go past the park.", nextNodeId: "correct_1" },
              { text: "Go at the park.", nextNodeId: "wrong_1" }
            ]
          },
          {
            id: "wrong_1",
            speaker: "Tourist",
            text: "Go at the park? That sounds weird.",
            color: "failure",
            options: [{ text: "Try Again", nextNodeId: "start" }]
          },
          {
            id: "correct_1",
            speaker: "Tourist",
            text: "Okay, I go past the park. Then what?",
            color: "success",
            options: [
              { text: "Walk through the tunnel.", nextNodeId: "end" },
              { text: "Walk on the tunnel.", nextNodeId: "wrong_2" }
            ]
          }
        ]
      }
    ]
  }
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
//  DEFINITIVE LESSON ENGINE (Sub-components + Main View)
// ============================================================================

// 1. CONCEPT CARD (Single Interactive Card)
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

// 2. JUICY DECK (Vocab List / Multiple Cards)
const JuicyDeckBlock = ({ items, title }: any) => {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    // Safety check for empty items to prevent white screen
    if (!items || items.length === 0) return null;
    const currentCard = items[index] || items[0];
    
    const handleSwipe = (dir: number) => { setIsFlipped(false); setTimeout(() => { setIndex((prev) => (prev + dir + items.length) % items.length); }, 200); };
    return (
        <div className="my-8 w-[90%] max-w-sm mx-auto relative">
            <div className="flex justify-between items-center mb-4 px-2"><h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layers size={14}/> {title || "Flashcards"}</h4><div className="flex gap-1">{items.map((_:any, i:number) => <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-200'}`} />)}</div></div>
            <div className="group h-64 cursor-pointer relative perspective-1000" onClick={() => setIsFlipped(!isFlipped)}><div className="relative w-full h-full transition-all duration-500 transform-style-3d" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}><div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><span className="absolute top-4 left-4 text-[10px] font-bold text-slate-300 uppercase">Term</span><h3 className="text-2xl font-black text-slate-800">{currentCard.term || currentCard.front}</h3><p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-medium uppercase tracking-widest">Tap to Flip</p></div><div className="absolute inset-0 bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-white text-center backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><span className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase">Definition</span><p className="text-lg font-medium leading-relaxed relative z-10">{currentCard.definition || currentCard.back}</p></div></div><div className="absolute top-2 left-2 w-full h-full bg-slate-100 rounded-2xl -z-10 border border-slate-200 shadow-sm transform rotate-2"></div></div>
            <div className="flex justify-between items-center mt-6 px-4"><button onClick={() => handleSwipe(-1)} className="p-3 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm active:scale-95"><ArrowLeft size={20}/></button><div className="text-xs font-bold text-slate-400">{index + 1} / {items.length}</div><button onClick={() => handleSwipe(1)} className="p-3 rounded-full bg-slate-900 text-white shadow-lg hover:bg-indigo-600 active:scale-95"><ArrowRight size={20}/></button></div>
        </div>
    );
};

// 3. SCENARIO BLOCK (Branching)
const ScenarioBlock = ({ block, onComplete }: any) => {
    const [currentNodeId, setCurrentNodeId] = useState(block?.nodes?.[0]?.id);
    const [history, setHistory] = useState<string[]>([]);
    
    // Safety check if nodes are missing
    if (!block?.nodes || block.nodes.length === 0) return <div className="p-4 bg-red-50 text-red-500">Error: Invalid Scenario Data</div>;

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

// 4. QUIZ BLOCK
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

// 5. CHAT DIALOGUE
const ChatDialogueBlock = ({ lines }: any) => (
    <div className="space-y-4 my-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
        {lines && lines.map((line: any, i: number) => {
            const isA = line.speaker === 'A' || i % 2 === 0;
            return (<div key={i} className={`flex ${isA ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-sm relative shadow-sm ${isA ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}><p className="font-medium leading-relaxed text-base">{line.text}</p>{line.translation && <p className={`text-xs mt-2 pt-2 border-t ${isA ? 'border-slate-100 text-slate-400' : 'border-indigo-500/50 text-indigo-200'}`}>{line.translation}</p>}<span className={`absolute -top-5 text-[10px] font-bold text-slate-400 ${isA ? 'left-0' : 'right-0'}`}>{line.speaker}</span></div></div>);
        })}
    </div>
);
// 1. Define the Interface for Props
interface ClassViewProps {
lessonId: string | null;
lessons: any[]; // Replace 'any' with your Lesson type if defined
}

function ClassView({ lessonId, lessons }: ClassViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 2. Find the specific lesson data from the passed lessons array
  const activeLessonData = lessons.find(l => l.id === lessonId);

  useEffect(() => {
    // Ensure we have a valid lessonId before listening
    if (!lessonId) return;

    // Use your existing 'db' constant
    const docRef = doc(db, 'live_sessions', lessonId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.activeSlide !== undefined) {
          setCurrentSlide(data.activeSlide);
        }
      }
    });
  }, [lessonId]);

  // Handle case where lesson isn't found yet
  if (!activeLessonData) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400 font-bold">
        Loading Lesson Data...
      </div>
    );
  }

  // Get the current content block safely
  const currentBlock = activeLessonData.content?.[currentSlide];

  return (
    <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-20 z-[100] fixed inset-0">
      <div className="animate-in fade-in zoom-in duration-500 max-w-5xl text-center">
        <h2 className="text-6xl font-black text-slate-900 mb-12 tracking-tight">
          {activeLessonData.title}
        </h2>
        
        {currentBlock && (
          <div className="text-5xl leading-tight text-slate-600 font-medium">
            {currentBlock.text}
          </div>
        )}
      </div>
      
      <div className="absolute bottom-12 right-12 flex items-center gap-4 opacity-40">
        <div className="bg-indigo-600 w-3 h-3 rounded-full animate-pulse" />
        <span className="font-bold text-sm tracking-widest text-slate-500 uppercase">
          Live Class Mode
        </span>
      </div>
    </div>
  );
}

// ============================================================================
//  LESSON VIEW (Modern "Story" Style)
// ============================================================================
function LessonView({ lesson, onFinish, isInstructor = false }: any) {
  useLearningTimer(auth.currentUser, lesson.id, 'lesson', lesson.title);

  // 1. SMART PAGING ALGORITHM
  const pages = useMemo(() => {
    const rawBlocks = lesson.blocks || [];
    const groupedPages: any[] = [];
    let currentBuffer: any[] = [];

    rawBlocks.forEach((block: any) => {
      const isInteractive = ['quiz', 'flashcard', 'scenario'].includes(block.type);
      if (isInteractive) {
        if (currentBuffer.length > 0) {
          groupedPages.push({ type: 'read', blocks: [...currentBuffer] });
          currentBuffer = [];
        }
        groupedPages.push({ type: 'interact', blocks: [block] });
      } else {
        currentBuffer.push(block);
      }
    });

    if (currentBuffer.length > 0) {
      groupedPages.push({ type: 'read', blocks: [...currentBuffer] });
    }
    return groupedPages;
  }, [lesson]);

  // 2. State & Scrolling
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [isLiveSynced, setIsLiveSynced] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // LIVE SYNC: Receive updates (Students)
  useEffect(() => {
    if (!lesson.id || isInstructor) return;
    const docRef = doc(db, 'live_sessions', lesson.id);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.activePageIdx === 'number') {
          setCurrentPageIdx(data.activePageIdx);
        }
      }
    });
    return () => unsub();
  }, [lesson.id, isInstructor]);

  // LIVE SYNC: Broadcast updates (Instructor)
  const broadcastNavigation = async (index: number) => {
    if (!isInstructor || !isLiveSynced) return;
    const docRef = doc(db, 'live_sessions', lesson.id);
    await setDoc(docRef, {
      activePageIdx: index,
      updatedAt: Date.now()
    }, { merge: true });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPageIdx]);

  const currentPage = pages[currentPageIdx];
  const isLastPage = currentPageIdx >= pages.length - 1;

  const handleNext = () => {
    if (!isLastPage) {
      const nextIdx = currentPageIdx + 1;
      setCurrentPageIdx(nextIdx);
      broadcastNavigation(nextIdx);
    } else {
      onFinish(lesson.id, lesson.xp, lesson.title);
    }
  };

  const handlePrev = () => {
    if (currentPageIdx > 0) {
      const prevIdx = currentPageIdx - 1;
      setCurrentPageIdx(prevIdx);
      broadcastNavigation(prevIdx);
    }
  };

  // 3. Block Renderer
  const renderBlock = (block: any, idx: number) => {
    switch (block.type) {
      case 'text': return (
        <div key={idx} className="my-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {block.title && <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">{block.title}</h2>}
          <div className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap font-serif antialiased">{block.content}</div>
        </div>
      );
      case 'image': return (
        <div key={idx} className="my-8 space-y-3 animate-in zoom-in-95 duration-500 group">
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
            <img src={block.url} alt="Lesson" className="w-full object-cover" />
          </div>
        </div>
      );
      case 'vocab-list': return <div key={idx} className="my-8"><JuicyDeckBlock items={block.items} title="Key Vocabulary" /></div>;
      case 'dialogue': return <div key={idx} className="my-8"><ChatDialogueBlock lines={block.lines} /></div>;
      case 'note': {
        const styles: any = {
          info: { bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Info size={24} className="text-indigo-600" />, title: 'text-indigo-900' },
          tip: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <Zap size={24} className="text-emerald-600 fill-emerald-600" />, title: 'text-emerald-900' },
          warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: <AlertTriangle size={24} className="text-amber-600" />, title: 'text-amber-900' }
        };
        const s = styles[block.variant || 'info'] || styles.info;
        return (
          <div key={idx} className={`rounded-[2rem] border-2 ${s.border} ${s.bg} p-8 my-10 flex gap-6 items-start animate-in slide-in-from-left-4`}>
            <div className="shrink-0 bg-white p-3 rounded-2xl shadow-sm">{s.icon}</div>
            <div>
              <h4 className={`font-black text-sm uppercase tracking-widest mb-2 opacity-70 ${s.title}`}>{block.title || block.variant}</h4>
              <p className={`text-lg font-medium leading-relaxed ${s.title}`}>{block.content}</p>
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  const isInteractivePage = currentPage?.type === 'interact';

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 pt-12 pb-4 px-6">
        <div className="flex gap-1.5 mb-4">
          {pages.map((_, idx) => (
            <div key={idx} className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${idx <= currentPageIdx ? 'bg-indigo-600' : 'bg-transparent'}`}
                style={{ width: idx <= currentPageIdx ? '100%' : '0%' }}
              ></div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button onClick={() => onFinish(null, 0)} className="p-2 -ml-2 rounded-full text-slate-400 hover:bg-slate-50">
            <X size={24} />
          </button>

          <div className="text-center">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">{lesson.title}</h2>
            <div className="flex items-center gap-2 justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isInteractivePage ? 'Interactive' : `Part ${currentPageIdx + 1}`}
              </p>
              {isInstructor && (
                <button
                  onClick={() => setIsLiveSynced(!isLiveSynced)}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase transition-all ${isLiveSynced ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}
                >
                  {isLiveSynced ? '● Sync Active' : 'Sync Off'}
                </button>
              )}
            </div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        <div className="px-8 py-6 max-w-3xl mx-auto w-full pb-40 min-h-full flex flex-col">
          {currentPage?.blocks.map((block: any, idx: number) => (
            isInteractivePage ? (
              <div key={idx} className="flex-1 flex flex-col justify-center py-10 animate-in zoom-in-95 duration-500">
                {block.type === 'quiz' && <QuizBlock block={block} onComplete={handleNext} />}
                {block.type === 'flashcard' && (
                  <div className="flex flex-col items-center">
                    <ConceptCardBlock front={block.front} back={block.back} context={block.title} />
                    <button onClick={handleNext} className="mt-12 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center gap-3">
                      Continue <ArrowRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            ) : renderBlock(block, idx)
          ))}
        </div>
      </div>

      {/* INSTRUCTOR FLOATING REMOTE */}
      {isInstructor && isLiveSynced && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex gap-3 bg-white/90 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl border border-slate-100 z-[60] animate-in slide-in-from-bottom-10">
          <button onClick={handlePrev} disabled={currentPageIdx === 0} className="p-5 bg-slate-50 text-slate-400 rounded-3xl disabled:opacity-20 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={28} />
          </button>
          <div className="px-6 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Slide</span>
            <span className="text-2xl font-black text-slate-900">{currentPageIdx + 1}</span>
          </div>
          <button onClick={handleNext} className="p-5 bg-indigo-600 text-white rounded-3xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            <ChevronRight size={28} />
          </button>
        </div>
      )}

      {/* MOBILE FOOTER */}
      {!isInteractivePage && (
        <div className="fixed bottom-8 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
          <button
            onClick={handleNext}
            className="pointer-events-auto shadow-2xl bg-indigo-600 text-white px-10 py-5 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 animate-in slide-in-from-bottom-4"
          >
            {isLastPage ? "Finish" : "Continue"}
            {isLastPage ? <Check size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
          </button>
        </div>
      )}
    </div>
  );
}
// ============================================================================
//  MOONSHOT EXPLORE (Unified Lessons & Decks)
// ============================================================================
function DiscoveryView({ allDecks, lessons, user, onSelectDeck, onSelectLesson, onLogActivity, userData }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortMode, setSortMode] = useState<'relevance' | 'size' | 'alpha'>('relevance');

    // --- 1. THE FUZZY BRAIN (Unified) ---
    const { processedItems, categories, difficultyGroups } = useMemo(() => {
        
        // A. Normalize Decks
        const deckEntries = Object.entries(allDecks || {})
            .filter(([, deck]: any) => !deck.isAssignment)
            .map(([id, deck]: any) => ({
                id,
                ...deck,
                contentType: 'deck',
                magnitude: (deck.cards?.length || 0), // Base size metric
                displayCount: `${deck.cards?.length || 0} Cards`,
                _searchStr: `${deck.title} ${deck.targetLanguage || ''} ${deck.description || ''} vocab flashcards`.toLowerCase()
            }));

        // B. Normalize Lessons
        const lessonEntries = (lessons || [])
            .map((lesson: any) => ({
                ...lesson,
                contentType: 'lesson',
                // Weight blocks higher than cards for "Size" sorting (1 block ~= 3 cards effort)
                magnitude: (lesson.blocks?.length || 0) * 3, 
                displayCount: `${lesson.blocks?.length || 0} Blocks`,
                _searchStr: `${lesson.title} ${lesson.subtitle || ''} ${lesson.description || ''} reading lesson`.toLowerCase()
            }));

        // C. Merge
        let entries = [...deckEntries, ...lessonEntries];

        // D. Extract Categories
        const uniqueLangs = Array.from(new Set(entries.map((d: any) => d.targetLanguage || 'General')));
        const cats = ['All', ...uniqueLangs];

        // E. Filter Logic
        if (activeCategory !== 'All') {
            entries = entries.filter((d: any) => (d.targetLanguage || 'General') === activeCategory);
        }

        // F. Fuzzy Search Scoring
        if (searchTerm.trim()) {
            const tokens = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
            entries = entries.map((d: any) => {
                let score = 0;
                if (d.title.toLowerCase().includes(searchTerm.toLowerCase())) score += 10;
                tokens.forEach(token => { if (d._searchStr.includes(token)) score += 2; });
                return { ...d, _score: score };
            }).filter((d: any) => d._score > 0);
        } else {
            // Randomize freshness if no search
            entries = entries.map((d: any) => ({ ...d, _score: Math.random() }));
        }

        // G. Sorting Logic
        entries.sort((a: any, b: any) => {
            if (sortMode === 'size') return b.magnitude - a.magnitude;
            if (sortMode === 'alpha') return a.title.localeCompare(b.title);
            return b._score - a._score;
        });

        // H. Grouping by Difficulty (Unified Magnitude)
        // Quick: < 10 items (or < 3 lesson blocks)
        // Master: > 30 items (or > 10 lesson blocks)
        const groups = {
            quick: entries.filter((d: any) => d.magnitude < 10),
            standard: entries.filter((d: any) => d.magnitude >= 10 && d.magnitude < 30),
            master: entries.filter((d: any) => d.magnitude >= 30)
        };

        return { processedItems: entries, categories: cats, difficultyGroups: groups };
    }, [allDecks, lessons, searchTerm, activeCategory, sortMode]);

    // --- 2. QUEST DATA ---
    const quests = useMemo(() => {
        const userProgress = userData?.questProgress || {};
        const Q = [
            { id: 'q_cards', label: "Review 10 Cards", target: 10, xp: 50, icon: <Layers size={14}/> },
            { id: 'q_quiz',  label: "Complete a Quiz", target: 1,  xp: 100, icon: <HelpCircle size={14}/> },
            { id: 'q_explore', label: "Find New Content", target: 1,  xp: 20,  icon: <Search size={14}/> },
        ];
        return Q.map(q => ({ ...q, current: userProgress[q.id] || 0, done: (userProgress[q.id] || 0) >= q.target }));
    }, [userData]);

    // Handler
    const handleItemClick = (item: any) => {
        if (onLogActivity) onLogActivity('explore_deck', 0, "Exploration");
        
        if (item.contentType === 'lesson') {
            onSelectLesson(item);
        } else {
            onSelectDeck(item);
        }
    };

    const isSearching = searchTerm.length > 0;

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
            
            {/* HEADER */}
            <div className="px-6 pt-12 pb-4 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-20 sticky top-0 shadow-sm transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                        <Compass className="text-indigo-600" size={28} strokeWidth={2.5}/> Explore
                    </h1>
                    
                    <div className="flex gap-2">
                        <button onClick={() => setSortMode('relevance')} className={`p-2 rounded-full border transition-all ${sortMode === 'relevance' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`} title="Smart Sort"><Sparkles size={16}/></button>
                        <button onClick={() => setSortMode('size')} className={`p-2 rounded-full border transition-all ${sortMode === 'size' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`} title="Sort by Size"><BarChart3 size={16}/></button>
                        <button onClick={() => setSortMode('alpha')} className={`p-2 rounded-full border transition-all ${sortMode === 'alpha' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`} title="A-Z"><ArrowDown size={16}/></button>
                    </div>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Search lessons, decks, topics..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:bg-white outline-none transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pt-4 pb-2 -mx-6 px-6 scrollbar-hide">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                
                {/* 1. MARKETING SECTION */}
                {!isSearching && activeCategory === 'All' && (
                    <>
                        {/* Hero */}
                        {processedItems.length > 0 && (
                            <div className="px-6 pt-6 mb-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Star size={14} className="text-yellow-500 fill-yellow-500"/> Spotlight</h3>
                                <button onClick={() => handleItemClick(processedItems[0])} className="w-full relative h-56 rounded-[2.5rem] overflow-hidden shadow-2xl group text-left transition-transform active:scale-[0.98]">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-purple-600 to-orange-500 animate-in fade-in zoom-in duration-1000"></div>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Featured</div>
                                    <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                                        <div className="flex justify-between items-start mb-auto">
                                            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">{processedItems[0].contentType === 'lesson' ? 'Lesson' : 'Deck'}</div>
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                {processedItems[0].contentType === 'lesson' ? <BookOpen size={18}/> : <Layers size={18}/>}
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-black text-white leading-tight mb-2 line-clamp-2">{processedItems[0].title}</h2>
                                        <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold">
                                            <span>{processedItems[0].displayCount}</span>
                                            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                            <Globe size={14}/> {processedItems[0].targetLanguage || 'General'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Quests */}
                        <div className="px-6 mb-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14} className="text-rose-500"/> Daily Quests</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {quests.map((q: any) => (
                                    <div key={q.id} className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${q.done ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${q.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{q.done ? <Check size={16} strokeWidth={3}/> : q.icon}</div>
                                            <span className={`text-sm font-bold ${q.done ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{q.label}</span>
                                        </div>
                                        <span className={`text-xs font-black ${q.done ? 'text-emerald-600' : 'text-slate-600'}`}>+{q.xp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* 2. RESULTS GRID */}
                <div className="px-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        {isSearching ? <Search size={14}/> : <Map size={14}/>} 
                        {isSearching ? `Found ${processedItems.length} Matches` : 'Browse Collection'}
                    </h3>

                    {sortMode === 'size' && !isSearching ? (
                        <div className="space-y-8">
                            {difficultyGroups.master.length > 0 && <DeckGroup title="Master Class (Long)" items={difficultyGroups.master} onClick={handleItemClick} icon={<Trophy size={14} className="text-yellow-500"/>}/>}
                            {difficultyGroups.standard.length > 0 && <DeckGroup title="Standard" items={difficultyGroups.standard} onClick={handleItemClick} icon={<Layers size={14} className="text-indigo-500"/>}/>}
                            {difficultyGroups.quick.length > 0 && <DeckGroup title="Quick Bites" items={difficultyGroups.quick} onClick={handleItemClick} icon={<Zap size={14} className="text-orange-500"/>}/>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {processedItems.map((item: any) => (
                                <DiscoveryCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                            ))}
                        </div>
                    )}

                    {processedItems.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Search size={32}/></div>
                            <p className="text-slate-400 text-sm font-bold">No results found.</p>
                            <button onClick={() => {setSearchTerm(''); setActiveCategory('All');}} className="text-indigo-600 text-xs font-bold mt-2">Clear Filters</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const DeckGroup = ({ title, items, onClick, icon }: any) => (
    <div>
        <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">{icon} {title}</h4>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
            {items.map((item: any) => (
                <button key={item.id} onClick={() => onClick(item)} className="snap-start min-w-[160px] h-44 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group flex flex-col justify-between text-left">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${item.contentType === 'lesson' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                        {item.contentType === 'lesson' ? <BookOpen size={18}/> : <Layers size={18}/>}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{item.displayCount}</p>
                    </div>
                </button>
            ))}
        </div>
    </div>
);

const DiscoveryCard = ({ item, onClick }: any) => {
    // Style logic: Blue for Lessons, Orange for Decks
    const isLesson = item.contentType === 'lesson';
    const bgClass = isLesson ? 'bg-indigo-50 group-hover:bg-indigo-100 group-hover:text-indigo-600' : 'bg-orange-50 group-hover:bg-orange-100 group-hover:text-orange-600';
    const textClass = isLesson ? 'text-indigo-400' : 'text-orange-400';

    return (
        <button onClick={onClick} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 hover:-translate-y-1 transition-all text-left group h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${textClass} ${bgClass}`}>
                    {isLesson ? <BookOpen size={18}/> : <Layers size={18}/>}
                </div>
                {item.xp && <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">+{item.xp} XP</span>}
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">{item.title}</h4>
                <div className="flex items-center gap-1.5 mt-2">
                    <Globe size={10} className="text-slate-300"/>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{item.targetLanguage || 'General'}</p>
                </div>
            </div>
        </button>
    );
}
// ============================================================================
//  HOME VIEW (Cleaned & Action-Oriented)
// ============================================================================
function HomeView({ setActiveTab, lessons, onSelectLesson, onSelectDeck, userData, assignments, classes, user }: any) {
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);
  
  // Scroll Reset
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
      const viewport = scrollViewportRef.current;
      if (viewport) { viewport.scrollTop = 0; setTimeout(() => { if (viewport) viewport.scrollTop = 0; }, 10); }
  }, []);

  const completedSet = new Set(userData?.completedAssignments || []);
  
  // Stats Calculation
  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const progress = ((xp % 1000) / 1000) * 100;
  const streak = userData?.streak || 1;
  const targetLang = userData?.targetLanguage || "English";

  // Dynamic Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userData?.name?.split(' ')[0] || "Learner";

  if (activeStudentClass) { 
      return <StudentClassView classData={activeStudentClass} onBack={() => setActiveStudentClass(null)} onSelectLesson={onSelectLesson} onSelectDeck={onSelectDeck} userData={userData} user={user} />; 
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
        
        {/* 1. PROFESSIONAL APP BAR (Sticky) */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
                    <GraduationCap size={18} strokeWidth={3}/>
                </div>
                <span className="font-black text-indigo-900 tracking-tighter text-lg">LLLMS</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-500"/>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{targetLang}</span>
            </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollViewportRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-32">
            
            {/* 2. HERO SECTION */}
            <div className="bg-white pt-6 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-medium text-slate-400 tracking-tight">{greeting},</h1>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">{firstName}.</h1>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center">
                        <Flame size={20} className="text-orange-500 mb-1 fill-orange-500"/>
                        <span className="text-lg font-black text-indigo-900">{streak}</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Day Streak</span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center">
                        <Zap size={20} className="text-yellow-500 mb-1 fill-yellow-500"/>
                        <span className="text-lg font-black text-indigo-900">{xp}</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Total XP</span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center">
                        <Trophy size={20} className="text-emerald-500 mb-1 fill-emerald-500"/>
                        <span className="text-lg font-black text-indigo-900">{level}</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Level</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{Math.round(1000 - (xp % 1000))} XP to Next Lvl</span>
                </div>
            </div>

            <div className="px-6 space-y-8 mt-8">
              
              {/* --- MY CLASSES --- */}
              {classes && classes.length > 0 ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">My Classes</h3>
                    </div>
                    
                    <div className="flex gap-5 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                        {classes.map((cls: any, index: number) => { 
                            const pending = (cls.assignments || []).filter((l: any) => (!l.targetStudents || l.targetStudents.includes(userData.email)) && !completedSet.has(l.id)).length;
                            const gradients = ["from-indigo-600 to-violet-600", "from-emerald-500 to-teal-600", "from-orange-500 to-rose-600", "from-blue-600 to-cyan-600"];
                            const themeGradient = gradients[index % gradients.length];

                            return ( 
                                <button key={cls.id} onClick={() => setActiveStudentClass(cls)} className="snap-start min-w-[280px] h-[180px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 transition-all duration-300 active:scale-95 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden flex flex-col text-left">
                                    <div className={`h-24 w-full bg-gradient-to-r ${themeGradient} relative p-5 flex justify-between items-start overflow-hidden`}>
                                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm z-10">{cls.name.charAt(0).toUpperCase()}</div>
                                        {pending > 0 ? (
                                            <div className="flex items-center gap-1.5 bg-white text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg z-10 animate-in zoom-in"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>{pending} Due</div>
                                        ) : (
                                            <div className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1"><Check size={12} strokeWidth={4}/> Done</div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between relative">
                                        <div className="absolute top-0 right-5 -mt-5 bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300"><ArrowRight size={16} /></div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-xl truncate leading-tight group-hover:text-indigo-600 transition-colors">{cls.name}</h4>
                                            <div className="flex items-center gap-2 mt-2"><span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{cls.code}</span><span className="text-[10px] font-bold text-slate-400">{(cls.students || []).length} Students</span></div>
                                        </div>
                                    </div>
                                </button> 
                            ); 
                        })}
                    </div>
                </div>
              ) : (
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center"><School size={32} className="mx-auto text-slate-300 mb-2"/><p className="text-sm text-slate-400 font-bold">No classes yet.</p><p className="text-xs text-slate-400 mt-1">Ask your instructor for a code.</p></div>
              )}

              {/* --- ACTION CARDS (REVAMPED) --- */}
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                
                {/* 1. Practice Card */}
                <button 
                    onClick={() => setActiveTab('flashcards')} 
                    className="relative h-40 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-orange-200/50 transition-all duration-300 active:scale-95 group text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500"></div>
                    <div className="absolute -right-4 -bottom-4 text-white opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                        <Layers size={100} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-inner">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xl leading-none mb-1">Vocab Gym</h3>
                            <p className="text-orange-100 text-xs font-medium">Train your brain</p>
                        </div>
                    </div>
                </button>

                {/* 2. Create Card */}
                <button 
                    onClick={() => setActiveTab('create')} 
                    className="relative h-40 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-emerald-200/50 transition-all duration-300 active:scale-95 group text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600"></div>
                    <div className="absolute -right-4 -bottom-4 text-white opacity-20 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                        <Feather size={100} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-inner">
                            <Feather size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xl leading-none mb-1">Studio</h3>
                            <p className="text-emerald-100 text-xs font-medium">Build & Share</p>
                        </div>
                    </div>
                </button>

              </div>

            </div>
        </div>
    </div>
  );
}
// ============================================================================
//  4. FLASHCARD VIEW & TOWER
// ============================================================================
function MatchingGame({ deckCards, onGameEnd }: any) {
    // Simple Pairs Game Logic
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);

    useEffect(() => {
        // Create pairs (Front -> Back)
        const gameItems = deckCards.slice(0, 6).flatMap((c: any) => [
            { id: c.id, text: c.front, type: 'front', pairId: c.id },
            { id: c.id + '_back', text: c.back, type: 'back', pairId: c.id }
        ]).sort(() => Math.random() - 0.5);
        setCards(gameItems);
    }, [deckCards]);

    const handleCardClick = (index: number) => {
        if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        
        if (newFlipped.length === 2) {
            const [idx1, idx2] = newFlipped;
            if (cards[idx1].pairId === cards[idx2].pairId) {
                setSolved(prev => [...prev, idx1, idx2]);
                setFlipped([]);
                if (solved.length + 2 === cards.length) setTimeout(() => onGameEnd(100), 500);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    if(cards.length === 0) return <div className="p-8 text-center text-slate-400">Not enough cards for matching.</div>;

    return (
        <div className="p-4 grid grid-cols-3 gap-3 h-full content-start">
            {cards.map((card, i) => (
                <button 
                    key={i} 
                    onClick={() => handleCardClick(i)}
                    className={`aspect-square rounded-xl text-xs font-bold flex items-center justify-center p-2 text-center transition-all duration-300 ${solved.includes(i) ? 'opacity-0' : flipped.includes(i) ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                >
                    {card.text}
                </button>
            ))}
        </div>
    );
}
// ============================================================================
//  QUIZ SESSION (Fixed Auto-Advance)
// ============================================================================
function QuizSessionView({ deckCards, onGameEnd }: any) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // Prevents double clicking

    // 1. Get Current Card
    const currentCard = deckCards[index];

    // 2. Generate Options (Correct Answer + 3 Random Distractors)
    const options = useMemo(() => {
        if (!currentCard) return [];
        const distractors = deckCards
            .filter((c: any) => c.id !== currentCard.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map((c: any) => c.back);
        
        return [...distractors, currentCard.back].sort(() => 0.5 - Math.random());
    }, [currentCard, deckCards]);

    // 3. Handle Click
    const handleOptionClick = (option: string) => {
        if (isProcessing) return; // Stop user from clicking multiple times
        setIsProcessing(true);
        setSelectedOption(option);

        const isCorrect = option === currentCard.back;
        const newScore = isCorrect ? score + 1 : score;
        if (isCorrect) setScore(newScore);

        // 4. WAIT & ADVANCE
        setTimeout(() => {
            if (index < deckCards.length - 1) {
                setIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsProcessing(false);
            } else {
                // Game Over
                onGameEnd({ score: newScore, total: deckCards.length });
            }
        }, 1200); // 1.2 second delay to see the result
    };

    if (!currentCard) return <div className="p-10 text-center">Loading...</div>;

    const progress = ((index) / deckCards.length) * 100;

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-6">
            
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Question {index + 1} / {deckCards.length}</span>
                    <span>Score: {score}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* The Question (Front of Card) */}
            <div className="bg-white rounded-3xl shadow-lg border-b-4 border-slate-100 p-10 flex flex-col items-center justify-center text-center min-h-[200px] mb-6 animate-in zoom-in-95 duration-300 key={index}">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Translate this</span>
                <h2 className="text-3xl font-black text-slate-800">{currentCard.front}</h2>
                {currentCard.ipa && <p className="text-sm font-mono text-slate-400 mt-2">{currentCard.ipa}</p>}
            </div>

            {/* The Options */}
            <div className="space-y-3">
                {options.map((opt, idx) => {
                    let stateStyles = "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md"; // Default
                    
                    if (selectedOption) {
                        if (opt === currentCard.back) {
                            stateStyles = "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200"; // Correct (Always highlight correct answer)
                        } else if (opt === selectedOption) {
                            stateStyles = "bg-rose-500 border-rose-600 text-white shadow-rose-200"; // Wrong (Highlight if user picked it)
                        } else {
                            stateStyles = "bg-slate-50 border-slate-100 text-slate-300 opacity-50"; // Others fade out
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(opt)}
                            disabled={isProcessing}
                            className={`w-full p-4 rounded-xl border-2 font-bold text-lg transition-all duration-200 active:scale-95 ${stateStyles} shadow-sm`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
function TowerMode({ allDecks, user, onExit, onXPUpdate }: any) { return <div className="fixed inset-0 bg-slate-900 z-[60] flex items-center justify-center text-white"><div className="text-center"><h1>The Tower</h1><p>Climb to the top!</p><button onClick={onExit} className="mt-4 bg-white text-black px-4 py-2 rounded">Exit</button></div></div>; }

// ============================================================================
//  VOCAB GYM (Fixed Data & Branding)
// ============================================================================
function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onSaveCard, activeDeckOverride, onComplete, onLogActivity, userData, user, onDeleteDeck }: any) {
  // Navigation State
  const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing'>('library');
  const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
  
  // LOGIC FIX: Robustly determine the current deck
  // 1. Use the override (from Home/Dashboard) if present.
  // 2. Use the selected key from the library.
  // 3. Fallback to the first deck in the list to prevent crashes.
  const resolvedDeck = activeDeckOverride || allDecks[selectedDeckKey] || Object.values(allDecks)[0];
  
  // Safety check for cards
  const cards = resolvedDeck?.cards || [];
  
  // BRANDING FIX: Rename "Scriptorium" if it appears
  const deckTitle = resolvedDeck?.title === "✍️ Scriptorium" ? "My Collection" : resolvedDeck?.title;

  // Sync state when entering from outside
  useEffect(() => {
      if (activeDeckOverride) {
          setInternalMode('menu');
      }
  }, [activeDeckOverride]);

  // --- Handlers ---
  const launchGame = (mode: 'standard' | 'quiz' | 'match' | 'tower') => {
      setActiveGame(mode);
      setInternalMode('playing');
  };

  const handleBack = () => {
      if (internalMode === 'playing') setInternalMode('menu');
      else if (internalMode === 'menu') {
          setInternalMode('library');
          onSelectDeck(null); 
      }
  };

  const handleGameFinish = (score: number) => {
      const baseXP = activeGame === 'quiz' ? 50 : activeGame === 'match' ? 30 : 10;
      const earnedXP = Math.round(baseXP * (score / 100)); 
      
      // Log analytics
      onLogActivity(resolvedDeck.id || 'custom', earnedXP, `${deckTitle} (${activeGame})`, { score, mode: activeGame });
      
      setInternalMode('menu');
      alert(`Workout Complete! +${earnedXP} XP`);
  };

  // --- 1. LIBRARY VIEW ---
  if (internalMode === 'library') {
      return (
          <div className="h-full flex flex-col bg-slate-50">
              {/* Sticky Gym Header */}
              <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                  <div className="flex items-center gap-2">
                      <div className="bg-orange-500 text-white p-1.5 rounded-lg shadow-sm">
                          <Dumbbell size={18} strokeWidth={3}/>
                      </div>
                      <span className="font-black text-slate-800 tracking-tight text-lg">Vocab Gym</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{Object.keys(allDecks).length} Decks</div>
              </div>

              {/* Deck Grid */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pb-32">
                  <div className="grid grid-cols-1 gap-4">
                      {Object.entries(allDecks).map(([key, deck]: any) => {
                          const dTitle = deck.title === "✍️ Scriptorium" ? "My Collection" : deck.title;
                          const cardCount = deck.cards?.length || 0;
                          const mastery = Math.floor(Math.random() * 100); // Visual juice placeholder
                          
                          return (
                              <button 
                                  key={key} 
                                  onClick={() => { onSelectDeck(key); setInternalMode('menu'); }}
                                  className="group relative bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden w-full"
                              >
                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:from-orange-50 group-hover:to-amber-50 transition-all duration-500"></div>
                                  
                                  <div className="relative z-10 flex justify-between items-start">
                                      <div className="flex items-center gap-4">
                                          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                              {deck.icon || <Layers size={24}/>}
                                          </div>
                                          <div>
                                              <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">{dTitle}</h3>
                                              <p className="text-xs text-slate-400 font-bold mt-1">{cardCount} Cards</p>
                                          </div>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-white group-hover:text-orange-500 shadow-sm transition-colors">
                                          <Play size={16} fill="currentColor"/>
                                      </div>
                                  </div>

                                  {/* Mastery Bar */}
                                  <div className="relative z-10 mt-6">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                          <span>Mastery</span>
                                          <span>{mastery}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000" style={{ width: `${mastery}%` }}></div>
                                      </div>
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // --- 2. THE MENU VIEW ---
  if (internalMode === 'menu') {
      if (!resolvedDeck) return <div className="p-8 text-center">Loading Deck...</div>;

      return (
          <div className="h-full flex flex-col bg-slate-50">
              <div className="px-6 py-6 pb-0">
                  <button onClick={handleBack} className="flex items-center text-slate-400 hover:text-orange-600 mb-4 text-sm font-bold transition-colors">
                      <ArrowLeft size={16} className="mr-1"/> Back to Library
                  </button>
                  <h1 className="text-3xl font-black text-slate-900 mb-2">{deckTitle}</h1>
                  <p className="text-slate-500 text-sm font-medium">{cards.length} cards available.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-32">
                  {cards.length < 4 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                          <Layers size={48} className="text-slate-300 mx-auto mb-4"/>
                          <h3 className="font-bold text-slate-600">Not enough cards</h3>
                          <p className="text-xs text-slate-400 mt-2 mb-6">You need at least 4 cards to unlock games.</p>
                          {/* Only show Add button if it's the custom deck */}
                          {(!resolvedDeck.id || resolvedDeck.id === 'custom') && (
                              <button onClick={() => alert("Go to Studio tab to add cards!")} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                                  Add Cards in Studio
                              </button>
                          )}
                      </div>
                  ) : (
                      <>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Choose Workout</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <button onClick={() => launchGame('standard')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all group text-left">
                                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Layers size={24}/></div>
                                  <h4 className="font-bold text-slate-800">Flashcards</h4>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Standard Mode</p>
                              </button>
                              <button onClick={() => launchGame('quiz')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all group text-left">
                                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><HelpCircle size={24}/></div>
                                  <h4 className="font-bold text-slate-800">Quiz Mode</h4>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Multiple Choice</p>
                              </button>
                              <button onClick={() => launchGame('match')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-1 transition-all group text-left">
                                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Puzzle size={24}/></div>
                                  <h4 className="font-bold text-slate-800">Match 'Em</h4>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Speed Pairs</p>
                              </button>
                              <button onClick={() => launchGame('tower')} className="bg-slate-900 p-5 rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50"></div>
                                  <div className="relative z-10">
                                      <div className="w-12 h-12 bg-white/10 text-orange-400 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform backdrop-blur-md"><Zap size={24} fill="currentColor"/></div>
                                      <h4 className="font-bold text-white">The Tower</h4>
                                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Survival Mode</p>
                                  </div>
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
      );
  }

  // --- 3. THE PLAYING VIEW ---
  return (
      <div className="h-full flex flex-col bg-slate-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-20">
              <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
              <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{activeGame === 'tower' ? 'Survival' : activeGame}</span>
                  <span className="text-sm font-black text-slate-800">{deckTitle}</span>
              </div>
              <div className="w-8"></div>
          </div>

          <div className="flex-1 overflow-hidden relative">
              {activeGame === 'standard' && <div className="h-full flex flex-col justify-center pb-20"><JuicyDeckBlock items={cards} title="Study Mode" /></div>}
              {activeGame === 'quiz' && <div className="h-full overflow-y-auto"><QuizSessionView deckCards={cards} onGameEnd={(res: any) => handleGameFinish(res.score ? (res.score/res.total)*100 : 0)} /></div>}
              {activeGame === 'match' && <MatchingGame deckCards={cards} onGameEnd={(score: number) => handleGameFinish(score)} />}
              {activeGame === 'tower' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-bounce"><Zap size={40} className="text-orange-400 fill-orange-400"/></div>
                      <h2 className="text-2xl font-black text-slate-900">The Tower</h2>
                      <p className="text-slate-500 mt-2 mb-8">This mode is under construction by the architects.</p>
                      <button onClick={handleBack} className="px-6 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300">Retreat</button>
                  </div>
              )}
          </div>
      </div>
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

// --- PROFILE HELPER: CALCULATE STATS ---
const calculateUserStats = (logs: any[]) => {
    let totalSeconds = 0;
    let cardsMastered = 0;
    let perfectScores = 0;
    const activityByDay: any = {};

    // Initialize last 7 days
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        activityByDay[d.toLocaleDateString()] = 0;
    }

    logs.forEach(log => {
        // Time
        if (log.type === 'time_log') totalSeconds += (log.duration || 0);
        
        // Activity Graph
        const dateKey = new Date(log.timestamp).toLocaleDateString();
        if (activityByDay[dateKey] !== undefined) {
            activityByDay[dateKey] += (log.xp || 10);
        }

        // Achievements
        if (log.type === 'completion' && log.scoreDetail?.finalScorePct === 100) perfectScores++;
        if (log.type === 'self_study') cardsMastered += 1; // Approx
    });

    const graphData = Object.keys(activityByDay).map(date => ({
        date: date.split('/')[0] + '/' + date.split('/')[1], // Short date
        xp: activityByDay[date],
        height: Math.min(100, Math.max(10, (activityByDay[date] / 200) * 100)) // Scale to 100px max
    }));

    return { 
        totalHours: (totalSeconds / 3600).toFixed(1),
        cardsMastered, 
        perfectScores, 
        graphData 
    };
};

// ============================================================================
//  ULTIMATE PROFILE VIEW (Revamped & Juicified)
// ============================================================================
function ProfileView({ user, userData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalHours: 0, cardsMastered: 0, perfectScores: 0, graphData: [] });
  const [deploying, setDeploying] = useState(false);

  // Fetch History & Calculate Stats
  useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('studentEmail', '==', user.email), orderBy('timestamp', 'desc'), limit(100));
      const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => d.data());
          setLogs(data);
          setStats(calculateUserStats(data));
      });
      return () => unsub();
  }, [user]);

  const handleLogout = () => signOut(auth);
  
  const toggleRole = async () => { 
      if (!userData) return; 
      const newRole = userData.role === 'instructor' ? 'student' : 'instructor'; 
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { role: newRole }); 
  };

  const deploySystemContent = async () => { 
      if (!window.confirm("Overwrite system content? This is an admin action.")) return;
      setDeploying(true); 
      const batch = writeBatch(db); 
      Object.entries(INITIAL_SYSTEM_DECKS).forEach(([key, deck]) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_decks', key), deck)); 
      INITIAL_SYSTEM_LESSONS.forEach((lesson) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'system_lessons', lesson.id), lesson)); 
      try { await batch.commit(); alert("Content Deployed!"); } catch (e: any) { alert("Error: " + e.message); } 
      setDeploying(false); 
  };

  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = 1000 - (xp % 1000);
  const progressPct = (xp % 1000) / 10;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar pb-32">
        
        {/* 1. HERO HEADER (Glassmorphism) */}
        <div className="relative overflow-hidden bg-white pb-8 rounded-b-[3rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] z-10 border-b border-slate-100">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500"></div>
            <div className="absolute top-0 left-0 w-full h-48 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            
            <div className="relative pt-12 px-6 flex flex-col items-center">
                {/* Avatar */}
                <div className="w-28 h-28 p-1.5 bg-white/20 backdrop-blur-md rounded-full shadow-2xl mb-4 border border-white/30">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-4xl font-black text-slate-800 shadow-inner">
                        {userData?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                </div>
                
                {/* Name & Role */}
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">{userData?.name}</h2>
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">{userData?.role}</span>
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                        <Globe size={12}/> {userData?.targetLanguage || 'English'}
                    </span>
                </div>

                {/* Glass Stats Bar */}
                <div className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 flex justify-between items-center border border-slate-100">
                    <div className="text-center flex-1 border-r border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Level</div>
                        <div className="text-2xl font-black text-slate-800">{level}</div>
                    </div>
                    <div className="text-center flex-1 border-r border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">XP</div>
                        <div className="text-2xl font-black text-indigo-600">{xp}</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Streak</div>
                        <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                            <Flame size={20} fill="currentColor"/> {userData?.streak || 1}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="px-6 mt-6 space-y-6">
            
            {/* 2. PROGRESS BENTO BOX */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Next Level</h3>
                        <p className="text-xs text-slate-400 font-bold">{Math.round(nextLevelXp)} XP remaining</p>
                    </div>
                    <Trophy size={24} className="text-yellow-500 fill-yellow-500 drop-shadow-sm group-hover:scale-110 transition-transform"/>
                </div>
                {/* Juicy Progress Bar */}
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative z-10">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 relative" style={{ width: `${progressPct}%` }}>
                        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50"></div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-50 rounded-full blur-2xl z-0"></div>
            </div>

            {/* 3. ACTIVITY GRAPH */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-600"/> Activity</h3>
                <div className="flex items-end justify-between h-24 gap-2">
                    {stats.graphData.map((d: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div 
                                className="w-full bg-slate-100 rounded-lg relative group-hover:bg-indigo-500 transition-colors duration-300 overflow-hidden"
                                style={{ height: `${d.height}%` }}
                            >
                                <div className="absolute bottom-0 left-0 w-full h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{d.date.split('/')[1]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. RECENT HISTORY TILES */}
            <div>
                <h3 className="font-black text-slate-800 mb-4 px-2 text-sm uppercase tracking-wider text-slate-400">Recent History</h3>
                <div className="space-y-3">
                    {logs.slice(0, 5).map((log: any) => (
                        <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default group">
                            <div className={`p-3 rounded-2xl shrink-0 ${log.type === 'completion' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {log.type === 'completion' ? <CheckCircle2 size={20} strokeWidth={2.5}/> : <Zap size={20} strokeWidth={2.5}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{log.itemTitle}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(log.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-indigo-600 text-sm block">+{log.xp}</span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase">XP</span>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-2xl">No history yet. Start learning!</div>}
                </div>
            </div>

            {/* 5. SETTINGS CONTROL PANEL */}
            <div className="bg-slate-200 p-1.5 rounded-[2rem]">
                <button onClick={toggleRole} className="w-full bg-white p-4 rounded-[1.5rem] text-slate-700 font-bold flex justify-between items-center mb-1.5 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
                    <span className="flex items-center gap-3"><Settings size={18} className="text-slate-400"/> Switch Role ({userData?.role})</span>
                    <div className="bg-slate-100 p-1 rounded-full"><ChevronRight size={16} className="text-slate-400"/></div>
                </button>
                {userData?.role === 'instructor' && (
                    <button onClick={deploySystemContent} disabled={deploying} className="w-full bg-white p-4 rounded-[1.5rem] text-slate-700 font-bold flex justify-between items-center mb-1.5 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
                        <span className="flex items-center gap-3"><UploadCloud size={18} className="text-slate-400"/> {deploying ? 'Deploying...' : 'Reset System Content'}</span>
                        <div className="bg-slate-100 p-1 rounded-full"><ChevronRight size={16} className="text-slate-400"/></div>
                    </button>
                )}
                <button onClick={handleLogout} className="w-full bg-white p-4 rounded-[1.5rem] text-rose-600 font-bold flex justify-between items-center active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
                    <span className="flex items-center gap-3"><LogOut size={18} className="text-rose-400"/> Sign Out</span>
                    <div className="bg-rose-50 p-1 rounded-full"><LogOut size={16} className="text-rose-400"/></div>
                </button>
            </div>

        </div>
    </div>
  );
}

// ============================================================================
//  GRADE DETAIL MODAL (Student View)
// ============================================================================
function GradeDetailModal({ log, onClose }: any) {
    if (!log) return null;
    const { scoreDetail, itemTitle, xp } = log;
    const isExam = scoreDetail && scoreDetail.details; // Check if it has question breakdown

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">{itemTitle}</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{new Date(log.timestamp).toLocaleDateString()} • +{xp} XP</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Score Hero */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className={`text-5xl font-black mb-2 ${scoreDetail?.finalScorePct >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {scoreDetail?.finalScorePct ?? 100}%
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Score</div>
                        {scoreDetail?.instructorFeedback && (
                            <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl max-w-md w-full text-center">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Instructor Feedback</span>
                                <p className="text-indigo-900 font-medium italic">"{scoreDetail.instructorFeedback}"</p>
                            </div>
                        )}
                    </div>

                    {/* Question Breakdown (Only if it's an Exam) */}
                    {isExam && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Question Breakdown</h3>
                            {scoreDetail.details.map((q: any, idx: number) => (
                                <div key={idx} className={`p-4 rounded-2xl border-2 ${q.isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">{q.awardedPoints} / {q.maxPoints} pts</span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm mb-2">{q.prompt}</p>
                                    
                                    <div className="text-sm text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-200/50 mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Your Answer</span>
                                        {q.studentVal}
                                    </div>

                                    {!q.isCorrect && q.correctVal && q.type !== 'essay' && (
                                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                            <CheckCircle2 size={12}/> Correct Answer: {q.correctVal}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
                    <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-[1.01] transition-transform">Close Report</button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  STUDENT GRADEBOOK (With Fuzzy Title Matching)
// ============================================================================
function StudentGradebook({ classData, user }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    useEffect(() => {
        if(!classData.assignments || classData.assignments.length === 0) { setLoading(false); return; }
        
        // 1. Fetch EVERYTHING recent for this student
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('studentEmail', '==', user.email),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const allLogs = snapshot.docs.map(d => d.data());
            // We don't filter here anymore to ensure we catch everything
            setLogs(allLogs);
            setLoading(false);
        });
        return () => unsub();
    }, [classData, user]);

    const getGradeStatus = (assign: any) => {
        // --- ROBUST MATCHING LOGIC ---
        // 1. Try Exact Match (Assignment ID) - Best Case
        let log = logs.find(l => l.itemId === assign.id && l.type === 'completion');
        
        // 2. Try Original ID Match (Content ID) - Fallback
        if (!log && assign.originalId) {
            log = logs.find(l => l.itemId === assign.originalId && l.type === 'completion');
        }

        // 3. Try Title Match (Fuzzy) - The "Savior" Case
        // If IDs failed but titles match, assume it's the right one.
        if (!log) {
            log = logs.find(l => l.itemTitle === assign.title && l.type === 'completion');
        }
        
        // If still nothing, it really is missing
        if (!log) return { status: 'missing', label: 'Not Started', color: 'bg-slate-100 text-slate-400', interactable: false };
        
        // --- SCORE DISPLAY LOGIC ---
        if (assign.contentType === 'test' || assign.contentType === 'exam') {
             if (log.scoreDetail?.status === 'pending_review') {
                 return { status: 'pending', label: 'In Review', color: 'bg-amber-100 text-amber-600', interactable: true, log };
             }
             
             const score = log.scoreDetail?.score || 0;
             const total = log.scoreDetail?.total || 100;
             const pct = log.scoreDetail?.finalScorePct ?? (total > 0 ? Math.round((score/total)*100) : 0);
             
             let color = 'bg-slate-100 text-slate-600';
             if (pct >= 90) color = 'bg-emerald-100 text-emerald-600';
             else if (pct >= 70) color = 'bg-indigo-100 text-indigo-600';
             else color = 'bg-rose-100 text-rose-600';

             return { status: 'complete', label: `${score}/${total} pts`, color, interactable: true, log };
        }

        return { status: 'complete', label: 'Complete', color: 'bg-emerald-100 text-emerald-600', interactable: true, log };
    };

    return (
        <>
            {selectedLog && <GradeDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-6 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={18} className="text-indigo-600"/> Report Card</h3></div>
                {classData.assignments?.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">No assignments yet.</div> : (
                    <div className="divide-y divide-slate-100">
                        {classData.assignments.map((assign: any) => {
                            const { status, label, color, interactable, log } = getGradeStatus(assign);
                            return (
                                <button key={assign.id} disabled={!interactable} onClick={() => interactable && setSelectedLog(log)} className={`w-full p-4 flex items-center justify-between transition-colors group text-left ${interactable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${assign.contentType === 'test' || assign.contentType === 'exam' ? 'bg-rose-100 text-rose-600' : assign.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {assign.contentType === 'deck' ? <Layers size={16}/> : (assign.contentType === 'test' || assign.contentType === 'exam') ? <FileText size={16}/> : <BookOpen size={16}/>}
                                        </div>
                                        <div><h4 className="font-bold text-slate-800 text-sm">{assign.title}</h4><p className="text-xs text-slate-400">{(assign.contentType === 'test' || assign.contentType === 'exam') ? 'Exam' : 'Lesson'}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3"><div className="text-right"><span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{label}</span>{log?.scoreDetail?.instructorFeedback && <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-500 font-bold"><MessageCircle size={10}/> Feedback</div>}</div>{interactable && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>}</div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
// ============================================================================
//  CLASS FORUM (Fixed Typing Bug)
// ============================================================================

// 1. Helper Component (Moved OUTSIDE to fix focus/typing bugs)
const InlineInput = ({ value, onChange, onSubmit, onCancel, placeholder, sending }: any) => (
    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex gap-2 items-start">
            <div className="flex-1 relative">
                <textarea
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                    placeholder={placeholder}
                    className="w-full p-3 bg-slate-50 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none resize-none text-sm min-h-[80px]"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                    <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><X size={14}/></button>
                    <button onClick={onSubmit} disabled={sending || !value.trim()} className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"><Send size={14}/></button>
                </div>
            </div>
        </div>
    </div>
);

function ClassForum({ classData, user }: any) {
    const [posts, setPosts] = useState<any[]>([]);
    
    // Global Composer
    const [mainContent, setMainContent] = useState('');
    const [isPostingMain, setIsPostingMain] = useState(false);

    // Reply State
    const [activeInputId, setActiveInputId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Accordion State
    const [expandedThreads, setExpandedThreads] = useState<any>({});

    // Live Feed
    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', appId, 'class_posts'),
            where('classId', '==', classData.id),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        const unsub = onSnapshot(q, (snap) => {
            setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [classData.id]);

    // Create New Thread
    const createPost = async () => {
        if (!mainContent.trim()) return;
        setIsPostingMain(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'class_posts'), {
                classId: classData.id,
                userId: user.uid,
                authorName: user.displayName || user.email.split('@')[0], 
                content: mainContent.trim(),
                timestamp: Date.now(),
                replies: [],
                likes: []
            });
            setMainContent('');
        } catch (e) { console.error(e); }
        setIsPostingMain(false);
    };

    // Add Reply
    const sendReply = async (parentPostId: string, replyToName?: string) => {
        if (!replyContent.trim()) return;
        setSendingReply(true);
        try {
            const postRef = doc(db, 'artifacts', appId, 'class_posts', parentPostId);
            const text = replyToName ? `@${replyToName} ${replyContent}` : replyContent;
            
            const newReply = {
                id: Date.now().toString(),
                userId: user.uid,
                authorName: user.displayName || user.email.split('@')[0],
                content: text.trim(),
                timestamp: Date.now()
            };
            
            await updateDoc(postRef, { replies: arrayUnion(newReply) });
            
            setReplyContent('');
            setActiveInputId(null); 
            setExpandedThreads({ ...expandedThreads, [parentPostId]: true });
        } catch (e) { console.error(e); }
        setSendingReply(false);
    };

    const toggleAccordion = (postId: string) => {
        setExpandedThreads((prev: any) => ({ ...prev, [postId]: !prev[postId] }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {/* MAIN POST COMPOSER */}
            <div className="p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
                <div className="relative group">
                    <textarea 
                        value={mainContent} 
                        onChange={(e) => setMainContent(e.target.value)} 
                        placeholder={`Start a new discussion...`} 
                        className="w-full p-4 pr-14 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none text-sm font-medium h-20 placeholder:text-slate-400" 
                    />
                    <button onClick={createPost} disabled={isPostingMain || !mainContent.trim()} className="absolute bottom-3 right-3 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center">
                        {isPostingMain ? <Loader size={18} className="animate-spin"/> : <Send size={18} className="ml-0.5"/>}
                    </button>
                </div>
            </div>

            {/* FEED */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24">
                {posts.length === 0 && (
                    <div className="text-center py-12 opacity-60">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare size={32} className="text-slate-400"/></div>
                        <p className="text-sm font-bold text-slate-500">It's quiet in here...</p>
                    </div>
                )}

                {posts.map((post) => {
                    const replies = post.replies || [];
                    const isExpanded = expandedThreads[post.id];
                    const visibleReplies = isExpanded ? replies : replies.slice(-2);
                    const hiddenCount = replies.length - visibleReplies.length;

                    return (
                        <div key={post.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                            
                            {/* ROOT POST */}
                            <div className="flex gap-3 relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 border-2 border-white z-10">
                                    {post.authorName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-black text-slate-800 text-sm truncate">{post.authorName}</span>
                                        <span className="text-[10px] font-bold text-slate-400 shrink-0">{new Date(post.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">{post.content}</p>
                                    
                                    {/* Root Actions */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <button 
                                            onClick={() => { setActiveInputId(activeInputId === post.id ? null : post.id); setReplyContent(''); }} 
                                            className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                        >
                                            <MessageCircle size={14}/> Reply
                                        </button>
                                        {hiddenCount > 0 && (
                                            <button onClick={() => toggleAccordion(post.id)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                <MoreHorizontal size={12}/> View {hiddenCount} more
                                            </button>
                                        )}
                                        {isExpanded && replies.length > 2 && (
                                            <button onClick={() => toggleAccordion(post.id)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Collapse</button>
                                        )}
                                    </div>

                                    {/* Inline Input for Root */}
                                    {activeInputId === post.id && (
                                        <InlineInput 
                                            value={replyContent}
                                            onChange={setReplyContent}
                                            placeholder="Write a reply..." 
                                            onSubmit={() => sendReply(post.id)} 
                                            onCancel={() => setActiveInputId(null)}
                                            sending={sendingReply}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* REPLIES */}
                            {visibleReplies.length > 0 && (
                                <div className="mt-4 space-y-4">
                                    {visibleReplies.map((reply: any) => (
                                        <div key={reply.id} className="flex gap-3 relative pl-4 group">
                                            <div className="absolute left-[19px] -top-6 bottom-0 w-px bg-slate-200"></div>
                                            <div className="absolute left-[19px] top-3 w-4 h-px bg-slate-200"></div>

                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 border border-slate-200 z-10 relative">
                                                {reply.authorName.charAt(0).toUpperCase()}
                                            </div>
                                            
                                            <div className="flex-1 bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 relative">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="font-bold text-slate-700 text-xs">{reply.authorName}</span>
                                                    <span className="text-[9px] text-slate-400">{new Date(reply.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <p className="text-slate-600 text-xs leading-relaxed">{reply.content}</p>
                                                
                                                <div className="mt-2 flex">
                                                    <button 
                                                        onClick={() => { setActiveInputId(activeInputId === reply.id ? null : reply.id); setReplyContent(`@${reply.authorName} `); }} 
                                                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                                                    >
                                                        <CornerDownRight size={10}/> Reply
                                                    </button>
                                                </div>

                                                {/* Inline Input for Sub-Reply */}
                                                {activeInputId === reply.id && (
                                                    <InlineInput 
                                                        value={replyContent}
                                                        onChange={setReplyContent}
                                                        placeholder={`Reply to ${reply.authorName}...`} 
                                                        onSubmit={() => sendReply(post.id)} 
                                                        onCancel={() => setActiveInputId(null)} 
                                                        sending={sendingReply}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// ============================================================================
//  STUDENT CLASS VIEW (Categorized Tabs)
// ============================================================================
// ============================================================================
//  STUDENT CLASS VIEW (Revamped UI)
// ============================================================================
function StudentClassView({ 
  classData, 
  onBack, 
  onSelectLesson, 
  onSelectDeck, 
  userData, 
  allLessons = [], 
  classLessons = [], // This will now receive the 'assignments' array
  setActiveTab, 
  setSelectedLessonId 
}: any) {
    
    const resolvedLessons = useMemo(() => {
        const currentClassId = classData?.id || classData?.uid;

        // Filter assignments by the current class ID
        return classLessons.filter((assignment: any) => {
            return assignment.classId === currentClassId || 
                   assignment.courseId === currentClassId ||
                   assignment.class === currentClassId;
        }).map((assignment: any) => {
            // Find full details from the master library
            const lessonId = assignment.lessonId || assignment.id;
            const fullLesson = allLessons.find((l: any) => l.id === lessonId);
            return fullLesson ? { ...fullLesson, ...assignment } : assignment;
        });
    }, [classData, allLessons, classLessons]);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 shadow-sm">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-4">
                    <ChevronLeft size={18} /> Back
                </button>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{classData?.name}</h1>
                <p className="text-slate-500 font-medium">
                    {resolvedLessons.length} lessons available
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {resolvedLessons.length > 0 ? resolvedLessons.map((lesson: any) => (
                    <div key={lesson.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex-1 pr-4">
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{lesson.title}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">
                                {lesson.type || 'Lesson'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {/* Student View Button */}
                            <button 
                                onClick={() => onSelectLesson(lesson)} 
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                                Open
                            </button>
                            
                            {/* Instructor Presentation Button */}
                            {userData?.role === 'instructor' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLessonId(lesson.lessonId || lesson.id);
                                        setActiveTab('presentation');
                                    }}
                                    className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                    title="Present to Class"
                                >
                                    <Monitor size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                        <p className="text-slate-400 font-bold">No assignments matched for this class.</p>
                        <p className="text-[10px] text-slate-300 mt-2 font-mono uppercase tracking-widest">
                            Class ID: {classData?.id}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
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
//  INSTRUCTOR GRADING SUITE (Inbox)
// ============================================================================
function InstructorInbox({ onGradeSubmission }: any) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  
  // Local state for the grade adjustments
  const [grades, setGrades] = useState<any>({}); // { questionIndex: pointsAwarded }

  useEffect(() => { 
      const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('scoreDetail.status', '==', 'pending_review'), orderBy('timestamp', 'asc')); 
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
      }
  }, [selectedItem]);

  const handlePointChange = (idx: number, points: number) => {
      setGrades({ ...grades, [idx]: points });
  };

  const calculateTotal = () => {
      return Object.values(grades).reduce((acc: number, val: any) => acc + (parseInt(val) || 0), 0);
  };

  const handleSubmitGrade = async () => { 
      if(!selectedItem) return; 
      const finalScore = calculateTotal();
      const totalPossible = selectedItem.scoreDetail.total;
      const scorePct = Math.round((finalScore / totalPossible) * 100);
      
      // Update the submission with individual question grades if you wanted to be fancy,
      // but for now we just update the total score and status.
      await onGradeSubmission(selectedItem.id, finalScore, feedback, scorePct); 
      setSelectedId(null); 
      setFeedback(''); 
      setGrades({});
  };

  return ( 
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
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
                    <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
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
                                            {/* Status Badge */}
                                            {q.type === 'essay' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle size={10}/> Essay</span>}
                                        </div>
                                        {/* Point Input */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Points:</label>
                                            <input type="number" min="0" max={q.maxPoints} value={grades[idx] || 0} onChange={(e) => handlePointChange(idx, parseInt(e.target.value))} className="w-16 p-1 text-center font-bold border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                            <span className="text-xs font-bold text-slate-400">/ {q.maxPoints}</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-4">{q.prompt}</h3>
                                    
                                    {/* Student Answer Display */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap font-serif leading-relaxed">
                                        {q.studentVal}
                                    </div>
                                    
                                    {/* Correct Answer (If applicable) */}
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
//  INSTRUCTOR GRADEBOOK (Fixed: Robust Matching)
// ============================================================================
function InstructorGradebook({ classData }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    
    useEffect(() => {
        if(!classData.assignments || classData.assignments.length === 0 || !classData.students || classData.students.length === 0) return;
        
        // 1. Fetch ALL recent completions for students in this class
        // We act broadly here and filter in memory to catch everything
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('type', '==', 'completion'), // Only finished items
            where('studentEmail', 'in', classData.students.slice(0, 10)), // Firestore 'in' limit is 10. For larger classes, you'd need multiple queries or client-side filtering.
            orderBy('timestamp', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(d => d.data());
            setLogs(all);
        });
        return () => unsub();
    }, [classData]);

    const getScoreCell = (studentEmail: string, assign: any) => {
        // --- ROBUST MATCHING LOGIC (Same as Student View) ---
        // 1. Try Exact Match (Assignment ID)
        let log = logs.find(l => l.studentEmail === studentEmail && l.itemId === assign.id);
        
        // 2. Try Original ID
        if (!log && assign.originalId) {
            log = logs.find(l => l.studentEmail === studentEmail && l.itemId === assign.originalId);
        }

        // 3. Try Title Match
        if (!log) {
            log = logs.find(l => l.studentEmail === studentEmail && l.itemTitle === assign.title);
        }

        if (!log) return <span className="text-slate-300">-</span>;
        
        if (log.scoreDetail?.status === 'pending_review') {
            return <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">Needs Grade</span>;
        }

        // Calculate Score %
        let pct = 100;
        if (log.scoreDetail?.finalScorePct !== undefined) pct = log.scoreDetail.finalScorePct;
        else if (log.scoreDetail?.total > 0) pct = Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100);
        
        const color = pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50';
        
        return <span className={`text-xs font-bold px-2 py-1 rounded ${color}`}>{pct}%</span>;
    };

    if (!classData.students || classData.students.length === 0) return <div className="p-8 text-center text-slate-400">No students in roster.</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Student</th>
                        {classData.assignments.map((a: any) => (
                            <th key={a.id} className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap min-w-[120px] text-center border-r border-slate-100 last:border-0">{a.title}</th>
                        ))}
                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-200">Avg</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {classData.students.map((student: string) => (
                        <tr key={student} className="hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-700 text-sm sticky left-0 bg-white border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                {student.split('@')[0]}
                                <div className="text-[9px] text-slate-400 font-normal">{student}</div>
                            </td>
                            {classData.assignments.map((a: any) => (
                                <td key={a.id} className="p-4 text-center border-r border-slate-50 last:border-0">
                                    {getScoreCell(student, a)}
                                </td>
                            ))}
                            <td className="p-4 text-right font-mono text-xs text-slate-400 sticky right-0 bg-white border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                                {(() => {
                                    // Calculate row average based on VISIBLE cells only
                                    let totalPct = 0;
                                    let count = 0;
                                    classData.assignments.forEach((a: any) => {
                                        // Re-run find logic simply to get the stats
                                        let log = logs.find(l => l.studentEmail === student && l.itemId === a.id);
                                        if (!log && a.originalId) log = logs.find(l => l.studentEmail === student && l.itemId === a.originalId);
                                        if (!log) log = logs.find(l => l.studentEmail === student && l.itemTitle === a.title);

                                        if (log) {
                                            let p = 100;
                                            if (log.scoreDetail?.finalScorePct !== undefined) p = log.scoreDetail.finalScorePct;
                                            else if (log.scoreDetail?.total > 0) p = Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100);
                                            totalPct += p;
                                            count++;
                                        }
                                    });
                                    return count === 0 ? '-' : Math.round(totalPct / count) + '%';
                                })()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
// ============================================================================
//  CLASS MANAGER (With Juicy Revoke Modal)
// ============================================================================
function ClassManagerView({ user, classes, lessons, allDecks }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  
  // Modals & Feedback
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // NEW: State for the Revoke Modal
  const [assignmentToRemove, setAssignmentToRemove] = useState<any>(null);

  // Assignment Logic State
  const [targetStudentMode, setTargetStudentMode] = useState('all'); 
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assignType, setAssignType] = useState<'deck' | 'lesson' | 'exam'>('lesson');
  const [activeTab, setActiveTab] = useState<'overview' | 'gradebook'>('overview');
  
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  const availableExams = lessons.filter((l: any) => l.type === 'test' || l.type === 'exam');
  const availableLessons = lessons.filter((l: any) => l.type !== 'test' && l.type !== 'exam');

  // --- ACTIONS ---
  const createClass = async (e: any) => { e.preventDefault(); if (!newClassName.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { name: newClassName, code: Math.random().toString(36).substring(2, 8).toUpperCase(), students: [], studentEmails: [], assignments: [], created: Date.now() }); setNewClassName(''); setToastMsg("Class Created Successfully"); } catch (error) { console.error("Create class failed:", error); alert("Failed to create class."); } };
  const handleDeleteClass = async (id: string) => { if (window.confirm("Delete this class?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id)); if (selectedClassId === id) setSelectedClassId(null); } catch (error) { console.error("Delete class failed:", error); alert("Failed to delete class."); } } };
  const handleRenameClass = async (classId: string, currentName: string) => { const newName = prompt("Enter new class name:", currentName); if (newName && newName.trim() !== "" && newName !== currentName) { try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), { name: newName.trim() }); setToastMsg("Class renamed successfully"); } catch (error) { console.error("Rename failed", error); alert("Failed to rename class"); } } };
  const addStudent = async (e: any) => { e.preventDefault(); if (!newStudentEmail || !selectedClass) return; const normalizedEmail = newStudentEmail.toLowerCase().trim(); try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), { students: arrayUnion(normalizedEmail), studentEmails: arrayUnion(normalizedEmail) }); setNewStudentEmail(''); setToastMsg(`Added ${normalizedEmail}`); } catch (error) { console.error("Add student failed:", error); alert("Failed to add student."); } };
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
          setAssignModalOpen(false); 
          setTargetStudentMode('all'); 
          setSelectedAssignees([]); 
          setToastMsg(`Assigned: ${item.title}`); 
      } catch (error) { console.error("Assign failed:", error); alert("Failed to assign."); } 
  };

  // --- NEW REVOKE LOGIC ---
  const initiateRemove = (assignment: any) => {
      setAssignmentToRemove(assignment);
  };

  const confirmRemove = async () => {
      if (!selectedClass || !assignmentToRemove) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', selectedClass.id), {
              assignments: arrayRemove(assignmentToRemove)
          });
          setToastMsg("Assignment Revoked");
          setAssignmentToRemove(null);
      } catch (e) {
          console.error(e);
          setToastMsg("Error removing assignment");
      }
  };

  if (selectedClass) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 relative">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        
        {/* --- JUICY REVOKE MODAL --- */}
        {assignmentToRemove && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Revoke Access?</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        Are you sure you want to remove <strong>"{assignmentToRemove.title}"</strong>? Students will no longer see it in their dashboard.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setAssignmentToRemove(null)} 
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmRemove} 
                            className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                        >
                            Revoke
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Class Header */}
        <div className="pb-4 border-b border-slate-100 mb-6 bg-white sticky top-0 z-20">
          <button onClick={() => setSelectedClassId(null)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 text-sm font-bold"><ArrowLeft size={16} className="mr-1"/> Back to Classes</button>
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-4">
            <div><h1 className="text-3xl font-black text-slate-900">{selectedClass.name}</h1><p className="text-sm text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">Code: {selectedClass.code}</p></div>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => { setAssignType('lesson'); setAssignModalOpen(true); }} className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-wider"><BookOpen size={16}/> Lesson</button>
                <button onClick={() => { setAssignType('deck'); setAssignModalOpen(true); }} className="bg-orange-500 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-orange-600 active:scale-95 transition-all uppercase tracking-wider"><Layers size={16}/> Deck</button>
                <button onClick={() => { setAssignType('exam'); setAssignModalOpen(true); }} className="bg-rose-600 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-rose-700 active:scale-95 transition-all uppercase tracking-wider"><FileText size={16}/> Exam</button>
            </div>
          </div>
          <div className="flex gap-6">
              <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Overview</button>
              <button onClick={() => setActiveTab('gradebook')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'gradebook' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Gradebook</button>
          </div>
        </div>

        {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600"/> Active Assignments</h3>
                    {(!selectedClass.assignments || selectedClass.assignments.length === 0) && <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">No content assigned yet.</div>}
                    
                    {selectedClass.assignments?.map((l: any, idx: number) => ( 
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${l.contentType === 'deck' ? 'bg-orange-100 text-orange-600' : l.contentType === 'test' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {l.contentType === 'deck' ? <Layers size={18} /> : l.contentType === 'test' ? <FileText size={18}/> : <BookOpen size={18} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{l.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">{l.contentType === 'test' ? 'Exam' : l.contentType === 'deck' ? 'Deck' : 'Unit'}</span>
                                        {l.targetStudents && l.targetStudents.length > 0 && (<span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold flex items-center gap-1"><Users size={10}/> {l.targetStudents.length} Students</span>)}
                                    </div>
                                </div>
                            </div>
                            {/* REVOKE BUTTON (Triggers Modal) */}
                            <button 
                                onClick={() => initiateRemove(l)}
                                className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all" 
                                title="Revoke Assignment"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div> 
                    ))}
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Roster</h3>
                    <form onSubmit={addStudent} className="flex gap-2">
                        <input value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} placeholder="Student Email" className="flex-1 p-2 rounded-lg border border-slate-200 text-sm" />
                        <button type="submit" className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg"><Plus size={18}/></button>
                    </form>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                        {(!selectedClass.students || selectedClass.students.length === 0) && <div className="p-4 text-center text-slate-400 text-sm italic">No students joined yet.</div>}
                        {selectedClass.students?.map((s: string, i: number) => (
                            <div key={i} className="p-3 border-b border-slate-50 last:border-0 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{s.charAt(0).toUpperCase()}</div>
                                <span className="text-sm font-medium text-slate-700">{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="pb-20"><InstructorGradebook classData={selectedClass} /></div>
        )}

        {assignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Assign {assignType.charAt(0).toUpperCase() + assignType.slice(1)}</h3><button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
                  <div className="bg-white p-1 rounded-lg border border-slate-200 flex mb-2"><button onClick={() => setTargetStudentMode('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'all' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Entire Class</button><button onClick={() => setTargetStudentMode('specific')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetStudentMode === 'specific' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Specific Students</button></div>
                  {targetStudentMode === 'specific' && (<div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 custom-scrollbar">{(!selectedClass.students || selectedClass.students.length === 0) ? (<p className="text-xs text-slate-400 italic text-center p-2">No students in roster.</p>) : (selectedClass.students.map((studentEmail: string) => (<button key={studentEmail} onClick={() => toggleAssignee(studentEmail)} className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded text-left">{selectedAssignees.includes(studentEmail) ? <CheckCircle2 size={16} className="text-indigo-600"/> : <Circle size={16} className="text-slate-300"/>}<span className="text-xs font-medium text-slate-700 truncate">{studentEmail}</span></button>)))}</div>)}
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {assignType === 'exam' && (
                      <div className="space-y-2">{availableExams.length === 0 ? <p className="text-sm text-slate-400 italic">No exams found.</p> : availableExams.map((l: any) => (<button key={l.id} onClick={() => assignContent(l, 'test')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{l.questions?.length || 0} Questions</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-rose-500"/></button>))}</div>
                  )}
                  {assignType === 'lesson' && (
                      <div className="space-y-2">{availableLessons.length === 0 ? <p className="text-sm text-slate-400 italic">No lessons found.</p> : availableLessons.map((l: any) => (<button key={l.id} onClick={() => assignContent(l, 'lesson')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{l.title}</h4><p className="text-xs text-slate-500">{l.subtitle}</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-indigo-500"/></button>))}</div>
                  )}
                  {assignType === 'deck' && (
                      <div className="space-y-2">{Object.keys(allDecks || {}).length === 0 ? <p className="text-sm text-slate-400 italic">No decks found.</p> : Object.entries(allDecks).map(([key, deck]: any) => (<button key={key} onClick={() => assignContent({ ...deck, id: key }, 'deck')} className="w-full p-3 text-left border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group flex justify-between items-center"><div><h4 className="font-bold text-slate-800 text-sm">{deck.title}</h4><p className="text-xs text-slate-500">{deck.cards?.length || 0} Cards</p></div><PlusCircle size={18} className="text-slate-300 group-hover:text-orange-500"/></button>))}</div>
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

// ============================================================================
//  LESSON BUILDER (Now with JSON Import/Export)
// ============================================================================
function LessonBuilderView({ data, setData, onSave, availableDecks }: any) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // Sync data to JSON input when switching to JSON mode (Export)
  useEffect(() => {
      if (jsonMode) {
          setJsonInput(JSON.stringify(data, null, 2));
      }
  }, [jsonMode, data]);

  // Handle JSON Import
  const handleImport = () => {
      try {
          const parsed = JSON.parse(jsonInput);
          // Basic validation could go here
          setData({ ...parsed });
          setJsonMode(false);
          setToastMsg("JSON Imported Successfully");
      } catch (e) {
          alert("Invalid JSON format. Please check your syntax.");
      }
  };

  // --- Visual Editor Helpers ---
  const updateBlock = (index: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[index] = { ...newBlocks[index], [field]: value }; setData({ ...data, blocks: newBlocks }); };
  const updateDialogueLine = (blockIndex: number, lineIndex: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[blockIndex].lines[lineIndex][field] = value; setData({ ...data, blocks: newBlocks }); };
  const updateVocabItem = (blockIndex: number, itemIndex: number, field: string, value: any) => { const newBlocks = [...(data.blocks || [])]; newBlocks[blockIndex].items[itemIndex][field] = value; setData({ ...data, blocks: newBlocks }); };
  const addBlock = (type: string) => { const baseBlock = type === 'dialogue' ? { type: 'dialogue', lines: [{ speaker: 'A', text: '', translation: '', side: 'left' }] } : type === 'quiz' ? { type: 'quiz', question: '', options: [{id:'a',text:''},{id:'b',text:''}], correctId: 'a' } : type === 'vocab-list' ? { type: 'vocab-list', items: [{ term: '', definition: '' }] } : type === 'flashcard' ? { type: 'flashcard', front: '', back: '' } : type === 'image' ? { type: 'image', url: '', caption: '' } : type === 'note' ? { type: 'note', title: '', content: '' } : type === 'scenario' ? { type: 'scenario', nodes: [{id: 'start', text: 'Start node...', options: []}] } : { type: 'text', title: '', content: '' }; setData({ ...data, blocks: [...(data.blocks || []), baseBlock] }); };
  const removeBlock = (index: number) => { const newBlocks = [...(data.blocks || [])].filter((_, i) => i !== index); setData({ ...data, blocks: newBlocks }); };
  const handleSave = () => { if (!data.title) return alert("Title required"); const processedVocab = Array.isArray(data.vocab) ? data.vocab : (typeof data.vocab === 'string' ? data.vocab.split(',').map((s: string) => s.trim()) : []); onSave({ ...data, vocab: processedVocab, xp: 100 }); setToastMsg("Lesson Saved Successfully"); };
  
  const deckOptions = availableDecks ? Object.entries(availableDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })) : [];

  return (
    <div className="px-6 mt-4 space-y-8 pb-20 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* Mode Toggle */}
      <div className="flex justify-end">
          <button onClick={() => setJsonMode(!jsonMode)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-colors">
              {jsonMode ? 'Switch to Visual Editor' : 'Switch to JSON Import'}
          </button>
      </div>

      {jsonMode ? (
          // --- JSON MODE ---
          <div className="animate-in fade-in slide-in-from-top-2">
              <div className="mb-4">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">JSON Editor</h3>
                  <p className="text-xs text-slate-500">Paste your LLM-generated lesson JSON here.</p>
              </div>
              <textarea 
                  className="w-full h-[60vh] p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl shadow-inner border-2 border-slate-700 focus:border-emerald-500 outline-none resize-none leading-relaxed" 
                  value={jsonInput} 
                  onChange={e => setJsonInput(e.target.value)} 
                  placeholder='{ "title": "My Lesson", "blocks": [...] }' 
              />
              <button onClick={handleImport} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                  <UploadCloud size={20}/> Import & Preview
              </button>
          </div>
      ) : (
          // --- VISUAL MODE ---
          <>
            <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> Lesson Metadata</h3><input className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} /><textarea className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Description" value={data.description} onChange={e => setData({...data, description: e.target.value})} /><input className="w-full p-3 rounded-lg border border-slate-200 text-sm" placeholder="Vocab (comma separated)" value={data.vocab} onChange={e => setData({...data, vocab: e.target.value})} /><div className="mt-2"><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Linked Flashcard Deck</label><select className="w-full p-3 rounded-lg border border-slate-200 bg-white" value={data.relatedDeckId || ''} onChange={e => setData({...data, relatedDeckId: e.target.value})}><option value="">None (No Deck)</option>{deckOptions.map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}</select></div></section>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Content Blocks</h3><span className="text-xs text-slate-400">{(data.blocks || []).length} Blocks</span></div>
                
                {(data.blocks || []).map((block: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group"><div className="absolute right-4 top-4 flex gap-2"><span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded">{block.type}</span><button onClick={() => removeBlock(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div>
                    {block.type === 'text' && (<div className="space-y-3 mt-4"><input className="w-full p-2 border-b border-slate-100 font-bold text-sm focus:outline-none" placeholder="Section Title" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} /><textarea className="w-full p-2 bg-slate-50 rounded-lg text-sm min-h-[80px]" placeholder="Content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} /></div>)}
                    {block.type === 'note' && (<div className="space-y-3 mt-4"><div className="flex gap-2"><Info size={18} className="text-amber-500"/><input className="flex-1 p-2 border-b border-slate-100 font-bold text-sm focus:outline-none" placeholder="Note Title (e.g. Grammar Tip)" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} /></div><textarea className="w-full p-2 bg-amber-50 border border-amber-100 rounded-lg text-sm min-h-[80px] text-amber-800" placeholder="Tip content..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} /></div>)}
                    {block.type === 'image' && (<div className="space-y-3 mt-4"><div className="flex gap-2 items-center"><Image size={18} className="text-slate-400"/><input className="flex-1 p-2 border-b border-slate-100 text-sm" placeholder="Image URL (e.g., https://placehold.co/400x200)" value={block.url} onChange={e => updateBlock(idx, 'url', e.target.value)} /></div><input className="w-full p-2 bg-slate-50 rounded-lg text-sm" placeholder="Caption" value={block.caption} onChange={e => updateBlock(idx, 'caption', e.target.value)} /></div>)}
                    {block.type === 'vocab-list' && (<div className="space-y-3 mt-6"><p className="text-xs font-bold text-slate-400 uppercase">Vocabulary List</p>{block.items.map((item: any, i: number) => (<div key={i} className="flex gap-2"><input className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-sm font-bold" placeholder="Term" value={item.term} onChange={e => updateVocabItem(idx, i, 'term', e.target.value)} /><input className="flex-1 p-2 border-b border-slate-100 text-sm" placeholder="Definition" value={item.definition} onChange={e => updateVocabItem(idx, i, 'definition', e.target.value)} /></div>))}<button onClick={() => { const newItems = [...block.items, { term: '', definition: '' }]; updateBlock(idx, 'items', newItems); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Term</button></div>)}
                    {block.type === 'flashcard' && (<div className="space-y-3 mt-4"><div className="flex gap-2"><FlipVertical size={18} className="text-indigo-500"/><span className="text-sm font-bold text-slate-700">Embedded Flashcard</span></div><input className="w-full p-2 border rounded text-sm font-bold" placeholder="Front (Latin)" value={block.front} onChange={e => updateBlock(idx, 'front', e.target.value)} /><input className="w-full p-2 border rounded text-sm" placeholder="Back (English)" value={block.back} onChange={e => updateBlock(idx, 'back', e.target.value)} /></div>)}
                    {block.type === 'dialogue' && (<div className="space-y-3 mt-6">{block.lines.map((line: any, lIdx: number) => (<div key={lIdx} className="flex gap-2 text-sm"><input className="w-16 p-1 bg-slate-50 rounded border border-slate-100 text-xs font-bold" placeholder="Speaker" value={line.speaker} onChange={e => updateDialogueLine(idx, lIdx, 'speaker', e.target.value)} /><div className="flex-1 space-y-1"><input className="w-full p-1 border-b border-slate-100" placeholder="Latin" value={line.text} onChange={e => updateDialogueLine(idx, lIdx, 'text', e.target.value)} /><input className="w-full p-1 text-xs text-slate-500 italic" placeholder="English" value={line.translation} onChange={e => updateDialogueLine(idx, lIdx, 'translation', e.target.value)} /></div></div>))}<button onClick={() => { const newLines = [...block.lines, { speaker: 'B', text: '', translation: '', side: 'right' }]; updateBlock(idx, 'lines', newLines); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14}/> Add Line</button></div>)}
                    {block.type === 'quiz' && (<div className="space-y-3 mt-4"><input className="w-full p-2 bg-slate-50 rounded-lg font-bold text-sm" placeholder="Question" value={block.question} onChange={e => updateBlock(idx, 'question', e.target.value)} /><div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Options (ID, Text)</p>{block.options.map((opt: any, oIdx: number) => (<div key={oIdx} className="flex gap-2"><input className="w-8 p-1 bg-slate-50 text-center text-xs" value={opt.id} readOnly /><input className="flex-1 p-1 border-b border-slate-100 text-sm" value={opt.text} onChange={(e) => { const newOpts = [...block.options]; newOpts[oIdx].text = e.target.value; updateBlock(idx, 'options', newOpts); }} /></div>))}</div><div className="flex items-center gap-2 text-sm mt-2"><span className="text-slate-500">Correct ID:</span><input className="w-10 p-1 bg-green-50 border border-green-200 rounded text-center font-bold text-green-700" value={block.correctId} onChange={e => updateBlock(idx, 'correctId', e.target.value)} /></div></div>)}
                    {block.type === 'scenario' && (<div className="p-4 bg-slate-50 text-slate-400 text-xs italic text-center rounded-lg border border-dashed border-slate-300">Scenario Block (JSON Edit Recommended)</div>)}
                </div>
                ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2"><button onClick={() => addBlock('text')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><AlignLeft size={20}/> <span className="text-[10px] font-bold">Text</span></button><button onClick={() => addBlock('dialogue')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><MessageSquare size={20}/> <span className="text-[10px] font-bold">Dialogue</span></button><button onClick={() => addBlock('quiz')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><HelpCircle size={20}/> <span className="text-[10px] font-bold">Quiz</span></button><button onClick={() => addBlock('vocab-list')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><List size={20}/> <span className="text-[10px] font-bold">Vocab List</span></button><button onClick={() => addBlock('flashcard')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><FlipVertical size={20}/> <span className="text-[10px] font-bold">Flashcard</span></button><button onClick={() => addBlock('image')} className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><Image size={20}/> <span className="text-[10px] font-bold">Image</span></button></div>
            <div className="pt-4 border-t border-slate-100"><button onClick={handleSave} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Save size={20} /> Save Lesson to Library</button></div>
          </>
      )}
    </div>
  );
}


function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks, lessons, initialMode, onClearMode }: any) {
  const [lessonData, setLessonData] = useState({ title: '', subtitle: '', description: '', vocab: '', blocks: [] });
  const [mode, setMode] = useState<'card' | 'lesson' | 'exam'>(initialMode || 'card'); 
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  const handleSaveExam = (examData: any) => {
      onSaveLesson(examData); 
      setToastMsg("Exam Saved Successfully!");
  };

  return ( 
    <div className="pb-24 h-full bg-slate-50 overflow-y-auto custom-scrollbar">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        
        {mode === 'card' && <Header title="Scriptorium" subtitle="Card Builder" rightAction={initialMode && <button onClick={onClearMode}><X/></button>}/>}
        {mode === 'lesson' && <Header title="Curriculum" subtitle="Lesson Builder" rightAction={initialMode && <button onClick={onClearMode}><X/></button>}/>}
        {mode === 'exam' && <Header title="Assessment" subtitle="Exam Builder" rightAction={initialMode && <button onClick={onClearMode}><X/></button>}/>}
        
        <div className="px-6 mt-2">
            <div className="flex bg-slate-200 p-1 rounded-xl">
                <button onClick={() => setMode('card')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'card' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Card</button>
                <button onClick={() => setMode('lesson')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'lesson' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Lesson</button>
                <button onClick={() => setMode('exam')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'exam' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Exam</button>
            </div>
        </div>

        {mode === 'card' && <CardBuilderView onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} availableDecks={allDecks} />}
        {mode === 'lesson' && <LessonBuilderView data={lessonData} setData={setLessonData} onSave={onSaveLesson} availableDecks={allDecks} />}
        {mode === 'exam' && <ExamBuilderView onSave={handleSaveExam} />}
    </div> 
  );
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
//  EXAM BUILDER (Instructor Tool)
// ============================================================================
function ExamBuilderView({ onSave, initialData }: any) {
    const [examData, setExamData] = useState(initialData || { 
        title: '', description: '', type: 'test', questions: [] 
    });
    const [jsonMode, setJsonMode] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    const addQuestion = (type: string) => {
        const base = { id: Date.now().toString(), type, prompt: '', points: 10 };
        const extras = type === 'multiple-choice' ? { options: ['Option A', 'Option B'], correctAnswer: 'Option A' } 
                     : type === 'boolean' ? { correctAnswer: 'true' } 
                     : {}; // essay needs no extras
        setExamData({ ...examData, questions: [...examData.questions, { ...base, ...extras }] });
    };

    const updateQuestion = (idx: number, field: string, val: any) => {
        const newQs = [...examData.questions];
        newQs[idx][field] = val;
        setExamData({ ...examData, questions: newQs });
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setExamData({ ...parsed, type: 'test' });
            setJsonMode(false);
        } catch (e) { alert("Invalid JSON"); }
    };

    return (
        <div className="pb-24">
            <div className="flex justify-between items-center mb-6 px-6 mt-4">
                <h2 className="text-2xl font-bold text-slate-800">Exam Builder</h2>
                <button onClick={() => setJsonMode(!jsonMode)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {jsonMode ? 'Visual Editor' : 'JSON Import'}
                </button>
            </div>

            {jsonMode ? (
                <div className="px-6">
                    <textarea className="w-full h-96 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-xl" value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder="Paste JSON here..." />
                    <button onClick={handleImport} className="w-full mt-4 bg-indigo-600 text-white p-3 rounded-xl font-bold">Import JSON</button>
                </div>
            ) : (
                <div className="px-6 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <input className="w-full text-lg font-bold border-b border-slate-100 pb-2 outline-none" placeholder="Exam Title" value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} />
                        <input className="w-full text-sm text-slate-500 border-b border-slate-100 pb-2 outline-none" placeholder="Description" value={examData.description} onChange={e => setExamData({...examData, description: e.target.value})} />
                    </div>

                    {examData.questions.map((q: any, idx: number) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
                            <div className="absolute right-4 top-4 flex gap-2">
                                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded">{q.type}</span>
                                <button onClick={() => { const n = [...examData.questions]; n.splice(idx,1); setExamData({...examData, questions: n}); }} className="text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button>
                            </div>
                            
                            <div className="flex gap-2 items-center mb-2">
                                <span className="font-bold text-slate-300">Q{idx+1}</span>
                                <input className="w-16 p-1 bg-slate-50 text-center text-xs font-bold rounded" type="number" value={q.points} onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value))} />
                                <span className="text-xs text-slate-400">pts</span>
                            </div>

                            <textarea className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-800 mb-3" placeholder="Question Prompt" value={q.prompt} onChange={e => updateQuestion(idx, 'prompt', e.target.value)} />

                            {/* TYPE SPECIFIC INPUTS */}
                            {q.type === 'multiple-choice' && (
                                <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                    {q.options.map((opt: string, oIdx: number) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input type="radio" checked={q.correctAnswer === opt} onChange={() => updateQuestion(idx, 'correctAnswer', opt)} />
                                            <input className="flex-1 p-2 border-b border-slate-100 text-sm" value={opt} onChange={(e) => { const newOpts = [...q.options]; newOpts[oIdx] = e.target.value; updateQuestion(idx, 'options', newOpts); }} />
                                            <button onClick={() => { const newOpts = q.options.filter((_:any, i:number) => i !== oIdx); updateQuestion(idx, 'options', newOpts); }}><X size={14} className="text-slate-300"/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => updateQuestion(idx, 'options', [...q.options, 'New Option'])} className="text-xs font-bold text-indigo-600">+ Add Option</button>
                                </div>
                            )}

                            {q.type === 'boolean' && (
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm font-bold"><input type="radio" name={`bool_${idx}`} checked={q.correctAnswer === 'true'} onChange={() => updateQuestion(idx, 'correctAnswer', 'true')} /> True</label>
                                    <label className="flex items-center gap-2 text-sm font-bold"><input type="radio" name={`bool_${idx}`} checked={q.correctAnswer === 'false'} onChange={() => updateQuestion(idx, 'correctAnswer', 'false')} /> False</label>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => addQuestion('multiple-choice')} className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><List size={20}/><span className="text-[10px] font-bold">Multiple Choice</span></button>
                        <button onClick={() => addQuestion('boolean')} className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><CheckCircle2 size={20}/><span className="text-[10px] font-bold">True / False</span></button>
                        <button onClick={() => addQuestion('essay')} className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50"><AlignLeft size={20}/><span className="text-[10px] font-bold">Written Essay</span></button>
                    </div>

                    <button onClick={() => onSave(examData)} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                        <Save size={20} /> Save Exam
                    </button>
                </div>
            )}
        </div>
    );
}
// ============================================================================
//  EXAM PLAYER (Auto-Save on Submit)
// ============================================================================
function ExamPlayerView({ exam, onFinish }: any) {
    const [answers, setAnswers] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [scoreDetail, setScoreDetail] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);

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
                if (String(studentVal) === String(q.correctAnswer)) { // String comparison safety
                    awarded = points;
                    isCorrect = true;
                }
            } else if (q.type === 'essay') {
                requiresManualGrading = true;
                awarded = 0; 
            }

            details.push({ qId: q.id, type: q.type, prompt: q.prompt, maxPoints: points, studentVal: studentVal || "(No Answer)", correctVal: q.correctAnswer || "(Essay)", awardedPoints: awarded, isCorrect });
            earnedPoints += awarded;
        });

        const finalStatus = requiresManualGrading ? 'pending_review' : 'graded';
        const result = { score: earnedPoints, total: totalPoints, status: finalStatus, details };

        setScoreDetail(result);
        setSubmitted(true);
        setShowConfirm(false);

        // --- CRITICAL FIX: SAVE IMMEDIATELY ---
        // Don't wait for "Return Home". Save data now.
        onFinish(exam.id, earnedPoints, exam.title, result);
    };

    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 animate-in zoom-in duration-300">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-slate-100">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${scoreDetail.status === 'pending_review' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {scoreDetail.status === 'pending_review' ? <Clock size={40}/> : <Award size={40}/>}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Exam Submitted</h2>
                    <p className="text-slate-500 mb-6 font-medium">
                        {scoreDetail.status === 'pending_review' ? "Sent for grading." : `You scored ${scoreDetail.score} / ${scoreDetail.total}`}
                    </p>
                    {/* Button now just closes the view since data is already saved */}
                    <button onClick={() => onFinish(null, 0)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
            {showConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Submit Assessment?</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">You cannot change answers after this point.</p>
                        <div className="flex gap-3"><button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Not yet</button><button onClick={confirmSubmit} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">Submit</button></div>
                    </div>
                </div>
            )}
            <div className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 flex justify-between items-center shadow-sm"><div><h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-indigo-600"/> {exam.title}</h1><p className="text-xs text-slate-400 font-medium">{exam.questions.length} Questions</p></div><div className="text-xs font-mono font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded flex items-center gap-1 animate-pulse"><Circle size={8} fill="currentColor"/> Live</div></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 custom-scrollbar">
                {exam.questions.map((q: any, i: number) => (
                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">Question {i + 1}</span><span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{q.points} pts</span></div><h3 className="text-lg font-bold text-slate-800 mb-6 font-serif">{q.prompt}</h3>
                        {q.type === 'multiple-choice' && (<div className="space-y-3">{q.options.map((opt: string) => (<button key={opt} onClick={() => handleAnswer(q.id, opt)} className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium flex justify-between items-center ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}>{opt}{answers[q.id] === opt && <CheckCircle2 size={16}/>}</button>))}</div>)}
                        {q.type === 'boolean' && (<div className="flex gap-4">{['true', 'false'].map((val) => (<button key={val} onClick={() => handleAnswer(q.id, val)} className={`flex-1 p-4 rounded-xl border-2 font-bold capitalize transition-all ${answers[q.id] === val ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}>{val}</button>))}</div>)}
                        {q.type === 'essay' && (<textarea className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none h-40 resize-none font-medium text-slate-700" placeholder="Type your answer here..." value={answers[q.id] || ''} onChange={(e) => handleAnswer(q.id, e.target.value)}/>)}
                    </div>
                ))}
            </div>
            <div className="bg-white p-4 border-t border-slate-200 sticky bottom-0 z-20"><button onClick={() => setShowConfirm(true)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">Submit Exam <Check size={20}/></button></div>
        </div>
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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  
  // Content & State
  const [systemDecks, setSystemDecks] = useState<any>({});
  const [systemLessons, setSystemLessons] = useState<any[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [selectedDeckKey, setSelectedDeckKey] = useState('salutationes');
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [classLessons, setClassLessons] = useState<any[]>([]);
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null);

  // --- MEMOS ---
  const allDecks = useMemo(() => {
    const decks: any = { ...systemDecks, custom: { title: "✍️ Card Builder", cards: [] } };
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
  // Save the ID so ClassView can find it later
  if (item.id) {
    setSelectedLessonId(item.id);
  }

  if (item.contentType === 'lesson' || item.type === 'lesson') {
    setActiveLesson(item);
  } else if (item.contentType === 'deck' || item.type === 'deck') {
    setSelectedDeckKey(item.id);
    setActiveTab('flashcards');
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
  // --- QUEST ENGINE ---
  const checkDailyQuests = async (activityType: string) => {
      if (!user || !userData) return;

      const today = new Date().toDateString();
      const lastDate = userData.questDate || "";
      
      // 1. Reset Quests if it's a new day
      let currentProgress = { ...userData.questProgress };
      if (lastDate !== today) {
          currentProgress = {}; // Wipe progress
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              questDate: today,
              questProgress: {}
          });
      }

      // 2. Find matching quest
      const quest = DAILY_QUESTS.find(q => q.type === activityType);
      if (!quest) return;

      // 3. Update Progress
      const currentVal = currentProgress[quest.id] || 0;
      if (currentVal < quest.target) {
          const newVal = currentVal + 1;
          currentProgress[quest.id] = newVal;
          
          // Save to DB
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              questProgress: currentProgress
          });

          // 4. Check Completion & Award XP
          if (newVal === quest.target) {
              setToast(`Quest Complete: ${quest.label} (+${quest.xp} XP)`);
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
                  xp: increment(quest.xp)
              });
          }
      }
  };
  // ============================================================================
  //  CENTRAL LOGGING ENGINE
  //  (Connects Actions -> Database -> Quests)
  // ============================================================================
  const handleLogActivity = async (itemId: string, xpEarned: number, itemTitle: string, scoreDetail: any = null) => {
      if (!user) return;

      try {
          // 1. Create specific log entry in Firestore
          // This populates the "Recent History" in Profile and Gradebooks
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
              userId: user.uid,
              studentEmail: user.email,
              studentName: userData?.name || 'Student',
              itemId: itemId,
              itemTitle: itemTitle,
              xp: xpEarned,
              timestamp: Date.now(),
              // If we have a score, it's a completion (exam/quiz), otherwise it's self-study
              type: scoreDetail ? 'completion' : 'self_study', 
              scoreDetail: scoreDetail || {}
          });

          // 2. Update Total User XP
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              xp: increment(xpEarned),
              lastActive: Date.now()
          });

          // 3. TRIGGER DAILY QUESTS
          // Determine the type of action for the quest engine
          let questType = 'self_study'; // Default (Reading cards, looking at lessons)
          
          if (scoreDetail?.mode === 'quiz') questType = 'quiz_complete'; // Quiz Mode
          if (itemId === 'explore_deck') questType = 'explore_deck';     // Clicking a featured deck
          
          // Call the quest engine we created earlier
          checkDailyQuests(questType);

      } catch (e) {
          console.error("Error logging activity:", e);
      }
  };
  const handleCreateCard = useCallback(async (c: any) => { if(!user) return; const cardId = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards')).id; await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), {...c, id: cardId}); setSelectedDeckKey(c.deckId || 'custom'); setActiveTab('flashcards'); }, [user]);
  const handleUpdateCard = useCallback(async (cardId: string, data: any) => { if (!user) return; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), data); } catch (e) { console.error(e); alert("Cannot edit card. Check permissions."); } }, [user]);
  const handleDeleteCard = useCallback(async (cardId: string) => { if (!user) return; if (!window.confirm("Delete card?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId)); } catch (e) { console.error(e); alert("Failed to delete card."); } }, [user]);
  const handleCreateLesson = useCallback(async (l: any, id = null) => { if(!user) return; if (id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), l); } else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), l); } setActiveTab('home'); }, [user]);
  const handleUpdatePreferences = useCallback(async (prefs: any) => { if (!user) return; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { deckPreferences: prefs }); setUserData((prev: any) => ({ ...prev, deckPreferences: prefs })); }, [user]);
  const handleDeleteDeck = useCallback(async (deckId: string) => { if(!user) return; if(!window.confirm("Delete this deck?")) return; try { const toDelete = customCards.filter(c => c.deckId === deckId); for(const c of toDelete) { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', c.id)); } setSelectedDeckKey('custom'); } catch(e) { console.error(e); } }, [user, customCards]);
  const handleLogSelfStudy = useCallback(async (deckId: string, xp: number, title: string, scoreDetail?: any) => { 
      if (!user) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp) }); 
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { 
              studentName: displayName, 
              studentEmail: user.email, 
              itemTitle: title, 
              itemId: deckId, 
              xp: xp, 
              timestamp: Date.now(), 
              type: 'self_study', 
              scoreDetail 
          }); 
      } catch (e) { console.error("Log failed", e); } 
  }, [user, displayName]);

const handleFinishLesson = useCallback(async (lessonId: string, xp: number, title: string = 'Lesson', score: any = null) => { 
    // 1. CRITICAL FIX: Close the lesson viewer!
    setActiveLesson(null); 
    
    // 2. Go back to dashboard
    setActiveTab('home'); 
    
    // 3. Save progress
    if (xp > 0 && user) { 
        try { 
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp), completedAssignments: arrayUnion(lessonId) }); 
            await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { studentName: displayName, studentEmail: user.email, itemTitle: title, xp: xp, timestamp: Date.now(), type: 'completion', scoreDetail: score });
        } catch (e) { console.error(e); } 
    } 
  }, [user, displayName]);;

  if (!authChecked) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>;
  if (!user) return <AuthView />;
  if (!userData) return <div className="h-full flex items-center justify-center text-indigo-500"><Loader className="animate-spin" size={32}/></div>; 
  
  const commonHandlers = { onSaveCard: handleCreateCard, onUpdateCard: handleUpdateCard, onDeleteCard: handleDeleteCard, onSaveLesson: handleCreateLesson, };
  const isInstructor = userData.role === 'instructor';

  if (isInstructor) {
      return <InstructorDashboard user={user} userData={{...userData, classes: enrolledClasses}} allDecks={allDecks} lessons={libraryLessons} {...commonHandlers} onLogout={() => signOut(auth)} />;
  }

const renderStudentView = () => {
    let content: React.ReactNode = null;
    let viewKey: string = "default";

    if (activeTab === 'presentation') {
      viewKey = `presentation-${selectedLessonId}`;
      content = <ClassView lessonId={selectedLessonId} lessons={lessons} />;
    } 
    else if (activeLesson) {
      viewKey = `lesson-${activeLesson.id}`;
      const handleFinish = (id: string, xp: number, title: string, score: any) => {
        handleFinishLesson(activeLesson.id, xp, title, score);
      };
      const isTeacher = userData?.role === 'instructor';
      if (activeLesson.type === 'test' || activeLesson.type === 'exam') {
        content = <ExamPlayerView exam={activeLesson} onFinish={handleFinish} />;
      } else {
        content = <LessonView lesson={activeLesson} onFinish={handleFinish} isInstructor={isTeacher} />;
      }
    } 
    else if (activeTab === 'home' && activeStudentClass) {
      viewKey = `class-${activeStudentClass.id}`;
      content = (
        <StudentClassView 
            classData={activeStudentClass} 
            onBack={() => setActiveStudentClass(null)} 
            onSelectLesson={handleContentSelection} 
            onSelectDeck={handleContentSelection} 
            userData={userData} 
            user={user} 
            displayName={displayName}
            setActiveTab={setActiveTab}
            setSelectedLessonId={setSelectedLessonId}
            allLessons={lessons} 
            classLessons={classLessons} 
        />
      );
    } 
    else {
      viewKey = `tab-${activeTab || 'home'}`;
      switch (activeTab) {
        case 'discovery':
          content = <DiscoveryView allDecks={allDecks} user={user} onSelectDeck={handleContentSelection} userData={userData} onLogActivity={(type: string) => checkDailyQuests(type)} />;
          break;
        case 'flashcards':
          const assignedDeck = classLessons.find((l: any) => l.id === selectedDeckKey && l.contentType === 'deck');
          content = <FlashcardView allDecks={allDecks} selectedDeckKey={selectedDeckKey} onSelectDeck={setSelectedDeckKey} onSaveCard={handleCreateCard} activeDeckOverride={assignedDeck || allDecks[selectedDeckKey]} onComplete={handleFinishLesson} onLogActivity={handleLogSelfStudy} userData={userData} user={user} onUpdatePrefs={handleUpdatePreferences} onDeleteDeck={handleDeleteDeck} />;
          break;
        case 'create':
          content = <BuilderHub onSaveCard={handleCreateCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onSaveLesson={handleCreateLesson} allDecks={allDecks} lessons={lessons} />;
          break;
        case 'profile':
          content = <ProfileView user={user} userData={userData} />;
          break;
        case 'home':
        default:
          content = <HomeView setActiveTab={setActiveTab} allDecks={allDecks} lessons={lessons} assignments={classLessons} classes={enrolledClasses} onSelectClass={(c: any) => setActiveStudentClass(c)} onSelectLesson={handleContentSelection} onSelectDeck={handleContentSelection} userData={userData} user={user} />;
          break;
      }
    }

    return (
      <div key={viewKey} className="h-full w-full animate-in fade-in duration-500">
        {content || <div className="p-10 text-slate-400">Loading Workspace...</div>}
      </div>
    );
  };
  // --- PLACE IT HERE ---
    // This logic runs every time the App renders to decide if we are in "Class Mode"
    const isPresentation = activeTab === 'presentation';

    return (
        <div className="bg-slate-50 min-h-screen w-full font-sans text-slate-900 flex justify-center items-start relative overflow-hidden">
            {/* The container expands to full screen if isPresentation is true */}
            <div className={`w-full transition-all duration-500 bg-white relative overflow-hidden flex flex-col ${
                isPresentation ? 'h-screen' : 'max-w-md h-[100dvh] shadow-2xl'
            }`}>
                
                {toast && <JuicyToast message={toast} onClose={() => setToast(null)} />} 

                {/* VIEWPORT CONTENT */}
                <div className="flex-1 h-full overflow-hidden relative">
                    {renderStudentView()}
                </div>

                {/* NAVIGATION: Hidden during lessons and presentations */}
                {!activeLesson && !isPresentation && (
                    <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
                )}
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
