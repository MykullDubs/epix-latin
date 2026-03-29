// src/components/FlashcardView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ArrowLeft, X, Library, Layers, Play, Zap, HelpCircle, Puzzle, Flame, 
    CheckCircle2, XCircle, Globe, Users, Filter, ChevronLeft, ChevronRight, 
    RotateCw, ArrowUp, Paperclip, Music, Star, Archive, Plus, Save, Loader2,
    MoreVertical, FolderPlus, Trash2, Folder, FolderOpen, Edit3, Infinity,
    Calculator, FlaskConical, Palette, Utensils, Plane, HeartPulse, Activity, BookText, Code, BrainCircuit
} from 'lucide-react';
import { Toast } from './Toast'; 
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { saveDeckToCache, getDeckFromCache } from '../utils/localCache';

const SUBJECT_ORDER = ['1s', '2s', '3s', '1p', '2p', '3p'];

// 🔥 FOLDER COLOR ENGINE
const FOLDER_COLORS: Record<string, any> = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-500/30', text: 'text-indigo-900 dark:text-indigo-100', iconBg: 'bg-white dark:bg-indigo-500/30', iconColor: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-white/60 dark:bg-black/20 text-indigo-600 dark:text-indigo-300', hex: 'bg-indigo-500' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-500/30', text: 'text-rose-900 dark:text-rose-100', iconBg: 'bg-white dark:bg-rose-500/30', iconColor: 'text-rose-600 dark:text-rose-400', badge: 'bg-white/60 dark:bg-black/20 text-rose-600 dark:text-rose-300', hex: 'bg-rose-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-500/30', text: 'text-emerald-900 dark:text-emerald-100', iconBg: 'bg-white dark:bg-emerald-500/30', iconColor: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-white/60 dark:bg-black/20 text-emerald-600 dark:text-emerald-300', hex: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-500/30', text: 'text-amber-900 dark:text-amber-100', iconBg: 'bg-white dark:bg-amber-500/30', iconColor: 'text-amber-600 dark:text-amber-400', badge: 'bg-white/60 dark:bg-black/20 text-amber-600 dark:text-amber-300', hex: 'bg-amber-500' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-500/30', text: 'text-sky-900 dark:text-sky-100', iconBg: 'bg-white dark:bg-sky-500/30', iconColor: 'text-sky-600 dark:text-sky-400', badge: 'bg-white/60 dark:bg-black/20 text-sky-600 dark:text-sky-300', hex: 'bg-sky-500' },
    fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', border: 'border-fuchsia-100 dark:border-fuchsia-500/30', text: 'text-fuchsia-900 dark:text-fuchsia-100', iconBg: 'bg-white dark:bg-fuchsia-500/30', iconColor: 'text-fuchsia-600 dark:text-fuchsia-400', badge: 'bg-white/60 dark:bg-black/20 text-fuchsia-600 dark:text-fuchsia-300', hex: 'bg-fuchsia-500' }
};

const getDeckTheme = (title: string = '') => {
    const str = title.toLowerCase();
    if (str.match(/math|calc|num|algebra|geometry/)) return { icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' };
    if (str.match(/sci|bio|chem|phys|cell/)) return { icon: FlaskConical, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' };
    if (str.match(/art|color|draw|paint/)) return { icon: Palette, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', border: 'border-fuchsia-100 dark:border-fuchsia-500/20' };
    if (str.match(/food|eat|cook|kitchen/)) return { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' };
    if (str.match(/music|song|audio|sound/)) return { icon: Music, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' };
    if (str.match(/travel|place|city|country/)) return { icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-100 dark:border-sky-500/20' };
    if (str.match(/verb|action|do/)) return { icon: Activity, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20' };
    if (str.match(/body|health|med|doctor/)) return { icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' };
    if (str.match(/read|lit|book|vocab|word/)) return { icon: BookText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' };
    if (str.match(/code|tech|comp|program/)) return { icon: Code, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-200 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-700' };
    return { icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' };
};

// ============================================================================
//  0. CONTEXTUAL CONTENT FORGE
// ============================================================================
function ContextualCardBuilder({ config, onSave, onCancel }: any) {
    const isNewDeck = config.type === 'new_deck';
    const [deckTitle, setDeckTitle] = useState('');
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!front.trim() || !back.trim() || (isNewDeck && !deckTitle.trim())) return;
        setIsSaving(true);
        
        const finalDeckId = isNewDeck ? `custom_${Date.now()}` : config.deck.id;
        const finalTitle = isNewDeck ? deckTitle.trim() : config.deck.title;

        await onSave({ 
            front: front.trim(), 
            back: back.trim(), 
            deckId: finalDeckId, 
            deckTitle: finalTitle,
            type: 'note',
            ipa: '', 
            morphology: [{ part: front.trim(), meaning: 'Root', type: 'root' }],
            grammar_tags: ['Student Note']
        }, config.folder); 
        
        setIsSaving(false);
        onCancel(true); 
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 absolute inset-0 z-[200] animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-6 pt-safe-8 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-10">
                <button onClick={() => onCancel(false)} className="flex items-center text-slate-400 hover:text-rose-500 mb-4 text-xs font-black uppercase tracking-widest transition-colors bg-slate-50 dark:bg-slate-800 px-5 py-2.5 rounded-full w-fit active:scale-95">
                    <ArrowLeft size={16} className="mr-2"/> Cancel
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {isNewDeck ? 'Forge New Deck' : 'Add Target Card'}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 custom-scrollbar">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    
                    {isNewDeck ? (
                        <div className="flex flex-col gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1 flex justify-between">
                                <span>Deck Title</span>
                                {config.folder && <span className="text-slate-400 flex items-center gap-1"><FolderOpen size={12}/> {config.folder}</span>}
                            </label>
                            <input 
                                value={deckTitle} 
                                onChange={(e) => setDeckTitle(e.target.value)} 
                                placeholder="e.g., Biology Chapter 4" 
                                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors text-lg"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20"><Layers size={18}/></div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Appending to</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{config.deck.title}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Front (Target Concept)</label>
                        <input 
                            value={front} 
                            onChange={(e) => setFront(e.target.value)} 
                            placeholder="e.g., Mitosis" 
                            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors"
                            autoFocus={!isNewDeck}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Back (Definition / Note)</label>
                        <textarea 
                            value={back} 
                            onChange={(e) => setBack(e.target.value)} 
                            placeholder="e.g., Cellular division resulting in two identical cells." 
                            className="w-full p-4 h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors resize-none custom-scrollbar"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={!front.trim() || !back.trim() || (isNewDeck && !deckTitle.trim()) || isSaving}
                    className="w-full bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-safe-8"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                    {isSaving ? 'Processing...' : isNewDeck ? 'Forge Deck & Save Card' : 'Save Card to Deck'}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
//  1. SRB-POWERED STUDY MODE (SPACED REPETITION BRAIN)
// ============================================================================
function StudyModePlayer({ setParentCardStats, user, deckCards, userData, onToggleStar, deckId, initialSrbData, onFinish }: any) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showConjugations, setShowConjugations] = useState(false); 
    
    const [srbData, setSrbData] = useState<Record<string, any>>(initialSrbData || {});

    const [startX, setStartX] = useState<number | null>(null);
    const [startY, setStartY] = useState<number | null>(null);
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'right' | 'left' | 'up'>('right');

    const currentCard = deckCards[currentIndex];
    const isStarred = userData?.cardPrefs?.[currentCard?.id]?.starred || false;

    useEffect(() => {
        setShowConjugations(false);
        setIsFlipped(false);
    }, [currentIndex]);

    const calculateNextReview = (rating: 'again' | 'good' | 'easy', currentStats: any) => {
        let { easeFactor = 2.5, interval = 0, repetitions = 0 } = currentStats || {};

        if (rating === 'again') {
            repetitions = 0;
            interval = 1;
            easeFactor = Math.max(1.3, easeFactor - 0.2);
        } else if (rating === 'good') {
            repetitions += 1;
            if (repetitions === 1) interval = 1;
            else if (repetitions === 2) interval = 6;
            else interval = Math.round(interval * easeFactor);
        } else if (rating === 'easy') {
            repetitions += 1;
            easeFactor += 0.15;
            if (repetitions === 1) interval = 4;
            else interval = Math.round(interval * easeFactor * 1.3);
        }

        const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);
        return { easeFactor, interval, repetitions, nextReviewDate, lastStudied: Date.now() };
    };

  const handleRateCard = async (rating: 'again' | 'good' | 'easy') => {
        if (!user?.uid || !currentCard) return; 

        if ("vibrate" in navigator) {
            rating === 'easy' ? navigator.vibrate([40, 30, 40]) : 
            rating === 'good' ? navigator.vibrate(50) : 
            navigator.vibrate([100, 50, 100]);
        }

        const targetDeckId = currentCard.deckId || deckId || 'custom';
        const currentStats = srbData[currentCard.id] || {};
        const newStats = calculateNextReview(rating, currentStats);

        setSrbData(prev => ({ ...prev, [currentCard.id]: newStats }));
        if (setParentCardStats) setParentCardStats((prev: any) => ({ ...prev, [currentCard.id]: newStats }));
      
        const progressRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_progress', targetDeckId, 'card_stats', currentCard.id);
        setDoc(progressRef, newStats, { merge: true }).catch(console.error);

        setIsFlipped(false);
        
        setTimeout(() => {
            if (currentIndex < deckCards.length - 1) {
                setSlideDirection('right');
                setCurrentIndex(i => i + 1);
            } else {
                if (onFinish) onFinish(100); 
            }
        }, 150); 
    };

    const getIntervalLabel = (rating: 'again' | 'good' | 'easy') => {
        const stats = calculateNextReview(rating, srbData[currentCard?.id] || {});
        if (stats.interval === 0) return '< 10m';
        if (stats.interval === 1) return '1 Day';
        if (stats.interval < 30) return `${stats.interval} Days`;
        return `${Math.round(stats.interval / 30 * 10) / 10} Mo`;
    };

    const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
        if (showConjugations) return; 
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setStartX(clientX);
        setStartY(clientY);
        setDragX(0);
        setDragY(0);
    };

    const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (startX === null || startY === null || showConjugations) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const currentDragX = clientX - startX;
        const currentDragY = clientY - startY;
        
        if ((currentIndex === 0 && currentDragX > 0) || (currentIndex === deckCards.length - 1 && currentDragX < 0)) {
            setDragX(currentDragX * 0.2); 
        } else {
            setDragX(currentDragX);
        }
        setDragY(currentDragY < 0 ? currentDragY : 0);
    };

    const handlePointerUp = () => {
        if (startX === null || startY === null) return;
        
        const SWIPE_THRESHOLD_X = 75; 
        const SWIPE_THRESHOLD_Y = -60; 
        
        if (!isFlipped) {
            if (dragX > SWIPE_THRESHOLD_X && currentIndex > 0) {
                setSlideDirection('left');
                setCurrentIndex(i => i - 1);
            } else if (dragX < -SWIPE_THRESHOLD_X && currentIndex < deckCards.length - 1) {
                handleRateCard('good');
            } else if (dragY < SWIPE_THRESHOLD_Y || (Math.abs(dragX) < 10 && Math.abs(dragY) < 10)) {
                setIsFlipped(true);
                if ("vibrate" in navigator) navigator.vibrate(10); 
            }
        }
        
        setStartX(null);
        setStartY(null);
        setDragX(0);
        setDragY(0);
    };

    if (!currentCard) return null;

    const progress = ((currentIndex + 1) / deckCards.length) * 100;
    const animationClass = slideDirection === 'right' 
        ? 'animate-in fade-in slide-in-from-right-12 duration-300' 
        : 'animate-in fade-in slide-in-from-left-12 duration-300';

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-6 w-full overflow-hidden transition-colors duration-300 pb-safe-8">
            <div className="mb-6 shrink-0 pt-safe-4">
                <div className="flex justify-between text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 transition-colors">
                    <span>Target {currentIndex + 1}</span>
                    <span>{deckCards.length} Total</span>
                </div>
                <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner transition-colors">
                    <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div key={currentIndex} className={`flex-1 relative flex items-center justify-center perspective-[2000px] mb-6 ${animationClass}`}>
                <div 
                    onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                    onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                    className={`relative w-full aspect-[3/4] max-h-[480px] cursor-grab active:cursor-grabbing touch-none ${startX === null ? 'transition-transform duration-500' : ''}`}
                    style={{ 
                        transform: `translateX(${dragX}px) translateY(${dragY * 0.4}px) rotate(${dragX * 0.05}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <div className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out" style={{ transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)', transformStyle: 'preserve-3d' }}>
                        
                        {/* FRONT FACE */}
                        <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-[2.5rem] border-2 border-b-[8px] border-slate-800 shadow-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden transition-colors" style={{ backfaceVisibility: 'hidden' }}>
                            
                            {onToggleStar && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleStar(currentCard.id, isStarred); }} 
                                    className="absolute top-6 right-6 p-3 rounded-full hover:bg-white/10 transition-colors z-30"
                                >
                                    <Star size={24} className={isStarred ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-slate-600"} />
                                </button>
                            )}

                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest absolute top-6 left-6 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-sm z-20">Front</span>
                            
                            {currentCard.imageUrl && (
                                <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0">
                                    <img src={currentCard.imageUrl} className="w-full h-full object-cover blur-xl" alt="" />
                                </div>
                            )}

                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight relative z-10 w-full px-4 break-words overflow-hidden">{currentCard.front}</h2>                            
                            {currentCard.ipa && (
                                <p className="text-base font-bold text-indigo-400 mt-4 px-3 py-1 rounded-lg relative z-10" style={{ direction: 'ltr', fontFamily: 'Arial, sans-serif' }}>
                                    {currentCard.ipa}
                                </p>
                            )}

                            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-80 z-10">
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> Slide up to flip
                            </div>
                        </div>

                        {/* BACK FACE */}
                        <div className="absolute inset-0 w-full h-full bg-white rounded-[2.5rem] border-2 border-b-[8px] border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-colors" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                            {currentCard.conjugations && (
                                <button onClick={(e) => { e.stopPropagation(); setShowConjugations(true); }} className="absolute top-6 right-6 p-3 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 rounded-2xl shadow-lg border border-indigo-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all z-30">
                                    <Paperclip size={20} strokeWidth={3} />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
                                </button>
                            )}
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center overflow-y-auto custom-scrollbar relative z-10 pb-16">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute top-6 left-6 bg-slate-50 px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Back</span>
                                
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4 mt-8">{currentCard.type}</span>
                                
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">{currentCard.back}</h2>
                                
                                {currentCard.imageUrl && (
                                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 border-2 border-slate-50 shadow-inner shrink-0">
                                        <img src={currentCard.imageUrl} className="w-full h-full object-cover" alt="Context" />
                                    </div>
                                )}

                                {currentCard.audioUrl && (
                                    <div className="w-full bg-slate-50 p-2 rounded-xl flex items-center gap-3 border border-slate-200 shrink-0 mb-4">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-md"><Music size={16} /></div>
                                        <audio src={currentCard.audioUrl} controls className="h-10 w-full opacity-80" />
                                    </div>
                                )}

                                {currentCard.morphology && (
                                    <div className="flex flex-wrap justify-center gap-2 mt-2 pb-8">
                                        {currentCard.morphology.map((m: any, i: number) => (
                                            <div key={i} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-[10px] uppercase tracking-wider transition-colors">
                                                <span className="font-black text-indigo-600 mr-1">{m.part}</span>
                                                <span className="font-bold text-slate-500">{m.meaning}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent pt-6 pb-2">
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> Rate Target
                            </div>
                        </div>
                    </div>

                    {/* CONJUGATION OVERLAY */}
                    {showConjugations && currentCard.conjugations && (
                        <div className="absolute inset-0 z-40 bg-white/95 dark:bg-slate-900/95 rounded-[3rem] p-6 flex flex-col animate-in slide-in-from-bottom-12 duration-300 backdrop-blur-md border-2 border-indigo-500/30">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <Paperclip size={18} className="text-indigo-500" />
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Conjugation</span>
                                </div>
                                <button onClick={() => setShowConjugations(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-8">
                                {Object.entries(currentCard.conjugations).map(([tense, forms]: any) => (
                                    <div key={tense} className="space-y-2">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-md w-fit">{tense}</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SUBJECT_ORDER.map((person) => {
                                                const verb = forms[person];
                                                if (!verb) return null;
                                                return (
                                                    <div key={person} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{person}</span>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{verb}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 🔥 SRB INTERFACE (REPLACES NEXT/PREV WHEN FLIPPED) */}
            <div className="shrink-0 z-10 w-full mb-safe-4 min-h-[64px]">
                {!isFlipped ? (
                    <div className="flex items-center justify-between px-2 animate-in fade-in duration-300">
                        <button onClick={(e) => { e.stopPropagation(); setSlideDirection('left'); setCurrentIndex(i => i - 1); }} disabled={currentIndex === 0} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md border border-slate-100 dark:border-slate-700 disabled:opacity-30 transition-all active:scale-95 touch-manipulation">
                            <ChevronLeft size={28} strokeWidth={3} className="-ml-1" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tap card to review</span>
                        <button onClick={(e) => { e.stopPropagation(); setSlideDirection('right'); setCurrentIndex(i => i + 1); }} disabled={currentIndex === deckCards.length - 1} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md border border-slate-100 dark:border-slate-700 disabled:opacity-30 transition-all active:scale-95 touch-manipulation">
                            <ChevronRight size={28} strokeWidth={3} className="ml-1" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3 px-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <button onClick={() => handleRateCard('again')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm active:scale-95 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{getIntervalLabel('again')}</span>
                            <span className="font-black text-sm uppercase tracking-widest">Again</span>
                        </button>
                        <button onClick={() => handleRateCard('good')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{getIntervalLabel('good')}</span>
                            <span className="font-black text-sm uppercase tracking-widest">Good</span>
                        </button>
                        <button onClick={() => handleRateCard('easy')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border-2 border-sky-200 dark:border-sky-500/30 text-sky-600 dark:text-sky-400 shadow-sm active:scale-95 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{getIntervalLabel('easy')}</span>
                            <span className="font-black text-sm uppercase tracking-widest">Easy</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
//  2. MATCHING GAME & 3. QUIZ SESSION 
// ============================================================================
function MatchingGame({ deckCards, onGameEnd }: any) {
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const gameItems = deckCards.slice(0, 6).flatMap((c: any) => [
            { id: c.id, text: c.front, type: 'front', pairId: c.id },
            { id: c.id + '_back', text: c.back, type: 'back', pairId: c.id }
        ]).sort(() => Math.random() - 0.5);
        setCards(gameItems);
    }, [deckCards]);

    const handleCardClick = (index: number) => {
        if (isLocked || flipped.includes(index) || solved.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            setIsLocked(true);
            const [idx1, idx2] = newFlipped;
            if (cards[idx1].pairId === cards[idx2].pairId) {
                if ("vibrate" in navigator) navigator.vibrate(40);
                setTimeout(() => {
                    setSolved(prev => [...prev, idx1, idx2]);
                    setFlipped([]);
                    setIsLocked(false);
                    if (solved.length + 2 === cards.length) {
                        const pairs = cards.length / 2;
                        const accuracy = Math.max(0, 100 - ((moves + 1 - pairs) * 5));
                        setTimeout(() => onGameEnd(accuracy), 600);
                    }
                }, 600);
            } else {
                if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
                setTimeout(() => { setFlipped([]); setIsLocked(false); }, 1000);
            }
        }
    };

    if(cards.length === 0) return <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">Not enough cards.</div>;

    return (
        <div className="flex flex-col h-full p-4 max-w-md mx-auto w-full transition-colors">
            <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Speed Match</span>
                <span className="text-sm font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Moves: {moves}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {cards.map((card, i) => {
                    const isFlipped = flipped.includes(i);
                    const isSolved = solved.includes(i);
                    return (
                        <button key={i} onClick={() => handleCardClick(i)} disabled={isSolved} className={`relative aspect-square rounded-2xl text-sm font-bold flex items-center justify-center p-2 text-center transition-all duration-300 transform ${isSolved ? 'opacity-0 scale-75' : isFlipped ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-[3px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-[0_4px_0_rgb(226,232,240)] dark:shadow-[0_4px_0_rgb(51,65,85)] active:translate-y-1 active:shadow-none'}`}>
                            {isFlipped ? card.text : <Puzzle size={24} className="text-slate-300 dark:text-slate-600 opacity-50" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function QuizSessionView({ deckCards, onGameEnd }: any) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const currentCard = deckCards[index];

    const options = useMemo(() => {
        if (!currentCard) return [];
        const distractors = deckCards.filter((c: any) => c.id !== currentCard.id && c.back !== currentCard.back).sort(() => 0.5 - Math.random()).slice(0, 3).map((c: any) => c.back);
        return [...distractors, currentCard.back].sort(() => 0.5 - Math.random());
    }, [currentCard, deckCards]);

    const handleOptionClick = (option: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setSelectedOption(option);
        const isCorrect = option === currentCard.back;
        
        if ("vibrate" in navigator) {
            isCorrect ? navigator.vibrate(50) : navigator.vibrate([100, 50, 100]);
        }

        if (isCorrect) { setScore(s => s + 1); setStreak(s => s + 1); } else { setStreak(0); }

        setTimeout(() => {
            if (index < deckCards.length - 1) {
                setIndex(prev => prev + 1); setSelectedOption(null); setIsProcessing(false);
            } else {
                const finalScore = isCorrect ? score + 1 : score;
                onGameEnd({ score: finalScore, total: deckCards.length });
            }
        }, 1200);
    };

    if (!currentCard) return null;
    const progress = (index / deckCards.length) * 100;

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-6 transition-colors">
            <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className={`flex items-center gap-1.5 font-black text-sm ${streak >= 3 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}>
                    <Flame size={18} fill={streak >= 3 ? "currentColor" : "none"} /> {streak}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center min-h-[220px] mb-8 relative animate-in slide-in-from-right-8" key={index}>
                {selectedOption && (
                    <div className="absolute -top-4 right-4">
                        {selectedOption === currentCard.back 
                            ? <CheckCircle2 size={40} className="text-emerald-500 bg-white dark:bg-slate-900 rounded-full shadow-lg animate-bounce" fill="currentColor" /> 
                            : <XCircle size={40} className="text-rose-500 bg-white dark:bg-slate-900 rounded-full shadow-lg" fill="currentColor" />
                        }
                    </div>
                )}
                
                {currentCard.imageUrl && (
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-4 opacity-80 border-2 border-slate-100 dark:border-slate-800">
                        <img src={currentCard.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                )}

                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">Translate</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">{currentCard.front}</h2>
            </div>

            <div className="space-y-3 flex-1">
                {options.map((opt, idx) => {
                    let btnClass = "bg-white dark:bg-slate-800 border-2 border-b-[6px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:translate-y-[4px]"; 
                    if (selectedOption) {
                        if (opt === currentCard.back) btnClass = "bg-emerald-50 dark:bg-emerald-500/20 border-2 border-b-[6px] border-emerald-500 text-emerald-600";
                        else if (opt === selectedOption) btnClass = "bg-rose-50 dark:bg-rose-500/20 border-2 border-b-2 border-rose-500 text-rose-600 translate-y-[4px]";
                        else btnClass = "opacity-40 border-slate-100 dark:border-slate-800 translate-y-[4px]";
                    }
                    return (
                        <button key={idx} onClick={() => handleOptionClick(opt)} disabled={isProcessing} className={`w-full p-4 rounded-2xl font-black text-lg transition-all ${btnClass}`}>
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
//  4. MAIN FLASHCARD VIEW (HUB)
// ============================================================================
export default function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onLogActivity, userData, onSaveCard, onToggleStar, onToggleArchive, onCreateFolder, onAssignToFolder, onHideDeck, onUpdateFolder, onDeleteFolder, user }: any) {
    const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing' | 'create'>('library');
    const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
    
    const [deckFilter, setDeckFilter] = useState<string>('all');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    const [activeOptionsDeck, setActiveOptionsDeck] = useState<any>(null);
    const [activeOptionsFolder, setActiveOptionsFolder] = useState<string | null>(null);
    const [menuView, setMenuView] = useState<'main' | 'folders'>('main'); 
    
    const [showFolderModal, setShowFolderModal] = useState<{isOpen: boolean, editMode: boolean, oldName: string}>({isOpen: false, editMode: false, oldName: ''});
    
    const [fetchedCards, setFetchedCards] = useState<any[]>([]);
    const [cardStats, setCardStats] = useState<Record<string, any>>({});
    const [isFetchingCards, setIsFetchingCards] = useState(false);
    
    const [sessionCards, setSessionCards] = useState<any[]>([]);
    const [libTouchStart, setLibTouchStart] = useState<{x: number, y: number} | null>(null);
    const [touchStartCoords, setTouchStartCoords] = useState<{x: number, y: number} | null>(null);
    const [builderConfig, setBuilderConfig] = useState<{type: 'new_deck', folder: string | null} | {type: 'add_card', deck: any} | null>(null);

    // 🔥 DRAG AND DROP STATES
    const [draggedDeckId, setDraggedDeckId] = useState<string | null>(null);
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

    const [omniDeck, setOmniDeck] = useState<any>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const filterBarRef = useRef<HTMLDivElement>(null);

    const resolvedDeck = omniDeck || (selectedDeckKey ? allDecks[selectedDeckKey] : null);
    const cards = omniDeck ? omniDeck.cards : fetchedCards;
    const deckTitle = resolvedDeck ? (resolvedDeck.id === 'custom' ? "My Study Cards" : resolvedDeck.title) : "";

    const customFolders: string[] = userData?.studyFolders || [];
    const folderColors: Record<string, string> = userData?.folderColors || {};

    const handleBack = () => {
        if (activeOptionsDeck) { setActiveOptionsDeck(null); return; }
        if (activeOptionsFolder) { setActiveOptionsFolder(null); return; }
        if (showFolderModal.isOpen) { setShowFolderModal({isOpen: false, editMode: false, oldName: ''}); return; }
        if (internalMode === 'playing') { setInternalMode('menu'); return; }
        if (internalMode === 'create') {
            setInternalMode(builderConfig?.type === 'add_card' ? 'menu' : 'library');
            return;
        }
        if (internalMode === 'menu') {
            setInternalMode('library');
            setOmniDeck(null);
            return;
        }
        if (deckFilter !== 'all') { setDeckFilter('all'); return; }
        if (onSelectDeck) onSelectDeck(null);
    };

    const handleBackRef = useRef(handleBack);
    useEffect(() => {
        handleBackRef.current = handleBack;
    }, [activeOptionsDeck, activeOptionsFolder, showFolderModal, internalMode, builderConfig, deckFilter, onSelectDeck]);

    useEffect(() => {
        const handleNativeBack = (e: PopStateEvent) => handleBackRef.current();
        window.addEventListener('popstate', handleNativeBack);
        return () => window.removeEventListener('popstate', handleNativeBack);
    }, []);

    useEffect(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }, [deckFilter, internalMode]);

    useEffect(() => {
        if (filterBarRef.current) {
            const activeTab = filterBarRef.current.querySelector('[data-active="true"]');
            if (activeTab) {
                activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [deckFilter]);

    useEffect(() => {
        const fetchDeckCards = async () => {
            if (!selectedDeckKey || omniDeck) return;
            
            if (selectedDeckKey === 'custom') {
                setFetchedCards(allDecks['custom']?.cards || []);
                return;
            }

            setIsFetchingCards(true);
            try {
                const masterDeck = allDecks[selectedDeckKey];
                const masterUpdatedAt = masterDeck?.updatedAt || 0;
                const cachedData = await getDeckFromCache(selectedDeckKey);

                let finalCards = [];
                if (cachedData && cachedData.updatedAt >= masterUpdatedAt) {
                    finalCards = cachedData.cards;
                } else {
                    const cardsRef = collection(db, 'artifacts', appId, 'decks', selectedDeckKey, 'cards');
                    const snap = await getDocs(cardsRef);
                    finalCards = snap.docs.map(doc => doc.data());
                    await saveDeckToCache(selectedDeckKey, finalCards, masterUpdatedAt);
                }
                setFetchedCards(finalCards);

                if (user?.uid) {
                    const statsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'deck_progress', selectedDeckKey, 'card_stats');
                    const statsSnap = await getDocs(statsRef);
                    const statsMap: Record<string, any> = {};
                    statsSnap.docs.forEach(d => { statsMap[d.id] = d.data(); });
                    setCardStats(statsMap);
                }

            } catch (err) {
                console.error("Failed to load cards:", err);
                setToastMsg("Failed to download deck. Check connection.");
            } finally {
                setIsFetchingCards(false);
            }
        };

        fetchDeckCards();
    }, [selectedDeckKey, omniDeck, allDecks, user?.uid]);

    const dueCards = useMemo(() => {
        return cards.filter((c: any) => {
            const stat = cardStats[c.id];
            return !stat?.nextReviewDate || stat.nextReviewDate <= Date.now();
        });
    }, [cards, cardStats]);

    const launchGame = (mode: 'standard' | 'quiz' | 'match' | 'tower') => {
        if (cards.length === 0) {
            setToastMsg("This deck has no cards.");
            return;
        }

        window.history.pushState({ view: 'playing' }, ''); 
        const studySnapshot = mode === 'standard' && dueCards.length > 0 ? [...dueCards] : [...cards];
        setSessionCards(studySnapshot);
        
        setActiveGame(mode);
        setInternalMode('playing');
    };

    const handleGameFinish = (scorePct: number) => {
        const baseMultiplier = activeGame === 'quiz' ? 10 : activeGame === 'match' ? 15 : 5;
        const earnedXP = Math.round((cards.length * baseMultiplier) * (scorePct / 100)); 
        onLogActivity(resolvedDeck?.id || 'custom', earnedXP, `${deckTitle} (${activeGame})`, { scorePct, mode: activeGame });
        
        window.history.back(); 
        setTimeout(() => setToastMsg(`Protocol Complete! +${earnedXP} XP Earned!`), 100);
    };

    const handleSwipeStart = (e: React.TouchEvent) => {
        setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleMenuSwipeEnd = (e: React.TouchEvent) => {
        if (!touchStartCoords) return;
        const deltaX = touchStartCoords.x - e.changedTouches[0].clientX;
        const deltaY = touchStartCoords.y - e.changedTouches[0].clientY;

        if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY)) {
            window.history.back(); 
        }
        setTouchStartCoords(null);
    };

    const handleLibrarySwipeStart = (e: React.TouchEvent) => {
        setLibTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleLibrarySwipeEnd = (e: React.TouchEvent) => {
        if (!libTouchStart) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = libTouchStart.x - touchEndX; 
        const deltaY = libTouchStart.y - touchEndY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const allFilters = ['all', 'created', 'downloaded', 'archived', ...customFolders];
            const currentIndex = allFilters.indexOf(deckFilter);

            if (deltaX > 0 && currentIndex < allFilters.length - 1) {
                setDeckFilter(allFilters[currentIndex + 1]);
                if ("vibrate" in navigator) navigator.vibrate(15); 
            } else if (deltaX < 0 && currentIndex > 0) {
                setDeckFilter(allFilters[currentIndex - 1]);
                if ("vibrate" in navigator) navigator.vibrate(15); 
            }
        }
        setLibTouchStart(null);
    };

    const launchOmniMode = async (folderName: string) => {
        const folderDecks = Object.values(allDecks).filter((d: any) => userData?.deckPrefs?.[d.id]?.folder === folderName && !userData?.deckPrefs?.[d.id]?.archived);
        
        if (folderDecks.length === 0) {
            setToastMsg("Folder has no decks to study.");
            return;
        }

        setIsFetchingCards(true);
        setToastMsg("Compiling Omni-Deck...");
        
        try {
            const allPromises = folderDecks.map(async (deck: any) => {
                if (deck.id === 'custom') return deck.cards || [];
                
                const cachedData = await getDeckFromCache(deck.id);
                if (cachedData && cachedData.updatedAt >= (deck.updatedAt || 0)) {
                    return cachedData.cards;
                }

                const cardsRef = collection(db, 'artifacts', appId, 'decks', deck.id, 'cards');
                const snap = await getDocs(cardsRef);
                const loadedCards = snap.docs.map(doc => doc.data());
                
                await saveDeckToCache(deck.id, loadedCards, deck.updatedAt || 0);
                return loadedCards;
            });

            const statsPromises = folderDecks.map(async (deck: any) => {
                if (deck.id === 'custom') return [];
                const statsRef = collection(db, 'artifacts', appId, 'users', user?.uid, 'deck_progress', deck.id, 'card_stats');
                const snap = await getDocs(statsRef);
                return snap.docs.map(d => ({ id: d.id, ...d.data() }));
            });

            const [allResults, allStats] = await Promise.all([Promise.all(allPromises), Promise.all(statsPromises)]);
            
            const allCards = allResults.flat();
            
            const statsMap: Record<string, any> = {};
            allStats.flat().forEach((stat: any) => { statsMap[stat.id] = stat; });
            setCardStats(statsMap);

            if (allCards.length === 0) {
                setToastMsg("No cards found inside these decks.");
                setIsFetchingCards(false);
                return;
            }

            window.history.pushState({ view: 'menu' }, ''); 
            setOmniDeck({
                id: `omni_${folderName}`,
                title: `${folderName} (Omni-Mode)`,
                cards: allCards.sort(() => Math.random() - 0.5) 
            });
            setInternalMode('menu');
        } catch (err) {
            console.error("Omni-Fetch failed:", err);
            setToastMsg("Failed to compile Omni-Deck.");
        } finally {
            setIsFetchingCards(false);
        }
    };

    const handleSaveFromBuilder = async (cardData: any, folderToAssign: string | null) => {
        await onSaveCard(cardData.deckId, cardData);
        if (folderToAssign && onAssignToFolder) {
            await onAssignToFolder(cardData.deckId, folderToAssign);
        }
    };

    if (internalMode === 'create' && builderConfig) {
        return (
            <ContextualCardBuilder 
                config={builderConfig}
                onSave={handleSaveFromBuilder} 
                onCancel={(success?: boolean) => {
                    window.history.back();
                    if (success) setTimeout(() => setToastMsg(builderConfig.type === 'new_deck' ? "Deck Forged." : "Card Appended."), 100);
                }} 
            />
        );
    }

if (internalMode === 'library') {
        const filteredDecks = Object.entries(allDecks).filter(([key, deck]: any) => {
            const isCustom = key === 'custom';
            const isAuthor = deck.authorId === user?.uid || deck.ownerId === user?.uid;
            
            const isUnlocked = 
                userData?.unlocks?.[key] || 
                (Array.isArray(userData?.unlocks) && userData.unlocks.includes(key)) ||
                (Array.isArray(userData?.inventory) && userData.inventory.includes(key));
            
            const hasPrefs = !!userData?.deckPrefs?.[key]; 

            const inMyVault = isCustom || isAuthor || isUnlocked || hasPrefs;
            
            if (!inMyVault) return false; 

            const isArchived = userData?.deckPrefs?.[key]?.archived || false;
            const currentFolder = userData?.deckPrefs?.[key]?.folder || null;
            
            if (deckFilter === 'archived') return isArchived;
            if (isArchived) return false; 

            if (deckFilter === 'all') return currentFolder === null;
            if (deckFilter === 'created') return (isCustom || isAuthor) && currentFolder === null;
            if (deckFilter === 'downloaded') return (!isCustom && !isAuthor) && currentFolder === null;
            
            if (customFolders.includes(deckFilter)) return currentFolder === deckFilter;
            return true;
        });

        const handleSaveNewFolder = async (folderName: string, color: string) => {
            if (!folderName.trim()) return;
            if (showFolderModal.editMode && onUpdateFolder) {
                await onUpdateFolder(showFolderModal.oldName, folderName.trim(), color);
                setToastMsg("Folder updated.");
                if (deckFilter === showFolderModal.oldName) setDeckFilter(folderName.trim()); 
            } else if (onCreateFolder) {
                await onCreateFolder(folderName.trim(), color);
                setToastMsg(`Folder "${folderName.trim()}" created.`);
            }
            window.history.back(); 
        };

        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                {showFolderModal.isOpen && (
                    <FolderModal 
                        initialName={showFolderModal.editMode ? showFolderModal.oldName : ''}
                        initialColor={showFolderModal.editMode ? folderColors[showFolderModal.oldName] : 'indigo'}
                        isEdit={showFolderModal.editMode}
                        onSave={handleSaveNewFolder}
                        onClose={() => window.history.back()}
                    />
                )}

                <div className="sticky top-0 z-30 w-full flex flex-col shrink-0">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-5 flex justify-between items-center pt-safe">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white p-2.5 rounded-xl shadow-md shadow-orange-500/20"><Library size={22} strokeWidth={3}/></div>
                            <span className="font-black text-slate-800 dark:text-white text-2xl uppercase tracking-tighter">Study Hub</span>
                        </div>
                        <button 
                            onClick={() => {
                                window.history.pushState({ view: 'create' }, ''); 
                                setBuilderConfig({ type: 'new_deck', folder: null });
                                setInternalMode('create');
                            }} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} /> New Deck
                        </button>
                    </div>

                    <div ref={filterBarRef} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-2 overflow-x-auto custom-scrollbar overscroll-x-contain scroll-smooth">
                        <Filter size={16} className="text-slate-400 mr-2 shrink-0" />
                        
                        {['all', 'created', 'downloaded', 'archived'].map((f: any) => (
                            <button 
                                key={f} 
                                onClick={() => {
                                    if (deckFilter === 'all') window.history.pushState({ view: 'folder' }, '');
                                    setDeckFilter(f);
                                }} 
                                data-active={deckFilter === f} 
                                className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${deckFilter === f ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                        
                        {customFolders.length > 0 && <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-2 shrink-0" />}
                        {customFolders.map((folderName: string) => {
                            const cTheme = FOLDER_COLORS[folderColors[folderName] || 'indigo'];
                            return (
                                <button 
                                    key={folderName} 
                                    onClick={() => {
                                        if (deckFilter === 'all') window.history.pushState({ view: 'folder' }, '');
                                        setDeckFilter(folderName);
                                    }} 
                                    data-active={deckFilter === folderName} 
                                    className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 ${deckFilter === folderName ? `${cTheme.hex} text-white shadow-md` : `${cTheme.bg} ${cTheme.iconColor}`}`}
                                >
                                    <Folder size={12} fill="currentColor" /> {folderName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div 
                    ref={scrollContainerRef} 
                    onTouchStart={handleLibrarySwipeStart}
                    onTouchEnd={handleLibrarySwipeEnd}
                    className="flex-1 overflow-y-auto p-6 space-y-5 pb-28 relative z-10 custom-scrollbar overscroll-y-contain h-full"
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        
                        {customFolders.includes(deckFilter) && (
                            <div className="col-span-full animate-in fade-in duration-300 mb-2 mt-2">
                                <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors w-fit bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95">
                                    <ArrowLeft size={14} /> Back to Library
                                </button>
                                
                                <div className="flex items-center gap-3 mt-6 mb-4">
                                    <FolderOpen size={28} className={FOLDER_COLORS[folderColors[deckFilter] || 'indigo'].iconColor} />
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{deckFilter}</h2>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            window.history.pushState({ view: 'create' }, ''); 
                                            setBuilderConfig({ type: 'new_deck', folder: deckFilter });
                                            setInternalMode('create');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all hover:border-indigo-200"
                                    >
                                        <Plus size={16} /> New Deck
                                    </button>
                                    <button 
                                        onClick={() => launchOmniMode(deckFilter)}
                                        disabled={isFetchingCards}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all disabled:opacity-50 ${FOLDER_COLORS[folderColors[deckFilter] || 'indigo'].hex}`}
                                    >
                                        {isFetchingCards ? <Loader2 size={16} className="animate-spin" /> : <Infinity size={16} />} 
                                        Omni-Study
                                    </button>
                                </div>
                            </div>
                        )}

                        {deckFilter === 'all' && customFolders.map((folderName: string) => {
                            const itemCount = Object.keys(allDecks).filter(key => userData?.deckPrefs?.[key]?.folder === folderName && !userData?.deckPrefs?.[key]?.archived).length;
                            const theme = FOLDER_COLORS[folderColors[folderName] || 'indigo'];
                            
                            // 🔥 FOLDER DROP ZONE
                            const isDragTarget = dragOverFolder === folderName;
                            
                            return (
                                <div 
                                    key={`folder-${folderName}`} 
                                    className={`relative group h-full transition-all duration-300 rounded-[2rem] ${isDragTarget ? 'scale-105 ring-4 ring-indigo-500/50 shadow-xl z-20' : ''}`}
                                    onDragOver={(e) => {
                                        e.preventDefault(); // Must prevent default to allow drop
                                        if (draggedDeckId) setDragOverFolder(folderName);
                                    }}
                                    onDragLeave={() => setDragOverFolder(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const deckId = e.dataTransfer.getData('text/plain');
                                        if (deckId && onAssignToFolder) {
                                            onAssignToFolder(deckId, folderName);
                                            setToastMsg(`Moved to ${folderName}`);
                                        }
                                        setDragOverFolder(null);
                                        setDraggedDeckId(null);
                                    }}
                                >
                                    <button 
                                        onClick={() => {
                                            window.history.pushState({ view: 'folder' }, '');
                                            setDeckFilter(folderName);
                                        }} 
                                        className={`w-full ${theme.bg} rounded-[2rem] p-5 border-4 ${theme.border} transition-all text-left flex flex-col h-full animate-in fade-in duration-300 relative z-10 ${isDragTarget ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300' : 'hover:-translate-y-1 shadow-sm hover:shadow-xl'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 ${theme.iconBg} ${theme.iconColor} rounded-[1rem] flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                                                <Folder size={24} fill="currentColor" className={isDragTarget ? 'animate-bounce' : ''} />
                                            </div>
                                        </div>
                                        <h3 className={`font-black ${theme.text} text-lg leading-tight line-clamp-2 pr-6 mb-auto`}>{folderName}</h3>
                                        <div className="mt-3">
                                            <span className={`text-[9px] uppercase font-black tracking-widest ${theme.badge} px-2.5 py-1 rounded-md shadow-sm`}>
                                                {itemCount} Decks
                                            </span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault(); e.stopPropagation(); 
                                            window.history.pushState({ view: 'modal' }, '');
                                            setActiveOptionsFolder(folderName);
                                        }}
                                        className={`absolute top-3 right-3 p-2 rounded-full ${theme.iconColor} hover:bg-white/50 transition-colors active:bg-white/80 z-20`}
                                        aria-label="Folder Options"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            );
                        })}

                        {filteredDecks.length === 0 && deckFilter !== 'all' && customFolders.includes(deckFilter) && (
                             <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] mt-4 text-slate-400 font-bold text-sm uppercase tracking-widest flex flex-col items-center gap-3">
                                 <FolderPlus size={32} className="opacity-20" />
                                 Folder is empty
                             </div>
                        )}

                        {filteredDecks.map(([key, deck]: any) => {
                            const displayTitle = deck.id === 'custom' ? "My Study Cards" : deck.title;
                            const theme = getDeckTheme(displayTitle);
                            const DeckIcon = deck.icon || theme.icon;
                            const cardCount = deck.id === 'custom' ? (deck.cards?.length || 0) : (deck.stats?.cardCount || 0);

                            // 🔥 DRAGGABLE DECK
                            const isDragging = draggedDeckId === key;

                            return (
                                <div 
                                    key={key} 
                                    className={`relative group animate-in fade-in duration-300 h-full pt-2 transition-all ${isDragging ? 'opacity-40 scale-95' : ''}`}
                                >
                                    <div className="absolute inset-x-4 -bottom-1 h-10 bg-slate-200 dark:bg-slate-800 rounded-[2rem] transition-transform duration-300 group-hover:translate-y-1.5" />
                                    <div className="absolute inset-x-2 -bottom-0 h-10 bg-slate-100 dark:bg-slate-800/80 rounded-[2rem] transition-transform duration-300 group-hover:translate-y-1" />

                                    <button 
                                        draggable={true}
                                        onDragStart={(e) => {
                                            setDraggedDeckId(key);
                                            e.dataTransfer.setData('text/plain', key);
                                            e.dataTransfer.effectAllowed = 'move';
                                            // Optional: Hide the default drag image or replace it
                                        }}
                                        onDragEnd={() => {
                                            setDraggedDeckId(null);
                                            setDragOverFolder(null);
                                        }}
                                        onClick={() => { 
                                            window.history.pushState({ view: 'menu' }, ''); 
                                            onSelectDeck(key); 
                                            setInternalMode('menu'); 
                                        }} 
                                        className="w-full h-full bg-white dark:bg-slate-900 rounded-[2rem] p-5 border-2 border-slate-50 dark:border-slate-800 hover:border-slate-100 dark:hover:border-slate-700 transition-all text-left shadow-sm group-hover:-translate-y-1 relative z-10 flex flex-col cursor-grab active:cursor-grabbing"
                                    > 
                                        <div className="flex justify-between items-start mb-4 pointer-events-none">
                                            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center text-xl border shadow-inner group-hover:scale-110 transition-transform ${theme.bg} ${theme.color} ${theme.border}`}>
                                                {typeof DeckIcon === 'string' ? DeckIcon : <DeckIcon size={24}/>}
                                            </div>
                                        </div>
                                        
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight line-clamp-2 pr-8 mb-3 pointer-events-none">{displayTitle}</h3>
                                        
                                        <div className="mt-auto pt-1 flex flex-col gap-2 pointer-events-none">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1">
                                                    <Layers size={10} /> {cardCount}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault(); e.stopPropagation(); 
                                            window.history.pushState({ view: 'modal' }, '');
                                            setActiveOptionsDeck(deck);
                                            setMenuView('main'); 
                                        }}
                                        className="absolute top-4 right-3 p-2 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20"
                                        aria-label="Deck Options"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {activeOptionsFolder && (
                    <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => window.history.back()} />
                        <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe-6">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
                            
                            <div className="flex items-center gap-4 mb-6 px-2">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${FOLDER_COLORS[folderColors[activeOptionsFolder] || 'indigo'].bg} ${FOLDER_COLORS[folderColors[activeOptionsFolder] || 'indigo'].iconColor}`}>
                                    <Folder size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight line-clamp-1">{activeOptionsFolder}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Folder Settings</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button 
                                    onClick={() => { 
                                        window.history.pushState({ view: 'modal' }, '');
                                        setActiveOptionsFolder(null); 
                                        setShowFolderModal({isOpen: true, editMode: true, oldName: activeOptionsFolder}); 
                                    }} 
                                    className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                >
                                    <Edit3 size={20} className="text-indigo-500" /> Edit Folder
                                </button>
                                
                                <button 
                                    onClick={() => { 
                                        window.history.back(); 
                                        setTimeout(() => launchOmniMode(activeOptionsFolder), 50); 
                                    }} 
                                    className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                >
                                    <Infinity size={20} className="text-emerald-500" /> Study Omni-Mode
                                </button>

                                <div className="h-4" />
                                
                                <button 
                                    onClick={() => { 
                                        window.history.back(); 
                                        setTimeout(() => {
                                            if(onDeleteFolder) onDeleteFolder(activeOptionsFolder); 
                                            setToastMsg("Folder deleted."); 
                                        }, 50);
                                    }} 
                                    className="w-full text-left px-5 py-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                >
                                    <Trash2 size={20} /> Delete Folder
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeOptionsDeck && (
                    <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                        <div 
                            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
                            onClick={() => window.history.back()} 
                        />
                        <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe-6">
                            
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
                            
                            <div className="flex items-center gap-4 mb-6 px-2">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    {activeOptionsDeck.icon || <Layers size={24} className="text-slate-400" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight line-clamp-1">
                                        {activeOptionsDeck.id === 'custom' ? "My Study Cards" : activeOptionsDeck.title}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deck Options</p>
                                </div>
                            </div>

                            {menuView === 'main' ? (
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setMenuView('folders')} 
                                        className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center transition-colors active:scale-[0.98]"
                                    >
                                        <span className="flex items-center gap-3"><FolderPlus size={20} className="text-indigo-500" /> Move to Folder</span>
                                        <ChevronRight size={18} className="text-slate-400" />
                                    </button>
                                    
                                    {onToggleArchive && (
                                        <button 
                                            onClick={() => { 
                                                window.history.back(); 
                                                setTimeout(() => onToggleArchive(activeOptionsDeck.id, userData?.deckPrefs?.[activeOptionsDeck.id]?.archived || false), 50); 
                                            }} 
                                            className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                        >
                                            <Archive size={20} className="text-amber-500" /> 
                                            {userData?.deckPrefs?.[activeOptionsDeck.id]?.archived ? 'Unarchive Deck' : 'Archive Deck'}
                                        </button>
                                    )}
                                    
                                    <div className="h-4" />
                                    
                                    <button 
                                        onClick={() => { 
                                            window.history.back(); 
                                            setTimeout(() => {
                                                if (onHideDeck) onHideDeck(activeOptionsDeck.id);
                                                setToastMsg("Deck banished."); 
                                            }, 50);
                                        }} 
                                        className="w-full text-left px-5 py-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                    >
                                        <Trash2 size={20} /> Remove Deck
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button onClick={() => setMenuView('main')} className="px-3 py-3 w-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mb-2">
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        <button 
                                            onClick={() => { 
                                                window.history.back(); 
                                                setTimeout(() => { onAssignToFolder(activeOptionsDeck.id, null); setToastMsg("Removed from folder."); }, 50);
                                            }}
                                            className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all active:scale-[0.98] ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === null || !userData?.deckPrefs?.[activeOptionsDeck.id]?.folder ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === null || !userData?.deckPrefs?.[activeOptionsDeck.id]?.folder ? 'bg-indigo-500 shadow-sm' : 'border-2 border-slate-300 dark:border-slate-600'}`} />
                                            None (Main Library)
                                        </button>

                                        {customFolders.map(folderName => (
                                            <button 
                                                key={folderName}
                                                onClick={() => { 
                                                    window.history.back(); 
                                                    setTimeout(() => { onAssignToFolder(activeOptionsDeck.id, folderName); setToastMsg(`Moved to ${folderName}`); }, 50); 
                                                }}
                                                className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all active:scale-[0.98] ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === folderName ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === folderName ? 'bg-indigo-500 shadow-sm' : 'border-2 border-slate-300 dark:border-slate-600'}`} />
                                                <FolderOpen size={18} className={userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === folderName ? 'text-indigo-500' : 'text-slate-400'} />
                                                {folderName}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="h-4" />
                                    
                                    <button 
                                        onClick={() => { 
                                            window.history.pushState({ view: 'modal' }, '');
                                            setActiveOptionsDeck(null); 
                                            setShowFolderModal({isOpen: true, editMode: false, oldName: ''}); 
                                        }}
                                        className="w-full text-left px-5 py-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                    >
                                        <Plus size={20} strokeWidth={3} /> Create New Folder
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- MENU VIEW ---
    if (internalMode === 'menu') {
        const displayMenuTitle = deckTitle.includes('(Omni-Mode)') ? deckTitle.replace(' (Omni-Mode)', '') : deckTitle;
        
        return (
            <div 
                onTouchStart={handleSwipeStart}
                onTouchEnd={handleMenuSwipeEnd}
                className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors"
            >
                <div className="px-6 pt-8 pb-4">
                    <button onClick={() => window.history.back()} className="flex items-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm w-fit active:scale-95">
                        <ArrowLeft size={16} className="mr-2"/> Back
                    </button>
                    
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{displayMenuTitle}</h1>
                        
                        {!omniDeck && (
                            <button 
                                onClick={() => {
                                    window.history.pushState({ view: 'create' }, '');
                                    setBuilderConfig({ type: 'add_card', deck: resolvedDeck });
                                    setInternalMode('create');
                                }} 
                                className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-3 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/30 active:scale-95 transition-all"
                                aria-label="Add Card"
                            >
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                    
                    {/* 🔥 THE NEW SRB STATUS PILL */}
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-2 w-fit mt-3 transition-colors ${
                        isFetchingCards ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                        dueCards.length === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                    }`}>
                        {isFetchingCards ? (
                            <><Loader2 size={12} className="animate-spin" /> Calculating Matrix...</>
                        ) : dueCards.length === 0 ? (
                            <><CheckCircle2 size={12} /> All Caught Up • {cards.length} Total</>
                        ) : (
                            <><BrainCircuit size={12} className="animate-pulse" /> {dueCards.length} Due for Review • {cards.length} Total</>
                        )}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                    {isFetchingCards ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
                            <p className="font-black uppercase tracking-widest text-slate-500 text-xs">Decrypting Cards...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            
                            {/* 🔥 THE SRB REVIEW BUTTON */}
                            <button 
                                onClick={() => launchGame('standard')} 
                                className={`p-6 rounded-[2.5rem] border-[3px] shadow-sm hover:-translate-y-1 transition-all group text-left ${
                                    dueCards.length > 0 
                                        ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/50' 
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform ${dueCards.length > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                                    {dueCards.length > 0 ? <BrainCircuit size={28}/> : <Layers size={28}/>}
                                </div>
                                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">
                                    {dueCards.length > 0 ? 'Review Due' : 'Browse Deck'}
                                </h4>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${dueCards.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {dueCards.length > 0 ? 'Spaced Repetition' : 'Standard Mode'}
                                </p>
                            </button>

                            <button onClick={() => launchGame('quiz')} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:-translate-y-1 transition-all group text-left">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-6 transition-transform"><HelpCircle size={28}/></div>
                                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">Quiz</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Multiple Choice</p>
                            </button>

                            <button onClick={() => launchGame('match')} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-100 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-1 transition-all group text-left">
                                <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform"><Puzzle size={28}/></div>
                                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">Match</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Speed Pairs</p>
                            </button>

                            <button className="bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-800 shadow-xl opacity-50 cursor-not-allowed group text-left relative overflow-hidden">
                                <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-4"><Flame size={28} fill="currentColor"/></div>
                                <h4 className="font-black text-white text-xl leading-none mb-2">Tower</h4>
                                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Survival</p>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- PLAYING VIEW ---
    return (
        <div 
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleMenuSwipeEnd}
            className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-bottom-8 duration-500 relative z-[100] transition-colors pb-safe"
        >
            <div className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <button onClick={() => window.history.back()} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} strokeWidth={3}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-0.5">{activeGame} Protocol</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{deckTitle}</span>
                </div>
                <div className="w-11"></div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {activeGame === 'standard' && <StudyModePlayer deckCards={sessionCards} initialSrbData={cardStats} setParentCardStats={setCardStats} user={user} userData={userData} onToggleStar={onToggleStar} deckId={selectedDeckKey} onFinish={handleGameFinish} />}
                
                {activeGame === 'quiz' && <div className="h-full overflow-y-auto"><QuizSessionView deckCards={sessionCards} onGameEnd={(res: any) => handleGameFinish(res.score ? (res.score/res.total)*100 : 0)} /></div>}
                {activeGame === 'match' && <div className="h-full overflow-y-auto pt-6"><MatchingGame deckCards={sessionCards} onGameEnd={(scorePct: number) => handleGameFinish(scorePct)} /></div>}
            </div>
        </div>
    );
}

// Extracted reusable Folder Modal component to keep the main render cleaner
function FolderModal({ initialName, initialColor, isEdit, onSave, onClose }: any) {
    const [name, setName] = useState(initialName || '');
    const [color, setColor] = useState(initialColor || 'indigo');

    return (
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-6 text-center">
                {isEdit ? 'Edit Folder' : 'New Folder'}
            </h3>
            
            <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Midterm Prep"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white focus:border-indigo-500 outline-none mb-6 text-lg text-center"
                autoFocus
            />

            <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3 text-center">Select Theme Color</span>
                <div className="flex justify-center gap-3">
                    {Object.keys(FOLDER_COLORS).map(c => (
                        <button 
                            key={c} 
                            onClick={(e) => { e.preventDefault(); setColor(c); }}
                            className={`w-8 h-8 rounded-full shadow-sm transition-all active:scale-90 ${FOLDER_COLORS[c].hex} ${color === c ? 'ring-4 ring-indigo-500/30 scale-110' : 'ring-2 ring-transparent opacity-70 hover:opacity-100'}`} 
                        />
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={(e) => { e.preventDefault(); onClose(); }} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Cancel</button>
                <button onClick={(e) => { e.preventDefault(); onSave(name, color); }} disabled={!name.trim()} className="flex-1 px-4 py-4 rounded-2xl font-black text-white bg-indigo-600 disabled:bg-indigo-400 active:scale-95 transition-all">Save</button>
            </div>
        </div>
    );
}
