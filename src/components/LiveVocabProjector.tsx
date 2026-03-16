// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, Timer, Zap, ArrowRight, X, Trophy } from 'lucide-react';

// SETTINGS
const QUESTION_TIME = 15; // Seconds to answer
const REVEAL_TIME = 5;    // Seconds to look at the correct answer

export default function LiveVocabProjector({ deck, classId, activeOrg, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    const quizQuestions = useMemo(() => {
        if (!deck?.cards || deck.cards.length === 0) return [];
        const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
        return shuffledDeck.map((card) => {
            const distractors = deck.cards
                .filter((c: any) => (c.id || c.front) !== (card.id || card.front))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            const options = [card, ...distractors]
                .map((c: any) => ({ id: c.id || c.front, text: c.back }))
                .sort(() => 0.5 - Math.random());
            return { question: card.front, options, correctId: card.id || card.front };
        });
    }, [deck]);

    // BROADCAST START
    useEffect(() => {
        if (quizQuestions.length > 0 && classId) {
            startLiveClass(safeDeckId, 'vocab', quizQuestions[0]);
        }
        return () => { endLiveClass(); clearInterval(timerRef.current); };
    }, [classId, safeDeckId]);

    // THE GAME LOOP ENGINE
    useEffect(() => {
        if (!isAutoPilot) return;

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimerEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [isAutoPilot, liveState?.quizState, currentIndex]);

    const handleTimerEnd = () => {
        clearInterval(timerRef.current);
        
        if (liveState?.quizState === 'active') {
            // Time up for answering! Show the answer.
            triggerQuiz('revealed');
            setTimeLeft(REVEAL_TIME); // Set timer for the reveal phase
        } else if (liveState?.quizState === 'revealed') {
            // Time up for looking at the answer! Move to next.
            handleNext();
        }
    };

    const handleNext = () => {
        if (currentIndex < quizQuestions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setTimeLeft(QUESTION_TIME);
            changeSlide(nextIdx, quizQuestions[nextIdx]);
            // If autopilot is on, it will automatically start in 'waiting'
            // We need to trigger it to 'active' immediately for the next question
            triggerQuiz('active');
        } else {
            onExit();
        }
    };

    const startAutoPilot = () => {
        setIsAutoPilot(true);
        triggerQuiz('active');
        setTimeLeft(QUESTION_TIME);
    };

    const currentQ = quizQuestions[currentIndex];
    const answerCount = liveState?.answers ? Object.keys(liveState.answers).length : 0;

    if (!currentQ) return null;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
            {/* Dynamic Background Progress Bar (at the top) */}
            {isAutoPilot && (
                <div 
                    className="absolute top-0 left-0 h-2 bg-indigo-500 transition-all duration-1000 ease-linear z-50"
                    style={{ width: `${(timeLeft / (liveState?.quizState === 'revealed' ? REVEAL_TIME : QUESTION_TIME)) * 100}%` }}
                />
            )}

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80" />
            
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                
                {/* Timer Display */}
                <div className={`mb-8 flex items-center gap-4 px-8 py-4 rounded-full border-2 transition-all ${timeLeft <= 5 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-slate-700 text-slate-400'}`}>
                    <Timer size={32} />
                    <span className="text-4xl font-black tabular-nums">{timeLeft}s</span>
                </div>

                <div className="max-w-5xl w-full bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center relative">
                    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] block mb-6">Target {currentIndex + 1} of {quizQuestions.length}</span>
                    <h2 className="text-6xl md:text-8xl font-black mb-12 leading-tight tracking-tighter text-white uppercase italic">{currentQ.question}</h2>
                    
                    <div className="flex flex-col items-center gap-8">
                        {!isAutoPilot && (
                            <button 
                                onClick={startAutoPilot}
                                className="bg-white hover:bg-indigo-500 hover:text-white text-black px-12 py-6 rounded-full font-black text-3xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-4"
                            >
                                <Zap size={40} fill="currentColor" /> Start Auto-Run
                            </button>
                        )}

                        {isAutoPilot && liveState?.quizState === 'active' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex items-center justify-center gap-6 bg-black/50 px-10 py-6 rounded-[2rem] border border-slate-700 w-fit mx-auto text-5xl font-black text-slate-300">
                                    <Users size={56} className="text-indigo-400" /> 
                                    <span>{answerCount} Joined</span>
                                </div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Waiting for timer or all responses...</p>
                            </div>
                        )}

                        {liveState?.quizState === 'revealed' && (
                            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                                <div className="bg-emerald-500 text-white p-10 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.3)] text-5xl font-black border-4 border-emerald-400 min-w-[60%] mb-4">
                                    {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                                </div>
                                <p className="text-slate-400 font-black uppercase tracking-widest">Next target in {timeLeft}s</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Bar Info */}
            <div className="absolute top-8 left-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">V</div>
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">{deck.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Automated Protocol Active</p>
                </div>
            </div>

            <button onClick={onExit} className="absolute top-8 right-8 text-slate-500 hover:text-rose-500 p-2 transition-colors"><X size={32} /></button>
        </div>
    );
}
