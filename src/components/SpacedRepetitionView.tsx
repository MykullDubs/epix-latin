// src/components/SpacedRepetitionView.tsx
import React, { useState, useEffect } from 'react';
import { db, appId } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { calculateNextReview, SRSData } from '../utils/srsEngine';
import { RotateCcw, Check, Zap, ArrowLeft, Loader2, Trophy, Music, ChevronUp } from 'lucide-react';

export default function SpacedRepetitionView({ deck, userId, onExit }: any) {
    const [dueCards, setDueCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [srsCache, setSrsCache] = useState<Record<string, SRSData>>({});

    // Gesture State
    const [touchStart, setTouchStart] = useState<number | null>(null);

    useEffect(() => {
        const loadReviewQueue = async () => {
            if (!deck?.cards || !userId) return;
            setIsLoading(true);
            const now = Date.now();
            const queue = [];
            const cache: Record<string, SRSData> = {};

            for (const card of deck.cards) {
                const srsRef = doc(db, 'artifacts', appId, 'users', userId, 'srs_progress', card.id);
                const srsSnap = await getDoc(srsRef);
                let isDue = true;
                if (srsSnap.exists()) {
                    const data = srsSnap.data() as SRSData;
                    cache[card.id] = data;
                    if (data.nextReviewDate > now) isDue = false;
                }
                if (isDue) queue.push(card);
            }

            setDueCards(queue.sort(() => Math.random() - 0.5));
            setSrsCache(cache);
            setIsLoading(false);
        };
        loadReviewQueue();
    }, [deck, userId]);

    const handleSwipe = (e: React.TouchEvent | React.MouseEvent) => {
        if (isFlipped) return;
        setIsFlipped(true);
    };

    const handleRating = async (quality: number) => {
        const currentCard = dueCards[currentIndex];
        const previousSrs = srsCache[currentCard.id];
        const nextSrsData = calculateNextReview(quality, previousSrs);

        const srsRef = doc(db, 'artifacts', appId, 'users', userId, 'srs_progress', currentCard.id);
        await setDoc(srsRef, nextSrsData, { merge: true });

        // Reset for next card
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
        }, 300);
    };

    if (isLoading) return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
            <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
            <h3 className="text-white font-black uppercase tracking-widest">Neural Syncing...</h3>
        </div>
    );

    if (currentIndex >= dueCards.length) return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center animate-in zoom-in-95">
            <Trophy size={80} className="text-yellow-400 mb-6" />
            <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Queue Liquidated</h2>
            <p className="text-slate-500 font-bold text-sm mb-8 uppercase tracking-widest">Cognitive load balanced for today.</p>
            <button onClick={onExit} className="px-10 py-4 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Return to Command</button>
        </div>
    );

    const activeCard = dueCards[currentIndex];

    return (
        <div className="h-full flex flex-col bg-slate-950 font-sans select-none">
            <header className="flex items-center justify-between p-6 shrink-0 border-b border-white/5">
                <button onClick={onExit} className="flex items-center gap-2 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors">
                    <ArrowLeft size={14} /> Abort
                </button>
                <div className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    <span className="text-indigo-400 text-[10px] font-black tracking-widest uppercase">{dueCards.length - currentIndex} Targets Remaining</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                
                {/* 3D Container */}
                <div className="relative w-full max-w-sm aspect-[3/4] perspective-1000">
                    <div 
                        className={`relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-x-180' : ''}`}
                        onClick={handleSwipe}
                    >
                        {/* FRONT: TARGET WORD */}
                        <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-800 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center shadow-2xl">
                            <div className="absolute inset-0 opacity-20 overflow-hidden rounded-[3rem] pointer-events-none">
                                {activeCard.imageUrl && <img src={activeCard.imageUrl} className="w-full h-full object-cover blur-xl" alt="" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-8 relative z-10">Vocabulary Target</span>
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-4 relative z-10 leading-none">{activeCard.front}</h2>
                            <div className="mt-12 flex flex-col items-center gap-2 animate-bounce relative z-10 opacity-40">
                                <ChevronUp size={24} className="text-indigo-400" />
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Swipe up to reveal</span>
                            </div>
                        </div>

                        {/* BACK: MEANING & RATINGS */}
                        <div className="absolute inset-0 backface-hidden rotate-x-180 bg-white rounded-[3rem] flex flex-col p-2 shadow-2xl overflow-hidden">
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">{activeCard.type}</span>
                                <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4">{activeCard.back}</h3>
                                {activeCard.ipa && <p className="font-mono text-indigo-600 font-bold mb-6">{activeCard.ipa}</p>}
                                
                                {activeCard.imageUrl && (
                                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 border-4 border-slate-50 shadow-inner">
                                        <img src={activeCard.imageUrl} className="w-full h-full object-cover" alt="Visual context" />
                                    </div>
                                )}
                            </div>

                            {/* SRS ACTION BAR - Anchored inside the back card */}
                            <div className="p-4 bg-slate-50 rounded-b-[2.8rem] flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleRating(1); }} className="flex-1 bg-white border-2 border-rose-100 hover:border-rose-500 text-rose-500 py-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95">
                                    <RotateCcw size={18} />
                                    <span className="text-[9px] font-black uppercase mt-1">Again</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRating(4); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                                    <Check size={18} />
                                    <span className="text-[9px] font-black uppercase mt-1">Good</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRating(5); }} className="flex-1 bg-white border-2 border-emerald-100 hover:border-emerald-500 text-emerald-500 py-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95">
                                    <Zap size={18} />
                                    <span className="text-[9px] font-black uppercase mt-1">Easy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
