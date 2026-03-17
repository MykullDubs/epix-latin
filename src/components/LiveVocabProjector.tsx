// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, Timer, Zap, ArrowRight, X, Trophy, CheckCircle2, Settings, Hand, Crown } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export default function LiveVocabProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [isFinished, setIsFinished] = useState(false); 
    
    const scoresRef = useRef<{ [email: string]: number }>({});
    const scoredRoundRef = useRef<number>(-1);
    
    const [gameSettings, setGameSettings] = useState({ qTime: 15, rTime: 6 });
    const [timeLeft, setTimeLeft] = useState(gameSettings.qTime);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    const quizQuestions = useMemo(() => {
        if (!deck?.cards || deck.cards.length === 0) return [];
        const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
        return shuffledDeck.map((card) => {
            const distractors = deck.cards
                .filter((c: any) => (c.id || c.front) !== (card.id || card.front))
                .sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [card, ...distractors]
                .map((c: any) => ({ id: c.id || c.front, text: c.back }))
                .sort(() => 0.5 - Math.random());
            return { question: card.front, options: options, correctId: card.id || card.front };
        });
    }, [deck]);

    useEffect(() => {
        if (quizQuestions.length > 0 && classId) startLiveClass(safeDeckId, 'vocab', quizQuestions[0]);
        return () => { endLiveClass(); clearInterval(timerRef.current); };
    }, [classId, safeDeckId, quizQuestions]); 

    useEffect(() => {
        if (liveState?.quizState === 'revealed' && scoredRoundRef.current !== currentIndex) {
            const currentAnswers = liveState.answers || {};
            const currentQ = quizQuestions[currentIndex];
            const newScores = { ...scoresRef.current };
            
            Object.entries(currentAnswers).forEach(([email, ansId]: any) => {
                if (ansId === currentQ.correctId) newScores[email] = (newScores[email] || 0) + 1; 
                else if (newScores[email] === undefined) newScores[email] = 0; 
            });
            scoresRef.current = newScores;
            scoredRoundRef.current = currentIndex; 
        }
    }, [liveState?.quizState, currentIndex, quizQuestions, liveState?.answers]);

    useEffect(() => {
        if (liveState?.quizState === 'active' && isAutoPilot) {
            const currentAnswers = Object.keys(liveState?.answers || {}).length;
            const joinedStudentsCount = Object.keys(liveState?.joined || {}).length;
            if (joinedStudentsCount > 0 && currentAnswers >= joinedStudentsCount) setTimeLeft(0); 
        }
    }, [liveState?.answers, liveState?.joined, isAutoPilot]);

    useEffect(() => {
        if (!isAutoPilot || isFinished) return;
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { handleTimerEnd(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [isAutoPilot, liveState?.quizState, currentIndex, gameSettings, isFinished]);

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
            
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { answers: {} }).catch(e => console.error("Failed to clear answers", e));
        } else {
            setIsFinished(true);
            clearInterval(timerRef.current);
            // 🔥 NEW: Broadcast the final game state and scores to the students' phones
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, {
                quizState: 'finished',
                finalScores: scoresRef.current
            }).catch(e => console.error("Could not broadcast end game:", e));
        }
    };

    const startAutoPilotRun = () => { setIsAutoPilot(true); triggerQuiz('active'); setTimeLeft(gameSettings.qTime); };
    const startManualRun = () => { setIsAutoPilot(false); triggerQuiz('active'); };

    const currentQ = quizQuestions[currentIndex];
    const answers = liveState?.answers || {};
    const answerCount = Object.keys(answers).length;
    const joinedStudents = liveState?.joined || {};
    const joinedCount = Object.keys(joinedStudents).length;

    // ========================================================================
    //  PHASE 4: THE POST-GAME LEADERBOARD (Z-Index Fixed)
    // ========================================================================
    if (isFinished) {
        const sortedScores = Object.entries(scoresRef.current)
            .map(([email, score]) => {
                const scholar = activeClass?.students?.find((s:any) => s.email.replace(/\./g, ',') === email || s.email === email);
                return { email, score, name: scholar?.name || email.split('@')[0], initial: (scholar?.name?.[0] || email[0]).toUpperCase() };
            })
            .sort((a, b) => (b.score as number) - (a.score as number));

        const first = sortedScores[0];
        const second = sortedScores[1];
        const third = sortedScores[2];

        return (
            <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden font-sans p-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black pointer-events-none" />
                
                <div className="z-10 text-center w-full max-w-5xl animate-in slide-in-from-bottom-12 duration-700 fade-in">
                    <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce-slow drop-shadow-[0_0_40px_rgba(250,204,21,0.4)]" />
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 italic">Protocol Complete</h1>
                    <p className="text-indigo-400 font-black uppercase tracking-[0.4em] mb-16">Final Leaderboard Results</p>

                    <div className="flex justify-center items-end gap-4 md:gap-8 mb-16 h-64 border-b-2 border-slate-800 pb-0">
                        {second && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-backwards w-1/3 max-w-[160px]">
                                {/* 🔥 FIX: Generous margin-bottom and strict z-20 layering */}
                                <div className="text-xl md:text-2xl font-black mb-8 text-slate-300 relative z-20 truncate w-full px-2 text-center">{second.name}</div>
                                <div className="w-full h-36 bg-slate-800 border-t-4 border-slate-400 rounded-t-2xl flex flex-col items-center justify-start pt-8 relative shadow-[0_-20px_50px_rgba(148,163,184,0.1)]">
                                    <div className="absolute -top-6 w-12 h-12 bg-slate-300 text-slate-900 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-4 border-slate-950">2</div>
                                    <span className="font-black text-3xl text-white">{second.score}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Targets</span>
                                </div>
                            </div>
                        )}
                        
                        {first && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-700 delay-700 fill-mode-backwards w-1/3 max-w-[200px]">
                                <Crown size={32} className="text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-20" />
                                {/* 🔥 FIX: Generous margin-bottom and strict z-20 layering */}
                                <div className="text-2xl md:text-3xl font-black mb-10 text-yellow-400 relative z-20 truncate w-full px-2 text-center">{first.name}</div>
                                <div className="w-full h-48 bg-slate-800 border-t-4 border-yellow-400 rounded-t-2xl flex flex-col items-center justify-start pt-10 relative shadow-[0_-20px_60px_rgba(250,204,21,0.15)] z-10">
                                    <div className="absolute -top-8 w-16 h-16 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center font-black text-3xl shadow-xl border-4 border-slate-950">1</div>
                                    <span className="font-black text-5xl text-white">{first.score}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">Targets</span>
                                </div>
                            </div>
                        )}

                        {third && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards w-1/3 max-w-[160px]">
                                {/* 🔥 FIX: Generous margin-bottom and strict z-20 layering */}
                                <div className="text-xl md:text-2xl font-black mb-8 text-amber-600 relative z-20 truncate w-full px-2 text-center">{third.name}</div>
                                <div className="w-full h-28 bg-slate-800 border-t-4 border-amber-600 rounded-t-2xl flex flex-col items-center justify-start pt-6 relative shadow-[0_-20px_40px_rgba(217,119,6,0.1)]">
                                    <div className="absolute -top-6 w-12 h-12 bg-amber-600 text-amber-950 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-4 border-slate-950">3</div>
                                    <span className="font-black text-2xl text-white">{third.score}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Targets</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={onExit} className="bg-white text-black px-16 py-6 rounded-full font-black text-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center gap-4 mx-auto">
                        <X size={28} /> Terminate Session
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    //  PHASE 1: THE LOBBY
    // ========================================================================
    if (!liveState?.quizState || liveState?.quizState === 'waiting') {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black pointer-events-none" />
                <div className="flex items-center justify-between z-20 p-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-500/20"><Zap size={24} fill="white" /></div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter text-white">{deck.title || 'Custom Deck'}</h3>
                            <div className="flex items-center gap-3"><span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Live Arena</span><div className="h-1 w-1 rounded-full bg-slate-700" /><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{activeClass?.name || 'Classroom'}</span></div>
                        </div>
                    </div>
                    <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-2 items-center px-4">
                        <Settings size={14} className="text-slate-500 mr-2" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Auto-Timer:</span>
                        {[10, 15, 30].map(t => (
                            <button key={t} onClick={() => setGameSettings(s => ({...s, qTime: t}))} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${gameSettings.qTime === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}s</button>
                        ))}
                        <button onClick={onExit} className="ml-4 text-slate-600 hover:text-rose-500 p-2 transition-colors"><X size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 px-8 pb-8 z-10">
                    <div className="text-center shrink-0 mb-8 mt-4">
                        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 italic">Arena Lobby</h1>
                        <p className={`font-black uppercase tracking-[0.4em] text-sm ${joinedCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`}>
                            {joinedCount > 0 ? 'Ready For Protocol' : 'Awaiting Connections...'}
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 border-2 border-slate-800 rounded-[3rem] p-8 md:p-12 w-full max-w-5xl mx-auto shadow-inner">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6 shrink-0">
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
                                        <span className={`text-[10px] font-black uppercase truncate w-16 text-center ${isConnected ? 'text-emerald-400' : 'text-slate-600'}`}>{s.name || s.email.split('@')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-6 mt-6">
                        <button onClick={startManualRun} className="px-10 py-5 bg-slate-800 text-white rounded-full font-black text-xl uppercase tracking-widest hover:bg-slate-700 transition-colors border-2 border-slate-700 flex items-center gap-3 active:scale-95"><Hand size={24} /> Manual Mode</button>
                        <button onClick={startAutoPilotRun} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center gap-3"><Zap size={24} fill="currentColor" /> Auto-Pilot Mode</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQ) return null;

    // ========================================================================
    //  PHASE 2 & 3: ACTIVE GAME & REVEAL
    // ========================================================================
    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
            {isAutoPilot && (
                <div className="absolute top-0 left-0 h-1.5 bg-indigo-500 transition-all duration-1000 ease-linear z-50"
                    style={{ width: `${(timeLeft / (liveState?.quizState === 'revealed' ? gameSettings.rTime : gameSettings.qTime)) * 100}%` }} />
            )}

            <div className="absolute inset-0 bg-black opacity-60" />
            
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                {isAutoPilot ? (
                    <div className={`mb-8 flex items-center gap-4 px-8 py-4 rounded-full border-2 transition-all ${timeLeft <= 5 && liveState?.quizState !== 'revealed' ? 'border-rose-500 text-rose-500 animate-pulse bg-rose-500/10' : 'border-slate-700 text-slate-400 bg-slate-900/50'}`}>
                        <Timer size={32} />
                        <span className="text-5xl font-black tabular-nums">{timeLeft}s</span>
                    </div>
                ) : (
                    <div className="mb-8 flex items-center gap-4 px-8 py-4 rounded-full border-2 border-slate-700 text-slate-400 bg-slate-900/50 uppercase tracking-widest text-sm font-black">
                        <Hand size={20} /> Instructor Controlled
                    </div>
                )}

                <div className="max-w-6xl w-full bg-slate-900/80 border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center relative backdrop-blur-xl">
                    <span className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] block mb-6">Target {currentIndex + 1} / {quizQuestions.length}</span>
                    <h2 className="text-6xl md:text-8xl font-black mb-12 leading-tight tracking-tighter uppercase italic">{currentQ.question}</h2>
                    
                    {liveState?.quizState === 'active' && (
                        <div className="flex flex-col items-center animate-in fade-in duration-500">
                            <div className="flex items-center justify-center gap-8 bg-black/40 p-10 rounded-[3rem] border border-white/5 w-fit mx-auto mb-6">
                                <div className="relative">
                                    <Users size={80} className="text-indigo-400" />
                                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-7xl font-black leading-none">{answerCount} <span className="text-4xl text-slate-600">/ {joinedCount > 0 ? joinedCount : '∞'}</span></span>
                                    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Responses In</span>
                                </div>
                            </div>
                            
                            {isAutoPilot ? (
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Awaiting remaining signals...</p>
                            ) : (
                                <button onClick={() => triggerQuiz('revealed')} className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-full font-black text-2xl uppercase tracking-widest transition-transform active:scale-95 shadow-xl">
                                    Reveal Answer
                                </button>
                            )}
                        </div>
                    )}

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
                                            </div>
                                        );
                                    })}
                                    {answerCount === 0 && <p className="text-slate-600 font-bold italic">No responses received this round.</p>}
                                </div>
                            </div>

                            {!isAutoPilot && (
                                <button onClick={handleNext} className="mt-12 flex items-center gap-4 text-slate-400 hover:text-white font-black text-2xl uppercase tracking-[0.2em] transition-all hover:gap-6 mx-auto">
                                    {currentIndex < quizQuestions.length - 1 ? 'Next Target' : 'Finish Protocol'} <ArrowRight size={32} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <button onClick={onExit} className="absolute top-8 right-8 text-slate-600 hover:text-rose-500 p-2 transition-colors z-50"><X size={40} /></button>
        </div>
    );
}
