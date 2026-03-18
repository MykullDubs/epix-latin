// src/components/StudentSlipstreamView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
// 🔥 FIXED THE IMPORT PATH HERE: Just one level up!
import { db, appId } from '../config/firebase';
import { Zap, AlertTriangle, Gauge, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function StudentSlipstreamView({ user, classId, deck, liveState, onExit }: any) {
    const [isJoined, setIsJoined] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [penaltyTime, setPenaltyTime] = useState(0);

    const safeEmail = user?.email?.replace(/\./g, ',');

    // 1. Generate Local Randomized Quiz
    // We randomize the distractors locally so students can't screen-peek their neighbors
    const quizQuestions = useMemo(() => {
        if (!deck?.cards || deck.cards.length === 0) return [];
        // Shuffle the deck locally for this specific student
        const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
        
        return shuffledDeck.map((card) => {
            const distractors = deck.cards
                .filter((c: any) => (c.id || c.front) !== (card.id || card.front))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            const options = [card, ...distractors]
                .map((c: any) => ({ id: c.id || c.front, text: c.back }))
                .sort(() => 0.5 - Math.random());
            
            return { question: card.front, ipa: card.ipa, options: options, correctId: card.id || card.front };
        });
    }, [deck]);

    const totalQuestions = quizQuestions.length;
    const isFinishedLocal = currentIndex >= totalQuestions;

    // 2. Penalty Engine (Engine Stall)
    useEffect(() => {
        if (penaltyTime > 0) {
            const timer = setTimeout(() => setPenaltyTime(penaltyTime - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [penaltyTime]);

    // 3. Action: Connect to Grid
    const handleJoinGrid = async () => {
        setIsJoined(true);
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, {
            [`joined.${safeEmail}`]: true,
            [`progress.${safeEmail}`]: 0
        });
    };

    // 4. Action: Answer Question
    const handleAnswer = async (selectedId: string) => {
        if (penaltyTime > 0 || isFinishedLocal || liveState?.quizState !== 'racing') return;

        const currentQ = quizQuestions[currentIndex];
        
        if (selectedId === currentQ.correctId) {
            // SUCCESS: Boost engine, move to next question
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            
            // Ping Firebase to move the Lightcycle on the projector!
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            await updateDoc(sessionRef, {
                [`progress.${safeEmail}`]: nextIdx
            });
        } else {
            // FAILURE: Engine Stall (3 Second Lockout)
            setPenaltyTime(3);
        }
    };

    // ========================================================================
    //  RENDER: BOOT / LOBBY PHASE
    // ========================================================================
    if (liveState?.quizState === 'waiting' || !liveState?.quizState) {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-cyan-500/10 border-2 border-cyan-400 rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] mb-8">
                        <Gauge size={40} className="text-cyan-400" />
                    </div>
                    
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-4">
                        Slipstream Run
                    </h1>
                    
                    {!isJoined ? (
                        <>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs mb-12">Establish uplink to enter the grid.</p>
                            <button 
                                onClick={handleJoinGrid}
                                className="w-full max-w-xs py-5 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(34,211,238,0.3)] active:scale-95 transition-all"
                            >
                                Connect Device
                            </button>
                        </>
                    ) : (
                        <div className="animate-in zoom-in duration-500">
                            <div className="flex items-center justify-center gap-3 text-emerald-400 font-black uppercase tracking-widest mb-4">
                                <CheckCircle2 size={20} /> Uplink Established
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                                Eyes on the projector. Awaiting race start...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: FINISHED PHASE
    // ========================================================================
    if (liveState?.quizState === 'finished' || isFinishedLocal) {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-20" />
                <div className="relative z-10 text-center animate-in zoom-in-95 duration-500">
                    <CheckCircle2 size={80} className="text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-4">Race Completed</h2>
                    <p className="text-fuchsia-400 font-black uppercase tracking-widest text-xs">Awaiting final standings on projector.</p>
                </div>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: RACING PHASE
    // ========================================================================
    const currentQ = quizQuestions[currentIndex];
    const progressPct = (currentIndex / totalQuestions) * 100;

    return (
        <div className="h-full bg-slate-950 text-white flex flex-col relative font-sans">
            {/* Header: Progress Bar */}
            <div className="h-14 flex items-center px-6 border-b border-slate-800 shrink-0 bg-slate-950 relative z-20">
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest w-16">
                    {currentIndex} / {totalQuestions}
                </span>
                <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
                <Zap size={16} className="text-fuchsia-500" />
            </div>

            {/* Main Stage: The Flashcard */}
            <main className="flex-1 flex flex-col p-6 relative z-10 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center text-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        {currentQ.question}
                    </h2>
                </div>

                {/* The Options Grid */}
                <div className="grid grid-cols-1 gap-3 shrink-0 pb-6">
                    {currentQ.options.map((opt: any) => (
                        <button
                            key={opt.id}
                            onClick={() => handleAnswer(opt.id)}
                            disabled={penaltyTime > 0}
                            className="w-full p-5 bg-slate-900 border-2 border-slate-800 rounded-2xl font-black text-lg text-slate-200 hover:border-cyan-500 hover:bg-cyan-500/10 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {opt.text}
                        </button>
                    ))}
                </div>
            </main>

            {/* ENGINE STALL OVERLAY (Penalty State) */}
            {penaltyTime > 0 && (
                <div className="absolute inset-0 z-50 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <ShieldAlert size={80} className="text-rose-500 mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]" />
                    <h2 className="text-5xl font-black uppercase tracking-tighter italic text-rose-500 mb-4">Engine Stalled</h2>
                    <div className="text-8xl font-black text-white tabular-nums">{penaltyTime}</div>
                    <p className="text-rose-400 font-black uppercase tracking-widest text-xs mt-6">System Rebooting...</p>
                </div>
            )}
        </div>
    );
}
