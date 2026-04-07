// src/components/StudyEngines.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, ChevronRight, Star, Paperclip, Music, 
    ArrowUp, X, Puzzle, Flame, CheckCircle2, XCircle, Zap 
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

const SUBJECT_ORDER = ['1s', '2s', '3s', '1p', '2p', '3p'];

// 🔥 THE RTL AUTO-DETECTOR
// Scans for Arabic, Hebrew, Farsi, and Urdu Unicode blocks
const isTextRTL = (text?: string) => {
    if (!text) return false;
    return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
};

export function StudyModePlayer({ setParentCardStats, user, deckCards, userData, onToggleStar, deckId, initialSrbData, onFinish }: any) {
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
            <div className="mb-8 shrink-0 pt-safe-4">
                <div className="flex justify-between text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 transition-colors">
                    <span>Target {currentIndex + 1}</span>
                    <span>{deckCards.length} Total</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner transition-colors">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 ease-out rounded-full" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div key={currentIndex} className={`flex-1 relative flex items-center justify-center perspective-[2000px] mb-8 ${animationClass}`}>
                <div 
                    onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                    onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                    className={`relative w-full aspect-[3/4] max-h-[500px] cursor-grab active:cursor-grabbing touch-none ${startX === null ? 'transition-transform duration-500' : ''}`}
                    style={{ 
                        transform: `translateX(${dragX}px) translateY(${dragY * 0.4}px) rotate(${dragX * 0.05}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <div className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out" style={{ transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)', transformStyle: 'preserve-3d' }}>
                        
                        {/* FRONT FACE */}
                        <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-[3rem] border-2 border-b-[10px] border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-8 text-center overflow-hidden transition-colors" style={{ backfaceVisibility: 'hidden' }}>
                            
                            {onToggleStar && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleStar(currentCard.id, isStarred); }} 
                                    className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-30 backdrop-blur-sm"
                                >
                                    <Star size={24} className={isStarred ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-slate-500"} />
                                </button>
                            )}

                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute top-8 left-8 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-sm z-20">Front</span>
                            
                            {currentCard.imageUrl && (
                                <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none z-0">
                                    <img src={currentCard.imageUrl} className="w-full h-full object-cover blur-2xl" alt="" />
                                </div>
                            )}

                            <h2 dir={isTextRTL(currentCard.front) ? 'rtl' : 'ltr'} className="text-4xl md:text-5xl font-black text-white leading-tight relative z-10 w-full px-4 break-words overflow-hidden drop-shadow-lg">
                                {currentCard.front}
                            </h2>                            
                            
                            {currentCard.ipa && (
                                <p className="text-base font-bold text-indigo-300 mt-6 px-4 py-2 bg-black/20 rounded-xl relative z-10 font-mono shadow-inner border border-white/5" style={{ direction: 'ltr' }}>
                                    {currentCard.ipa}
                                </p>
                            )}

                            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-80 z-10">
                                <ArrowUp size={20} strokeWidth={3} className="animate-bounce" /> 
                                <span>Slide up to flip</span>
                            </div>
                        </div>

                        {/* BACK FACE */}
                        <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-b-[10px] border-slate-200 dark:border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:shadow-none flex flex-col overflow-hidden transition-colors" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                            {currentCard.conjugations && (
                                <button onClick={(e) => { e.stopPropagation(); setShowConjugations(true); }} className="absolute top-6 right-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:scale-105 active:scale-95 transition-all z-30">
                                    <Paperclip size={20} strokeWidth={3} />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                                </button>
                            )}
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto custom-scrollbar relative z-10 pb-20">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest absolute top-8 left-8 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20">Back</span>
                                
                                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 mt-8 shadow-sm">{currentCard.type}</span>
                                
                                <h2 dir={isTextRTL(currentCard.back) ? 'rtl' : 'ltr'} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                                    {currentCard.back}
                                </h2>
                                
                                {currentCard.imageUrl && (
                                    <div className="w-full aspect-video rounded-[1.5rem] overflow-hidden mb-6 border-4 border-slate-50 dark:border-slate-800 shadow-md shrink-0 bg-slate-100 dark:bg-slate-900">
                                        <img src={currentCard.imageUrl} className="w-full h-full object-cover" alt="Context" />
                                    </div>
                                )}

                                {currentCard.audioUrl && (
                                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl flex items-center gap-3 border border-slate-200 dark:border-slate-700 shrink-0 mb-6 shadow-sm">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"><Music size={18} /></div>
                                        <audio src={currentCard.audioUrl} controls className="h-10 w-full opacity-80" />
                                    </div>
                                )}

                                {currentCard.morphology && (
                                    <div className="flex flex-wrap justify-center gap-2 mt-2 pb-8">
                                        {currentCard.morphology.map((m: any, i: number) => (
                                            <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm text-[10px] uppercase tracking-wider transition-colors">
                                                <span dir={isTextRTL(m.part) ? 'rtl' : 'ltr'} className="font-black text-indigo-600 dark:text-indigo-400 mr-1.5">{m.part}</span>
                                                <span dir={isTextRTL(m.meaning) ? 'rtl' : 'ltr'} className="font-bold text-slate-500 dark:text-slate-400">{m.meaning}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 pointer-events-none bg-gradient-to-t from-white via-white/95 dark:from-slate-900 dark:via-slate-900/95 to-transparent pt-10 pb-2">
                                <ArrowUp size={20} strokeWidth={3} className="animate-bounce" /> 
                                <span>Rate Target</span>
                            </div>
                        </div>
                    </div>

                    {/* CONJUGATION OVERLAY */}
                    {showConjugations && currentCard.conjugations && (
                        <div className="absolute inset-0 z-40 bg-white/95 dark:bg-slate-900/95 rounded-[3rem] p-8 flex flex-col animate-in slide-in-from-bottom-12 duration-300 backdrop-blur-xl border-4 border-indigo-500/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm"><Paperclip size={20} strokeWidth={3} /></div>
                                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Conjugation</span>
                                </div>
                                <button onClick={() => setShowConjugations(false)} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <X size={20} className="text-slate-500" strokeWidth={3} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-8 pr-2">
                                {Object.entries(currentCard.conjugations).map(([tense, forms]: any) => (
                                    <div key={tense} className="space-y-3">
                                        <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-lg w-fit border border-indigo-100 dark:border-indigo-500/20 shadow-sm">{tense}</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SUBJECT_ORDER.map((person) => {
                                                const verb = forms[person];
                                                if (!verb) return null;
                                                return (
                                                    <div key={person} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{person}</span>
                                                        <span dir={isTextRTL(verb) ? 'rtl' : 'ltr'} className="text-base font-bold text-slate-800 dark:text-white truncate">{verb}</span>
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

            {/* SRB INTERFACE */}
            <div className="shrink-0 z-10 w-full mb-safe-4 min-h-[80px]">
                {!isFlipped ? (
                    <div className="flex items-center justify-between px-2 animate-in fade-in duration-300">
                        <button onClick={(e) => { e.stopPropagation(); setSlideDirection('left'); setCurrentIndex(i => i - 1); }} disabled={currentIndex === 0} className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-lg border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all active:scale-95 touch-manipulation">
                            <ChevronLeft size={28} strokeWidth={3} className="-ml-1" />
                        </button>
                        <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">Tap card to review</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSlideDirection('right'); setCurrentIndex(i => i + 1); }} disabled={currentIndex === deckCards.length - 1} className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-lg border border-slate-100 dark:border-slate-800 disabled:opacity-30 transition-all active:scale-95 touch-manipulation">
                            <ChevronRight size={28} strokeWidth={3} className="ml-1" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4 px-2 animate-in slide-in-from-bottom-8 fade-in duration-300">
                        <button onClick={() => handleRateCard('again')} className="flex flex-col items-center justify-center p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border-2 border-b-[6px] border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/50 text-rose-600 dark:text-rose-400 shadow-sm active:scale-95 active:translate-y-1 active:border-b-2 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{getIntervalLabel('again')}</span>
                            <span className="font-black text-sm md:text-base uppercase tracking-widest">Again</span>
                        </button>
                        <button onClick={() => handleRateCard('good')} className="flex flex-col items-center justify-center p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border-2 border-b-[6px] border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 active:translate-y-1 active:border-b-2 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{getIntervalLabel('good')}</span>
                            <span className="font-black text-sm md:text-base uppercase tracking-widest">Good</span>
                        </button>
                        <button onClick={() => handleRateCard('easy')} className="flex flex-col items-center justify-center p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border-2 border-b-[6px] border-sky-200 dark:border-sky-500/30 hover:border-sky-300 dark:hover:border-sky-500/50 text-sky-600 dark:text-sky-400 shadow-sm active:scale-95 active:translate-y-1 active:border-b-2 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{getIntervalLabel('easy')}</span>
                            <span className="font-black text-sm md:text-base uppercase tracking-widest">Easy</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MatchingGame({ deckCards, onGameEnd }: any) {
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

    if(cards.length === 0) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-900 rounded-[2rem] m-6 border border-slate-200 dark:border-slate-800">Not enough cards to play.</div>;

    return (
        <div className="flex flex-col h-full p-6 max-w-md mx-auto w-full transition-colors pb-safe-8">
            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl shadow-sm">
                        <Puzzle size={20} />
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Speed Match</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Moves</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{moves}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                {cards.map((card, i) => {
                    const isFlipped = flipped.includes(i);
                    const isSolved = solved.includes(i);
                    return (
                        <button 
                            key={i} 
                            onClick={() => handleCardClick(i)} 
                            disabled={isSolved} 
                            dir={isTextRTL(card.text) ? 'rtl' : 'ltr'} 
                            className={`relative aspect-square rounded-[1.5rem] text-sm font-bold flex items-center justify-center p-3 text-center transition-all duration-300 transform border-2 ${
                                isSolved 
                                    ? 'opacity-0 scale-75 border-transparent' 
                                    : isFlipped 
                                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl scale-105' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border-b-[6px] active:translate-y-1 active:border-b-2'
                            }`}
                        >
                            {isFlipped ? <span className="line-clamp-4">{card.text}</span> : <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl"><Puzzle size={24} className="text-slate-300 dark:text-slate-600 opacity-50" /></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function QuizSessionView({ deckCards, onGameEnd }: any) {
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
        <div className="flex flex-col h-full max-w-md mx-auto p-6 transition-colors pb-safe-8">
            <div className="mb-8 flex items-center gap-4 px-2">
                <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className={`flex items-center justify-center gap-1.5 font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm ${streak >= 3 ? 'text-orange-500 border-orange-200 dark:border-orange-500/30' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Flame size={18} fill={streak >= 3 ? "currentColor" : "none"} className={streak >= 3 ? 'animate-pulse' : ''} /> {streak}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center justify-center text-center min-h-[240px] mb-8 relative animate-in slide-in-from-right-8" key={index}>
                {selectedOption && (
                    <div className="absolute -top-5 right-6 z-20">
                        {selectedOption === currentCard.back 
                            ? <div className="bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-xl animate-bounce"><CheckCircle2 size={48} className="text-emerald-500" fill="currentColor" /></div> 
                            : <div className="bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-xl"><XCircle size={48} className="text-rose-500" fill="currentColor" /></div>
                        }
                    </div>
                )}
                
                {currentCard.imageUrl && (
                    <div className="w-full h-32 rounded-2xl overflow-hidden mb-6 opacity-90 border-4 border-slate-50 dark:border-slate-800 shadow-inner">
                        <img src={currentCard.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                )}

                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm">Translate</span>
                
                {/* 🔥 RTL-ENABLED QUIZ FRONT */}
                <h2 dir={isTextRTL(currentCard.front) ? 'rtl' : 'ltr'} className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">
                    {currentCard.front}
                </h2>
            </div>

            <div className="space-y-4 flex-1">
                {options.map((opt, idx) => {
                    let btnClass = "bg-white dark:bg-slate-900 border-2 border-b-[8px] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:translate-y-[6px] active:border-b-2 shadow-sm"; 
                    if (selectedOption) {
                        if (opt === currentCard.back) btnClass = "bg-emerald-50 dark:bg-emerald-500/10 border-2 border-b-[8px] border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 shadow-md";
                        else if (opt === selectedOption) btnClass = "bg-rose-50 dark:bg-rose-500/10 border-2 border-b-2 border-rose-400 dark:border-rose-500/50 text-rose-700 dark:text-rose-400 translate-y-[6px]";
                        else btnClass = "opacity-30 border-slate-200 dark:border-slate-800 translate-y-[6px] border-b-2";
                    }
                    return (
                        <button 
                            key={idx} 
                            dir={isTextRTL(opt) ? 'rtl' : 'ltr'} 
                            onClick={() => handleOptionClick(opt)} 
                            disabled={isProcessing} 
                            className={`w-full p-5 rounded-[2rem] font-black text-lg transition-all duration-200 ${btnClass}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
