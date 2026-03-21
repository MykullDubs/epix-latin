// src/components/FlashcardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, X, Library, Layers, Play, Zap, HelpCircle, Puzzle, Flame, 
    CheckCircle2, XCircle, Globe, Users, Filter, ChevronLeft, ChevronRight, 
    RotateCw, ArrowUp, Paperclip, Music, Star, Archive, Plus, Save, Loader2,
    MoreVertical, FolderPlus, Trash2, FolderOpen, Folder // 🔥 Added Context Menu Icons
} from 'lucide-react';
import { Toast } from './Toast'; 

const SUBJECT_ORDER = ['1s', '2s', '3s', '1p', '2p', '3p'];

// ============================================================================
//  0. STUDENT CARD BUILDER (The New "Study Cards" Forge)
// ============================================================================
function StudentCardBuilder({ onSave, onCancel }: any) {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!front.trim() || !back.trim()) return;
        setIsSaving(true);
        await onSave({ 
            front: front.trim(), 
            back: back.trim(), 
            deckId: 'custom', 
            deckTitle: 'My Study Cards',
            type: 'note',
            ipa: '', // Students don't need to worry about IPA by default
            morphology: [{ part: front.trim(), meaning: 'Root', type: 'root' }],
            grammar_tags: ['Student Note']
        });
        setIsSaving(false);
        onCancel(true); // true indicates a successful save for the toast message
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 absolute inset-0 z-[200] animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-6 pt-8 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button onClick={() => onCancel(false)} className="flex items-center text-slate-400 hover:text-rose-500 mb-6 text-xs font-black uppercase tracking-widest transition-colors bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full w-fit active:scale-95">
                    <ArrowLeft size={16} className="mr-2"/> Cancel
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">New Study Card</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Front (Target Concept)</label>
                        <input 
                            value={front} 
                            onChange={(e) => setFront(e.target.value)} 
                            placeholder="e.g., Mitosis" 
                            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors"
                            autoFocus
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
                    disabled={!front.trim() || !back.trim() || isSaving}
                    className="w-full bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                    {isSaving ? 'Forging...' : 'Save Card to Deck'}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
//  1. STUDY MODE (Swipe Physics, Flipping, Conjugations, & Stars)
// ============================================================================
function StudyModePlayer({ deckCards, userData, onToggleStar }: any) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showConjugations, setShowConjugations] = useState(false); 
    
    // Swipe Physics State
    const [startX, setStartX] = useState<number | null>(null);
    const [startY, setStartY] = useState<number | null>(null);
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'right' | 'left' | 'up'>('right');

    const currentCard = deckCards[currentIndex];

    // 🔥 Check if the current card is starred in the student's preferences
    const isStarred = userData?.cardPrefs?.[currentCard?.id]?.starred || false;

    useEffect(() => {
        setShowConjugations(false);
        setIsFlipped(false);
    }, [currentIndex]);

    const handleNext = (e?: any) => {
        e?.stopPropagation();
        if (currentIndex < deckCards.length - 1) {
            setSlideDirection('right');
            setCurrentIndex(i => i + 1);
        }
    };

    const handlePrev = (e?: any) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setSlideDirection('left');
            setCurrentIndex(i => i - 1);
        }
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
        
        if (dragX > SWIPE_THRESHOLD_X && currentIndex > 0) {
            handlePrev();
        } else if (dragX < -SWIPE_THRESHOLD_X && currentIndex < deckCards.length - 1) {
            handleNext();
        } else if (dragY < SWIPE_THRESHOLD_Y || (Math.abs(dragX) < 10 && Math.abs(dragY) < 10)) {
            setIsFlipped(!isFlipped);
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
        <div className="flex flex-col h-full max-w-md mx-auto p-6 w-full overflow-hidden transition-colors duration-300">
            <div className="mb-8 shrink-0">
                <div className="flex justify-between text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 transition-colors">
                    <span>Target {currentIndex + 1}</span>
                    <span>{deckCards.length} Total</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner transition-colors">
                    <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div key={currentIndex} className={`flex-1 relative flex items-center justify-center perspective-[2000px] mb-8 ${animationClass}`}>
                <div 
                    onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                    onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                    className={`relative w-full aspect-[3/4] max-h-[450px] cursor-grab active:cursor-grabbing ${startX === null ? 'transition-transform duration-500' : ''}`}
                    style={{ 
                        transform: `translateX(${dragX}px) translateY(${dragY * 0.4}px) rotate(${dragX * 0.05}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <div className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out" style={{ transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)', transformStyle: 'preserve-3d' }}>
                        
                        {/* FRONT FACE */}
                        <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-[3rem] border-2 border-b-[8px] border-slate-800 shadow-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden transition-colors" style={{ backfaceVisibility: 'hidden' }}>
                            
                            {onToggleStar && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleStar(currentCard.id, isStarred); }} 
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors z-30"
                                >
                                    <Star size={24} className={isStarred ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-slate-600"} />
                                </button>
                            )}

                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest absolute top-6 left-6 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 shadow-sm z-20">Front</span>
                            
                            {currentCard.imageUrl && (
                                <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0">
                                    <img src={currentCard.imageUrl} className="w-full h-full object-cover blur-xl" alt="" />
                                </div>
                            )}

                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight relative z-10">{currentCard.front}</h2>
                            
                            {currentCard.ipa && (
                                <p className="text-sm font-bold text-indigo-400 mt-4 px-3 py-1 rounded-lg relative z-10" style={{ direction: 'ltr', fontFamily: 'Arial, sans-serif' }}>
                                    {currentCard.ipa}
                                </p>
                            )}

                            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-80 z-10">
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> Slide up to flip
                            </div>
                        </div>

                        {/* BACK FACE */}
                        <div className="absolute inset-0 w-full h-full bg-white rounded-[3rem] border-2 border-b-[8px] border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-colors" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                            {currentCard.conjugations && (
                                <button onClick={(e) => { e.stopPropagation(); setShowConjugations(true); }} className="absolute top-6 right-8 p-3 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 rounded-2xl shadow-lg border border-indigo-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all z-30">
                                    <Paperclip size={20} strokeWidth={3} />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
                                </button>
                            )}
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto custom-scrollbar relative z-10">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute top-6 left-6 bg-slate-50 px-3 py-1 rounded-full shadow-sm border border-slate-100">Back</span>
                                
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4 mt-4">{currentCard.type}</span>
                                
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">{currentCard.back}</h2>
                                
                                {currentCard.imageUrl && (
                                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 border-2 border-slate-50 shadow-inner shrink-0">
                                        <img src={currentCard.imageUrl} className="w-full h-full object-cover" alt="Context" />
                                    </div>
                                )}

                                {currentCard.audioUrl && (
                                    <div className="w-full bg-slate-50 p-2 rounded-xl flex items-center gap-3 border border-slate-200 shrink-0 mb-4">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0"><Music size={14} /></div>
                                        <audio src={currentCard.audioUrl} controls className="h-8 w-full opacity-80" />
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

                            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent pt-6 pb-2">
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> Slide up to return
                            </div>
                        </div>
                    </div>

                    {/* CONJUGATION OVERLAY */}
                    {showConjugations && currentCard.conjugations && (
                        <div className="absolute inset-0 z-40 bg-white/95 dark:bg-slate-900/95 rounded-[3rem] p-8 flex flex-col animate-in slide-in-from-bottom-12 duration-300 backdrop-blur-md border-2 border-indigo-500/30">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <Paperclip size={16} className="text-indigo-500" />
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Conjugation Table</span>
                                </div>
                                <button onClick={() => setShowConjugations(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                                {Object.entries(currentCard.conjugations).map(([tense, forms]: any) => (
                                    <div key={tense} className="space-y-2">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded w-fit">{tense}</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SUBJECT_ORDER.map((person) => {
                                                const verb = forms[person];
                                                if (!verb) return null;
                                                return (
                                                    <div key={person} className="flex flex-col p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">{person}</span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{verb}</span>
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

            <div className="flex items-center justify-between px-4 pb-8 shrink-0 z-10">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md border border-slate-100 dark:border-slate-700 disabled:opacity-30 transition-all active:scale-95">
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <div className="flex gap-1.5">
                    {[...Array(Math.min(5, deckCards.length))].map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === Math.floor((currentIndex / deckCards.length) * 5) ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                </div>
                <button onClick={handleNext} disabled={currentIndex === deckCards.length - 1} className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md border border-slate-100 dark:border-slate-700 disabled:opacity-30 transition-all active:scale-95">
                    <ChevronRight size={24} strokeWidth={3} />
                </button>
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
export default function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onLogActivity, userData, onSaveCard, onToggleStar, onToggleArchive, onCreateFolder, onAssignToFolder }: any) {
    const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing' | 'create'>('library');
    const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
    
    // 🔥 Deck filter is now a dynamic string to allow custom folder names
    const [deckFilter, setDeckFilter] = useState<string>('all');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    // Context Menu State
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [menuView, setMenuView] = useState<'main' | 'folders'>('main'); // Tracks nested menu state
    
    // Folder Creation Modal State
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    
    const resolvedDeck = allDecks[selectedDeckKey] || Object.values(allDecks)[0];
    const cards = resolvedDeck?.cards || [];
    const deckTitle = resolvedDeck?.id === 'custom' ? "My Study Cards" : resolvedDeck?.title;

    // 🔥 Grab custom folders from user profile
    const customFolders: string[] = userData?.studyFolders || [];

    const launchGame = (mode: 'standard' | 'quiz' | 'match' | 'tower') => {
        setActiveGame(mode);
        setInternalMode('playing');
    };

    const handleBack = () => {
        if (internalMode === 'playing') setInternalMode('menu');
        else if (internalMode === 'menu') { setInternalMode('library'); onSelectDeck(null); }
    };

    const handleGameFinish = (scorePct: number) => {
        const baseMultiplier = activeGame === 'quiz' ? 10 : activeGame === 'match' ? 15 : 5;
        const earnedXP = Math.round((cards.length * baseMultiplier) * (scorePct / 100)); 
        onLogActivity(resolvedDeck.id || 'custom', earnedXP, `${deckTitle} (${activeGame})`, { scorePct, mode: activeGame });
        setInternalMode('menu');
        setToastMsg(`Protocol Complete! +${earnedXP} XP Earned!`);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !onCreateFolder) return;
        await onCreateFolder(newFolderName.trim());
        setToastMsg(`Folder "${newFolderName.trim()}" created.`);
        setNewFolderName('');
        setShowFolderModal(false);
    };

    // --- STUDENT BUILDER OVERLAY ---
    if (internalMode === 'create') {
        return (
            <StudentCardBuilder 
                onSave={onSaveCard} 
                onCancel={(success?: boolean) => {
                    setInternalMode('library');
                    if (success) setToastMsg("Study Card secured. Good job.");
                }} 
            />
        );
    }

    if (internalMode === 'library') {
        const filteredDecks = Object.entries(allDecks).filter(([key, deck]: any) => {
            const isArchived = userData?.deckPrefs?.[key]?.archived || false;
            const currentFolder = userData?.deckPrefs?.[key]?.folder || null;
            
            if (deckFilter === 'archived') return isArchived;
            if (isArchived) return false; // Hide archived decks from all other views

            if (deckFilter === 'all') return true;
            if (deckFilter === 'personal') return !deck.isPublished;
            if (deckFilter === 'network') return deck.isPublished;
            
            // 🔥 Custom Folder Routing
            if (customFolders.includes(deckFilter)) {
                return currentFolder === deckFilter;
            }

            return true;
        });

        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                {/* 🔥 FOLDER CREATION MODAL */}
                {showFolderModal && (
                    <div className="fixed inset-0 z-[500] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
                            <h3 className="font-black text-xl text-slate-800 dark:text-white mb-4">New Folder</h3>
                            <input 
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="e.g., Midterm Prep"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white focus:border-indigo-500 outline-none mb-6"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowFolderModal(false)} className="flex-1 px-4 py-3 rounded-xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="flex-1 px-4 py-3 rounded-xl font-black text-white bg-indigo-600 disabled:bg-indigo-400 active:scale-95 transition-all">Create</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex justify-between items-center sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white p-2 rounded-xl"><Library size={20} strokeWidth={3}/></div>
                        <span className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-tighter">Study Hub</span>
                    </div>
                    <button onClick={() => setInternalMode('create')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-95 transition-all">
                        <Plus size={14} /> New Card
                    </button>
                </div>

                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center gap-2 overflow-x-auto custom-scrollbar sticky top-[76px] z-20">
                    <Filter size={14} className="text-slate-400 mr-2 shrink-0" />
                    
                    {/* Standard Filters */}
                    {['all', 'personal', 'network', 'archived'].map((f: any) => (
                        <button key={f} onClick={() => setDeckFilter(f)} className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${deckFilter === f ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
                            {f}
                        </button>
                    ))}
                    
                    {/* Custom Folders in Filter Bar */}
                    {customFolders.length > 0 && <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />}
                    {customFolders.map((folderName: string) => (
                        <button key={folderName} onClick={() => setDeckFilter(folderName)} className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${deckFilter === folderName ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'}`}>
                            <Folder size={10} fill="currentColor" /> {folderName}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredDecks.map(([key, deck]: any) => {
                            const isArchived = userData?.deckPrefs?.[key]?.archived || false;
                            const currentFolder = userData?.deckPrefs?.[key]?.folder || null;
                            
                            return (
                                <button key={key} onClick={() => { onSelectDeck(key); setInternalMode('menu'); }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border-[3px] border-slate-100 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50 hover:-translate-y-1 transition-all text-left relative group">
                                    
                                    {/* 🔥 THE CONTEXT MENU ENGINE */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <div 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setActiveMenu(activeMenu === key ? null : key);
                                                setMenuView('main'); // Reset to main view on open
                                            }}
                                            className="p-2 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </div>

                                        {/* Dropdown Panel */}
                                        {activeMenu === key && (
                                            <>
                                                {/* Invisible overlay to catch clicks outside */}
                                                <div className="fixed inset-0 z-30 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                                                
                                                <div className="absolute top-12 right-0 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-40 animate-in zoom-in-95 duration-200 overflow-hidden">
                                                    
                                                    {menuView === 'main' ? (
                                                        <>
                                                            <div 
                                                                onClick={(e) => { e.stopPropagation(); setMenuView('folders'); }} 
                                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center transition-colors cursor-pointer group/folder"
                                                            >
                                                                <span className="flex items-center gap-3"><FolderPlus size={16} className="text-indigo-500" /> Move to Folder</span>
                                                                <ChevronRight size={14} className="text-slate-300 group-hover/folder:text-indigo-500 transition-colors" />
                                                            </div>
                                                            
                                                            {onToggleArchive && (
                                                                <div 
                                                                    onClick={(e) => { e.stopPropagation(); onToggleArchive(key, isArchived); setActiveMenu(null); }} 
                                                                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors cursor-pointer"
                                                                >
                                                                    <Archive size={16} className="text-amber-500" /> {isArchived ? 'Unarchive Deck' : 'Archive Deck'}
                                                                </div>
                                                            )}
                                                            
                                                            <div className="h-px w-full bg-slate-100 dark:bg-slate-700 my-1" />
                                                            
                                                            <div 
                                                                onClick={(e) => { e.stopPropagation(); setToastMsg("Network decks cannot be deleted."); setActiveMenu(null); }} 
                                                                className="w-full text-left px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 size={16} /> Remove Deck
                                                            </div>
                                                        </>
                                                    ) : (
                                                        // 🔥 NESTED FOLDER SELECTION VIEW
                                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                            <div onClick={(e) => { e.stopPropagation(); setMenuView('main'); }} className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 cursor-pointer border-b border-slate-100 dark:border-slate-700 mb-1 bg-slate-50 dark:bg-slate-900/50">
                                                                <ArrowLeft size={12} /> Back
                                                            </div>
                                                            
                                                            <div 
                                                                onClick={(e) => { e.stopPropagation(); onAssignToFolder(key, null); setActiveMenu(null); setToastMsg("Removed from folder."); }}
                                                                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-3 cursor-pointer transition-colors ${currentFolder === null ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                            >
                                                                <div className={`w-2 h-2 rounded-full ${currentFolder === null ? 'bg-indigo-500' : 'border-2 border-slate-300'}`} />
                                                                None (Library)
                                                            </div>

                                                            {customFolders.map(folderName => (
                                                                <div 
                                                                    key={folderName}
                                                                    onClick={(e) => { e.stopPropagation(); onAssignToFolder(key, folderName); setActiveMenu(null); setToastMsg(`Moved to ${folderName}`); }}
                                                                    className={`px-4 py-2.5 text-xs font-bold flex items-center gap-3 cursor-pointer transition-colors ${currentFolder === folderName ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full ${currentFolder === folderName ? 'bg-indigo-500' : 'border-2 border-slate-300'}`} />
                                                                    <FolderOpen size={14} className={currentFolder === folderName ? 'text-indigo-500' : 'text-slate-400'} />
                                                                    {folderName}
                                                                </div>
                                                            ))}
                                                            
                                                            <div className="h-px w-full bg-slate-100 dark:bg-slate-700 my-1" />
                                                            
                                                            <div 
                                                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); setShowFolderModal(true); }}
                                                                className="px-4 py-3 text-xs font-black text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 cursor-pointer"
                                                            >
                                                                <Plus size={14} /> Create New Folder
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Deck Card Content */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center text-2xl border border-orange-100 dark:border-orange-500/20 shadow-inner">
                                            {deck.icon || <Layers size={28}/>}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-white text-xl leading-tight line-clamp-1 pr-10">{deck.id === 'custom' ? "My Study Cards" : deck.title}</h3>
                                    
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{deck.cards?.length || 0} Targets</span>
                                        {currentFolder && (
                                            <span className="text-[9px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Folder size={8} /> {currentFolder}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
    // --- MENU VIEW ---
    if (internalMode === 'menu') {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
                <div className="px-6 pt-8 pb-4">
                    <button onClick={handleBack} className="flex items-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm w-fit active:scale-95">
                        <ArrowLeft size={16} className="mr-2"/> Back
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{deckTitle}</h1>
                    <span className="text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">{cards.length} Configured Targets</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => launchGame('standard')} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:-translate-y-1 transition-all group text-left">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform"><Layers size={28}/></div>
                            <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">Review</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Standard Mode</p>
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
                </div>
            </div>
        );
    }

    // --- PLAYING VIEW ---
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-bottom-8 duration-500 relative z-[100] transition-colors">
            <div className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <button onClick={handleBack} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} strokeWidth={3}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-0.5">{activeGame} Protocol</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{deckTitle}</span>
                </div>
                <div className="w-11"></div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {activeGame === 'standard' && <StudyModePlayer deckCards={cards} userData={userData} onToggleStar={onToggleStar} />}
                {activeGame === 'quiz' && <div className="h-full overflow-y-auto"><QuizSessionView deckCards={cards} onGameEnd={(res: any) => handleGameFinish(res.score ? (res.score/res.total)*100 : 0)} /></div>}
                {activeGame === 'match' && <div className="h-full overflow-y-auto pt-6"><MatchingGame deckCards={cards} onGameEnd={(scorePct: number) => handleGameFinish(scorePct)} /></div>}
            </div>
        </div>
    );
}
