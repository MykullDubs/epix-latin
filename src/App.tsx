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
import { Toast, JuicyToast } from './components/Toast';
import { BroadcastModal, AnalyticsDashboard } from './components/instructor/InstructorTools';
import InstructorInbox from './components/instructor/InstructorInbox';
import LiveActivityFeed from './components/instructor/LiveActivityFeed';
import InstructorGradebook from './components/instructor/InstructorGradebook';
import ClassManagerView from './components/instructor/ClassManagerView';
import BuilderHub from './components/instructor/BuilderHub';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import StudentNavBar from './components/StudentNavBar';
import ExamPlayerView from './components/ExamPlayerView';
import AdminDashboardView from './components/admin/AdminDashboardView';
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
