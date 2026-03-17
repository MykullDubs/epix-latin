// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, Timer, Zap, ArrowRight, X, Trophy, CheckCircle2, ShieldCheck } from 'lucide-react';

const QUESTION_TIME = 15;
const REVEAL_TIME = 6; // Slightly longer to show the round results

export default function LiveVocabProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    // Generate questions once on mount
    const quizQuestions = useMemo(() => {
        if (!deck?.cards) return [];
        return [...deck.cards].sort(() => 0.5 - Math.random()).map((card) => {
            const distractors = deck.cards
                .filter((c: any) => c.id !== card.id)
                .sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [card, ...distractors]
                .map((c: any) => ({ id: c.id, text: c.back }))
                .sort(() => 0.5 - Math.random());
            return { question: card.front, options, correctId: card.id };
        });
    }, [deck]);

    // BROADCAST INIT
    useEffect(() => {
        if (quizQuestions.length > 0 && classId) {
            startLiveClass(safeDeckId, 'vocab', quizQuestions[0]);
        }
        return () => { endLiveClass(); clearInterval(timerRef.current); };
    }, [classId, safeDeckId]);

    // AUTO-SKIP: If everyone has answered, jump the timer to 0
    useEffect(() => {
        if (liveState?.quizState === 'active' && isAutoPilot) {
            const currentAnswers = Object.keys(liveState?.answers || {}).length;
            const totalStudents = activeClass?.students?.length || 0;
            if (totalStudents > 0 && currentAnswers >= totalStudents) {
                setTimeLeft(0);
            }
        }
    }, [liveState?.answers]);

    // GAME LOOP ENGINE
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
        if (liveState?.quizState === 'active') {
            triggerQuiz('revealed');
            setTimeLeft(REVEAL_TIME);
        } else if (liveState?.quizState === 'revealed') {
            handleNext();
        }
    };

    const handleNext = () => {
        if (currentIndex < quizQuestions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setTimeLeft(QUESTION_TIME);
            changeSlide(nextIdx, quizQuestions[nextIdx]);
            triggerQuiz('active');
        } else {
            onExit();
        }
    };

    const startRun = () => {
        setIsAutoPilot(true);
        triggerQuiz('active');
        setTimeLeft(QUESTION_TIME);
    };

    const currentQ = quizQuestions[currentIndex];
    const answers = liveState?.answers || {};
    const answerCount = Object.keys(answers).length;

    // LOBBY VIEW
    if (!isAutoPilot && (!liveState?.quizState || liveState?.quizState === 'waiting')) {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black" />
                
                <div className="z-10 text-center max-w-4xl w-full">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.4)] animate-bounce-slow">
                        <Zap size={48} fill="white" />
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 italic">Arena Lobby</h1>
                    <p className="text-indigo-400 font-black uppercase tracking-[0.4em] mb-12">{deck.title}</p>
                    
                    <div className="bg-slate-900/50 border-2 border-slate-800 rounded-[3rem] p-12 mb-12">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                            <span className="text-xl font-black uppercase tracking-widest text-slate-500">Connected Scholars</span>
                            <span className="bg-indigo-600 px-6 py-2 rounded-full font-black text-2xl">{activeClass?.students?.length || 0}</span>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
                            {activeClass?.students?.map((s: any, i: number) => (
                                <div key={i} className="flex flex-col items-center gap-2 animate-in zoom-in duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-black text-slate-500">
                                        {s.email[0].toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-600 truncate w-16 text-center">{s.email.split('@')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={startRun} className="bg-white text-black px-16 py-6 rounded-full font-black text-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                        Initialize Run
                    </button>
                </div>
            </div>
        );
    }

    if (!currentQ) return null;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1.5 bg-indigo-500 transition-all duration-1000 ease-linear z-50"
                style={{ width: `${(timeLeft / (liveState?.quizState === 'revealed' ? REVEAL_TIME : QUESTION_TIME)) * 100}%` }} />

            <div className="absolute inset-0 bg-black opacity-60" />
            
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                <div className={`mb-8 flex items-center gap-4 px-8 py-4 rounded-full border-2 transition-all ${timeLeft <= 5 && liveState?.quizState !== 'revealed' ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-slate-700 text-slate-400'}`}>
                    <Timer size={32} />
                    <span className="text-5xl font-black tabular-nums">{timeLeft}s</span>
                </div>

                <div className="max-w-6xl w-full bg-slate-900/80 border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center relative backdrop-blur-xl">
                    <span className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] block mb-6">Target {currentIndex + 1} / {quizQuestions.length}</span>
                    <h2 className="text-6xl md:text-8xl font-black mb-12 leading-tight tracking-tighter uppercase italic">{currentQ.question}</h2>
                    
                    {liveState?.quizState === 'active' && (
                        <div className="flex items-center justify-center gap-8 bg-black/40 p-10 rounded-[3rem] border border-white/5 w-fit mx-auto">
                            <div className="relative">
                                <Users size={80} className="text-indigo-400" />
                                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                            </div>
                            <div className="text-left">
                                <span className="block text-7xl font-black leading-none">{answerCount}</span>
                                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Responses In</span>
                            </div>
                        </div>
                    )}

                    {liveState?.quizState === 'revealed' && (
                        <div className="animate-in zoom-in-95 duration-500 space-y-12">
                            <div className="bg-emerald-500 text-white p-12 rounded-[3rem] shadow-[0_20px_80px_rgba(16,185,129,0.3)] text-5xl font-black border-4 border-emerald-400 inline-block mx-auto min-w-[50%]">
                                {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                            </div>
                            
                            {/* ROUND SNAPSHOT */}
                            <div className="flex justify-center gap-4">
                                {Object.entries(answers).map(([email, ansId]: any, i) => {
                                    const isCorrect = ansId === currentQ.correctId;
                                    return (
                                        <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xs shadow-lg transition-all ${isCorrect ? 'bg-emerald-500 border-emerald-300 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'}`}>
                                            {email[0].toUpperCase()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={onExit} className="absolute top-8 right-8 text-slate-600 hover:text-rose-500 p-2 transition-colors z-50"><X size={40} /></button>
        </div>
    );
}
