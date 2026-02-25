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
  Filter, SlidersHorizontal, Hash, Gauge, ChevronLeft, Monitor, Smartphone, PenTool, Menu, Code, BarChart, Tag, RefreshCcw, Gamepad2,
  Bot, Database, Shield, ChefHat, AlertCircle, MoreVertical, Mail// <--- ADDED MISSING ICONS
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
const LivePreview = ({ data }: any) => {
  const currentTheme = THEMES[data?.theme || 'indigo'] || THEMES['indigo'];

  // --- AUTOMATIC VOCABULARY EXTRACTOR ---
  // Scrapes the entire lesson architecture to find vocab-lists for the game
  const lessonVocab = data?.blocks
    ?.filter((b: any) => b.type === 'vocab-list')
    ?.flatMap((b: any) => b.items) || [];

  return (
    <div className={`w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[12px] border-slate-900 transition-all duration-700 ${currentTheme.font}`}>
      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
        <div className={`text-center border-b ${currentTheme.border} pb-8`}>
           <span className={`text-[10px] font-black ${currentTheme.accent} uppercase tracking-[0.4em] mb-2 block`}>
             {data.subtitle || "MAGISTER STUDIO"}
           </span>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{data.title || "Untitled Unit"}</h1>
        </div>
        
        {data.blocks?.map((b: any, i: number) => (
          <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {b.type === 'text' && (
               <div className="space-y-4 text-center">
                 {b.title && <h3 className={`${currentTheme.accent} font-black uppercase text-xs tracking-widest`}>{b.title}</h3>}
                 <p className="text-[3vh] font-black text-slate-800 leading-tight tracking-tighter">{b.content}</p>
               </div>
             )}

            {b.type === 'fill-blank' && (
                <div className="bg-white border-2 border-indigo-100 p-5 rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Fill in the Blank</span>
                  <h3 className="font-bold text-sm mb-4">{b.question}</h3>
                  <div className="text-sm font-medium leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl">
                      {b.text?.split(/\[(.*?)\]/g).map((part: string, i: number) => 
                          i % 2 === 0 ? part : <span key={i} className="inline-block w-16 h-6 border-b-2 border-slate-300 mx-1 border-dashed"></span>
                      )}
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap opacity-60">
                      {b.distractors?.map((d: string, i: number) => <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">{d}</span>)}
                  </div>
                </div>
             )}
             
             {b.type === 'essay' && (
               <div className="space-y-6">
                 <h2 className={`text-center text-2xl font-black ${currentTheme.accent} tracking-tighter`}>{b.title}</h2>
                 <div className="space-y-4">
                   {b.content?.split('\n\n').map((p: string, j: number) => (
                     <p key={j} className="text-sm text-slate-600 leading-relaxed text-justify first-letter:text-xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-1">{p}</p>
                   ))}
                 </div>
               </div>
             )}
             
            {b.type === 'discussion' && (
                <div className="bg-indigo-50 border-2 border-indigo-100 p-5 rounded-2xl shadow-sm">
                  <h3 className="font-black text-indigo-900 text-sm mb-4 flex items-center gap-2">
                    <MessageCircle size={16}/> {b.title || "Discussion"}
                  </h3>
                  <div className="space-y-3">
                    {b.questions?.map((q: string, j: number) => (
                      <div key={j} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-50 flex gap-3">
                        <span className="text-indigo-300 font-bold text-xs">{j + 1}</span>
                        <p className="text-slate-700 font-medium text-xs">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
             )}

             {b.type === 'image' && (
               <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                  <img src={b.url} alt="preview" className="w-full object-cover" />
                  {b.caption && <p className="text-[10px] text-center p-2 text-slate-500 font-bold bg-slate-50">{b.caption}</p>}
               </div>
             )}

             {b.type === 'vocab-list' && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Vocabulary</h3>
                  {b.items?.map((item: any, j: number) => (
                    <div key={j} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                      <span className="font-black text-indigo-600 text-sm">{item.term}</span>
                      <span className="text-xs font-medium text-slate-600">{item.definition}</span>
                    </div>
                  ))}
                </div>
             )}

             {b.type === 'dialogue' && (
                <div className="space-y-3">
                  {b.lines?.map((line: any, j: number) => (
                    <div key={j} className={`flex items-end gap-2 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 ${line.side === 'right' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                        {line.speaker?.[0].toUpperCase()}
                      </div>
                      <div className={`max-w-[80%] p-3 rounded-xl text-xs font-medium ${line.side === 'right' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                        {line.text}
                      </div>
                    </div>
                  ))}
                </div>
             )}

             {b.type === 'quiz' && (
                <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-lg">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Quiz Preview</span>
                  <h3 className="font-bold text-sm mb-4">{b.question}</h3>
                  <div className="space-y-2">
                    {b.options?.map((opt: any, j: number) => (
                      <div key={j} className={`p-3 rounded-lg text-xs font-bold ${b.correctId === opt.id ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 text-slate-300'}`}>
                        {opt.text} {b.correctId === opt.id && "✓"}
                      </div>
                    ))}
                  </div>
                </div>
             )}

             {b.type === 'scenario' && (
                <div className="bg-emerald-900 p-5 rounded-2xl text-white shadow-lg border-2 border-emerald-500">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Interactive Scenario</span>
                  <h3 className="font-bold text-sm italic">"{b.nodes?.[0]?.text || 'Scenario starting point...'}"</h3>
                  <p className="text-xs text-emerald-200 mt-2">({b.nodes?.length} branching nodes configured)</p>
                </div>
             )}

             {/* --- NEW GAME DEPLOYMENT --- */}
             {b.type === 'game' && b.gameType === 'connect-three' && (
                 <div className="my-8 animate-in fade-in slide-in-from-bottom-4">
                     <div className="text-center mb-6">
                         <h3 className="text-2xl font-black text-slate-800">{b.title || "Vocabulary Battle"}</h3>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Pass & Play • Connect 3</p>
                     </div>
                     
                     {/* Scale down slightly to ensure it looks flawless in the mobile preview container */}
                     <div className="scale-95 origin-top">
                        <ConnectThreeVocab vocabList={lessonVocab} />
                     </div>
                 </div>
             )}

          </div>
        ))}
      </div>
    </div>
  );
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
const ScenarioBlock = ({ block, onComplete, onStateChange }: any) => {
    const [currentNodeId, setCurrentNodeId] = useState(block?.nodes?.[0]?.id);
    const [history, setHistory] = useState<string[]>([]);
    
    // Broadcast state to projector
    useEffect(() => {
        if (onStateChange) onStateChange({ currentNodeId });
    }, [currentNodeId, onStateChange]);

    if (!block?.nodes || block.nodes.length === 0) return <div className="p-4 bg-red-50 text-red-500">Error: Invalid Scenario</div>;
    const currentNode = block.nodes.find((n:any) => n.id === currentNodeId);
    if (!currentNode) return <div className="p-4 bg-red-50 text-red-500">Error: Broken Link</div>;

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
const QuizBlock = ({ block, onComplete, onStateChange }: any) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const isCorrect = selected === block.correctId;

    // Broadcast state to projector
    useEffect(() => {
        if (onStateChange) onStateChange({ selected, submitted, isCorrect });
    }, [selected, submitted, isCorrect, onStateChange]);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-start gap-2"><span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><HelpCircle size={16}/></span>{block.question}</h3>
            <div className="space-y-2">{block.options.map((opt:any) => { let style = "border-slate-200 hover:bg-slate-50"; if (submitted) { if (opt.id === block.correctId) style = "bg-emerald-100 border-emerald-500 text-emerald-800 font-bold"; else if (opt.id === selected) style = "bg-rose-100 border-rose-500 text-rose-800 opacity-60"; else style = "opacity-50 grayscale"; } else if (selected === opt.id) { style = "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500"; } return <button key={opt.id} disabled={submitted} onClick={() => setSelected(opt.id)} className={`w-full p-4 text-left border-2 rounded-xl transition-all ${style}`}>{opt.text}</button>; })}</div>
            {!submitted ? (<button onClick={() => setSubmitted(true)} disabled={!selected} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all">Check Answer</button>) : (<div className={`mt-4 p-3 rounded-xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><span className="font-bold flex items-center gap-2">{isCorrect ? <><Check size={18}/> Correct!</> : <><X size={18}/> Incorrect</>}</span>{isCorrect ? <button onClick={onComplete} className="px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">Continue</button> : <button onClick={() => { setSubmitted(false); setSelected(null); }} className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold shadow-sm">Try Again</button>}</div>)}
        </div>
    );
};

// 5. FILL-IN-THE-BLANK BLOCK
const FillBlankBlock = ({ block, onComplete, onStateChange }: any) => {
    const parts = block.text ? block.text.split(/\[(.*?)\]/g) : [];
    const blankCount = Math.floor(parts.length / 2);

    const [answers, setAnswers] = useState<(string | null)[]>(Array(blankCount).fill(null));
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Broadcast state to projector
    useEffect(() => {
        if (onStateChange) onStateChange({ answers, submitted, isCorrect });
    }, [answers, submitted, isCorrect, onStateChange]);

    const wordBank = useMemo(() => {
        const correctWords = parts.filter((_: string, i: number) => i % 2 !== 0);
        const distractors = block.distractors || [];
        return [...correctWords, ...distractors].sort(() => 0.5 - Math.random());
    }, [block.text, block.distractors]);

    const handleBlankClick = (index: number) => {
        if (submitted) return;
        const newAnswers = [...answers];
        if (selectedWord) { newAnswers[index] = selectedWord; setAnswers(newAnswers); setSelectedWord(null); } 
        else if (newAnswers[index]) { newAnswers[index] = null; setAnswers(newAnswers); }
    };

    const checkAnswers = () => {
        const correctWords = parts.filter((_: string, i: number) => i % 2 !== 0);
        const allMatch = answers.every((ans, i) => ans === correctWords[i]);
        setIsCorrect(allMatch); setSubmitted(true);
    };

    const reset = () => { setAnswers(Array(blankCount).fill(null)); setSelectedWord(null); setSubmitted(false); setIsCorrect(false); };
    const availableWords = wordBank.filter((word: string) => { const totalInBank = wordBank.filter((w: string) => w === word).length; const usedInAnswers = answers.filter((a: string | null) => a === word).length; return usedInAnswers < totalInBank; });
    const displayBank = Array.from(new Set(availableWords));

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm my-8 animate-in zoom-in-95 duration-300">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-start gap-2"><span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg mt-1 shrink-0"><Puzzle size={16}/></span>{block.question || "Fill in the blanks"}</h3>
            <div className="text-xl font-medium leading-loose text-slate-700 mb-10 flex flex-wrap items-center gap-y-3">
                {parts.map((part: string, idx: number) => {
                    if (idx % 2 === 0) return <span key={idx} className="mr-1">{part}</span>;
                    const blankIdx = Math.floor(idx / 2); const filledWord = answers[blankIdx]; const isRight = filledWord === part;
                    let style = "bg-slate-100 border-slate-200 text-slate-400 border-dashed"; 
                    if (filledWord && !submitted) style = "bg-indigo-50 border-indigo-300 text-indigo-700 border-solid shadow-sm"; 
                    if (submitted && isRight) style = "bg-emerald-100 border-emerald-500 text-emerald-700 border-solid"; 
                    if (submitted && !isRight) style = "bg-rose-100 border-rose-500 text-rose-700 border-solid"; 
                    return <button key={idx} onClick={() => handleBlankClick(blankIdx)} disabled={submitted} className={`min-w-[80px] h-10 px-4 mx-1 rounded-xl border-2 font-bold text-sm flex items-center justify-center transition-all active:scale-95 ${style} ${selectedWord && !filledWord && !submitted ? 'ring-2 ring-indigo-400 ring-offset-2 animate-pulse' : ''}`}>{filledWord || " "}</button>;
                })}
            </div>
            {!submitted && (<div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Word Bank</span><div className="flex flex-wrap gap-2">{displayBank.map((word, idx) => (<button key={idx} onClick={() => setSelectedWord(word === selectedWord ? null : word as string)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${selectedWord === word ? 'bg-indigo-600 text-white shadow-md -translate-y-1' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{word as string}</button>))}{displayBank.length === 0 && <span className="text-slate-400 text-sm italic">All words placed!</span>}</div></div>)}
            {!submitted ? (<button onClick={checkAnswers} disabled={answers.includes(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg">Check Answers</button>) : (<div className={`p-4 rounded-2xl flex justify-between items-center animate-in zoom-in ${isCorrect ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{isCorrect ? <Check size={20} strokeWidth={3}/> : <X size={20} strokeWidth={3}/>}</div><span className={`font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>{isCorrect ? "Perfectly placed!" : "Not quite right."}</span></div>{isCorrect ? <button onClick={onComplete} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 active:scale-95 transition-all">Continue</button> : <button onClick={reset} className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-50 active:scale-95 transition-all">Try Again</button>}</div>)}
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

// ============================================================================
//  CLASS VIEW (The Projector / Big Screen Mode with Live Sync & Fast Scroll)
// ============================================================================
function ClassView({ lesson, classId, userData }: any) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showForum, setShowForum] = useState(false);
  const [liveState, setLiveState] = useState<any>(null); // Holds live interactions
  const stageRef = useRef<HTMLDivElement>(null);

  // --- AUTOMATIC VOCABULARY EXTRACTOR ---
  // Scrapes the lesson data to feed the Connect Three game on the big screen
  const lessonVocab = useMemo(() => {
    return lesson?.blocks
      ?.filter((b: any) => b.type === 'vocab-list')
      ?.flatMap((b: any) => b.items) || [];
  }, [lesson]);

  // 1. PAGE & SCROLL SYNC: Listen for updates from the Remote
  useEffect(() => {
    const syncId = lesson?.originalId || lesson?.id;
    if (!syncId) return;

    const unsub = onSnapshot(doc(db, 'live_sessions', syncId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        if (typeof data.activePageIdx === 'number') {
          setActivePageIdx(data.activePageIdx);
        }

        // Capture interaction state from remote
        if (data.liveBlockState !== undefined) {
            setLiveState(data.liveBlockState);
        } else {
            setLiveState(null);
        }

        // --- FAST SCROLL FIX (30% Faster) ---
        if (typeof data.scrollPercent === 'number' && stageRef.current) {
          const s = stageRef.current;
          // Multiply the phone's scroll by 1.3. Math.min keeps it from breaking 100%.
          const speedMultiplier = 1.3;
          const targetPercent = Math.min(data.scrollPercent * speedMultiplier, 1);
          const target = targetPercent * (s.scrollHeight - s.clientHeight);
          
          s.scrollTo({
            top: target,
            behavior: 'smooth' 
          });
        }
      }
    });
    return () => unsub();
  }, [lesson]);

  const pages = useMemo(() => {
    if (!lesson?.blocks) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    lesson.blocks.forEach((b: any) => {
      // THE FIX: Added 'game' to the interactive page-break trigger
      if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game'].includes(b.type)) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else { buffer.push(b); }
    });
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  if (!lesson || !pages[activePageIdx]) return null;

  return (
    <div className="h-screen w-screen bg-white fixed inset-0 z-[100] flex flex-col overflow-hidden">
      <div className="h-[12vh] px-16 flex items-center justify-between border-b">
        <div className="h-3 flex-1 bg-slate-100 rounded-full mr-12 overflow-hidden">
          <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${((activePageIdx + 1) / pages.length) * 100}%` }} />
        </div>
        <span className="text-[3vh] font-black text-slate-300">{activePageIdx + 1} / {pages.length}</span>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div ref={stageRef} className={`flex-1 overflow-y-auto px-16 py-12 flex flex-col items-center transition-all duration-500 ${showForum ? 'mr-[450px]' : ''}`}>
          <div className="w-full max-w-7xl space-y-20 pb-40">
            {pages[activePageIdx].blocks.map((block: any, i: number) => (
              <div key={i} className="animate-in fade-in duration-700 w-full">
                
                {block.type === 'text' && (<div className="text-center">{block.title && <h3 className="text-[3vh] font-black text-indigo-400 uppercase tracking-widest mb-6">{block.title}</h3>}<p className="text-[6vh] font-bold text-slate-800 leading-tight">{block.content}</p></div>)}
                
                {block.type === 'essay' && (<div className="w-full max-w-5xl mx-auto space-y-[4vh]"><h1 className="text-[8vh] font-black text-slate-900 leading-none mb-12 text-center">{block.title}</h1>{block.content?.split('\n\n').map((para: string, pIdx: number) => (<p key={pIdx} className="text-[4vh] leading-[1.6] text-slate-700 font-serif text-justify first-letter:text-[6vh] first-letter:font-black first-letter:text-indigo-600 first-letter:mr-3">{para.trim()}</p>))}</div>)}
                
                {block.type === 'image' && (<div className="w-full flex flex-col items-center"><img src={block.url} alt="presentation" className="max-h-[60vh] rounded-[3rem] shadow-2xl object-cover border-8 border-slate-50" />{block.caption && <p className="text-[3vh] text-slate-500 font-bold mt-8 text-center max-w-4xl">{block.caption}</p>}</div>)}
                
                {block.type === 'dialogue' && (<div className="w-full max-w-5xl mx-auto space-y-12">{block.lines?.map((line: any, j: number) => (<div key={j} className={`flex items-end gap-6 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}><div className={`w-20 h-20 rounded-full flex items-center justify-center text-[3vh] font-black text-white shrink-0 shadow-2xl ${line.side === 'right' ? 'bg-indigo-600' : 'bg-slate-800'}`}>{line.speaker?.[0].toUpperCase()}</div><div className={`max-w-[80%] p-10 rounded-[3rem] shadow-lg text-[4vh] font-medium leading-relaxed ${line.side === 'right' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border-4 border-slate-100 text-slate-800 rounded-bl-none'}`}>{line.text}{line.translation && (<p className={`text-[2.5vh] mt-6 italic opacity-70 font-bold border-t pt-4 ${line.side === 'right' ? 'border-white/20' : 'border-slate-100'}`}>{line.translation}</p>)}</div></div>))}</div>)}
                
                {block.type === 'vocab-list' && (<div className="grid grid-cols-2 gap-8">{block.items.map((item: any, j: number) => (<div key={j} className="bg-slate-50 p-12 rounded-[3rem] border-4 border-slate-100 text-center shadow-xl"><p className="text-[5vh] font-black text-indigo-600 mb-2">{item.term}</p><p className="text-[2.5vh] text-slate-500 font-bold">{item.definition}</p></div>))}</div>)}
                
                {block.type === 'discussion' && (
                  <div className="w-full max-w-5xl mx-auto bg-indigo-50 rounded-[4rem] p-16 border-8 border-indigo-100 shadow-2xl">
                    <div className="flex items-center gap-6 mb-12 justify-center">
                      <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl"><MessageCircle size={48} /></div>
                      <h3 className="text-[5vh] font-black text-indigo-900">{block.title || "Let's Discuss"}</h3>
                    </div>
                    <div className="space-y-8">
                      {(block.questions || []).map((q: string, j: number) => (
                        <div key={j} className="bg-white p-8 rounded-[2rem] shadow-md border-4 border-indigo-50 flex gap-6 items-start">
                          <span className="text-[4vh] font-black text-indigo-300">{j + 1}</span>
                          <p className="text-[4vh] font-bold text-slate-800 leading-tight">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- NEW SYNCED GAME BLOCK --- */}
                {block.type === 'game' && block.gameType === 'connect-three' && (
                  <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-6 bg-indigo-50 text-indigo-600 rounded-3xl mb-8 shadow-inner">
                            <Gamepad2 size={64} />
                        </div>
                        <h3 className="text-[6vh] font-black text-slate-800 leading-none">{block.title || "Vocabulary Battle"}</h3>
                        <p className="text-[3vh] font-bold text-slate-400 uppercase tracking-[0.4em] mt-4">Local Multiplayer Mode</p>
                    </div>
                    
                    {/* Scaling it up so it looks massive on the projector screen */}
                    <div className="scale-[1.2] origin-top mt-8 w-full flex justify-center pointer-events-auto">
                        <ConnectThreeVocab vocabList={lessonVocab} />
                    </div>
                  </div>
                )}

                {/* --- SYNCED QUIZ BLOCK --- */}
                {block.type === 'quiz' && (
                  <div className="w-full max-w-5xl mx-auto bg-slate-900 rounded-[4rem] p-16 text-white shadow-2xl transition-colors duration-500">
                    <span className="text-[2vh] font-black text-indigo-400 uppercase tracking-widest block mb-6">Class Question</span>
                    <h3 className="text-[5vh] font-bold mb-12 leading-tight">{block.question}</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {block.options?.map((opt: any, j: number) => {
                        const isSelected = liveState?.selected === opt.id;
                        const isSubmitted = liveState?.submitted;
                        const isCorrectOption = block.correctId === opt.id;

                        let style = "bg-white/10 border-white/20"; 
                        if (isSelected && !isSubmitted) style = "bg-indigo-500 border-indigo-400 ring-8 ring-indigo-500/50 scale-105 transition-all";
                        if (isSubmitted) {
                            if (isCorrectOption) style = "bg-emerald-500 border-emerald-400 scale-105 transition-all";
                            else if (isSelected) style = "bg-rose-500 border-rose-400 opacity-50 scale-95";
                            else style = "opacity-30 grayscale";
                        }

                        return (
                          <div key={j} className={`p-8 border-4 rounded-[2rem] flex items-center gap-6 text-[3vh] font-bold duration-300 ${style}`}>
                            <span className="inline-block w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">{opt.id.toUpperCase()}</span>
                            <span className="text-left">{opt.text}</span>
                            {isSubmitted && isCorrectOption && <CheckCircle2 size={48} className="ml-auto text-white animate-in zoom-in" />}
                            {isSubmitted && isSelected && !isCorrectOption && <X size={48} className="ml-auto text-white animate-in zoom-in" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- SYNCED SCENARIO BLOCK --- */}
                {block.type === 'scenario' && (() => {
                    const activeNodeId = liveState?.currentNodeId || block.nodes?.[0]?.id;
                    const currentNode = block.nodes?.find((n:any) => n.id === activeNodeId) || block.nodes?.[0];
                    const bgColors: any = { neutral: 'bg-emerald-900 border-emerald-500', success: 'bg-indigo-900 border-indigo-500', failure: 'bg-rose-900 border-rose-500' };
                    const style = bgColors[currentNode?.color || 'neutral'];

                    return (
                        <div className={`w-full max-w-5xl mx-auto rounded-[4rem] p-16 text-white shadow-2xl border-8 text-center transition-colors duration-500 ${style}`}>
                           <span className="text-[2vh] font-black uppercase tracking-widest block mb-8 opacity-70">Interactive Scenario • {currentNode?.speaker || 'Character'}</span>
                           <h3 className="text-[5vh] font-serif italic mb-12 leading-tight">"{currentNode?.text}"</h3>
                           <div className="inline-block px-8 py-4 bg-black/20 rounded-full border-2 border-white/20 backdrop-blur-md">
                             <p className="text-[3vh] font-bold text-white">Look at your device to make a choice!</p>
                           </div>
                        </div>
                    );
                })()}

                {/* --- SYNCED FILL IN THE BLANK BLOCK --- */}
                {block.type === 'fill-blank' && (
                  <div className="w-full max-w-6xl mx-auto bg-white p-16 rounded-[4rem] border-4 border-slate-100 shadow-2xl">
                    <h3 className="text-[4vh] font-bold text-slate-800 mb-12 flex items-center gap-4">
                       <span className="bg-indigo-100 text-indigo-600 p-4 rounded-2xl"><Puzzle size={40}/></span>
                       {block.question}
                    </h3>
                    <div className="text-[6vh] font-medium leading-loose text-slate-700 flex flex-wrap items-center gap-y-6 justify-center text-center">
                        {block.text?.split(/\[(.*?)\]/g).map((part: string, idx: number) => {
                            if (idx % 2 === 0) return <span key={idx} className="mx-2">{part}</span>;
                            
                            const blankIdx = Math.floor(idx / 2);
                            const filledWord = liveState?.answers?.[blankIdx];
                            const isChecking = liveState?.submitted;
                            const isRight = filledWord === part;

                            let style = "border-dashed border-slate-300 bg-slate-50 text-slate-400";
                            if (filledWord && !isChecking) style = "border-solid border-indigo-400 bg-indigo-100 text-indigo-700 shadow-lg scale-110 -translate-y-2";
                            if (isChecking && isRight) style = "border-solid border-emerald-500 bg-emerald-100 text-emerald-700 shadow-lg";
                            if (isChecking && !isRight) style = "border-solid border-rose-500 bg-rose-100 text-rose-700 shadow-lg";

                            return (
                                <span key={idx} className={`min-w-[150px] h-20 px-8 mx-3 rounded-2xl border-4 flex items-center justify-center text-[4vh] font-bold transition-all duration-300 ${style}`}>
                                    {filledWord || "?"}
                                </span>
                            );
                        })}
                    </div>
                    
                    {!liveState?.submitted && (
                      <div className="mt-16 flex flex-wrap gap-4 justify-center">
                          {block.distractors?.concat(block.text?.match(/\[(.*?)\]/g)?.map((s:string) => s.replace(/\[|\]/g, '')) || [])
                          .sort(() => 0.5 - Math.random()) 
                          .map((word: string, i: number) => {
                              const isUsed = liveState?.answers?.includes(word);
                              return (
                                <span key={i} className={`px-6 py-3 rounded-xl border-2 text-[3vh] font-bold transition-all duration-300 ${isUsed ? 'bg-slate-50 border-slate-100 text-slate-300 scale-95' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                  {word}
                                </span>
                              );
                          })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {showForum && (
          <div className="absolute right-0 top-0 bottom-0 w-[450px] bg-slate-50 border-l p-8 z-10 animate-in slide-in-from-right">
             <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><MessageSquare className="text-indigo-600" /> FORUM</h3>
             {classId ? <ClassForum classId={classId} userData={userData} /> : <p className="text-slate-400">Class chat unavailable.</p>}
          </div>
        )}
      </div>

      <div className="h-[12vh] px-16 border-t flex justify-between items-center bg-white">
        <span className="font-black text-[2.5vh] text-slate-400 uppercase tracking-widest">Live Presentation</span>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowForum(!showForum)} className={`px-8 py-4 rounded-2xl font-black text-[2.5vh] transition-all shadow-md ${showForum ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
            {showForum ? "HIDE CHAT" : "SHOW CHAT"}
          </button>
          <div className="h-16 w-1 bg-slate-100 mx-4 rounded-full" />
          <h2 className="text-[3vh] font-black text-slate-900 opacity-20 uppercase tracking-widest">{lesson.title}</h2>
        </div>
      </div>
    </div>
  );
}
// ============================================================================
//  LESSON VIEW (Modern "Story" Style - Fully Interactive & Remote Synced)
// ============================================================================
// --- INTERNAL INTERACTIVE RENDERERS ---

const QuizBlockRenderer = ({ block }: any) => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 1. LOCATE THE DATA (Checks all possible nesting levels)
    const data = block?.content || block?.data || block || {};
    
    // 2. EXTRACT THE QUESTION
    const question = data.question || data.title || data.text || "Missing Question Data";

    // 3. EXTRACT AND SANITIZE OPTIONS (This prevents the Grey Screen Crash!)
    let rawOptions = data.options || data.choices || [];
    if (!Array.isArray(rawOptions)) {
        // Fallback if data got corrupted into a string or undefined
        rawOptions = typeof rawOptions === 'string' ? [rawOptions] : ["Option 1", "Option 2"];
    }

    // Force every option to be a clean string, even if the DB saved it as an object
    const options = rawOptions.map((opt: any) => {
        if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
        if (opt && typeof opt === 'object') return opt.text || opt.label || opt.value || "Invalid Option Format";
        return "Unknown Option";
    });

    // 4. FIND THE CORRECT ANSWER
    let correctIdx = 0;
    if (typeof data.correctIndex === 'number') {
        correctIdx = data.correctIndex;
    } else if (typeof data.correctAnswer === 'string') {
        const foundIdx = options.findIndex((o: string) => o === data.correctAnswer);
        correctIdx = foundIdx !== -1 ? foundIdx : 0;
    } else if (typeof data.correct === 'number') {
        correctIdx = data.correct;
    }

    // Safety fallback just in case the correct index is somehow out of bounds
    if (correctIdx < 0 || correctIdx >= options.length) {
        correctIdx = 0; 
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm my-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                    <HelpCircle size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Knowledge Check</h3>
            </div>
            
            <h4 className="text-xl font-black text-slate-800 mb-6 leading-snug">{question}</h4>
            
            <div className="space-y-3">
                {options.length === 0 ? (
                    <p className="text-slate-400 font-bold italic p-4 text-center border-2 border-dashed rounded-2xl">No options provided in this lesson.</p>
                ) : (
                    options.map((opt: string, idx: number) => {
                        const isSelected = selectedIdx === idx;
                        const isCorrect = isSubmitted && idx === correctIdx;
                        const isWrong = isSubmitted && isSelected && idx !== correctIdx;

                        let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
                        if (isSelected && !isSubmitted) btnStyle = "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200";
                        if (isCorrect) btnStyle = "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200";
                        if (isWrong) btnStyle = "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200";

                        return (
                            <button 
                                key={idx}
                                disabled={isSubmitted}
                                onClick={() => setSelectedIdx(idx)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 font-bold text-left transition-all active:scale-[0.98] disabled:active:scale-100 ${btnStyle}`}
                            >
                                <span>{opt}</span>
                                {isCorrect && <CheckCircle2 size={20} className="text-white" />}
                                {isWrong && <X size={20} className="text-white" />}
                            </button>
                        );
                    })
                )}
            </div>

            {!isSubmitted && selectedIdx !== null && (
                <button 
                    onClick={() => setIsSubmitted(true)}
                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
                >
                    Check Answer
                </button>
            )}
        </div>
    );
};
const FillBlankBlockRenderer = ({ block }: any) => {
    // Robust Data Extraction
    const rawText = block.text || block?.content?.text || block?.data?.text || "Missing text [here].";
    
    // Parse the sentence and extract the blanks
    const { textParts, correctAnswers } = React.useMemo(() => {
        const parts = rawText.split(/\[.*?\]/g);
        const matches = Array.from(rawText.matchAll(/\[(.*?)\]/g));
        const answers = matches.map((m: any) => m[1]);
        return { textParts: parts, correctAnswers: answers };
    }, [rawText]);

    const [wordBank, setWordBank] = useState<string[]>([]);
    const [filledBlanks, setFilledBlanks] = useState<(string | null)[]>(Array(correctAnswers.length).fill(null));
    const [isChecked, setIsChecked] = useState(false);

    // Initialize the word bank shuffled
    React.useEffect(() => {
        setWordBank([...correctAnswers].sort(() => Math.random() - 0.5));
    }, [correctAnswers]);

    // Handle clicking a word in the bank to fill the first available blank
    const handleBankClick = (word: string) => {
        if (isChecked) return;
        const firstEmptyIdx = filledBlanks.indexOf(null);
        if (firstEmptyIdx !== -1) {
            const newFilled = [...filledBlanks];
            newFilled[firstEmptyIdx] = word;
            setFilledBlanks(newFilled);
            
            // Remove word from bank
            const wordIdx = wordBank.indexOf(word);
            const newBank = [...wordBank];
            newBank.splice(wordIdx, 1);
            setWordBank(newBank);
        }
    };

    // Handle clicking a filled blank to return it to the bank
    const handleBlankClick = (word: string | null, idx: number) => {
        if (isChecked || !word) return;
        const newFilled = [...filledBlanks];
        newFilled[idx] = null;
        setFilledBlanks(newFilled);
        setWordBank([...wordBank, word]);
    };

    const isComplete = filledBlanks.every(slot => slot !== null);

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm my-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Edit3 size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Fill in the Blanks</h3>
                </div>
            </div>

            {/* The Sentence */}
            <div className="text-xl font-medium text-slate-700 leading-loose flex flex-wrap items-center gap-y-4 mb-10">
                {textParts.map((part: string, i: number) => {
                    const isLast = i === textParts.length - 1;
                    const filledWord = filledBlanks[i];
                    
                    let blankStyle = "min-w-[80px] h-10 border-b-4 border-slate-200 mx-2 flex items-center justify-center px-4 cursor-pointer transition-all";
                    if (filledWord) blankStyle = "min-w-[80px] h-10 bg-indigo-100 text-indigo-700 font-bold rounded-xl mx-2 flex items-center justify-center px-4 cursor-pointer shadow-sm hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-95";
                    
                    // Validation Styling
                    if (isChecked && filledWord) {
                        const isCorrect = filledWord === correctAnswers[i];
                        blankStyle = `min-w-[80px] h-10 font-bold rounded-xl mx-2 flex items-center justify-center px-4 shadow-sm text-white ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`;
                    }

                    return (
                        <React.Fragment key={i}>
                            <span className="leading-none">{part}</span>
                            {!isLast && (
                                <div onClick={() => handleBlankClick(filledWord, i)} className={blankStyle}>
                                    {filledWord || ""}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* The Word Bank */}
            <div className="bg-slate-50 rounded-[1.5rem] p-6 border-2 border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Word Bank</h4>
                <div className="flex flex-wrap gap-3 min-h-[48px]">
                    {wordBank.map((word, idx) => (
                        <button 
                            key={`bank-${idx}`}
                            onClick={() => handleBankClick(word)}
                            disabled={isChecked}
                            className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {word}
                        </button>
                    ))}
                    {wordBank.length === 0 && !isChecked && (
                        <span className="text-slate-400 font-bold text-sm italic py-2">All words placed.</span>
                    )}
                </div>
            </div>

            {/* Submit Action */}
            {isComplete && !isChecked && (
                <button 
                    onClick={() => setIsChecked(true)}
                    className="mt-6 w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-emerald-200 animate-in slide-in-from-bottom-2 fade-in"
                >
                    Check Answers
                </button>
            )}
        </div>
    );
};

const ScenarioBlockRenderer = ({ block }: any) => {
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    
    // Robust Data Extraction
    const title = block.title || block?.content?.title || block?.data?.title || "Real-World Scenario";
    const context = block.context || block?.content?.context || block?.data?.context || "Scenario context goes here...";
    const options = block.options || block?.content?.options || block?.data?.options || [];
    
    return (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl my-6 text-white relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/30 transition-colors duration-700" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/30">
                        <MessageSquare size={20} />
                    </div>
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">Interactive Branch</h3>
                </div>

                <h4 className="text-2xl font-black mb-3 leading-tight">{title}</h4>
                <p className="text-slate-300 font-medium leading-relaxed mb-8 italic">
                    "{context}"
                </p>

                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">How do you respond?</p>
                    {options.length === 0 ? (
                        <p className="text-rose-400 font-bold italic text-sm">No scenario options provided.</p>
                    ) : (
                        options.map((opt: string, i: number) => (
                            <button 
                                key={i} 
                                onClick={() => setSelectedOpt(opt)}
                                className={`w-full p-4 border rounded-2xl text-left font-bold text-sm transition-all active:scale-[0.98] ${
                                    selectedOpt === opt 
                                        ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
                                        : 'bg-white/10 hover:bg-white/20 border-white/10'
                                }`}
                            >
                                {opt}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
//  MAIN LESSON VIEW PLAYER
// ============================================================================

function LessonView({ lesson, onFinish, isInstructor = true }: any) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<any>(null); 

  // --- AUTOMATIC VOCABULARY EXTRACTOR ---
  const lessonVocab = useMemo(() => {
    return lesson?.blocks
      ?.filter((b: any) => b.type === 'vocab-list')
      ?.flatMap((b: any) => b.items) || [];
  }, [lesson]);

  // --- CRITICAL FIX: PAGINATION LOGIC ---
  const pages = useMemo(() => {
    if (!lesson?.blocks) return [];
    const grouped: any[] = [];
    let buffer: any[] = [];
    lesson.blocks.forEach((b: any) => {
      // Isolating interactive blocks into their own pages
      if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game'].includes(b.type)) {
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        grouped.push({ type: 'interact', blocks: [b] });
        buffer = [];
      } else { buffer.push(b); }
    });
    if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
    return grouped;
  }, [lesson]);

  // --- THE SYNC ENGINE ---
  const syncToProjector = useCallback((newIdx: number) => {
    if (!isInstructor) return;
    const syncId = lesson.originalId || lesson.id;
    setDoc(doc(db, 'live_sessions', syncId), {
      activePageIdx: newIdx,
      liveBlockState: null, 
      lastUpdate: Date.now()
    }, { merge: true }).catch(console.error);
  }, [lesson, isInstructor]);

  const handleLiveInteraction = useCallback((state: any) => {
    if (!isInstructor) return;
    const syncId = lesson.originalId || lesson.id;
    setDoc(doc(db, 'live_sessions', syncId), {
      liveBlockState: state,
      lastUpdate: Date.now()
    }, { merge: true }).catch(console.error);
  }, [lesson, isInstructor]);

  useEffect(() => {
    if (isInstructor) syncToProjector(0);
  }, [isInstructor, syncToProjector]);

  // --- THROTTLED SCROLL SYNC ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isInstructor) return;
    
    const handleScroll = () => {
      if (scrollTimeout.current) return; 
      
      scrollTimeout.current = setTimeout(() => {
        const scrollPercent = container.scrollTop / (container.scrollHeight - container.clientHeight);
        const syncId = lesson.originalId || lesson.id;
        
        setDoc(doc(db, 'live_sessions', syncId), {
          scrollPercent: scrollPercent || 0,
          lastUpdate: Date.now()
        }, { merge: true }).catch(e => {});
        
        scrollTimeout.current = null;
      }, 50); 
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lesson, isInstructor]);

  // --- NAVIGATION HANDLERS ---
  const handlePrev = () => {
      const newIdx = Math.max(0, activePageIdx - 1);
      setActivePageIdx(newIdx);
      syncToProjector(newIdx);
      containerRef.current?.scrollTo(0,0);
  };

  const handleNext = () => {
      if (activePageIdx < pages.length - 1) {
          const newIdx = activePageIdx + 1;
          setActivePageIdx(newIdx);
          syncToProjector(newIdx); 
          containerRef.current?.scrollTo(0,0);
      } else {
          onFinish();
      }
  };

 // --- MASTER BLOCK RENDERER ---
  const renderBlock = (block: any, idx: number) => {
    const blockKey = `page_${activePageIdx}_block_${idx}`;

    switch (block.type) {
      case 'text':
        return (
          <div key={blockKey} className="py-6 text-center animate-in fade-in slide-in-from-bottom-2">
            {block.title && <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">{block.title}</h3>}
            <p className="text-3xl font-black text-slate-900 leading-tight tracking-tighter">{block.content}</p>
          </div>
        );
      case 'essay':
        return (
          <div key={blockKey} className="py-4 space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black text-indigo-600 tracking-tight">{block.title}</h2>
            <div className="space-y-4">{block.content?.split('\n\n').map((p: string, j: number) => <p key={j} className="text-base text-slate-600 font-serif leading-relaxed text-justify">{p.trim()}</p>)}</div>
          </div>
        );
      case 'dialogue':
        return (
          <div key={blockKey} className="py-6 space-y-6">
            {block.lines?.map((line: any, j: number) => (
              <div key={j} className={`flex items-end gap-3 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg ${line.side === 'right' ? 'bg-indigo-600' : 'bg-slate-800'}`}>{line.speaker?.[0].toUpperCase()}</div>
                <div className={`max-w-[80%] p-4 rounded-[1.8rem] shadow-sm text-sm font-medium leading-relaxed ${line.side === 'right' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
                  {line.text}
                  {line.translation && <p className={`text-[10px] mt-2 italic opacity-60 font-bold border-t pt-2 ${line.side === 'right' ? 'border-white/20' : 'border-slate-100'}`}>{line.translation}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      case 'vocab-list':
        return (
          <div key={blockKey} className="py-4 grid grid-cols-1 gap-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Essential Lexicon</h3>
            {block.items?.map((item: any, j: number) => (
              <div key={j} className="bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex flex-col gap-1 hover:border-indigo-100 transition-colors">
                <span className="text-lg font-black text-indigo-600">{item.term}</span><div className="h-px w-8 bg-slate-100 my-1" />
                <span className="text-xs font-bold text-slate-500 leading-normal">{item.definition}</span>
              </div>
            ))}
          </div>
        );
      case 'image':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in">
             <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100"><img src={block.url} alt="Lesson visual" className="w-full h-auto object-cover max-h-64" /></div>
             {block.caption && <p className="text-xs font-bold text-slate-400 text-center mt-3 px-4">{block.caption}</p>}
          </div>
        );
      case 'discussion':
        return (
          <div key={blockKey} className="py-6 animate-in fade-in">
            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md"><MessageCircle size={20} /></div><h3 className="text-xl font-black text-indigo-900">{block.title || "Discussion"}</h3></div>
              <div className="space-y-4">
                {(block.questions || []).map((q: string, qIdx: number) => (
                  <div key={qIdx} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 flex gap-4"><span className="text-indigo-300 font-black text-lg">{qIdx + 1}</span><p className="text-slate-700 font-medium leading-snug">{q}</p></div>
                ))}
              </div>
            </div>
          </div>
        );
      
      // --- NEWLY INJECTED INTERACTIVE BLOCKS ---
      case 'quiz':
        return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><QuizBlockRenderer block={block} /></div>;
      case 'fill-blank':
        return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><FillBlankBlockRenderer block={block} /></div>;
      case 'scenario':
        return <div key={blockKey} className="animate-in slide-in-from-bottom-4 fade-in"><ScenarioBlockRenderer block={block} /></div>;

      // --- GAME BLOCK ---
      case 'game':
        if (block.gameType === 'connect-three') {
            return (
                <div key={blockKey} className="py-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-black text-slate-800">{block.title || "Vocabulary Battle"}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Game Active on Projector</p>
                    </div>
                    {/* Assuming ConnectThreeVocab is imported and available! */}
                    {/* <div className="scale-90 origin-top">
                        <ConnectThreeVocab vocabList={lessonVocab} />
                    </div> */}
                    <div className="w-full h-64 bg-amber-50 rounded-[2rem] border-2 border-amber-200 flex items-center justify-center text-amber-500 font-black">
                        [Game Rendered Here]
                    </div>
                </div>
            );
        }
        return <div key={blockKey} className="text-rose-500">Unknown Game Type</div>;

      default:
        return <div key={blockKey} className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-widest my-4">Unsupported Module: {block.type}</div>;
    }
  };

  if (!pages[activePageIdx]) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50/30 overflow-hidden font-sans relative">
      <div className="px-6 md:px-8 pt-10 md:pt-14 pb-6 bg-white border-b border-slate-100 shrink-0 shadow-sm relative z-10">
        <div className="flex justify-between items-end">
          <div>
              <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-1">{lesson.title}</h1>
              <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Current Session</p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">Synced</span>
            </div>
          )}
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-8 pb-40 custom-scrollbar scroll-smooth relative z-0">
        <div className="max-w-md mx-auto space-y-12">
          {pages[activePageIdx].blocks.map((block: any, i: number) => renderBlock(block, i))}
        </div>
      </div>
      
      <div className="p-6 md:p-8 pb-safe bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
            onClick={handlePrev} 
            className="p-4 bg-slate-100 text-slate-400 rounded-2xl disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-200" 
            disabled={activePageIdx === 0}
        >
            <ArrowLeft size={24} strokeWidth={3} />
        </button>
        
        <div className="text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Slide</span>
            <span className="text-xl font-black text-slate-900">{activePageIdx + 1} <span className="text-slate-300">/</span> {pages.length}</span>
        </div>
        
        {activePageIdx < pages.length - 1 ? (
          <button 
            onClick={handleNext} 
            className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 active:scale-90 transition-all hover:bg-indigo-500 hover:-translate-y-1"
          >
            <ArrowRight size={24} strokeWidth={3} />
          </button>
        ) : (
          <button 
            onClick={onFinish} 
            className="px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 transition-all text-xs tracking-widest hover:bg-emerald-400 hover:-translate-y-1"
          >
            FINISH
          </button>
        )}
      </div>
    </div>
  );
}
// ============================================================================
//  STUDENT DISCOVERY VIEW (Baptized in Juice)
// ============================================================================
function DiscoveryView({ allDecks, lessons, user, onSelectDeck, onSelectLesson, onLogActivity, userData }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortMode, setSortMode] = useState<'relevance' | 'size' | 'alpha'>('relevance');

    // --- 1. THE FUZZY BRAIN (Now with Arcade Detection) ---
    const { processedItems, categories, difficultyGroups } = useMemo(() => {
        
        // A. Normalize Decks (ROSE THEME)
        const deckEntries = Object.entries(allDecks || {})
            .filter(([, deck]: any) => !deck.isAssignment)
            .map(([id, deck]: any) => ({
                id,
                ...deck,
                contentType: 'deck',
                magnitude: (deck.cards?.length || 0), 
                displayCount: `${deck.cards?.length || 0} Cards`,
                _searchStr: `${deck.title} ${deck.targetLanguage || ''} ${deck.description || ''} vocab flashcards`.toLowerCase()
            }));

        // B. Normalize Lessons & Arcade Games (INDIGO & AMBER THEMES)
        const lessonEntries = (lessons || [])
            .map((lesson: any) => ({
                ...lesson,
                // Check if it's an arcade game from our new BuilderHub logic
                contentType: lesson.type === 'arcade_game' ? 'arcade' : 'lesson',
                magnitude: (lesson.blocks?.length || 0) * 3, 
                displayCount: lesson.type === 'arcade_game' ? `Target: ${lesson.targetScore} Pts` : `${lesson.blocks?.length || 0} Blocks`,
                _searchStr: `${lesson.title} ${lesson.subtitle || ''} ${lesson.description || ''} ${lesson.type === 'arcade_game' ? 'game arcade' : 'reading lesson'}`.toLowerCase()
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
            entries = entries.map((d: any) => ({ ...d, _score: Math.random() }));
        }

        // G. Sorting Logic
        entries.sort((a: any, b: any) => {
            if (sortMode === 'size') return b.magnitude - a.magnitude;
            if (sortMode === 'alpha') return a.title.localeCompare(b.title);
            return b._score - a._score;
        });

        const groups = {
            quick: entries.filter((d: any) => d.magnitude < 10),
            standard: entries.filter((d: any) => d.magnitude >= 10 && d.magnitude < 30),
            master: entries.filter((d: any) => d.magnitude >= 30)
        };

        return { processedItems: entries, categories: cats, difficultyGroups: groups };
    }, [allDecks, lessons, searchTerm, activeCategory, sortMode]);

    // --- 2. QUEST DATA (Juiced up targets) ---
    const quests = useMemo(() => {
        const userProgress = userData?.questProgress || {};
        const Q = [
            { id: 'q_cards', label: "Review 10 Cards", target: 10, xp: 50, icon: <Layers size={14}/> },
            { id: 'q_quiz',  label: "Complete a Unit", target: 1,  xp: 100, icon: <BookOpen size={14}/> },
            { id: 'q_explore', label: "Play an Arcade Game", target: 1,  xp: 75,  icon: <Gamepad2 size={14}/> },
        ];
        return Q.map(q => {
            const current = userProgress[q.id] || 0;
            return { ...q, current, done: current >= q.target, percent: Math.min(100, (current / q.target) * 100) };
        });
    }, [userData]);

    // Handler
    const handleItemClick = (item: any) => {
        if (onLogActivity) onLogActivity(`explore_${item.contentType}`, 0, "Exploration");
        
        if (item.contentType === 'lesson' || item.contentType === 'arcade') {
            onSelectLesson(item);
        } else {
            onSelectDeck(item);
        }
    };

    const isSearching = searchTerm.length > 0;

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-500">
            
            {/* ============================================================== */}
            {/* FLOATING HEADER AREA */}
            {/* ============================================================== */}
            <div className="px-6 pt-12 pb-4 bg-slate-50/80 backdrop-blur-2xl z-20 sticky top-0 transition-all">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-100 px-2 py-1 rounded-md mb-2 inline-block">Curriculum Library</span>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-2 tracking-tighter leading-none">
                            Explore
                        </h1>
                    </div>
                    
                    <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        <button onClick={() => setSortMode('relevance')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'relevance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`} title="Smart Sort"><Sparkles size={16}/></button>
                        <button onClick={() => setSortMode('size')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'size' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`} title="Sort by Size"><BarChart3 size={16}/></button>
                        <button onClick={() => setSortMode('alpha')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'alpha' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`} title="A-Z"><ArrowDown size={16}/></button>
                    </div>
                </div>
                
                {/* Search Bar - Deeply Interactive */}
                <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-[1.5rem] blur-xl group-focus-within:bg-indigo-500/20 transition-all duration-500" />
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                        <input 
                            type="text" 
                            placeholder="Find a game, unit, or deck..." 
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 focus:border-indigo-500/50 rounded-[1.5rem] font-black text-slate-700 placeholder:text-slate-300 placeholder:font-bold focus:ring-0 outline-none transition-all shadow-sm focus:shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Squishy Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 custom-scrollbar snap-x">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)} 
                            className={`snap-start px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-90 border-2 ${
                                activeCategory === cat 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ============================================================== */}
            {/* SCROLLABLE MAIN CONTENT */}
            {/* ============================================================== */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                
                {/* 1. MARKETING SECTION (Only shows when not searching) */}
                {!isSearching && activeCategory === 'All' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* THE GLOWING SPOTLIGHT HERO */}
                        {processedItems.length > 0 && (
                            <div className="px-6 mb-10 mt-2">
                                <button 
                                    onClick={() => handleItemClick(processedItems[0])} 
                                    className="w-full relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/10 group text-left transition-transform active:scale-[0.97]"
                                >
                                    {/* Dynamic Background based on content type */}
                                    <div className={`absolute inset-0 transition-transform duration-1000 group-hover:scale-105 ${
                                        processedItems[0].contentType === 'arcade' ? 'bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-500' :
                                        processedItems[0].contentType === 'deck' ? 'bg-gradient-to-tr from-rose-500 via-pink-600 to-purple-600' :
                                        'bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500'
                                    }`} />
                                    
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                    
                                    {/* Dynamic Badge */}
                                    <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-xl border border-white/30 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                        <Star size={12} className="fill-white" /> Featured
                                    </div>
                                    
                                    <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                                                {processedItems[0].contentType === 'arcade' ? <Gamepad2 size={24}/> : processedItems[0].contentType === 'lesson' ? <BookOpen size={24}/> : <Layers size={24}/>}
                                            </div>
                                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                                                {processedItems[0].contentType === 'arcade' ? 'Live Arcade' : processedItems[0].contentType === 'lesson' ? 'Unit' : 'Practice Deck'}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">{processedItems[0].title}</h2>
                                        <div className="flex items-center gap-3 text-white/80 text-xs font-bold">
                                            <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md"><Globe size={12}/> {processedItems[0].targetLanguage || 'General'}</span>
                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                                            <span>{processedItems[0].displayCount}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* GAMIFIED DAILY QUESTS */}
                        <div className="px-6 mb-12">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={18} className="text-rose-500"/> Daily Quests
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-200 px-2 py-1 rounded-md">Resets in 4h</span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {quests.map((q: any) => (
                                    <div key={q.id} className={`p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all ${q.done ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-100'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${q.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
                                                    {q.done ? <Check size={20} strokeWidth={4}/> : q.icon}
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-black block ${q.done ? 'text-emerald-700' : 'text-slate-800'}`}>{q.label}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${q.done ? 'text-emerald-500' : 'text-slate-400'}`}>{q.current} / {q.target} Completed</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-black flex items-center gap-1 ${q.done ? 'text-emerald-500' : 'text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg'}`}>
                                                <Zap size={12} className={q.done ? '' : 'fill-indigo-500'} /> +{q.xp}
                                            </span>
                                        </div>
                                        {/* Progress Bar for Incomplete Quests */}
                                        {!q.done && (
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${q.percent}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. DYNAMIC RESULTS GRID */}
                <div className="px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            {isSearching ? <Search size={18} className="text-indigo-500"/> : <Map size={18} className="text-indigo-500"/>} 
                            {isSearching ? `Found ${processedItems.length} Matches` : 'Browse Collection'}
                        </h3>
                    </div>

                    {sortMode === 'size' && !isSearching ? (
                        <div className="space-y-8">
                            {difficultyGroups.master.length > 0 && <DeckGroup title="Master Class (Long)" items={difficultyGroups.master} onClick={handleItemClick} icon={<Trophy size={18} className="text-yellow-500"/>}/>}
                            {difficultyGroups.standard.length > 0 && <DeckGroup title="Standard" items={difficultyGroups.standard} onClick={handleItemClick} icon={<Layers size={18} className="text-indigo-500"/>}/>}
                            {difficultyGroups.quick.length > 0 && <DeckGroup title="Quick Bites" items={difficultyGroups.quick} onClick={handleItemClick} icon={<Zap size={18} className="text-orange-500"/>}/>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {processedItems.map((item: any) => (
                                <DiscoveryCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {processedItems.length === 0 && (
                        <div className="text-center py-16 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 mt-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Search size={40}/>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Nothing found</h3>
                            <p className="text-slate-400 text-sm font-bold mb-6">Try adjusting your filters or searching for a different topic.</p>
                            <button onClick={() => {setSearchTerm(''); setActiveCategory('All');}} className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  SUB-COMPONENTS (With Dynamic Type Styling)
// ============================================================================

// Helper to get visual theme based on content type
const getTypeStyles = (type: string) => {
    switch(type) {
        case 'arcade': return { 
            bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', hover: 'group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500', 
            icon: Gamepad2, label: 'Arcade Game', border: 'border-amber-200' 
        };
        case 'deck': return { 
            bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', hover: 'group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500', 
            icon: Layers, label: 'Practice Deck', border: 'border-rose-200' 
        };
        default: return { // Lesson
            bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500', 
            icon: BookOpen, label: 'Standard Unit', border: 'border-indigo-200' 
        };
    }
};

const DeckGroup = ({ title, items, onClick, icon }: any) => (
    <div>
        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">{icon} {title}</h4>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 custom-scrollbar snap-x">
            {items.map((item: any) => <DiscoveryCard key={item.id} item={item} onClick={() => onClick(item)} compact />)}
        </div>
    </div>
);

const DiscoveryCard = ({ item, onClick, compact = false }: any) => {
    const style = getTypeStyles(item.contentType);
    const Icon = style.icon;

    return (
        <button 
            onClick={onClick} 
            className={`snap-start bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col overflow-hidden ${compact ? 'min-w-[240px] max-w-[240px] h-48' : 'h-56'}`}
        >
            {/* Top Half (Title & Meta) */}
            <div className="p-5 flex-1 w-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-300 ${style.bg} ${style.text} ${style.hover} shadow-inner`}>
                        <Icon size={24}/>
                    </div>
                    {item.contentType === 'arcade' && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md animate-pulse">
                            <Zap size={10} className="fill-amber-500" /> Hot
                        </span>
                    )}
                </div>
                <h4 className="font-black text-slate-800 text-lg leading-tight mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
            </div>

            {/* Bottom Glassmorphism Bar */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-slate-400"/>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[100px]">{item.targetLanguage || 'General'}</p>
                </div>
                
                {/* The Call to Action Pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${style.bg} ${style.text}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{style.label}</span>
                    <ChevronRight size={12} strokeWidth={3} />
                </div>
            </div>
        </button>
    );
};
function HomeView({ setActiveTab, onSelectClass, userData, classes, user }: any) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  // Calculate Stats
  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const progress = ((xp % 1000) / 1000) * 100;
  const streak = userData?.streak || 1;
  const targetLang = userData?.targetLanguage || "English";

  // Dynamic Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userData?.name?.split(' ')[0] || "Scholar";

  return (
    <div className="h-full flex flex-col bg-slate-50">
        
        {/* 1. APP BAR */}
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

        <div ref={scrollViewportRef} className="flex-1 overflow-y-auto custom-scrollbar pb-32">
            
            {/* 2. HERO SECTION */}
            <div className="bg-white pt-6 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-medium text-slate-400 tracking-tight">{greeting},</h1>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">{firstName}.</h1>
                </div>

                {/* STATS BENTO */}
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

                {/* PROGRESS BAR */}
                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{Math.round(1000 - (xp % 1000))} XP to Level Up</span>
                </div>
            </div>

            <div className="px-6 space-y-8 mt-8">
              
              {/* 3. CLASSES SECTION */}
              {classes && classes.length > 0 ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">My Classes</h3>
                    </div>
                    
                    <div className="flex gap-5 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                        {classes.map((cls: any, index: number) => { 
                            const pendingCount = (cls.assignments || []).length;
                            const gradients = ["from-indigo-600 to-violet-600", "from-emerald-500 to-teal-600", "from-orange-500 to-rose-600"];
                            const themeGradient = gradients[index % gradients.length];

                            return ( 
                                <button key={cls.id} onClick={() => onSelectClass(cls)} className="snap-start min-w-[280px] h-[180px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden flex flex-col text-left">
                                    <div className={`h-24 w-full bg-gradient-to-r ${themeGradient} relative p-5 flex justify-between items-start`}>
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm">{cls.name.charAt(0)}</div>
                                        {pendingCount > 0 && (
                                            <div className="bg-white text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                              {pendingCount} Assigned
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 relative">
                                        <h4 className="font-black text-slate-800 text-xl truncate leading-tight group-hover:text-indigo-600 transition-colors">{cls.name}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{cls.code}</span>
                                        </div>
                                    </div>
                                </button> 
                            ); 
                        })}
                    </div>
                </div>
              ) : (
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <School size={32} className="mx-auto text-slate-300 mb-2"/>
                    <p className="text-sm text-slate-400 font-bold">No classes joined yet.</p>
                 </div>
              )}

              {/* 4. ACTION CARDS */}
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <button 
                    onClick={() => setActiveTab('flashcards')} 
                    className="relative h-40 rounded-[2rem] overflow-hidden shadow-lg group text-left transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute -right-4 -bottom-4 text-white opacity-20 transform rotate-12 group-hover:scale-125 transition-transform duration-700"><Layers size={100} /></div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white"><Layers size={20} /></div>
                        <div><h3 className="text-white font-black text-xl mb-1 leading-none">Vocab Gym</h3><p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider">Practice</p></div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTab('create')} 
                    className="relative h-40 rounded-[2rem] overflow-hidden shadow-lg group text-left transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute -right-4 -bottom-4 text-white opacity-20 transform -rotate-12 group-hover:scale-125 transition-transform duration-700"><Feather size={100} /></div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white"><Feather size={20} /></div>
                        <div><h3 className="text-white font-black text-xl mb-1 leading-none">Studio</h3><p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider">Creator</p></div>
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
    const isExam = scoreDetail && scoreDetail.details; 

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
                            {scoreDetail.details.map((q: any, idx: number) => {
                                // --- THE FIX: SMART STATUS LOGIC ---
                                // If it's an essay and points were awarded, it's considered "Graded" (Good).
                                // Otherwise, fallback to the original isCorrect flag.
                                const isEssay = q.type === 'essay';
                                const hasPoints = q.awardedPoints > 0;
                                const isConsideredCorrect = isEssay ? hasPoints : q.isCorrect;
                                
                                const boxColor = isConsideredCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30';
                                const badgeColor = isConsideredCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                                const badgeLabel = isEssay ? (hasPoints ? 'Graded' : 'Needs Review') : (q.isCorrect ? 'Correct' : 'Incorrect');

                                return (
                                    <div key={idx} className={`p-4 rounded-2xl border-2 ${boxColor}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeColor}`}>
                                                {badgeLabel}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">
                                                {q.awardedPoints || 0} / {q.maxPoints} pts
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-800 text-sm mb-2">{q.prompt}</p>
                                        
                                        <div className="text-sm text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-200/50 mb-2 whitespace-pre-wrap font-serif">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Your Answer</span>
                                            {q.studentVal}
                                        </div>

                                        {!isConsideredCorrect && q.correctVal && !isEssay && (
                                            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                                <CheckCircle2 size={12}/> Correct Answer: {q.correctVal}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
//  STUDENT GRADEBOOK (Filtered: Exams Only)
// ============================================================================
function StudentGradebook({ classData, user }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const studentEmail = user?.email || auth?.currentUser?.email;

    useEffect(() => {
        if(!classData.assignments || classData.assignments.length === 0 || !studentEmail) { 
            setLoading(false); 
            return; 
        }
        
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('studentEmail', '==', studentEmail),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const allLogs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            setLogs(allLogs);
            setLoading(false);
        });
        return () => unsub();
    }, [classData, studentEmail]);

    // --- THE FILTER: Only show high-stakes items ---
    const gradedAssignments = classData.assignments?.filter((a: any) => 
        a.contentType === 'test' || a.contentType === 'exam'
    ) || [];

    const getGradeStatus = (assign: any) => {
        let log = logs.find(l => l.itemId === assign.id && l.type === 'completion');
        if (!log && assign.originalId) log = logs.find(l => l.itemId === assign.originalId && l.type === 'completion');
        if (!log) log = logs.find(l => l.itemTitle === assign.title && l.type === 'completion');
        
        if (!log) return { status: 'missing', label: 'Not Taken', color: 'bg-slate-100 text-slate-400', interactable: false };
        
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

        const hasInstructorGrade = log.scoreDetail?.finalScorePct !== undefined;
        const displayLabel = hasInstructorGrade ? `${pct}%` : `${score}/${total} pts`;

        return { status: 'complete', label: displayLabel, color, interactable: true, log };
    };

    return (
        <>
            {selectedLog && <GradeDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList size={18} className="text-indigo-600"/> Official Report Card
                    </h3>
                </div>
                
                {gradedAssignments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm italic">
                        No exams have been assigned to this cohort yet.
                    </div> 
                ) : (
                    <div className="divide-y divide-slate-100">
                        {gradedAssignments.map((assign: any) => {
                            const { label, color, interactable, log } = getGradeStatus(assign);
                            return (
                                <button 
                                    key={assign.id} 
                                    disabled={!interactable} 
                                    onClick={() => interactable && setSelectedLog(log)} 
                                    className={`w-full p-5 flex items-center justify-between transition-colors group text-left ${interactable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                                            <FileText size={20}/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{assign.title}</h4>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Final Assessment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm ${color}`}>{label}</span>
                                            {log?.scoreDetail?.instructorFeedback && (
                                                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-500 font-bold">
                                                    <MessageCircle size={10}/> Feedback
                                                </div>
                                            )}
                                        </div>
                                        {interactable && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>}
                                    </div>
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
//  STUDENT CLASS VIEW (Fixed & De-Janked)
// ============================================================================
function StudentClassView({ 
    classData, 
    lessons = [], // <--- IMPORTANT: Ensure this is passed from parent!
    onBack, 
    onSelectLesson, 
    userData, 
    setActiveTab, 
    setSelectedLessonId 
}: any) {
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'exams' | 'forum' | 'grades'>('lessons');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [activeExam, setActiveExam] = useState<any>(null); 

  // 1. FETCH COMPLETIONS (To handle the "Review" styling)
  useEffect(() => {
    const studentEmail = userData?.email || auth?.currentUser?.email;
    if (!classData?.assignments || !studentEmail) return;

    const q = query(
      collection(db, 'artifacts', appId, 'activity_logs'),
      where('studentEmail', '==', studentEmail),
      where('type', '==', 'completion')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const completedIdentifiers = snapshot.docs.flatMap(d => {
        const data = d.data();
        return [data.itemId, data.originalId, data.itemTitle].filter(Boolean);
      });
      setCompletedItems(completedIdentifiers);
    });

    return () => unsub();
  }, [classData, userData]);

  // ==========================================================================
  // 2. BULLETPROOF ASSIGNMENT POPULATOR
  // ==========================================================================
  // This handles both cases: if Firebase gave us an array of string IDs, 
  // OR if it gave us an array of full objects.
  const populatedAssignments = (classData?.assignments || [])
    .map((assignment: any) => {
        if (typeof assignment === 'string') {
            return lessons.find((l: any) => l.id === assignment);
        }
        return assignment;
    })
    .filter(Boolean); // Strips out any nulls/undefined

  // Split into Lessons and Exams
  const lessonList = populatedAssignments.filter((a: any) => a.contentType !== 'test' && a.contentType !== 'exam');
  const examList = populatedAssignments.filter((a: any) => a.contentType === 'test' || a.contentType === 'exam');

  // --- INTERNAL FORUM COMPONENT ---
  const ClassForum = ({ classId }: { classId: string }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const q = query(
        collection(db, 'artifacts', appId, 'classes', classId, 'forum'),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
      return onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
      });
    }, [classId]);

    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      await addDoc(collection(db, 'artifacts', appId, 'classes', classId, 'forum'), {
        text: newMessage,
        senderName: userData?.name || 'Scholar',
        senderId: auth.currentUser?.uid,
        role: userData?.role || 'student',
        timestamp: Date.now()
      });
      setNewMessage("");
    };

    return (
      <div className="flex flex-col h-[60vh] bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-inner">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 p-10 text-center">
              <MessageSquare size={40} className="mb-4" />
              <p className="font-black uppercase tracking-tighter text-xs">No questions yet.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === auth.currentUser?.uid ? 'items-end' : 'items-start'} animate-in fade-in`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-2">{msg.senderName}</span>
              <div className={`p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed max-w-[85%] ${msg.senderId === auth.currentUser?.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ask a question..." className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-sm outline-none" />
          <button type="submit" className="p-4 bg-indigo-600 text-white rounded-2xl active:scale-90 transition-transform"><Send size={20} /></button>
        </form>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 font-sans">
      
      {/* --- HEADER & MOBILE NAV --- */}
      <div className="p-6 md:p-8 pt-10 md:pt-12 shrink-0 bg-white">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest active:scale-95 w-fit">
          <ArrowLeft size={16} /> BACK TO DASHBOARD
        </button>
        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{classData.name}</h2>
        <p className="text-slate-400 font-bold text-sm line-clamp-1">{classData.description || "Welcome to your active curriculum."}</p>

        <div className="relative mt-8">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden z-10 pointer-events-none" />
          <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] w-full md:w-fit overflow-x-auto hide-scrollbar">
            {[
              { id: 'lessons', label: 'Lessons', icon: <BookOpen size={14}/>, color: 'text-indigo-600' },
              { id: 'exams', label: 'Exams', icon: <FileText size={14}/>, color: 'text-rose-600' },
              { id: 'forum', label: 'Discussion', icon: <MessageSquare size={14}/>, color: 'text-indigo-600' },
              { id: 'grades', label: 'Grades', icon: <CheckCircle2 size={14}/>, color: 'text-emerald-600' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  activeSubTab === tab.id ? `bg-white ${tab.color} shadow-sm border border-slate-200/50` : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- CONTENT BODY --- */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-12 custom-scrollbar relative">
        
        {/* TAB: LESSONS */}
        {activeSubTab === 'lessons' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {lessonList.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p className="text-center font-bold text-sm text-slate-400">No curriculum assigned yet.</p>
              </div>
            ) : (
              lessonList.map((item: any) => {
                const isCompleted = completedItems.includes(item.id) || (item.originalId && completedItems.includes(item.originalId)) || completedItems.includes(item.title);

                return (
                  <div key={item.id} className={`group p-5 border-2 ${isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'} rounded-[2.5rem] flex justify-between items-center hover:shadow-xl hover:-translate-y-1 transition-all`}>
                    <button className="flex items-center gap-4 flex-1 text-left" onClick={() => onSelectLesson(item)}>
                      
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                          isCompleted ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 
                          'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={24} /> : <Play size={24} className="ml-1" fill="currentColor" />}
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-indigo-400'}`}>
                          {isCompleted ? 'Completed • Review' : 'Curriculum Unit'}
                        </span>
                      </div>
                    </button>
                    
                    {/* Projector / Presentation Mode Button */}
                    <button onClick={() => { setSelectedLessonId(item.originalId || item.id); setActiveTab('presentation'); }} className="p-4 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-colors shrink-0" title="Presentation Mode">
                        <Monitor size={24} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: EXAMS */}
        {activeSubTab === 'exams' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {examList.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p className="text-center font-bold text-sm text-slate-400">No active exams.</p>
              </div>
            ) : (
              examList.map((item: any) => {
                const isCompleted = completedItems.includes(item.id) || (item.originalId && completedItems.includes(item.originalId)) || completedItems.includes(item.title);
                return (
                  <div key={item.id} className={`group p-5 border-2 ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-white'} rounded-[2.5rem] flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all`} onClick={() => !isCompleted && setActiveExam(item)}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                      {isCompleted ? <CheckCircle2 size={24} /> : <FileText size={24} fill="currentColor" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-rose-600 transition-colors">{item.title}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {isCompleted ? 'Exam Submitted • Review in Grades' : 'Active Exam'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* RESTORED TABS */}
        {activeSubTab === 'forum' && <ClassForum classId={classData.id} />}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </div>

      {/* RESTORED EXAM OVERLAY */}
      {activeExam && (
        <div className="absolute inset-0 z-50">
            <ExamPlayerView 
                exam={activeExam} 
                onFinish={() => setActiveExam(null)} 
            />
        </div>
      )}
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
// ============================================================================
//  THEME DEFINITIONS (THE AURA ENGINE)
// ============================================================================
const THEMES: any = {
  indigo: {
    id: 'indigo',
    name: 'Cyberpunk',
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-50',
    accent: 'text-indigo-600',
    border: 'border-indigo-100',
    shadow: 'shadow-indigo-100',
    font: 'font-sans'
  },
  emerald: {
    id: 'emerald',
    name: 'Bio-Digital',
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-50',
    accent: 'text-emerald-600',
    border: 'border-emerald-100',
    shadow: 'shadow-emerald-100',
    font: 'font-sans'
  },
  rose: {
    id: 'rose',
    name: 'High-Alert',
    primary: 'bg-rose-600',
    secondary: 'bg-rose-50',
    accent: 'text-rose-600',
    border: 'border-rose-100',
    shadow: 'shadow-rose-100',
    font: 'font-sans'
  },
  slate: {
    id: 'slate',
    name: 'Oxford',
    primary: 'bg-slate-900',
    secondary: 'bg-slate-50',
    accent: 'text-slate-900',
    border: 'border-slate-200',
    shadow: 'shadow-slate-200',
    font: 'font-serif'
  }
};

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
               onClick={() => {
                 const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
                 onSaveLesson(payload);
                 setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");
               }}
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

  // --- 1. THE NAV ITEM (NEON PILL EDITION) ---
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
        {/* The Animated Active Pill Background */}
        {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-[1.5rem] shadow-lg shadow-indigo-900/50 animate-in fade-in zoom-in-95 duration-300 border border-indigo-400/20" />
        )}

        <div className="relative z-10 flex items-center w-full">
            {/* Icon Zone */}
            <div className="w-20 shrink-0 flex items-center justify-center relative">
                {React.cloneElement(icon as React.ReactElement, { 
                    size: 22, 
                    strokeWidth: isActive ? 2.5 : 2,
                    className: `transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`
                })}
                
                {/* The LMS Attention Badge */}
                {badge && !isActive && (
                    <span className="absolute top-3 right-5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-slate-950"></span>
                    </span>
                )}
            </div>

            {/* Expanding Label Zone */}
            <span className={`font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ease-out ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            } ${
                isRailExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}>
                {label}
            </span>
        </div>

        {/* Glowing Active Pip (For Collapsed Rail Mode) */}
        {isActive && !isRailExpanded && (
          <div className="absolute left-1.5 w-1 h-8 bg-white rounded-full z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-in slide-in-from-left-full duration-300" />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans select-none">
      
      {/* --- SIDE RAIL / SIDEBAR --- */}
      <aside 
        className={`bg-slate-950 flex flex-col transition-all duration-500 ease-in-out z-50 shadow-[20px_0_40px_rgba(0,0,0,0.1)] ${
          isRailExpanded ? 'w-72' : 'w-20'
        }`}
      >
        {/* Branding & Interaction Header */}
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

          {/* Floating Toggle (Mobile/Tablet Only) */}
          {!isRailExpanded && (
            <button 
              onClick={() => setIsRailExpanded(true)}
              className="absolute -right-3 top-10 w-6 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-400 border border-slate-700 active:scale-95 shadow-lg md:hidden"
            >
              <Menu size={12} />
            </button>
          )}
        </div>

        {/* Main Navigation Stack */}
        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem id="dashboard" icon={<Activity />} label="Live Feed" />
          <NavItem id="studio" icon={<PenTool />} label="Studio Hub" />
          <NavItem id="classes" icon={<School />} label="Cohort Manager" />
          {/* 🔴 Notice the badge property here to trigger the grading alert */}
          <NavItem id="inbox" icon={<Inbox />} label="Grading Inbox" badge={true} />
          <NavItem id="analytics" icon={<BarChart2 />} label="Analytics" />
        </nav>

        {/* Footer: User & Mode Switchers */}
        <div className="p-4 border-t border-slate-900 space-y-2 shrink-0 bg-slate-950/50">
          
         {/* 🛡️ THE GOD MODE GATEKEEPER (Bypassed for UI testing!) */}
{true && (
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
           
           {/* --- NEW: ADMIN CONSOLE ROUTE --- */}
           {activeTab === 'admin' ? (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <AdminDashboardView user={userData} />
             </div>
           ) : activeTab === 'studio' ? (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <BuilderHub 
                  onSaveLesson={onSaveLesson} 
                  onSaveCard={onSaveCard}
                  lessons={lessons} 
                  allDecks={allDecks} 
               />
             </div>
           ) : activeTab === 'classes' ? (
             <div className="h-full p-6 md:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-6 duration-500">
               <ClassManagerView 
                 user={user}
                 classes={userData?.classes || []}
                 lessons={lessons}
                 allDecks={allDecks}
                 onAssign={onAssign}
                 onRevoke={onRevoke}
                 onCreateClass={onCreateClass}
                 onDeleteClass={onDeleteClass}
                 onRenameClass={onRenameClass}
                 onAddStudent={onAddStudent}
               />
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
                
                {/* Dynamic Views */}
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
function StudentNavBar({ activeTab, setActiveTab }: any) {
    const tabs = [
        { id: 'home', label: 'Home', icon: LayoutDashboard },
        { id: 'discovery', label: 'Explore', icon: Compass, badge: true }, // 🔴 Pulses to show new content
        { id: 'flashcards', label: 'Practice', icon: Layers },
        { id: 'profile', label: 'Me', icon: User }
    ];

    return (
        // The container creates a safe area at the bottom of mobile screens
        <div className="fixed bottom-0 left-0 w-full z-50 pb-6 pointer-events-none">
            
            {/* The Floating Frosted Glass Base */}
            <nav 
                role="tablist" 
                aria-label="Student Navigation"
                className="mx-auto max-w-md w-[calc(100%-3rem)] bg-white/80 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-white/50 rounded-[2rem] p-2 flex justify-between items-center pointer-events-auto"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button 
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={tab.label} // Crucial since inactive text is visually hidden
                            onClick={() => setActiveTab(tab.id)} 
                            // The magic expanding classes:
                            className={`relative flex items-center justify-center h-14 rounded-[1.5rem] transition-all duration-500 ease-out outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 ${
                                isActive 
                                    ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20 w-full flex-[1.5]' // Expands to take up more room
                                    : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex-1'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {/* Icon Container */}
                                <div className="relative flex-shrink-0">
                                    <Icon 
                                        size={22} 
                                        strokeWidth={isActive ? 2.5 : 2} 
                                        className={`transition-colors duration-500 ${isActive ? 'text-white' : ''}`}
                                    />
                                    
                                    {/* The LMS Notification Juice */}
                                    {tab.badge && !isActive && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                                        </span>
                                    )}
                                </div>

                                {/* Label (Only visible when active) */}
                                <span className={`font-black uppercase tracking-widest text-[10px] whitespace-nowrap overflow-hidden transition-all duration-500 ${
                                    isActive 
                                        ? 'max-w-[100px] opacity-100 text-white ml-1' 
                                        : 'max-w-0 opacity-0'
                                }`}>
                                    {tab.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </nav>
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
//  CONNECT THREE: VOCABULARY BATTLE
// ============================================================================
function ConnectThreeVocab({ vocabList, mode = 'pvp', targetScore = 3 }: any) {
    // Fallback vocabulary
    const defaultVocab = [
        { term: "Serendipity", definition: "The occurrence of events by chance in a happy or beneficial way." },
        { term: "Ephemeral", definition: "Lasting for a very short time." },
        { term: "Cacophony", definition: "A harsh, discordant mixture of sounds." },
        { term: "Enigma", definition: "A person or thing that is mysterious, puzzling, or difficult to understand." }
    ];

    const activeVocab = vocabList?.length > 3 ? vocabList : defaultVocab;
    const COLS = 4;
    const ROWS = 5;

    // --- GAME STATE ---
    const [grid, setGrid] = useState<number[][]>(Array(COLS).fill([]));
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [scores, setScores] = useState({ 1: 0, 2: 0 });
    const [gameOver, setGameOver] = useState(false);

    // --- VOCABULARY STATE ---
    const [currentPrompt, setCurrentPrompt] = useState<any>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [earnedDrop, setEarnedDrop] = useState(false);

    // --- GENERATE QUESTION ---
    const generateQuestion = useCallback(() => {
        const shuffled = [...activeVocab].sort(() => 0.5 - Math.random());
        const correct = shuffled[0];
        const distractors = shuffled.slice(1, 4).map(v => v.term);
        const allOptions = [correct.term, ...distractors].sort(() => 0.5 - Math.random());
        
        setCurrentPrompt(correct);
        setOptions(allOptions);
        setEarnedDrop(false);
    }, [activeVocab]);

    useEffect(() => {
        generateQuestion();
    }, [generateQuestion]);

    // --- BOT LOGIC (Player 2 AI) ---
    useEffect(() => {
        // If it's the CPU's turn, and they haven't earned a drop yet
        if (mode === 'pvc' && currentPlayer === 2 && !gameOver && !earnedDrop) {
            const timer = setTimeout(() => {
                // Bot "answers" correctly
                setEarnedDrop(true);
            }, 1500); // Wait 1.5s to read the question
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, mode, gameOver, earnedDrop]);

    useEffect(() => {
        // If the CPU has earned their drop, pick a column!
        if (mode === 'pvc' && currentPlayer === 2 && earnedDrop && !gameOver) {
            const timer = setTimeout(() => {
                const validCols = [0, 1, 2, 3].filter(c => grid[c].length < ROWS);
                if (validCols.length > 0) {
                    const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
                    handleDrop(randomCol);
                }
            }, 1000); // Wait 1s before dropping
            return () => clearTimeout(timer);
        }
    }, [earnedDrop, currentPlayer, mode, gameOver, grid]);


    // --- SCORING ALGORITHM ---
    const checkScore = (newGrid: number[][], dropCol: number, dropRow: number, player: number) => {
        let newPoints = 0;

        const countConsecutive = (dx: number, dy: number) => {
            let count = 0;
            let c = dropCol + dx;
            let r = dropRow + dy;
            while (c >= 0 && c < COLS && r >= 0 && r < ROWS && newGrid[c][r] === player) {
                count++;
                c += dx;
                r += dy;
            }
            return count;
        };

        const directions = [
            [[1, 0], [-1, 0]],   // Horizontal
            [[0, 1], [0, -1]],   // Vertical
            [[1, 1], [-1, -1]],  // Diagonal /
            [[1, -1], [-1, 1]]   // Diagonal \
        ];

        directions.forEach(axis => {
            const totalInLine = 1 + countConsecutive(axis[0][0], axis[0][1]) + countConsecutive(axis[1][0], axis[1][1]);
            if (totalInLine >= 3) newPoints += 1; 
        });

        if (newPoints > 0) {
            setScores(prev => {
                const updatedScores = { ...prev, [player]: prev[player as keyof typeof prev] + newPoints };
                // --- DYNAMIC WIN CONDITION ---
                if (updatedScores[1] >= targetScore || updatedScores[2] >= targetScore) {
                    setGameOver(true);
                }
                return updatedScores;
            });
        }
    };

    // --- PLAYER ACTIONS ---
    const handleAnswer = (selectedTerm: string) => {
        // Prevent humans from clicking during the Bot's turn
        if (mode === 'pvc' && currentPlayer === 2) return; 

        if (selectedTerm === currentPrompt.term) {
            setEarnedDrop(true);
        } else {
            setCurrentPlayer(prev => prev === 1 ? 2 : 1);
            generateQuestion();
        }
    };

    const handleDrop = (colIndex: number) => {
        // Prevent humans from dropping during the Bot's turn
        if (mode === 'pvc' && currentPlayer === 2 && !earnedDrop) return;
        if (!earnedDrop || gameOver) return;
        if (grid[colIndex].length >= ROWS) return; 

        const newGrid = grid.map(col => [...col]);
        newGrid[colIndex].push(currentPlayer);
        
        const rowIndex = newGrid[colIndex].length - 1;
        checkScore(newGrid, colIndex, rowIndex, currentPlayer);
        
        setGrid(newGrid);

        if (newGrid.every(col => col.length === ROWS)) {
            setGameOver(true);
        } else if (!gameOver) {
            setCurrentPlayer(prev => prev === 1 ? 2 : 1);
            generateQuestion();
        }
    };

    const resetGame = () => {
        setGrid(Array(COLS).fill([]));
        setScores({ 1: 0, 2: 0 });
        setGameOver(false);
        setCurrentPlayer(1);
        generateQuestion();
    };

    const activeColor = currentPlayer === 1 ? 'rose' : 'indigo';
    const isBotTurn = mode === 'pvc' && currentPlayer === 2;

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
            
            {/* SCOREBOARD */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center relative">
                <div className={`flex flex-col items-center p-3 rounded-2xl w-24 transition-all ${currentPlayer === 1 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-110 z-10' : 'opacity-50'}`}>
                    <User size={20} className="mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Player 1</span>
                    <span className="text-2xl font-black">{scores[1]}</span>
                </div>
                
                <div className="flex flex-col items-center">
                    <Trophy size={24} className="text-yellow-400 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">First to {targetScore}</span>
                </div>

                <div className={`flex flex-col items-center p-3 rounded-2xl w-24 transition-all ${currentPlayer === 2 ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110 z-10' : 'opacity-50'}`}>
                    {mode === 'pvc' ? <Bot size={20} className="mb-1" /> : <User size={20} className="mb-1" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{mode === 'pvc' ? 'CPU Bot' : 'Player 2'}</span>
                    <span className="text-2xl font-black">{scores[2]}</span>
                </div>
            </div>

            <div className="p-6">
                {/* ACTION AREA */}
                <div className="mb-8 min-h-[160px] flex flex-col justify-center">
                    {gameOver ? (
                        <div className="text-center animate-in zoom-in">
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Game Over!</h2>
                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-6">
                                {scores[1] >= targetScore ? 'Player 1 Wins!' : scores[2] >= targetScore ? (mode === 'pvc' ? 'CPU Wins!' : 'Player 2 Wins!') : 'It is a tie!'}
                            </p>
                            <button onClick={resetGame} className="mx-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 active:scale-95 transition-transform">
                                <RefreshCcw size={16}/> Play Again
                            </button>
                        </div>
                    ) : earnedDrop ? (
                        <div className={`text-center p-6 rounded-3xl border-2 border-dashed bg-${activeColor}-50 border-${activeColor}-200 animate-in fade-in`}>
                            <ArrowDown size={32} className={`mx-auto mb-2 text-${activeColor}-500 ${isBotTurn ? 'animate-pulse' : 'animate-bounce'}`} />
                            <h3 className={`text-lg font-black text-${activeColor}-700 uppercase tracking-widest`}>
                                {isBotTurn ? 'CPU is choosing...' : 'Select a column to drop'}
                            </h3>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4 text-center shadow-inner relative overflow-hidden">
                                {isBotTurn && <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest text-${activeColor}-500 block mb-2 relative z-10`}>
                                    {isBotTurn ? 'CPU is thinking...' : `Player ${currentPlayer}'s Turn`}
                                </span>
                                <h3 className="font-bold text-slate-800 text-lg leading-snug relative z-10">
                                    "{currentPrompt?.definition}"
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {options.map(opt => (
                                    <button 
                                        key={opt} 
                                        onClick={() => handleAnswer(opt)}
                                        disabled={isBotTurn}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all border-2 border-slate-100 ${isBotTurn ? 'opacity-50 cursor-not-allowed' : `hover:border-${activeColor}-300 hover:bg-${activeColor}-50 hover:text-${activeColor}-700 text-slate-600 active:scale-95`}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* THE GAME BOARD */}
                <div className="bg-slate-100 p-4 rounded-[2rem] shadow-inner relative">
                    <div className="flex justify-between gap-2 h-[280px]">
                        {[0, 1, 2, 3].map(colIndex => (
                            <div 
                                key={colIndex}
                                onClick={() => !isBotTurn && handleDrop(colIndex)}
                                className={`flex-1 flex flex-col-reverse justify-start gap-2 rounded-2xl transition-colors ${earnedDrop && !isBotTurn && grid[colIndex].length < ROWS ? `cursor-pointer hover:bg-${activeColor}-500/10` : ''}`}
                            >
                                {Array.from({ length: ROWS }).map((_, rowIndex) => {
                                    const token = grid[colIndex][rowIndex]; 
                                    let tokenColor = 'bg-white shadow-inner'; 
                                    if (token === 1) tokenColor = 'bg-rose-500 shadow-md shadow-rose-200';
                                    if (token === 2) tokenColor = 'bg-indigo-500 shadow-md shadow-indigo-200';

                                    return (
                                        <div key={rowIndex} className="flex-1 rounded-full relative overflow-hidden flex items-center justify-center p-1">
                                            <div className={`w-full h-full rounded-full transition-all duration-300 ${tokenColor} ${token ? 'animate-in slide-in-from-top-12 duration-500 ease-bounce' : ''}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
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
//  ADMIN DASHBOARD (God Mode: Cohorts, Instructors, Metrics)
// ============================================================================
function AdminDashboardView({ user }: any) {
    const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'instructors'>('overview');

    // --- MOCK DATA FOR UI DESIGN ---
    const metrics = {
        totalStudents: 342,
        activeCohorts: 8,
        avgPulseScore: 84, // The system-wide engagement metric
        pendingGrades: 156 // Global bottleneck indicator
    };

    const mockCohorts = [
        { id: 'c1', name: 'KitchenComm Prep - Alpha', instructor: 'Sarah Jenkins', students: 24, progress: 65, pulse: 88, status: 'active', icon: <ChefHat size={16}/> },
        { id: 'c2', name: 'KitchenComm Prep - Beta', instructor: 'Mike Chen', students: 28, progress: 30, pulse: 92, status: 'active', icon: <ChefHat size={16}/> },
        { id: 'c3', name: 'IELTS Intensive - Spring', instructor: 'You (Admin)', students: 15, progress: 10, pulse: 45, status: 'warning', icon: <GraduationCap size={16}/> },
        { id: 'c4', name: 'Culinary ESL Basics', instructor: 'Unassigned', students: 0, progress: 0, pulse: 0, status: 'draft', icon: <BookOpen size={16}/> }
    ];

    const mockInstructors = [
        { id: 'i1', name: 'Sarah Jenkins', email: 'sarah@lllms.edu', activeCohorts: 2, ungradedItems: 12, lastActive: '2 mins ago' },
        { id: 'i2', name: 'Mike Chen', email: 'mike@lllms.edu', activeCohorts: 3, ungradedItems: 84, lastActive: '5 hours ago' },
        { id: 'i3', name: 'Elena Rodriguez', email: 'elena@lllms.edu', activeCohorts: 1, ungradedItems: 0, lastActive: '1 day ago' }
    ];

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500 font-sans select-none">
            
            {/* --- HEADER --- */}
            <header className="h-24 bg-slate-900 px-6 md:px-10 flex justify-between items-center shrink-0 z-30 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h2>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-1">L.L.L.M.S. Admin Access</p>
                    </div>
                </div>

                <div className="flex bg-slate-800 p-1.5 rounded-[1.5rem]">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'cohorts', label: 'Cohorts' },
                        { id: 'instructors', label: 'Instructors' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* --- WORKSPACE --- */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-12 pb-32">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-4">
                            {/* Bento Box Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard icon={<Users size={24} className="text-indigo-500"/>} label="Total Enrollment" value={metrics.totalStudents} trend="+12 this week" color="indigo" />
                                <MetricCard icon={<BookOpen size={24} className="text-emerald-500"/>} label="Active Cohorts" value={metrics.activeCohorts} trend="2 launching soon" color="emerald" />
                                <MetricCard icon={<Activity size={24} className="text-rose-500"/>} label="Avg Pulse Score" value={`${metrics.avgPulseScore}%`} trend="High Engagement" color="rose" />
                                <MetricCard icon={<AlertCircle size={24} className="text-amber-500"/>} label="Global Pending Grades" value={metrics.pendingGrades} trend="Needs attention" color="amber" />
                            </div>

                            {/* Quick Action Dock */}
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-1">Provision New Cohort</h3>
                                    <p className="text-sm font-bold text-slate-500">Create a container, assign a curriculum, and invite an instructor.</p>
                                </div>
                                <button className="w-full md:w-auto px-8 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-xs">
                                    <Plus size={18} /> Build Cohort
                                </button>
                            </div>
                        </div>
                    )}

                    {/* COHORTS TAB */}
                    {activeTab === 'cohorts' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Cohort Management</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Deployments</p>
                                </div>
                                <button className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                                    <Plus size={20} />
                                </button>
                            </div>
                            
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-slate-100">
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Name</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Roster</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cohort Pulse</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {mockCohorts.map(cohort => (
                                        <tr key={cohort.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cohort.status === 'draft' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {cohort.icon}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-slate-800 text-sm block">{cohort.name}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block ${cohort.status === 'active' ? 'bg-emerald-100 text-emerald-600' : cohort.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {cohort.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 font-bold text-slate-600 text-sm">
                                                {cohort.instructor}
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black">
                                                    {cohort.students} <Users size={12} className="inline ml-1 opacity-50"/>
                                                </span>
                                            </td>
                                            <td className="p-6 w-48">
                                                {cohort.students > 0 ? (
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1">
                                                            <span>Health</span>
                                                            <span className={cohort.pulse > 80 ? 'text-emerald-500' : 'text-amber-500'}>{cohort.pulse}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all duration-1000 ${cohort.pulse > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${cohort.pulse}%` }} />
                                                        </div>
                                                    </div>
                                                ) : <span className="text-xs text-slate-300 font-bold italic">No data</span>}
                                            </td>
                                            <td className="p-6 text-right">
                                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* INSTRUCTORS TAB */}
                    {activeTab === 'instructors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                            {mockInstructors.map(inst => (
                                <div key={inst.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                            {inst.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">{inst.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 mb-6">{inst.email}</p>
                                    
                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-6">
                                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cohorts</span>
                                            <span className="text-xl font-black text-slate-700">{inst.activeCohorts}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl text-center ${inst.ungradedItems > 50 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-700'}`}>
                                            <span className="block text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">To Grade</span>
                                            <span className="text-xl font-black">{inst.ungradedItems}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Helper Component for the Bento Box Metrics
function MetricCard({ icon, label, value, trend, color }: any) {
    const bgColors: any = { indigo: 'bg-indigo-50', emerald: 'bg-emerald-50', rose: 'bg-rose-50', amber: 'bg-amber-50' };
    const textColors: any = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', rose: 'text-rose-600', amber: 'text-amber-600' };

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
function App() {
  // --- 1. CORE SYSTEM STATE ---
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // High-Level View Controllers
  const [viewMode, setViewMode] = useState<'student' | 'instructor'>('student');
  const [activeTab, setActiveTab] = useState('home'); // Controls Bottom Nav
  
  // --- 2. DATA REPOSITORIES ---
  const [systemLessons] = useState([]); 
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [instructorClasses, setInstructorClasses] = useState<any[]>([]); // ADD THIS LINE
  const [allDecks, setAllDecks] = useState<any>({ custom: { title: 'Scriptorium', cards: [] } });
  
  // --- 3. UI NAVIGATION STATE (DECOUPLED) ---
  const [activeLesson, setActiveLesson] = useState<any>(null); // Triggers Lesson/Exam Player
  const [activeStudentClass, setActiveStudentClass] = useState<any>(null); // Triggers Class Dashboard
  const [presentationLessonId, setPresentationLessonId] = useState<string | null>(null); // Triggers Projector
  const [activeDeckKey, setActiveDeckKey] = useState<string | null>(null); // Triggers Flashcards

 // --- 4. DATA CONSOLIDATION ---
  const lessons = useMemo(() => {
    // Combine both lists to find assignments
    const allActiveClasses = [...instructorClasses, ...enrolledClasses]; 
    const assignments = allActiveClasses.flatMap(c => c.assignments || []);
    return [...systemLessons, ...customLessons, ...assignments];
  }, [systemLessons, customLessons, enrolledClasses, instructorClasses]);

  // --- 5. FIREBASE REAL-TIME SYNC ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
        setAuthChecked(true);
      }
    });

    if (user?.uid) {
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          if (data.role === 'instructor') setViewMode('instructor');
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
      // ADD THIS NEW BLOCK: Instructor Cohort Sync
      const unsubInstructorClasses = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), (snap) => {
        setInstructorClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubAuth(); unsubProfile(); unsubLessons(); unsubCards(); unsubClasses(); unsubInstructorClasses(); };
    }
    return () => unsubAuth();
  }, [user?.uid, user?.email]);

  // --- 6. MAGISTER DATABASE HANDLERS ---
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
      const classRef = doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId);
      await updateDoc(classRef, {
        students: arrayUnion(email.toLowerCase().trim()),
        studentEmails: arrayUnion(email.toLowerCase().trim())
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

  // --- 7. UNIFIED XP & ACTIVITY LOGGER ---
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

  // Helper to exit any active lesson gracefully
  const closeLessons = () => {
    setActiveLesson(null);
  };


  // --- 8. GLOBAL ROUTING ENGINE ---
  
  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    );
  }

  if (!user) return <AuthView />;

  // ROUTE 1: GLOBAL PRESENTATION OVERRIDE (Instructor Projector)
  if (presentationLessonId || activeTab === 'presentation') {
    const lessonToPresent = lessons.find(l => l.id === presentationLessonId) || activeLesson || lessons[0];
    return (
      <div className="fixed inset-0 z-[5000] bg-white w-screen h-screen">
        <button 
          onClick={() => { setPresentationLessonId(null); setActiveTab('dashboard'); }} 
          className="absolute top-6 left-6 z-[5010] bg-slate-900/80 backdrop-blur text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-rose-600 transition-colors"
        >
          End Session
        </button>
        {lessonToPresent ? (
          <ClassView lesson={lessonToPresent} userData={userData} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Unit Not Found</div>
        )}
      </div>
    );
  }

  // ROUTE 2: MAGISTER COMMAND CENTER
  if (viewMode === 'instructor' && userData?.role === 'instructor') {
    return (
      <InstructorDashboard 
        user={user} 
        userData={{ ...userData, classes: instructorClasses }} 
        allDecks={allDecks} 
        lessons={lessons} 
        
        onSaveLesson={handleSaveLesson} 
        onSaveCard={handleSaveCard}
        onAssign={handleAssign}
        onRevoke={handleRevoke}
        onCreateClass={handleCreateClass}
        onDeleteClass={handleDeleteClass}
        onRenameClass={handleRenameClass}
        onAddStudent={handleAddStudent}
        
        // This triggers Route 1 above
        onStartPresentation={(lessonId: string) => setPresentationLessonId(lessonId)}
        
        onSwitchView={() => setViewMode('student')}
        onLogout={() => signOut(auth)} 
      />
    );
  }

  // ROUTE 3: STUDENT VIEWPORT
  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col items-center relative font-sans overflow-hidden">
      
      {/* Instructor Backdoor Toggle */}
      {userData?.role === 'instructor' && (
        <button 
          onClick={() => setViewMode('instructor')} 
          className="fixed top-6 right-6 z-[1000] bg-slate-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          🎓 Magister Command
        </button>
      )}

      {/* Mobile-Optimized Student Frame */}
      <div className="w-full transition-all duration-700 bg-white relative overflow-hidden flex flex-col max-w-md h-[100dvh] shadow-2xl">
        <div className="flex-1 h-full overflow-hidden relative bg-slate-50">
          
          {/* --- THE SOLID STUDENT ROUTING STACK --- */}
          
          {/* Layer 1: Is a Lesson Active? (Handles Exams, Decks, and Standard Lessons) */}
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
                    onSelectDeck={closeLessons} // Closes the lesson when back is clicked inside FlashcardView
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

          // Layer 2: Is a specific Cohort Dashboard open?
          ) : activeStudentClass ? (
            <StudentClassView 
               classData={activeStudentClass} 
               lessons={lessons}
               onBack={() => setActiveStudentClass(null)} 
               onSelectLesson={setActiveLesson} // Safely passes the click up to trigger Layer 1
               setActiveTab={setActiveTab}
               setSelectedLessonId={setPresentationLessonId}
               userData={userData}
            />

          // Layer 3: Bottom Navigation Tab Views
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
                 if (!key) setActiveTab('home'); // Go home if deck library is closed
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
            // Default to HomeView
            <HomeView 
              setActiveTab={setActiveTab} 
              classes={enrolledClasses} 
              onSelectClass={setActiveStudentClass} 
              userData={userData} 
              user={user} 
            />
          )}

        </div>
        
        {/* Nav Bar hides automatically when immersed in a lesson or class detail */}
        {(!activeLesson && !activeStudentClass) && (
          <StudentNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </div>
    </div>
  );
}
export default App;
