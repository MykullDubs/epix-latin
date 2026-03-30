// src/components/StudyEngines.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, ChevronRight, Star, Paperclip, Music, 
    ArrowUp, X, Puzzle, Flame, CheckCircle2, XCircle 
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

                            {/* 🔥 RTL-ENABLED FRONT */}
                            <h2 dir={isTextRTL(currentCard.front) ? 'rtl' : 'ltr'} className="text-4xl md:text-5xl font-black text-white leading-tight relative z-10 w-full px-4 break-words overflow-hidden">
                                {currentCard.front}
                            </h2>                            
                            
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
                                
                                {/* 🔥 RTL-ENABLED BACK */}
                                <h2 dir={isTextRTL(currentCard.back) ? 'rtl' : 'ltr'} className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
                                    {currentCard.back}
                                </h2>
                                
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
                                                <span dir={isTextRTL(m.part) ? 'rtl' : 'ltr'} className="font-black text-indigo-600 mr-1">{m.part}</span>
                                                <span dir={isTextRTL(m.meaning) ? 'rtl' : 'ltr'} className="font-bold text-slate-500">{m.meaning}</span>
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
                                                        {/* 🔥 RTL-ENABLED VERBS */}
                                                        <span dir={isTextRTL(verb) ? 'rtl' : 'ltr'} className="text-sm font-bold text-slate-700 dark:text-slate-200">{verb}</span>
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
                        <button 
                            key={i} 
                            onClick={() => handleCardClick(i)} 
                            disabled={isSolved} 
                            dir={isTextRTL(card.text) ? 'rtl' : 'ltr'} 
                            className={`relative aspect-square rounded-2xl text-sm font-bold flex items-center justify-center p-2 text-center transition-all duration-300 transform ${isSolved ? 'opacity-0 scale-75' : isFlipped ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-[3px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-[0_4px_0_rgb(226,232,240)] dark:shadow-[0_4px_0_rgb(51,65,85)] active:translate-y-1 active:shadow-none'}`}
                        >
                            {isFlipped ? card.text : <Puzzle size={24} className="text-slate-300 dark:text-slate-600 opacity-50" />}
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
                
                {/* 🔥 RTL-ENABLED QUIZ FRONT */}
                <h2 dir={isTextRTL(currentCard.front) ? 'rtl' : 'ltr'} className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">
                    {currentCard.front}
                </h2>
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
                        <button 
                            key={idx} 
                            dir={isTextRTL(opt) ? 'rtl' : 'ltr'} 
                            onClick={() => handleOptionClick(opt)} 
                            disabled={isProcessing} 
                            className={`w-full p-4 rounded-2xl font-black text-lg transition-all ${btnClass}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
