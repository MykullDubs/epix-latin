// src/components/FlashcardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, X, Library, Layers, Play, Zap, HelpCircle, Puzzle, Flame, 
    CheckCircle2, XCircle, Globe, Users, Filter, ChevronLeft, ChevronRight, 
    RotateCw, ArrowUp, Paperclip, Music, Star, Archive, Plus, Save, Loader2,
    MoreVertical, FolderPlus, Trash2, Folder, FolderOpen 
} from 'lucide-react';
import { Toast } from './Toast'; 

const SUBJECT_ORDER = ['1s', '2s', '3s', '1p', '2p', '3p'];

// ============================================================================
//  0. STUDENT CARD BUILDER
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
            ipa: '', 
            morphology: [{ part: front.trim(), meaning: 'Root', type: 'root' }],
            grammar_tags: ['Student Note']
        });
        setIsSaving(false);
        onCancel(true); 
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 absolute inset-0 z-[200] animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-6 pt-safe-8 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <button onClick={() => onCancel(false)} className="flex items-center text-slate-400 hover:text-rose-500 mb-4 text-xs font-black uppercase tracking-widest transition-colors bg-slate-50 dark:bg-slate-800 px-5 py-2.5 rounded-full w-fit active:scale-95">
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
                    className="w-full bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-safe-8"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                    {isSaving ? 'Forging...' : 'Save Card to Deck'}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
//  1. STUDY MODE 
// ============================================================================
function StudyModePlayer({ deckCards, userData, onToggleStar }: any) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showConjugations, setShowConjugations] = useState(false); 
    
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
        
        if (dragX > SWIPE_THRESHOLD_X && currentIndex > 0) handlePrev();
        else if (dragX < -SWIPE_THRESHOLD_X && currentIndex < deckCards.length - 1) handleNext();
        else if (dragY < SWIPE_THRESHOLD_Y || (Math.abs(dragX) < 10 && Math.abs(dragY) < 10)) setIsFlipped(!isFlipped);
        
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

                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight relative z-10 w-full px-4">{currentCard.front}</h2>
                            
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
                                <ArrowUp size={16} strokeWidth={3} className="animate-bounce" /> Slide up to return
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

            <div className="flex items-center justify-between px-2 shrink-0 z-10 w-full mb-safe-4">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md border border-slate-100 dark:border-slate-700 disabled:opacity-30 transition-all active:scale-95 touch-manipulation">
                    <ChevronLeft size={28} strokeWidth={3} className="-ml-1" />
                </button>
                <div className="flex gap-2">
                    {[...Array(Math.min(5, deckCards.length))].map((_, idx) => (
                        <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === Math.floor((currentIndex / deckCards.length) * 5) ? 'w-5 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                </div>
                <button onClick={handleNext} disabled={currentIndex === deckCards.length - 1} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-md border border-slate-100 dark:border-slate-700 disabled:opacity-30 transition-all active:scale-95 touch-manipulation">
                    <ChevronRight size={28} strokeWidth={3} className="ml-1" />
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
export default function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onLogActivity, userData, onSaveCard, onToggleStar, onToggleArchive, onCreateFolder, onAssignToFolder, onHideDeck }: any) {
    const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing' | 'create'>('library');
    const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
    
    const [deckFilter, setDeckFilter] = useState<string>('all');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    const [activeOptionsDeck, setActiveOptionsDeck] = useState<any>(null);
    const [menuView, setMenuView] = useState<'main' | 'folders'>('main'); 
    
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    
    const resolvedDeck = allDecks[selectedDeckKey] || Object.values(allDecks)[0];
    const cards = resolvedDeck?.cards || [];
    const deckTitle = resolvedDeck?.id === 'custom' ? "My Study Cards" : resolvedDeck?.title;

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
            if (isArchived) return false; 

            // 🔥 Root Library view logic: only show decks that ARE NOT in a folder
            if (deckFilter === 'all') return currentFolder === null;

            // Optional filters
            if (deckFilter === 'personal') return !deck.isPublished;
            if (deckFilter === 'network') return deck.isPublished;
            
            // Inside a specific folder
            if (customFolders.includes(deckFilter)) {
                return currentFolder === deckFilter;
            }

            return true;
        });

        return (
            <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                {showFolderModal && (
                    <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
                            <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-6 text-center">New Folder</h3>
                            <input 
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="e.g., Midterm Prep"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white focus:border-indigo-500 outline-none mb-6 text-lg text-center"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowFolderModal(false)} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Cancel</button>
                                <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="flex-1 px-4 py-4 rounded-2xl font-black text-white bg-indigo-600 disabled:bg-indigo-400 active:scale-95 transition-all">Create</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-safe-5 flex justify-between items-center sticky top-0 z-30 pt-safe shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white p-2.5 rounded-xl shadow-md shadow-orange-500/20"><Library size={22} strokeWidth={3}/></div>
                        <span className="font-black text-slate-800 dark:text-white text-2xl uppercase tracking-tighter">Study Hub</span>
                    </div>
                    <button onClick={() => setInternalMode('create')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
                        <Plus size={16} strokeWidth={3} /> New Card
                    </button>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-2 overflow-x-auto custom-scrollbar sticky top-[80px] z-20 overscroll-x-contain shrink-0">
                    <Filter size={16} className="text-slate-400 mr-2 shrink-0" />
                    
                    {['all', 'personal', 'network', 'archived'].map((f: any) => (
                        <button key={f} onClick={() => setDeckFilter(f)} className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${deckFilter === f ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
                            {f}
                        </button>
                    ))}
                    
                    {customFolders.length > 0 && <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-2 shrink-0" />}
                    {customFolders.map((folderName: string) => (
                        <button key={folderName} onClick={() => setDeckFilter(folderName)} className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 ${deckFilter === folderName ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'}`}>
                            <Folder size={12} fill="currentColor" /> {folderName}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-12 relative z-10 custom-scrollbar overscroll-y-contain">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* 🔥 BREADCRUMB HEADER FOR INSIDE A FOLDER */}
                        {customFolders.includes(deckFilter) && (
                            <div className="col-span-full animate-in fade-in duration-300 mb-2">
                                <button onClick={() => setDeckFilter('all')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors w-fit bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95">
                                    <ArrowLeft size={14} /> Back to Library
                                </button>
                                <div className="flex items-center gap-3 mt-6 mb-2">
                                    <FolderOpen size={28} className="text-indigo-500" />
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{deckFilter}</h2>
                                </div>
                            </div>
                        )}

                        {/* 🔥 RENDER FOLDERS AS CLICKABLE GRID CARDS IN THE ROOT 'ALL' VIEW */}
                        {deckFilter === 'all' && customFolders.map((folderName: string) => {
                            const itemCount = Object.keys(allDecks).filter(key => userData?.deckPrefs?.[key]?.folder === folderName && !userData?.deckPrefs?.[key]?.archived).length;
                            
                            return (
                                <button 
                                    key={`folder-${folderName}`} 
                                    onClick={() => setDeckFilter(folderName)} 
                                    className="relative group w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] p-7 border-4 border-indigo-100 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:-translate-y-1 transition-all text-left shadow-sm hover:shadow-xl block animate-in fade-in duration-300"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-white dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl border border-indigo-100 dark:border-indigo-500/40 shadow-inner group-hover:scale-110 transition-transform">
                                            <Folder size={32} fill="currentColor" />
                                        </div>
                                    </div>
                                    <h3 className="font-black text-indigo-900 dark:text-indigo-100 text-2xl leading-tight line-clamp-1 pr-4 mb-1">{folderName}</h3>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-300 uppercase font-black tracking-widest bg-white/60 dark:bg-black/20 px-3 py-1 rounded-md shadow-sm border border-indigo-100/50 dark:border-indigo-500/20">
                                            {itemCount} Decks
                                        </span>
                                    </div>
                                </button>
                            );
                        })}

                        {/* RENDER DECKS */}
                        {filteredDecks.length === 0 && deckFilter !== 'all' && customFolders.includes(deckFilter) && (
                             <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] mt-4 text-slate-400 font-bold text-sm uppercase tracking-widest">
                                 Folder is empty
                             </div>
                        )}

                        {filteredDecks.map(([key, deck]: any) => {
                            const isArchived = userData?.deckPrefs?.[key]?.archived || false;
                            const currentFolder = userData?.deckPrefs?.[key]?.folder || null;
                            
                            return (
                                <div key={key} className="relative group animate-in fade-in duration-300">
                                    <button onClick={() => { onSelectDeck(key); setInternalMode('menu'); }} className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 border-4 border-slate-50 dark:border-slate-800 hover:border-orange-100 dark:hover:border-orange-500/30 hover:-translate-y-1 transition-all text-left shadow-sm hover:shadow-xl relative block">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center text-2xl border border-orange-100 dark:border-orange-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                                {deck.icon || <Layers size={28}/>}
                                            </div>
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-2xl leading-tight line-clamp-1 pr-12 mb-1">{deck.id === 'custom' ? "My Study Cards" : deck.title}</h3>
                                        
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-md">{deck.cards?.length || 0} Targets</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation(); 
                                            setActiveOptionsDeck(deck);
                                            setMenuView('main'); 
                                        }}
                                        className="absolute top-4 right-4 p-3 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors active:bg-slate-100 z-20"
                                        aria-label="Deck Options"
                                    >
                                        <MoreVertical size={24} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 🔥 THE BOTTOM SHEET DRAWER MODAL */}
                {activeOptionsDeck && (
                    <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                        <div 
                            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
                            onClick={() => setActiveOptionsDeck(null)} 
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
                                                onToggleArchive(activeOptionsDeck.id, userData?.deckPrefs?.[activeOptionsDeck.id]?.archived || false); 
                                                setActiveOptionsDeck(null); 
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
                                            if (onHideDeck) onHideDeck(activeOptionsDeck.id);
                                            setActiveOptionsDeck(null);
                                            setToastMsg("Deck banished."); 
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
                                            onClick={() => { onAssignToFolder(activeOptionsDeck.id, null); setActiveOptionsDeck(null); setToastMsg("Removed from folder."); }}
                                            className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all active:scale-[0.98] ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === null || !userData?.deckPrefs?.[activeOptionsDeck.id]?.folder ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === null || !userData?.deckPrefs?.[activeOptionsDeck.id]?.folder ? 'bg-indigo-500 shadow-sm' : 'border-2 border-slate-300 dark:border-slate-600'}`} />
                                            None (Main Library)
                                        </button>

                                        {customFolders.map(folderName => (
                                            <button 
                                                key={folderName}
                                                onClick={() => { onAssignToFolder(activeOptionsDeck.id, folderName); setActiveOptionsDeck(null); setToastMsg(`Moved to ${folderName}`); }}
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
                                        onClick={() => { setActiveOptionsDeck(null); setShowFolderModal(true); }}
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
        <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-bottom-8 duration-500 relative z-[100] transition-colors pb-safe">
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
