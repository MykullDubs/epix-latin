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

    // 🔥 TOUCH ENGINE STATE
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

    // 🔥 SWIPE LOGIC
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientY);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientY;
        const distance = touchStart - touchEnd;

        // If swipe up is more than 50px
        if (distance > 50 && !isFlipped) {
            setIsFlipped(true);
        }
        setTouchStart(null);
    };

    const handleRating = async (quality: number) => {
        const currentCard = dueCards[currentIndex];
        const previousSrs = srsCache[currentCard.id];
        const nextSrsData = calculateNextReview(quality, previousSrs);

        const srsRef = doc(db, 'artifacts', appId, 'users', userId, 'srs_progress', currentCard.id);
        await setDoc(srsRef, nextSrsData, { merge: true });

        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    };

    if (isLoading) return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-8">
            <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
            <h3 className="text-white font-black uppercase tracking-widest">Compiling Neural Data...</h3>
        </div>
    );

    if (currentIndex >= dueCards.length) return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center animate-in zoom-in-95">
            <Trophy size={80} className="text-yellow-400 mb-6" />
            <h2 className="text-3xl font-black text-white mb-2 uppercase">Neural Queue Empty</h2>
            <button onClick={onExit} className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest">Return to Hub</button>
        </div>
    );

    const activeCard = dueCards[currentIndex];

    return (
        <div className="h-full flex flex-col bg-slate-950 font-sans touch-none overflow-hidden">
            <header className="flex items-center justify-between p-6 shrink-0 z-50">
                <button onClick={onExit} className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest"><ArrowLeft size={14} /> Exit</button>
                <div className="text-indigo-400 text-[10px] font-black tracking-widest uppercase">{dueCards.length - currentIndex} Remaining</div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="relative w-full max-w-sm aspect-[3/4] perspective-2000">
                    <div 
                        className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-x-180' : ''}`}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        {/* FRONT */}
                        <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-800 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center shadow-2xl">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-8">Target Word</span>
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-4">{activeCard.front}</h2>
                            <div className="mt-12 flex flex-col items-center gap-2 animate-bounce opacity-40">
                                <ChevronUp size={24} className="text-indigo-400" />
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Swipe up</span>
                            </div>
                        </div>

                        {/* BACK */}
                        <div className="absolute inset-0 backface-hidden rotate-x-180 bg-white rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase mb-4">{activeCard.type}</span>
                                <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4">{activeCard.back}</h3>
                                
                                {/* 🔥 IPA FIX: Force LTR and standard font stack */}
                                {activeCard.ipa && (
                                    <p className="text-indigo-600 font-bold mb-6 text-xl tracking-normal" style={{ direction: 'ltr', fontFamily: 'Arial, sans-serif' }}>
                                        {activeCard.ipa}
                                    </p>
                                )}
                                
                                {activeCard.imageUrl && (
                                    <div className="w-full h-32 rounded-2xl overflow-hidden border-2 border-slate-50">
                                        <img src={activeCard.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleRating(1); }} className="flex-1 bg-white border-2 border-rose-100 text-rose-500 py-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90">
                                    <RotateCcw size={18} /><span className="text-[9px] font-black uppercase mt-1">Again</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRating(4); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl flex flex-col items-center justify-center active:scale-90 shadow-lg">
                                    <Check size={18} /><span className="text-[9px] font-black uppercase mt-1">Good</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRating(5); }} className="flex-1 bg-white border-2 border-emerald-100 text-emerald-500 py-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90">
                                    <Zap size={18} /><span className="text-[9px] font-black uppercase mt-1">Easy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
