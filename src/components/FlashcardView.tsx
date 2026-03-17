// src/components/FlashcardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, X, Library, Layers, Play, Zap, HelpCircle, Puzzle, Flame, CheckCircle2, XCircle, Globe, Users, Filter, ChevronLeft, ChevronRight, RotateCw, ArrowUp } from 'lucide-react';
import { Toast } from './Toast'; // Ensure this path matches your project structure!

// ============================================================================
//  1. STUDY MODE (Swipe Physics & Animations)
// ============================================================================
function StudyModePlayer({ deckCards }: any) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Swipe Physics & Animation State
    const [startX, setStartX] = useState<number | null>(null);
    const [startY, setStartY] = useState<number | null>(null);
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'right' | 'left' | 'up'>('right');

    const currentCard = deckCards[currentIndex];

    // --- Handlers ---
    const handleNext = (e?: any) => {
        e?.stopPropagation();
        if (currentIndex < deckCards.length - 1) {
            setSlideDirection('right');
            setCurrentIndex(i => i + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = (e?: any) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setSlideDirection('left');
            setCurrentIndex(i => i - 1);
            setIsFlipped(false);
        }
    };

    // --- Touch/Mouse Physics ---
    const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setStartX(clientX);
        setStartY(clientY);
        setDragX(0);
        setDragY(0);
    };

    const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (startX === null || startY === null) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const currentDragX = clientX - startX;
        const currentDragY = clientY - startY;
        
        // Add horizontal resistance on edges
        if ((currentIndex === 0 && currentDragX > 0) || (currentIndex === deckCards.length - 1 && currentDragX < 0)) {
            setDragX(currentDragX * 0.2); 
        } else {
            setDragX(currentDragX);
        }

        // Only track upward drag for the visual flip effect, prevent dragging it down
        setDragY(currentDragY < 0 ? currentDragY : 0);
    };

    const handlePointerUp = () => {
        if (startX === null || startY === null) return;
        
        const SWIPE_THRESHOLD_X = 75; // Pixels required to trigger next/prev
        const SWIPE_THRESHOLD_Y = -60; // Pixels required to trigger a flip (negative is up)
        
        if (dragX > SWIPE_THRESHOLD_X && currentIndex > 0) {
            handlePrev();
        } else if (dragX < -SWIPE_THRESHOLD_X && currentIndex < deckCards.length - 1) {
            handleNext();
        } else if (dragY < SWIPE_THRESHOLD_Y) {
            // They swiped up! Trigger the flip
            setIsFlipped(!isFlipped);
        } else if (Math.abs(dragX) < 10 && Math.abs(dragY) < 10) {
            // Keep tap as a fallback just in case
            setIsFlipped(!isFlipped);
        }
        
        // Reset physics
        setStartX(null);
        setStartY(null);
        setDragX(0);
        setDragY(0);
    };

    if (!currentCard) return null;

    const progress = ((currentIndex + 1) / deckCards.length) * 100;

    // Dynamic animation class based on which way we are going
    const animationClass = slideDirection === 'right' 
        ? 'animate-in fade-in slide-in-from-right-12 duration-300' 
        : 'animate-in fade-in slide-in-from-left-12 duration-300';

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-6 w-full overflow-hidden">
            {/* Header & Progress */}
            <div className="mb-8 shrink-0">
                <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    <span>Target {currentIndex + 1}</span>
                    <span>{deckCards.length} Total</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* The Draggable Card Container */}
            <div key={currentIndex} className={`flex-1 relative flex items-center justify-center perspective-[1000px] mb-8 ${animationClass}`}>
                <div 
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    className={`relative w-full aspect-square max-h-[400px] cursor-grab active:cursor-grabbing ${startX === null ? 'transition-all duration-300' : ''}`}
                    style={{ 
                        transform: `translateX(${dragX}px) translateY(${dragY * 0.4}px) rotate(${dragX * 0.05}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* The Flipping Inner Card */}
                    <div 
                        className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out"
                        style={{ 
                            transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                            transformStyle: 'preserve-3d' 
                        }}
                    >
                        {/* FRONT FACE */}
                        <div 
                            className="absolute inset-0 w-full h-full bg-white rounded-[3rem] border-2 border-b-[8px] border-slate-200 shadow-xl flex flex-col items-center justify-center p-8 text-center"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest absolute top-6 bg-indigo-50 px-3 py-1 rounded-full">Front</span>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">{currentCard.front}</h2>
                            {currentCard.ipa && <p className="text-sm font-bold text-slate-400 mt-4 bg-slate-50 px-3 py-1 rounded-lg">{currentCard.ipa}</p>}
                            
                            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-60">
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> 
                                Slide up to flip
                            </div>
                        </div>

                        {/* BACK FACE */}
                        <div 
                            className="absolute inset-0 w-full h-full bg-indigo-50 rounded-[3rem] border-2 border-b-[8px] border-indigo-200 shadow-xl flex flex-col items-center justify-center p-8 text-center"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                        >
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute top-6 bg-white px-3 py-1 rounded-full shadow-sm">Back</span>
                            
                            <h2 className="text-3xl md:text-4xl font-black text-indigo-900 leading-tight">{currentCard.back}</h2>
                            
                            {currentCard.morphology && currentCard.morphology.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 mt-6">
                                    {currentCard.morphology.map((m: any, i: number) => (
                                        <div key={i} className="bg-white border border-indigo-100 px-3 py-1.5 rounded-xl shadow-sm text-[10px] uppercase tracking-wider">
                                            <span className="font-black text-indigo-600 mr-1">{m.part}</span>
                                            <span className="font-bold text-slate-400">{m.meaning}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> 
                                Slide up to return
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop / Manual Navigation Buttons */}
            <div className="flex items-center justify-between px-4 pb-8 shrink-0 z-10">
                <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-md border border-slate-100 disabled:opacity-30 disabled:shadow-none hover:bg-slate-50 hover:text-indigo-600 transition-colors active:scale-95"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>
                
                <div className="flex gap-1.5">
                    {deckCards.slice(0, 5).map((_: any, idx: number) => {
                        const activeDot = Math.floor((currentIndex / deckCards.length) * Math.min(5, deckCards.length));
                        return (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeDot ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-200'}`} />
                        );
                    })}
                </div>
                
                <button 
                    onClick={handleNext}
                    disabled={currentIndex === deckCards.length - 1}
                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-md border border-slate-100 disabled:opacity-30 disabled:shadow-none hover:bg-slate-50 hover:text-indigo-600 transition-colors active:scale-95"
                >
                    <ChevronRight size={24} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
//  2. MATCHING GAME
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
                setTimeout(() => {
                    setFlipped([]);
                    setIsLocked(false);
                }, 1000);
            }
        }
    };

    if(cards.length === 0) return <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">Not enough cards.</div>;

    return (
        <div className="flex flex-col h-full p-4 max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Speed Match</span>
                <span className="text-sm font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Moves: {moves}</span>
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
                            className={`relative aspect-square rounded-2xl text-sm md:text-base font-bold flex items-center justify-center p-2 text-center transition-all duration-300 transform ${
                                isSolved ? 'opacity-0 scale-75 pointer-events-none' : 
                                isFlipped ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 
                                'bg-white border-[3px] border-slate-200 text-slate-600 hover:border-indigo-300 hover:-translate-y-1 shadow-[0_4px_0_rgb(226,232,240)] active:shadow-none active:translate-y-1'
                            }`}
                        >
                            {isFlipped ? card.text : <Puzzle size={24} className="text-slate-300 opacity-50" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
//  3. QUIZ SESSION 
// ============================================================================
function QuizSessionView({ deckCards, onGameEnd }: any) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const currentCard = deckCards[index];

    const options = useMemo(() => {
        if (!currentCard) return [];
        const distractors = deckCards
            .filter((c: any) => c.id !== currentCard.id && c.back !== currentCard.back)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map((c: any) => c.back);
        
        return [...distractors, currentCard.back].sort(() => 0.5 - Math.random());
    }, [currentCard, deckCards]);

    const handleOptionClick = (option: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setSelectedOption(option);

        const isCorrect = option === currentCard.back;
        
        if (isCorrect) {
            setScore(s => s + 1);
            setStreak(s => s + 1);
        } else {
            setStreak(0);
        }

        setTimeout(() => {
            if (index < deckCards.length - 1) {
                setIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsProcessing(false);
            } else {
                const finalScore = isCorrect ? score + 1 : score;
                onGameEnd({ score: finalScore, total: deckCards.length });
            }
        }, 1200);
    };

    if (!currentCard) return null;

    const progress = ((index) / deckCards.length) * 100;

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-6">
            <div className="mb-6 flex items-center gap-4">
                <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 font-black text-sm transition-colors ${streak >= 3 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}>
                    <Flame size={18} fill={streak >= 3 ? "currentColor" : "none"} /> {streak}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-100 p-8 flex flex-col items-center justify-center text-center min-h-[220px] mb-8 relative animate-in slide-in-from-right-8 duration-300" key={index}>
                {selectedOption && (
                    <div className="absolute -top-4 right-4">
                        {selectedOption === currentCard.back 
                            ? <CheckCircle2 size={40} className="text-emerald-500 bg-white rounded-full shadow-lg animate-bounce" fill="white" /> 
                            : <XCircle size={40} className="text-rose-500 bg-white rounded-full shadow-lg" fill="white" />
                        }
                    </div>
                )}
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 bg-indigo-50 px-3 py-1 rounded-full">Translate</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">{currentCard.front}</h2>
                {currentCard.ipa && <p className="text-sm font-bold text-slate-400 mt-4 bg-slate-50 px-3 py-1 rounded-lg">{currentCard.ipa}</p>}
            </div>

            <div className="space-y-3 flex-1">
                {options.map((opt, idx) => {
                    let btnClass = "bg-white border-2 border-b-[6px] border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-b-[6px] hover:border-indigo-200 active:border-b-2 active:translate-y-[4px]"; 
                    
                    if (selectedOption) {
                        if (opt === currentCard.back) {
                            btnClass = "bg-emerald-50 border-2 border-b-[6px] border-emerald-500 text-emerald-600 shadow-emerald-100"; 
                        } else if (opt === selectedOption) {
                            btnClass = "bg-rose-50 border-2 border-b-2 border-rose-500 text-rose-600 translate-y-[4px] opacity-70"; 
                        } else {
                            btnClass = "bg-white border-2 border-b-2 border-slate-100 text-slate-300 translate-y-[4px] opacity-40"; 
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(opt)}
                            disabled={isProcessing}
                            className={`w-full p-4 rounded-2xl font-black text-lg transition-all duration-150 ${btnClass}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
//  4. MAIN STUDY HUB
// ============================================================================
export default function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onSaveCard, activeDeckOverride, onComplete, onLogActivity, userData, user, onDeleteDeck }: any) {
    const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing'>('library');
    const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
    
    const [deckFilter, setDeckFilter] = useState<'all' | 'personal' | 'network'>('all');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    const resolvedDeck = activeDeckOverride || allDecks[selectedDeckKey] || Object.values(allDecks)[0];
    const cards = resolvedDeck?.cards || [];
    const deckTitle = resolvedDeck?.title === "✍️ Scriptorium" ? "My Collection" : resolvedDeck?.title;

    useEffect(() => {
        if (activeDeckOverride) setInternalMode('menu');
    }, [activeDeckOverride]);

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

    const handleGameFinish = (scorePct: number) => {
        const baseMultiplier = activeGame === 'quiz' ? 10 : activeGame === 'match' ? 15 : 5;
        const maxPotentialXP = cards.length * baseMultiplier;
        const earnedXP = Math.round(maxPotentialXP * (scorePct / 100)); 
        
        onLogActivity(resolvedDeck.id || 'custom', earnedXP, `${deckTitle} (${activeGame})`, { scorePct, mode: activeGame });
        
        setInternalMode('menu');
        setToastMsg(`Practice Complete! Accuracy: ${Math.round(scorePct)}% | +${earnedXP} XP Earned!`);
    };

    // --- 1. LIBRARY VIEW ---
    if (internalMode === 'library') {
        const totalCards = Object.values(allDecks).reduce((acc: number, curr: any) => acc + (curr.cards?.length || 0), 0);

        const filteredDecks = Object.entries(allDecks).filter(([key, deck]: any) => {
            if (deckFilter === 'all') return true;
            if (deckFilter === 'personal') return !deck.isPublished;
            if (deckFilter === 'network') return deck.isPublished;
            return true;
        });

        return (
            <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white p-2 rounded-xl shadow-md">
                            <Library size={20} strokeWidth={3}/>
                        </div>
                        <span className="font-black text-slate-800 tracking-tighter text-xl uppercase">Study Hub</span>
                    </div>
                    <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest">{totalCards} Cards</div>
                </div>

                <div className="bg-white/60 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center gap-2 overflow-x-auto custom-scrollbar sticky top-[76px] z-30">
                    <Filter size={14} className="text-slate-400 shrink-0 mr-2" />
                    <button 
                        onClick={() => setDeckFilter('all')} 
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${deckFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        All Decks
                    </button>
                    <button 
                        onClick={() => setDeckFilter('personal')} 
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${deckFilter === 'personal' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        My Library
                    </button>
                    <button 
                        onClick={() => setDeckFilter('network')} 
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${deckFilter === 'network' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        Network Decks
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar pb-32 relative z-10">
                    {filteredDecks.length === 0 ? (
                        <div className="text-center p-10 text-slate-400 animate-in fade-in">
                            <Layers size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest text-xs">No decks found in this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-500">
                            {filteredDecks.map(([key, deck]: any) => {
                                const dTitle = deck.title === "✍️ Scriptorium" ? "My Collection" : deck.title;
                                const cardCount = deck.cards?.length || 0;
                                const mastery = Math.floor(Math.random() * 100); 
                                
                                return (
                                    <button 
                                        key={key} 
                                        onClick={() => { onSelectDeck(key); setInternalMode('menu'); }}
                                        className="group relative bg-white rounded-[2rem] p-6 shadow-sm border-[3px] border-slate-100 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-sm transition-all duration-300 text-left overflow-hidden w-full"
                                    >
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-rose-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-orange-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0">
                                                    {deck.icon || <Layers size={28}/>}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-800 text-xl leading-tight group-hover:text-orange-600 transition-colors line-clamp-1">{dTitle}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{cardCount} Cards</span>
                                                        
                                                        {deck.isPublished && deck.visibility === 'public' && (
                                                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-100">
                                                                <Globe size={10}/> Global
                                                            </span>
                                                        )}
                                                        {deck.isPublished && deck.visibility === 'restricted' && (
                                                            <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 border border-indigo-100">
                                                                <Users size={10}/> Cohort
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-orange-50 w-10 h-10 rounded-full flex items-center justify-center text-orange-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 shrink-0">
                                                <Play size={18} fill="currentColor" className="ml-1"/>
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-6">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                                                <span>Mastery</span>
                                                <span className="text-orange-500">{mastery}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div className="h-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-1000" style={{ width: `${mastery}%` }}></div>
                                            </div>
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

    // --- 2. THE MENU VIEW ---
    if (internalMode === 'menu') {
        if (!resolvedDeck) return <div className="p-8 text-center text-slate-400 font-bold uppercase animate-pulse">Loading Deck Data...</div>;

        return (
            <div className="h-full flex flex-col bg-slate-50 animate-in slide-in-from-right-8 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                {/* 🔥 The newly implemented Toast! */}
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

                <div className="px-6 pt-8 pb-4 relative z-10">
                    <button onClick={handleBack} className="flex items-center text-slate-400 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-fit active:scale-95">
                        <ArrowLeft size={16} className="mr-2"/> Back
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{deckTitle}</h1>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-indigo-500 text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">
                            {cards.length} Configured Targets
                        </span>
                        {resolvedDeck.isPublished && resolvedDeck.visibility === 'public' && (
                            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1">
                                <Globe size={12}/> Global Network
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-32 relative z-10">
                    {cards.length < 4 ? (
                        <div className="text-center py-16 border-4 border-dashed border-slate-200 rounded-[3rem] bg-white">
                            <Layers size={64} className="text-slate-200 mx-auto mb-4"/>
                            <h3 className="font-black text-2xl text-slate-400">Not Enough Targets</h3>
                            <p className="text-sm font-bold text-slate-400 mt-2 mb-8 max-w-[200px] mx-auto">You need at least 4 cards to unlock the practice modules.</p>
                            {(!resolvedDeck.id || resolvedDeck.id === 'custom') && (
                                <button onClick={() => alert("Go to Studio tab to add cards!")} className="px-8 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-600">
                                    Open Studio Config
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" fill="currentColor"/> Select Practice Mode
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => launchGame('standard')} className="bg-white p-6 rounded-[2.5rem] border-[3px] border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 active:translate-y-0 transition-all group text-left">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform"><Layers size={28}/></div>
                                    <h4 className="font-black text-slate-800 text-xl leading-none mb-2">Review</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Standard Mode</p>
                                </button>
                                
                                <button onClick={() => launchGame('quiz')} className="bg-white p-6 rounded-[2.5rem] border-[3px] border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 active:translate-y-0 transition-all group text-left">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform"><HelpCircle size={28}/></div>
                                    <h4 className="font-black text-slate-800 text-xl leading-none mb-2">Quiz</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Multiple Choice</p>
                                </button>
                                
                                <button onClick={() => launchGame('match')} className="bg-white p-6 rounded-[2.5rem] border-[3px] border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 active:translate-y-0 transition-all group text-left">
                                    <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform"><Puzzle size={28}/></div>
                                    <h4 className="font-black text-slate-800 text-xl leading-none mb-2">Match</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Speed Pairs</p>
                                </button>
                                
                                <button onClick={() => launchGame('tower')} className="bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-800 shadow-xl hover:shadow-2xl hover:border-orange-500 hover:-translate-y-1 active:translate-y-0 transition-all group text-left relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50"></div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-md border border-orange-500/30"><Flame size={28} fill="currentColor"/></div>
                                        <h4 className="font-black text-white text-xl leading-none mb-2">Tower</h4>
                                        <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Survival</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- 3. THE PLAYING VIEW ---
    return (
        <div className="h-full flex flex-col bg-slate-50 animate-in slide-in-from-bottom-8 duration-500 relative z-[100]">
            <div className="px-4 py-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm shrink-0">
                <button onClick={handleBack} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} strokeWidth={3}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-0.5">{activeGame === 'tower' ? 'Survival' : activeGame} Protocol</span>
                    <span className="text-sm font-black text-slate-900 line-clamp-1">{deckTitle}</span>
                </div>
                <div className="w-11"></div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeGame === 'standard' && <StudyModePlayer deckCards={cards} />}
                
                {activeGame === 'quiz' && <div className="h-full overflow-y-auto"><QuizSessionView deckCards={cards} onGameEnd={(res: any) => handleGameFinish(res.score ? (res.score/res.total)*100 : 0)} /></div>}
                {activeGame === 'match' && <div className="h-full overflow-y-auto pt-6"><MatchingGame deckCards={cards} onGameEnd={(scorePct: number) => handleGameFinish(scorePct)} /></div>}
                {activeGame === 'tower' && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-950">
                        <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-3xl flex items-center justify-center mb-6 animate-bounce-slow shadow-[0_0_50px_rgba(249,115,22,0.2)]">
                            <Flame size={48} className="text-orange-500" fill="currentColor"/>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-4">The Tower</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-10 max-w-[250px] leading-loose">This module is currently under construction.</p>
                        <button onClick={handleBack} className="px-10 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-slate-200 active:scale-95 transition-all shadow-xl">
                            Return to Hub
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
