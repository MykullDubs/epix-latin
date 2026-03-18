// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { 
    Users, Timer, Zap, ArrowRight, X, Trophy, CheckCircle2, 
    Settings, Hand, Crown, Activity, Target, Shield, Flame 
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export default function LiveVocabProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [isFinished, setIsFinished] = useState(false); 
    const [isBooting, setIsBooting] = useState(true); // 🔥 System Boot Sequence
    
    const scoresRef = useRef<{ [email: string]: number }>({});
    const [gameSettings, setGameSettings] = useState({ qTime: 15, rTime: 6 });
    const [timeLeft, setTimeLeft] = useState(gameSettings.qTime);
    
    const timerRef = useRef<any>(null);
    const safeDeckId = deck?.id || deck?.key || 'custom_vocab_run';

    const liveStateRef = useRef(liveState);
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => { liveStateRef.current = liveState; }, [liveState]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    // System Boot Logic
    useEffect(() => {
        const timer = setTimeout(() => setIsBooting(false), 2500);
        return () => clearTimeout(timer);
    }, []);

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
            return { question: card.front, ipa: card.ipa, options: options, correctId: card.id || card.front };
        });
    }, [deck]);

    useEffect(() => {
        if (quizQuestions.length > 0 && classId) startLiveClass(safeDeckId, 'vocab', quizQuestions[0]);
        return () => { endLiveClass(); clearInterval(timerRef.current); };
    }, [classId, safeDeckId, quizQuestions]); 

    useEffect(() => {
        if (liveState?.quizState === 'active' && isAutoPilot) {
            const currentAnswers = Object.keys(liveState?.answers || {}).length;
            const joinedStudentsCount = Object.keys(liveState?.joined || {}).length;
            if (joinedStudentsCount > 0 && currentAnswers >= joinedStudentsCount) {
                setTimeLeft(0); 
            }
        }
    }, [liveState?.answers, liveState?.joined, isAutoPilot, liveState?.quizState]);

    useEffect(() => {
        if (!isAutoPilot || isFinished || isBooting || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [isAutoPilot, isFinished, isBooting, timeLeft]);

    useEffect(() => {
        if (timeLeft === 0 && isAutoPilot && !isFinished) {
            if (liveState?.quizState === 'active') {
                handleReveal();
                setTimeLeft(gameSettings.rTime);
            } else if (liveState?.quizState === 'revealed') {
                handleNext();
            }
        }
    }, [timeLeft, isAutoPilot, isFinished]); 

    const handleReveal = async () => {
        const freshestLiveState = liveStateRef.current;
        const freshestIndex = currentIndexRef.current;
        const currentQ = quizQuestions[freshestIndex];
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        const newScores = { ...scoresRef.current };
        const roundPoints: any = {}; 
        const answers = freshestLiveState?.answers || {};
        const answerTimes = freshestLiveState?.answerTimes || {};
        
        Object.entries(answers).forEach(([email, ansId]: any) => {
            if (ansId === currentQ.correctId) {
                const answerTime = answerTimes[email] || Date.now();
                const startTime = freshestLiveState?.currentQuestion?.startTime || (Date.now() - (gameSettings.qTime * 1000));
                const timeLimit = freshestLiveState?.currentQuestion?.timeLimit || (gameSettings.qTime * 1000);
                const timeTaken = Math.max(0, answerTime - startTime);
                const tLeft = Math.max(0, timeLimit - timeTaken);
                const speedBonus = Math.round(500 * (tLeft / timeLimit));
                const pointsEarned = 500 + speedBonus;
                roundPoints[email] = pointsEarned;
                newScores[email] = (newScores[email] || 0) + pointsEarned;
            } else { roundPoints[email] = 0; }
        });

        scoresRef.current = newScores;
        await updateDoc(sessionRef, { quizState: 'revealed', finalScores: newScores, roundPoints: roundPoints });
        triggerQuiz('revealed');
    };

    const handleNext = () => {
        const freshestIndex = currentIndexRef.current;
        if (freshestIndex < quizQuestions.length - 1) {
            const nextIdx = freshestIndex + 1;
            setCurrentIndex(nextIdx);
            setTimeLeft(gameSettings.qTime);
            const questionPayload = { ...quizQuestions[nextIdx], startTime: Date.now(), timeLimit: gameSettings.qTime * 1000 };
            changeSlide(nextIdx, questionPayload);
            triggerQuiz('active');
            updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), { currentQuestion: questionPayload, answers: {}, answerTimes: {}, roundPoints: {} });
        } else {
            setIsFinished(true);
            updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), { quizState: 'finished', finalScores: scoresRef.current });
        }
    };

    const startRun = (auto: boolean) => {
        setIsAutoPilot(auto);
        setTimeLeft(gameSettings.qTime);
        setCurrentIndex(0);
        const qPayload = { ...quizQuestions[0], startTime: Date.now(), timeLimit: gameSettings.qTime * 1000 };
        changeSlide(0, qPayload);
        triggerQuiz('active');
        updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), { currentQuestion: qPayload, answers: {}, answerTimes: {}, roundPoints: {}, finalScores: {} });
        scoresRef.current = {};
    };

    // Helper for "Live Pulse" entries
    const roundScores = useMemo(() => {
        const rp = liveState?.roundPoints || {};
        return Object.entries(rp)
            .filter(([_, pts]: any) => pts > 0)
            .map(([email, pts]: any) => {
                const s = activeClass?.students?.find((st: any) => st.email.replace(/\./g, ',') === email || st.email === email);
                return { name: s?.name || email.split('@')[0], points: pts };
            })
            .sort((a, b) => b.points - a.points);
    }, [liveState?.roundPoints, activeClass?.students]);

    // ========================================================================
    //  RENDER: SYSTEM BOOT
    // ========================================================================
    if (isBooting) {
        return (
            <div className="h-full bg-black flex flex-col items-center justify-center font-mono text-indigo-500 overflow-hidden">
                <div className="space-y-2 animate-pulse text-center">
                    <p className="text-xs tracking-[0.5em] uppercase opacity-50">Initializing Magister OS...</p>
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Vocabulary Protocol</h2>
                    <div className="w-64 h-1 bg-slate-900 mx-auto rounded-full mt-8 overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-slide-infinite w-1/2" />
                    </div>
                </div>
                <div className="absolute bottom-12 left-12 text-[10px] space-y-1 opacity-30">
                    <p>{`> SCANNING COHORT: ${activeClass?.name || 'GENERIC'}`}</p>
                    <p>{`> DECK_ID: ${safeDeckId}`}</p>
                    <p>{`> ENCRYPTION: ACTIVE`}</p>
                </div>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: FINISHED LEADERBOARD
    // ========================================================================
    if (isFinished) {
        const sortedScores = Object.entries(scoresRef.current)
            .map(([email, score]) => {
                const scholar = activeClass?.students?.find((s:any) => s.email.replace(/\./g, ',') === email || s.email === email);
                return { email, score, name: scholar?.name || email.split('@')[0] };
            })
            .sort((a, b) => (b.score as number) - (a.score as number));

        return (
            <div className="h-full bg-black text-white flex flex-col items-center justify-center relative overflow-hidden p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />
                <div className="z-10 text-center w-full max-w-5xl animate-in slide-in-from-bottom-12 duration-1000">
                    <Trophy size={100} className="text-yellow-400 mx-auto mb-8 animate-bounce-slow drop-shadow-[0_0_50px_rgba(250,204,21,0.5)]" />
                    <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-4 italic">Protocol Over</h1>
                    <p className="text-indigo-400 font-black uppercase tracking-[0.6em] mb-20 text-sm">Final Fleet Rankings</p>

                    <div className="flex justify-center items-end gap-2 md:gap-6 mb-20 h-72 border-b-2 border-slate-900 pb-0">
                        {sortedScores[1] && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-20 duration-1000 delay-300 w-1/3 max-w-[180px]">
                                <div className="text-xl font-black mb-6 text-slate-400 truncate w-full text-center">{sortedScores[1].name}</div>
                                <div className="w-full h-40 bg-slate-900/80 border-t-4 border-slate-500 rounded-t-3xl flex flex-col items-center justify-start pt-10 shadow-2xl backdrop-blur-md">
                                    <div className="absolute -top-6 w-12 h-12 bg-slate-400 text-black rounded-full flex items-center justify-center font-black text-xl border-4 border-black">2</div>
                                    <span className="font-black text-3xl">{Number(sortedScores[1].score).toLocaleString()}</span>
                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest mt-1">XP</span>
                                </div>
                            </div>
                        )}
                        {sortedScores[0] && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-24 duration-1000 delay-500 w-1/3 max-w-[220px] relative z-20">
                                <Crown size={48} className="text-yellow-400 mb-2 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                                <div className="text-3xl font-black mb-8 text-yellow-400 truncate w-full text-center">{sortedScores[0].name}</div>
                                <div className="w-full h-56 bg-slate-900/90 border-t-4 border-yellow-500 rounded-t-[3rem] flex flex-col items-center justify-start pt-12 shadow-[0_-20px_80px_rgba(250,204,21,0.15)] backdrop-blur-xl">
                                    <div className="absolute -top-10 w-20 h-20 bg-yellow-400 text-black rounded-full flex items-center justify-center font-black text-4xl border-8 border-black">1</div>
                                    <span className="font-black text-5xl">{Number(sortedScores[0].score).toLocaleString()}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">XP</span>
                                </div>
                            </div>
                        )}
                        {sortedScores[2] && (
                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-20 duration-1000 delay-100 w-1/3 max-w-[180px]">
                                <div className="text-xl font-black mb-6 text-amber-700 truncate w-full text-center">{sortedScores[2].name}</div>
                                <div className="w-full h-32 bg-slate-900/80 border-t-4 border-amber-800 rounded-t-3xl flex flex-col items-center justify-start pt-10 shadow-2xl backdrop-blur-md">
                                    <div className="absolute -top-6 w-12 h-12 bg-amber-800 text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-black">3</div>
                                    <span className="font-black text-3xl">{Number(sortedScores[2].score).toLocaleString()}</span>
                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest mt-1">XP</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={onExit} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                        Close Session
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: LOBBY
    // ========================================================================
    if (!liveState?.quizState || liveState?.quizState === 'waiting') {
        const joinedStudents = liveState?.joined || {};
        const joinedCount = Object.keys(joinedStudents).length;

        return (
            <div className="h-full bg-black text-white flex flex-col relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-black to-black pointer-events-none" />
                
                <header className="flex items-center justify-between z-20 p-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-pulse"><Zap size={32} fill="white" /></div>
                        <div>
                            <h3 className="font-black text-3xl uppercase tracking-tighter">{deck.title || 'Magister Deck'}</h3>
                            <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                                <Shield size={12} /> {activeClass?.name || 'Fleet'} Protocol
                            </p>
                        </div>
                    </div>
                    <div className="flex bg-slate-900/50 border border-slate-800 p-2 rounded-3xl gap-2 items-center px-6 backdrop-blur-md">
                        <Settings size={18} className="text-slate-500 mr-3" />
                        {[10, 15, 30].map(t => (
                            <button key={t} onClick={() => setGameSettings(s => ({...s, qTime: t}))} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition-all ${gameSettings.qTime === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{t}s</button>
                        ))}
                    </div>
                </header>

                <main className="flex-1 grid grid-cols-12 gap-8 px-10 pb-10 z-10 overflow-hidden">
                    {/* LEFT: Fleet Manifest */}
                    <div className="col-span-8 bg-slate-900/30 border-2 border-slate-800/50 rounded-[3.5rem] flex flex-col backdrop-blur-xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
                        <div className="p-10 flex items-center justify-between border-b border-slate-800/50 shrink-0">
                            <div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter italic">Arena Lobby</h1>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Awaiting Fleet Connections</p>
                            </div>
                            <div className="bg-indigo-600/10 border border-indigo-500/30 px-8 py-4 rounded-[2rem] text-center">
                                <span className="block text-4xl font-black text-indigo-400 leading-none">{joinedCount}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500/60">Scholars Joined</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-8 items-start">
                            {activeClass?.students?.map((s: any, i: number) => {
                                const isConnected = !!joinedStudents[s.email.replace(/\./g, ',')];
                                return (
                                    <div key={i} className={`flex flex-col items-center gap-3 transition-all duration-700 ${isConnected ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}`}>
                                        <div className={`w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center text-3xl font-black transition-all ${isConnected ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(79,70,22,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                            {(s.name?.[0] || s.email[0]).toUpperCase()}
                                        </div>
                                        <span className="text-[10px] font-black uppercase truncate w-20 text-center text-slate-400">{s.name || s.email.split('@')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Launch Controls */}
                    <div className="col-span-4 flex flex-col gap-6">
                        <div className="flex-1 bg-gradient-to-br from-slate-900 to-black border-2 border-slate-800 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            <Target size={80} className="text-indigo-500/20 mb-8" />
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-10 text-slate-400">Launch Protocol</h2>
                            <button onClick={() => startRun(true)} className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-2xl uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] flex items-center justify-center gap-4 mb-4">
                                <Zap size={28} fill="black" /> Auto-Pilot
                            </button>
                            <button onClick={() => startRun(false)} className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-slate-700 transition-colors border-2 border-slate-700 flex items-center justify-center gap-3 active:scale-95">
                                <Hand size={20} /> Manual Start
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ========================================================================
    //  RENDER: ACTIVE ARENA (The Bento Grid)
    // ========================================================================
    const answers = liveState?.answers || {};
    const answerCount = Object.keys(answers).length;
    const joinedStudents = liveState?.joined || {};
    const joinedCount = Math.max(1, Object.keys(joinedStudents).length);
    const progressPct = (answerCount / joinedCount) * 100;
    const currentQ = quizQuestions[currentIndex];

    return (
        <div className="h-full bg-black text-white font-sans flex flex-col overflow-hidden relative">
            {/* Holographic Overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900 z-50">
                <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / (liveState?.quizState === 'revealed' ? gameSettings.rTime : gameSettings.qTime)) * 100}%` }} />
            </div>

            {/* MAIN BENTO GRID */}
            <main className="flex-1 grid grid-cols-12 gap-6 p-8 relative z-10 overflow-hidden">
                
                {/* 1. LEFT RAIL: Fleet Status (Radar) */}
                <div className="col-span-3 bg-slate-900/40 border-2 border-slate-800/60 rounded-[3rem] p-8 flex flex-col backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8 opacity-50">
                        <Activity size={18} className="text-indigo-400" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Fleet Manifest</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {activeClass?.students?.map((s: any, i: number) => {
                            const safeEmail = s.email.replace(/\./g, ',');
                            const hasJoined = !!joinedStudents[safeEmail];
                            const hasAnswered = !!answers[safeEmail];
                            if (!hasJoined) return null;

                            return (
                                <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${hasAnswered ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/30 border-slate-800'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${hasAnswered ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                        {(s.name?.[0] || s.email[0]).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-black uppercase truncate ${hasAnswered ? 'text-emerald-400' : 'text-slate-400'}`}>{s.name || s.email.split('@')[0]}</p>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{hasAnswered ? 'Signal Received' : 'Awaiting...'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. CENTER STAGE: The Forge */}
                <div className="col-span-6 flex flex-col gap-6">
                    <div className="flex-1 bg-slate-900/20 border-2 border-slate-800/40 rounded-[4rem] p-12 flex flex-col items-center justify-center text-center relative shadow-2xl backdrop-blur-sm">
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">Target {currentIndex + 1} / {quizQuestions.length}</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">{currentQ.question}</h2>
                            {currentQ.ipa && <p className="text-2xl font-mono text-indigo-400 opacity-60 tracking-widest">{currentQ.ipa}</p>}
                        </div>

                        {liveState?.quizState === 'active' && (
                            <div className="mt-16 w-full max-w-md animate-in fade-in duration-700">
                                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                    <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                                </div>
                                <div className="flex justify-between mt-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{answerCount} Responses</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{Math.round(progressPct)}% Sync</span>
                                </div>
                                {!isAutoPilot && (
                                    <button onClick={handleReveal} className="mt-12 bg-white text-black px-12 py-5 rounded-full font-black text-xl uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-xl">
                                        Reveal Protocol
                                    </button>
                                )}
                            </div>
                        )}

                        {liveState?.quizState === 'revealed' && (
                            <div className="mt-16 animate-in zoom-in-95 duration-500">
                                <div className="bg-emerald-500 text-white px-16 py-8 rounded-[2.5rem] text-5xl font-black border-4 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                                    {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                                </div>
                                {!isAutoPilot && (
                                    <button onClick={handleNext} className="mt-12 flex items-center gap-4 text-slate-500 hover:text-white font-black text-xl uppercase tracking-widest transition-all mx-auto">
                                        {currentIndex < quizQuestions.length - 1 ? 'Next Target' : 'Final Rankings'} <ArrowRight />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. RIGHT RAIL: Live Pulse (XP Feed) */}
                <div className="col-span-3 bg-slate-900/40 border-2 border-slate-800/60 rounded-[3rem] p-8 flex flex-col backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8 opacity-50">
                        <Flame size={18} className="text-orange-500" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Live XP Pulse</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {roundScores.length > 0 ? roundScores.map((log: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-800 rounded-2xl animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <span className="text-[11px] font-black uppercase text-slate-300">{log.name}</span>
                                <span className="text-[10px] font-black text-emerald-400">+{log.points} XP</span>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                <Zap size={32} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Scores</p>
                            </div>
                        )}
                    </div>
                    {/* Visual Timer at bottom of Pulse */}
                    {isAutoPilot && (
                        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                            <div className={`text-5xl font-black tabular-nums transition-all ${timeLeft <= 5 && liveState?.quizState !== 'revealed' ? 'text-rose-500 animate-pulse scale-110' : 'text-slate-700'}`}>
                                {timeLeft}s
                            </div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{liveState?.quizState === 'revealed' ? 'Next Round' : 'Remaining'}</span>
                        </div>
                    )}
                </div>
            </main>

            <button onClick={onExit} className="absolute top-10 right-10 text-slate-700 hover:text-rose-500 transition-colors z-50">
                <X size={32} />
            </button>
        </div>
    );
}
