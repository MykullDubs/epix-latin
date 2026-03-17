// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, Timer, Zap, ArrowRight, X, Trophy, CheckCircle2, Settings } from 'lucide-react';

export default function LiveVocabProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    
    // Core Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    
    // Configurable Settings
    const [gameSettings, setGameSettings] = useState({ qTime: 15, rTime: 6 });
    const [timeLeft, setTimeLeft] = useState(gameSettings.qTime);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    // DYNAMIC QUIZ GENERATOR
    const quizQuestions = useMemo(() => {
        if (!deck?.cards || deck.cards.length === 0) return [];
        
        const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
        
        return shuffledDeck.map((card) => {
            const distractors = deck.cards
                .filter((c: any) => (c.id || c.front) !== (card.id || card.front))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
                
            const options = [card, ...distractors]
                .map((c: any) => ({ 
                    id: c.id || c.front, 
                    text: c.back 
                }))
                .sort(() => 0.5 - Math.random());

            return { 
                question: card.front, 
                options: options, 
                correctId: card.id || card.front 
            };
        });
    }, [deck]);

    // BROADCAST INIT
    useEffect(() => {
        if (quizQuestions.length > 0 && classId) {
            startLiveClass(safeDeckId, 'vocab', quizQuestions[0]);
        }
        return () => { 
            endLiveClass(); 
            clearInterval(timerRef.current); 
        };
    }, [classId, safeDeckId, quizQuestions]); 

    // 🔥 THE FIX: AUTO-SKIP ENGINE (Now looks at the Lobby, not the Roster)
    useEffect(() => {
        if (liveState?.quizState === 'active' && isAutoPilot) {
            const currentAnswers = Object.keys(liveState?.answers || {}).length;
            const joinedStudentsCount = Object.keys(liveState?.joined || {}).length;
            
            // If we have at least 1 person in the lobby, and all of them answered... skip!
            if (joinedStudentsCount > 0 && currentAnswers >= joinedStudentsCount) {
                setTimeLeft(0); 
            }
        }
    }, [liveState?.answers, liveState?.joined, isAutoPilot]);

    // MAIN GAME LOOP
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
    }, [isAutoPilot, liveState?.quizState, currentIndex, gameSettings]);

    const handleTimerEnd = () => {
        clearInterval(timerRef.current);
        if (liveState?.quizState === 'active') {
            triggerQuiz('revealed');
            setTimeLeft(gameSettings.rTime);
        } else if (liveState?.quizState === 'revealed') {
            handleNext();
        }
    };

    const handleNext = () => {
        if (currentIndex < quizQuestions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setTimeLeft(gameSettings.qTime);
            changeSlide(nextIdx, quizQuestions[nextIdx]);
            triggerQuiz('active');
        } else {
            onExit();
        }
    };

    const startRun = () => {
        setIsAutoPilot(true);
        triggerQuiz('active');
        setTimeLeft(gameSettings.qTime);
    };

    const currentQ = quizQuestions[currentIndex];
    const answers = liveState?.answers || {};
    const answerCount = Object.keys(answers).length;
    const joinedStudents = liveState?.joined || {};
    const joinedCount = Object.keys(joinedStudents).length;

    // ========================================================================
    //  PHASE 1: THE LOBBY
    // ========================================================================
    if (!isAutoPilot && (!liveState?.quizState || liveState?.quizState === 'waiting')) {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black" />
                
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
                            <Zap size={24} fill="white" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter text-white">{deck.title || 'Custom Deck'}</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Live Arena Protocol</span>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{activeClass?.name || 'Classroom'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-2 items-center px-4">
                        <Settings size={14} className="text-slate-500 mr-2" />
                        {[10, 15, 30].map(t => (
                            <button 
                                key={t}
                                onClick={() => setGameSettings(s => ({...s, qTime: t}))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${gameSettings.qTime === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t}s
                            </button>
                        ))}
                    </div>
                </div>

                <div className="z-10 text-center max-w-5xl w-full mt-12">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.4)] animate-bounce-slow">
                        <Zap size={48} fill="white" />
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 italic">Arena Lobby</h1>
                    
                    {/* Visual tweak: Lets the instructor know they can start */}
                    <p className={`font-black uppercase tracking-[0.4em] mb-12 ${joinedCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`}>
                        {joinedCount > 0 ? 'Ready For Protocol' : 'Awaiting Connections'}
                    </p>
                    
                    <div className="bg-slate-900/50 border-2 border-slate-800 rounded-[3rem] p-12 mb-12">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                            <span className="text-xl font-black uppercase tracking-widest text-slate-500">Connected Scholars</span>
                            <span className="bg-indigo-600 px-6 py-2 rounded-full font-black text-2xl">{joinedCount} / {activeClass?.students?.length || 0}</span>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
                            {activeClass?.students?.map((s: any, i: number) => {
                                const safeEmail = s.email.replace(/\./g, ',');
                                const isConnected = !!joinedStudents[safeEmail];

                                return (
                                    <div key={i} className={`flex flex-col items-center gap-2 transition-all duration-500 ${isConnected ? 'opacity-100 scale-110' : 'opacity-30 grayscale scale-95'}`} style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black shadow-inner ${isConnected ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                            {(s.name?.[0] || s.email[0]).toUpperCase()}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase truncate w-16 text-center ${isConnected ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {s.name || s.email.split('@')[0]}
                                        </span>
                                    </div>
                                );
                            })}
                            {(!activeClass?.students || activeClass.students.length === 0) && (
                                <div className="col-span-full py-8 text-slate-600 font-black uppercase tracking-widest text-sm">No students enrolled in this cohort yet.</div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={startRun} 
                        className="bg-white text-black px-16 py-6 rounded-full font-black text-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                    >
                        Initialize Run
                    </button>
                </div>
                
                <button onClick={onExit} className="absolute top-8 right-8 text-slate-600 hover:text-rose-500 p-2 transition-colors z-50"><X size={40} /></button>
            </div>
        );
    }

    if (!currentQ) return null;

    // ========================================================================
    //  PHASE 2 & 3: ACTIVE GAME & REVEAL
    // ========================================================================
    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1.5 bg-indigo-500 transition-all duration-1000 ease-linear z-50"
                style={{ width: `${(timeLeft / (liveState?.quizState === 'revealed' ? gameSettings.rTime : gameSettings.qTime)) * 100}%` }} />

            <div className="absolute inset-0 bg-black opacity-60" />
            
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                
                <div className={`mb-8 flex items-center gap-4 px-8 py-4 rounded-full border-2 transition-all ${timeLeft <= 5 && liveState?.quizState !== 'revealed' ? 'border-rose-500 text-rose-500 animate-pulse bg-rose-500/10' : 'border-slate-700 text-slate-400 bg-slate-900/50'}`}>
                    <Timer size={32} />
                    <span className="text-5xl font-black tabular-nums">{timeLeft}s</span>
                </div>

                <div className="max-w-6xl w-full bg-slate-900/80 border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center relative backdrop-blur-xl">
                    <span className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] block mb-6">Target {currentIndex + 1} / {quizQuestions.length}</span>
                    <h2 className="text-6xl md:text-8xl font-black mb-12 leading-tight tracking-tighter uppercase italic">{currentQ.question}</h2>
                    
                    {/* ACTIVE STATE */}
                    {liveState?.quizState === 'active' && (
                        <div className="flex flex-col items-center animate-in fade-in duration-500">
                            <div className="flex items-center justify-center gap-8 bg-black/40 p-10 rounded-[3rem] border border-white/5 w-fit mx-auto mb-6">
                                <div className="relative">
                                    <Users size={80} className="text-indigo-400" />
                                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                                </div>
                                <div className="text-left">
                                    {/* Show them how many out of the active lobby have answered */}
                                    <span className="block text-7xl font-black leading-none">{answerCount} <span className="text-4xl text-slate-600">/ {joinedCount}</span></span>
                                    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Responses In</span>
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Awaiting remaining signals...</p>
                        </div>
                    )}

                    {/* REVEALED STATE (Results Snapshot) */}
                    {liveState?.quizState === 'revealed' && (
                        <div className="animate-in zoom-in-95 duration-500 space-y-12">
                            <div className="bg-emerald-500 text-white p-12 rounded-[3rem] shadow-[0_20px_80px_rgba(16,185,129,0.3)] text-5xl font-black border-4 border-emerald-400 inline-block mx-auto min-w-[50%]">
                                {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                            </div>
                            
                            <div className="pt-8 border-t border-slate-800">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Round Snapshot</h4>
                                <div className="flex justify-center gap-4 flex-wrap">
                                    {Object.entries(answers).map(([email, ansId]: any, i) => {
                                        const isCorrect = ansId === currentQ.correctId;
                                        const scholar = activeClass?.students?.find((s:any) => s.email.replace(/\./g, ',') === email || s.email === email);
                                        const initial = (scholar?.name?.[0] || email[0]).toUpperCase();

                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xl shadow-lg transition-all ${isCorrect ? 'bg-emerald-500 border-emerald-300 text-white shadow-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'}`}>
                                                    {initial}
                                                </div>
                                                {isCorrect && <CheckCircle2 size={14} className="text-emerald-400" />}
                                            </div>
                                        );
                                    })}
                                    {answerCount === 0 && <p className="text-slate-600 font-bold italic">No responses received this round.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={onExit} className="absolute top-8 right-8 text-slate-600 hover:text-rose-500 p-2 transition-colors z-50"><X size={40} /></button>
        </div>
    );
}
