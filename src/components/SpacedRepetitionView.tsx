// src/components/SpacedRepetitionView.tsx
import React, { useState, useEffect } from 'react';
import { db, appId } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { calculateNextReview, SRSData } from '../utils/srsEngine';
import { RotateCcw, Check, Zap, ArrowLeft, Loader2, Trophy, Image as ImageIcon, Music } from 'lucide-react';

export default function SpacedRepetitionView({ deck, userId, onExit }: any) {
    const [dueCards, setDueCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [srsCache, setSrsCache] = useState<Record<string, SRSData>>({});

    useEffect(() => {
        const loadReviewQueue = async () => {
            if (!deck?.cards || !userId) return;
            setIsLoading(true);

            const now = Date.now();
            const queue = [];
            const cache: Record<string, SRSData> = {};

            // Fetch the student's progress for every card in the deck
            for (const card of deck.cards) {
                const srsRef = doc(db, 'artifacts', appId, 'users', userId, 'srs_progress', card.id);
                const srsSnap = await getDoc(srsRef);
                
                let isDue = true;
                if (srsSnap.exists()) {
                    const data = srsSnap.data() as SRSData;
                    cache[card.id] = data;
                    // If the nextReviewDate is in the future, it's not due yet
                    if (data.nextReviewDate > now) {
                        isDue = false;
                    }
                }

                if (isDue) {
                    queue.push(card);
                }
            }

            // Optional: Shuffle the queue so it's not always in the exact same order
            setDueCards(queue.sort(() => Math.random() - 0.5));
            setSrsCache(cache);
            setIsLoading(false);
        };

        loadReviewQueue();
    }, [deck, userId]);

    const handleRating = async (quality: number) => {
        const currentCard = dueCards[currentIndex];
        const previousSrs = srsCache[currentCard.id];
        
        // Calculate the new intervals
        const nextSrsData = calculateNextReview(quality, previousSrs);

        // Save to Firebase (Student's personal progress subcollection)
        const srsRef = doc(db, 'artifacts', appId, 'users', userId, 'srs_progress', currentCard.id);
        await setDoc(srsRef, nextSrsData, { merge: true });

        // Move to the next card
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
        }, 150); // Slight delay to allow flip animation to reset smoothly
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] p-8 text-center animate-in fade-in duration-500">
                <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Compiling Review Queue</h3>
                <p className="text-slate-400 font-medium">Checking spaced repetition algorithms...</p>
            </div>
        );
    }

    if (currentIndex >= dueCards.length) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 duration-500 border-4 border-slate-100 dark:border-slate-800">
                <Trophy size={80} className="text-emerald-400 mb-6" />
                <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Daily Review Complete</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm">You have caught up on all due vocabulary for this deck. The algorithm will schedule the next batch for optimal retention.</p>
                <button onClick={onExit} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95">
                    Return to Hub
                </button>
            </div>
        );
    }

    const activeCard = dueCards[currentIndex];

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-8 duration-500 font-sans transition-colors duration-300">
            
            <header className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-black text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft size={16} /> Exit Review
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cards Remaining</span>
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-black">{dueCards.length - currentIndex}</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden perspective-1000">
                
                {/* THE FLASHCARD */}
                <div 
                    className={`relative w-full max-w-lg aspect-[4/3] sm:aspect-video cursor-pointer transition-all duration-500 preserve-3d shadow-xl rounded-[2.5rem] ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={() => !isFlipped && setIsFlipped(true)}
                >
                    {/* FRONT OF CARD */}
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                        {activeCard.imageUrl && (
                            <div className="absolute inset-0 opacity-10 rounded-[2.2rem] overflow-hidden pointer-events-none">
                                <img src={activeCard.imageUrl} alt="" className="w-full h-full object-cover blur-sm" />
                            </div>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 block">Target Word</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-4 relative z-10">{activeCard.front}</h2>
                        
                        <div className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 animate-pulse relative z-10">
                            Tap to reveal meaning
                        </div>
                    </div>

                    {/* BACK OF CARD */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-50 dark:bg-indigo-950 border-4 border-indigo-200 dark:border-indigo-500/30 rounded-[2.5rem] flex flex-col p-8 overflow-y-auto custom-scrollbar">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-indigo-200 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest">{activeCard.type}</span>
                                {activeCard.ipa && <span className="font-mono text-xs text-indigo-500/70 dark:text-indigo-400/70">{activeCard.ipa}</span>}
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white leading-tight mb-6">{activeCard.back}</h3>
                            
                            {activeCard.imageUrl && (
                                <div className="w-full h-32 sm:h-40 rounded-xl overflow-hidden mb-4 border border-indigo-200 dark:border-indigo-500/30">
                                    <img src={activeCard.imageUrl} alt="Reference" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {activeCard.audioUrl && (
                                <div className="bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl flex items-center gap-3 border border-indigo-100 dark:border-indigo-500/20">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0"><Music size={14} /></div>
                                    <audio src={activeCard.audioUrl} controls className="h-8 w-full opacity-80" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* THE SRS RATING BUTTONS */}
                <div className={`mt-10 flex w-full max-w-lg gap-4 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                    <button 
                        onClick={() => handleRating(1)} 
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-500/30 hover:border-rose-500 dark:hover:border-rose-500 text-rose-600 dark:text-rose-400 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    >
                        <RotateCcw size={20} className="mb-1" />
                        <span className="font-black text-xs uppercase tracking-widest">Again</span>
                        <span className="text-[9px] font-bold text-slate-400">&lt; 1 min</span>
                    </button>
                    
                    <button 
                        onClick={() => handleRating(4)} 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-indigo-500/30"
                    >
                        <Check size={20} className="mb-1" />
                        <span className="font-black text-xs uppercase tracking-widest">Good</span>
                        <span className="text-[9px] font-bold text-indigo-200">Standard</span>
                    </button>
                    
                    <button 
                        onClick={() => handleRating(5)} 
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    >
                        <Zap size={20} className="mb-1" />
                        <span className="font-black text-xs uppercase tracking-widest">Easy</span>
                        <span className="text-[9px] font-bold text-slate-400">Bonus</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
